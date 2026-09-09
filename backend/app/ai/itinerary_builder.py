"""Rule-based/greedy day-by-day itinerary assembly (roadmap Phase 2), scored
by interest match (embeddings.py) and checked by validator.py before
returning. Draws from the seeded place pool for a city — the same shape as
data/seed/<city>.json — with live OSM/ORS/OpenWeather calls as a fallback
layer for cities without a curated seed (services/places.py, routing.py).
"""

from __future__ import annotations

from app.ai.embeddings import score_activities
from app.ai.validator import ValidationResult, validate_itinerary

PACE_ACTIVITIES_PER_DAY = {"relaxed": 3, "moderate": 4, "packed": 6}
DAY_START_MINUTES = 9 * 60  # 09:00
MEAL_SLOTS_MINUTES = (13 * 60, 20 * 60)  # lunch ~13:00, dinner ~20:00


def _pick_best(pool: list[dict], scores: dict[str, float], used_ids: set[str]) -> dict | None:
    candidates = [p for p in pool if p["id"] not in used_ids]
    if not candidates:
        return None
    return max(candidates, key=lambda p: scores.get(p["id"], 0.0))


def build_day_plan(
    places: list[dict],
    interests: list[str],
    budget: int,
    pace: str = "moderate",
) -> tuple[list[dict], ValidationResult]:
    """Builds ONE day's plan. Multi-day trips call this once per day with a
    shrinking budget and an accumulating used_ids set (left to the
    caller/API layer — kept out of this function to stay easily testable)."""
    activities = [p for p in places if p["category"] == "activity"]
    eateries = [p for p in places if p["category"] == "eatery"]

    scores = score_activities(interests, activities)
    n_activities = PACE_ACTIVITIES_PER_DAY.get(pace, 4)

    used_ids: set[str] = set()
    day_plan: list[dict] = []
    clock = DAY_START_MINUTES
    running_cost = 0
    meal_slots_pending = list(MEAL_SLOTS_MINUTES)

    def _try_insert_due_meals() -> None:
        nonlocal clock, running_cost
        for meal_time in list(meal_slots_pending):
            if clock < meal_time or not eateries:
                continue
            meal = eateries[len(day_plan) % len(eateries)]
            meal_slots_pending.remove(meal_time)
            if meal["id"] in used_ids or running_cost + int(meal.get("avg_cost", 0)) > budget:
                continue
            day_plan.append({**meal, "start_minutes": clock})
            used_ids.add(meal["id"])
            running_cost += int(meal.get("avg_cost", 0))
            clock += int(meal.get("avg_duration_min") or 45) + 15

    for _ in range(n_activities):
        _try_insert_due_meals()
        pick = _pick_best(activities, scores, used_ids)
        if pick is None:
            break
        if running_cost + int(pick.get("avg_cost", 0)) > budget:
            used_ids.add(pick["id"])  # too expensive, skip and try the next-best
            continue
        entry = {**pick, "start_minutes": clock}
        day_plan.append(entry)
        used_ids.add(pick["id"])
        running_cost += int(pick.get("avg_cost", 0))
        clock += int(pick.get("avg_duration_min") or 60) + 30  # 30min buffer between stops

    _try_insert_due_meals()

    day_plan.sort(key=lambda p: p["start_minutes"])
    result = validate_itinerary(day_plan, budget)
    return day_plan, result
