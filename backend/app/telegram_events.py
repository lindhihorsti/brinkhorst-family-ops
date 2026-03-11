import re
from datetime import date
from typing import Any, Dict, Optional


def short_text(value: Optional[str], limit: int = 80) -> str:
    text = re.sub(r"\s+", " ", str(value or "").strip())
    if len(text) <= limit:
        return text
    return text[: max(limit - 1, 0)].rstrip() + "…"


def format_currency_amount(amount: float) -> str:
    return f"CHF {amount:.2f}"


def telegram_recipe_created_text(title: str, time_minutes: Optional[int], collection_name: Optional[str]) -> str:
    suffix = []
    if time_minutes:
        suffix.append(f"{time_minutes} Min")
    if collection_name:
        suffix.append(collection_name)
    detail = f" ({' · '.join(suffix)})" if suffix else ""
    return f"🍽️ Neues Rezept: {short_text(title, 70)}{detail}"


def telegram_weekly_plan_created_text(days: list[Dict[str, Any]]) -> str:
    summary = ", ".join(
        f"{day.get('label')}: {short_text(day.get('title'), 18)}"
        for day in days[:7]
        if day.get("title")
    )
    return f"🗓️ Neuer Wochenplan: {summary}" if summary else "🗓️ Neuer Wochenplan erstellt"


def telegram_chore_created_text(title: str, assigned_count: int) -> str:
    detail = f" · {assigned_count} zugeteilt" if assigned_count else ""
    return f"✅ Neue Aufgabe: {short_text(title, 70)}{detail}"


def telegram_shopping_list_created_text(item: Dict[str, Any]) -> str:
    parts = [f"{item.get('manual_count', 0)} manuell"]
    recipe_count = int(item.get("recipe_count") or 0)
    if recipe_count > 0:
        parts.append(f"{recipe_count} aus Rezepten")
    return f"🛒 Neue Einkaufsliste: {short_text(item.get('title'), 70)} ({' · '.join(parts)})"


def telegram_expense_created_text(payload: Dict[str, Any]) -> str:
    title = short_text(payload.get("title"), 50)
    amount = float(payload.get("amount") or 0.0)
    category = str(payload.get("category") or "Sonstiges").strip()
    paid_by = short_text(payload.get("paid_by"), 24)
    return f"💸 Neue Ausgabe: {title} · {format_currency_amount(amount)} · {category} · {paid_by}"


def telegram_fixed_expense_created_text(payload: Dict[str, Any]) -> str:
    title = short_text(payload.get("name"), 50)
    amount = float(payload.get("amount") or 0.0)
    category = str(payload.get("category_label") or payload.get("category") or "Sonstiges").strip()
    responsible = str(payload.get("responsible_label") or payload.get("responsible_party") or "Gemeinsam").strip()
    interval = str(payload.get("interval_label") or payload.get("interval") or "Monatlich").strip()
    return f"🏦 Neue Fixkosten: {title} · {format_currency_amount(amount)} · {category} · {responsible} · {interval}"


def telegram_pinboard_note_created_text(content: str, tag: str) -> str:
    return f"📌 Neue Pinnwand-Notiz ({tag}): {short_text(content, 90)}"


def telegram_birthday_created_text(name: str, birth_date: date) -> str:
    return f"🎂 Neuer Geburtstag: {short_text(name, 50)} · {birth_date.isoformat()}"


def telegram_family_member_created_text(name: str, restrictions_count: int) -> str:
    detail = f" · {restrictions_count} Einschränkungen" if restrictions_count else ""
    return f"👥 Neues Familienmitglied: {short_text(name, 50)}{detail}"
