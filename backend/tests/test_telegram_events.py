import unittest
from datetime import date

from app.telegram_events import (
    format_currency_amount,
    short_text,
    telegram_birthday_created_text,
    telegram_expense_created_text,
    telegram_pinboard_note_created_text,
)


class TelegramEventHelpersTest(unittest.TestCase):
    def test_short_text_trims_and_truncates(self):
        self.assertEqual(short_text("  Hallo   Welt  ", 20), "Hallo Welt")
        self.assertEqual(short_text("x" * 10, 5), "xxxx…")

    def test_expense_message_is_compact(self):
        text = telegram_expense_created_text(
            {
                "title": "Wocheneinkauf",
                "amount": 42.5,
                "category": "Essen",
                "paid_by": "Dennis",
            }
        )
        self.assertEqual(text, "💸 Neue Ausgabe: Wocheneinkauf · CHF 42.50 · Essen · Dennis")

    def test_pinboard_message_keeps_tag_and_short_content(self):
        text = telegram_pinboard_note_created_text("Bitte Morgen Sportsachen mitnehmen", "schule")
        self.assertEqual(text, "📌 Neue Pinnwand-Notiz (schule): Bitte Morgen Sportsachen mitnehmen")

    def test_birthday_message_formats_iso_date(self):
        text = telegram_birthday_created_text("Leni", date(2024, 10, 1))
        self.assertEqual(text, "🎂 Neuer Geburtstag: Leni · 2024-10-01")

    def test_currency_amount_uses_chf_prefix(self):
        self.assertEqual(format_currency_amount(19.9), "CHF 19.90")


if __name__ == "__main__":
    unittest.main()
