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

3. **Feature documentation is mandatory (before and after implementation)**
   - Before coding, create/update a feature note in `docs/agent-tasks/` describing scope, planned files, and test plan.
   - After coding, update the same feature note with what was actually implemented, validation results, and follow-ups.
   - Keep the feature doc aligned with the final diff so another reviewer can understand the change without reverse-engineering commits.

4. **Merge flow discipline**
   - Implement on feature/fix branches only; never code directly on `main`.
   - Merge to `main` only after review/approval.

5. **Minimal changes**
   - Prefer the smallest possible code change that meets the requirement.
   - Avoid refactors unless explicitly required.
   - Keep diffs reviewable.

6. **Keep backward compatibility**
   - API changes must be additive unless the task explicitly permits breaking changes.
   - UI changes should degrade gracefully when an API call fails.

7. **Deterministic builds**
   - If you add build metadata (e.g. git SHA), ensure:
     - CI provides the value (e.g. `GITHUB_SHA` build args)
     - local has safe fallback (e.g. `"local"`)

8. **Fail fast with evidence**
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

8) Mandatory Agent Orchestration (When Feasible)

For non-trivial work, tasks should be decomposed into one orchestrator plus multiple focused sub-agents whenever that reduces risk, improves parallelism, or keeps the change easier to reason about.

Default rule

Use sub-agents whenever the task includes two or more of the following:

- backend API or service changes
- frontend UI or route changes
- DB migration or schema changes
- Telegram bot changes
- settings or navigation changes
- multiple independent files or modules
- work expected to take more than a few minutes

For tiny single-file changes, a single agent is fine.

Required roles

When orchestration is used, the following logical roles should exist:

- ORCHESTRATOR
  - owns the task plan
  - reads the repo-level context first
  - decides which sub-agents are needed
  - assigns narrow scopes
  - integrates the final solution
  - resolves conflicts between parallel outputs
  - is the only role that should perform final integration unless there is a clear reason otherwise
  - is responsible for final validation and final hand-off

- RESEARCH_AGENT
  - read-only exploration
  - finds relevant routes, models, UI pages, services, settings paths, and likely regression areas
  - does not make code changes

- BACKEND_AGENT
  - handles FastAPI, SQLModel, business logic, migrations, and backend tests
  - keeps API changes additive unless explicitly allowed otherwise
  - must identify whether a SQL migration is required

- FRONTEND_AGENT
  - handles Next.js routes, typed API usage, forms, navigation, mobile behavior, and empty states
  - preserves established Family Ops design language unless the task is explicitly a redesign

- TELEGRAM_AGENT
  - handles bot menus, flows, callbacks, notifications, and mobile-first bot UX
  - ensures bot behavior remains consistent with GUI changes where relevant

- VALIDATION_AGENT
  - runs the agreed local verification path
  - checks health endpoints, relevant UI behavior, and regression-sensitive flows
  - reports exact commands and concrete pass/fail outcomes

Repo-specific decomposition guidance

For this repository, use these patterns by default:

- New feature touching GUI and API
  - RESEARCH_AGENT
  - BACKEND_AGENT
  - FRONTEND_AGENT
  - optional TELEGRAM_AGENT
  - VALIDATION_AGENT
  - ORCHESTRATOR merges and validates

- DB-backed feature
  - RESEARCH_AGENT
  - BACKEND_AGENT
  - optional FRONTEND_AGENT
  - VALIDATION_AGENT
  - ORCHESTRATOR ensures migration doc and rollout notes are included

- Bot-first feature
  - RESEARCH_AGENT
  - TELEGRAM_AGENT
  - optional BACKEND_AGENT
  - VALIDATION_AGENT
  - ORCHESTRATOR validates both bot and GUI consistency

- Pure UI bug
  - optional RESEARCH_AGENT
  - FRONTEND_AGENT
  - VALIDATION_AGENT
  - ORCHESTRATOR may collapse roles if the change is truly small

Orchestration rules

1. Plan before parallel work
   - The orchestrator must define:
     - goal
     - affected areas
     - sub-agent scopes
     - merge order
     - validation plan

2. Use narrow scopes
   - Each sub-agent should receive a focused mission.
   - Avoid overlapping ownership of the same files unless unavoidable.

3. Parallelize read-heavy work
   - Repo exploration, file reads, route discovery, and test discovery should be parallelized where possible.

4. Do not parallelize conflicting edits
   - If two agents would edit the same file or logic area, split by sequence, not by parallelism.

5. Orchestrator owns integration
   - Sub-agents may propose changes or work in isolation, but the orchestrator is responsible for:
     - reconciling outputs
     - preserving consistency
     - avoiding regressions
     - updating docs/agent-tasks

6. Validation is mandatory
   - The orchestrator must not finish without validation evidence.
   - At minimum, run the relevant subset of:
     - backend tests
     - frontend tests
     - typecheck
     - docker rebuild
     - app health checks
     - UI smoke checks

Standard sub-agent mission templates

RESEARCH_AGENT

- Goal: identify relevant files, patterns, constraints, and risks
- Output: concise dependency map and implementation guidance
- Mode: read-only

BACKEND_AGENT

- Goal: implement backend, API, model, and migration changes with minimal diff
- Output: additive backend change set plus tests
- Constraints: no secret access, no breaking API changes unless allowed

FRONTEND_AGENT

- Goal: implement GUI, routes, forms, and navigation changes in established Family Ops style
- Output: minimal typed frontend diff
- Constraints: mobile-first, graceful failure states, preserve navigation consistency

TELEGRAM_AGENT

- Goal: reflect meaningful feature behavior in bot UX where relevant
- Output: commands, menus, callbacks, and notifications consistent with the feature
- Constraints: concise mobile-friendly interactions, no GUI and bot divergence without reason

VALIDATION_AGENT

- Goal: prove the change works locally
- Output:
  - commands run
  - concrete results
  - regressions checked
  - unresolved risks if any

Family Ops-specific reminder

In this repo, many features span:

- backend route(s)
- frontend page(s)
- settings
- navigation
- Telegram
- sometimes SQL migrations

Assume orchestration is the default for such work.
Only skip sub-agents when the task is truly small and isolated.
