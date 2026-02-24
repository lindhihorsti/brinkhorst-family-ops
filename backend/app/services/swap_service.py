from datetime import datetime
from typing import Dict, List, Optional, Set, Tuple

from sqlalchemy import func
from sqlmodel import Session, select

from app.models import Recipe


def pick_recipes_for_days(
    engine,
    existing_ids: List[str],
    count: int,
    prefer_tags: Optional[List[str]] = None,
    prefer_max: int = 0,
) -> Tuple[List[str], List[str]]:
    """
    Returns (picked_recipe_ids, dummy_titles_if_missing)
    - Picks from DB first (excluding existing_ids)
    - If insufficient, returns dummy titles for the remaining slots
    """
    if engine is None:
        raise RuntimeError("DATABASE_URL missing")

    picked: List[str] = []
    dummy: List[str] = []

    with Session(engine) as session:
        stmt = (
            select(Recipe)
            .where(Recipe.is_active == True)  # noqa: E712
            .order_by(func.random())
        )
        all_recipes = list(session.exec(stmt))

    available = [r for r in all_recipes if str(r.id) not in existing_ids]

    prefer_set = {t for t in (prefer_tags or []) if t}
    preferred: List[Recipe] = []
    if prefer_set:
        for r in available:
            if set(r.tags or []) & prefer_set:
                preferred.append(r)

    if prefer_set and prefer_max > 0:
        for r in preferred:
            if len(picked) >= prefer_max:
                break
            picked.append(str(r.id))

    for r in available:
        if len(picked) >= count:
            break
        if str(r.id) in picked:
            continue
        picked.append(str(r.id))

    while len(picked) + len(dummy) < count:
        dummy.append(f"KI: Neues Rezept {len(dummy)+1}")

    return picked, dummy


def update_avoid_list_for_reroll(
    current_days: Dict[str, str],
    swap_days: List[int],
    avoid_ids: Set[str],
) -> Set[str]:
    updated = set(avoid_ids)
    for d in swap_days:
        rid = current_days.get(str(d))
        if rid and isinstance(rid, str) and not rid.startswith("KI:"):
            updated.add(rid)
    return updated


def apply_swaps(
    engine,
    base_days: Dict[str, str],
    swap_days: List[int],
    avoid_ids: Set[str],
) -> Dict[str, str]:
    current = dict(base_days)

    # 1) Alles, was schon im Plan drin ist (echte Rezepte), ist "verboten"
    banned_ids = {
        v for v in current.values()
        if v and isinstance(v, str) and not v.startswith("KI:")
    }
    banned_ids.update(avoid_ids)

    # 2) Für die Swap-Slots löschen wir erst mal die Einträge
    for d in swap_days:
        current[str(d)] = ""

    # 3) Jetzt picken wir neue Rezepte, die NICHT in banned_ids sind
    picked_ids, dummy_titles = pick_recipes_for_days(
        engine,
        existing_ids=list(banned_ids),
        count=len(swap_days),
    )

    # 4) Und verteilen sie auf die Swap-Tage
    pi = 0
    di = 0
    stamp = datetime.utcnow().strftime("%H%M%S")
    for d in swap_days:
        if pi < len(picked_ids):
            current[str(d)] = picked_ids[pi]
            pi += 1
        else:
            # Dummy muss sichtbar "neu" sein (sonst wirkt's wie nicht getauscht)
            base = dummy_titles[di] if di < len(dummy_titles) else "KI: Neues Rezept"
            current[str(d)] = f"{base} ({stamp}-{d})"
            di += 1

    return current
