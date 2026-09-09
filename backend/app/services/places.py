"""OSM/Overpass place lookups — live fallback layer for cities without a
curated seed in data/seed/. Not called yet: itinerary_builder.py only reads
the seed pool today (roadmap Golden Rule: keep live third-party calls off
the judged demo path). Implement when adding a city with no seed file."""

from __future__ import annotations

import httpx

OVERPASS_URL = "https://overpass-api.de/api/interpreter"


async def search_places(lat: float, lng: float, radius_m: int = 3000, category: str | None = None) -> list[dict]:
    raise NotImplementedError("wire Overpass QL query here when a non-seeded city is needed")
