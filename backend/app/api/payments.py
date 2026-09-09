"""Booking payment flow. Uses real Razorpay test-mode orders when
RAZORPAY_KEY_ID/SECRET are set in backend/.env; otherwise falls back to a
locally-generated mock order so the booking flow still works end-to-end
during development (the response marks these clearly as 'mock' so nobody
mistakes them for a real gateway)."""

from __future__ import annotations

import uuid

from fastapi import APIRouter, Depends, HTTPException
from supabase import Client

from app.api.deps import optional_db
from app.db import trips_repo
from app.schemas.trip_schemas import PaymentConfirmRequest, PaymentCreateRequest
from app.services import payments as payments_service

router = APIRouter(prefix="/api/payments", tags=["payments"])


@router.post("/create-order")
def create_order(payload: PaymentCreateRequest, auth: tuple[str | None, Client] = Depends(optional_db)):
    _, sb = auth
    trip = trips_repo.get_trip(sb, payload.trip_id)
    if not trip:
        raise HTTPException(status_code=404, detail="trip not found")

    if payments_service.is_configured():
        order = payments_service.create_order(payload.amount, trip["currency"], receipt=f"trip-{trip['id']}")
        order_id = order["id"]
        mode = "razorpay"
    else:
        order_id = f"mock_order_{uuid.uuid4().hex[:16]}"
        mode = "mock"

    payment = trips_repo.create_payment(sb, payload.trip_id, payload.amount, order_id)

    return {
        "mode": mode,
        "payment_id": payment["id"],
        "razorpay_order_id": order_id,
        "amount": payload.amount,
        "currency": trip["currency"],
        "key_id": payments_service.settings.razorpay_key_id if mode == "razorpay" else None,
    }


@router.post("/confirm")
def confirm_payment(payload: PaymentConfirmRequest, auth: tuple[str | None, Client] = Depends(optional_db)):
    _, sb = auth
    payment = trips_repo.get_payment(sb, payload.payment_id)
    if not payment:
        raise HTTPException(status_code=404, detail="payment not found")
    if payment["razorpay_order_id"] != payload.razorpay_order_id:
        raise HTTPException(status_code=400, detail="order id mismatch")

    is_mock = payload.razorpay_order_id.startswith("mock_order_")
    if not is_mock:
        verified = payments_service.verify_payment_signature(
            payload.razorpay_order_id, payload.razorpay_payment_id, payload.razorpay_signature
        )
        if not verified:
            trips_repo.set_payment_status(sb, payment["id"], "failed")
            raise HTTPException(status_code=400, detail="signature verification failed")

    trips_repo.set_payment_status(sb, payment["id"], "paid")
    trip = trips_repo.set_trip_status(sb, payment["trip_id"], "active")

    return {"payment": {**payment, "status": "paid"}, "trip": trip}
