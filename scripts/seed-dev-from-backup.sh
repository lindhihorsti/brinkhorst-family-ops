#!/usr/bin/env bash
# Befüllt die DEV-DB (Projekt familyops-dev) mit dem neuesten PROD-Backup
# aus ~/Backups/familyops/. Rein lesend gegenüber PROD — nutzt nur die Backup-Datei.
set -euo pipefail
cd "$(dirname "$0")/.."

BACKUP_DIR="${HOME}/Backups/familyops"
DEV="docker compose -p familyops-dev"

LATEST=$(ls -t "$BACKUP_DIR"/familyops_*.sql.gz 2>/dev/null | head -1 || true)
: "${LATEST:?Kein Backup in $BACKUP_DIR gefunden — erst scripts/backup-db.sh laufen lassen}"
echo "==> Nutze Backup: $LATEST"

echo "==> DEV-Stack starten…"
(cd infra && $DEV up -d --wait db)

echo "==> DEV-Schema zurücksetzen…"
(cd infra && $DEV exec -T db psql -q -U familyops -d familyops -v ON_ERROR_STOP=1 \
  -c "DROP SCHEMA IF EXISTS public CASCADE; CREATE SCHEMA public;")

echo "==> Backup einspielen…"
gunzip -c "$LATEST" | (cd infra && $DEV exec -T db psql -q -U familyops -d familyops)

echo "==> Fertig. Zeilen je Tabelle:"
(cd infra && $DEV exec -T db psql -U familyops -d familyops -c "
  SELECT relname AS tabelle, n_live_tup AS zeilen
  FROM pg_stat_user_tables ORDER BY relname;")
