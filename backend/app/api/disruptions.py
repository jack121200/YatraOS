from fastapi import APIRouter, Depends, HTTPException
from supabase import Client

from app.api.deps import optional_db
from app.db import trips_repo
from app.graph.ripple_engine import compute_ripple
from app.graph.trip_graph import TripGraph
from app.schemas.trip_schemas import DisruptionTriggerRequest

router = APIRouter(prefix="/api/disruptions", tags=["disruptions"])


@router.post("/trigger")
def trigger_disruption(payload: DisruptionTriggerRequest, auth: tuple[str | None, Client] = Depends(optional_db)):
    """Breaks one node on a persisted trip, runs the Ripple Engine, and writes
    the resulting at_risk/broken statuses back so the operator dashboard and a
    page refresh both see the same state."""
    _, sb = auth
    trip = trips_repo.get_trip(sb, payload.trip_id)
    if not trip:
        raise HTTPException(status_code=404, detail="trip not found")

    nodes = trips_repo.get_nodes(sb, payload.trip_id)
    if not any(n["id"] == payload.node_id for n in nodes):
        raise HTTPException(status_code=404, detail="node not part of this trip")

    edges = trips_repo.get_edges(sb, payload.trip_id)
    graph = TripGraph.rehydrate(payload.trip_id, nodes, edges)

    ripple = compute_ripple(graph, payload.node_id, minutes_to_next_event=payload.minutes_to_next_event)

    trips_repo.set_node_statuses(
        sb, {payload.node_id: "broken", **{n: "at_risk" for n in ripple.affected_node_ids}}
    )

    return {
        "trip_id": payload.trip_id,
        "reason": payload.reason,
        "ripple": {
            "broken_node_id": ripple.broken_node_id,
            "affected_node_ids": ripple.affected_node_ids,
            "total_cost_at_risk": ripple.total_cost_at_risk,
            "total_time_at_risk_min": ripple.total_time_at_risk_min,
            "ripple_impact_score": ripple.ripple_impact_score,
        },
        "graph": graph.to_dict(),
    }
