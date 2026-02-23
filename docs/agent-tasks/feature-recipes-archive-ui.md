Feature Brief: Archive recipes (soft delete) via GUI (MVP)

Goal
Add a simple “archive” workflow for recipes (soft delete). Archiving means: keep the DB row, but hide it from the normal UI by setting is_active=false.
- Add a button labeled "Archivieren" in BOTH the recipe list and the recipe detail view.
- Show a short confirmation dialog before archiving.
- After confirmation, set the recipe’s is_active=false in the database.
- No restore UI in this MVP (reactivation can be done manually in DB).

Constraints
- No DB schema changes.
- Must not break Telegram bot behavior.
- Default recipe list must continue to show only active recipes.

Backend Requirements

1) New endpoint: Archive (soft delete)
Preferred route:
  POST /api/recipes/{id}/archive

Behavior:
- Validate id as UUID
- Update: UPDATE recipes SET is_active=false WHERE id=:id
- If 0 rows affected -> 404 with:
  { "ok": false, "error": "Recipe not found" }
- Success response:
  { "ok": true, "id": "<uuid>", "is_active": false }

2) Existing list behavior
- Keep existing behavior: recipe list endpoint returns only is_active=true.
- Do NOT add any “include archived” logic in MVP.

DB-guard note
- If backend/app/main.py changes, add a no-op migration file to satisfy db-guard:
  db/migrations/000X_recipes_archive_no_schema_change.sql
  Content: a single comment line.

Frontend Requirements

1) Recipe list (/recipes)
- Add a per-item button labeled: "Archivieren"
- On click: show a confirm dialog (MVP: window.confirm is fine).
  Confirm text (German label required):
  "Rezept wirklich archivieren? (Kann später manuell in der DB reaktiviert werden.)"
- On confirm:
  - Call POST /api/recipes/{id}/archive
  - Refresh list so the archived item disappears
- Error handling:
  - Show a small inline error message or toast if archiving fails.

2) Recipe detail (/recipes/[id] or equivalent)
- Add a button labeled: "Archivieren"
- Same confirm dialog text as above
- After successful archive:
  - Redirect to /recipes (MVP recommended)

3) No restore UI in MVP
- No “show archived” toggle
- No “Reaktivieren” button

Local Test Plan (Must run)
1) Start dev stack:
   cd infra
   docker compose up -d --build --force-recreate

2) API test:
   - Get list (must include some recipe)
   - Archive one:
     curl -sS -X POST http://127.0.0.1:8080/api/recipes/<uuid>/archive ; echo
   - Get list again: archived recipe must be missing (is_active=false)
   - Verify in DB:
     docker compose exec -T db psql -U familyops -d familyops -c "select id,title,is_active from recipes order by created_at desc limit 5;"

3) UI test:
   - /recipes: click "Archivieren" -> confirm -> recipe disappears
   - Detail view: click "Archivieren" -> confirm -> redirect -> recipe not shown in list

Deliverable
- Branch: feat/recipes-archive
- Agent commits locally, does not push
- Provide a short summary: what changed, where, and how to test
