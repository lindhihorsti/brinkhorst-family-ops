# Deployment & DB Changes (Mac Mini, lokal)

Prod läuft **komplett lokal auf dem Mac Mini** (Frontend, Backend, Postgres, Caddy mit
echtem TLS), erreichbar unter `https://brinkhorst-family-ops.duckdns.org`. Kein EC2,
kein Supabase, kein GHCR-Auto-Pull mehr. DEV und PROD sind zwei isolierte Compose-Stacks
aus zwei Git-Worktrees — Details siehe `docs/DEV_PROD.md`.

## Environments

### Local (DEV)
- Worktree `~/dev/brinkhorst-family-ops-local`, Branch `dev`/`feat/*`
- Compose-Projekt `familyops-dev`, `infra/docker-compose.yml`, Port `http://127.0.0.1:8080`
- DB-Volume `familyops-dev_pgdata`, `AUTO_MIGRATE=1` (nur lokal)

Smoke: `make up` → `make api-health` → `make api-ping`

### Prod (Mac Mini)
- Worktree `~/prod/brinkhorst-family-ops`, Branch `main`
- Compose-Projekt `infra`, `infra/docker-compose.macmini.yml`, Caddy auf 80/443
- DB-Volume `infra_pgdata_macmini`, `AUTO_MIGRATE=0` (kontrolliert)
- Secrets in `infra/.env` (gitignored); Basic-Auth-Passwort ≠ DEV

## Wie ein Prod-Deploy läuft

1. Feature in DEV bauen/testen (`make up`, `http://127.0.0.1:8080`).
2. Committen und nach `main` bringen (PR mergen oder push auf `main`).
3. Im **PROD-Worktree** deployen:
   ```bash
   cd ~/prod/brinkhorst-family-ops
   make deploy        # git pull --ff-only + PROD-Stack neu bauen/starten
   make macmini-ps    # Status
   ```
   `make deploy` baut die Images **aus dem PROD-Worktree-Source** (kein Registry-Pull).

> Die GitHub-Action „Build Images (GHCR)" läuft bei Push auf `main` noch, aber **nichts
> konsumiert diese Images mehr** — der echte Deploy ist `make deploy` lokal.

### ⚠️ Projektname-Kollision
DEV-Local nur über die Makefile-Targets starten (`make up/down`, Projekt `familyops-dev`).
**Nie `cd infra && docker compose …` direkt** — das nutzt den Default-Projektnamen `infra`,
identisch zum PROD-Stack, und ein verirrtes `up`/`down` kann den PROD-Stack neu bauen oder
abreißen.

## Rollback (Prod)
```bash
cd ~/prod/brinkhorst-family-ops
make rollback SHA=<commitsha>   # git checkout <sha> + PROD-Stack neu bauen
```

## Health prüfen
```bash
# öffentlich (Basic Auth mit dem PROD-Passwort aus infra/.env):
curl -u dennis:<prod-pass> https://brinkhorst-family-ops.duckdns.org/api/health
# intern ohne Auth, z. B. bei TLS-/DNS-Zweifeln:
docker exec infra-caddy-1 wget -qO- http://backend:8000/api/health
```
Die Antwort enthält `git_sha` — muss dem deployten Commit entsprechen.

## DB-Schema-Änderungen
Prod-DB migriert **nicht** automatisch (`AUTO_MIGRATE=0`). Regel: Ändert ein PR
Schema-Code (`backend/app/models.py` oder `backend/app/main.py`), MUSS eine SQL-Datei
unter `db/migrations/YYYY-MM-DD_NNN_*.sql` dabei sein — CI erzwingt das.

Ablauf:
1. Schema lokal ändern (SQLModel), Migration-SQL anlegen (idempotent, `IF NOT EXISTS`).
2. In DEV greift `AUTO_MIGRATE=1` automatisch.
3. Nach `main` mergen (CI grün).
4. Prod: `make deploy` — dann die Migration-SQL kontrolliert gegen die Prod-DB anwenden
   (`make psql` im PROD-Worktree bzw. `docker exec infra-db-1 psql -U familyops -d familyops`).
5. Änderungen möglichst rückwärtskompatibel halten (erst Spalten/Tabellen, dann Code).

Siehe auch `docs/DB_CHANGES.md` und `docs/MACMINI.md` (einmalige Einrichtung/Backup).
