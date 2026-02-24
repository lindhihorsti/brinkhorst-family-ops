import json
import os
import re
from typing import Any, Dict, List, Optional, Tuple

_SPLIT_SEPARATORS_RE = re.compile(r"\s*[;,]\s*")
_AND_SPLIT_RE = re.compile(r"\s+(?:und|&|\+)\s+", flags=re.IGNORECASE)
_QUANTITY_HINT_RE = re.compile(
    r"(?<!\w)(\d+[.,]?\d*|ein|eine|einen|einer|zwei|drei|vier|fuenf|fünf|sechs|sieben|acht|neun|zehn)\b",
    flags=re.IGNORECASE,
)
_LEADING_AMOUNT_RE = re.compile(
    r"^\s*(?P<num>\d+[.,]?\d*|ein|eine|einen|einer|zwei|drei|vier|fuenf|fünf|sechs|sieben|acht|neun|zehn)\s*(?P<rest>.+)$",
    flags=re.IGNORECASE,
)
_CALC_STYLE_RE = re.compile(r"\d\s*[\+\=\*\/-]\s*\d")
_UNIT_CANON = {
    "kg": "g",
    "g": "g",
    "gramm": "g",
    "l": "ml",
    "ml": "ml",
    "cl": "ml",
    "el": "el",
    "tl": "tl",
    "stk": "stueck",
    "stueck": "stueck",
    "stück": "stueck",
}
_UNIT_PARSE = {
    "kg": "kg",
    "g": "g",
    "gramm": "g",
    "l": "l",
    "ml": "ml",
    "cl": "cl",
    "el": "el",
    "tl": "tl",
    "stk": "stueck",
    "stueck": "stueck",
    "stück": "stueck",
}
_UNIT_FACTOR_TO_BASE = {
    "kg": 1000.0,
    "g": 1.0,
    "gramm": 1.0,
    "l": 1000.0,
    "ml": 1.0,
    "cl": 10.0,
}
_STOPWORDS = {
    "frisch",
    "frische",
    "frischer",
    "frischen",
    "klein",
    "kleine",
    "gross",
    "groß",
    "fein",
    "gehackt",
    "gerieben",
}
_TOKEN_ALIAS = {
    "knoblauchzehe": "knoblauch",
    "knoblauchzehen": "knoblauch",
    "zehe": "",
    "zehen": "",
}
_NUMBER_WORDS = {
    "ein": 1.0,
    "eine": 1.0,
    "einen": 1.0,
    "einer": 1.0,
    "zwei": 2.0,
    "drei": 3.0,
    "vier": 4.0,
    "fuenf": 5.0,
    "fünf": 5.0,
    "sechs": 6.0,
    "sieben": 7.0,
    "acht": 8.0,
    "neun": 9.0,
    "zehn": 10.0,
}
_CATEGORY_KEYWORDS = [
    (0, ("rind", "huhn", "hack", "lachs", "fisch", "fleisch", "tofu", "garnelen")),
    (1, ("tomat", "zwiebel", "knoblauch", "paprika", "salat", "gurk", "karotte", "kartoffel", "brokkoli", "obst")),
    (2, ("reis", "nudel", "pasta", "mehl", "brot", "hafer", "bohne", "linsen")),
    (3, ("milch", "kaese", "käse", "joghurt", "sahne", "butter", "ei")),
    (4, ("salz", "pfeffer", "curry", "paprikapulver", "zimt", "oregano", "basilikum", "chili", "essig", "senf")),
]


def _extract_output_text(response) -> Optional[str]:
    output_text = getattr(response, "output_text", None)
    if output_text:
        return output_text

    output = getattr(response, "output", None) or []
    for item in output:
        content = getattr(item, "content", None)
        if content is None and isinstance(item, dict):
            content = item.get("content")
        if not content:
            continue
        for chunk in content:
            chunk_type = getattr(chunk, "type", None)
            if chunk_type is None and isinstance(chunk, dict):
                chunk_type = chunk.get("type")
            if chunk_type != "output_text":
                continue
            candidate = getattr(chunk, "text", None)
            if candidate is None and isinstance(chunk, dict):
                candidate = chunk.get("text")
            if candidate:
                return candidate
    return None


def _extract_output_data(response) -> Optional[Any]:
    parsed = getattr(response, "output_parsed", None)
    if parsed is not None:
        return parsed

    output = getattr(response, "output", None) or []
    for item in output:
        content = getattr(item, "content", None)
        if content is None and isinstance(item, dict):
            content = item.get("content")
        if not content:
            continue
        for chunk in content:
            chunk_type = getattr(chunk, "type", None)
            if chunk_type is None and isinstance(chunk, dict):
                chunk_type = chunk.get("type")
            if chunk_type not in {"output_json", "json"}:
                continue
            candidate = getattr(chunk, "json", None)
            if candidate is None and isinstance(chunk, dict):
                candidate = chunk.get("json")
            if candidate is not None:
                return candidate
    return None


def _parse_response_data(response) -> Optional[dict]:
    data = _extract_output_data(response)
    if isinstance(data, dict):
        return data

    output_text = _extract_output_text(response)
    if not output_text:
        return None

    # Some models occasionally wrap JSON in fenced code blocks.
    cleaned = output_text.strip()
    if cleaned.startswith("```"):
        cleaned = re.sub(r"^```(?:json)?\s*", "", cleaned)
        cleaned = re.sub(r"\s*```$", "", cleaned)

    try:
        parsed = json.loads(cleaned)
    except Exception:
        return None
    return parsed if isinstance(parsed, dict) else None


def _normalize_key(value: str) -> str:
    s = value.strip().lower()
    s = s.replace("ä", "ae").replace("ö", "oe").replace("ü", "ue").replace("ß", "ss")
    s = re.sub(r"[^a-z0-9]+", "", s)
    return s


def _looks_like_calculation(value: str) -> bool:
    stripped = value.strip()
    return bool(_CALC_STYLE_RE.search(stripped) or " + " in stripped or "=" in stripped)


def _title_word(word: str) -> str:
    return word[:1].upper() + word[1:] if word else word


def _clean_name_for_merge(name: str) -> str:
    s = name.strip().lower()
    s = s.replace("ä", "ae").replace("ö", "oe").replace("ü", "ue").replace("ß", "ss")
    s = re.sub(r"[^a-z0-9\s-]+", " ", s)
    tokens = [t for t in re.split(r"[\s-]+", s) if t]
    norm_tokens: List[str] = []
    for tok in tokens:
        tok = _TOKEN_ALIAS.get(tok, tok)
        if not tok or tok in _STOPWORDS:
            continue
        if tok.endswith("en") and len(tok) > 4:
            tok = tok[:-2]
        elif tok.endswith("e") and len(tok) > 4:
            tok = tok[:-1]
        norm_tokens.append(tok)
    if not norm_tokens:
        return name.strip().lower()
    return " ".join(norm_tokens)


def _parse_leading_amount(line: str) -> Tuple[Optional[float], str]:
    m = _LEADING_AMOUNT_RE.match(line.strip())
    if not m:
        return None, line.strip()
    num_raw = (m.group("num") or "").strip().lower()
    rest = (m.group("rest") or "").strip()
    if num_raw in _NUMBER_WORDS:
        return _NUMBER_WORDS[num_raw], rest
    try:
        return float(num_raw.replace(",", ".")), rest
    except Exception:
        return None, line.strip()


def _split_unit_name(rest: str) -> Tuple[str, str]:
    parts = rest.split()
    if not parts:
        return "", ""
    if len(parts) == 1:
        return "", parts[0]
    unit_candidate = parts[0].strip().lower().rstrip(".")
    unit_norm = _UNIT_PARSE.get(unit_candidate)
    if unit_norm:
        return unit_norm, " ".join(parts[1:]).strip()
    return "", rest.strip()


def _format_amount(value: float) -> str:
    if abs(value - round(value)) < 0.01:
        return str(int(round(value)))
    return f"{value:.1f}".rstrip("0").rstrip(".")


def _category_rank(name: str) -> int:
    ln = name.lower()
    for rank, words in _CATEGORY_KEYWORDS:
        if any(w in ln for w in words):
            return rank
    return 3


def _pre_aggregate_lines(lines: List[str]) -> List[str]:
    grouped: Dict[str, Dict[str, Any]] = {}
    for line in lines:
        amount, rest = _parse_leading_amount(line)
        unit, name = _split_unit_name(rest)
        if not name:
            name = rest
        merge_key = _clean_name_for_merge(name)
        if not merge_key:
            merge_key = _normalize_key(name)
        if not merge_key:
            merge_key = _normalize_key(line)
        entry = grouped.get(merge_key)
        if not entry:
            entry = {
                "name": name.strip(),
                "unit": unit,
                "amount": amount,
                "raw": [line.strip()],
                "summable": amount is not None,
            }
            grouped[merge_key] = entry
            continue

        entry["raw"].append(line.strip())
        if entry["name"] and len(name.strip()) < len(entry["name"]):
            entry["name"] = name.strip()

        if amount is None or entry["amount"] is None:
            entry["summable"] = False
            entry["amount"] = None
            continue

        current_unit = entry["unit"] or ""
        next_unit = unit or ""
        if current_unit == next_unit:
            entry["amount"] += amount
            continue

        base_current = _UNIT_CANON.get(current_unit, current_unit)
        base_next = _UNIT_CANON.get(next_unit, next_unit)
        if base_current in _UNIT_FACTOR_TO_BASE and base_next in _UNIT_FACTOR_TO_BASE:
            current_in_base = entry["amount"] * _UNIT_FACTOR_TO_BASE.get(current_unit or base_current, 1.0)
            next_in_base = amount * _UNIT_FACTOR_TO_BASE.get(next_unit or base_next, 1.0)
            entry["amount"] = current_in_base + next_in_base
            entry["unit"] = _UNIT_CANON.get(base_current, base_current)
        else:
            entry["summable"] = False
            entry["amount"] = None

    result: List[str] = []
    for entry in grouped.values():
        base_name = " ".join(_title_word(w) for w in entry["name"].split())
        if not base_name and entry["raw"]:
            base_name = entry["raw"][0]
        if entry.get("summable") and entry.get("amount") is not None:
            qty = _format_amount(float(entry["amount"]))
            unit = (entry.get("unit") or "").strip()
            if unit:
                result.append(f"{qty} {unit} {base_name}".strip())
            else:
                result.append(f"{qty} {base_name}".strip())
        else:
            result.append(base_name.strip())

    return sorted(result, key=lambda x: (_category_rank(x), x.lower()))


def _expand_compound_lines(lines: List[str]) -> List[str]:
    expanded: List[str] = []
    for line in lines:
        base_parts = [p.strip() for p in _SPLIT_SEPARATORS_RE.split(line) if p and p.strip()]
        for part in base_parts:
            and_parts = [part]
            # Split "A und B" so combined ingredient lines become separate entries.
            if len(_QUANTITY_HINT_RE.findall(part)) >= 2 or _AND_SPLIT_RE.search(part):
                and_parts = [p.strip() for p in _AND_SPLIT_RE.split(part) if p and p.strip()]
            for item in and_parts:
                cleaned = re.sub(r"\s+", " ", item).strip(" -")
                if cleaned:
                    expanded.append(cleaned)
    return expanded


def _validate_grouped_output(data: dict, cleaned_input: List[str]) -> Optional[List[str]]:
    groups = data.get("groups")
    if not isinstance(groups, list) or not groups:
        return None

    input_count = len(cleaned_input)
    seen_indexes = set()
    seen_groups = set()
    output_lines: List[str] = []

    for group in groups:
        if not isinstance(group, dict):
            return None

        merged_line = group.get("merged_line")
        canonical_name = group.get("canonical_name")
        source_indexes = group.get("source_indexes")
        if not isinstance(merged_line, str) or not merged_line.strip():
            continue
        if _looks_like_calculation(merged_line):
            continue
        if not isinstance(canonical_name, str) or not canonical_name.strip():
            canonical_name = merged_line
        if not isinstance(source_indexes, list) or not source_indexes:
            continue

        local_indexes = set()
        for idx in source_indexes:
            if not isinstance(idx, int):
                continue
            if idx < 0 or idx >= input_count:
                continue
            if idx in local_indexes or idx in seen_indexes:
                continue
            local_indexes.add(idx)
        if not local_indexes:
            continue

        group_key = _normalize_key(canonical_name)
        if not group_key:
            group_key = _normalize_key(merged_line)
        if not group_key:
            continue
        if group_key in seen_groups:
            continue
        seen_groups.add(group_key)
        seen_indexes.update(local_indexes)
        output_lines.append(merged_line.strip())

    # Never lose items: uncovered source rows are appended unchanged.
    for idx in range(input_count):
        if idx in seen_indexes:
            continue
        raw_line = cleaned_input[idx].strip()
        if raw_line:
            output_lines.append(raw_line)

    # Final output must be unique by normalized key.
    deduped: List[str] = []
    dedup_seen = set()
    for line in output_lines:
        key = _normalize_key(line)
        if not key:
            key = line.strip().lower()
        if key in dedup_seen:
            continue
        dedup_seen.add(key)
        deduped.append(line)

    return deduped if deduped else None


def transform_shop_list(
    to_buy_lines: List[str],
    locale: str = "de",
) -> Tuple[Optional[List[str]], Optional[str]]:
    raw_input = [str(x).strip() for x in (to_buy_lines or []) if x and str(x).strip()]
    cleaned_input = _expand_compound_lines(raw_input)
    if not cleaned_input:
        return [], None
    prepared_input = _pre_aggregate_lines(cleaned_input)
    if prepared_input:
        cleaned_input = prepared_input

    # For very large lists, skip remote AI to keep response time predictable.
    max_ai_lines_raw = (os.getenv("OPENAI_SHOP_MAX_LINES") or "").strip()
    max_ai_lines = int(max_ai_lines_raw) if max_ai_lines_raw.isdigit() else 80
    if len(cleaned_input) > max_ai_lines:
        return cleaned_input, "AI Sortierung übersprungen (große Liste)."

    if not os.getenv("OPENAI_API_KEY"):
        return None, "AI Sortierung nicht verfügbar."

    try:
        from openai import OpenAI
    except Exception:
        return cleaned_input, "AI Sortierung nicht verfügbar."

    model = (os.getenv("OPENAI_MODEL", "gpt-4o-mini") or "gpt-4o-mini").strip()
    timeout_raw = (os.getenv("OPENAI_SHOP_TIMEOUT_SECONDS") or os.getenv("OPENAI_TIMEOUT_SECONDS") or "").strip()
    timeout = float(timeout_raw) if timeout_raw else 10.0
    client = OpenAI(timeout=timeout)

    system_text = (
        "Du bist ein Einkaufslisten-Transformer fuer deutsche Listen. "
        "Fasse alle gleichbedeutenden Zutaten in genau einem Eintrag zusammen, "
        "auch bei Schreibfehlern, Singular/Plural und Varianten. "
        "Kanonisiere Synonyme auf einen klaren Grundbegriff, z.B. "
        "'frische Knoblauchzehen', 'Knoblauch' -> 'Knoblauch'. "
        "Wenn die gleiche Zutat in unterschiedlichen Formen vorkommt, summiere die Menge sinnvoll. "
        "Summiere Mengen falls parsebar und schreibe die Gesamtsumme direkt aus, nie als Rechenausdruck. "
        "Beispiele: '6 frische Knoblauchzehen' + '1 Knoblauch' -> '7 Knoblauch'. "
        "VERBOTEN in merged_line: '+', '=', '*', '/'. "
        "Sortiere nach Einkaufswirkung: Fleisch/Fisch, Gemuese/Obst, Grundnahrungsmittel, Milchprodukte, dann Gewuerze/Kleinkram. "
        "Du darfst keine neuen Zutaten erfinden und keine weglassen. "
        "Jeder Input-Index muss genau einmal in source_indexes vorkommen. "
        "Jede Ausgabezeile enthaelt nur eine Zutat."
    )

    user_payload = {
        "locale": locale,
        "indexed_to_buy": [{"i": i, "line": line} for i, line in enumerate(cleaned_input)],
        "rules": {
            "no_new_items": True,
            "group_equivalents": True,
            "normalize_typos_variants": True,
            "sum_quantities": True,
            "sort_by_impact": True,
            "source_indexes_must_cover_all_once": True,
        },
    }

    schema = {
        "type": "json_schema",
        "name": "shop_list_transform",
        "schema": {
            "type": "object",
            "additionalProperties": False,
            "properties": {
                "groups": {
                    "type": "array",
                    "minItems": 1,
                    "items": {
                        "type": "object",
                        "additionalProperties": False,
                        "properties": {
                            "canonical_name": {"type": "string"},
                            "merged_line": {"type": "string"},
                            "source_indexes": {
                                "type": "array",
                                "minItems": 1,
                                "items": {"type": "integer", "minimum": 0},
                            },
                        },
                        "required": ["canonical_name", "merged_line", "source_indexes"],
                    },
                },
            },
            "required": ["groups"],
        },
        "strict": True,
    }

    try:
        response = client.responses.create(
            model=model,
            input=[
                {"role": "system", "content": [{"type": "input_text", "text": system_text}]},
                {
                    "role": "user",
                    "content": [
                        {"type": "input_text", "text": json.dumps(user_payload, ensure_ascii=False)}
                    ],
                },
            ],
            text={"format": schema},
            max_output_tokens=900,
            truncation="auto",
        )
    except Exception:
        return cleaned_input, "AI Sortierung nicht verfügbar."

    data = _parse_response_data(response)
    if not isinstance(data, dict):
        return cleaned_input, "AI Sortierung nicht verfügbar."

    cleaned_output = _validate_grouped_output(data, cleaned_input=cleaned_input)
    if cleaned_output is None:
        return cleaned_input, "AI Sortierung nicht verfügbar."
    if not cleaned_output and cleaned_input:
        return cleaned_input, "AI Sortierung nicht verfügbar."

    return cleaned_output, None
