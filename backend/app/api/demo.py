"""Headless proof that the graph engine is real (roadmap Phase 2: "the graph
engine should be demoable headless" via curl/Postman before any UI exists).

Builds a small TripGraph from the seeded Jaipur data, breaks Amber Fort, and
returns the Ripple Engine + recovery_ranker output live. This is the
"yes, this is real, here's the code" answer for Q&A — the actual on-stage
demo uses the pre-scripted jaipur_disruption_scenario.json instead, per the
roadmap's Golden Rule (no live logic on the judged click-path).
"""

from __future__ import annotations

import json
from pathlib import Path

from fastapi import APIRouter, HTTPException, Query

from app.ai.itinerary_builder import build_day_plan
from app.ai.preference_parser import parse_preferences
from app.graph.recovery_ranker import rank_recovery_plans
from app.graph.ripple_engine import compute_ripple
from app.graph.trip_graph import TripGraph

router = APIRouter(prefix="/api/demo", tags=["demo"])

SEED_DIR = Path(__file__).resolve().parents[3] / "data" / "seed"


def _load_places(city: str = "jaipur") -> list[dict]:
    path = SEED_DIR / f"{city}.json"
    if not path.exists():
        raise HTTPException(status_code=404, detail=f"no seed data for city '{city}'")
    return json.loads(path.read_text(encoding="utf-8"))["places"]


@router.get("/places")
def list_places(city: str = Query("jaipur")):
    """Raw place pool for a city — stays/eateries double as the read-only
    vendor list for the operator VendorView (roadmap: real auth is a WON'T
    HAVE, a read-only view is enough)."""
    return {"city": city, "places": _load_places(city)}


@router.get("/cities")
def list_cities():
    path = SEED_DIR / "cities.json"
    if not path.exists():
        raise HTTPException(status_code=500, detail=f"seed file not found: {path}")
    return json.loads(path.read_text(encoding="utf-8"))


@router.get("/build-itinerary")
def build_itinerary_demo(
    city: str = Query("jaipur"),
    interests: str = Query("", description="comma-separated, e.g. heritage,food"),
    budget: int = Query(2000, description="in the city's local currency — see /api/demo/cities for which"),
    pace: str = Query("moderate"),
    preferences_text: str | None = Query(None, description="free text, parsed via ai/preference_parser.py instead of `interests`/`pace` if given"),
):
    """Exercises the real ai/itinerary_builder.py + validator.py against
    seeded data for any of the 7 demo-ready cities — the MUST HAVE
    build-your-own-trip flow, headless (see module docstring in this file
    for why headless-first matters for Q&A vs. the on-stage click-path)."""
    places = _load_places(city)

    if preferences_text:
        parsed = parse_preferences(preferences_text)
        interest_list, resolved_pace = parsed.interests, parsed.pace
    else:
        interest_list = [i.strip() for i in interests.split(",") if i.strip()]
        resolved_pace = pace

    day_plan, validation = build_day_plan(places, interests=interest_list, budget=budget, pace=resolved_pace)

    return {
        "city": city,
        "interests_used": interest_list,
        "pace_used": resolved_pace,
        "day_plan": day_plan,
        "validation": {
            "ok": validation.ok,
            "total_cost": validation.total_cost,
            "issues": [vars(i) for i in validation.issues],
        },
    }


def _load_scenario(city: str) -> dict:
    path = SEED_DIR / f"{city}_disruption_scenario.json"
    if not path.exists():
        raise HTTPException(status_code=404, detail=f"no disruption scenario for city '{city}'")
    return json.loads(path.read_text(encoding="utf-8"))


def _build_demo_graph(places_by_id: dict[str, dict], step_node_ids: list[str], trip_id: str) -> TripGraph:
    """Builds a temporal chain graph from a scenario's original_plan_for_window
    steps — same shape for every city since the seed schema is consistent."""
    tg = TripGraph(trip_id=trip_id)

    clock = 14 * 60  # scenario windows are afternoon; exact value only affects displayed times
    for node_id in step_node_ids:
        p = places_by_id[node_id]
        duration = p.get("avg_duration_min") or 0
        tg.add_node(
            node_id,
            id=node_id,
            category=p["category"],
            name=p["name"],
            cost=p.get("avg_cost", 0),
            duration_min=duration,
            lat=p.get("lat"),
            lng=p.get("lng"),
            start_minutes=clock,
            status="planned",
        )
        clock += duration

    for a, b in zip(step_node_ids, step_node_ids[1:]):
        tg.add_edge(a, b, dependency_type="temporal", buffer_minutes=0)
    return tg


@router.get("/operator-trips")
def operator_trips_demo():
    """Mocks the operator dashboard's 'live trips' feed (roadmap MUST HAVE)
    using every demo_ready city's own scripted disruption as if it were a
    real in-flight trip right now — runs the real ripple engine per city, no
    fake numbers. Placeholder until Phase 2 gives operators real trips from
    Supabase; the shape here is what that endpoint should return."""
    cities_catalog = json.loads((SEED_DIR / "cities.json").read_text(encoding="utf-8"))["cities"]
    trips = []
    for c in cities_catalog:
        if not c.get("demo_ready"):
            continue
        try:
            result = ripple_demo(city=c["id"])
        except HTTPException:
            continue
        trips.append(
            {
                "trip_id": f"demo-{c['id']}",
                "city": c["name"],
                "country": c["country"],
                "currency": c["currency"],
                "broken_node_name": result["trigger"]["broken_node_name"],
                "reason": result["trigger"]["reason"],
                "ripple_impact_score": result["ripple"]["ripple_impact_score"],
                "total_cost_at_risk": result["ripple"]["total_cost_at_risk"],
                "affected_count": len(result["ripple"]["affected_node_ids"]),
            }
        )
    trips.sort(key=lambda t: t["ripple_impact_score"], reverse=True)
    return {"trips": trips}


@router.get("/ripple")
def ripple_demo(city: str = Query("jaipur")):
    """Generalized version of the original jaipur-only demo — works for any
    of the 7 seeded cities by reading that city's own disruption scenario."""
    places = _load_places(city)
    places_by_id = {p["id"]: p for p in places}
    scenario = _load_scenario(city)

    step_ids = [s["place_id"] for s in scenario["original_plan_for_window"]["steps"]]
    broken_id = scenario["trigger"]["broken_node_id"]
    if broken_id not in step_ids:
        step_ids = [broken_id] + step_ids

    trip_graph = _build_demo_graph(places_by_id, step_ids, trip_id=f"demo-{city}")
    ripple = compute_ripple(trip_graph, broken_node_id=broken_id, minutes_to_next_event=15)
    plans = rank_recovery_plans(trip_graph, ripple, candidate_pool=places)

    return {
        "city": city,
        "trigger": scenario["trigger"],
        "ripple": {
            "broken_node_id": ripple.broken_node_id,
            "affected_node_ids": ripple.affected_node_ids,
            "total_cost_at_risk": ripple.total_cost_at_risk,
            "total_time_at_risk_min": ripple.total_time_at_risk_min,
            "ripple_impact_score": ripple.ripple_impact_score,
        },
        "recovery_plans": plans,
        "graph": trip_graph.to_dict(),
    }
