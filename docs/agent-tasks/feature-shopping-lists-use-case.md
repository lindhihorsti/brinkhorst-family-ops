## Feature

Neuer Haupt-Use-Case `Einkaufsliste` mit mehreren Einkaufslisten, Snapshot-Import aus dem Wochenplan und AI-Kostenschätzung.

## Orchestration

Die Umsetzung wird in vier parallele Arbeitsstränge aufgeteilt:

1. Datenmodell und API
2. Wiederverwendung der Wochenplan-Shop-Logik plus AI-Kostenschätzung
3. Frontend-Use-Case und Listen-UI
4. Navigation und Entfernen der alten Wochenplan-Shop-Funktion

## Scope

- neuer Hauptbereich `Einkaufsliste`
- mehrere Einkaufslisten anlegen und verwalten
- manuelle Listeneinträge hinzufügen
- optionaler Snapshot-Import aus dem aktuellen Rezept-Wochenplan
- Importmodus:
  - `ai_consolidated`
  - `per_recipe`
- Listendarstellung:
  - Checkliste
  - Textliste mit Aufzählungszeichen
- Reihenfolge in der Liste:
  - zuerst manuelle Einträge
  - danach aus Rezepten importierte Zutaten
- pro Liste AI-Kostenschätzung mit demselben Modell wie Aktivitäten-Ideen
- Standardwährung für AI-Kostenschätzung:
  - CHF für Schweiz
  - EUR für Deutschland
- pro Liste Umschalter für die Schätz-Währung direkt neben der AI-Schätzung
- alte `SHOP`-Funktion aus dem Wochenplan entfernen
- Navigation vollständig erweitern:
  - Startseite Standard-Layout
  - Startseite Kachel-Layout
  - Bottom-Navigation
  - Bereichsinterne Vor-/Zurück-Navigation

## Planned Files

- `backend/app/models.py`
- `backend/app/main.py`
- `backend/app/services/shop_output.py`
- `db/migrations/2026-03-07_001_shopping_lists.sql`
- `backend/tests/test_shopping_lists.py`
- `frontend/app/page.tsx`
- `frontend/app/lib/ui.tsx`
- `frontend/app/kueche/page.tsx`
- `frontend/app/weekly-plan/page.tsx`
- `frontend/app/einkauf/page.tsx`
- `frontend/app/einkauf/[id]/page.tsx`
- `frontend/app/einkauf/new/page.tsx`
- `frontend/app/lib/api.ts`
- `frontend/tests/shopping-lists.test.mjs`

## Data Notes

- Listen sind Momentaufnahmen, keine Synchronisation mit dem Wochenplan
- persistente Tabellen für Listen und Listeneinträge
- Rezept-Import wird als Snapshot gespeichert, nicht als Live-Referenz
- AI-Kostenschätzung ist nur ein grober Wert, nicht buchhalterisch exakt

## AI Notes

- Kostenschätzung soll dasselbe Modell verwenden wie Aktivitäten-Ideen:
  - `OPENAI_MODEL_ACTIVITIES`
- AI soll nur schätzen, keine exakten Marktpreise versprechen
- die Schätzung soll je nach Einstellung Preisniveau und Währung für Schweiz oder Deutschland berücksichtigen

## Test Plan

- `PYTHONPATH=backend python3 -m unittest discover -s backend/tests -p 'test_*.py'`
- `cd frontend && npm test`
- `cd frontend && npx tsc --noEmit`
- `cd infra && docker compose up -d --build --force-recreate`
- UI-Prüfung:
  - neuer Use Case auf Startseite und Bottom-Navigation sichtbar
  - Liste anlegen
  - manuelle Items hinzufügen
  - Wochenplan-Snapshot importieren
  - manuelle Items stehen vor Rezept-Zutaten
  - Checkbox- und Textansicht funktionieren
  - AI-Kostenschätzung wird erzeugt
  - Währungs-Default aus `Einstellungen -> Einkaufsliste` wird für neue Listen übernommen
  - Währungs-Toggle auf der Liste schaltet zwischen CHF und EUR
  - Wochenplan enthält keinen eigenen Shop-Bereich mehr

## Implemented

- neue persistente Tabellen:
  - `shopping_lists`
  - `shopping_list_items`
- neue Backend-API für Einkaufslisten:
  - Listen auflisten
  - Liste anlegen
  - Liste laden
  - Liste aktualisieren
  - Liste löschen
  - manuelle Einträge hinzufügen
  - Einträge abhaken
  - Einträge löschen
  - Wochenplan-Snapshot importieren/aktualisieren
  - AI-Kostenschätzung erzeugen
- Snapshot-Logik aus der bestehenden Wochenplan-Shop-Funktion wiederverwendet
- Reihenfolge technisch erzwungen:
  - manuelle Einträge zuerst
  - Rezept-Zutaten danach
- AI-Kostenschätzung nutzt dasselbe Modell wie Aktivitäten-Ideen:
  - `OPENAI_MODEL_ACTIVITIES`
- AI-Kostenschätzung unterstützt jetzt:
  - CHF / Schweiz
  - EUR / Deutschland
- bestehende Listen können die Schätz-Währung direkt auf der Detailseite umschalten
- neuer Frontend-Hauptbereich `Einkaufsliste` mit:
  - Übersichtsseite
  - Anlegen-Seite
  - Detailseite
  - Checklistenansicht
  - Textansicht
  - Wochenplan-Import
  - AI-Schätzbutton
- eigener Settings-Bereich `Einkaufsliste` mit:
  - Standard-Importmodus
  - Standard-Ansicht
  - Standard-Währung für AI-Schätzungen
  - Standard für Snapshot-Import
  - Standard für Direktöffnung nach dem Anlegen
- Navigation erweitert:
  - Home Standard
  - Home Kachel
  - Bottom-Navigation
  - Küche-Unterseite
- alte Shop-UI aus dem Wochenplan entfernt

## Validation Results

- `PYTHONPATH=backend python3 -m unittest discover -s backend/tests -p 'test_*.py'` ✅
- `cd frontend && npm test` ✅
- `cd frontend && npx tsc --noEmit` ✅
- `cd infra && docker compose up -d --build --force-recreate` ✅
- `docker compose ps` ✅
- `curl -I http://127.0.0.1:8080/einkauf` -> `401` wegen lokaler Caddy-Basic-Auth vor der App
- Währungs-Feature ergänzt:
  - neue Listen übernehmen Standard-CHF/EUR aus den Einkaufseinstellungen
  - Detailseite kann Währung direkt neben der Schätzung umstellen
  - Detail- und Übersichtsseite formatieren Gesamtschätzung passend als CHF oder EUR
  - Währungswechsel auf bestehender Liste verwirft bewusst alte Schätzwerte, bis neu geschätzt wird

## Notes

- der Backend-Endpoint `/api/weekly/shop` bleibt vorerst bestehen, die UI-Funktion im Wochenplan ist jedoch entfernt
- lokale UI-End-to-End-Prüfung des neuen Bereichs ist durch die vorgeschaltete Basic-Auth nur im angemeldeten Browser sinnvoll
