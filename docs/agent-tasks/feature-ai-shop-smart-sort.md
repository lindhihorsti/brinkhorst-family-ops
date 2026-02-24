Feature Brief: AI smart shopping list (aggregate + sort by impact) for GUI + Telegram

Goal
Always use AI to transform the shopping output into a more efficient, deduped and prioritized list:
- Group and merge equivalent ingredients (e.g., "Tomate" vs "Tomaten", "Rispentomaten").
- Sum quantities when present so only total amount is shown.
- Sort items by “impact on the dish”: big/essential items first (meat, vegetables, staple carbs), then smaller items (spices).
- Must apply regardless of whether SHOP is triggered via GUI or Telegram bot (shared backend logic).

UI Language Rules
- Feature description/instructions: English.
- UI labels and visible text: German.

Input/Output contract
Input: current shop list structure (To Buy / Pantry Used / Pantry Uncertain Used).
- AI job applies primarily to "To Buy".
- Pantry sections can remain as-is OR optionally be lightly normalized but not required.

Output: a transformed shopping list where "To Buy" is:
- grouped (deduped)
- quantities summed when possible
- ordered by impact
- still human-readable German

Behavior
- Whenever shop output is generated (GUI or Telegram):
  - backend calls AI transformer to produce final "To Buy" section output.
- If OPENAI_API_KEY is missing:
  - fall back to existing non-AI shop output (do not break shopping).
  - optionally add a small note (German) in GUI/Telegram: "AI Sortierung nicht verfügbar."

AI transformation requirements
- Must not invent items.
- Must not change meaning.
- Must preserve category boundaries where applicable.
- Quantity summing:
  - If quantities are parseable (e.g., "500 g", "1 kg", "2 EL", "3 Stück"), sum them into one line per normalized ingredient.
  - If unparseable, group without summing and keep original notes.
- Sorting:
  - Prioritize core items (proteins, vegetables, fruits, starches, dairy) above spices/seasonings.
  - Keep related items near each other where reasonable.

Architecture / Shared Logic Requirement
- Implement shop transformation once in backend business logic (service/module).
- Both GUI endpoint and Telegram handler must call the same function.

Backend changes (suggested)
- Introduce a service: backend/app/services/shop_ai.py (or similar)
  - transform_shop_list(to_buy: list[str], locale="de") -> transformed list[str] OR structured JSON
- Modify existing shop generation endpoint(s) and telegram shop command path to call it.

Prompt strategy
- Provide AI with:
  - the raw To Buy list lines
  - strict JSON output schema
  - instruction: no new items; only group/sum/sort
- Validate response:
  - must be a list of strings (or a structured JSON with groups)
  - on validation failure: fall back to original list

Constraints
- No secrets.
- Must not increase failure rate: always have a safe fallback when AI fails.
- Keep response time reasonable (cache optional later; keep MVP simple).

Acceptance Criteria
- Shop output is visibly grouped and deduped.
- Quantities are summed when parseable.
- Big items appear earlier than spices.
- Works in both GUI and Telegram (shared logic).
- If AI not configured, system falls back gracefully without breaking.

Local Test Plan (Must run)
1) Start dev stack:
   cd infra
   docker compose up -d --build --force-recreate

2) Generate a weekly plan and shop list (GUI and/or Telegram).
3) Verify:
   - To Buy is grouped and sorted.
   - Quantities are summed when present.
4) Disable OPENAI_API_KEY and confirm fallback works.

Deliverable
- Branch: feat/ai-shop-smart-sort
- Agent commits locally, does not push.
- Provide summary: changed files, how to test in GUI and Telegram.
