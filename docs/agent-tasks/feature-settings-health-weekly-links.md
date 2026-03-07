## Feature

Health-Block aus der Startseite in die Einstellungen verschieben und Wochenplan-Rezepte direkt zur Ursprungsquelle verlinken.

## Scope

- Startseite: System-/Health-Block entfernen
- Einstellungen: System-/Health-Block am Seitenende anzeigen
- Wochenplan: Rezepttage klickbar machen
- Link-Ziel:
  - externe `source_url`, wenn vorhanden
  - sonst interne Rezeptdetailseite `/recipes/[id]`

## Planned Files

- `frontend/app/page.tsx`
- `frontend/app/einstellungen/page.tsx`
- `frontend/app/weekly-plan/page.tsx`
- `frontend/app/lib/system-status.tsx`
- `frontend/app/lib/weekly-plan-links.mjs`
- `frontend/tests/weekly-plan-links.test.mjs`
- `backend/app/main.py`

## API / Data Notes

- Weekly-API wird additiv erweitert: `days[].source_url`
- Kein Schema-Change erforderlich

## Test Plan

- `cd frontend && npm test`
- `cd frontend && npx tsc --noEmit`
- `cd infra && docker compose up -d --build --force-recreate frontend backend caddy`
- `curl -sS http://127.0.0.1:8080/api/health`
- Wochenplan lokal prüfen:
  - Rezept mit `source_url` öffnet externe Seite
  - Rezept ohne `source_url` öffnet interne Detailseite
  - Health-Block erscheint nur noch in Einstellungen

## Implemented

- gemeinsamer `SystemStatus`-Block als wiederverwendbare Frontend-Komponente ausgelagert
- System-/Health-Block von der Startseite entfernt
- System-/Health-Block am Ende der Einstellungsseite eingefügt
- Weekly-API additiv erweitert um `days[].source_url`
- Wochenplan-Tage mit Rezepten klickbar gemacht
- Linklogik:
  - `source_url` hat Vorrang
  - Fallback auf `/recipes/[id]`
- kleiner Regressionstest für die Wochenplan-Linkentscheidung ergänzt

## Validation Results

- `cd frontend && npm test` ✅
- `cd frontend && npx tsc --noEmit` ✅
- `cd infra && docker compose up -d --build --force-recreate frontend backend caddy` ✅
- `docker compose ps` ✅
- nackte `curl`-Aufrufe auf `http://127.0.0.1:8080/api/health` und `/api/weekly/current` lieferten lokal `401`, da die App in dieser Umgebung Auth vor dem API-Zugriff verlangt

## Notes

- kein DB-Schema-Change
- Backend-Änderung ist rein additiv, bestehende Weekly-Clients bleiben kompatibel
