import unittest

from app.shopping_utils import shopping_estimate_context, shopping_estimate_lines, shopping_snapshot_items
from app.services.shop_output import match_pantry_item, suggest_pantry_aliases_from_ingredients
from app.services.shop_ai import prepare_shop_lines_for_snapshot
from app.models import ShoppingList, ShoppingListItem
from app.main import _normalize_pantry_items


class ShoppingListUtilsTest(unittest.TestCase):
    def test_snapshot_keeps_manual_items_first_then_recipe_items(self):
        payload = {
            "mode": "ai_consolidated",
            "snapshot_buy_lines": ["2 Tomaten", "Mozzarella"],
            "buy_lines": ["Tomaten", "Tomaten", "Mozzarella"],
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
                {"content": "Katzenfutter", "source": "manual", "recipe_title": None, "pantry_name": None, "pantry_uncertain": False},
                {"content": "Shampoo", "source": "manual", "recipe_title": None, "pantry_name": None, "pantry_uncertain": False},
                {"content": "2 Tomaten", "source": "recipe", "recipe_title": None, "pantry_name": None, "pantry_uncertain": False},
                {"content": "Mozzarella", "source": "recipe", "recipe_title": None, "pantry_name": None, "pantry_uncertain": False},
            ],
        )

    def test_snapshot_falls_back_to_aggregated_buy_items_when_buy_lines_missing(self):
        payload = {
            "mode": "ai_consolidated",
            "buy": [{"name": "Tomaten", "count": 2}, {"name": "Mozzarella", "count": 1}],
        }

        items = shopping_snapshot_items(
            manual_items=[],
            include_weekly_items=True,
            import_mode="ai_consolidated",
            shop_payload=payload,
        )

        self.assertEqual(
            items,
            [
                {"content": "Tomaten x2", "source": "recipe", "recipe_title": None, "pantry_name": None, "pantry_uncertain": False},
                {"content": "Mozzarella", "source": "recipe", "recipe_title": None, "pantry_name": None, "pantry_uncertain": False},
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
                {"content": "Milch", "source": "manual", "recipe_title": None, "pantry_name": None, "pantry_uncertain": False},
                {"content": "Tomaten", "source": "recipe", "recipe_title": "Pasta", "pantry_name": None, "pantry_uncertain": False},
                {"content": "Basilikum", "source": "recipe", "recipe_title": "Pasta", "pantry_name": None, "pantry_uncertain": False},
                {"content": "Gurke", "source": "recipe", "recipe_title": "Salat", "pantry_name": None, "pantry_uncertain": False},
            ],
        )

    def test_snapshot_includes_pantry_matches_as_separate_section(self):
        payload = {
            "mode": "per_recipe",
            "per_recipe": [{"title": "Pasta", "ingredients": ["Tomaten"]}],
            "pantry_matches": [
                {"content": "Rote Zwiebel", "recipe_title": "Pasta", "pantry_name": "Zwiebeln", "uncertain": True}
            ],
        }
        items = shopping_snapshot_items([], True, "per_recipe", payload)
        self.assertEqual(items[1]["source"], "pantry")
        self.assertEqual(items[1]["pantry_name"], "Zwiebeln")

    def test_snapshot_skips_certain_pantry_matches(self):
        payload = {
            "mode": "per_recipe",
            "per_recipe": [{"title": "Pasta", "ingredients": ["Tomaten"]}],
            "pantry_matches": [
                {"content": "Salz", "recipe_title": "Pasta", "pantry_name": "Salz", "uncertain": False}
            ],
        }
        items = shopping_snapshot_items([], True, "per_recipe", payload)
        self.assertEqual(items, [{"content": "Tomaten", "source": "recipe", "recipe_title": "Pasta", "pantry_name": None, "pantry_uncertain": False}])

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

    def test_match_pantry_item_matches_token_variants(self):
        pantry = [{"name": "Zwiebeln", "uncertain": False, "aliases": []}]
        match = match_pantry_item("Rote Zwiebel", pantry)
        self.assertIsNotNone(match)
        self.assertEqual(match["name"], "Zwiebeln")

    def test_match_pantry_item_prefers_certain_duplicate(self):
        pantry = [
            {"name": "Salz", "uncertain": True, "aliases": []},
            {"name": "Salz", "uncertain": False, "aliases": []},
        ]
        match = match_pantry_item("Salz", pantry)
        self.assertIsNotNone(match)
        self.assertFalse(match["uncertain"])

    def test_normalize_pantry_items_merges_duplicates_and_prefers_certain(self):
        pantry = _normalize_pantry_items([
            {"name": "Salz", "uncertain": True, "aliases": ["Meersalz"]},
            {"name": "Salz", "uncertain": False, "aliases": ["Kochsalz"]},
        ])
        self.assertEqual(len(pantry), 1)
        self.assertEqual(pantry[0]["name"], "Salz")
        self.assertFalse(pantry[0]["uncertain"])
        self.assertEqual(pantry[0]["aliases"], ["Meersalz", "Kochsalz"])

    def test_suggest_pantry_aliases_merges_ai_suggestions(self):
        pantry = [{"name": "Pasta", "uncertain": False, "aliases": []}]
        result = suggest_pantry_aliases_from_ingredients(
            pantry,
            {"Spaghetti": 4, "Rigatoni": 3},
            {"Pasta": ["Spaghetti"]},
        )
        suggestions = result["suggestions"][0]["aliases"]
        self.assertEqual(suggestions[0]["alias"], "Spaghetti")

    def test_ai_consolidated_recipe_items_should_drop_recipe_title_when_readded(self):
        shopping_list = ShoppingList(title="Test", import_mode="ai_consolidated")
        pantry_item = ShoppingListItem(
            list_id=shopping_list.id,
            content="Rote Zwiebel",
            source="pantry",
            recipe_title="Pasta",
            pantry_name="Zwiebeln",
            pantry_uncertain=False,
            item_order=0,
        )

        if shopping_list.import_mode == "ai_consolidated":
            pantry_item.recipe_title = None

        self.assertIsNone(pantry_item.recipe_title)

    def test_prepare_shop_lines_for_snapshot_sums_knoblauchzehen(self):
        prepared = prepare_shop_lines_for_snapshot(["2 Knoblauchzehen", "3 Knoblauchzehen", "Milch"])
        self.assertEqual(prepared, ["5 Knoblauchzehen", "Milch"])


if __name__ == "__main__":
    unittest.main()
