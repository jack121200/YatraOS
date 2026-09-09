"""Disruption -> downstream affected-node detection + Ripple Impact Score.

This is the demo's "money moment" trigger (roadmap Section 2/3): one node
breaks, this module finds everything it touches and how bad that is, before
recovery_ranker.py generates the three recovery plans.
"""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any

from app.graph.trip_graph import TripGraph


@dataclass
class RippleResult:
    broken_node_id: str
    affected_node_ids: list[str]
    total_cost_at_risk: int
    total_time_at_risk_min: int
    minutes_to_next_event: int
    ripple_impact_score: float
    affected_nodes: list[dict[str, Any]] = field(default_factory=list)


def compute_ripple(trip_graph: TripGraph, broken_node_id: str, minutes_to_next_event: int = 0) -> RippleResult:
    trip_graph.set_status(broken_node_id, "broken")

    affected_ids = trip_graph.descendants(broken_node_id)
    affected_nodes = [trip_graph.graph.nodes[n] for n in affected_ids]

    for node_id in affected_ids:
        if trip_graph.graph.nodes[node_id].get("status") != "broken":
            trip_graph.set_status(node_id, "at_risk")

    total_cost = sum(int(n.get("cost", 0)) for n in affected_nodes)
    total_time = sum(int(n.get("duration_min", 0)) for n in affected_nodes)

    score = ripple_impact_score(
        affected_count=len(affected_ids),
        total_cost_at_risk=total_cost,
        minutes_to_next_event=minutes_to_next_event,
    )

    return RippleResult(
        broken_node_id=broken_node_id,
        affected_node_ids=affected_ids,
        total_cost_at_risk=total_cost,
        total_time_at_risk_min=total_time,
        minutes_to_next_event=minutes_to_next_event,
        ripple_impact_score=score,
        affected_nodes=affected_nodes,
    )


def ripple_impact_score(affected_count: int, total_cost_at_risk: int, minutes_to_next_event: int) -> float:
    """Single 0-100 risk number for the operator dashboard badge (Should Have).

    Weighted: how much of the trip is touched, how much money is at risk,
    and urgency (less time to react = higher score). Clamped to [0, 100].
    """
    breadth = min(affected_count * 12, 40)
    cost_weight = min(total_cost_at_risk / 100, 40)
    urgency = 20 if minutes_to_next_event <= 30 else 10 if minutes_to_next_event <= 90 else 0
    return round(min(breadth + cost_weight + urgency, 100), 1)
