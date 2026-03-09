import unittest
from dataclasses import dataclass
from uuid import uuid4

from app.shopping_utils import apply_ai_categories_to_recipe_items


@dataclass
class FakeShoppingListItem:
    id: object
    content: str
    source: str = "recipe"
    category: str = None
    item_order: int = 0


class ShoppingCategoryValidationTest(unittest.TestCase):
    def _recipe_item(self, content: str) -> FakeShoppingListItem:
        return FakeShoppingListItem(id=uuid4(), content=content)

    def test_apply_categories_preserves_items_and_sets_order(self):
        tomato = self._recipe_item("Tomaten")
        pasta = self._recipe_item("Penne")

        order = apply_ai_categories_to_recipe_items(
            [
                {"id": str(tomato.id), "content": "Tomaten", "category": "Gemüse"},
                {"id": str(pasta.id), "content": "Penne", "category": "Teigwaren"},
            ],
            [tomato, pasta],
        )

        self.assertEqual(order, ["Gemüse", "Teigwaren"])
        self.assertEqual(tomato.category, "Gemüse")
        self.assertEqual(pasta.category, "Teigwaren")
        self.assertEqual(tomato.item_order, 0)
        self.assertEqual(pasta.item_order, 1)

    def test_apply_categories_rejects_modified_content(self):
        tomato = self._recipe_item("Tomaten")
        with self.assertRaisesRegex(ValueError, "verändert"):
            apply_ai_categories_to_recipe_items(
                [{"id": str(tomato.id), "content": "Cherry-Tomaten", "category": "Gemüse"}],
                [tomato],
            )


if __name__ == "__main__":
    unittest.main()
