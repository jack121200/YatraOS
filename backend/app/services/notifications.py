"""In-app toast is the actual notification channel for the hackathon demo
(roadmap Golden Rule + Section 1 recommendation: skip Twilio/FCM, an in-app
toast reads identically on a projector). This module is a placeholder for
if Phase 6 (post-hackathon) adds real push."""

from __future__ import annotations


def notify(user_id: str, message: str) -> None:
    raise NotImplementedError("Phase 6 only — real notifications were deliberately descoped for the hackathon")
