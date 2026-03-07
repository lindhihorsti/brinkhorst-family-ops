## Feature

Telegram-Benachrichtigungen für neu angelegte Inhalte in den zentralen Use Cases, konfigurierbar unter `Einstellungen -> Benachrichtigungen`.

## Goal

- neue Inhalte sollen optional kurz per Telegram angekündigt werden
- Konfiguration pro Inhaltstyp, nicht nur global
- bestehende `auto_send_plan`- und `auto_send_shop`-Logik muss unverändert weiter funktionieren

## Scope

- neue Telegram-Toggles für Create-Events:
  - Rezept
  - Wochenplan
  - Aufgabe
  - Einkaufsliste
  - Ausgabe
  - Pinnwand-Notiz
  - Geburtstag
  - Familienmitglied
- kurze Telegram-Nachrichten mit knappem Inhalt
- Einstellungen in bestehender Benachrichtigungsseite ergänzen

## Backend Plan

- `settings_telegram` JSON in `app_state` additiv erweitern
- Helper zum Senden konfigurierter Create-Events über bestehenden Bot-Kanal
- Integration in bestehende `POST`-Endpoints:
  - `/api/recipes`
  - `/api/weekly/plan`
  - `/api/chores`
  - `/api/shopping-lists`
  - `/api/expenses`
  - `/api/pinboard`
  - `/api/birthdays`
  - `/api/family`

## Frontend Plan

- `Einstellungen -> Benachrichtigungen` um separaten Block für neue Inhalte ergänzen
- bestehende Auto-Send-Schalter für Plan und Shop beibehalten
- Lade-/Speicherlogik für erweiterte Telegram-Settings anpassen

## Test Plan

- `PYTHONPATH=backend python3 -m unittest discover -s backend/tests -p 'test_*.py'`
- `cd frontend && npm test`
- `cd frontend && npx tsc --noEmit`
- `cd infra && docker compose up -d --build --force-recreate frontend backend caddy`
- manuell prüfen:
  - Benachrichtigungstoggles laden und speichern
  - neue Inhalte erzeugen
  - nur aktivierte Event-Typen senden Telegram-Nachrichten

## Implemented

- `settings_telegram` additiv erweitert um Create-Event-Toggles
- Benachrichtigungsseite um separaten Block `Neue Inhalte senden` ergänzt
- neue Telegram-Create-Events für:
  - Rezepte
  - Wochenpläne
  - Aufgaben
  - Einkaufslisten
  - Ausgaben
  - Pinnwand-Notizen
  - Geburtstage
  - Familienmitglieder
- kompakte Telegram-Texte in eigenem Hilfsmodul ausgelagert
- bestehende `auto_send_plan`- und `auto_send_shop`-Logik unverändert beibehalten
- Schutz gegen Doppel-Nachricht beim Wochenplan:
  - wenn `notify=1` und `auto_send_plan` aktiv ist, wird die bestehende Volltext-Nachricht bevorzugt
  - sonst kann der neue kompakte Wochenplan-Event greifen

## Validation Results

- `PYTHONPATH=backend python3 -m unittest discover -s backend/tests -p 'test_*.py'` ✅
- `cd frontend && npm test` ✅
- `cd frontend && npx tsc --noEmit` ✅
- `cd infra && docker compose up -d --build --force-recreate frontend backend caddy` läuft/zu prüfen
