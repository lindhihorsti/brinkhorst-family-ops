#!/usr/bin/env bash
# Tägliches DB-Backup (launchd, 03:00). Behält die letzten 14 Stände.
set -euo pipefail
cd "$(dirname "$0")/.."
BACKUP_DIR="${HOME}/Backups/familyops"
mkdir -p "$BACKUP_DIR"
docker compose -f infra/docker-compose.macmini.yml exec -T db \
  pg_dump -U familyops familyops | gzip > "$BACKUP_DIR/familyops_$(date +%F_%H%M).sql.gz"
ls -t "$BACKUP_DIR"/familyops_*.sql.gz | tail -n +15 | while read -r f; do rm -f "$f"; done
