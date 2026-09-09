from fastapi import APIRouter, Depends, HTTPException
from supabase import Client

from app.api.deps import optional_db
from app.api.trips import load_places
from app.db import trips_repo
from app.graph.recovery_ranker import rank_recovery_plans
from app.graph.ripple_engine import compute_ripple
from app.graph.trip_graph import TripGraph
from app.schemas.trip_schemas import RecoveryApplyRequest

router = APIRouter(prefix="/api/recovery", tags=["recovery"])


def _rehydrate(sb: Client, trip_id: str):
    trip = trips_repo.get_trip(sb, trip_id)
    if not trip:
        raise HTTPException(status_code=404, detail="trip not found")
    nodes = trips_repo.get_nodes(sb, trip_id)
    edges = trips_repo.get_edges(sb, trip_id)
    return trip, nodes, TripGraph.rehydrate(trip_id, nodes, edges)


@router.get("/{trip_id}/plans")
def get_recovery_plans(trip_id: str, auth: tuple[str | None, Client] = Depends(optional_db)):
    """Live recovery plans for whichever node on this trip is currently broken.
    Same output shape the UI renders — there is only one recovery-plan format
    in the system now (see graph/recovery_ranker.py)."""
    _, sb = auth
    trip, nodes, graph = _rehydrate(sb, trip_id)

    broken = next((n for n in nodes if n.get("status") == "broken"), None)
    if not broken:
        return {"trip_id": trip_id, "currency": trip["currency"], "broken_node": None, "recovery_plans": []}

    ripple = compute_ripple(graph, broken["id"], minutes_to_next_event=15)
    plans = rank_recovery_plans(graph, ripple, candidate_pool=load_places(trip["city"]))

    return {
        "trip_id": trip_id,
        "city": trip["city"],
        "currency": trip["currency"],
        "broken_node": {"id": broken["id"], "name": broken["name"]},
        "ripple_impact_score": ripple.ripple_impact_score,
        "recovery_plans": plans,
    }


@router.post("/apply")
def apply_recovery_plan(payload: RecoveryApplyRequest, auth: tuple[str | None, Client] = Depends(optional_db)):
    """Applies a plan by swapping the broken node's identity for the chosen
    replacement, then clearing at_risk on everything downstream."""
    _, sb = auth
    trip, nodes, graph = _rehydrate(sb, payload.trip_id)

    broken = next((n for n in nodes if n.get("status") == "broken"), None)
    if not broken:
        raise HTTPException(status_code=409, detail="nothing is broken on this trip")

    ripple = compute_ripple(graph, broken["id"], minutes_to_next_event=15)
    plans = rank_recovery_plans(graph, ripple, candidate_pool=load_places(trip["city"]))

    plan = next((p for p in plans if p["id"] == payload.plan_id), None)
    if not plan:
        raise HTTPException(status_code=404, detail=f"plan '{payload.plan_id}' not available for this trip")

    places = {p["id"]: p for p in load_places(trip["city"])}
    replacement = places[plan["replacement_node_id"]]

    updated = trips_repo.replace_node(sb, broken["id"], replacement)
    trips_repo.set_node_statuses(sb, {n: "confirmed" for n in ripple.affected_node_ids})

    return {
        "applied_plan_id": plan["id"],
        "replaced_node": updated,
        "restored_node_ids": ripple.affected_node_ids,
    }
