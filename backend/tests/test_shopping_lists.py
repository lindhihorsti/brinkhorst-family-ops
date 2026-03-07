import unittest

from app.shopping_utils import shopping_estimate_context, shopping_estimate_lines, shopping_snapshot_items


class ShoppingListUtilsTest(unittest.TestCase):
    def test_snapshot_keeps_manual_items_first_then_recipe_items(self):
        payload = {
            "mode": "ai_consolidated",
            "buy": [{"name": "Tomaten", "count": 2}, {"name": "Mozzarella", "count": 1}],
        }

        items = shopping_snapshot_items(
            manual_items=["Katzenfutter", "Shampoo"],
            include_weekly_items=True,
            import_mode="ai_consolidated",
            shop_payload=payload,
        )

        self.assertEqual(
            items,
            [
                {"content": "Katzenfutter", "source": "manual", "recipe_title": None},
                {"content": "Shampoo", "source": "manual", "recipe_title": None},
                {"content": "Tomaten x2", "source": "recipe", "recipe_title": None},
                {"content": "Mozzarella", "source": "recipe", "recipe_title": None},
            ],
        )

    def test_snapshot_preserves_per_recipe_group_context(self):
        payload = {
            "mode": "per_recipe",
            "per_recipe": [
                {"title": "Pasta", "ingredients": ["Tomaten", "Basilikum"]},
                {"title": "Salat", "ingredients": ["Gurke"]},
            ],
        }

        items = shopping_snapshot_items(
            manual_items=["Milch"],
            include_weekly_items=True,
            import_mode="per_recipe",
            shop_payload=payload,
        )

        self.assertEqual(
            items,
            [
                {"content": "Milch", "source": "manual", "recipe_title": None},
                {"content": "Tomaten", "source": "recipe", "recipe_title": "Pasta"},
                {"content": "Basilikum", "source": "recipe", "recipe_title": "Pasta"},
                {"content": "Gurke", "source": "recipe", "recipe_title": "Salat"},
            ],
        )

    def test_estimate_lines_include_recipe_context_when_available(self):
        lines = shopping_estimate_lines([
            {"content": "Milch", "recipe_title": None},
            {"content": "Tomaten", "recipe_title": "Pasta"},
        ])

        self.assertEqual(lines, ["Milch", "Pasta: Tomaten"])

    def test_estimate_context_defaults_to_chf_for_switzerland(self):
        context = shopping_estimate_context("chf")
        self.assertEqual(context["currency_code"], "CHF")
        self.assertEqual(context["country_hint"], "Schweiz")
        self.assertEqual(context["fallback_text"], "Ca. CHF {amount:.2f}")

    def test_estimate_context_supports_eur_for_germany(self):
        context = shopping_estimate_context("eur")
        self.assertEqual(context["currency_code"], "EUR")
        self.assertEqual(context["country_hint"], "Deutschland")
        self.assertEqual(context["fallback_text"], "Ca. EUR {amount:.2f}")


if __name__ == "__main__":
    unittest.main()
