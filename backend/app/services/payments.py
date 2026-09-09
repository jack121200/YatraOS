"""Razorpay test-mode payments. WON'T HAVE beyond test mode for the
hackathon (roadmap Section 1) — this exists so Payment records have a real
create-order path when the frontend adds a checkout step."""

from __future__ import annotations

import razorpay

from app.config import settings


def get_client() -> razorpay.Client:
    if not settings.razorpay_key_id or not settings.razorpay_key_secret:
        raise RuntimeError("RAZORPAY_KEY_ID / RAZORPAY_KEY_SECRET not set in backend/.env")
    return razorpay.Client(auth=(settings.razorpay_key_id, settings.razorpay_key_secret))


def create_order(amount: int, currency: str = "INR") -> dict:
    raise NotImplementedError("wire client.order.create(...) here")
