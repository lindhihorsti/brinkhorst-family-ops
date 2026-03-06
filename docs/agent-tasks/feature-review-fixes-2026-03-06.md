## Feature Brief: Review-Fixes aus konkretem Code-Review

### Goal
Die im Review identifizierten Risiken direkt beheben und mit gezielten Tests absichern:
1) Next.js-Konfiguration konsolidieren, damit der Standalone-Build verlässlich funktioniert.
2) Geburtstagslogik robust gegen den 29. Februar machen.
3) Expense-Datenmodell auf stabile Familien-IDs umstellen, ohne bestehende Daten zu verlieren.
4) KPI "Offener Saldo" fachlich korrekt berechnen.

### Scope (Do)
- Doppelte bzw. widersprüchliche Next-Konfiguration bereinigen.
- Birthday-Hilfsfunktionen und betroffene Aufrufer so anpassen, dass Schaltjahrfälle nicht crashen.
- Backend-Expense-API additive Felder für Personen-IDs ergänzen und Auswertungen stabilisieren.
- Frontend-Expense-Flow auf IDs umstellen.
- Gezielt fehlende Backend- und Frontend-Tests ergänzen.

### Out of scope (Don't)
- Keine großen Refactorings der FastAPI-Struktur.
- Keine Änderungen an Secrets oder Deployment-Topologie.
- Keine breaking DB-Migration, sofern die Korrektur additive kompatibel lösbar bleibt.

---

## Planned File Changes
- `frontend/next.config.ts`
- `frontend/next.config.js`
- `frontend/app/lib/api.ts`
- `frontend/app/split/page.tsx`
- `frontend/app/split/neu/page.tsx`
- `frontend/app/split/auswertung/page.tsx`
- `backend/app/main.py`
- `backend/app/models.py`
- `backend/tests/*` (neu)
- `frontend/tests/*` (neu)
- optional `frontend/package.json` / `backend/requirements.txt` falls Test-Runner nötig sind

## Planned Test Commands
1) `cd backend && pytest`
2) `cd frontend && npm test`
3) Optional: selektive zusätzliche Checks, falls ein Runner-Konfigfile nötig ist

## Review Findings Addressed
- Widerspruch zwischen `next.config.ts` und `next.config.js`
- Birthday-Crash bei 29. Februar in Nicht-Schaltjahren
- Expense-Zuordnung über Namen statt stabile IDs
- Falsch berechneter "Offener Saldo"

## Notes
- Falls für die Expense-ID-Umstellung eine additive Migration sinnvoller ist als reine API-Logik, wird eine SQL-Migration unter `db/migrations/` ergänzt.

---

## Implemented
- Next-Konfiguration konsolidiert:
  - `frontend/next.config.ts` setzt jetzt `output: "standalone"`
  - widersprüchliche `frontend/next.config.js` entfernt
- Geburtstagslogik in ein testbares Hilfsmodul ausgelagert und robust für 29. Februar gemacht
- Telegram-Birthday-Ausgaben ebenfalls auf die robuste Datumslogik umgestellt
- Expense-Modell und API additiv um stabile Member-IDs erweitert:
  - `paid_by_member_id`
  - `split_among_member_ids`
- Neue SQL-Migration ergänzt, damit die Expense-ID-Felder lokal und in Prod sauber nachziehbar sind
- Expense-Reporting aggregiert Personen jetzt ID-basiert, zeigt aber weiterhin menschenlesbare Namen an
- KPI `open_balance` berechnet jetzt die Summe aller offenen Transfers statt nur des größten Einzelbetrags
- Frontend-Expense-Erfassung baut Payloads jetzt aus Familien-IDs und Namen zusammen

## Tests Added
- Backend-Unittests für:
  - 29.-Februar-Berechnung
  - ID-basierte Expense-Balance-Namensauflösung
- Frontend-Node-Tests für:
  - Next-Standalone-Config
  - Expense-Payload-Bildung mit stabilen Member-IDs

## Validation Results
1) `PYTHONPATH=backend python3 -m unittest discover -s backend/tests -p 'test_*.py'`
- Ergebnis: 3 Tests, alle erfolgreich

2) `cd frontend && npm test`
- Ergebnis: 3 Tests, alle erfolgreich

3) `cd frontend && npx tsc --noEmit`
- Ergebnis: erfolgreich

4) Lokaler Docker-Runtime-Test
- `cd infra && docker compose up -d --build --force-recreate`
- `GET /api/health` erfolgreich
- `GET /api/db/ping` erfolgreich
- `GET /api/birthdays` mit lokal angelegtem `2000-02-29`-Datensatz erfolgreich
- `POST /api/expenses` mit `paid_by_member_id` und `split_among_member_ids` erfolgreich
- `GET /api/expenses/balance` und `GET /api/expenses/report` erfolgreich

## Follow-ups / Residual Risk
- Bestehende Expense-Datensätze ohne Member-IDs bleiben aus Legacy-Gründen namensbasiert; neue Datensätze sind stabil.
- Für vollständige historische Normalisierung wäre eine separate Backfill-Migration nötig, falls alte Ausgaben eindeutig Familienmitgliedern zugeordnet werden können.
