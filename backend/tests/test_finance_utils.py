import unittest
from dataclasses import dataclass
from datetime import date
from typing import Optional

from app.finance_utils import (
    FinanceDashboardInput,
    FinanceYearlyInput,
    build_finance_yearly_overview,
    expense_applies_to_month,
    expense_due_date_in_month,
    build_finance_dashboard,
    month_start_from_string,
    normalize_monthly_amount,
)


@dataclass
class FakeExpense:
    id: str
    name: str
    category: str
    amount: float
    interval: str
    next_due_date: date
    responsible_party: str
    is_active: bool = True
    provider: Optional[str] = None
    currency: str = "chf"
    payment_method: Optional[str] = None
    account_label: Optional[str] = None
    notes: Optional[str] = None


class FinanceUtilsTest(unittest.TestCase):
    def test_normalize_monthly_amount_handles_annual(self):
        self.assertEqual(float(normalize_monthly_amount(1200, "annual")), 100.0)
        self.assertEqual(float(normalize_monthly_amount(300, "quarterly")), 100.0)
        self.assertEqual(float(normalize_monthly_amount(150, "one_time")), 150.0)

    def test_month_start_parses_yyyy_mm(self):
        self.assertEqual(month_start_from_string("2026-03").isoformat(), "2026-03-01")

    def test_dashboard_aggregates_household_and_people(self):
        dashboard = build_finance_dashboard(
            FinanceDashboardInput(
                expenses=[
                    FakeExpense("1", "Miete", "wohnen", 2400, "monthly", date(2026, 3, 5), "gemeinsam"),
                    FakeExpense("2", "Krankenkasse Dennis", "versicherungen", 420, "monthly", date(2026, 3, 12), "dennis"),
                    FakeExpense("3", "Serafe", "kommunikation_medien", 335, "annual", date(2026, 3, 20), "julia"),
                ],
                incomes={"dennis": 6000, "julia": 5200},
                month_start=date(2026, 3, 1),
                today=date(2026, 3, 1),
            )
        )

        self.assertEqual(dashboard["summary"]["monthly_fixed_total_text"], "CHF 2847.92")
        self.assertEqual(dashboard["summary"]["household_income_total_text"], "CHF 11200.00")
        self.assertEqual(dashboard["people"]["dennis"]["direct_costs_text"], "CHF 420.00")
        self.assertEqual(dashboard["people"]["julia"]["direct_costs_text"], "CHF 27.92")
        self.assertEqual(dashboard["people"]["dennis"]["shared_cost_share_text"], "CHF 1200.00")
        self.assertEqual(dashboard["people"]["julia"]["shared_cost_share_text"], "CHF 1200.00")
        self.assertEqual(dashboard["people"]["dennis"]["allocated_costs_text"], "CHF 1620.00")
        self.assertEqual(dashboard["people"]["julia"]["allocated_costs_text"], "CHF 1227.92")
        self.assertEqual(dashboard["people"]["dennis"]["available_after_allocation_text"], "CHF 4380.00")
        self.assertEqual(dashboard["people"]["julia"]["available_after_allocation_text"], "CHF 3972.08")
        self.assertEqual(dashboard["by_responsible_party"][2]["monthly_total_text"], "CHF 2400.00")
        wohnen = next(row for row in dashboard["by_category"] if row["category"] == "wohnen")
        self.assertEqual(wohnen["carried_by"][0]["label"], "Gemeinsam")
        self.assertEqual(wohnen["carried_by"][0]["monthly_total_text"], "CHF 2400.00")
        versicherungen = next(row for row in dashboard["by_category"] if row["category"] == "versicherungen")
        self.assertEqual(versicherungen["carried_by"][0]["label"], "Dennis")
        self.assertEqual(versicherungen["carried_by"][0]["monthly_total_text"], "CHF 420.00")

    def test_one_time_only_applies_in_due_month(self):
        expense = FakeExpense("4", "Steuer", "finanzen", 500, "one_time", date(2026, 3, 14), "dennis")
        self.assertTrue(expense_applies_to_month(expense, date(2026, 3, 1)))
        self.assertFalse(expense_applies_to_month(expense, date(2026, 4, 1)))
        self.assertEqual(expense_due_date_in_month(expense, date(2026, 3, 1)).isoformat(), "2026-03-14")
        self.assertIsNone(expense_due_date_in_month(expense, date(2026, 4, 1)))

    def test_yearly_overview_aggregates_months(self):
        overview = build_finance_yearly_overview(
            FinanceYearlyInput(
                expenses=[
                    FakeExpense("1", "Miete", "wohnen", 2400, "monthly", date(2026, 1, 5), "gemeinsam"),
                    FakeExpense("2", "Autoversicherung", "mobilitaet", 1200, "annual", date(2026, 6, 1), "dennis"),
                    FakeExpense("3", "Steuerberatung", "finanzen", 600, "one_time", date(2026, 3, 18), "julia"),
                ],
                incomes_by_month={f"2026-{month:02d}-01": {"dennis": 6000, "julia": 5000} for month in range(1, 13)},
                year=2026,
                today=date(2026, 3, 1),
            )
        )
        self.assertEqual(overview["summary"]["annual_fixed_total_text"], "CHF 30100.00")
        self.assertEqual(overview["summary"]["monthly_average_text"], "CHF 2508.33")
        self.assertEqual(overview["summary"]["household_income_total_text"], "CHF 132000.00")
        self.assertEqual(overview["people"]["dennis"]["shared_cost_share_text"], "CHF 14400.00")
        self.assertEqual(overview["people"]["julia"]["allocated_costs_text"], "CHF 15000.00")


if __name__ == "__main__":
    unittest.main()
