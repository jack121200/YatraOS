"""Rule-based time/distance/budget checks — runs on every AI-drafted plan
before it's shown to the user (roadmap: "before any AI plan is shown").
No LLM involved here on purpose; this is the deterministic safety net.
"""

from __future__ import annotations

import math
from dataclasses import dataclass, field

AVG_CITY_SPEED_KMH = 20  # conservative in-city travel assumption for the feasibility check


@dataclass
class ValidationIssue:
    node_id: str
    kind: str  # "budget" | "overlap" | "unreachable" | "closed"
    message: str


@dataclass
class ValidationResult:
    ok: bool
    total_cost: int
    issues: list[ValidationIssue] = field(default_factory=list)


def _haversine_km(lat1: float, lng1: float, lat2: float, lng2: float) -> float:
    r = 6371.0
    p1, p2 = math.radians(lat1), math.radians(lat2)
    dphi = math.radians(lat2 - lat1)
    dlambda = math.radians(lng2 - lng1)
    a = math.sin(dphi / 2) ** 2 + math.cos(p1) * math.cos(p2) * math.sin(dlambda / 2) ** 2
    return 2 * r * math.asin(math.sqrt(a))


def validate_itinerary(day_plan: list[dict], budget: int) -> ValidationResult:
    """day_plan: ordered list of place dicts with at least id, lat, lng,
    avg_cost, avg_duration_min, and a scheduled `start_minutes` (minutes
    from day start) set by itinerary_builder.py. `budget` is in whatever
    currency the place data uses — see each city's top-level `currency`."""
    issues: list[ValidationIssue] = []
    total_cost = sum(int(p.get("avg_cost", 0)) for p in day_plan)

    if total_cost > budget:
        issues.append(
            ValidationIssue(
                node_id="*",
                kind="budget",
                message=f"Total cost {total_cost} exceeds budget {budget} by {total_cost - budget}",
            )
        )

    for prev, curr in zip(day_plan, day_plan[1:]):
        prev_end = prev.get("start_minutes", 0) + int(prev.get("avg_duration_min") or 0)
        gap_min = curr.get("start_minutes", 0) - prev_end

        if gap_min < 0:
            issues.append(
                ValidationIssue(
                    node_id=curr["id"],
                    kind="overlap",
                    message=f"{curr['name']} starts before {prev['name']} finishes (overlap {-gap_min}min)",
                )
            )
            continue

        if "lat" in prev and "lat" in curr:
            distance_km = _haversine_km(prev["lat"], prev["lng"], curr["lat"], curr["lng"])
            travel_min = (distance_km / AVG_CITY_SPEED_KMH) * 60
            if travel_min > gap_min:
                issues.append(
                    ValidationIssue(
                        node_id=curr["id"],
                        kind="unreachable",
                        message=(
                            f"{distance_km:.1f}km from {prev['name']} needs ~{travel_min:.0f}min, "
                            f"only {gap_min}min scheduled"
                        ),
                    )
                )

    return ValidationResult(ok=len(issues) == 0, total_cost=total_cost, issues=issues)

