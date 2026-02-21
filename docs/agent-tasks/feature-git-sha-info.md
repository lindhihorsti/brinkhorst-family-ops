## Feature Brief: Display Git SHA in Backend + Frontend (Homepage)

### Goal
Expose and display the currently running Git commit SHA in:
1) Backend: /api/health returns git_sha
2) Frontend: homepage (frontend/app/page.tsx) shows:
   - Backend SHA (from /api/health)
   - Frontend SHA (from process.env.NEXT_PUBLIC_GIT_SHA)
3) Works in local dev (docker compose) and in CI/prod builds (GH Actions -> GHCR -> EC2).

### Scope (Do)
- Add build metadata injection for backend and frontend images via build args.
- Extend /api/health to include git_sha (additive change).
- Extend homepage UI to render both SHAs under the “Health Checks” section.

### Out of scope (Don’t)
- No other UI redesign
- No new dependencies
- No schema migrations

---

## Implementation Requirements

### Backend
- In backend/app/main.py, modify /api/health to return JSON with status and git_sha:
  {"status":"ok","git_sha":"<sha>"}
- Read SHA from env var GIT_SHA. Fallback: "local".
- Must not crash if env var missing.

### Frontend
- Frontend SHA must be available via process.env.NEXT_PUBLIC_GIT_SHA with fallback "local".
- On homepage (frontend/app/page.tsx), show under “Health Checks”:
  - Frontend SHA: <short>
  - Backend SHA: <short>
- <short> = first 7 chars; if value shorter/missing, show "local".

### Build metadata injection (CI + Local)

#### GitHub Actions
- In .github/workflows/build.yml:
  - For backend build step: pass build-arg GIT_SHA=${{ github.sha }}
  - For frontend build step: pass build-arg GIT_SHA=${{ github.sha }}

#### Dockerfiles
- backend/Dockerfile:
  - ARG GIT_SHA=local
  - ENV GIT_SHA=$GIT_SHA
- frontend/Dockerfile:
  - ARG GIT_SHA=local
  - ENV NEXT_PUBLIC_GIT_SHA=$GIT_SHA
  - Ensure the NEXT_PUBLIC_* env is present during the Next build (so it’s embedded).

#### Local docker compose
- In infra/docker-compose.yml:
  - For backend build: args: GIT_SHA: ${GIT_SHA:-local}
  - For frontend build: args: GIT_SHA: ${GIT_SHA:-local}

Local usage:
export GIT_SHA=$(git rev-parse --short HEAD)
cd infra && docker compose up -d --build --force-recreate

---

## Branch & Commit Rules
- Create branch: feat/git-sha-info
- Commit locally, do NOT push.
- Keep diff minimal, readable.

---

## Local Test Plan (Must run)
1) Rebuild stack with a local SHA:
cd ~/dev/brinkhorst-family-ops
export GIT_SHA=$(git rev-parse --short HEAD)
cd infra
docker compose down
docker compose up -d --build --force-recreate

2) Backend health includes SHA:
curl -sS http://127.0.0.1:8080/api/health ; echo
Expected: contains "git_sha":"..."

3) UI shows both SHAs:
- Open http://127.0.0.1:8080
- Under “Health Checks”, verify:
  - Frontend SHA (7 chars or local)
  - Backend SHA (7 chars or local)

---

## Deliverable
- Code changes on branch feat/git-sha-info
- Provide a short summary + list of files changed + exact test commands + expected results
- No push/merge performed by the agent
