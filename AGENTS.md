# Family Ops – Agent Playbook

## Quick start (local dev)
- Start stack: `make up`
- Status: `make ps`
- Logs: `make logs`
- Health: `make api-health`
- DB ping: `make api-ping`
- Postgres shell: `make psql`

Local dev endpoint:
- Frontend: http://localhost:8080
- Backend: http://localhost:8080/api

## Repo structure
- `frontend/` Next.js app (Dockerfile builds the app)
- `backend/` FastAPI + SQLModel app (Dockerfile runs uvicorn)
- `infra/` Docker compose + Caddy reverse proxy + Postgres

## Environment
Local dev uses docker compose with:
- Postgres service `db`
- Backend `DATABASE_URL=postgresql+psycopg://familyops:familyops@db:5432/familyops`
- Backend `AUTO_MIGRATE=1` for local schema creation

Prod uses DuckDNS domain in `infra/Caddyfile` and automatic TLS.

Local-only overrides:
- `infra/docker-compose.override.yml` (ports + local caddyfile)
- `infra/Caddyfile.local`

## Rules for changes (Definition of Done)
1) Add/modify code with minimal diffs
2) Run: `make up` and confirm:
   - `make api-health` returns JSON ok
   - `make api-ping` returns JSON ok
3) If DB schema changes:
   - Update SQLModel models
   - Ensure models imported before `SQLModel.metadata.create_all(engine)`
4) Update docs if behavior changes
5) Commit with clear message; open PR

## Common fixes
- If Caddy redirects to https locally: ensure local override uses `Caddyfile.local` and port 8080.
- If table not created: ensure `from app import models` is executed before `create_all()`.
