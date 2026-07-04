# Mac Mini als Produktions-Server

Die App läuft komplett lokal auf dem Mac Mini (Frontend, Backend, Postgres, Caddy mit
echtem TLS) und ist über `https://brinkhorst-family-ops.duckdns.org` aus dem Internet
erreichbar. Ersetzt EC2 + Supabase.

## 1. Einmalige Einrichtung

**Docker:** Docker Desktop installieren und in den Einstellungen
*Start Docker Desktop when you sign in* aktivieren. Die Container haben
`restart: unless-stopped` — nach einem Neustart des Macs kommt alles von selbst wieder hoch.

**Secrets:**

```bash
cp infra/.env.macmini.example infra/.env
```

Werte eintragen — `DENNIS_PWHASH`, `TELEGRAM_BOT_TOKEN`, `TELEGRAM_ALLOWLIST`,
`OPENAI_API_KEY` stehen aktuell in der `infra/.env` auf der EC2-Maschine
(per SSH kopieren). Zusätzlich:

- `SUPABASE_DB_URL`: Supabase Dashboard → *Connect* → **Session Pooler** (Port 5432)
  wählen, nicht die Direct Connection (die ist IPv6-only und schlägt aus Docker oft fehl).
- `DUCKDNS_TOKEN`: von https://www.duckdns.org (eingeloggt oben auf der Seite).

**Start:**

```bash
make macmini-up
```

## 2. Datenübernahme aus Supabase

```bash
make migrate-supabase
```

Zieht einen kompletten Dump des `public`-Schemas (Struktur + alle Daten), spielt ihn in
den lokalen Postgres ein und vergleicht danach die Zeilenzahl jeder Tabelle mit Supabase.
Das Script ist wiederholbar (`--clean`): Beim Cutover einfach nochmal laufen lassen, um
zwischenzeitliche Änderungen mitzunehmen.

## 3. Erreichbarkeit aus dem Internet

1. **Feste lokale IP:** Im Router dem Mac Mini eine feste IP zuweisen (DHCP-Reservierung).
2. **Portfreigabe:** Im Router TCP 80 + TCP/UDP 443 auf den Mac Mini weiterleiten.
3. **DuckDNS umstellen:** launchd-Job laden — er meldet ab sofort alle 5 Minuten die
   Heim-IP an DuckDNS (löst auch dynamische IP-Wechsel):

   ```bash
   cp launchd/com.familyops.duckdns.plist ~/Library/LaunchAgents/
   launchctl load ~/Library/LaunchAgents/com.familyops.duckdns.plist
   ```

4. **Prüfen:** `dig +short brinkhorst-family-ops.duckdns.org` muss die Heim-IP zeigen
   (Vergleich: `curl -s ifconfig.me`). Danach holt sich Caddy automatisch ein
   Let's-Encrypt-Zertifikat (Log: `make macmini-logs`).

## 4. Cutover-Checkliste

1. Auf EC2 die Container stoppen (`docker compose down`), damit nur noch der Mac bedient.
2. `make migrate-supabase` nochmal laufen lassen (letzter Datenabgleich).
3. launchd-Job laden (Schritt 3 oben) und warten, bis DNS auf die Heim-IP zeigt.
4. Smoke-Test **vom Handy über Mobilfunk** (WLAN aus): App öffnen, einloggen, Daten prüfen.
5. Telegram-Webhook prüfen (URL bleibt gleich, sollte unverändert funktionieren):

   ```bash
   curl -s "https://api.telegram.org/bot<TOKEN>/getWebhookInfo"
   ```

   `pending_update_count` sollte auf 0 fallen und `last_error_message` leer sein.

## 5. Backup

Tägliches Backup um 03:00 nach `~/Backups/familyops/` (14 Stände):

```bash
cp launchd/com.familyops.backup.plist ~/Library/LaunchAgents/
launchctl load ~/Library/LaunchAgents/com.familyops.backup.plist
```

Restore im Notfall:

```bash
gunzip -c ~/Backups/familyops/familyops_<DATUM>.sql.gz | \
  docker compose -f infra/docker-compose.macmini.yml exec -T db psql -U familyops -d familyops
```

## 6. Rückbau (erst nach ein paar Tagen fehlerfreiem Betrieb)

- EC2-Instanz stoppen, später terminieren (Elastic IP freigeben!).
- Supabase-Projekt pausieren (Dashboard → Settings → Pause project) — nicht sofort
  löschen, es ist das Fallback.

## Hinweise

- **Auth** bleibt Caddy Basic Auth (`dennis` + Passwort), identisch zu vorher.
- Der Telegram-Webhook-Pfad `/bot/telegram/webhook*` bleibt öffentlich (ohne Basic Auth),
  wie bisher — konfiguriert im bestehenden `infra/Caddyfile`, das auch der Mac Mini nutzt.
- Mac Mini: Ruhezustand deaktivieren (Systemeinstellungen → Energie →
  *Bei Netzwerkzugriff aufwachen* + nie schlafen legen), sonst ist die App nachts weg.
