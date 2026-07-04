#!/usr/bin/env bash
# Einmalige Datenübernahme Supabase -> lokaler Postgres (macmini-Compose).
# Voraussetzung: SUPABASE_DB_URL in infra/.env (Session-Pooler-URL, Port 5432).
set -euo pipefail
cd "$(dirname "$0")/.."

COMPOSE="docker compose -f infra/docker-compose.macmini.yml"
ENVF="infra/.env"
SUPABASE_DB_URL="${SUPABASE_DB_URL:-$(grep '^SUPABASE_DB_URL=' "$ENVF" | cut -d= -f2-)}"
: "${SUPABASE_DB_URL:?SUPABASE_DB_URL fehlt (infra/.env, siehe infra/.env.macmini.example)}"

DUMP=".tmp_supabase_dump.sql"

echo "==> Lokale DB starten…"
$COMPOSE up -d --wait db

echo "==> Dump aus Supabase ziehen (public-Schema, komplett)…"
docker run --rm postgres:17 pg_dump "$SUPABASE_DB_URL" \
  --schema=public --no-owner --no-privileges --clean --if-exists > "$DUMP"
echo "    $(wc -l < "$DUMP" | tr -d ' ') Zeilen -> $DUMP"

echo "==> Lokales public-Schema zurücksetzen…"
$COMPOSE exec -T db psql -q -U familyops -d familyops -v ON_ERROR_STOP=1 \
  -c "DROP SCHEMA IF EXISTS public CASCADE;"

echo "==> Restore in lokale DB…"
$COMPOSE exec -T db psql -q -U familyops -d familyops -v ON_ERROR_STOP=1 < "$DUMP"
$COMPOSE exec -T db psql -q -U familyops -d familyops -v ON_ERROR_STOP=1 \
  -c "CREATE EXTENSION IF NOT EXISTS pgcrypto;"

echo "==> Verifikation: Zeilenzahl pro Tabelle (lokal vs. Supabase)…"
TABLES=$($COMPOSE exec -T db psql -U familyops -d familyops -At \
  -c "SELECT table_name FROM information_schema.tables WHERE table_schema='public' AND table_type='BASE TABLE' ORDER BY 1")
FAIL=0
for t in $TABLES; do
  L=$($COMPOSE exec -T db psql -U familyops -d familyops -At -c "SELECT count(*) FROM public.\"$t\"")
  R=$(docker run --rm postgres:17 psql "$SUPABASE_DB_URL" -At -c "SELECT count(*) FROM public.\"$t\"")
  if [ "$L" = "$R" ]; then
    printf "    OK       %-40s %s\n" "$t" "$L"
  else
    printf "    MISMATCH %-40s lokal=%s supabase=%s\n" "$t" "$L" "$R"
    FAIL=1
  fi
done

if [ "$FAIL" = "1" ]; then
  echo "==> FEHLER: Abweichungen gefunden — Migration prüfen!" >&2
  exit 1
fi
echo "==> Migration vollständig, alle Tabellen identisch."
