from __future__ import annotations

from collections import defaultdict
from dataclasses import dataclass
from datetime import date, timedelta
from decimal import Decimal, ROUND_HALF_UP
from typing import Any, Dict, Iterable, List, Optional


FINANCE_CATEGORIES = [
    ("wohnen", "Wohnen"),
    ("versicherungen", "Versicherungen"),
    ("mobilitaet", "Mobilität"),
    ("kommunikation_medien", "Kommunikation & Medien"),
    ("familie_kind", "Familie & Kind"),
    ("finanzen", "Finanzen"),
    ("sonstiges", "Sonstiges"),
]
FINANCE_CATEGORY_LABELS = {key: label for key, label in FINANCE_CATEGORIES}

FINANCE_INTERVALS = [
    ("monthly", "Monatlich"),
    ("quarterly", "Quartalsweise"),
    ("semiannual", "Halbjährlich"),
    ("annual", "Jährlich"),
    ("one_time", "Einmalig"),
]
FINANCE_INTERVAL_LABELS = {key: label for key, label in FINANCE_INTERVALS}
FINANCE_INTERVAL_MONTH_DIVISOR = {
    "monthly": Decimal("1"),
    "quarterly": Decimal("3"),
    "semiannual": Decimal("6"),
    "annual": Decimal("12"),
    "one_time": Decimal("1"),
}
FINANCE_INTERVAL_MONTH_STEP = {
    "monthly": 1,
    "quarterly": 3,
    "semiannual": 6,
    "annual": 12,
}
FINANCE_RESPONSIBLE_PARTIES = [
    ("dennis", "Dennis"),
    ("julia", "Julia"),
    ("gemeinsam", "Gemeinsam"),
]
FINANCE_RESPONSIBLE_LABELS = {key: label for key, label in FINANCE_RESPONSIBLE_PARTIES}
FINANCE_RESPONSIBLE_COLORS = {
    "dennis": "#2563eb",
    "julia": "#db2777",
    "gemeinsam": "#c2410c",
}
GERMAN_MONTH_NAMES = [
    "Januar",
    "Februar",
    "März",
    "April",
    "Mai",
    "Juni",
    "Juli",
    "August",
    "September",
    "Oktober",
    "November",
    "Dezember",
]


def decimal_money(value: Any) -> Decimal:
    return Decimal(str(value or 0)).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)


def format_chf(value: Any) -> str:
    amount = decimal_money(value)
    return f"CHF {amount:.2f}"


def normalize_monthly_amount(amount: Any, interval: str) -> Decimal:
    divisor = FINANCE_INTERVAL_MONTH_DIVISOR.get(str(interval or "").strip(), Decimal("1"))
    return (decimal_money(amount) / divisor).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)


def annualize_amount(amount: Any, interval: str) -> Decimal:
    if str(interval or "").strip() == "one_time":
        return decimal_money(amount)
    monthly = normalize_monthly_amount(amount, interval)
    return (monthly * Decimal("12")).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)


def days_until_due(next_due_date: Optional[date], today: date) -> Optional[int]:
    if not next_due_date:
        return None
    return (next_due_date - today).days


def is_due_within_days(next_due_date: Optional[date], today: date, days: int = 30) -> bool:
    delta = days_until_due(next_due_date, today)
    return delta is not None and 0 <= delta <= days


def month_start_from_string(raw: Optional[str], fallback: Optional[date] = None) -> date:
    base = fallback or date.today().replace(day=1)
    if not raw:
        return base
    cleaned = str(raw).strip()
    if len(cleaned) == 7:
        cleaned = f"{cleaned}-01"
    try:
        parsed = date.fromisoformat(cleaned)
    except Exception:
        return base
    return parsed.replace(day=1)


def month_bounds(month_start: date) -> tuple[date, date]:
    if month_start.month == 12:
        next_month = date(month_start.year + 1, 1, 1)
    else:
        next_month = date(month_start.year, month_start.month + 1, 1)
    return month_start, next_month - timedelta(days=1)


def add_months(base: date, months: int) -> date:
    year = base.year + ((base.month - 1 + months) // 12)
    month = ((base.month - 1 + months) % 12) + 1
    target_start, target_end = month_bounds(date(year, month, 1))
    day = min(base.day, target_end.day)
    return date(target_start.year, target_start.month, day)


def _effective_start(expense: Any) -> date:
    return getattr(expense, "contract_start_date", None) or getattr(expense, "next_due_date")


def expense_applies_to_month(expense: Any, month_start: date) -> bool:
    month_first, month_last = month_bounds(month_start)
    start_date = _effective_start(expense)
    end_date = getattr(expense, "contract_end_date", None)
    interval = str(getattr(expense, "interval", "monthly") or "monthly").strip()
    if interval == "one_time":
        return start_date.year == month_first.year and start_date.month == month_first.month
    if month_last < start_date:
        return False
    if end_date and month_first > end_date:
        return False
    return True


def expense_due_date_in_month(expense: Any, month_start: date) -> Optional[date]:
    interval = str(getattr(expense, "interval", "monthly") or "monthly").strip()
    anchor = getattr(expense, "next_due_date")
    if interval == "one_time":
        if anchor.year == month_start.year and anchor.month == month_start.month:
            return anchor
        return None
    if interval not in FINANCE_INTERVAL_MONTH_STEP:
        return None
    step = FINANCE_INTERVAL_MONTH_STEP[interval]
    month_delta = (month_start.year - anchor.year) * 12 + (month_start.month - anchor.month)
    if month_delta % step != 0:
        return None
    due_date = add_months(anchor, month_delta)
    start_date = _effective_start(expense)
    end_date = getattr(expense, "contract_end_date", None)
    if due_date < start_date:
        return None
    if end_date and due_date > end_date:
        return None
    return due_date


def year_month_starts(year: int) -> List[date]:
    return [date(year, month, 1) for month in range(1, 13)]


@dataclass
class FinanceDashboardInput:
    expenses: Iterable[Any]
    incomes: Dict[str, Any]
    month_start: date
    today: date


@dataclass
class FinanceYearlyInput:
    expenses: Iterable[Any]
    incomes_by_month: Dict[str, Dict[str, Any]]
    year: int
    today: date


def _expense_to_row(expense: Any, today: date, month_start: Optional[date] = None) -> Dict[str, Any]:
    monthly_amount = normalize_monthly_amount(getattr(expense, "amount", 0), getattr(expense, "interval", "monthly"))
    annual_amount = annualize_amount(getattr(expense, "amount", 0), getattr(expense, "interval", "monthly"))
    due_date = getattr(expense, "next_due_date", None)
    selected_month_due = expense_due_date_in_month(expense, month_start) if month_start else None
    is_active_in_month = expense_applies_to_month(expense, month_start) if month_start else True
    return {
        "id": str(getattr(expense, "id", "")),
        "name": getattr(expense, "name", ""),
        "provider": getattr(expense, "provider", None),
        "category": getattr(expense, "category", "sonstiges"),
        "category_label": FINANCE_CATEGORY_LABELS.get(getattr(expense, "category", "sonstiges"), "Sonstiges"),
        "amount": float(decimal_money(getattr(expense, "amount", 0))),
        "amount_text": format_chf(getattr(expense, "amount", 0)),
        "currency": getattr(expense, "currency", "chf"),
        "interval": getattr(expense, "interval", "monthly"),
        "interval_label": FINANCE_INTERVAL_LABELS.get(getattr(expense, "interval", "monthly"), "Monatlich"),
        "monthly_amount": float(monthly_amount),
        "monthly_amount_text": format_chf(monthly_amount),
        "annual_amount": float(annual_amount),
        "annual_amount_text": format_chf(annual_amount),
        "next_due_date": due_date.isoformat() if due_date else None,
        "month_due_date": selected_month_due.isoformat() if selected_month_due else None,
        "days_until_due": days_until_due(due_date, today),
        "upcoming_within_30_days": is_due_within_days(due_date, today, 30),
        "is_active_in_month": is_active_in_month,
        "responsible_party": getattr(expense, "responsible_party", "gemeinsam"),
        "responsible_label": FINANCE_RESPONSIBLE_LABELS.get(getattr(expense, "responsible_party", "gemeinsam"), "Gemeinsam"),
        "payment_method": getattr(expense, "payment_method", None),
        "account_label": getattr(expense, "account_label", None),
        "notes": getattr(expense, "notes", None),
        "is_active": bool(getattr(expense, "is_active", True)),
    }


def build_finance_dashboard(data: FinanceDashboardInput) -> Dict[str, Any]:
    month_rows = [
        _expense_to_row(expense, data.today, data.month_start)
        for expense in data.expenses
        if bool(getattr(expense, "is_active", True)) and expense_applies_to_month(expense, data.month_start)
    ]
    month_start, month_end = month_bounds(data.month_start)

    monthly_total = sum((decimal_money(row["monthly_amount"]) for row in month_rows), Decimal("0.00"))
    annual_total = sum((decimal_money(row["annual_amount"]) for row in month_rows), Decimal("0.00"))
    next_30_days_total = sum(
        (decimal_money(row["amount"]) for row in month_rows if row["upcoming_within_30_days"]),
        Decimal("0.00"),
    )
    due_in_month_total = sum(
        (
            decimal_money(row["amount"])
            for row in month_rows
            if row["month_due_date"] and month_start.isoformat() <= row["month_due_date"] <= month_end.isoformat()
        ),
        Decimal("0.00"),
    )

    category_totals: Dict[str, Decimal] = defaultdict(lambda: Decimal("0.00"))
    category_responsibility_totals: Dict[str, Dict[str, Decimal]] = defaultdict(
        lambda: {key: Decimal("0.00") for key, _ in FINANCE_RESPONSIBLE_PARTIES}
    )
    for row in month_rows:
        monthly_amount = decimal_money(row["monthly_amount"])
        category_totals[row["category"]] += monthly_amount
        category_responsibility_totals[row["category"]][row["responsible_party"]] += monthly_amount

    by_category = []
    for category, label in FINANCE_CATEGORIES:
        total = category_totals.get(category, Decimal("0.00"))
        percentage = (total / monthly_total * Decimal("100")) if monthly_total > 0 else Decimal("0.00")
        carried_by = []
        for key, party_label in FINANCE_RESPONSIBLE_PARTIES:
            party_total = category_responsibility_totals[category][key]
            if party_total <= 0:
                continue
            party_percentage = (party_total / total * Decimal("100")) if total > 0 else Decimal("0.00")
            carried_by.append(
                {
                    "responsible_party": key,
                    "label": party_label,
                    "color": FINANCE_RESPONSIBLE_COLORS.get(key),
                    "monthly_total": float(party_total),
                    "monthly_total_text": format_chf(party_total),
                    "percentage_of_category": float(party_percentage.quantize(Decimal("0.1"), rounding=ROUND_HALF_UP)),
                }
            )
        by_category.append(
            {
                "category": category,
                "label": label,
                "monthly_total": float(total),
                "monthly_total_text": format_chf(total),
                "percentage": float(percentage.quantize(Decimal("0.1"), rounding=ROUND_HALF_UP)),
                "carried_by": carried_by,
            }
        )

    top_cost_drivers = sorted(month_rows, key=lambda row: row["monthly_amount"], reverse=True)[:5]
    upcoming_due_items = sorted(
        [row for row in month_rows if row["next_due_date"]],
        key=lambda row: (row["next_due_date"], row["name"].lower()),
    )
    periodic_costs = [
        row for row in month_rows
        if row["interval"] in {"quarterly", "semiannual", "annual"}
    ]

    incomes = {
        "dennis": decimal_money(data.incomes.get("dennis")),
        "julia": decimal_money(data.incomes.get("julia")),
    }
    incomes["gesamt"] = incomes["dennis"] + incomes["julia"]

    carried_monthly = {
        "dennis": sum((decimal_money(row["monthly_amount"]) for row in month_rows if row["responsible_party"] == "dennis"), Decimal("0.00")),
        "julia": sum((decimal_money(row["monthly_amount"]) for row in month_rows if row["responsible_party"] == "julia"), Decimal("0.00")),
        "gemeinsam": sum((decimal_money(row["monthly_amount"]) for row in month_rows if row["responsible_party"] == "gemeinsam"), Decimal("0.00")),
    }
    carried_monthly["gesamt"] = monthly_total

    person_views = {}
    shared_half = (carried_monthly["gemeinsam"] / Decimal("2")).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
    for person in ("dennis", "julia"):
        income = incomes[person]
        direct = carried_monthly[person]
        total_with_shared = (direct + shared_half).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
        available = (income - total_with_shared).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
        person_views[person] = {
            "person": person,
            "label": FINANCE_RESPONSIBLE_LABELS.get(person, person.title()),
            "color": FINANCE_RESPONSIBLE_COLORS.get(person),
            "income": float(income),
            "income_text": format_chf(income),
            "direct_costs": float(direct),
            "direct_costs_text": format_chf(direct),
            "shared_costs": float(carried_monthly["gemeinsam"]),
            "shared_costs_text": format_chf(carried_monthly["gemeinsam"]),
            "shared_cost_share": float(shared_half),
            "shared_cost_share_text": format_chf(shared_half),
            "allocated_costs": float(total_with_shared),
            "allocated_costs_text": format_chf(total_with_shared),
            "available_after_allocation": float(available),
            "available_after_allocation_text": format_chf(available),
            "available_after_direct": float(available),
            "available_after_direct_text": format_chf(available),
        }

    carried_breakdown = []
    for key, label in FINANCE_RESPONSIBLE_PARTIES:
        total = carried_monthly[key]
        percentage = (total / monthly_total * Decimal("100")) if monthly_total > 0 else Decimal("0.00")
        carried_breakdown.append(
            {
                "responsible_party": key,
                "label": label,
                "color": FINANCE_RESPONSIBLE_COLORS.get(key),
                "monthly_total": float(total),
                "monthly_total_text": format_chf(total),
                "percentage": float(percentage.quantize(Decimal("0.1"), rounding=ROUND_HALF_UP)),
            }
        )

    return {
        "month": month_start.isoformat(),
        "month_label": f"{GERMAN_MONTH_NAMES[month_start.month - 1]} {month_start.year}",
        "summary": {
            "monthly_fixed_total": float(monthly_total),
            "monthly_fixed_total_text": format_chf(monthly_total),
            "annual_fixed_total": float(annual_total),
            "annual_fixed_total_text": format_chf(annual_total),
            "next_30_days_total": float(next_30_days_total),
            "next_30_days_total_text": format_chf(next_30_days_total),
            "due_in_month_total": float(due_in_month_total),
            "due_in_month_total_text": format_chf(due_in_month_total),
            "household_income_total": float(incomes["gesamt"]),
            "household_income_total_text": format_chf(incomes["gesamt"]),
            "available_after_fixed_total": float(incomes["gesamt"] - monthly_total),
            "available_after_fixed_total_text": format_chf(incomes["gesamt"] - monthly_total),
        },
        "incomes": {
            "dennis": float(incomes["dennis"]),
            "dennis_text": format_chf(incomes["dennis"]),
            "julia": float(incomes["julia"]),
            "julia_text": format_chf(incomes["julia"]),
            "gesamt": float(incomes["gesamt"]),
            "gesamt_text": format_chf(incomes["gesamt"]),
        },
        "by_category": by_category,
        "top_cost_drivers": top_cost_drivers,
        "upcoming_due_items": upcoming_due_items[:8],
        "periodic_costs": periodic_costs,
        "by_responsible_party": carried_breakdown,
        "people": person_views,
    }


def build_finance_yearly_overview(data: FinanceYearlyInput) -> Dict[str, Any]:
    months = year_month_starts(data.year)
    active_expenses = [expense for expense in data.expenses if bool(getattr(expense, "is_active", True))]
    month_rows: List[tuple[date, List[Dict[str, Any]]]] = []
    for month_start in months:
        rows = [
            _expense_to_row(expense, data.today, month_start)
            for expense in active_expenses
            if expense_applies_to_month(expense, month_start)
        ]
        month_rows.append((month_start, rows))

    annual_total = Decimal("0.00")
    actual_due_total = Decimal("0.00")
    category_totals: Dict[str, Decimal] = defaultdict(lambda: Decimal("0.00"))
    responsibility_totals: Dict[str, Decimal] = defaultdict(lambda: Decimal("0.00"))
    annual_cost_by_expense: Dict[str, Decimal] = defaultdict(lambda: Decimal("0.00"))
    expense_meta: Dict[str, Dict[str, Any]] = {}
    monthly_breakdown = []
    yearly_due_items = []
    one_time_costs = []

    for month_start, rows in month_rows:
        month_total = Decimal("0.00")
        for row in rows:
            monthly_amount = decimal_money(row["monthly_amount"])
            annual_total += monthly_amount
            month_total += monthly_amount
            category_totals[row["category"]] += monthly_amount
            responsibility_totals[row["responsible_party"]] += monthly_amount
            annual_cost_by_expense[row["id"]] += monthly_amount
            expense_meta[row["id"]] = row
            if row["month_due_date"]:
                actual_due_total += decimal_money(row["amount"])
                yearly_due_items.append(
                    {
                        "id": row["id"],
                        "name": row["name"],
                        "month_due_date": row["month_due_date"],
                        "amount_text": row["amount_text"],
                        "interval_label": row["interval_label"],
                        "responsible_label": row["responsible_label"],
                        "category_label": row["category_label"],
                    }
                )
            if row["interval"] == "one_time":
                one_time_costs.append(
                    {
                        **row,
                        "month_label": GERMAN_MONTH_NAMES[month_start.month - 1],
                    }
                )
        monthly_breakdown.append(
            {
                "month": month_start.isoformat(),
                "label": GERMAN_MONTH_NAMES[month_start.month - 1],
                "monthly_total": float(month_total),
                "monthly_total_text": format_chf(month_total),
            }
        )

    by_category = []
    for category, label in FINANCE_CATEGORIES:
        total = category_totals.get(category, Decimal("0.00"))
        if total <= 0:
            continue
        percentage = (total / annual_total * Decimal("100")) if annual_total > 0 else Decimal("0.00")
        by_category.append(
            {
                "category": category,
                "label": label,
                "annual_total": float(total),
                "annual_total_text": format_chf(total),
                "percentage": float(percentage.quantize(Decimal("0.1"), rounding=ROUND_HALF_UP)),
            }
        )

    by_responsible_party = []
    for key, label in FINANCE_RESPONSIBLE_PARTIES:
        total = responsibility_totals.get(key, Decimal("0.00"))
        if total <= 0:
            continue
        percentage = (total / annual_total * Decimal("100")) if annual_total > 0 else Decimal("0.00")
        by_responsible_party.append(
            {
                "responsible_party": key,
                "label": label,
                "color": FINANCE_RESPONSIBLE_COLORS.get(key),
                "annual_total": float(total),
                "annual_total_text": format_chf(total),
                "percentage": float(percentage.quantize(Decimal("0.1"), rounding=ROUND_HALF_UP)),
            }
        )

    annual_cost_drivers = []
    for expense_id, total in sorted(annual_cost_by_expense.items(), key=lambda item: item[1], reverse=True)[:8]:
        annual_cost_drivers.append(
            {
                **expense_meta[expense_id],
                "annual_total": float(total),
                "annual_total_text": format_chf(total),
            }
        )

    incomes = {
        "dennis": Decimal("0.00"),
        "julia": Decimal("0.00"),
    }
    for month_start in months:
        month_income = data.incomes_by_month.get(month_start.isoformat(), {})
        incomes["dennis"] += decimal_money(month_income.get("dennis"))
        incomes["julia"] += decimal_money(month_income.get("julia"))
    incomes["gesamt"] = incomes["dennis"] + incomes["julia"]

    shared_total = responsibility_totals.get("gemeinsam", Decimal("0.00"))
    shared_half = (shared_total / Decimal("2")).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
    people = {}
    for person in ("dennis", "julia"):
        direct = responsibility_totals.get(person, Decimal("0.00"))
        allocated = (direct + shared_half).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
        available = (incomes[person] - allocated).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
        people[person] = {
            "label": FINANCE_RESPONSIBLE_LABELS[person],
            "color": FINANCE_RESPONSIBLE_COLORS[person],
            "income_total": float(incomes[person]),
            "income_total_text": format_chf(incomes[person]),
            "direct_costs": float(direct),
            "direct_costs_text": format_chf(direct),
            "shared_cost_share": float(shared_half),
            "shared_cost_share_text": format_chf(shared_half),
            "allocated_costs": float(allocated),
            "allocated_costs_text": format_chf(allocated),
            "available_after_allocation": float(available),
            "available_after_allocation_text": format_chf(available),
        }

    monthly_average = (annual_total / Decimal("12")).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
    available_total = (incomes["gesamt"] - annual_total).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
    return {
        "year": data.year,
        "year_label": str(data.year),
        "summary": {
            "annual_fixed_total": float(annual_total),
            "annual_fixed_total_text": format_chf(annual_total),
            "actual_due_total": float(actual_due_total),
            "actual_due_total_text": format_chf(actual_due_total),
            "monthly_average": float(monthly_average),
            "monthly_average_text": format_chf(monthly_average),
            "household_income_total": float(incomes["gesamt"]),
            "household_income_total_text": format_chf(incomes["gesamt"]),
            "available_after_fixed_total": float(available_total),
            "available_after_fixed_total_text": format_chf(available_total),
        },
        "monthly_breakdown": monthly_breakdown,
        "by_category": by_category,
        "by_responsible_party": by_responsible_party,
        "annual_cost_drivers": annual_cost_drivers,
        "yearly_due_items": sorted(yearly_due_items, key=lambda item: (item["month_due_date"], item["name"].lower()))[:12],
        "one_time_costs": one_time_costs,
        "people": people,
    }
