import json
import os
import re
from typing import Any, List, Optional, Tuple


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


def _validate_grouped_output(data: dict, input_count: int) -> Optional[List[str]]:
    groups = data.get("groups")
    if not isinstance(groups, list) or not groups:
        return None

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
            return None
        if not isinstance(canonical_name, str) or not canonical_name.strip():
            return None
        if not isinstance(source_indexes, list) or not source_indexes:
            return None

        local_indexes = set()
        for idx in source_indexes:
            if not isinstance(idx, int):
                return None
            if idx < 0 or idx >= input_count:
                return None
            if idx in local_indexes or idx in seen_indexes:
                return None
            local_indexes.add(idx)
            seen_indexes.add(idx)

        group_key = _normalize_key(canonical_name)
        if not group_key:
            group_key = _normalize_key(merged_line)
        if not group_key:
            return None
        if group_key in seen_groups:
            return None
        seen_groups.add(group_key)
        output_lines.append(merged_line.strip())

    if seen_indexes != set(range(input_count)):
        return None

    return output_lines


def transform_shop_list(
    to_buy_lines: List[str],
    locale: str = "de",
) -> Tuple[Optional[List[str]], Optional[str]]:
    cleaned_input = [str(x).strip() for x in (to_buy_lines or []) if x and str(x).strip()]
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
        "Summiere Mengen falls parsebar und schreibe die Gesamtsumme in merged_line. "
        "Du darfst keine neuen Zutaten erfinden und keine weglassen. "
        "Jeder Input-Index muss genau einmal in source_indexes vorkommen. "
        "Sortierung nach Einkaufswirkung: Kernzutaten zuerst, Gewuerze/Seasoning spaeter."
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
            max_output_tokens=600,
            truncation="auto",
        )
    except Exception:
        return None, "AI Sortierung nicht verfügbar."

    data = _parse_response_data(response)
    if not isinstance(data, dict):
        return None, "AI Sortierung nicht verfügbar."

    cleaned_output = _validate_grouped_output(data, input_count=len(cleaned_input))
    if cleaned_output is None:
        return None, "AI Sortierung nicht verfügbar."
    if not cleaned_output and cleaned_input:
        return None, "AI Sortierung nicht verfügbar."

    return cleaned_output, None
