# Feature: Geschenke-Ideen-Generator

Datum: 2026-03-07
Branch: `codex/gift-idea-generator`

## Ziel

Im Use Case `Geburtstage & Geschenke` einen AI-gestützten Geschenkideen-Generator ergänzen, der:

- per Workflow relevante Kriterien abfragt
- drei konkrete Geschenkideen generiert
- konsistent zum bestehenden Design und zur Navigation passt
- bestehende Geburtstage als Kontext nutzen kann
- per Telegram-Bot mobil abrufbar ist

## Umsetzung

### Frontend

- `Geburtstage & Geschenke` als Hub-Seite mit zwei Subbereichen:
  - `Geburtstage`
  - `Geschenkideen`
- bestehende Geburtstagsliste nach `/geburtstage/liste` verschoben
- neue AI-Seite `/geburtstage/geschenkideen`
- Speichern einzelner generierter Ideen direkt in bestehende Geburtstage
- eigener Settings-Bereich unter `/einstellungen/geburtstage`

### Backend

- neue Birthday-/Gift-Settings in `app_state`
- neue Endpoints:
  - `GET /api/birthdays/settings`
  - `PUT /api/birthdays/settings`
  - `POST /api/birthdays/gift-ideas/generate`
- AI-Modell über `OPENAI_MODEL_ACTIVITIES`
- kein DB-Schema-Change nötig

### Telegram

- Geburtstagsmenü erweitert um `🎁 Geschenkideen`
- mobiler Flow:
  - Person aus Geburtstagsliste wählen
  - Budgetrahmen wählen
  - drei Geschenkideen erhalten
  - `Weitere` direkt im Bot abrufen

## Relevante Eingabevariablen

- Person / bestehender Geburtstag
- Alter
- Beziehung
- Anlass
- Budget
- gewünschte Geschenkarten
- Interessen
- No-Gos / Guardrails
- Freitext-Kontext

## Verifikation

- `python3 -m py_compile backend/app/main.py`
- `cd frontend && npx tsc --noEmit`
- `cd infra && docker compose up -d --build --force-recreate frontend backend caddy`
