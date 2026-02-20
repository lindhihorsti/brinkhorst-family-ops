# Deployment & DB Changes (Lean: local -> prod)

## Environments
### Local (DEV)
- Reverse proxy: http://127.0.0.1:8080
- Backend routes: /api/*
- DB: local Postgres (docker compose)
- AUTO_MIGRATE=1 (local only)

Smoke:
- `make up`
- `make api-health`
- `make api-ping`

### Prod (EC2)
- Reverse proxy: Caddy on 80/443
- App containers: pulled from GHCR
- Images tracked by tag: `:stable`
- DB: Supabase Postgres via `DATABASE_URL` in EC2 `infra/.env`
- NO auto migrations on prod DB (Supabase). DB schema changes are manual via SQL scripts.

## How Prod deployment works
1) Merge to `main` triggers GitHub Action `Build Images (GHCR)`
2) Action pushes immutable tags:
   - `ghcr.io/<owner>/brinkhorst-family-ops-backend:sha-<sha>`
   - `ghcr.io/<owner>/brinkhorst-family-ops-frontend:sha-<sha>`
3) Action updates pointer tags:
   - `...-backend:stable`
   - `...-frontend:stable`
4) EC2 systemd timer runs every 2 minutes:
   - `docker compose pull`
   - compares image IDs (digest)
   - if changed => `docker compose up -d`

## Rollback (Prod)
Rollback is implemented by retagging `stable` to a previous `sha-...` tag.

### UI way
GitHub -> Actions -> "Rollback Prod (retag stable)" -> Run workflow -> input SHA.

### CLI way
`make rollback-prod SHA=<commitsha>`

## DB schema changes (Supabase)
### Rule
If a PR changes DB schema code (currently: `backend/app/models.py` or `backend/app/main.py`), the PR MUST include
a new SQL file under `db/migrations/*.sql`. CI will fail otherwise.

### Workflow
1) Implement schema changes locally (SQLModel)
2) Add migration SQL file:
   - `db/migrations/YYYY-MM-DD_NNN_short_desc.sql`
3) Merge to main (CI must be green)
4) Apply SQL in Supabase (SQL Editor)
5) Deploy runs automatically (stable updated; EC2 pulls)

### Notes
- Prefer idempotent SQL when possible (IF NOT EXISTS) for safety.
- Keep changes backward compatible when possible (add columns/tables first, then code uses them).
