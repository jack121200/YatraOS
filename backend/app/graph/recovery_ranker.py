"""Generate + rank the three recovery plans shown side by side in the UI.

Emits the SAME shape the frontend's RecoveryPlanCard renders (id, label,
description, steps[], total_cost, total_duration_min, cost_delta,
time_delta_min, tradeoff, best_for) so there is ONE recovery-plan format in
the system. Previously the UI read hand-authored plans out of the seed JSON
while this module produced an incompatible summary that nothing rendered —
two sources of truth for the same concept.

Narrative text is template-generated from the real numbers, deliberately not
LLM-generated: the roadmap's Golden Rule keeps model calls off the judged
demo path, and templates make the output deterministic and instant.
"""

from __future__ import annotations

import math
from dataclasses import dataclass
from typing import Any

from app.graph.ripple_engine import RippleResult
from app.graph.trip_graph import TripGraph

STRATEGIES = ("cheapest", "fastest", "least_disruption")

LABELS = {
    "cheapest": "Cheapest recovery",
    "fastest": "Fastest recovery",
    "least_disruption": "Least disruptive",
}

BEST_FOR = {
    "cheapest": "Budget-conscious travellers",
    "fastest": "Getting back on schedule",
    "least_disruption": "Keeping the rest of the day intact",
}


@dataclass
class RecoveryCandidate:
    replacement: dict[str, Any]
    cost_delta: int
    time_delta_min: int
    distance_km: float


def _haversine_km(lat1: float, lng1: float, lat2: float, lng2: float) -> float:
    r = 6371.0
    p1, p2 = math.radians(lat1), math.radians(lat2)
    dphi = math.radians(lat2 - lat1)
    dlambda = math.radians(lng2 - lng1)
    a = math.sin(dphi / 2) ** 2 + math.cos(p1) * math.cos(p2) * math.sin(dlambda / 2) ** 2
    return 2 * r * math.asin(math.sqrt(a))


def _minutes_to_clock(minutes: int) -> str:
    h, m = divmod(max(minutes, 0), 60)
    return f"{h % 24:02d}:{m:02d}"


def generate_candidates(
    trip_graph: TripGraph, node_id: str, candidate_pool: list[dict[str, Any]]
) -> list[RecoveryCandidate]:
    """Same-category replacements for the broken node, priced against it."""
    broken = trip_graph.graph.nodes[node_id]
    category = broken.get("category")
    broken_cost = int(broken.get("cost", 0))
    broken_duration = int(broken.get("duration_min", 0))
    broken_lat, broken_lng = broken.get("lat"), broken.get("lng")
    # For a persisted trip, node_id is the nodes.id UUID, not the seed place
    # id — comparing candidate["id"] (a seed id like "act-01") against it
    # would never match, silently letting the broken place recommend itself
    # as its own replacement. seed_place_id is what actually identifies it
    # in candidate_pool; demo.py's in-memory graphs set node_id == seed id,
    # so this falls back to node_id there and behaves the same as before.
    broken_seed_id = broken.get("seed_place_id") or node_id

    out: list[RecoveryCandidate] = []
    for candidate in candidate_pool:
        if candidate.get("category") != category or candidate.get("id") == broken_seed_id:
            continue
        distance = 0.0
        if None not in (broken_lat, broken_lng, candidate.get("lat"), candidate.get("lng")):
            distance = _haversine_km(broken_lat, broken_lng, candidate["lat"], candidate["lng"])
        out.append(
            RecoveryCandidate(
                replacement=candidate,
                cost_delta=int(candidate.get("avg_cost", 0)) - broken_cost,
                time_delta_min=int(candidate.get("avg_duration_min") or 0) - broken_duration,
                distance_km=distance,
            )
        )
    return out


def _sort_key(strategy: str):
    if strategy == "cheapest":
        return lambda c: (c.cost_delta, c.distance_km)
    if strategy == "fastest":
        return lambda c: (c.time_delta_min, c.distance_km)
    return lambda c: (c.distance_km, c.cost_delta)


def _pick(candidates: list[RecoveryCandidate], strategy: str, exclude: set[str]) -> RecoveryCandidate | None:
    """Best candidate for this strategy that no earlier strategy already took.

    Falling back to the next-best (rather than dropping the plan) matters:
    when one option happens to be cheapest AND fastest AND closest, the user
    should still get three genuinely different choices to compare, each the
    best remaining option under its own metric.
    """
    available = [c for c in candidates if c.replacement["id"] not in exclude]
    if not available:
        return None
    return min(available, key=_sort_key(strategy))


def _describe(strategy: str, c: RecoveryCandidate, broken_name: str, downstream: list[dict[str, Any]]) -> tuple[str, str]:
    """Returns (description, tradeoff) built from the actual numbers."""
    name = c.replacement["name"]
    kept = f" The rest of the day ({', '.join(n['name'] for n in downstream)}) stays as planned." if downstream else ""

    if strategy == "cheapest":
        description = f"Swap {broken_name} for {name}, the lowest-cost alternative in the same category.{kept}"
    elif strategy == "fastest":
        description = f"Swap {broken_name} for {name}, which takes the least time so you rejoin the schedule soonest.{kept}"
    else:
        description = f"Swap {broken_name} for {name} — only {c.distance_km:.1f}km away, so travel time barely shifts.{kept}"

    cost_part = "costs the same" if c.cost_delta == 0 else f"{'costs' if c.cost_delta > 0 else 'saves'} {abs(c.cost_delta)}"
    time_part = (
        "takes the same time"
        if c.time_delta_min == 0
        else f"{'adds' if c.time_delta_min > 0 else 'frees up'} {abs(c.time_delta_min)} min"
    )
    tradeoff = f"Versus the original stop this {cost_part} and {time_part}."
    return description, tradeoff


def _build_steps(
    c: RecoveryCandidate, broken_node: dict[str, Any], downstream: list[dict[str, Any]]
) -> list[dict[str, Any]]:
    """Replacement stop, then every downstream stop shifted by the time delta
    so the printed clock times are actually consistent with the swap."""
    start = int(broken_node.get("start_minutes") or 9 * 60)
    steps = [
        {
            "place_id": c.replacement["id"],
            "name": c.replacement["name"],
            "start": _minutes_to_clock(start),
            "duration_min": int(c.replacement.get("avg_duration_min") or 0),
            "cost": int(c.replacement.get("avg_cost", 0)),
        }
    ]
    for node in downstream:
        node_start = int(node.get("start_minutes") or 0) + c.time_delta_min
        steps.append(
            {
                "place_id": node.get("id", node.get("seed_place_id", "")),
                "name": node["name"],
                "start": _minutes_to_clock(node_start),
                "duration_min": int(node.get("duration_min", 0)),
                "cost": int(node.get("cost", 0)),
            }
        )
    return steps


def rank_recovery_plans(
    trip_graph: TripGraph, ripple: RippleResult, candidate_pool: list[dict[str, Any]]
) -> list[dict[str, Any]]:
    """Returns up to 3 plans in the frontend's RecoveryPlan shape — one per
    strategy, each a distinct replacement (see _pick for why)."""
    candidates = generate_candidates(trip_graph, ripple.broken_node_id, candidate_pool)
    if not candidates:
        return []

    broken_node = trip_graph.graph.nodes[ripple.broken_node_id]
    broken_name = broken_node.get("name", "the cancelled stop")
    downstream = [trip_graph.graph.nodes[n] for n in ripple.affected_node_ids]

    original_cost = int(broken_node.get("cost", 0)) + sum(int(n.get("cost", 0)) for n in downstream)
    original_duration = int(broken_node.get("duration_min", 0)) + sum(int(n.get("duration_min", 0)) for n in downstream)

    plans: list[dict[str, Any]] = []
    seen_replacements: set[str] = set()

    for strategy in STRATEGIES:
        c = _pick(candidates, strategy, exclude=seen_replacements)
        if c is None:
            continue  # pool exhausted (tiny city dataset) — fewer than 3 cards
        seen_replacements.add(c.replacement["id"])

        steps = _build_steps(c, broken_node, downstream)
        description, tradeoff = _describe(strategy, c, broken_name, downstream)

        plans.append(
            {
                "id": f"plan-{strategy.replace('_', '-')}",
                "strategy": strategy,
                "label": LABELS[strategy],
                "description": description,
                "steps": steps,
                "total_cost": sum(s["cost"] for s in steps),
                "total_duration_min": original_duration + c.time_delta_min,
                "cost_delta": c.cost_delta,
                "time_delta_min": c.time_delta_min,
                "tradeoff": tradeoff,
                "best_for": BEST_FOR[strategy],
                "replacement_node_id": c.replacement["id"],
                "broken_node_id": ripple.broken_node_id,
            }
        )

    # Reference figures the UI can show as the "do nothing" baseline.
    for p in plans:
        p["original_total_cost"] = original_cost
        p["original_total_duration_min"] = original_duration

    return plans
