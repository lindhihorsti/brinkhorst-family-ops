## Feature Brief: Build-Datum auf der Homepage anzeigen

### Goal
Zusätzlich zum Frontend- und Backend-SHA soll auf der Homepage auch das Build-Datum für beide Container angezeigt werden.

### Scope
- Gemeinsamen Build-Arg `BUILD_DATE` für Backend und Frontend einführen
- Backend-Health-Response um `build_date` erweitern
- Frontend-Homepage um Datumsanzeige ergänzen
- CI und lokale Docker-Compose-Builds so anpassen, dass beide Images denselben Wert erhalten

### Test Plan
- `cd frontend && npm test`
- `cd frontend && npx tsc --noEmit`
- `cd infra && docker compose up -d --build --force-recreate frontend backend caddy`
- `curl http://127.0.0.1:8080/api/health`
- Homepage prüfen: SHA und Datum bei Frontend/Backend sichtbar
