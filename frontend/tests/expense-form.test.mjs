import test from "node:test";
import assert from "node:assert/strict";

import { createExpensePayload, defaultExpenseSelection } from "../app/split/expense-form.mjs";

const members = [
  { id: "m1", name: "Anna" },
  { id: "m2", name: "Ben" },
];

test("defaultExpenseSelection preselects first payer and all split members", () => {
  assert.deepEqual(defaultExpenseSelection(members), {
    paidById: "m1",
    splitAmongIds: ["m1", "m2"],
  });
});

test("createExpensePayload includes stable member ids and display names", () => {
  assert.deepEqual(createExpensePayload({
    members,
    title: "Einkauf",
    amount: 42.5,
    paidById: "m2",
    splitAmongIds: ["m1", "m2"],
    category: "Essen",
    date: "2026-03-06",
    notes: "Test",
  }), {
    title: "Einkauf",
    amount: 42.5,
    paid_by: "Ben",
    paid_by_member_id: "m2",
    split_among: ["Anna", "Ben"],
    split_among_member_ids: ["m1", "m2"],
    category: "Essen",
    date: "2026-03-06",
    notes: "Test",
  });
});
