# Contributing

## Branching
- `main`: always deployable
- Feature branches: `feat/<short-topic>`
- Fix branches: `fix/<short-topic>`

## Workflow
1) Sync main
   - `git checkout main`
   - `git pull`
2) Create branch
   - `git checkout -b feat/<topic>`
3) Implement change
4) Verify locally
   - `make up`
   - `make api-health`
   - `make api-ping`
5) Commit + push
   - `git add -A`
   - `git commit -m "<message>"`
   - `git push -u origin <branch>`
6) Open PR into `main`

## Local dev notes
- Local reverse proxy runs on http://localhost:8080
- Use local override files (not committed):
  - `infra/docker-compose.override.yml`
  - `infra/Caddyfile.local`
