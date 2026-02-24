import json
import os
import re
from typing import Any, List, Optional, Tuple

_SPLIT_SEPARATORS_RE = re.compile(r"\s*[;,]\s*")
_AND_SPLIT_RE = re.compile(r"\s+(?:und|&|\+)\s+", flags=re.IGNORECASE)
_QUANTITY_HINT_RE = re.compile(
    r"(?<!\w)(\d+[.,]?\d*|ein|eine|einen|einer|zwei|drei|vier|fuenf|fünf|sechs|sieben|acht|neun|zehn)\b",
    flags=re.IGNORECASE,
)


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

    if not os.getenv("OPENAI_API_KEY"):
        return None, "AI Sortierung nicht verfügbar."

    try:
        from openai import OpenAI
    except Exception:
        return None, "AI Sortierung nicht verfügbar."

    model = (os.getenv("OPENAI_MODEL", "gpt-4o-mini") or "gpt-4o-mini").strip()
    timeout_raw = (os.getenv("OPENAI_TIMEOUT_SECONDS") or "").strip()
    timeout = float(timeout_raw) if timeout_raw else 20.0
    client = OpenAI(timeout=timeout)

    system_text = (
        "Du bist ein Einkaufslisten-Transformer fuer deutsche Listen. "
        "Fasse alle gleichbedeutenden Zutaten in genau einem Eintrag zusammen, "
        "auch bei Schreibfehlern, Singular/Plural und Varianten. "
        "Kanonisiere Synonyme auf einen klaren Grundbegriff, z.B. "
        "'frische Knoblauchzehen', 'Knoblauch' -> 'Knoblauch'. "
        "Wenn die gleiche Zutat in unterschiedlichen Formen vorkommt, summiere die Menge sinnvoll. "
        "Summiere Mengen falls parsebar und schreibe die Gesamtsumme in merged_line. "
        "Beispiele: '6 frische Knoblauchzehen' + '1 Knoblauch' -> '7 Knoblauch'. "
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
            max_output_tokens=1200,
            truncation="auto",
        )
    except Exception:
        return None, "AI Sortierung nicht verfügbar."

    data = _parse_response_data(response)
    if not isinstance(data, dict):
        return None, "AI Sortierung nicht verfügbar."

    cleaned_output = _validate_grouped_output(data, cleaned_input=cleaned_input)
    if cleaned_output is None:
        return None, "AI Sortierung nicht verfügbar."
    if not cleaned_output and cleaned_input:
        return None, "AI Sortierung nicht verfügbar."

    return cleaned_output, None
