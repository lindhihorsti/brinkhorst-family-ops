# DEV/TEST- und PROD-Umgebung auf dem Mac Mini

Beide Umgebungen laufen auf demselben Mac Mini, sind aber vollständig isoliert
(eigene Container, Netze, DB-Volumes, Ports) und werden über **zwei Git-Worktrees**
aus **einem** Repository getrennt.

## Layout

| | DEV / TEST | PROD (live) |
|---|---|---|
| Worktree | `~/dev/brinkhorst-family-ops-local` | `~/prod/brinkhorst-family-ops` |
| Branch | `feat/*`, `dev` … | `main` |
| Compose-Projekt | `familyops-dev` | `infra` |
| Compose-Datei | `infra/docker-compose.yml` | `infra/docker-compose.macmini.yml` |
| Zugriff | `http://127.0.0.1:8080` (Basic Auth) | `https://brinkhorst-family-ops.duckdns.org` (80/443, TLS) |
| DB-Volume | `familyops-dev_pgdata` | `infra_pgdata_macmini` |
| Migrationen | `AUTO_MIGRATE=1` (automatisch) | `AUTO_MIGRATE=0` (kontrolliert) |
| Quelle des Builds | Arbeits-Working-Tree | fester Checkout auf `main` |

Docker isoliert alles anhand des Projektnamens. Kollisionen gibt es nur bei Host-Ports —
und DEV (8080) und PROD (80/443) überschneiden sich nicht.

## Täglicher Workflow

```bash
# 1. Im DEV-Worktree entwickeln
cd ~/dev/brinkhorst-family-ops-local
git switch -c feat/mein-feature
make up            # DEV-Stack (baut aus dem Working-Tree), http://127.0.0.1:8080
make dev-seed      # optional: DEV-DB mit neuestem PROD-Backup füllen
# … Code ändern, testen …
make logs          # Logs des DEV-Stacks

# 2. Zufrieden? Committen und pushen
git add -p && git commit -m "feat: …"
git push -u origin feat/mein-feature
# auf GitHub PR nach main öffnen und mergen (oder lokal: git switch main && git merge …)

# 3. Deployen (im PROD-Worktree)
cd ~/prod/brinkhorst-family-ops
make deploy        # git pull --ff-only + PROD-Stack neu bauen/starten
make macmini-ps    # Status prüfen
```

## Warum zwei Worktrees?

Der PROD-Stack baut **ausschließlich** aus dem PROD-Worktree, der fest auf `main` steht.
Dadurch kann uncommitteter oder ungetesteter Code aus dem DEV-Tree niemals versehentlich
live gehen. Ein Rollback ist nur ein Checkout:

```bash
cd ~/prod/brinkhorst-family-ops
make rollback SHA=<commitsha>
```

## Einmalige Einrichtung des PROD-Worktrees

```bash
cd ~/dev/brinkhorst-family-ops-local
git worktree add ~/prod/brinkhorst-family-ops main
cp infra/.env ~/prod/brinkhorst-family-ops/infra/.env   # Secrets sind gitignored
```

## Secrets pro Umgebung (getrennt)

- **PROD** liest `infra/.env` (echte Secrets, echtes Passwort, Telegram-Token).
- **DEV** liest `infra/.env.dev` (eigenes Dev-Passwort, Telegram bewusst leer) — die
  DEV-Compose-Targets sind mit `--env-file .env.dev` verdrahtet. Vorlage:
  `cp infra/.env.dev.example infra/.env.dev`. Beide Dateien sind gitignored.

Danach läuft PROD aus `~/prod/brinkhorst-family-ops`. Die launchd-Jobs (DuckDNS, Backup)
zeigen weiterhin auf die Skripte — bei Bedarf auf den PROD-Worktree-Pfad umstellen.

## Wichtig

- **DB-Volumes sind getrennt.** `make dev-seed` kopiert Daten nur aus dem PROD-*Backup*
  in die DEV-DB — die Live-DB wird dabei nie berührt.
- **Nie den PROD-Stack aus dem DEV-Worktree bauen.** Immer `~/prod/...` für Deploys.
- Migrationen: in DEV automatisch (`AUTO_MIGRATE=1`); für PROD Migrations-SQL nach
  `db/migrations/` legen und beim Deploy kontrolliert anwenden (siehe `docs/DB_CHANGES.md`).
