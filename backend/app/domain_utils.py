from __future__ import annotations

from datetime import date
from typing import Any, Dict, Iterable, List, Mapping, Optional, Tuple


def birthday_for_year(birth_date: date, year: int) -> date:
    try:
        return birth_date.replace(year=year)
    except ValueError:
        if birth_date.month == 2 and birth_date.day == 29:
            return date(year, 2, 28)
        raise


def days_until_birthday(birth_date: date, today: date) -> int:
    next_birthday = birthday_for_year(birth_date, today.year)
    if next_birthday < today:
        next_birthday = birthday_for_year(birth_date, today.year + 1)
    return (next_birthday - today).days


def age_on_next_birthday(birth_date: date, today: date) -> int:
    next_birthday = birthday_for_year(birth_date, today.year)
    if next_birthday < today:
        next_birthday = birthday_for_year(birth_date, today.year + 1)
    return next_birthday.year - birth_date.year


def expense_party_key(member_id: Optional[str], fallback_name: Optional[str]) -> str:
    if member_id:
        return f"id:{member_id}"
    name = (fallback_name or "").strip() or "Unbekannt"
    return f"name:{name.casefold()}"


def expense_party_label(
    member_id: Optional[str],
    fallback_name: Optional[str],
    member_lookup: Mapping[str, str],
) -> str:
    if member_id:
        return member_lookup.get(member_id, (fallback_name or "").strip() or "Unbekannt")
    return (fallback_name or "").strip() or "Unbekannt"


def build_expense_participants(
    split_member_ids: Optional[Iterable[str]],
    split_names: Optional[Iterable[str]],
    member_lookup: Mapping[str, str],
) -> List[Tuple[str, str]]:
    participants: List[Tuple[str, str]] = []
    names = list(split_names or [])
    member_ids = list(split_member_ids or [])

    if member_ids:
        for idx, member_id in enumerate(member_ids):
            fallback_name = names[idx] if idx < len(names) else None
            participants.append(
                (
                    expense_party_key(member_id, fallback_name),
                    expense_party_label(member_id, fallback_name, member_lookup),
                )
            )
        return participants

    for name in names:
        participants.append((expense_party_key(None, name), expense_party_label(None, name, member_lookup)))
    return participants


def collapse_labeled_amounts(amounts: Mapping[str, float], labels: Mapping[str, str]) -> Dict[str, float]:
    collapsed: Dict[str, float] = {}
    for key, amount in amounts.items():
        label = labels.get(key, "Unbekannt")
        collapsed[label] = round(collapsed.get(label, 0.0) + amount, 2)
    return collapsed


def compute_expense_balances(rows: Iterable[Mapping[str, Any]], member_lookup: Mapping[str, str]) -> Dict[str, float]:
    net_by_key: Dict[str, float] = {}
    labels_by_key: Dict[str, str] = {}

    for row in rows:
        amount = float(row["amount"])
        paid_by_id = row.get("paid_by_member_id")
        paid_by_name = row.get("paid_by")
        payer_key = expense_party_key(paid_by_id, paid_by_name)
        payer_label = expense_party_label(paid_by_id, paid_by_name, member_lookup)
        labels_by_key[payer_key] = payer_label
        net_by_key[payer_key] = net_by_key.get(payer_key, 0.0) + amount

        participants = build_expense_participants(
            row.get("split_among_member_ids"),
            row.get("split_among"),
            member_lookup,
        )
        if not participants:
            continue

        share = amount / len(participants)
        for participant_key, participant_label in participants:
            labels_by_key[participant_key] = participant_label
            net_by_key[participant_key] = net_by_key.get(participant_key, 0.0) - share

    collapsed = collapse_labeled_amounts(net_by_key, labels_by_key)
    return {label: round(value, 2) for label, value in collapsed.items()}

