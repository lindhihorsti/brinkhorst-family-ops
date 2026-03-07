from typing import Any, Dict, List, Optional


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
                })
        return items

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
