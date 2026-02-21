from fastapi import FastAPI, Request, HTTPException
import json
import os
import re
from typing import Dict, Any, Optional, List, Tuple
from datetime import date, datetime, timedelta

import httpx
from sqlmodel import create_engine, Session, SQLModel, text as sql_text, select

from app.models import Recipe, AppState

from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from uuid import UUID

app = FastAPI(
    docs_url="/api/docs",
    openapi_url="/api/openapi.json",
    redoc_url=None,
)

# CORS (Frontend -> Backend)
allowed = os.getenv("CORS_ORIGINS", "*")
origins = [o.strip() for o in allowed.split(",") if o.strip()]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins if origins else ["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# -----------------------------
# Database setup
# -----------------------------
DATABASE_URL = os.getenv("DATABASE_URL", "").strip()
engine = create_engine(DATABASE_URL, pool_pre_ping=True) if DATABASE_URL else None

AUTO_MIGRATE = os.getenv("AUTO_MIGRATE", "0").strip() == "1"
if engine and AUTO_MIGRATE:
    from app import models  # noqa: F401  (ensures all tables are registered)
    SQLModel.metadata.create_all(engine)

GIT_SHA = os.getenv("GIT_SHA", "local").strip() or "local"

DAY_LABELS = {
    1: "Mo",
    2: "Di",
    3: "Mi",
    4: "Do",
    5: "Fr",
    6: "Sa",
    7: "So",
}
DAY_ALIASES = {
    "mo": 1, "montag": 1,
    "di": 2, "dienstag": 2,
    "mi": 3, "mittwoch": 3,
    "do": 4, "donnerstag": 4,
    "fr": 5, "freitag": 5,
    "sa": 6, "samstag": 6,
    "so": 7, "sonntag": 7,
}


#-----------------------------
# Start Up
#-----------------------------
@app.on_event("startup")
def _on_startup():
    try:
        _db_set_scheduler_heartbeat()
    except Exception:
        pass

# -----------------------------
# Health endpoints
# -----------------------------
@app.get("/api/health")
def health():
    return {"status": "ok", "git_sha": GIT_SHA}


@app.get("/api/db/ping")
def db_ping():
    if engine is None:
        return {"ok": False, "error": "DATABASE_URL missing"}
    with engine.connect() as conn:
        val = conn.execute(sql_text("select 1")).scalar_one()
    return {"ok": True, "result": val}

@app.get("/api/bot/status")
def bot_status():
    """
    Lightweight bot check: verifies the Telegram webhook route exists in this app.
    Does NOT call Telegram externally.
    """
    return {"ok": True, "kind": "telegram-webhook-present"}


@app.get("/api/ai/status")
def ai_status():
    """
    Only checks whether an AI key env var is present.
    No external call.
    """
    import os
    has_openai = bool(os.getenv("OPENAI_API_KEY"))
    has_anthropic = bool(os.getenv("ANTHROPIC_API_KEY"))
    return {"ok": (has_openai or has_anthropic), "openai": has_openai, "anthropic": has_anthropic}


@app.get("/api/jobs/status")
def jobs_status():
    """
    Scheduler health: checks if we have a recent heartbeat stored in DB.
    We keep it simple: a table 'app_state' key='scheduler_last_run' with ISO timestamp.
    ok=True if last run is within 8 days.
    """
    if engine is None:
        return {"ok": False, "error": "DATABASE_URL missing"}

    from datetime import datetime, timezone, timedelta
    from sqlalchemy import text

    with engine.connect() as conn:
        conn.execute(
            text(
                """
                create table if not exists public.app_state (
                  key text primary key,
                  value text not null,
                  updated_at timestamptz not null default now()
                )
                """
            )
        )
        conn.commit()

        row = conn.execute(
            text("select value, updated_at from public.app_state where key='scheduler_last_run'")
        ).fetchone()

    if not row:
        return {"ok": False, "last_run": None, "hint": "No scheduler heartbeat yet"}

    value, updated_at = row[0], row[1]

    # updated_at comes as datetime
    now = datetime.now(timezone.utc)
    ok = (updated_at is not None) and (updated_at >= (now - timedelta(days=8)))
    return {"ok": bool(ok), "last_run": value, "updated_at": updated_at.isoformat()}


@app.get("/api/recipes")
def api_list_recipes(limit: int = 50, q: Optional[str] = None):
    if engine is None:
        raise HTTPException(500, "DATABASE_URL missing")
    with Session(engine) as session:
        stmt = select(Recipe).where(Recipe.is_active == True)  # noqa: E712
        if q:
            # simple title search
            stmt = stmt.where(Recipe.title.ilike(f"%{q}%"))
        stmt = stmt.order_by(Recipe.created_at.desc()).limit(limit)
        items = list(session.exec(stmt))
        return items

class RecipeCreate(BaseModel):
    title: str
    source_url: Optional[str] = None
    notes: Optional[str] = None
    tags: List[str] = []
    ingredients: List[str] = []
    time_minutes: Optional[int] = None
    difficulty: Optional[int] = None

class RecipeUpdate(BaseModel):
    title: Optional[str] = None
    source_url: Optional[str] = None
    notes: Optional[str] = None
    tags: Optional[List[str]] = None
    ingredients: Optional[List[str]] = None
    time_minutes: Optional[int] = None
    difficulty: Optional[int] = None
    is_active: Optional[bool] = None


@app.get("/api/recipes/{recipe_id}")
def api_get_recipe(recipe_id: UUID):
    if engine is None:
        raise HTTPException(500, "DATABASE_URL missing")
    with Session(engine) as session:
        r = session.get(Recipe, recipe_id)
        if not r:
            raise HTTPException(404, "Not found")
        return r


@app.post("/api/recipes")
def api_create_recipe(payload: RecipeCreate):
    if engine is None:
        raise HTTPException(500, "DATABASE_URL missing")
    r = Recipe(
        title=payload.title,
        source_url=payload.source_url,
        notes=payload.notes,
        tags=payload.tags or [],
        ingredients=payload.ingredients or [],
        time_minutes=payload.time_minutes,
        difficulty=payload.difficulty,
        created_by="dennis",
    )
    with Session(engine) as session:
        session.add(r)
        session.commit()
        session.refresh(r)
        return r


@app.patch("/api/recipes/{recipe_id}")
def api_update_recipe(recipe_id: UUID, payload: RecipeUpdate):
    if engine is None:
        raise HTTPException(500, "DATABASE_URL missing")
    with Session(engine) as session:
        r = session.get(Recipe, recipe_id)
        if not r:
            raise HTTPException(404, "Not found")

        data = payload.model_dump(exclude_unset=True)
        for k, v in data.items():
            setattr(r, k, v)

        session.add(r)
        session.commit()
        session.refresh(r)
        return r


@app.delete("/api/recipes/{recipe_id}")
def api_delete_recipe(recipe_id: UUID):
    # MVP: soft delete
    if engine is None:
        raise HTTPException(500, "DATABASE_URL missing")
    with Session(engine) as session:
        r = session.get(Recipe, recipe_id)
        if not r:
            raise HTTPException(404, "Not found")
        r.is_active = False
        session.add(r)
        session.commit()
        return {"ok": True}




# -----------------------------
# Telegram helpers
# -----------------------------
def _is_allowed(from_id: int) -> bool:
    allowlist = os.getenv("TELEGRAM_ALLOWLIST", "").strip()
    if not allowlist:
        return True
    allowed_ids = {x.strip() for x in allowlist.split(",") if x.strip()}
    return str(from_id) in allowed_ids


async def _tg_send(chat_id: int, text_msg: str) -> None:
    token = os.getenv("TELEGRAM_BOT_TOKEN")
    if not token:
        print("TELEGRAM_BOT_TOKEN missing", flush=True)
        return

    url = f"https://api.telegram.org/bot{token}/sendMessage"
    try:
        async with httpx.AsyncClient(timeout=20) as client:
            r = await client.post(url, json={"chat_id": chat_id, "text": text_msg})
            if r.status_code != 200:
                print(f"Telegram send failed: {r.status_code} {r.text}", flush=True)
    except Exception as e:
        print(f"Telegram send exception: {e}", flush=True)


# -----------------------------
# Date helpers
# -----------------------------
def _week_start_monday(d: date) -> date:
    # Monday = 0
    return d - timedelta(days=d.weekday())


# -----------------------------
# Schedule Heart Beat
#-----------------------------

def _db_set_scheduler_heartbeat():
    if engine is None:
        return
    from datetime import datetime, timezone
    from sqlalchemy import text

    ts = datetime.now(timezone.utc).isoformat()
    with engine.connect() as conn:
        conn.execute(
            text(
                """
                insert into public.app_state (key, value)
                values ('scheduler_last_run', :v)
                on conflict (key) do update set value = excluded.value, updated_at = now()
                """
            ),
            {"v": ts},
        )
        conn.commit()


# -----------------------------
# Recipe helpers
# -----------------------------
def _parse_add(message_text: str) -> Dict[str, Any]:
    raw = message_text.strip()
    raw = re.sub(r"^add\s+", "", raw, flags=re.IGNORECASE).strip()


    # Pipe-aware parsing: each | chunk stays intact (so "ings=Eier, Tomaten (Dose)" works)
    parts = [p.strip() for p in raw.split("|") if p.strip()]

    kv: Dict[str, str] = {}
    title_parts: List[str] = []
    url: Optional[str] = None

    for p in parts:
        # key=value chunks (keep full value including spaces)
        if "=" in p:
            k, v = p.split("=", 1)
            kv[k.strip().lower()] = v.strip()
            continue

        # URL chunk
        if p.startswith("http://") or p.startswith("https://"):
            url = p
            continue

        # Otherwise title chunk
        title_parts.append(p)

    title = " ".join(title_parts).strip()
    if not title:
        raise ValueError("title missing (e.g. add Shakshuka | time=25 | diff=2)")

    payload: Dict[str, Any] = {"title": title}
    if url:
        payload["source_url"] = url

    # optional fields
    if "tags" in kv:
        payload["tags"] = [x.strip() for x in kv["tags"].split(",") if x.strip()]

    if "ings" in kv or "ingredients" in kv:
        v = kv.get("ings", kv.get("ingredients", ""))
        payload["ingredients"] = [x.strip() for x in v.split(",") if x.strip()]

    if "time" in kv:
        payload["time_minutes"] = int(kv["time"])

    if "diff" in kv or "difficulty" in kv:
        payload["difficulty"] = int(kv.get("diff", kv.get("difficulty")))

    if "notes" in kv:
        payload["notes"] = kv["notes"]

    return payload

def _db_add_recipe(created_by: str, payload: Dict[str, Any]) -> Recipe:
    if engine is None:
        raise RuntimeError("DATABASE_URL missing")

    recipe = Recipe(
        title=payload["title"],
        source_url=payload.get("source_url"),
        notes=payload.get("notes"),
        tags=payload.get("tags", []),
        time_minutes=payload.get("time_minutes"),
        difficulty=payload.get("difficulty"),
        ingredients=payload.get("ingredients", []),
        created_by=created_by,
    )

    with Session(engine) as session:
        session.add(recipe)
        session.commit()
        session.refresh(recipe)

    return recipe


def _db_list_recipes(limit: int = 10) -> List[Recipe]:
    if engine is None:
        raise RuntimeError("DATABASE_URL missing")
    with Session(engine) as session:
        stmt = (
            select(Recipe)
            .where(Recipe.is_active == True)  # noqa: E712
            .order_by(Recipe.created_at.desc())
            .limit(limit)
        )
        return list(session.exec(stmt))

# -----------------------------
# Weekly plan storage (raw SQL to jsonb tables)
# -----------------------------
def _db_get_weekly_plan(week_start: date) -> Optional[Dict[str, Any]]:
    with engine.connect() as conn:
        row = conn.execute(
            sql_text("select id, week_start_date, days from public.weekly_plans where week_start_date = :ws"),
            {"ws": week_start.isoformat()},
        ).mappings().first()
        return dict(row) if row else None


def _db_upsert_weekly_plan(week_start: date, days: Dict[str, str]) -> None:
    with engine.connect() as conn:
        conn.execute(
            sql_text("""
                insert into public.weekly_plans (week_start_date, days)
                values (:ws, (:days)::jsonb)
                on conflict (week_start_date)
                do update set days = excluded.days, updated_at = now()
            """),
            {"ws": week_start.isoformat(), "days": json.dumps(days)},
        )
        conn.commit()

def _db_create_draft(week_start: date, base_plan_id: Optional[str], proposed_days: Dict[str, str], swaps: List[int]) -> None:
    with engine.connect() as conn:
        conn.execute(
            sql_text("delete from public.weekly_plan_drafts where week_start_date = :ws"),
            {"ws": week_start.isoformat()},
        )
        conn.execute(
            sql_text("""
                insert into public.weekly_plan_drafts
                  (week_start_date, base_plan_id, proposed_days, requested_swaps, created_by)
                values
                  (:ws, :base_plan_id, (:proposed_days)::jsonb, :swaps, :created_by)
            """),
            {
                "ws": week_start.isoformat(),
                "base_plan_id": base_plan_id,  # can be NULL
                "proposed_days": json.dumps(proposed_days),
                "swaps": swaps,
                "created_by": "dennis",
            },
        )
        conn.commit()

def _db_get_draft(week_start: date) -> Optional[Dict[str, Any]]:
    with engine.connect() as conn:
        row = conn.execute(
            sql_text("""
                select id, week_start_date, base_plan_id, proposed_days, requested_swaps
                from public.weekly_plan_drafts
                where week_start_date = :ws
                order by created_at desc
                limit 1
            """),
            {"ws": week_start.isoformat()},
        ).mappings().first()
        return dict(row) if row else None


def _db_delete_draft(week_start: date) -> None:
    with engine.connect() as conn:
        conn.execute(sql_text("delete from public.weekly_plan_drafts where week_start_date = :ws"), {"ws": week_start.isoformat()})
        conn.commit()


# -----------------------------
# Planning logic (MVP simple)
# -----------------------------
def _pick_recipes_for_days(existing_ids: List[str], count: int) -> Tuple[List[str], List[str]]:
    """
    Returns (picked_recipe_ids, dummy_titles_if_missing)
    - Picks from DB first (excluding existing_ids)
    - If insufficient, returns dummy titles for the remaining slots
    """
    picked: List[str] = []
    dummy: List[str] = []

    with Session(engine) as session:
        stmt = (
            select(Recipe)
            .where(Recipe.is_active == True)  # noqa: E712
            .order_by(Recipe.created_at.desc())
        )
        all_recipes = list(session.exec(stmt))

    available = [r for r in all_recipes if str(r.id) not in existing_ids]

    for r in available:
        if len(picked) >= count:
            break
        picked.append(str(r.id))

    while len(picked) + len(dummy) < count:
        dummy.append(f"KI: Neues Rezept {len(dummy)+1}")

    return picked, dummy


def _format_plan(days: Dict[str, str]) -> str:
    lines = ["🗓️ Wochenplan (Mo–So):"]
    for i in range(1, 8):
        rid = days.get(str(i))
        label = DAY_LABELS[i]
        if rid and rid.startswith("KI:"):
            title = rid
        else:
            # resolve title from DB
            title = rid or "—"
            if rid:
                with Session(engine) as session:
                    r = session.get(Recipe, rid)
                    if r:
                        title = r.title
        lines.append(f"{label}: {title}")
    lines.append("\nBefehle: swap 2 5 7  | swap di fr so | confirm | cancel | list")
    return "\n".join(lines)


def _build_new_week_plan() -> Dict[str, str]:
    # pick 7 unique suggestions
    picked_ids, dummy_titles = _pick_recipes_for_days(existing_ids=[], count=7)
    days: Dict[str, str] = {}
    di = 0
    pi = 0
    for d in range(1, 8):
        if pi < len(picked_ids):
            days[str(d)] = picked_ids[pi]
            pi += 1
        else:
            days[str(d)] = dummy_titles[di]
            di += 1
    return days


def _apply_swaps(base_days: Dict[str, str], swap_days: List[int]) -> Dict[str, str]:
    current = dict(base_days)

    # 1) Alles, was schon im Plan drin ist (echte Rezepte), ist "verboten"
    banned_ids = {
        v for v in current.values()
        if v and isinstance(v, str) and not v.startswith("KI:")
    }

    # 2) Für die Swap-Slots löschen wir erst mal die Einträge
    for d in swap_days:
        current[str(d)] = ""

    # 3) Jetzt picken wir neue Rezepte, die NICHT in banned_ids sind
    picked_ids, dummy_titles = _pick_recipes_for_days(existing_ids=list(banned_ids), count=len(swap_days))

    # 4) Und verteilen sie auf die Swap-Tage
    pi = 0
    di = 0
    stamp = datetime.utcnow().strftime("%H%M%S")
    for d in swap_days:
        if pi < len(picked_ids):
            current[str(d)] = picked_ids[pi]
            pi += 1
        else:
            # Dummy muss sichtbar "neu" sein (sonst wirkt's wie nicht getauscht)
            base = dummy_titles[di] if di < len(dummy_titles) else "KI: Neues Rezept"
            current[str(d)] = f"{base} ({stamp}-{d})"
            di += 1

    return current

def _parse_swap_days(cmd: str) -> List[int]:
    # accepts: "swap 2 5 7" or "swap di fr" or "swap 2,5,7"
    raw = re.sub(r"^swap\s+", "", cmd.strip(), flags=re.IGNORECASE).strip()
    raw = raw.replace(",", " ")
    parts = [p.strip().lower() for p in raw.split() if p.strip()]
    if not parts:
        raise ValueError("swap needs days (e.g. swap 2 5 7 or swap di fr so)")

    days: List[int] = []
    for p in parts:
        if p.isdigit():
            n = int(p)
            if n < 1 or n > 7:
                raise ValueError("day numbers must be 1..7")
            days.append(n)
        else:
            if p not in DAY_ALIASES:
                raise ValueError(f"unknown day: {p}")
            days.append(DAY_ALIASES[p])

    # unique, sorted
    return sorted(set(days))


# -----------------------------
# Telegram webhook
# -----------------------------
@app.post("/bot/telegram/webhook")
async def telegram_webhook(request: Request):
    if engine is None:
        raise HTTPException(status_code=500, detail="DATABASE_URL missing")

    payload = await request.json()
    msg = payload.get("message") or payload.get("edited_message")
    if not msg:
        return {"ok": True}

    from_id = (msg.get("from") or {}).get("id")
    chat_id = (msg.get("chat") or {}).get("id")
    message_text = msg.get("text", "") or ""

    print("TELEGRAM UPDATE:\n" + json.dumps(payload, ensure_ascii=False, indent=2), flush=True)

    if from_id is None or chat_id is None:
        return {"ok": True}

    if not _is_allowed(int(from_id)):
        raise HTTPException(status_code=403, detail="Not allowed")

    cmd = message_text.strip()
    today = date.today()
    week_start = _week_start_monday(today)

    # --- add ---
    if cmd.lower().startswith("add "):
        try:
            payload2 = _parse_add(cmd)
            recipe = _db_add_recipe("dennis", payload2)
            await _tg_send(chat_id, f"✅ Gespeichert: {recipe.title}")
        except Exception as e:
            await _tg_send(
                chat_id,
                "❌ Konnte nicht speichern: "
                + str(e)
                + "\nBeispiel:\nadd Spaghetti Carbonara | tags=pasta,italien | time=15 | diff=1"
            )
        return {"ok": True}

    # --- list ---
    if cmd.lower() == "list":
        try:
            items = _db_list_recipes(limit=10)
            if not items:
                await _tg_send(chat_id, "Noch keine Rezepte gespeichert. Beispiel:\nadd Spaghetti Carbonara | time=15 | diff=1")
            else:
                lines = []
                for i, r in enumerate(items, start=1):
                    meta = []
                    if r.time_minutes:
                        meta.append(f"{r.time_minutes}min")
                    if r.difficulty:
                        meta.append(f"diff {r.difficulty}")
                    if r.tags:
                        meta.append(",".join(r.tags))
                    suffix = f" ({' · '.join(meta)})" if meta else ""
                    lines.append(f"{i}) {r.title}{suffix}")
                await _tg_send(chat_id, "📚 Letzte Rezepte:\n" + "\n".join(lines))
        except Exception as e:
            await _tg_send(chat_id, f"❌ Fehler bei list: {e}")
        return {"ok": True}

    #--- shop ---
    if cmd.lower() in {"shop", "einkauf"}:
        base = _db_get_weekly_plan(week_start)
        if not base:
            await _tg_send(chat_id, "Kein Plan vorhanden. Erst `plan` ausführen.")
            return {"ok": True}

        days = base["days"]

        pantry = {
            "salz","pfeffer","olivenöl","rapsöl","butter","mehl","zucker",
            "reis","pasta","sojasauce","essig","erdnussöl","knoblauch"
        }

        items: Dict[str, int] = {}

        with Session(engine) as session:
            for d in range(1, 8):
                rid = days.get(str(d))
                if not rid or (isinstance(rid, str) and rid.startswith("KI:")):
                    continue
                r = session.get(Recipe, rid)
                if not r:
                    continue
                for ing in (r.ingredients or []):
                    key = ing.strip()
                    if not key:
                        continue
                    if key.lower() in pantry:
                        continue
                    items[key] = items.get(key, 0) + 1

        if not items:
            await _tg_send(chat_id, "🧺 Einkaufsliste ist leer (oder alle Zutaten sind Pantry).")
            return {"ok": True}

        lines = ["🧺 Einkaufsliste (aggregiert):"]
        for k in sorted(items.keys(), key=lambda s: s.lower()):
            cnt = items[k]
            lines.append(f"- {k}" + (f"  x{cnt}" if cnt > 1 else ""))

        await _tg_send(chat_id, "\n".join(lines))
        return {"ok": True}



    # --- plan ---
    if cmd.lower() == "plan":
        # build or overwrite plan for current week
        days = _build_new_week_plan()
        _db_upsert_weekly_plan(week_start, days)
        await _tg_send(chat_id, _format_plan(days))
        return {"ok": True}

    # --- swap ---
    if cmd.lower().startswith("swap"):
        try:
            swap_days = _parse_swap_days(cmd)

            base = _db_get_weekly_plan(week_start)
            if not base:
                await _tg_send(chat_id, "Kein Plan vorhanden. Erst `plan` ausführen.")
                return {"ok": True}

            base_days = base["days"]
            base_plan_id = base["id"]

            proposed = _apply_swaps(base_days, swap_days)
            _db_create_draft(week_start, str(base_plan_id), proposed, swap_days)

            # show only changed days + full preview
            await _tg_send(chat_id, "🔁 Vorschau (noch NICHT übernommen). Nutze `confirm` oder `cancel`.\n\n" + _format_plan(proposed))
        except Exception as e:
            await _tg_send(chat_id, f"❌ swap Fehler: {e}\nBeispiel: swap 2 5 7 oder swap di fr so")
        return {"ok": True}

    # --- confirm ---
    if cmd.lower() == "confirm":
        d = _db_get_draft(week_start)
        if not d:
            await _tg_send(chat_id, "Kein Draft vorhanden. Nutze erst `swap ...`.")
            return {"ok": True}

        proposed = d["proposed_days"]
        _db_upsert_weekly_plan(week_start, proposed)
        _db_delete_draft(week_start)
        await _tg_send(chat_id, "✅ Übernommen.\n\n" + _format_plan(proposed))
        return {"ok": True}

    # --- cancel ---
    if cmd.lower() == "cancel":
        _db_delete_draft(week_start)
        await _tg_send(chat_id, "🗑️ Draft verworfen.")
        return {"ok": True}

    # default
    print(f"ALLOWED USER {from_id} SENT: {message_text}", flush=True)
    await _tg_send(chat_id, "Unbekannter Befehl. Nutze: add | list | plan | swap | confirm | cancel")
    return {"ok": True}
