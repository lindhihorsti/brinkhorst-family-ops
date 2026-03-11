# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

---

## Architecture

**Family Ops** is a household management app for weekly meal planning, shopping lists, and activity ideas.

### Stack
- **Frontend**: Next.js 16 + React 19 + TypeScript (`frontend/`)
- **Backend**: FastAPI + SQLModel + PostgreSQL (`backend/`)
- **Proxy**: Caddy (routes `/api/*` and `/bot/*` → backend, everything else → frontend)
- **DB (dev)**: Local Postgres in Docker
- **DB (prod)**: Supabase Postgres (no auto-migrations; manual SQL apply)

### Key backend files
- `backend/app/main.py` — all FastAPI routes (single large file)
- `backend/app/models.py` — SQLModel table definitions (`Recipe`, `AppState`)
- `backend/app/services/shop_ai.py` — OpenAI-powered shopping list generation
- `backend/app/services/shop_output.py` — shop output mode logic
- `backend/app/services/swap_service.py` — recipe swap suggestions

### Key frontend routes (Next.js App Router)
- `/` — home / weekly plan overview
- `/kueche` — kitchen / recipe browser
- `/recipes/*` — recipe detail and management
- `/weekly-plan` — weekly meal plan editor
- `/ideen/generator` — AI-powered activity ideas generator
- `/settings` — app settings

### AI integration
- Backend uses OpenAI (configured via env vars)
- `OPENAI_MODEL` — used for recipes/shopping (default: `gpt-4o-mini`)
- `OPENAI_MODEL_ACTIVITIES` — used for activity ideas (default: `gpt-5.2`)

---

## Common Commands

All dev commands run from repo root via `make`:

```bash
make up          # Start local dev stack (builds + detached)
make down        # Stop local dev stack
make logs        # Follow logs for all services
make ps          # Show container status
make build       # Rebuild images without starting
make api-health  # Smoke-check: GET /api/health (with basic auth)
make api-ping    # Smoke-check: GET /api/db/ping (with basic auth)
make psql        # Open psql shell into local dev DB
```

Local app is at `http://127.0.0.1:8080` (basic auth: dennis / dev-local-password).

### Frontend development (outside Docker)
```bash
cd frontend
npm install
npm run dev      # dev server on :3000
npm run lint     # ESLint
npm run build    # production build check
```

### Backend development (outside Docker)
There is no standalone test runner — validate via `make api-health` / `make api-ping` after `make up`.

---

## Database Schema Changes

Schema changes require a migration file — CI enforces this.

1. Modify `backend/app/models.py` (and/or `main.py` if schema-related)
2. Add `db/migrations/YYYY-MM-DD_NNN_short_desc.sql` (idempotent SQL preferred)
3. Local dev applies automatically via `AUTO_MIGRATE=1`
4. Prod: apply SQL manually in Supabase SQL Editor after merging

Migration naming: `db/migrations/YYYY-MM-DD_NNN_short_desc.sql`

---

## Git & Branch Workflow

- **Never commit directly to `main`**. Use `feat/<name>` or `fix/<name>` branches.
- Do not push or open PRs — the user does that manually.
- Commit message prefixes: `feat:`, `fix:`, `db:`, `chore:`
- Merging to `main` triggers GitHub Actions → builds GHCR images → EC2 auto-pulls `:stable` tag within ~2 min.

### Prod rollback
```bash
make rollback-prod SHA=<commitsha>
```

---

## Feature Documentation

For every task, create/update a doc in `docs/agent-tasks/` with:
- **Before**: scope, planned files, test plan
- **After**: what was implemented, validation results, follow-ups

---

## Constraints

- Do not introduce Kubernetes or anything beyond Docker Compose.
- Do not add a local Supabase stack.
- Do not modify EC2/systemd deployment unless the task is explicitly about deployment.
- API changes must be additive (backward compatible) unless explicitly permitted otherwise.
- `AUTO_MIGRATE=1` is for local dev only — never enable on prod.

---

## Agent Orchestration (Preferred Default)

For Family Ops, prefer working as an orchestrator coordinating focused sub-agents whenever the task is not trivial.

### When to orchestrate

Orchestrate by default if the task touches more than one of:

- backend
- frontend
- DB or migrations
- Telegram bot
- settings or navigation
- validation across multiple flows

Good examples:

- new use case
- feature spanning API and GUI
- dashboard plus settings plus bot integration
- migration-backed work
- changes that affect existing flows in multiple modules

Do not force orchestration for tiny isolated fixes.

### Operating model

#### 1. Orchestrator first

Before editing, the orchestrator should:

- inspect the relevant repo context
- identify impacted layers
- decide which sub-agents are needed
- define a minimal execution plan
- decide what can be parallelized safely

#### 2. Recommended sub-agents

Use the smallest useful set:

- Research agent
  - maps routes, models, UI, settings, telegram hooks, and tests
  - read-only

- Backend agent
  - FastAPI routes
  - SQLModel models
  - migrations
  - backend utilities and tests

- Frontend agent
  - Next.js routes
  - page structure
  - typed API integration
  - navigation, settings, and mobile UX

- Telegram agent
  - bot menu structure
  - callbacks
  - text flows
  - event notifications
  - keeps parity with useful GUI flows, not necessarily full duplication

- Validation agent
  - backend tests
  - frontend tests
  - typecheck
  - docker rebuild
  - targeted smoke tests

#### 3. Parallelization rules

Parallelize:

- file reading
- codebase discovery
- backend and frontend exploration
- independent implementation tracks
- test discovery and verification prep

Do not parallelize:

- two agents editing the same file
- migration design and model edits independently without coordination
- conflicting UI and API contract changes without a fixed schema first

#### 4. Merge discipline

The orchestrator should:

- integrate final code
- resolve any contract mismatches
- ensure typed frontend/backend alignment
- update `docs/agent-tasks/...`
- run final validation
- present one coherent result

### Repo-specific orchestration patterns

#### Typical Family Ops feature

Use:

- Research agent
- Backend agent
- Frontend agent
- Telegram agent if the feature has bot value
- Validation agent
- Orchestrator integrates

#### Dashboard or reporting work

Use:

- Research agent
- Backend agent for aggregation logic
- Frontend agent for KPI/report UI
- Validation agent
- Orchestrator integrates

#### DB-backed feature

Use:

- Research agent
- Backend agent
- Validation agent
- optional Frontend agent
- Orchestrator ensures migration and rollout note exist

#### Telegram-heavy feature

Use:

- Research agent
- Telegram agent
- Backend agent if new API or state is needed
- Validation agent
- Orchestrator integrates

### Sub-agent prompts should be narrow

Each sub-agent should get:

- exact scope
- files or modules to inspect
- expected output
- constraints
- whether it is read-only or implementation

Bad:

- “Implement finance feature”

Good:

- “Analyze finance-related routes, settings patterns, and navigation insertion points; output affected files and risks only”
- “Implement backend aggregation for fixed costs and add tests; do not touch frontend”
- “Implement finance dashboard page using existing card and navigation patterns; do not change backend contract”

### Validation expectations

After orchestration, the final validation path should usually include the relevant subset of:

- `PYTHONPATH=backend python3 -m unittest discover -s backend/tests -p 'test_*.py'`
- `cd frontend && npm test`
- `cd frontend && npx tsc --noEmit`
- `cd infra && docker compose up -d --build --force-recreate`
- targeted API checks
- targeted browser or UI checks

### Family Ops design consistency

The orchestrator must ensure that cross-cutting features are consistently integrated into:

- home screen
- tile layout if used
- bottom navigation if relevant
- settings if configurable
- Telegram bot if the use case benefits from mobile bot usage

Do not treat backend, frontend, and Telegram as separate products.
Integrate them coherently.

---

## Workflow

### Planning
- Enter plan mode for any non-trivial task (3+ steps or architectural decisions).
- If something goes sideways, stop and re-plan — don't keep pushing.
- Write detailed specs upfront to reduce ambiguity.

### Verification before done
- Never mark a task complete without proving it works.
- Run `make api-health` / `make api-ping` after every backend change.
- Ask: "Would a staff engineer approve this?"

### Bug fixing
- When given a bug report: just fix it. Provide the failing command, relevant log excerpt, and the minimal fix.

### Elegance check
- For non-trivial changes: pause and ask "is there a more elegant way?"
- Skip for simple, obvious fixes — don't over-engineer.

---

## Code Philosophy

- **Minimal footprint**: Only change what is necessary. No refactoring beyond the explicit request.
- **Read before editing**: Always read a file before modifying it.
- **No speculative abstractions**: Don't build helpers for hypothetical future use. Three similar lines beat a premature abstraction.
- **No defensive over-engineering**: Don't add error handling for impossible scenarios. Validate at system boundaries only.
- **No unsolicited improvements**: No extra comments, docstrings, type hints, or logging unless asked.

---

## Safety & Destructive Actions

Confirm with the user before:
- Deleting files, branches, or DB records
- `git reset --hard`, `git push --force`, `git rebase`
- Dropping tables, truncating data
- Posting to external services or modifying CI/CD

Never skip hooks (`--no-verify`) unless explicitly instructed.

---

## Communication Style

- Concise and direct — no filler.
- Reference code as `file_path:line_number`.
- When blocked: explain what's blocking and propose alternatives.
- When scope is unclear: ask one focused question before proceeding.
