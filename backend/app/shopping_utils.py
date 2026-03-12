from typing import Any, Dict, List, Optional

SHOPPING_CATEGORY_ORDER = [
    "Gemüse & Kräuter",
    "Obst",
    "Fleisch & Fisch",
    "Milchprodukte & Eier",
    "Teigwaren, Reis & Getreide",
    "Brot & Backwaren",
    "Konserven & Gläser",
    "Gewürze, Öle & Saucen",
    "Tiefkühlprodukte",
    "Snacks & Süßes",
    "Getränke",
    "Haushalt & Sonstiges",
]
SHOPPING_CATEGORY_SET = set(SHOPPING_CATEGORY_ORDER)


def apply_ai_categories_to_recipe_items(
    response_items: List[Dict[str, Any]],
    recipe_items: List[Any],
) -> List[str]:
    by_id = {str(item.id): item for item in recipe_items if getattr(item, "id", None)}
    if len(response_items) != len(by_id):
        raise ValueError("AI-Antwort unvollständig.")

    seen_ids = set()
    category_order: List[str] = []
    category_map: Dict[str, List[Any]] = {}

    for row in response_items:
        if not isinstance(row, dict):
            raise ValueError("AI-Antwort ungültig.")
        item_id = str(row.get("id") or "").strip()
        content = str(row.get("content") or "").strip()
        category = str(row.get("category") or "").strip()
        if not item_id or not category:
            raise ValueError("AI-Antwort ungültig.")
        if category not in SHOPPING_CATEGORY_SET:
            raise ValueError("AI-Antwort enthält ungültige Kategorien.")
        if item_id in seen_ids:
            raise ValueError("AI-Antwort enthält Duplikate.")
        item = by_id.get(item_id)
        if not item:
            raise ValueError("AI-Antwort enthält unbekannte Einträge.")
        if content != getattr(item, "content", None):
            raise ValueError("AI hat Zutaten verändert. Speichern abgebrochen.")
        seen_ids.add(item_id)
        item.category = category
        if category not in category_map:
            category_map[category] = []
            category_order.append(category)
        category_map[category].append(item)

    if seen_ids != set(by_id.keys()):
        raise ValueError("AI-Antwort deckt nicht alle Zutaten ab.")

    category_order = [category for category in SHOPPING_CATEGORY_ORDER if category in category_map]
    order_counter = 0
    for category in category_order:
        for item in category_map[category]:
            item.item_order = order_counter
            order_counter += 1
    return category_order


def chunk_shopping_category_items(
    items: List[Dict[str, Any]],
    max_items: int = 40,
    max_chars: int = 2800,
) -> List[List[Dict[str, Any]]]:
    if max_items < 1:
        max_items = 1
    if max_chars < 200:
        max_chars = 200

    chunks: List[List[Dict[str, Any]]] = []
    current: List[Dict[str, Any]] = []
    current_chars = 0

    for item in items:
        content = str(item.get("content") or "")
        recipe_title = str(item.get("recipe_title") or "")
        item_chars = len(content) + len(recipe_title) + 80

        if current and (len(current) >= max_items or current_chars + item_chars > max_chars):
            chunks.append(current)
            current = []
            current_chars = 0

        current.append(item)
        current_chars += item_chars

    if current:
        chunks.append(current)

    return chunks


def shopping_snapshot_items(
    manual_items: List[str],
    include_weekly_items: bool,
    import_mode: str,
    shop_payload: Optional[Dict[str, Any]],
) -> List[Dict[str, Any]]:
    items: List[Dict[str, Any]] = []

    for raw in manual_items:
        content = (raw or "").strip()
        if not content:
            continue
        items.append({
            "content": content,
            "source": "manual",
            "recipe_title": None,
            "pantry_name": None,
            "pantry_uncertain": False,
        })

    if not include_weekly_items or not shop_payload:
        return items

    if import_mode == "per_recipe":
        for recipe in shop_payload.get("per_recipe") or []:
            recipe_title = (recipe.get("title") or "").strip() or None
            for raw in recipe.get("ingredients") or []:
                content = (raw or "").strip()
                if not content:
                    continue
                items.append({
                    "content": content,
                    "source": "recipe",
                    "recipe_title": recipe_title,
                    "pantry_name": None,
                    "pantry_uncertain": False,
                })
        for match in shop_payload.get("pantry_matches") or []:
            content = (match.get("content") or "").strip()
            if not content:
                continue
            if not bool(match.get("uncertain")):
                continue
            items.append({
                "content": content,
                "source": "pantry",
                "recipe_title": (match.get("recipe_title") or "").strip() or None,
                "pantry_name": (match.get("pantry_name") or "").strip() or None,
                "pantry_uncertain": bool(match.get("uncertain")),
            })
        return items

    snapshot_lines = [str(raw).strip() for raw in (shop_payload.get("snapshot_buy_lines") or []) if str(raw).strip()]
    if not snapshot_lines:
        snapshot_lines = [str(raw).strip() for raw in (shop_payload.get("buy_lines") or []) if str(raw).strip()]
    if snapshot_lines:
        for raw in snapshot_lines:
            items.append({
                "content": raw,
                "source": "recipe",
                "recipe_title": None,
                "pantry_name": None,
                "pantry_uncertain": False,
            })
    else:
        for raw in shop_payload.get("buy") or []:
            name = (raw.get("name") or "").strip()
            if not name:
                continue
            count = int(raw.get("count") or 1)
            suffix = f" x{count}" if count > 1 else ""
            items.append({
                "content": f"{name}{suffix}",
                "source": "recipe",
                "recipe_title": None,
                "pantry_name": None,
                "pantry_uncertain": False,
            })

    for match in shop_payload.get("pantry_matches") or []:
        content = (match.get("content") or "").strip()
        if not content:
            continue
        if not bool(match.get("uncertain")):
            continue
        items.append({
            "content": content,
            "source": "pantry",
            "recipe_title": (match.get("recipe_title") or "").strip() or None,
            "pantry_name": (match.get("pantry_name") or "").strip() or None,
            "pantry_uncertain": bool(match.get("uncertain")),
        })

    return items


def shopping_estimate_lines(items: List[Dict[str, Any]]) -> List[str]:
    lines: List[str] = []
    for item in items:
        content = (item.get("content") or "").strip()
        if not content:
            continue
        recipe_title = (item.get("recipe_title") or "").strip()
        if recipe_title:
            lines.append(f"{recipe_title}: {content}")
        else:
            lines.append(content)
    return lines


def shopping_estimate_context(currency: Optional[str]) -> Dict[str, str]:
    code = str(currency or "chf").strip().lower()
    if code == "eur":
        return {
            "currency_code": "EUR",
            "country_hint": "Deutschland",
            "symbol": "EUR",
            "fallback_text": "Ca. EUR {amount:.2f}",
        }
    return {
        "currency_code": "CHF",
        "country_hint": "Schweiz",
        "symbol": "CHF",
        "fallback_text": "Ca. CHF {amount:.2f}",
    }
