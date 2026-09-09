"""Razorpay test-mode payments. WON'T HAVE beyond test mode for the
hackathon (roadmap Section 1) — this exists so Payment records have a real
create-order path when the frontend adds a checkout step."""

from __future__ import annotations

import razorpay

from app.config import settings


def is_configured() -> bool:
    return bool(settings.razorpay_key_id and settings.razorpay_key_secret)


def get_client() -> razorpay.Client:
    if not is_configured():
        raise RuntimeError("RAZORPAY_KEY_ID / RAZORPAY_KEY_SECRET not set in backend/.env")
    return razorpay.Client(auth=(settings.razorpay_key_id, settings.razorpay_key_secret))


def create_order(amount: int, currency: str, receipt: str) -> dict:
    """amount is in the major unit (rupees); Razorpay wants the minor unit."""
    client = get_client()
    return client.order.create(
        {"amount": amount * 100, "currency": currency, "receipt": receipt, "payment_capture": 1}
    )


def verify_payment_signature(order_id: str, payment_id: str, signature: str) -> bool:
    client = get_client()
    try:
        client.utility.verify_payment_signature(
            {"razorpay_order_id": order_id, "razorpay_payment_id": payment_id, "razorpay_signature": signature}
        )
        return True
    except razorpay.errors.SignatureVerificationError:
        return False
