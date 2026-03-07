## Feature

`Was unternehmen wir?` wird in zwei Unterbereiche aufgeteilt:

- `Ausflüge`
- `Zuhause`

Der neue Zuhause-Bereich generiert AI-gestützte Indoor-Ideen für Leni bei schlechtem Wetter.

## Scope

- neue Hub-Seite unter `/ideen`
- bestehender Ausflugs-Generator bleibt erhalten
- neuer Indoor-Generator unter `/ideen/zuhause`
- derselbe AI-Modellpfad wie für Ausflüge
- Button für weitere Vorschläge
- Einstellungen unter `Einstellungen -> Aktivitäten` in zwei Bereiche trennen:
  - Ausflüge
  - Zuhause

## UX Goals

- kreativer, geführter Eingabeprozess statt nüchternem Formular
- schnelle Auswahl über Chips und kleine Stimmungsfragen
- Ergebnis als Karten mit klarer Durchführung und Materialliste
- saubere Vor-/Zurück-Navigation

## Backend Plan

- `settings_activities` additiv um Indoor-Defaults erweitern
- neuer Endpoint `/api/activities/home/generate`
- separater Prompt für Indoor-Ideen mit altersgerechtem Fokus

## Frontend Plan

- `/ideen` als Auswahlseite
- `/ideen/ausfluege` als Einstieg in den bisherigen Generator
- `/ideen/zuhause` als neuer Indoor-Flow
- `Einstellungen -> Aktivitäten` als zweigeteilte Konfigurationsseite

## Test Plan

- `PYTHONPATH=backend python3 -m unittest discover -s backend/tests -p 'test_*.py'`
- `cd frontend && npm test`
- `cd frontend && npx tsc --noEmit`
- `cd infra && docker compose up -d --build --force-recreate frontend backend caddy`

## Implemented

- `/ideen` ist jetzt ein Hub mit:
  - `Ausflüge`
  - `Zuhause`
- bisheriger Ausflugs-Generator bleibt erhalten und ist über `/ideen/ausfluege` erreichbar
- neuer Indoor-Use-Case unter `/ideen/zuhause`
- neuer Backend-Endpoint:
  - `/api/activities/home/generate`
- `settings_activities` wurde additiv um Zuhause-Defaults erweitert:
  - Dauer
  - Kinder-Energie
  - Eltern-Energie
  - Chaos-Level
  - Raum
  - Materialien
  - Zuhause-Ideentypen
- `Einstellungen -> Aktivitäten` ist jetzt in zwei Blöcke geteilt:
  - Ausflüge
  - Zuhause

## Validation Results

- `PYTHONPATH=backend python3 -m unittest discover -s backend/tests -p 'test_*.py'` ✅
- `python3 -m py_compile backend/app/main.py backend/app/telegram_events.py` ✅
- `cd frontend && npm test` ✅
- `cd frontend && npx tsc --noEmit` ✅
- `cd infra && docker compose up -d --build --force-recreate frontend backend caddy` ✅
