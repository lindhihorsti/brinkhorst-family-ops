## Feature Brief: Weekly Plan GUI (Plan / Swap / Shop) using existing Telegram bot logic

### Goal
Make the Weekly Plan accessible and executable via the Web GUI, while reusing the existing Telegram bot behavior exactly (no new business logic).
- Home page: "Wochenplan" card becomes clickable and labeled as MVP (green), same style as "Rezepte".
- New subpage: /weekly-plan with Plan / Swap / Shop flows.
- Must not break or change Telegram bot behavior.

### Non-goals
- No changes to the underlying weekly plan logic (selection rules, pantry list, formatting rules, etc.).
- No new auth system.
- No schema changes required.

---

## Current Bot Behavior (must be preserved)
- Week scope: current week only (week_start = Monday of "today").
- plan: generates/overwrites weekly plan for current week and stores in public.weekly_plans.
- swap: user selects one or more days to swap; backend generates a draft proposal and stores it in public.weekly_plan_drafts; requires confirm or cancel.
- confirm: applies the current draft to weekly_plans and deletes the draft.
- cancel: deletes the draft.
- shop: generates an aggregated shopping list from the stored weekly plan, excluding pantry items, and returns a text list.

Swap does NOT select a specific replacement recipe manually; it auto-picks replacements according to existing logic.

---

## Backend: Add REST wrapper endpoints (thin adapters)
Add new HTTP endpoints that call the SAME internal helper functions currently used by the Telegram command handler.
Do NOT reimplement planning logic; only adapt input/output.

### Endpoints
All endpoints operate on current week (week_start = Monday of today). No custom week selection.

1) GET /api/weekly/current
- Returns the current weekly plan (if exists) and draft (if exists) in structured JSON plus a message string.
- If no plan exists: ok=false with a helpful message.

Response shape (example):
{
  "ok": true,
  "week_start": "YYYY-MM-DD",
  "has_plan": true,
  "has_draft": false,
  "plan": {
    "days": [
      {"day":1,"label":"Mo","kind":"recipe|dummy|empty","recipe_id":"uuid|null","title":"string"},
      ...
    ],
    "raw_days": {"1":"<uuid or dummy text>", ...},
    "message": "<same human-readable plan text as bot>"
  },
  "draft": null
}

2) POST /api/weekly/plan
- No body.
- Runs the exact bot "plan" behavior (build new plan + upsert weekly_plans).
- Returns the same response structure as /api/weekly/current (with updated plan).

3) POST /api/weekly/swap
- Body:
  { "days": [2,5,7] }
- Validates: days must be ints 1..7, unique, non-empty.
- Runs exact bot swap behavior:
  - load current plan
  - generate proposed plan via existing swap logic
  - store draft in weekly_plan_drafts
- Response:
{
  "ok": true,
  "week_start": "YYYY-MM-DD",
  "draft": {
    "requested_swaps": [2,5,7],
    "proposed_days": [...structured day list...],
    "raw_proposed_days": {"1":"...",...},
    "message": "<same preview text the bot sends: preview + full plan>"
  }
}

4) POST /api/weekly/confirm
- No body.
- Runs exact bot confirm behavior (apply draft -> weekly_plans, delete draft).
- Response returns updated plan (same shape as /api/weekly/current) plus message.

5) POST /api/weekly/cancel
- No body.
- Runs exact bot cancel behavior (delete draft).
- Response:
{ "ok": true, "message": "Draft verworfen." }

6) GET /api/weekly/shop
- Generates shopping list exactly like bot shop behavior.
- Response includes both structured items and text message:
{
  "ok": true,
  "week_start": "YYYY-MM-DD",
  "items": [{"name":"Tomaten","count":2}, ...],
  "message": "<same text block as bot (aggregated list)>"
}

### Implementation notes
- Reuse existing helpers in backend/app/main.py:
  - _week_start_monday, _db_get_weekly_plan, _db_upsert_weekly_plan
  - _db_get_draft, _db_create_draft, _db_delete_draft
  - _build_new_week_plan, _apply_swaps, _format_plan
  - shop aggregation logic and pantry filter must remain identical
- Do not send Telegram messages from REST endpoints.
- Keep Telegram webhook handler behavior unchanged (only factor out shared code if needed, but do not alter semantics).

### Important: DB-Guard workflow
The repository has a PR check that requires a new db/migrations/*.sql file when backend/app/main.py changes.
Even though this feature adds only endpoints (no schema change), add a no-op migration file to satisfy the guard:
db/migrations/0002_weekly_gui_no_schema_change.sql
Content can be a comment only, e.g.:
-- no schema changes; added to satisfy db-guard for weekly GUI endpoints

---

## Frontend: UI changes

### 1) Home page card
File: frontend/app/page.tsx
- Convert "Wochenplan" from disabled "Soon" to clickable "MVP" (green), same as the recipes card.
- Link to /weekly-plan.

### 2) Weekly Plan subpage
Create: frontend/app/weekly-plan/page.tsx
UI must match the existing minimal clean style of the app (cards, borders, subtle shadows, black text on white background).
Must work without additional UI libraries.

#### Layout proposal (functional)
Header:
- Title: "Wochenplan"
- Subtitle: "Woche ab <week_start> (Mo–So)"
- Buttons:
  - Plan (primary)
  - Swap (opens wizard)
  - Shop (loads shopping list)

Main content:
A) Current Plan section
- Render 7 day cards (Mo..So), each shows:
  - day label
  - recipe title (or dummy title)
  - optional small meta (if recipe details are easily available; otherwise title only)
- If no plan exists: show message + Plan button.

B) Swap Wizard (1:1 bot behavior)
Wizard Step 1: Select days to swap
- Multi-select of days (checkbox list for Mo..So), show current titles next to each day.
- Button: "Generate Preview" -> calls POST /api/weekly/swap with selected days.

Wizard Step 2: Preview Draft
- Show preview plan (7 day cards) based on draft response.
- Show message text (optional small preformatted block).
- Buttons:
  - Confirm -> POST /api/weekly/confirm (then refresh current plan)
  - Cancel -> POST /api/weekly/cancel (then close wizard / refresh state)
- Must match bot semantics exactly (draft exists until confirmed/canceled).

C) Shop section (Text + Checklist)
- Button "Shop" loads GET /api/weekly/shop.
- Provide a toggle:
  - View 1: Text block (message) + Copy-to-clipboard
  - View 2: Checklist (items with checkboxes, showing name and count)
- Checklist state can be local only (no persistence required).

### Error handling
- If API call fails: show an inline error message, keep the last successful data visible.
- Loading states for each operation (Plan / Swap preview / Confirm / Cancel / Shop).

---

## Branch & Commit Rules
- Create branch: feat/weekly-plan-gui
- Commit locally, do NOT push.
- Keep diffs minimal and readable.

---

## Local Test Plan (Must run)
1) Build and start dev stack:
cd infra
docker compose down
docker compose up -d --build --force-recreate

2) API checks:
curl -sS http://127.0.0.1:8080/api/weekly/current ; echo
curl -sS -X POST http://127.0.0.1:8080/api/weekly/plan ; echo
curl -sS http://127.0.0.1:8080/api/weekly/current ; echo
curl -sS -X POST http://127.0.0.1:8080/api/weekly/swap -H 'Content-Type: application/json' -d '{"days":[2,5]}' ; echo
curl -sS -X POST http://127.0.0.1:8080/api/weekly/confirm ; echo
curl -sS http://127.0.0.1:8080/api/weekly/shop ; echo

3) UI checks:
- Open http://127.0.0.1:8080
  - "Wochenplan" card is MVP green and clickable
- Open http://127.0.0.1:8080/weekly-plan
  - Plan button creates plan
  - Swap wizard: select days -> preview -> confirm/cancel works
  - Shop shows text + checklist views

4) Regression:
- Telegram bot commands plan/swap/confirm/cancel/shop still behave exactly the same (no behavior change).

---

## Deliverable
- Working implementation on branch feat/weekly-plan-gui
- Summary of changes, files changed, how to test, expected outputs
- No push/merge performed by the agent
