#!/usr/bin/env bash
# Meldet die aktuelle öffentliche IP an DuckDNS (läuft alle 5 Min via launchd).
set -euo pipefail
ENVF="$(cd "$(dirname "$0")/.." && pwd)/infra/.env"
DOMAIN=$(grep '^DUCKDNS_DOMAIN=' "$ENVF" | cut -d= -f2-)
TOKEN=$(grep '^DUCKDNS_TOKEN=' "$ENVF" | cut -d= -f2-)
RES=$(curl -4 -fsS "https://www.duckdns.org/update?domains=${DOMAIN}&token=${TOKEN}&ip=")
[ "$RES" = "OK" ] || { echo "DuckDNS-Update fehlgeschlagen: $RES" >&2; exit 1; }
