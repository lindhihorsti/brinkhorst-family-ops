Feature Brief: Toggle shopping list output format (AI consolidated vs per-recipe)

Goal
Add a simple setting (toggle) that changes how the shopping list ("Shop") output is rendered:
- Mode A (default): current behavior = AI-generated consolidated shopping list (grouped/deduped/summed/sorted).
- Mode B: per-recipe output = show ingredients separated by recipe, i.e. N recipes with their own ingredient lists.

This must work consistently for BOTH GUI and Telegram bot. Implement the logic once in backend and reuse it for both channels.

UI Language Rules
- Feature description/instructions: English.
- UI labels and visible text: German.

User-facing behavior

1) Settings UI (German)
Add a new setting controlling the shopping list output:
- Section label (German): "Einkaufsliste"
- Setting label (German): "Ausgabeformat"
- Options (German):
  - "Konsolidiert (AI)"  (default)
  - "Pro Rezept"

This should be stored in app_state JSON (existing settings storage). Suggested key path:
- app_state.value JSON: { "shop_output_mode": "ai_consolidated" | "per_recipe" }

2) Shop output behavior (shared)
Whenever shop output is produced (GUI or Telegram):
- Read the configured shop_output_mode.
- If mode = "ai_consolidated":
  - Keep existing AI smart shop behavior (group/dedupe/sum/sort). This is current default.
  - If AI not configured/fails: fall back to existing non-AI consolidated output (current fallback behavior).
- If mode = "per_recipe":
  - Output should be separated by recipe, showing each recipe title and its ingredient lines.
  - Do NOT consolidate across recipes.
  - Keep ordering stable: follow the weekly plan day order or recipe order as used today.
  - The output must clearly indicate recipe boundaries.

GUI rendering requirements
- In the Shop view, render per-recipe output as:
  - Heading per recipe (recipe title)
  - Bullet list of ingredients for that recipe
- For consolidated output, keep the current UI.

Telegram rendering requirements
- In Telegram, per-recipe output should be formatted like:
  - "🧾 Einkaufsliste (Pro Rezept)" (German)
  - Then for each recipe:
    - "• <Rezeptname>"
    - followed by indented ingredient lines or bullets
- Consolidated output remains as today (AI consolidated).

Backend / Architecture requirements
- Implement shop output formatting once in backend business logic (service/module).
- Both:
  - GUI shop endpoint
  - Telegram shop command handler
  must call the same shared formatter and respect the setting.

No DB schema changes
- Use app_state JSON only.
- If db-guard complains due to backend file changes, add a no-op migration file in db/migrations/ with a comment line only.

Acceptance Criteria
- Settings contains "Einkaufsliste" -> "Ausgabeformat" with options "Konsolidiert (AI)" and "Pro Rezept".
- Default is consolidated AI output (same as current).
- Switching to "Pro Rezept" changes Shop output in GUI and Telegram to show ingredients grouped per recipe (no consolidation).
- Switching back restores consolidated AI output.
- No regressions in weekly plan / shop generation.
- Frontend: npm run lint + npm run build succeed.

Local Test Plan (Must run)
1) Start dev stack:
   cd infra
   docker compose up -d --build --force-recreate

2) Prepare a weekly plan with multiple recipes.

3) Test consolidated mode (default):
   - Generate Shop via GUI and via Telegram (if configured).
   - Expect AI consolidated output.

4) Switch to per-recipe:
   - In settings, choose "Pro Rezept".
   - Generate Shop again via GUI and Telegram.
   - Expect per-recipe separated output with clear headings.

5) Switch back to "Konsolidiert (AI)" and verify behavior reverts.

Deliverable
- Branch: feat/shop-output-toggle
- Agent commits locally, does not push.
- Provide summary: changed files, where the setting is stored, and how to test.
