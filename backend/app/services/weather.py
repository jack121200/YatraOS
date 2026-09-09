"""OpenWeatherMap — real weather triggers for the Ripple Engine (roadmap
Should Have: "real weather/routing API wiring vs. a scripted trigger").
Today the demo scenario's disruption reason is hand-written per city; this
is what would generate that reason from live data instead."""

from __future__ import annotations

import httpx

from app.config import settings

OWM_URL = "https://api.openweathermap.org/data/2.5/weather"


async def get_current_weather(lat: float, lng: float) -> dict:
    if not settings.openweather_api_key:
        raise RuntimeError("OPENWEATHER_API_KEY not set in backend/.env")
    raise NotImplementedError("wire the OpenWeatherMap call here")
