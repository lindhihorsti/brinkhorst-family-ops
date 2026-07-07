# Feature: Wochenplan für weniger Tage + wählbarer Starttag / Scroll-Fix

## Before

**Scope (User)**: Beim Erstellen des Wochenplans nach Anzahl Tage fragen und
optional nach dem Starttag (z. B. Mittwoch); alle bestehenden Funktionen
(Swap, Einkauf, Telegram, Historie) müssen mit dem verkürzten Plan
funktionieren. Zusätzlich: prüfen, warum die Wochenplan-Seite nicht mehr
normal scrollt.

**Befund Datenmodell**: `weekly_plans.days` ist ein Dict `"1".."7"` →
recipe_id/Dummy. Fehlende Keys sind bereits ein First-Class-Konzept
(`_build_day_entries` liefert `kind: "empty"`), d. h. ein verkürzter Plan ist
schlicht ein Dict mit Teilmenge der Keys — Swap, Shop, Telegram, Historie und
Heute-Zusammenfassung funktionieren ohne Änderung.

## After

**Backend** (`main.py`):
- `_build_new_week_plan(days_count=7, start_day=1)` — clamp auf 1..7 bzw.
  1..(8-start_day), Keys `start_day..start_day+count-1`. Kein Wochen-Overflow:
  Plan bleibt innerhalb der ISO-Woche (Zeilen-Identität = week_start Montag).
- `POST /api/weekly/plan` akzeptiert optionalen Body
  `{days_count?, start_day?}` — additiv, ohne Body wie bisher volle Woche
  (Telegram-Bot-Pfad unverändert).

**Frontend** (`weekly-plan/page.tsx`):
- „Plan erstellen"/„neu erstellen" öffnet einen Dialog (Modal) mit Starttag-
  und Anzahl-Tage-Select (max = 8 − Starttag, Auswahl wird geklemmt) plus
  Zusammenfassung („Plan läuft von Mi bis Fr"). Überschreib-Warnung ist in
  den Dialog integriert (ersetzt den alten ConfirmModal).
- `DayGrid` blendet leere Tage aus (zeigt alle nur, wenn der Plan komplett
  leer ist). Swap-Auswahl listet weiterhin alle 7 Tage — damit lassen sich
  nachträglich Tage zum Plan hinzufügen.

**Scroll-Bug (Root Cause, 2 Stufen)**: Die Seite trug seit Commit `594fd72`
(„stabilize weekly plan mobile overscroll") eine Sonderbehandlung:
(a) iOS-only `height: 100%` + `touch-action: pan-x pan-y` auf html/body,
(b) `overscroll-behavior-y: none` auf html UND body (CSS-Klasse
`weekly-plan-root` + Inline-Styles per useEffect). Da `html, body`
global `overflow-x: hidden` haben, sind BEIDE Scroll-Container — und
overscroll-none auf verschachtelten Scrollern blockiert auf iOS/WebKit das
normale Scrollen. Stufe 1 (nur (a) entfernt) reichte nicht; Fix ist die
Komplett-Entfernung der Sonderbehandlung (Effect + CSS-Regel + iOS-Block).
Der ursprüngliche Zweck (Pull-to-Refresh-Schutz bei Drag-Interaktionen) ist
obsolet: die Seite hat keine Drags mehr, Drafts sind serverseitig persistiert.
Desktop war nie betroffen.

**Validierung (dev-Stack)**:
- `py_compile`, `tsc --noEmit`, ESLint ✅
- API: `{"days_count":3,"start_day":3}` → Keys `3,4,5` (Mi–Fr), Mo/Di/Sa/So
  `empty` ✅
- Swap Tag 4 auf verkürztem Plan → nur Do getauscht; Cancel ✅
- `GET /api/weekly/shop` → per_recipe-Liste mit exakt den 3 Rezepten ✅
- UI: Grid zeigt nur Mi/Do/Fr; Dialog mit Starttag/Anzahl/Warnung ✅
- Scroll-Fix auf echtem iPhone gegentesten (iOS hier nicht emulierbar).
