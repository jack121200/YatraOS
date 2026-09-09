"""Interest <-> activity matching (roadmap: sentence-transformers, all-MiniLM-L6-v2).

Tries the real embedding model first; if sentence-transformers isn't
installed yet (or has no network to pull the model), falls back to a
keyword-overlap scorer so itinerary_builder.py keeps working in dev/offline
without silently producing nonsense rankings.
"""

from __future__ import annotations

from functools import lru_cache

_MODEL_NAME = "all-MiniLM-L6-v2"


@lru_cache
def _get_model():
    from sentence_transformers import SentenceTransformer  # local import — optional dep

    return SentenceTransformer(_MODEL_NAME)


def _keyword_score(interests: list[str], text: str) -> float:
    text_lower = text.lower()
    if not interests:
        return 0.0
    hits = sum(1 for interest in interests if interest.lower() in text_lower)
    return hits / len(interests)


def score_activities(interests: list[str], activities: list[dict]) -> dict[str, float]:
    """Returns {activity_id: score in [0, 1]} — higher means better interest match."""
    if not interests or not activities:
        return {a["id"]: 0.0 for a in activities}

    texts = [f"{a['name']} {a.get('category', '')} {a.get('notes', '')}" for a in activities]

    try:
        model = _get_model()
        import numpy as np  # sentence-transformers pulls this in as a dep

        interest_emb = model.encode(interests)
        activity_emb = model.encode(texts)
        interest_centroid = np.mean(interest_emb, axis=0)
        sims = activity_emb @ interest_centroid / (
            np.linalg.norm(activity_emb, axis=1) * np.linalg.norm(interest_centroid) + 1e-9
        )
        return {a["id"]: float(max(0.0, min(1.0, s))) for a, s in zip(activities, sims)}
    except Exception:
        # sentence-transformers missing/no network — keyword fallback, not a crash.
        return {a["id"]: _keyword_score(interests, text) for a, text in zip(activities, texts)}
