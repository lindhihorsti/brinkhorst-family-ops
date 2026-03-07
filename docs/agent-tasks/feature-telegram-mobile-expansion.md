## Feature

Telegram-Bot als mobile Bedienoberfläche deutlich ausbauen.

## Scope

- Hauptmenü für Telegram mit Inline-Buttons
- mobile Bereiche:
  - Wochenplan
  - Einkauf
  - Split
  - Aufgaben
  - Pinnwand
  - Geburtstage
  - Familie
  - Rezepte (nur lesen, nicht anlegen)
- Schritt-für-Schritt-Flows zum Anlegen von:
  - Ausgaben
  - Einkaufslisten
  - Aufgaben
  - Pinnwand-Einträgen
- Split-Auswertungen direkt im Bot:
  - offene Salden
  - kompakte Report-Zusammenfassung

## Bot UX

- Hauptmenü statt nur Freitext
- kurze Antworten, scanbar auf Mobile
- Inline-Buttons für schnelle Navigation
- kleine Konversationsschritte für neue Einträge
- `Abbrechen` und Zurückpfade

## Constraints

- Rezepte nicht über den Bot anlegen
- GUI-Logik und bestehende APIs wiederverwenden
- bestehende Legacy-Kommandos nicht hart brechen

## Test Plan

- `python3 -m py_compile backend/app/main.py`
- `cd infra && docker compose up -d --build --force-recreate backend caddy`
- manuell im Bot prüfen:
  - `/start` / `menu`
  - Split-Menü
  - Ausgabe anlegen
  - Salden / Report abrufen
  - Einkaufsliste anlegen
  - Aufgabe anlegen
  - Pinnwand-Eintrag anlegen
