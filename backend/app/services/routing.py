"""OpenRouteService — live travel-time/distance for the validator's
haversine-based feasibility check (ai/validator.py) to upgrade to real road
routing instead of straight-line distance / assumed city speed."""

from __future__ import annotations

import httpx

from app.config import settings

ORS_URL = "https://api.openrouteservice.org/v2/directions/driving-car"


async def get_route_duration_min(from_lat: float, from_lng: float, to_lat: float, to_lng: float) -> float:
    if not settings.ors_api_key:
        raise RuntimeError("ORS_API_KEY not set in backend/.env")
    raise NotImplementedError("wire the ORS directions call here")
