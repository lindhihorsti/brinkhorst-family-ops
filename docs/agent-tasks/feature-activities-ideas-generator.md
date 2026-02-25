Feature Brief: New Use Case “Was unternehmen wir heute?” (GUI-only ideas generator)

Goal
Add a new top-level use case on the landing page (same level as “Küchen- & Wochenplan”):
- Use case: “Was unternehmen wir heute?”
- GUI-only (no Telegram bot support in this MVP).
- A guided wizard collects a few inputs (incl. “Tagesform & Laune”) and generates 3 activity alternatives.
- Activities must be AI-generated and may use live web research for opening hours and costs.
- App must support per-use-case model configuration (this use case uses a different OpenAI model than Küchen/Wochenplan).

UI Language Rules
- Feature description/instructions: English.
- UI labels and visible text: German.

Scope (Exact Changes)

1) Landing page: new use case box
- Add a new clickable use case box/card on the landing page (same styling/hover behavior as other use cases).
- Label (German): "Was unternehmen wir heute?"
- Hover: subtle light-blue background on hover, text remains readable.
- Clicking navigates to the new use case page route, e.g.:
  - /ideen (preferred) OR /aktivitaeten

2) New use case page (GUI-only)
Page title (browser tab): "Was unternehmen wir heute?"

Page layout:
- Header area with the same Family Ops logo pattern used across use case pages (consistent style).
- Two primary buttons:
  - Button 1 (German): "Ideen generieren"
  - Button 2 (German): "Einstellungen"

Behavior:
- Clicking "Ideen generieren" starts a guided wizard (multi-step flow).
- Clicking "Einstellungen" opens a settings page/section specific to this use case.

3) Wizard flow (guided, step-by-step)
The wizard must be guided and collect inputs via text field(s) plus simple choices.

Steps (MVP):
Step A: Rahmenbedingungen
- "Wo sind wir?" (German) text input (free text, e.g. "Zürich, Seefeld" / "Steinmaur")
- "Wie lange haben wir noch?" (German) quick options:
  - "1–2 Stunden", "2–4 Stunden", "Halber Tag", "Ganzer Tag"
- "Wie weit wollen wir fahren?" (German) select in minutes:
  - 15 / 30 / 45 / 60 / 90 / 120
- NEW special question:
  - "Wollt ihr in die Berge?" (German) toggle:
    - "Ja" / "Nein"
  - If "Ja", bias suggestions toward mountain / hiking activities (age-appropriate).

Step B: Tagesform & Laune (as discussed)
- Quick choice chips (German):
  - Energie: "low" / "mittel" / "hoch"
  - Stimmung: "ruhig" / "aktiv" / "sozial"
  - Drinnen/Draußen: "egal" / "drinnen" / "draußen"
- Optional free text field (German prompt):
  - "Worauf habt ihr heute Lust?" (text)

Step C: Generate
- Show a loading state.
- Produce exactly 3 alternatives.

Step D: Results (3 alternatives)
Each alternative must include:
- title (short, German)
- location (German; area/address-like)
- travel_time_min (integer, estimated)
- opening_hours_today (string; if unknown, clearly state "Unbekannt")
- price_hint (string; e.g. "CHF 0", "ca. CHF 20–30 p.P.", or "Unbekannt")
- duration_hint (string; e.g. "ca. 2–3 Stunden")
- why_fit (German; 1–2 sentences referencing weather/time/mood)
- sources[] (array of URLs or source titles/links used for opening hours/costs; can be empty only if none found)

Wizard controls on results:
- Button (German): "Neue Vorschläge" (re-run with same inputs; optionally slight randomization)
- Button (German): "Eingaben anpassen" (go back to previous steps)

No child profile implementation
- Do not implement a dedicated child profile UI.
- However, the prompt may include a fixed context note:
  - Leni is born in October 2024; her age must be computed dynamically at runtime and used to keep suggestions age-appropriate.

4) Settings for this use case (GUI)
Add a settings page/section reachable from "Einstellungen" button.

Suggested MVP settings (German labels):
- "Standard-Ort" (text)
- "Max. Fahrzeit (Min.)" (15/30/45/60/90/120)
- "Budget" ("niedrig", "mittel", "egal")
- "Transport" ("Auto", "ÖV", "zu Fuß", "egal")
- "Aktivitätstypen" (multi-select tags; e.g. "Spielplatz", "Zoo", "Museum", "Schwimmbad", "Wald", "Café", "Bauernhof", "Indoor-Spielplatz")
- "Wetter berücksichtigen" (toggle; default on)
- NEW:
  - "Berge bevorzugen" (toggle; default off)
  - If enabled, default wizard should preselect "Wollt ihr in die Berge?" = Ja (user can still change).

Persist settings in app_state JSON (no DB schema changes). Suggested key path:
- app_state.value JSON:
  { "activities": { "default_location": "...", "max_travel_min": 30, "budget": "mittel", "transport": "auto", "types": [...], "use_weather": true, "prefer_mountains": false } }

5) AI + live web research approach (MVP)
- Use OpenAI Responses API with tools enabled:
  - tools: [{ type: "web_search" }]
- Enforce strict JSON output schema for the 3 alternatives.
- Require sources for opening hours and costs whenever web_search is used.
- If web_search fails or returns insufficient info:
  - still return 3 alternatives, but set opening_hours_today/price_hint to "Unbekannt" and leave sources empty.
- Add basic caching for the last wizard run (optional MVP):
  - store last inputs + last results in app_state under a short-lived key to reduce repeated calls.

6) Per-use-case model configuration
- Introduce separate env/config variables for models:
  - Existing kitchen/plan model remains unchanged.
  - New use case uses a different model, e.g.:
    - OPENAI_MODEL_ACTIVITIES (default: "gpt-5.2")
- Backend must select model based on use case (not global single model).

Constraints
- GUI only (no Telegram).
- No DB schema changes (use app_state JSON).
- No secrets in repo.
- If db-guard requires a migration due to backend file changes but no schema change, add a no-op SQL file in db/migrations/ with a single comment.

Acceptance Criteria
- Landing page shows a new use case box "Was unternehmen wir heute?" with hover affordance and navigation to the new page.
- New use case page has two buttons: "Ideen generieren" and "Einstellungen".
- Wizard is guided, includes travel time up to 120 min and a "Wollt ihr in die Berge?" question.
- If mountains is enabled (wizard or settings), suggestions bias toward mountain/hiking activities.
- Wizard produces exactly 3 alternatives with required fields and sources when available.
- Settings persist and influence defaults (incl. max travel time and prefer_mountains).
- Per-use-case OpenAI model selection works (activities uses OPENAI_MODEL_ACTIVITIES).
- Frontend: npm run lint and npm run build succeed.

Local Test Plan (Must run)
1) Start dev stack:
   cd infra
   docker compose up -d --build --force-recreate

2) UI test:
   - Open landing page -> click "Was unternehmen wir heute?"
   - Run wizard with max travel 90/120 -> verify suggestions respect it.
   - Toggle "Wollt ihr in die Berge?" -> verify hiking/mountain bias.
   - Open settings -> set "Berge bevorzugen" on -> verify wizard default is mountains=Ja.

Deliverable
- Branch: feat/activities-ideas-generator
- Agent commits locally, does not push.
- Provide summary: changed files, how to test, how model selection is configured.
