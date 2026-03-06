import unittest
from datetime import date

from app.domain_utils import age_on_next_birthday, compute_expense_balances, days_until_birthday


class BirthdayUtilsTest(unittest.TestCase):
    def test_days_until_birthday_handles_feb_29_on_non_leap_year(self):
        self.assertEqual(days_until_birthday(date(2000, 2, 29), date(2026, 2, 28)), 0)
        self.assertEqual(days_until_birthday(date(2000, 2, 29), date(2026, 3, 1)), 364)

    def test_age_on_next_birthday_uses_adjusted_non_leap_birthday(self):
        self.assertEqual(age_on_next_birthday(date(2000, 2, 29), date(2026, 2, 28)), 26)
        self.assertEqual(age_on_next_birthday(date(2000, 2, 29), date(2026, 3, 1)), 27)


class ExpenseUtilsTest(unittest.TestCase):
    def test_compute_expense_balances_prefers_member_ids_for_current_names(self):
        rows = [
            {
                "amount": 90,
                "paid_by": "Anna Alt",
                "paid_by_member_id": "11111111-1111-1111-1111-111111111111",
                "split_among": ["Anna Alt", "Ben"],
                "split_among_member_ids": [
                    "11111111-1111-1111-1111-111111111111",
                    "22222222-2222-2222-2222-222222222222",
                ],
            }
        ]
        member_lookup = {
            "11111111-1111-1111-1111-111111111111": "Anna Neu",
            "22222222-2222-2222-2222-222222222222": "Ben",
        }

        balances = compute_expense_balances(rows, member_lookup)

        self.assertEqual(balances, {"Anna Neu": 45.0, "Ben": -45.0})


if __name__ == "__main__":
    unittest.main()
