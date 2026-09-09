"""Core data model (roadmap Section 2) — the shape persisted in Postgres/Supabase.

Nodes/edges are also what TripGraph.rehydrate() consumes, so keep these in
sync with the graph module if fields change.
"""

from __future__ import annotations

from datetime import datetime
from enum import Enum

from pydantic import BaseModel


class NodeType(str, Enum):
    transport = "transport"
    stay = "stay"
    activity = "activity"
    meal = "meal"


class NodeStatus(str, Enum):
    planned = "planned"
    confirmed = "confirmed"
    at_risk = "at_risk"
    broken = "broken"


class DependencyType(str, Enum):
    temporal = "temporal"
    logical = "logical"


class User(BaseModel):
    id: str
    email: str
    display_name: str | None = None
    role: str = "traveller"  # traveller | operator | vendor
    created_at: datetime | None = None


class Vendor(BaseModel):
    id: str
    name: str
    category: str
    contact_info: str | None = None


class Node(BaseModel):
    id: str
    trip_id: str
    type: NodeType
    name: str
    start_time: datetime | None = None
    end_time: datetime | None = None
    location: str | None = None
    cost: int = 0
    status: NodeStatus = NodeStatus.planned
    vendor_id: str | None = None


class Edge(BaseModel):
    from_node_id: str
    to_node_id: str
    dependency_type: DependencyType = DependencyType.temporal
    buffer_minutes: int = 0


class Trip(BaseModel):
    id: str
    traveller_id: str
    city: str
    currency: str = "INR"  # see data/seed/cities.json for the currency per city
    start_date: datetime
    end_date: datetime
    budget: int
    status: str = "draft"  # draft | active | completed | cancelled


class Booking(BaseModel):
    id: str
    node_id: str
    vendor_id: str
    confirmation_ref: str | None = None
    status: str = "pending"  # pending | confirmed | cancelled


class Payment(BaseModel):
    id: str
    trip_id: str
    amount: int  # in the trip's currency
    razorpay_order_id: str | None = None
    status: str = "pending"  # pending | paid | failed | refunded


class LedgerEntry(BaseModel):
    id: str
    trip_id: str
    user_id: str
    node_id: str | None = None
    amount: int  # in the trip's currency
    description: str
