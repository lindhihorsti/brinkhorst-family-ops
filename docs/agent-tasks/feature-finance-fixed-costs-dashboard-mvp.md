# Feature Note: Finanzen / Fixkosten Dashboard MVP

## Scope
- neuer Haupt-Use-Case `Finanzen` im Family-Ops-Design
- wiederkehrende Fixkosten manuell erfassen, bearbeiten und deaktivieren
- monatsbezogene Einkommen fuer `Dennis` und `Julia` pflegen
- Dashboard fuer `Gesamt`, `Dennis` und `Julia`
- einfache Copy-Funktion: Einkommen aus dem Vormonat in den aktuellen Monat uebernehmen
- Telegram-Menue und kompakte Reports fuer Finanzen ergaenzen

## Repo-Konformer Zuschnitt
- kein `household_id`, da Family Ops aktuell kein echtes Multi-Household-Modell nutzt
- monatliche Einkommen nicht als statische Settings, sondern als eigene Monatsdaten
- gemeinsame Sicht und persoenliche Sicht parallel abbilden
- bestehende `Split`-Logik unangetastet lassen

## Planned Files
- `backend/app/main.py`
- `backend/app/models.py`
- `backend/app/domain_utils.py` oder neues `backend/app/finance_utils.py`
- `backend/app/telegram_events.py`
- `backend/tests/...`
- `db/migrations/...`
- `frontend/app/page.tsx`
- `frontend/app/lib/ui.tsx`
- `frontend/app/lib/api.ts`
- `frontend/app/finanzen/...`
- `frontend/app/einstellungen/page.tsx`
- ggf. `frontend/tests/...`

## Data Model
- `fixed_expenses`
  - name, provider, category, amount, interval, next_due_date
  - responsible_party: `dennis | julia | gemeinsam`
  - optional weitere MVP-Felder aus dem Brief
  - `is_active`
- `finance_monthly_incomes`
  - month_start
  - person: `dennis | julia`
  - net_income_amount
  - notes optional

## Reporting / Dashboard
- KPIs gesamt
- KPIs pro Person
- Verantwortlichkeitsverteilung
- Kategorienranking
- Top-Kostentreiber
- Fellige Positionen in den naechsten 30 Tagen
- nicht-monatliche Kosten separat sichtbar

## Test Plan
- Backend-Unit-Tests fuer Normalisierung, Felligkeit und Dashboard-Aggregation
- Frontend-Tests fuer leeren und befuellten Dashboard-Zustand
- `PYTHONPATH=backend python3 -m unittest discover -s backend/tests -p 'test_*.py'`
- `cd frontend && npm test`
- `cd frontend && npx tsc --noEmit`
- `cd infra && docker compose up -d --build --force-recreate`

## Implemented
- neuer Haupt-Use-Case `Finanzen` auf Home, Bottom-Navigation und Telegram-Hauptmenü
- neue Tabellen:
  - `fixed_expenses`
  - `finance_monthly_incomes`
- monatsbezogenes Einkommen pro Person (`Dennis`, `Julia`) mit Haushalts-Summe
- Copy-Funktion: Einkommen aus dem Vormonat in den gewählten Monat übernehmen
- Dashboard für `Gesamt`, `Dennis`, `Julia`
- Fixkostenliste mit Filtern und Detail-/Bearbeitungsseite
- Create/Edit für Fixkosten
- Telegram-Menü für Finanzübersicht, Fälligkeiten, Personenansicht und neue Fixkosten
- Telegram-Notification-Schalter für `Neue Fixkosten`

## Validation
- `python3 -m py_compile backend/app/main.py backend/app/finance_utils.py backend/app/telegram_events.py` ✅
- `PYTHONPATH=backend python3 -m unittest discover -s backend/tests -p 'test_*.py'` ✅
- `cd frontend && npm test` ✅
- `cd frontend && npx tsc --noEmit` ✅
- `cd infra && docker compose up -d --build --force-recreate` ✅
