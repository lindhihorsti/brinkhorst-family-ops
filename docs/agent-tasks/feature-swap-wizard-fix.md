Feature Brief: Fix + extend Swap Wizard (shared logic for GUI + Telegram)

Goal
Fix the Swap flow so it reliably opens the preview in the GUI and make the swap logic correct and shared between GUI and Telegram bot:
- User selects days to swap (checkboxes).
- "Generate Preview" must generate a preview and the GUI must open the preview.
- User can iteratively re-roll swaps for selected days until satisfied, then Confirm.
- Swap suggestions must be random across the entire recipes database (not biased to newest recipes).
- Rejected suggestions must not reappear during the same swap session (until Confirm).
- Persist weekly plan only on Confirm. All intermediate steps are preview/draft state.

UI Language Rules
- Feature description/instructions: English.
- UI labels and visible text: German.

Scope (Exact Changes)

1) GUI: Preview must open after Generate Preview
- In the Swap Wizard UI:
  - User selects one or more days via checkboxes.
  - On click of "Generate Preview" (or existing German label), the app must:
    - call the preview/generate endpoint (existing backend route for swap preview)
    - after success, reliably show the Preview UI (modal/step/section) with the generated proposal.
- Current bug: Preview does not open. Fix this UI state/step transition.

2) Iterative swapping (until Confirm)
- After preview is shown, user can:
  a) Confirm: accept current preview plan and persist final weekly plan.
  b) Re-roll: select days again (checkboxes) and generate preview again, changing ONLY those selected days.
- This loop can repeat multiple times without persisting, until Confirm is pressed.

3) Random suggestions from entire DB (active recipes)
- Swap candidate selection must consider all active recipes (is_active=true), not just recently created ones.
- Implement a proper random selection strategy (DB-level random order or uniform sampling) that does not bias towards newest.

4) Reject/avoid list within a swap session (no repeats until Confirm)
- During one swap session (from first preview generation until Confirm), any recipe that was suggested and then effectively rejected (because user re-rolled the day) must be added to an "avoid list".
- Avoid list rules:
  - Avoid list is session-scoped per week draft/preview.
  - Recipes in avoid list must NOT be suggested again in subsequent re-rolls in that session.
  - Avoid list is cleared when the user confirms (or discards the swap session).
- This must apply to both GUI and Telegram bot because they use the same backend logic.

5) Persist only on Confirm
- Do not persist weekly_plans on "Generate Preview" or intermediate re-rolls.
- Only persist the final plan when Confirm is executed.
- Draft/preview state can be stored server-side to support the iterative workflow.

Architecture / Shared Logic Requirement
- The swap generation logic must be implemented once in backend business logic (service/module) and used by:
  - GUI endpoints
  - Telegram bot commands/handlers
- Do NOT implement separate swap logic paths per channel.

Constraints
- Keep DB schema changes minimal. Prefer using existing tables/columns.
- If persistence of reject/avoid list requires storage, use one of:
  - existing weekly_plan_drafts jsonb fields (preferred) OR
  - app_state keyed storage
  Choose the minimal change that fits existing architecture.
- No secrets.
- Must not break existing weekly plan generation and shop list behavior.

Acceptance Criteria
- In GUI: after selecting days and clicking "Generate Preview", the preview view opens reliably every time.
- User can re-roll selected days multiple times; only selected days change.
- Suggestions are random across entire active recipes (not only newest).
- Rejected recipes do not reappear within the same swap session until Confirm.
- Final weekly plan is saved only after Confirm.
- Telegram swap behavior matches GUI behavior because shared backend logic is used.
- npm run lint and npm run build succeed (frontend).
- Backend tests or smoke checks pass (at least /api/health and swap endpoints exercised).

Local Test Plan (Must run)
1) Start dev stack:
   cd infra
   docker compose up -d --build --force-recreate

2) Prepare data:
   - Ensure multiple active recipes exist in DB (is_active=true).

3) GUI test (Swap Wizard):
   - Go to Wochenplan -> Swap Wizard.
   - Select 1-2 days -> click Generate Preview.
     EXPECT: Preview opens and shows proposed replacements.
   - Select one of those days again -> Generate Preview (re-roll).
     EXPECT: Only that day changes; previously suggested recipe for that day does not reappear.
   - Repeat re-roll a few times:
     EXPECT: no repeats of rejected recipes within session; suggestions feel random (not only newest).
   - Confirm:
     EXPECT: weekly plan is persisted (refresh shows final plan).
     EXPECT: avoid list cleared for next swap session.

4) Telegram test (if configured in dev):
   - Trigger swap preview / reroll / confirm via bot commands (existing flow).
     EXPECT: Same behavior re: no repeats within session and persist only on confirm.

Deliverable
- Branch: feat/swap-wizard-fix
- Agent commits locally, does not push.
- Provide a short summary: what changed, which files, and how to verify.
