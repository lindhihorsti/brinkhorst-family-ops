# AGENTS.md — Family Ops (Repo Rules for AI Agents)

You are an AI coding agent working in the **Family Ops** repository.
Your job is to implement requested features safely and deliver changes that the user can review locally before pushing to production.

---

## 1) Non-Negotiable Rules (Safety & Discipline)

1. **Never touch secrets**
   - Do NOT read, print, or commit secrets or `.env` files.
   - Do NOT echo environment variables.
   - Do NOT paste connection strings, tokens, keys, passwords into code or logs.

2. **No direct work on `main`**
   - Always create a branch: `feat/<name>` or `fix/<name>`.
   - Never force-push. Never rewrite shared history.
   - Commit locally only. The user decides when to push/merge.

3. **Minimal changes**
   - Prefer the smallest possible code change that meets the requirement.
   - Avoid refactors unless explicitly required.
   - Keep diffs reviewable.

4. **Keep backward compatibility**
   - API changes must be additive unless the task explicitly permits breaking changes.
   - UI changes should degrade gracefully when an API call fails.

5. **Deterministic builds**
   - If you add build metadata (e.g. git SHA), ensure:
     - CI provides the value (e.g. `GITHUB_SHA` build args)
     - local has safe fallback (e.g. `"local"`)

6. **Fail fast with evidence**
   - If something breaks, provide:
     - the failing command
     - the relevant log excerpt
     - the minimal fix

---

## 2) Repo Architecture (What you are working with)

### Core components
- **Frontend:** Next.js (containerized)
- **Backend:** FastAPI (containerized)
- **DB:** PostgreSQL
  - DEV: local Docker Postgres
  - PROD: Supabase Postgres

### Reverse proxy
- **Caddy** routes:
  - `/` → frontend
  - `/api/*` → backend

### Environments
- **Local DEV:** `infra/docker-compose.yml` (Caddy on `http://127.0.0.1:8080`)
- **PROD:** EC2 uses GHCR images (`:stable` and `:sha-<sha>`), DB is Supabase

---

## 3) Default Local Workflow (Must Use)

### Start / Rebuild DEV stack
```bash
cd infra
docker compose down
docker compose up -d --build --force-recreate
docker compose ps

Health checks
curl -sS http://127.0.0.1:8080/api/health ; echo
curl -sS http://127.0.0.1:8080/api/db/ping ; echo
Logs
cd infra
docker compose logs --tail=200 backend
docker compose logs --tail=200 frontend
docker compose logs --tail=200 caddy

UI: http://127.0.0.1:8080

4) Database Policy (DEV ↔ PROD Schema Sync)
Single source of truth

All schema changes must be captured as SQL migrations in:

db/migrations/*.sql

Migrations are append-only and should be safe to apply to PROD.

Rules

If you change any model that affects schema, you must add a migration file.

Do not rely on runtime ORM auto-create in production.

Prefer idempotent SQL where possible (IF NOT EXISTS) unless task requires strict failure.

5) Coding Guidelines
Backend (FastAPI)

Keep endpoints small, predictable, and fast.

Prefer additive changes.

Handle missing env variables safely (fallback values).

Avoid importing secrets into logs.

Frontend (Next.js)

Keep UI resilient if APIs fail (show placeholders / “unknown”).

Avoid heavy refactors.

Prefer typed, minimal state changes.

6) How to Work on Any Task (Mandatory Steps)

Create a branch

git checkout -b feat/<short-name> or fix/<short-name>

Plan (brief)

List files to change

List commands you will run to test

Implement

Make the minimum change set

Test locally

Rebuild stack

Run health checks

Verify the UI behavior

Commit locally

Use clear commit messages:

feat: ..., fix: ..., db: ..., chore: ...

Hand-off

Provide:

summary (what changed)

files changed

exact test commands

expected outputs

risks/notes

Do NOT push or merge. The user will do that manually.

7) Hard Restrictions (Do NOT do these unless explicitly asked)

Do not introduce Kubernetes or any orchestrator beyond Docker Compose.

Do not add a local Supabase stack.

Do not change EC2/systemd deployment unless the task is explicitly about deployment.

Do not add heavy new dependencies without justification.
