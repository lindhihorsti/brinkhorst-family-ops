# Fix Note: AI-Sortierung fuer grosse Einkaufslisten

## Scope
- Fehler in Prod beheben, bei dem `AI sortieren` bei grossen Einkaufslisten haengen bleibt
- Backend fuer grosse Rezeptmengen robuster machen
- Frontend gegen `ok: false` Antworten absichern, damit die Seite nicht in `Lade...` faellt

## Planned Files
- `backend/app/main.py`
- `backend/app/shopping_utils.py`
- `backend/tests/test_shopping_categories.py`
- `frontend/app/einkauf/[id]/page.tsx`
- `frontend/app/lib/api.ts`

## Test Plan
- `PYTHONPATH=backend python3 -m unittest discover -s backend/tests -p 'test_*.py'`
- `cd frontend && npm test`
- `cd frontend && npx tsc --noEmit`
- `cd infra && docker compose up -d --build --force-recreate frontend backend caddy`

## Implemented
- AI-Kategorisierung wird bei grossen Listen in mehrere Chunks aufgeteilt
- fuer diesen Pfad laengere Timeouts und eigene Chunk-Grenzen ergaenzt
- Frontend behandelt `ok: false` jetzt korrekt als Fehler und behaelt die geladene Liste
- zusaetzliche Backend-Tests fuer Chunking ergaenzt

## Validation
- folgt nach Testlauf
