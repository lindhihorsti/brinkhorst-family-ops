import test from "node:test";
import assert from "node:assert/strict";

import { getWeeklyPlanHref } from "../app/lib/weekly-plan-links.mjs";

test("weekly plan recipe links prefer source url when present", () => {
  assert.equal(getWeeklyPlanHref({
    kind: "recipe",
    recipe_id: "abc-123",
    source_url: "https://example.com/rezept",
  }), "https://example.com/rezept");
});

test("weekly plan recipe links fall back to internal recipe details", () => {
  assert.equal(getWeeklyPlanHref({
    kind: "recipe",
    recipe_id: "abc-123",
    source_url: "",
  }), "/recipes/abc-123");
});

test("weekly plan non-recipes have no href", () => {
  assert.equal(getWeeklyPlanHref({
    kind: "dummy",
    recipe_id: null,
    source_url: "https://example.com/rezept",
  }), null);
});
