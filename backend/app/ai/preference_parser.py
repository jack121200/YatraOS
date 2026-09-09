"""Free-text preferences -> structured trip params. Gemini only (no
Anthropic, per project decision). Keep this OFF the live demo click-path
(roadmap Golden Rule) — pre-generate and cache the demo trip's output;
real calls are for genuine user input, not the rehearsed scenario.
"""

from __future__ import annotations

import json
from dataclasses import dataclass

from app.config import settings

KNOWN_INTERESTS = [
    "heritage", "beach", "nightlife", "nature", "adventure",
    "food", "shopping", "relaxation", "culture", "family", "wildlife",
]

_PROMPT_TEMPLATE = """Extract structured trip preferences from this traveller's text.
Return ONLY compact JSON with keys: interests (array, pick from {interests}),
pace ("relaxed" | "moderate" | "packed"), budget_hint (integer or null).

Text: "{text}"
"""


@dataclass
class ParsedPreferences:
    interests: list[str]
    pace: str
    budget_hint: int | None


def _rule_based_fallback(text: str) -> ParsedPreferences:
    text_lower = text.lower()
    interests = [i for i in KNOWN_INTERESTS if i in text_lower]

    pace = "moderate"
    if any(w in text_lower for w in ("relax", "slow", "chill")):
        pace = "relaxed"
    elif any(w in text_lower for w in ("packed", "fast", "as much as possible", "jam-packed")):
        pace = "packed"

    return ParsedPreferences(interests=interests, pace=pace, budget_hint=None)


def parse_preferences(text: str) -> ParsedPreferences:
    if not settings.google_api_key:
        return _rule_based_fallback(text)

    try:
        import google.generativeai as genai  # local import — optional dep, only needed if key is set

        genai.configure(api_key=settings.google_api_key)
        model = genai.GenerativeModel("gemini-2.0-flash")
        prompt = _PROMPT_TEMPLATE.format(interests=KNOWN_INTERESTS, text=text)
        response = model.generate_content(prompt)
        data = json.loads(response.text.strip().strip("```json").strip("```"))
        return ParsedPreferences(
            interests=[i for i in data.get("interests", []) if i in KNOWN_INTERESTS],
            pace=data.get("pace", "moderate"),
            budget_hint=data.get("budget_hint"),
        )
    except Exception:
        # Gemini call failed/timed out/rate-limited — never block the flow on this.
        return _rule_based_fallback(text)
