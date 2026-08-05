# Feature: Wochenplan – Rezepte gezielt aus der DB wählen

## Before

**Scope:** Bei der Wochenplan-Erstellung und beim Tausch einzelner Tage soll man
optional ein konkretes Rezept aus der DB pinnen können, statt nur den Zufallsvorschlag
zu bekommen. Nicht gepinnte Tage bleiben Zufall.

**Geplante Dateien:**
- `backend/app/services/swap_service.py` — reine Split-Logik manuell/zufällig
- `backend/app/main.py` — Request-Modelle, Validierung, Plan-/Swap-Erzeugung
- `frontend/app/weekly-plan/page.tsx` — Rezept-Dropdowns
- `backend/tests/test_manual_swap.py` — Unit-Test

**Testplan:** Unit-Test (Split-Logik), `tsc --noEmit`, Live-Test gegen den DEV-Stack
(gepinnter Tag == gewähltes Rezept; Zufalls-Reroll respektiert Pins).

## After

**Implementiert:**
- Neues Feld `manual_recipes: Optional[Dict[str, str]]` (Tag-String → recipe_id) an
  `WeeklyPlanCreateRequest` und `WeeklySwapRequest`.
- `swap_service.split_manual_days(day_keys, manual_valid)` teilt die angefragten Tage in
  einen In-Range-Manual-Anteil und die verbleibenden Zufalls-Tage (von beiden Call-Sites genutzt).
- `_valid_manual_recipes()` (Trust-Boundary): behält nur nicht-leere IDs, die als **aktives**
  `Recipe` existieren; unbekannte/inaktive/leere IDs fallen still auf Zufall zurück.
- `_build_new_week_plan()` und `_run_swap_preview()` setzen Manual-Picks zuerst und füllen die
  restlichen Tage über den bestehenden Zufalls-Picker; `apply_swaps` bannt bereits gesetzte
  IDs, sodass Zufall nie ein Manual-Rezept dupliziert.
- Frontend: `RecipeSelect`-Komponente (Default `🎲 Zufällig`) + State `manualPlan`/`manualSwap`,
  Dropdown je Tag im Erstellen-Modal und je gewähltem Tag im Swap-Schritt. Rezepte aus
  `GET /api/recipes?limit=500`.

**Validierung:**
- `backend/tests/test_manual_swap.py`: 2/2 OK (im Container, da sqlalchemy nötig).
- `cd frontend && npx tsc --noEmit`: clean.
- Live gegen DEV-Stack: gepinnter Tag 1 == gewähltes Rezept; manueller Swap Tag 2 == Pin;
  Zufalls-Reroll Tag 3 lässt Pin unberührt.

**Kein Schema-Change** (nur additive optionale Request-Felder) → keine Migration nötig.

**Deploy:** Commit `ce64e76`, per `make deploy` im PROD-Worktree live auf dem Mac Mini
(`git_sha=ce64e76` bestätigt).

**Follow-ups:** Suche/Filter im Rezept-Dropdown, falls die Liste zu lang wird. Telegram-Bot
bleibt beim Zufalls-Swap (Manual-Pick im Bot wäre umständlich, nicht angefragt).
