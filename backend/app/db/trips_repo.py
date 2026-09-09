"""Persistence for trips and their graph.

Every function takes an explicit Supabase client so the caller decides the
security context: a user-scoped client (RLS enforced, ownership guaranteed by
the database) or the service-role client (RLS bypassed — only the operator
views, which must read across users). Nothing here assumes one or the other.
"""

from __future__ import annotations

from typing import Any

from supabase import Client


def create_trip(
    sb: Client,
    traveller_id: str,
    city: str,
    currency: str,
    start_date: str,
    end_date: str,
    budget: int,
) -> dict[str, Any]:
    res = (
        sb.table("trips")
        .insert(
            {
                "traveller_id": traveller_id,
                "city": city,
                "currency": currency,
                "start_date": start_date,
                "end_date": end_date,
                "budget": budget,
                "status": "active",
            }
        )
        .execute()
    )
    return res.data[0]


def insert_nodes(sb: Client, trip_id: str, day_plan: list[dict[str, Any]]) -> list[dict[str, Any]]:
    """day_plan items come straight from ai/itinerary_builder.build_day_plan."""
    rows = [
        {
            "trip_id": trip_id,
            "type": item["category"],
            "name": item["name"],
            "seed_place_id": item["id"],
            "lat": item.get("lat"),
            "lng": item.get("lng"),
            "start_minutes": item.get("start_minutes"),
            "duration_min": item.get("avg_duration_min") or 0,
            "cost": item.get("avg_cost", 0),
            "status": "planned",
        }
        for item in day_plan
    ]
    if not rows:
        return []
    return sb.table("nodes").insert(rows).execute().data


def insert_temporal_chain(sb: Client, trip_id: str, node_ids: list[str]) -> None:
    """A day plan is a linear chain: each stop depends on the previous one."""
    rows = [
        {"trip_id": trip_id, "from_node_id": a, "to_node_id": b, "dependency_type": "temporal", "buffer_minutes": 0}
        for a, b in zip(node_ids, node_ids[1:])
    ]
    if rows:
        sb.table("edges").insert(rows).execute()


def get_trip(sb: Client, trip_id: str) -> dict[str, Any] | None:
    rows = sb.table("trips").select("*").eq("id", trip_id).execute().data
    return rows[0] if rows else None


def get_nodes(sb: Client, trip_id: str) -> list[dict[str, Any]]:
    return sb.table("nodes").select("*").eq("trip_id", trip_id).order("start_minutes").execute().data


def get_edges(sb: Client, trip_id: str) -> list[dict[str, Any]]:
    return sb.table("edges").select("*").eq("trip_id", trip_id).execute().data


def set_node_statuses(sb: Client, statuses: dict[str, str]) -> None:
    """{node_id: status} — one update per node; a day plan is small enough
    that batching this into a single statement isn't worth the complexity."""
    for node_id, status in statuses.items():
        sb.table("nodes").update({"status": status}).eq("id", node_id).execute()


def list_trips(sb: Client) -> list[dict[str, Any]]:
    """Returns whatever the client's security context allows: a user-scoped
    client sees only its own trips (RLS), the service-role client sees all."""
    return sb.table("trips").select("*").order("created_at", desc=True).execute().data


def replace_node(sb: Client, node_id: str, replacement: dict[str, Any]) -> dict[str, Any]:
    """Swaps a broken node's identity for its replacement, keeping the node's
    id so every edge pointing at it stays valid."""
    res = (
        sb.table("nodes")
        .update(
            {
                "name": replacement["name"],
                "seed_place_id": replacement["id"],
                "lat": replacement.get("lat"),
                "lng": replacement.get("lng"),
                "duration_min": replacement.get("avg_duration_min") or 0,
                "cost": replacement.get("avg_cost", 0),
                "status": "confirmed",
                "type": replacement["category"],
            }
        )
        .eq("id", node_id)
        .execute()
    )
    return res.data[0]


def upsert_ledger(sb: Client, trip_id: str, entries: list[dict[str, Any]]) -> list[dict[str, Any]]:
    """Replaces the trip's ledger with the given split. Simpler and less
    error-prone than diffing individual rows."""
    sb.table("ledger_entries").delete().eq("trip_id", trip_id).execute()
    rows = [
        {
            "trip_id": trip_id,
            "person_name": e["person_name"],
            "node_id": e.get("node_id"),
            "amount": int(e["amount"]),
            "description": e.get("description", ""),
        }
        for e in entries
    ]
    if not rows:
        return []
    return sb.table("ledger_entries").insert(rows).execute().data


def get_ledger(sb: Client, trip_id: str) -> list[dict[str, Any]]:
    return sb.table("ledger_entries").select("*").eq("trip_id", trip_id).execute().data


def set_trip_status(sb: Client, trip_id: str, status: str) -> dict[str, Any]:
    res = sb.table("trips").update({"status": status}).eq("id", trip_id).execute()
    return res.data[0]


def create_payment(sb: Client, trip_id: str, amount: int, razorpay_order_id: str | None) -> dict[str, Any]:
    res = (
        sb.table("payments")
        .insert({"trip_id": trip_id, "amount": amount, "razorpay_order_id": razorpay_order_id, "status": "pending"})
        .execute()
    )
    return res.data[0]


def get_payment(sb: Client, payment_id: str) -> dict[str, Any] | None:
    rows = sb.table("payments").select("*").eq("id", payment_id).execute().data
    return rows[0] if rows else None


def set_payment_status(sb: Client, payment_id: str, status: str) -> dict[str, Any]:
    res = sb.table("payments").update({"status": status}).eq("id", payment_id).execute()
    return res.data[0]
