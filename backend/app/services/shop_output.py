from collections import Counter, defaultdict
from typing import Any, Dict, List, Optional, Tuple
import html
import re
import unicodedata

from sqlmodel import Session, select

from app.models import Recipe
from app.services.shop_ai import prepare_shop_lines_for_snapshot, transform_shop_list


SHOP_OUTPUT_AI = "ai_consolidated"
SHOP_OUTPUT_PER_RECIPE = "per_recipe"
SHOP_OUTPUT_MODES = {SHOP_OUTPUT_AI, SHOP_OUTPUT_PER_RECIPE}

PUNCT_RE = re.compile(r"[.,;:!?()\[\]{}\"'`´/\\|]+")
PANTRY_STOPWORDS = {
    "frisch", "frische", "frischer", "frischen", "rote", "roten", "rot", "gelbe", "gelben",
    "weisse", "weissen", "weiß", "weiss", "klein", "kleine", "kleinen", "gross", "große",
    "grosse", "großen", "halb", "halbe", "fein", "feine", "fein", "gehackt", "gewurfelt",
    "geschnitten", "gerieben", "getrocknet", "optional",
}


def _strip_accents(value: str) -> str:
    return "".join(ch for ch in unicodedata.normalize("NFKD", value) if not unicodedata.combining(ch))


def normalize_ingredient(value: str) -> str:
    if not value:
        return ""
    s = _strip_accents(value.strip().lower())
    s = PUNCT_RE.sub(" ", s)
    s = s.replace("-", " ")
    s = re.sub(r"\s+", " ", s).strip()
    if not s:
        return ""

    words: List[str] = []
    for raw_word in s.split():
        word = raw_word
        if len(word) > 4 and word.endswith("en"):
            word = word[:-2]
        elif len(word) > 4 and word.endswith("er"):
            word = word[:-2]
        elif len(word) > 3 and word.endswith("e"):
            word = word[:-1]
        elif len(word) > 3 and word.endswith("n"):
            word = word[:-1]
        words.append(word)
    return " ".join(word for word in words if word)


def ingredient_tokens(value: str) -> List[str]:
    tokens = [token for token in normalize_ingredient(value).split() if token and token not in PANTRY_STOPWORDS]
    return tokens


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
            existing = alias_map.get(norm)
            if existing and not existing.get("uncertain") and uncertain:
                continue
            if norm not in alias_map or (existing and existing.get("uncertain") and not uncertain):
                alias_map[norm] = {
                    "name": name,
                    "uncertain": uncertain,
                    "matched_value": str(cand).strip(),
                    "match_type": "name" if str(cand).strip() == name else "alias",
                }
    return alias_map


def match_pantry_item(raw_ingredient: str, pantry_items: List[Dict[str, Any]]) -> Optional[Dict[str, Any]]:
    raw_norm = normalize_ingredient(raw_ingredient)
    if not raw_norm:
        return None

    alias_map = build_pantry_alias_map(pantry_items)
    exact = alias_map.get(raw_norm)
    if exact:
        return dict(exact)

    raw_tokens = set(ingredient_tokens(raw_ingredient))
    if not raw_tokens:
        return None

    best: Optional[Tuple[int, int, int, Dict[str, Any]]] = None
    for item in pantry_items:
        name = str(item.get("name") or "").strip()
        if not name:
            continue
        candidates = [name] + [str(alias).strip() for alias in (item.get("aliases") or []) if str(alias).strip()]
        for candidate in candidates:
            cand_tokens = set(ingredient_tokens(candidate))
            if not cand_tokens:
                continue
            if len(cand_tokens) == 1:
                token = next(iter(cand_tokens))
                if len(token) < 4 or token not in raw_tokens:
                    continue
            elif not cand_tokens.issubset(raw_tokens):
                continue

            score = (
                len(cand_tokens),
                sum(len(token) for token in cand_tokens),
                0 if item.get("uncertain") else 1,
            )
            match = {
                "name": name,
                "uncertain": bool(item.get("uncertain")),
                "matched_value": candidate,
                "match_type": "token",
            }
            if best is None or score > best[:3]:
                best = (*score, match)

    return best[3] if best else None


def _to_list(counts: Dict[str, int], display_map: Optional[Dict[str, str]] = None) -> List[Dict[str, Any]]:
    if display_map is None:
        items = [{"name": k, "count": v} for k, v in counts.items()]
    else:
        items = [{"name": display_map[k], "count": v} for k, v in counts.items()]
    return sorted(items, key=lambda x: x["name"].lower())


def _collect_recipe_ingredients(days: Dict[str, str], engine: Any) -> List[Tuple[str, str]]:
    rows: List[Tuple[str, str]] = []
    with Session(engine) as session:
        for d in range(1, 8):
            rid = days.get(str(d))
            if not rid or (isinstance(rid, str) and rid.startswith("KI:")):
                continue
            recipe = session.get(Recipe, rid)
            if not recipe:
                continue
            for ing in (recipe.ingredients or []):
                raw = (ing or "").strip()
                if raw:
                    rows.append((clean_display_name(raw), recipe.title))
    return rows


def aggregate_shop_items(
    days: Dict[str, str],
    engine: Any,
    pantry_items: List[Dict[str, Any]],
) -> Dict[str, Any]:
    buy_counts: Dict[str, int] = {}
    buy_display: Dict[str, str] = {}
    buy_lines: List[str] = []
    pantry_used_counts: Dict[str, int] = {}
    pantry_uncertain_counts: Dict[str, int] = {}
    pantry_matches: List[Dict[str, Any]] = []

    for raw, recipe_title in _collect_recipe_ingredients(days, engine):
        norm = normalize_ingredient(raw)
        if not norm:
            continue
        pantry_entry = match_pantry_item(raw, pantry_items)
        if pantry_entry:
            key = pantry_entry["name"]
            if pantry_entry.get("uncertain"):
                pantry_uncertain_counts[key] = pantry_uncertain_counts.get(key, 0) + 1
            else:
                pantry_used_counts[key] = pantry_used_counts.get(key, 0) + 1
            pantry_matches.append(
                {
                    "content": raw,
                    "recipe_title": recipe_title,
                    "pantry_name": key,
                    "uncertain": bool(pantry_entry.get("uncertain")),
                    "matched_value": pantry_entry.get("matched_value") or key,
                    "match_type": pantry_entry.get("match_type") or "name",
                }
            )
            continue

        buy_lines.append(raw)
        if norm not in buy_display:
            buy_display[norm] = raw
        buy_counts[norm] = buy_counts.get(norm, 0) + 1

    buy_list = _to_list(buy_counts, buy_display)
    pantry_used_list = _to_list(pantry_used_counts)
    pantry_uncertain_list = _to_list(pantry_uncertain_counts)

    message_lines: List[str] = []
    if not buy_list:
        message_lines.append("🧺 Einkaufsliste ist leer (oder alle Zutaten sind im Basisvorrat).")
    else:
        message_lines.append("🧺 Einkaufsliste (aggregiert):")
        for item in buy_list:
            cnt = item["count"]
            message_lines.append(f"- {item['name']}" + (f"  x{cnt}" if cnt > 1 else ""))

    if pantry_used_list:
        message_lines.append("")
        message_lines.append("Im Basisvorrat erkannt:")
        for item in pantry_used_list:
            cnt = item["count"]
            message_lines.append(f"- {item['name']}" + (f"  x{cnt}" if cnt > 1 else ""))

    if pantry_uncertain_list:
        message_lines.append("")
        message_lines.append("Basisvorrat bitte prüfen:")
        for item in pantry_uncertain_list:
            cnt = item["count"]
            message_lines.append(f"- {item['name']}" + (f"  x{cnt}" if cnt > 1 else ""))

    return {
        "buy": buy_list,
        "buy_lines": buy_lines,
        "pantry_used": pantry_used_list,
        "pantry_uncertain_used": pantry_uncertain_list,
        "pantry_matches": pantry_matches,
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
        message_lines.append("🧺 Einkaufsliste ist leer (oder alle Zutaten sind im Basisvorrat).")
    else:
        message_lines.append("🧺 Einkaufsliste:")
        for line in buy_lines:
            message_lines.append(f"- {line}")

    if pantry_used_list:
        message_lines.append("")
        message_lines.append("Im Basisvorrat erkannt:")
        for item in pantry_used_list:
            cnt = item["count"]
            message_lines.append(f"- {item['name']}" + (f"  x{cnt}" if cnt > 1 else ""))

    if pantry_uncertain_list:
        message_lines.append("")
        message_lines.append("Basisvorrat bitte prüfen:")
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
    snapshot_buy_lines = prepare_shop_lines_for_snapshot(buy_lines)
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
        "buy_lines": buy_lines,
        "snapshot_buy_lines": snapshot_buy_lines,
        "pantry_used": aggregated["pantry_used"],
        "pantry_uncertain_used": aggregated["pantry_uncertain_used"],
        "pantry_matches": aggregated["pantry_matches"],
        "message": message,
        "warning": warning,
        "ai_applied": ai_applied,
    }


def build_per_recipe_output(
    days: Dict[str, str],
    engine: Any,
    pantry_items: List[Dict[str, Any]],
) -> Dict[str, Any]:
    per_recipe: List[Dict[str, Any]] = []
    pantry_used_counts: Dict[str, int] = {}
    pantry_uncertain_counts: Dict[str, int] = {}
    pantry_matches: List[Dict[str, Any]] = []

    with Session(engine) as session:
        for d in range(1, 8):
            rid = days.get(str(d))
            if not rid or (isinstance(rid, str) and rid.startswith("KI:")):
                continue
            recipe = session.get(Recipe, rid)
            if not recipe:
                continue
            ingredients: List[str] = []
            for ing in (recipe.ingredients or []):
                raw = clean_display_name(ing or "")
                if not raw:
                    continue
                pantry_entry = match_pantry_item(raw, pantry_items)
                if pantry_entry:
                    key = pantry_entry["name"]
                    if pantry_entry.get("uncertain"):
                        pantry_uncertain_counts[key] = pantry_uncertain_counts.get(key, 0) + 1
                    else:
                        pantry_used_counts[key] = pantry_used_counts.get(key, 0) + 1
                    pantry_matches.append(
                        {
                            "content": raw,
                            "recipe_title": recipe.title,
                            "pantry_name": key,
                            "uncertain": bool(pantry_entry.get("uncertain")),
                            "matched_value": pantry_entry.get("matched_value") or key,
                            "match_type": pantry_entry.get("match_type") or "name",
                        }
                    )
                    continue
                ingredients.append(raw)
            per_recipe.append({"title": recipe.title, "ingredients": ingredients})

    pantry_used_list = _to_list(pantry_used_counts)
    pantry_uncertain_list = _to_list(pantry_uncertain_counts)

    message_lines: List[str] = ["🧾 Einkaufsliste (Pro Rezept)"]
    telegram_lines: List[str] = ["🧾 Einkaufsliste (Pro Rezept)"]
    if not per_recipe:
        message_lines.append("Keine Zutaten (oder alle Zutaten sind im Basisvorrat).")
        telegram_lines.append("Keine Zutaten (oder alle Zutaten sind im Basisvorrat).")
    else:
        for recipe in per_recipe:
            message_lines.append(f"**{recipe['title']}**")
            telegram_lines.append(f"<b>{html.escape(recipe['title'])}</b>")
            if recipe["ingredients"]:
                for ing in recipe["ingredients"]:
                    message_lines.append(f"- {ing}")
                    telegram_lines.append(f"- {html.escape(ing)}")
            else:
                message_lines.append("- (nur Basisvorrat)")
                telegram_lines.append("- (nur Basisvorrat)")
            message_lines.append("")
            telegram_lines.append("")

    if pantry_used_list:
        message_lines.append("")
        message_lines.append("Im Basisvorrat erkannt:")
        for item in pantry_used_list:
            cnt = item["count"]
            message_lines.append(f"- {item['name']}" + (f"  x{cnt}" if cnt > 1 else ""))

    if pantry_uncertain_list:
        message_lines.append("")
        message_lines.append("Basisvorrat bitte prüfen:")
        for item in pantry_uncertain_list:
            cnt = item["count"]
            message_lines.append(f"- {item['name']}" + (f"  x{cnt}" if cnt > 1 else ""))

    return {
        "mode": SHOP_OUTPUT_PER_RECIPE,
        "buy": [],
        "per_recipe": per_recipe,
        "pantry_used": pantry_used_list,
        "pantry_uncertain_used": pantry_uncertain_list,
        "pantry_matches": pantry_matches,
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


def suggest_pantry_aliases_from_ingredients(
    pantry_items: List[Dict[str, Any]],
    ingredient_counts: Dict[str, int],
    ai_suggestions: Optional[Dict[str, List[str]]] = None,
) -> Dict[str, Any]:
    alias_map = build_pantry_alias_map(pantry_items)
    suggestion_map: Dict[str, List[Dict[str, Any]]] = defaultdict(list)
    seen_aliases: Dict[str, set[str]] = defaultdict(set)
    unmatched_common: List[Dict[str, Any]] = []

    for pantry in pantry_items:
        name = str(pantry.get("name") or "").strip()
        if not name:
            continue
        seen_aliases[name] = {normalize_ingredient(name)}
        for alias in pantry.get("aliases") or []:
            norm = normalize_ingredient(str(alias))
            if norm:
                seen_aliases[name].add(norm)

    for ingredient, count in sorted(ingredient_counts.items(), key=lambda item: (-item[1], item[0].lower())):
        clean = clean_display_name(ingredient)
        norm = normalize_ingredient(clean)
        if not norm:
            continue
        if norm in alias_map:
            continue
        match = match_pantry_item(clean, pantry_items)
        if match and norm not in seen_aliases[match["name"]]:
            seen_aliases[match["name"]].add(norm)
            suggestion_map[match["name"]].append(
                {
                    "alias": clean,
                    "count": count,
                    "source": "heuristic",
                }
            )
        elif count >= 2:
            unmatched_common.append({"name": clean, "count": count})

    for pantry_name, aliases in (ai_suggestions or {}).items():
        if pantry_name not in seen_aliases:
            continue
        existing = {row["alias"] for row in suggestion_map[pantry_name]}
        for alias in aliases:
            clean = clean_display_name(alias)
            norm = normalize_ingredient(clean)
            if not clean or norm in seen_aliases[pantry_name] or clean in existing:
                continue
            seen_aliases[pantry_name].add(norm)
            suggestion_map[pantry_name].append(
                {
                    "alias": clean,
                    "count": ingredient_counts.get(clean, 0),
                    "source": "ai",
                }
            )

    suggestions = []
    for pantry in pantry_items:
        name = str(pantry.get("name") or "").strip()
        aliases = sorted(
            suggestion_map.get(name, []),
            key=lambda item: (-item["count"], item["alias"].lower()),
        )
        suggestions.append(
            {
                "pantry_name": name,
                "uncertain": bool(pantry.get("uncertain")),
                "aliases": aliases[:8],
            }
        )

    return {
        "suggestions": suggestions,
        "unmatched_common": unmatched_common[:12],
    }


def recipe_ingredient_counts(engine: Any) -> Dict[str, int]:
    counts: Counter[str] = Counter()
    with Session(engine) as session:
        rows = session.exec(select(Recipe.ingredients).where(Recipe.is_active == True)).all()  # noqa: E712
        for row in rows:
            for ingredient in (row or []):
                clean = clean_display_name(str(ingredient or ""))
                if clean:
                    counts[clean] += 1
    return dict(counts)
