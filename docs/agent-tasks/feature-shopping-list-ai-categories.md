# Feature Note: AI-Kategorien fuer Einkaufslisten

## Scope
- bestehenden Einkaufslisten eine AI-Aktion zum Sortieren von Rezept-Zutaten hinzufuegen
- Kategorien dynamisch aus den vorhandenen Zutaten ableiten
- Zutateninhalte strikt unveraendert lassen und serverseitig validieren
- kategorisierte Struktur persistent auf der Liste speichern
- bestehende GUI- und Telegram-Flows fuer Einkaufslisten unveraendert funktionsfaehig halten

## Planned Files
- `backend/app/main.py`
- `backend/app/models.py`
- `backend/app/shopping_utils.py`
- `backend/tests/test_shopping_categories.py`
- `db/migrations/2026-03-09_001_shopping_item_categories.sql`
- `frontend/app/einkauf/[id]/page.tsx`
- `frontend/app/einkauf/format.mjs`
- `frontend/app/lib/api.ts`
- `frontend/tests/shopping-lists.test.mjs`

## Test Plan
- `PYTHONPATH=backend python3 -m unittest discover -s backend/tests -p 'test_*.py'`
- `cd frontend && npm test`
- `cd frontend && npx tsc --noEmit`
- `cd infra && docker compose up -d --build --force-recreate frontend backend caddy`

## Implemented
- neue additive DB-Spalte `shopping_list_items.category`
- AI-Endpoint zum Kategorisieren von Rezept-Zutaten einer Einkaufsliste
- harte Validierung: AI darf keine Zutaten umschreiben, entfernen oder neu erzeugen
- persistente Sortierung nach AI-Kategorie fuer Rezept-Zutaten
- GUI-Aktion `AI sortieren` auf der Einkaufslisten-Detailseite
- Text- und Checklistenansicht rendern gespeicherte Kategorien statt Rezepttiteln, sobald Kategorien vorhanden sind
- Telegram-Detailmenue fuer Einkaufslisten um `🧠 Sortieren` erweitert
- Telegram zeigt kategorisierte Rezept-Zutaten in der Detailansicht mit Zwischenueberschriften

## Validation
- `python3 -m py_compile backend/app/main.py` ✅
- `PYTHONPATH=backend python3 -m unittest discover -s backend/tests -p 'test_*.py'` ✅
- `cd frontend && npm test` ✅
- `cd frontend && npx tsc --noEmit` ✅
- `cd infra && docker compose up -d --build --force-recreate frontend backend caddy` ✅

## Notes
- Migration muss vor Prod-Deployment in Supabase eingespielt werden.
- Manuelle Listeneintraege bleiben bewusst vor den kategorisierten Rezept-Zutaten.
