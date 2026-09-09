"""Operator views over real persisted trips. Deliberately NOT filtered by
traveller_id: an operator's whole job is seeing other people's trips, which
needs the service-role client (RLS blocks anon/user clients from reading
across users by design — see deps.operator_db)."""

from __future__ import annotations

from fastapi import APIRouter, Depends
from supabase import Client

from app.api.deps import operator_db
from app.db import trips_repo
from app.graph.ripple_engine import compute_ripple, ripple_impact_score
from app.graph.trip_graph import TripGraph

router = APIRouter(prefix="/api/operator", tags=["operator"])

ALERT_THRESHOLD = 30


def _summarise(sb: Client, trip: dict) -> dict:
    nodes = trips_repo.get_nodes(sb, trip["id"])
    edges = trips_repo.get_edges(sb, trip["id"])
    broken = next((n for n in nodes if n.get("status") == "broken"), None)

    if not broken:
        at_risk = [n for n in nodes if n.get("status") == "at_risk"]
        cost_at_risk = sum(int(n.get("cost", 0)) for n in at_risk)
        return {
            "trip_id": trip["id"],
            "city": trip["city"],
            "currency": trip["currency"],
            "status": trip["status"],
            "broken_node_name": None,
            "affected_count": len(at_risk),
            "total_cost_at_risk": cost_at_risk,
            "ripple_impact_score": ripple_impact_score(len(at_risk), cost_at_risk, 999) if at_risk else 0.0,
        }

    graph = TripGraph.rehydrate(trip["id"], nodes, edges)
    ripple = compute_ripple(graph, broken["id"], minutes_to_next_event=15)
    return {
        "trip_id": trip["id"],
        "city": trip["city"],
        "currency": trip["currency"],
        "status": trip["status"],
        "broken_node_name": broken["name"],
        "affected_count": len(ripple.affected_node_ids),
        "total_cost_at_risk": ripple.total_cost_at_risk,
        "ripple_impact_score": ripple.ripple_impact_score,
    }


@router.get("/trips")
def list_live_trips(sb: Client = Depends(operator_db)):
    summaries = [_summarise(sb, t) for t in trips_repo.list_trips(sb)]
    summaries.sort(key=lambda s: s["ripple_impact_score"], reverse=True)
    return {"trips": summaries}


@router.get("/alerts")
def list_risk_alerts(sb: Client = Depends(operator_db)):
    alerts = [s for s in (_summarise(sb, t) for t in trips_repo.list_trips(sb)) if s["ripple_impact_score"] >= ALERT_THRESHOLD]
    alerts.sort(key=lambda s: s["ripple_impact_score"], reverse=True)
    return {"threshold": ALERT_THRESHOLD, "alerts": alerts}
