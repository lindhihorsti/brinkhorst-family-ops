Feature Brief: Add Landing Page + Use Case entry + move Health Checks + hover affordance (GUI)

Goal
Introduce a dedicated landing page (index) that serves as an entry point into multiple “use cases”, each represented by a box/card linking to its own sub-pages.
The first use case is the existing “Küchen- & Wochenplan” area (current home content). Future use cases will follow the same style.

UI Language Rules
- Feature description/instructions: English.
- UI labels and visible text: German.

Scope (Exact Changes)

0) Browser tab titles (page titles)
- Landing page (/) must set the browser tab title to: "Family Ops App"
- Use case pages must set the browser tab title to the use case name.
  For the first use case page (the moved Küchen/Wochenplan overview), set the title to: "Küchen & Wochenplan"

0b) Hover affordance for clickable boxes
- For ALL clickable “box/card” navigation elements:
  a) Landing page use case box ("Küchen- & Wochenplan")
  b) Use case page sub-option boxes/tiles (e.g., "Rezepte", "Wochenplan", and any similar navigation tiles on that page)
- On mouse hover (pointer hover), the box background should change to a LIGHT BLUE tone to indicate focus/hover.
- Text and content must remain clearly readable (maintain contrast).
- Keep hover effect subtle (no aggressive redesign). Prefer a consistent Tailwind hover utility approach.

1) New Landing Page at /
- Create a new landing page (index route) that:
  a) Shows the same Family Ops logo as used on the Recipes page header/area.
     - The logo must be ~33% larger (1/3 bigger) than on the Recipes page.
  b) Shows a “use case” box/card for:
     - Title (German): "Küchen- & Wochenplan"
     - Clicking it navigates to the existing Küchen/Wochenplan UI (moved to a new sub-route, see #2).
  c) At the bottom of the landing page, include the complete Health Checks block that is currently shown on the Recipes page.
     - This block must be moved (not duplicated): remove it from Recipes page and render it on the landing page.

2) Move existing Küchen- & Wochenplan overview off index
- The current index page content (the existing Küchen- & Wochenplan overview with its tiles/navigation) must be moved to a new route, e.g.:
  - /kueche (preferred) OR another simple route name.
- Ensure all internal navigation still works as before (Rezepte, Wochenplan, Einstellungen tiles etc. can remain as they are; only the index entry changes).

3) Remove Health Checks from Recipes page
- Remove the Health Checks block from the Recipes page entirely.
- Recipes page should still keep its own content/behavior unchanged, just without that Health block.

4) Spacing requirement between Use Case and Health Checks on landing page
- Between the Küchen- & Wochenplan use case box and the Health Checks block, add vertical spacing equivalent to TWO additional use case boxes of the same style/height.
- Implementation suggestion: render two invisible placeholder boxes with the same dimensions (e.g., opacity-0 + pointer-events-none + aria-hidden) so the spacing matches exactly and future use cases can replace them.

Constraints
- Frontend-only changes (Next.js).
- No backend changes.
- No DB changes.
- Keep styling consistent with existing components (minimal refactor).
- Do not introduce secrets.

Acceptance Criteria
- / shows a landing page with the logo (same as Recipes page) but ~33% larger.
- Landing page tab title is "Family Ops App".
- Landing page contains a clickable “Küchen- & Wochenplan” box that navigates to the moved Küchen/Wochenplan overview route.
- Use case page tab title is "Küchen & Wochenplan".
- Health Checks block appears ONLY on landing page (at the end) and is removed from Recipes page.
- The vertical gap between the use case box and Health Checks equals the height of two additional use case boxes.
- Hover behavior: all clickable navigation boxes/tiles gain a subtle light-blue background on hover; text remains readable.
- npm run lint and npm run build succeed.

Local Test Plan (Must run)
1) Start dev stack:
   cd infra
   docker compose up -d --build --force-recreate

2) UI checks:
   - Open http://127.0.0.1:8080/
     - Verify landing page loads, browser tab title is "Family Ops App".
     - Verify logo is bigger than on /recipes.
     - Verify “Küchen- & Wochenplan” box navigates to the moved route (e.g., /kueche).
     - Verify Health Checks block is at the bottom of landing page.
     - Verify the spacing between use case and Health Checks equals two box heights.
     - Hover over the use case box -> background turns light blue; text stays readable.
   - Open the use case page (e.g., /kueche)
     - Verify browser tab title is "Küchen & Wochenplan".
     - Verify the old overview content is present and works.
     - Hover over the sub-option tiles (Rezepte, Wochenplan, Einstellungen etc.) -> light blue hover background, readable text.
   - Open /recipes
     - Verify Health Checks block is NOT present anymore.
     - Verify recipes list/detail/import/archive flows still behave the same.

Deliverable
- Branch: feat/landing-page-usecases
- Agent commits locally, does not push.
- Provide a short summary: what changed, which files, and how to verify.

Implementation Notes (2026-02-23)
- Added a new landing page at `/` with the Family Ops logo (~33% larger), a single "Küchen- & Wochenplan" use case box linking to `/kueche`, two invisible placeholder boxes for spacing, and the Health Checks block moved from the old index.
- Moved the previous index content (Küchen/Wochenplan overview with tiles) to `/kueche` and set its tab title to "Küchen & Wochenplan".
- Added a subtle light-blue hover background to all clickable navigation tiles via the `.nav-tile` class.
- Added a "Home" button on `/kueche` linking back to `/`.
- Updated sub-page header buttons ("Back") on `/recipes`, `/weekly-plan`, and `/settings` to link back to `/kueche`.

Files changed:
- `frontend/app/page.tsx`
- `frontend/app/kueche/page.tsx`
- `frontend/app/globals.css`
- `frontend/app/recipes/page.tsx`
- `frontend/app/weekly-plan/page.tsx`
- `frontend/app/settings/page.tsx`

Commits:
- `feat: add landing landing page and usecase route`
- `feat: update home navigation for kueche`
- `feat: adjust navigation button labels`

Verification (manual + automated):
- `cd frontend && npm run lint`
- `cd frontend && npm run build`
- GUI: open `http://127.0.0.1:8080` and verify landing page, logo size, use case link to `/kueche`, Health Checks at bottom, hover styling.
- GUI: open `/kueche` and verify tab title, tiles, and "Home" button.
- GUI: open `/recipes`, `/weekly-plan`, `/settings` and verify "Back" button returns to `/kueche`.
