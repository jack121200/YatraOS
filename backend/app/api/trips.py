"""Real trip persistence. Builds an itinerary with the AI layer, then stores
it as a graph (nodes + temporal edges) so the Ripple Engine can rehydrate it
later. Requires auth — a trip needs an owner to be saved against."""

from __future__ import annotations

import json
from pathlib import Path

from fastapi import APIRouter, Depends, HTTPException
from supabase import Client

from app.ai.itinerary_builder import build_day_plan
from app.ai.preference_parser import parse_preferences
from app.api.deps import current_user, optional_db
from app.db import trips_repo
from app.graph.trip_graph import TripGraph
from app.schemas.trip_schemas import TripCreateRequest

router = APIRouter(prefix="/api/trips", tags=["trips"])

SEED_DIR = Path(__file__).resolve().parents[3] / "data" / "seed"


def load_places(city: str) -> list[dict]:
    path = SEED_DIR / f"{city}.json"
    if not path.exists():
        raise HTTPException(status_code=404, detail=f"no seed data for city '{city}'")
    return json.loads(path.read_text(encoding="utf-8"))["places"]


def city_currency(city: str) -> str:
    catalog = json.loads((SEED_DIR / "cities.json").read_text(encoding="utf-8"))["cities"]
    for c in catalog:
        if c["id"] == city:
            return c["currency"]
    return "INR"


@router.post("")
def create_trip(payload: TripCreateRequest, auth: tuple[str, Client] = Depends(current_user)):
    user_id, sb = auth
    places = load_places(payload.city)

    interests, pace = payload.interests, payload.pace
    if payload.preferences_text:
        parsed = parse_preferences(payload.preferences_text)
        interests, pace = parsed.interests or interests, parsed.pace

    day_plan, validation = build_day_plan(places, interests=interests, budget=payload.budget, pace=pace)

    trip = trips_repo.create_trip(
        sb,
        traveller_id=user_id,
        city=payload.city,
        currency=city_currency(payload.city),
        start_date=payload.start_date.isoformat(),
        end_date=payload.end_date.isoformat(),
        budget=payload.budget,
    )
    nodes = trips_repo.insert_nodes(sb, trip["id"], day_plan)
    trips_repo.insert_temporal_chain(sb, trip["id"], [n["id"] for n in nodes])

    return {
        "trip": trip,
        "nodes": nodes,
        "validation": {
            "ok": validation.ok,
            "total_cost": validation.total_cost,
            "issues": [vars(i) for i in validation.issues],
        },
    }


@router.get("")
def list_trips(auth: tuple[str | None, Client] = Depends(optional_db)):
    _, sb = auth
    return {"trips": trips_repo.list_trips(sb)}


@router.get("/{trip_id}")
def get_trip(trip_id: str, auth: tuple[str | None, Client] = Depends(optional_db)):
    _, sb = auth
    trip = trips_repo.get_trip(sb, trip_id)
    if not trip:
        raise HTTPException(status_code=404, detail="trip not found")

    nodes = trips_repo.get_nodes(sb, trip_id)
    edges = trips_repo.get_edges(sb, trip_id)
    graph = TripGraph.rehydrate(trip_id, nodes, edges)

    return {"trip": trip, "graph": graph.to_dict()}
