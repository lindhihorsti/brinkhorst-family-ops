import test from "node:test";
import assert from "node:assert/strict";

import { estimateCurrencyLabel, formatEstimateTotal } from "../app/einkauf/currency.mjs";
import { recipeGroups, shoppingTextOutput, splitShoppingItems } from "../app/einkauf/format.mjs";

test("splitShoppingItems keeps manual items separate from recipe items", () => {
  const result = splitShoppingItems([
    { content: "Milch", source: "manual" },
    { content: "Tomaten", source: "recipe" },
  ]);

  assert.deepEqual(result.manual, [{ content: "Milch", source: "manual" }]);
  assert.deepEqual(result.recipe, [{ content: "Tomaten", source: "recipe" }]);
});

test("recipeGroups groups imported recipe items by recipe title", () => {
  const result = recipeGroups([
    { content: "Tomaten", source: "recipe", recipe_title: "Pasta" },
    { content: "Basilikum", source: "recipe", recipe_title: "Pasta" },
    { content: "Gurke", source: "recipe", recipe_title: "Salat" },
  ]);

  assert.deepEqual(result, [
    {
      title: "Pasta",
      items: [
        { content: "Tomaten", source: "recipe", recipe_title: "Pasta" },
        { content: "Basilikum", source: "recipe", recipe_title: "Pasta" },
      ],
    },
    {
      title: "Salat",
      items: [{ content: "Gurke", source: "recipe", recipe_title: "Salat" }],
    },
  ]);
});

test("shoppingTextOutput renders manual section first and recipe section after", () => {
  const text = shoppingTextOutput([
    { content: "Milch", source: "manual" },
    { content: "Tomaten", source: "recipe", recipe_title: "Pasta" },
  ]);

  assert.equal(text, "Manuell\n- Milch\n\nAus Rezepten\nPasta\n- Tomaten");
});

test("formatEstimateTotal uses CHF by default", () => {
  assert.equal(formatEstimateTotal({ estimate_currency: "chf", estimated_total_amount: 42.5 }), "CHF 42.50");
});

test("formatEstimateTotal supports EUR totals", () => {
  assert.equal(formatEstimateTotal({ estimate_currency: "eur", estimated_total_amount: 19.9 }), "EUR 19.90");
  assert.equal(estimateCurrencyLabel("eur"), "EUR");
});
