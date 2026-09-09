"""Request/response DTOs for the API layer — kept separate from app/models
(the persisted shape) so the API can evolve without touching storage."""

from __future__ import annotations

from datetime import date

from pydantic import BaseModel


class TripCreateRequest(BaseModel):
    city: str
    start_date: date
    end_date: date
    budget: int  # in the city's local currency — see data/seed/cities.json
    interests: list[str] = []
    pace: str = "moderate"  # relaxed | moderate | packed
    preferences_text: str | None = None  # free text, goes through ai/preference_parser.py


class DisruptionTriggerRequest(BaseModel):
    trip_id: str
    node_id: str
    reason: str
    minutes_to_next_event: int = 0


class RecoveryApplyRequest(BaseModel):
    trip_id: str
    plan_id: str


class PaymentCreateRequest(BaseModel):
    trip_id: str
    amount: int  # major unit, e.g. rupees


class PaymentConfirmRequest(BaseModel):
    payment_id: str
    razorpay_order_id: str
    razorpay_payment_id: str
    razorpay_signature: str
