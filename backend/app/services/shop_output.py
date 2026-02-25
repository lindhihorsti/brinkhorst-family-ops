from typing import Dict, Any, Optional, List, Tuple
import re
import html

from sqlmodel import Session

from app.models import Recipe
from app.services.shop_ai import transform_shop_list


SHOP_OUTPUT_AI = "ai_consolidated"
SHOP_OUTPUT_PER_RECIPE = "per_recipe"
SHOP_OUTPUT_MODES = {SHOP_OUTPUT_AI, SHOP_OUTPUT_PER_RECIPE}

PUNCT_RE = re.compile(r"[.,;:!?()\[\]{}\"'`´/\\|]+")


def normalize_ingredient(value: str) -> str:
    if not value:
        return ""
    s = value.strip().lower()
    s = PUNCT_RE.sub(" ", s)
    s = re.sub(r"\s+", " ", s).strip()
    if not s:
        return ""
    if " " not in s:
        if s.endswith("en") and len(s) > 4:
            s = s[:-2]
        elif s.endswith("e") and len(s) > 3:
            s = s[:-1]
    return s


def clean_display_name(value: str) -> str:
    s = value.strip()
    s = re.sub(r"\s+", " ", s)
    return s


def build_pantry_alias_map(items: List[Dict[str, Any]]) -> Dict[str, Dict[str, Any]]:
    alias_map: Dict[str, Dict[str, Any]] = {}
    for item in items:
        name = item.get("name", "")
        uncertain = bool(item.get("uncertain"))
        aliases = item.get("aliases") or []
        candidates = [name] + list(aliases)
        for cand in candidates:
            norm = normalize_ingredient(str(cand))
            if not norm:
                continue
            if norm not in alias_map:
                alias_map[norm] = {"name": name, "uncertain": uncertain}
    return alias_map


def _to_list(counts: Dict[str, int], display_map: Optional[Dict[str, str]] = None) -> List[Dict[str, Any]]:
    if display_map is None:
        items = [{"name": k, "count": v} for k, v in counts.items()]
    else:
        items = [{"name": display_map[k], "count": v} for k, v in counts.items()]
    return sorted(items, key=lambda x: x["name"].lower())


def aggregate_shop_items(
    days: Dict[str, str],
    engine: Any,
    pantry_items: List[Dict[str, Any]],
) -> Dict[str, Any]:
    pantry_map = build_pantry_alias_map(pantry_items)

    buy_counts: Dict[str, int] = {}
    buy_display: Dict[str, str] = {}
    buy_lines: List[str] = []
    pantry_used_counts: Dict[str, int] = {}
    pantry_uncertain_counts: Dict[str, int] = {}

    with Session(engine) as session:
        for d in range(1, 8):
            rid = days.get(str(d))
            if not rid or (isinstance(rid, str) and rid.startswith("KI:")):
                continue
            r = session.get(Recipe, rid)
            if not r:
                continue
            for ing in (r.ingredients or []):
                raw = (ing or "").strip()
                if not raw:
                    continue
                norm = normalize_ingredient(raw)
                if not norm:
                    continue
                pantry_entry = pantry_map.get(norm)
                if pantry_entry:
                    key = pantry_entry["name"]
                    if pantry_entry.get("uncertain"):
                        pantry_uncertain_counts[key] = pantry_uncertain_counts.get(key, 0) + 1
                    else:
                        pantry_used_counts[key] = pantry_used_counts.get(key, 0) + 1
                    continue

                display = clean_display_name(raw)
                buy_lines.append(display)
                if norm not in buy_display:
                    buy_display[norm] = display
                buy_counts[norm] = buy_counts.get(norm, 0) + 1

    buy_list = _to_list(buy_counts, buy_display)
    pantry_used_list = _to_list(pantry_used_counts)
    pantry_uncertain_list = _to_list(pantry_uncertain_counts)

    message_lines: List[str] = []
    if not buy_list:
        message_lines.append("🧺 Einkaufsliste ist leer (oder alle Zutaten sind Pantry).")
    else:
        message_lines.append("🧺 Einkaufsliste (aggregiert):")
        for item in buy_list:
            cnt = item["count"]
            message_lines.append(f"- {item['name']}" + (f"  x{cnt}" if cnt > 1 else ""))

    if pantry_used_list:
        message_lines.append("")
        message_lines.append("Pantry verwendet:")
        for item in pantry_used_list:
            cnt = item["count"]
            message_lines.append(f"- {item['name']}" + (f"  x{cnt}" if cnt > 1 else ""))

    if pantry_uncertain_list:
        message_lines.append("")
        message_lines.append("Pantry unsicher:")
        for item in pantry_uncertain_list:
            cnt = item["count"]
            message_lines.append(f"- {item['name']}" + (f"  x{cnt}" if cnt > 1 else ""))

    return {
        "buy": buy_list,
        "buy_lines": buy_lines,
        "pantry_used": pantry_used_list,
        "pantry_uncertain_used": pantry_uncertain_list,
        "message": "\n".join(message_lines),
    }


def format_shop_message(
    buy_lines: List[str],
    pantry_used_list: List[Dict[str, Any]],
    pantry_uncertain_list: List[Dict[str, Any]],
    note: Optional[str] = None,
) -> str:
    message_lines: List[str] = []
    if not buy_lines:
        message_lines.append("🧺 Einkaufsliste ist leer (oder alle Zutaten sind Pantry).")
    else:
        message_lines.append("🧺 Einkaufsliste:")
        for line in buy_lines:
            message_lines.append(f"- {line}")

    if pantry_used_list:
        message_lines.append("")
        message_lines.append("Pantry verwendet:")
        for item in pantry_used_list:
            cnt = item["count"]
            message_lines.append(f"- {item['name']}" + (f"  x{cnt}" if cnt > 1 else ""))

    if pantry_uncertain_list:
        message_lines.append("")
        message_lines.append("Pantry unsicher:")
        for item in pantry_uncertain_list:
            cnt = item["count"]
            message_lines.append(f"- {item['name']}" + (f"  x{cnt}" if cnt > 1 else ""))

    if note:
        message_lines.append("")
        message_lines.append(note)

    return "\n".join(message_lines)


def build_consolidated_output(
    days: Dict[str, str],
    engine: Any,
    pantry_items: List[Dict[str, Any]],
) -> Dict[str, Any]:
    aggregated = aggregate_shop_items(days, engine, pantry_items)
    buy_lines = aggregated.get("buy_lines") or []
    ai_lines, ai_note = transform_shop_list(buy_lines, locale="de")

    warning = None
    ai_applied = False
    if ai_lines is not None:
        ai_applied = True
        buy_items = [{"name": line, "count": 1} for line in ai_lines]
        message = format_shop_message(
            ai_lines,
            aggregated["pantry_used"],
            aggregated["pantry_uncertain_used"],
        )
    else:
        buy_items = aggregated["buy"]
        message = aggregated["message"]
        if ai_note:
            warning = ai_note
            message = f"{message}\n\n{ai_note}"

    return {
        "mode": SHOP_OUTPUT_AI,
        "buy": buy_items,
        "pantry_used": aggregated["pantry_used"],
        "pantry_uncertain_used": aggregated["pantry_uncertain_used"],
        "message": message,
        "warning": warning,
        "ai_applied": ai_applied,
    }


def build_per_recipe_output(
    days: Dict[str, str],
    engine: Any,
    pantry_items: List[Dict[str, Any]],
) -> Dict[str, Any]:
    pantry_map = build_pantry_alias_map(pantry_items)

    per_recipe: List[Dict[str, Any]] = []
    pantry_used_counts: Dict[str, int] = {}
    pantry_uncertain_counts: Dict[str, int] = {}

    with Session(engine) as session:
        for d in range(1, 8):
            rid = days.get(str(d))
            if not rid or (isinstance(rid, str) and rid.startswith("KI:")):
                continue
            r = session.get(Recipe, rid)
            if not r:
                continue
            ingredients: List[str] = []
            for ing in (r.ingredients or []):
                raw = (ing or "").strip()
                if not raw:
                    continue
                norm = normalize_ingredient(raw)
                if not norm:
                    continue
                pantry_entry = pantry_map.get(norm)
                if pantry_entry:
                    key = pantry_entry["name"]
                    if pantry_entry.get("uncertain"):
                        pantry_uncertain_counts[key] = pantry_uncertain_counts.get(key, 0) + 1
                    else:
                        pantry_used_counts[key] = pantry_used_counts.get(key, 0) + 1
                    continue
                ingredients.append(clean_display_name(raw))
            per_recipe.append({"title": r.title, "ingredients": ingredients})

    pantry_used_list = _to_list(pantry_used_counts)
    pantry_uncertain_list = _to_list(pantry_uncertain_counts)

    message_lines: List[str] = ["🧾 Einkaufsliste (Pro Rezept)"]
    telegram_lines: List[str] = ["🧾 Einkaufsliste (Pro Rezept)"]
    if not per_recipe:
        message_lines.append("Keine Zutaten (oder alle Zutaten sind Pantry).")
        telegram_lines.append("Keine Zutaten (oder alle Zutaten sind Pantry).")
    else:
        for recipe in per_recipe:
            message_lines.append(f"**{recipe['title']}**")
            telegram_lines.append(f"<b>{html.escape(recipe['title'])}</b>")
            if recipe["ingredients"]:
                for ing in recipe["ingredients"]:
                    message_lines.append(f"- {ing}")
                    telegram_lines.append(f"- {html.escape(ing)}")
            else:
                message_lines.append("- (nur Pantry)")
                telegram_lines.append("- (nur Pantry)")
            message_lines.append("")
            telegram_lines.append("")

    if pantry_used_list:
        message_lines.append("")
        message_lines.append("Pantry verwendet:")
        for item in pantry_used_list:
            cnt = item["count"]
            message_lines.append(f"- {item['name']}" + (f"  x{cnt}" if cnt > 1 else ""))

    if pantry_uncertain_list:
        message_lines.append("")
        message_lines.append("Pantry unsicher:")
        for item in pantry_uncertain_list:
            cnt = item["count"]
            message_lines.append(f"- {item['name']}" + (f"  x{cnt}" if cnt > 1 else ""))

    return {
        "mode": SHOP_OUTPUT_PER_RECIPE,
        "buy": [],
        "per_recipe": per_recipe,
        "pantry_used": pantry_used_list,
        "pantry_uncertain_used": pantry_uncertain_list,
        "message": "\n".join(message_lines),
        "telegram_message": "\n".join(telegram_lines).strip(),
        "telegram_parse_mode": "HTML",
        "warning": None,
        "ai_applied": False,
    }


def build_shop_payload(
    mode: Optional[str],
    days: Dict[str, str],
    engine: Any,
    pantry_items: List[Dict[str, Any]],
) -> Dict[str, Any]:
    if mode == SHOP_OUTPUT_PER_RECIPE:
        return build_per_recipe_output(days, engine, pantry_items)
    return build_consolidated_output(days, engine, pantry_items)
