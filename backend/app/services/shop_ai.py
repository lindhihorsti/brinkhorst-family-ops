import json
import os
from typing import List, Optional, Tuple


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
        "Du bist ein Einkaufslisten-Transformer. "
        "Du darfst keine neuen Zutaten hinzufügen und nichts weglassen. "
        "Fasse gleiche/ähnliche Zutaten zusammen, summiere Mengen falls möglich, "
        "und sortiere nach Einfluss: große/essenzielle Zutaten zuerst, Gewürze später. "
        "Ausgabe auf Deutsch, kurze klare Einträge."
    )

    user_payload = {
        "locale": locale,
        "to_buy": cleaned_input,
        "rules": {
            "no_new_items": True,
            "group_equivalents": True,
            "sum_quantities": True,
            "sort_by_impact": True,
        },
    }

    schema = {
        "type": "json_schema",
        "name": "shop_list_transform",
        "schema": {
            "type": "object",
            "additionalProperties": False,
            "properties": {
                "to_buy": {"type": "array", "items": {"type": "string"}},
            },
            "required": ["to_buy"],
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

    output_text = _extract_output_text(response)
    if not output_text:
        return None, "AI Sortierung nicht verfügbar."

    try:
        data = json.loads(output_text)
    except Exception:
        return None, "AI Sortierung nicht verfügbar."

    if not isinstance(data, dict):
        return None, "AI Sortierung nicht verfügbar."

    items = data.get("to_buy")
    if not isinstance(items, list):
        return None, "AI Sortierung nicht verfügbar."

    cleaned_output = [str(x).strip() for x in items if isinstance(x, str) and x.strip()]
    if not cleaned_output and cleaned_input:
        return None, "AI Sortierung nicht verfügbar."

    return cleaned_output, None
