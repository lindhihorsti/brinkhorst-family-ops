# Feature Brief: UI Refactor / Cleanup (Home + Recipes)

## IMPORTANT (Agent Rules)
- Read `AGENTS.md` in the repo first and follow the overall agent instructions.
- No secrets. No backend changes. No DB changes. Frontend-only.
- Keep changes minimal and consistent with existing styling/layout patterns.

## Goal
Small UI improvements and copy cleanup in the Next.js frontend. No changes to APIs, data, or infrastructure.

## Scope (Exact Changes)

### Home (Overview page)
1) Logo spacing: Move the Family Ops logo slightly DOWN so it is not flush to the top edge.
2) Logo-to-headline gap: Reduce vertical spacing between logo and the headline "Küchen & Wochenplan".
3) "Wochenplan" tile content: Replace the current commands-style list with these exact user-facing lines:
   - Woche planen
   - Rezepte austauschen
   - Einkaufsliste erstellen
4) Health Checks alignment: Move/align the Overall Status box further LEFT so it is horizontally flush with the first API traffic light (same left edge). Keep the rest unchanged.

### Recipes page
5) Remove the text: "Mobile-first · gleicher Stil wie Home" (must not appear anywhere in /recipes).
6) In the archive confirmation popup/dialog, remove the text:
   "(Kann später manuell in der DB reaktiviert werden.)"

## Non-Goals
- No new features.
- No redesign.
- No changes to Caddy/Basic Auth/Telegram routes.
- No backend code modifications.

## Implementation Notes / How to Find the Code
- Use ripgrep to locate the relevant UI:
  - Search for: "Küchen & Wochenplan", "Wochenplan", "Mobile-first", "Kann später manuell"
- Home page likely in `frontend/app/page.tsx` (or similar).
- Recipes page likely in `frontend/app/recipes/...`
- Archive dialog likely in a reusable dialog component.

Preferred approach:
- Adjust spacing using existing wrappers + Tailwind utilities (pt-*, mt-*, gap-*) without introducing new layout systems.
- For Health Checks alignment, adjust grid/flex container structure so Overall Status aligns with the first API light left edge.

## Acceptance Criteria
- Logo is clearly lower than before (not glued to top of page).
- The gap between logo and "Küchen & Wochenplan" is smaller than before.
- The "Wochenplan" tile shows exactly the three specified lines (German), instead of a command list.
- In Health Checks, Overall Status left edge is aligned with the first API traffic light left edge.
- The removed texts do not appear anywhere in the UI.
- npm run lint and npm run build succeed.

## Workflow / Commands (Local Dev)

### Create branch (from repo root)
- git checkout main
- git pull
- git checkout -b feat/ui-home-recipes-tidy

### Locate code fast (from frontend/)
- rg -n "Küchen\\s*&\\s*Wochenplan" .
- rg -n "Mobile-first" .
- rg -n "Kann später manuell" .
- rg -n "Wochenplan" app components .

### Validate (frontend/)
- npm install
- npm run lint
- npm run build

### Optional: run full stack locally (with Basic Auth via Caddy) (from infra/)
- docker compose down
- docker compose up -d --build --force-recreate
- Open: http://127.0.0.1:8080 (browser will ask for Basic Auth)

### Commit + push (from repo root)
- git add -A
- git commit -m "feat(ui): tidy home layout and recipes copy"
- git push -u origin feat/ui-home-recipes-tidy

### After merge (optional PROD smoke)
- curl -I https://brinkhorst-family-ops.duckdns.org/   (expect 401 without auth)
- curl -u dennis:<pw> https://brinkhorst-family-ops.duckdns.org/api/health

## Codex Prompt (copy/paste)
You are working in the public repo `brinkhorst-family-ops`. First read and follow `AGENTS.md`.
Implement the frontend-only UI changes described in this brief. Do not change backend or DB.

Constraints:
- No backend changes.
- No DB changes.
- Minimal, consistent styling changes only.
- Do not introduce secrets.

Steps:
1) Locate relevant components/pages using ripgrep for:
   - "Küchen & Wochenplan"
   - "Wochenplan"
   - "Mobile-first"
   - "Kann später manuell"
2) Home page:
   - Move the Family Ops logo slightly down (increase top padding/margin).
   - Reduce spacing between logo and headline "Küchen & Wochenplan".
   - Update the "Wochenplan" tile to display these exact lines:
     "Woche planen", "Rezepte austauschen", "Einkaufsliste erstellen".
   - In Health Checks, align the Overall Status box to the left so it is flush with the first API traffic light’s left edge.
3) Recipes:
   - Remove the text "Mobile-first · gleicher Stil wie Home".
   - Remove "(Kann später manuell in der DB reaktiviert werden.)" from the archive confirmation dialog.
4) Run `npm run lint` and `npm run build` in `frontend/` and fix any issues.
5) Provide a short summary: which files changed + what was updated.
