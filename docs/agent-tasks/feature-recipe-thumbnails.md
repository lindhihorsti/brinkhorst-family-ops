# Feature: Rezept-Thumbnails (Übersicht + Detailseite)

## Before

**Scope (User)**: Pro Rezept ein Bild von der Original-Rezeptseite speichern;
klein in der Übersicht, größer auf der Detailseite; der URL/AI-Import muss das
Bild mitnehmen; Backfill für Bestandsrezepte. Erst auf dev.

**Vorarbeiten im Bestand**: `Recipe.photo_url` existierte in Modell/API/Typen,
die Übersicht renderte ein Thumbnail wenn gesetzt — aber der Import extrahierte
kein Bild, nichts wurde gespeichert (nur Fremd-URL), Detailseite ohne Bild.

**Geplante Dateien**: `backend/app/models.py`, `backend/app/main.py`,
`backend/requirements.txt`, `db/migrations/2026-07-06_001_recipe_photos.sql`,
`frontend/app/recipes/{page,\[id\]/page,\[id\]/edit/page}.tsx`.

## Design-Entscheidungen

- **Speichern statt Hotlinken**: Rezeptseiten blocken Hotlinks; Bild wird beim
  Speichern serverseitig geladen, mit Pillow auf max. 800 px skaliert und als
  JPEG (~90 KB) in eigener Tabelle `recipe_photos` (bytea) abgelegt → liegt im
  täglichen DB-Backup, kein neues Volume.
- **Eigene Tabelle statt Spalte auf `recipes`**: Die Recipe-Endpoints geben das
  SQLModel-Objekt direkt zurück — eine bytea-Spalte würde base64-aufgebläht in
  jeder Listen-Response landen.
- **Extraktion deterministisch, ohne AI**: JSON-LD `Recipe.image` (String,
  Objekt, Liste), Fallback `og:image`/`twitter:image`, relative URLs via
  urljoin. Zuverlässiger und kostenlos; der OpenAI-Draft bleibt unberührt.
- **Ein gespeichertes Bild für beide Größen**: Übersicht 60 px, Detail 240 px —
  rein per CSS.
- SSRF-Schutz des Imports (`_validate_import_url`, Redirect-Validierung pro
  Hop, 15-MB-Cap) wird für den Bild-Download wiederverwendet.

## After

**Backend** (`main.py`, additiv):
- `_extract_recipe_inputs(html, base_url)` liefert zusätzlich `photo_url`;
  Preview-Draft enthält es (`draft.photo_url`).
- `_download_recipe_photo_bytes` + `_store_recipe_photo` (httpx + Pillow,
  Upsert in `recipe_photos`).
- `GET /api/recipes/{id}/photo` — gespeichertes JPEG mit Cache-Header;
  302-Redirect auf `photo_url` als Fallback; sonst 404.
- Create-/Update-Hooks: `photo_url` gesetzt → Bild laden (best-effort,
  non-fatal); `photo_url` geleert → Blob löschen.
- `POST /api/recipes/photos/backfill` — für aktive Rezepte ohne Blob:
  `photo_url` nutzen oder `source_url` neu scrapen, Bild speichern.

**DB**: Tabelle `recipe_photos(recipe_id PK→recipes CASCADE, data, mime,
created_at)`; dev via AUTO_MIGRATE (create_all), prod via Migration-SQL.

**Frontend**: Übersichts-Thumbnail lädt vom neuen Endpoint; Detailseite zeigt
240-px-Hero über der Info-Karte; Import-Modal zeigt das gefundene Bild in der
Vorschau und speichert `photo_url` mit; Edit-Seite hat ein Bild-URL-Feld
(Ändern lädt das Bild neu, Leeren entfernt es).

**Validierung (dev-Stack)**:
- `py_compile`, `tsc --noEmit`, ESLint (geänderte Dateien) ✅
- Tabelle vorhanden (psql `\d recipe_photos`) ✅
- Backfill: `{"stored":45,"skipped":3,"failed":0}` — Ø 93 KB, max 149 KB ✅
- Photo-Endpoint: 200 `image/jpeg` ✅; Übersicht + Detailseite zeigen Bilder ✅
- Import-Preview (BBC Good Food): `draft.photo_url` gefüllt ✅
- Create-Hook end-to-end: Test-Rezept → Photo 200 → gelöscht (CASCADE) ✅

**Prod-Rollout-Hinweis**: Nach Merge Migration
`db/migrations/2026-07-06_001_recipe_photos.sql` manuell anwenden, deployen,
dann einmalig `POST /api/recipes/photos/backfill` aufrufen (dauert wenige
Minuten, läuft synchron).
