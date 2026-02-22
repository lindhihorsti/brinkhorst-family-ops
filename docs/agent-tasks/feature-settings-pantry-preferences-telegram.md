## Feature Brief: Settings (Pantry/Basisvorrat, Präferenzen, Telegram-Optionen) + Home UI Polish

### Goal
Build a Settings section in the GUI to manage:
1) Pantry/Basisvorrat (inkl. unsicher) + Ingredient normalization
2) Preferences for weekly plan generation (based on existing recipe tags)
3) Telegram settings for GUI-triggered auto-send (Plan/Shop), targeting last active chat

Additionally, apply small Home page UI adjustments (non-critical polish).

The feature must remain MVP-level and must not break existing Telegram bot flows.

---

## Functional Requirements

### A) Pantry / Basisvorrat
Purpose:
- Pantry items are usually available and should not appear in the shopping list.
- However, pantry usage must be transparent: show what was treated as pantry and what is “uncertain pantry”.

Data model (stored in app_state as JSON):
- pantry.items: array of objects:
  - name: string (canonical display name)
  - uncertain: boolean (true = might be missing sometimes)
  - aliases: string[] (synonyms / alternative spellings)

Default pantry set (editable in UI):
- salt, pepper, sugar, flour
- olive oil / cooking oil, vinegar
- soy sauce, mustard
- tomato paste, stock/bouillon
- rice, pasta
- paprika powder, curry, chili, oregano/basil
- baking powder, starch
- garlic (uncertain=true)  [example]
- onions (uncertain=true)  [example]

Normalization (MVP):
- normalize(s):
  - lower-case
  - trim
  - collapse whitespace
  - remove common punctuation
  - optional: conservative German plural heuristic for single words
- Pantry alias match:
  - build map of normalized alias/name -> canonical pantry item (with uncertain flag)
- Non-pantry ingredients:
  - apply basic normalize for grouping same written items (case/spacing), but no synonym expansion beyond pantry aliases

Shopping list impact:
- When generating the shop list:
  - classify each ingredient as:
    - BUY (not pantry)
    - PANTRY_USED (pantry and uncertain=false)
    - PANTRY_UNCERTAIN_USED (pantry and uncertain=true)
  - return all three groups in API response for GUI rendering
  - message text should remain useful; can append pantry sections, but keep existing fields for backward compatibility

### B) Preferences (Plan Bias)
Purpose:
- Let user choose preferred “directions” via existing recipe tags.
- Plan generation should consider preferences each time a plan is created.
- If no preferences set: behave like today (mixed).

Preference rules:
- preferences.tags: string[] (selected tags)
- Bias: max 50% of days in the weekly plan should match ANY selected tag.
  - For 7 days: target = floor(7 * 0.5) = 3 preferred days
  - Remaining days: free mix (existing selection logic)
- Ensure uniqueness (no duplicate recipe IDs).

Important: This must affect BOTH:
- GUI plan generation endpoint
- Telegram bot “plan” command (same underlying functions)

### C) Telegram settings (GUI-triggered only)
Purpose:
- When user clicks Plan/Shop in GUI, optionally auto-send to Telegram.

Settings (stored in app_state as JSON):
- telegram.auto_send_plan: boolean
- telegram.auto_send_shop: boolean

Chat target:
- Use last active Telegram chat id.
- Store last_chat_id whenever the bot receives any message/update.

Behavior:
- Auto-send happens only for GUI-triggered actions.
- Implementation approach (MVP-safe):
  - Add optional query param notify=1 to the relevant GUI endpoints (weekly plan/shop)
  - Default notify=0 so behavior is unchanged for other callers
  - Only if notify=1 AND setting enabled AND last_chat_id exists -> send message via existing _tg_send
- If last_chat_id missing:
  - API returns ok=true but include warning field/message so GUI can show: “Send any message to the bot once to register the chat.”

---

## Backend Requirements

### Settings API (thin endpoints)
Store everything in public.app_state as JSON strings.

1) GET /api/settings
Returns:
{
  "ok": true,
  "pantry": {...},
  "preferences": {...},
  "telegram": {...},
  "telegram_last_chat_id": "<id|null>"
}

2) PUT /api/settings/pantry
Body: { "items": [ { "name": "...", "uncertain": true/false, "aliases": ["..."] }, ... ] }
- Validate minimal constraints (non-empty names)
- Persist to app_state key "settings_pantry"

3) PUT /api/settings/preferences
Body: { "tags": ["..."] }
- Persist to app_state key "settings_preferences"

4) PUT /api/settings/telegram
Body: { "auto_send_plan": true/false, "auto_send_shop": true/false }
- Persist to app_state key "settings_telegram"

5) GET /api/settings/preferences/options
- Return unique tags from recipes.tags[] (sorted) so UI can render multi-select.

### Integrate into existing flows (no logic rewrite)
- Weekly shop endpoint:
  - replace hardcoded pantry set with settings-based pantry map + uncertain flag
  - normalize ingredient names using pantry aliases + basic normalize
  - return additional grouped lists (buy + pantry_used + pantry_uncertain_used) while keeping existing "items" and "message" fields
- Weekly plan generation:
  - incorporate preferences bias into selection (max 50% days) using existing recipes.tags[]
  - must work in REST plan endpoint and telegram “plan”
- Telegram webhook:
  - store last_chat_id on every update received (app_state key "telegram_last_chat_id")

DB-guard note:
- backend/app/main.py will change -> add a no-op migration file to satisfy db-guard:
  db/migrations/000X_settings_no_schema_change.sql
  content: a comment only

---

## Frontend Requirements

### A) Home page UI polish (frontend/app/page.tsx)
1) Add tile "Einstellungen"
- Replace existing disabled "Settings" / "Soon" tile with clickable MVP tile:
  - Title: "Einstellungen"
  - Badge: MVP (green, same style as Rezepte)
  - Link: /settings

2) Remove the text "Family Ops"
- The logo already contains the brand.
- Remove the "Family Ops" headline text.
- Promote "Küchen- & Wochenplan" to the headline size where "Family Ops" was.

3) Move health indicators into the Health Checks box
- Move the 5 health dots (API/DB/BOT/SCHED/AI) and the overall system check pill from the header area down into the Health Checks box.
- Remove the text: "API/DB/BOT/SCHED/AI werden automatisch alle 20s geprüft und als Ampel angezeigt."
- Keep existing polling interval/logic unchanged.

### B) Settings page (same clean style as Recipes/Weekly Plan)
Create: frontend/app/settings/page.tsx

UI sections:
1) Pantry/Basisvorrat
- List items (name, uncertain toggle, aliases input)
- Add item / remove item
- Save button
- Optional: “Reset to defaults” (client-side default list)

2) Preferences
- Multi-select tags from GET /api/settings/preferences/options
- Save button
- Helper text: “Preferences influence up to 50% of the week plan.”

3) Telegram
- Toggle Auto-Send Plan
- Toggle Auto-Send Shop
- Show status: “Last Telegram chat known: yes/no”
- If unknown: show instruction “Send any message to the bot once to register chat.”

### C) Weekly Plan / Shop UI update
- Update Shop UI to show 3 groups:
  - To Buy
  - Pantry Used
  - Pantry Uncertain (check)
- Keep existing text + checklist views.

---

## Local Test Plan (Must run)
1) Start dev stack:
cd infra
docker compose down
docker compose up -d --build --force-recreate

2) Settings API:
curl -sS http://127.0.0.1:8080/api/settings ; echo
curl -sS http://127.0.0.1:8080/api/settings/preferences/options ; echo

3) UI:
- Open http://127.0.0.1:8080
  - Tile "Einstellungen" is MVP green and clickable
  - Health indicators moved into Health Checks box
  - "Family Ops" headline removed; "Küchen- & Wochenplan" is headline size
- Open http://127.0.0.1:8080/settings
  - Edit pantry items, save, reload -> persisted
  - Select preferences tags, save
  - Toggle auto-send options, save

4) Plan respects preferences:
- Create plan and verify <= 3 days match preferred tags when possible

5) Shop shows groups:
curl -sS http://127.0.0.1:8080/api/weekly/shop ; echo
- Response includes buy + pantry_used + pantry_uncertain_used fields

6) Telegram last chat:
- Send any message to bot
- GET /api/settings shows telegram_last_chat_id not null

---

## Deliverable
- Branch: feat/settings-mvp
- Implementation committed locally, not pushed by agent
- Summary + files changed + how to test
