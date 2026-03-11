import test from "node:test";
import assert from "node:assert/strict";

import { currentMonthValue, formatMonthLabel, monthInputValue, monthStartValue } from "../app/finanzen/format.mjs";

test("monthInputValue keeps year-month", () => {
  assert.equal(monthInputValue("2026-03-01"), "2026-03");
});

test("currentMonthValue returns YYYY-MM", () => {
  assert.match(currentMonthValue(), /^\d{4}-\d{2}$/);
});

test("monthStartValue expands to first of month", () => {
  assert.equal(monthStartValue("2026-03"), "2026-03-01");
});

test("formatMonthLabel renders german month label", () => {
  assert.equal(formatMonthLabel("2026-03"), "März 2026");
});
