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

## Agent Orchestration

For complex tasks (>5 min / multiple files / architectural decisions): decompose into parallel sub-agents.

### Sub-Agent Spawn Protocol
```
SUB-AGENTS DEPLOYED:
├── 🕵️ RESEARCH_AGENT:        Codebase exploration, architecture analysis, dependency mapping
├── 👨‍💻 IMPLEMENTATION_AGENT: Core feature development (backend / frontend / DB)
├── 🧪 VALIDATION_AGENT:      Smoke tests, health checks, behavior verification
└── 📊 COORDINATOR_AGENT:     Merge results, resolve conflicts, deliver final diff
```

### Mission Lifecycle
1. ANALYZE → Identify complexity, spawn sub-agents with precise scopes
2. PARALLEL EXECUTION → Sub-agents work independently
3. MERGE → Coordinator combines results, resolves conflicts
4. VALIDATE → `make api-health`, `make api-ping`, UI smoke check
5. COMPLETE → Summary: files changed, test commands, expected output, risks

### Sub-Agent Templates

**RESEARCH_AGENT**
```
MISSION: Explore [area] of the codebase — routes, models, services, frontend pages
OUTPUT: Structured summary of relevant files, patterns, and dependencies
SCOPE: Read-only, no changes
```

**IMPLEMENTATION_AGENT**
```
MISSION: Implement [feature/fix] per spec
OUTPUT: Minimal diff — backend route / model / service / frontend page
REQUIREMENTS: Additive changes, no side effects, feature branch only
```

**VALIDATION_AGENT**
```
MISSION: Verify [feature] against acceptance criteria
OUTPUT: Pass/fail for each criterion + exact commands run
STEPS: make up → make api-health → make api-ping → UI check
```

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
