"""Auth + DB-client dependencies.

The frontend sends its Supabase access token as a bearer token; we verify it
against Supabase rather than trusting a client-supplied user id, which would
be trivially spoofable. Once verified, every route gets back a Supabase
client already scoped to that user — every query it runs is subject to the
RLS policies in supabase/migrations/0001_init.sql, so a route can't
accidentally leak another user's trip even if it forgets to filter.
"""

from __future__ import annotations

from fastapi import Header, HTTPException
from supabase import Client

from app.db.supabase_client import get_supabase, get_user_client, has_service_role


def _token_from_header(authorization: str | None) -> str | None:
    if not authorization or not authorization.lower().startswith("bearer "):
        return None
    token = authorization.split(" ", 1)[1].strip()
    return token or None


def _resolve(authorization: str | None) -> tuple[str | None, Client | None]:
    token = _token_from_header(authorization)
    if not token:
        return None, None
    try:
        user_client = get_user_client(token)
        res = user_client.auth.get_user(token)
    except Exception:
        return None, None
    if not res or not res.user:
        return None, None
    return res.user.id, user_client


def current_user(authorization: str | None = Header(default=None)) -> tuple[str, Client]:
    """Required auth — 401 if the token is missing or invalid. Returns
    (user_id, a client scoped to that user via RLS)."""
    user_id, client = _resolve(authorization)
    if not user_id or not client:
        raise HTTPException(status_code=401, detail="Sign in to use this endpoint")
    return user_id, client


def current_user_id(authorization: str | None = Header(default=None)) -> str:
    user_id, _ = current_user(authorization)
    return user_id


def optional_db(authorization: str | None = Header(default=None)) -> tuple[str | None, Client]:
    """Read-only endpoints that should work signed-out (roadmap Golden Rule:
    the demo click-path never hits a login wall). Returns (user_id or None,
    a client). Signed-in -> user-scoped RLS client. Signed-out -> the
    service-role client if configured (so the demo/operator views still show
    data), else a bare anon client (RLS then returns nothing, which is safe)."""
    user_id, client = _resolve(authorization)
    if client:
        return user_id, client
    if has_service_role():
        return None, get_supabase()
    from app.config import settings
    from supabase import create_client

    return None, create_client(settings.supabase_url, settings.supabase_anon_key)


def operator_db() -> Client:
    """Operator views intentionally read across every user's trips. This
    requires the service-role key — without it, RLS means there is no
    client that can see other users' data, so we fail loudly instead of
    silently returning an empty/wrong dataset."""
    if not has_service_role():
        raise HTTPException(
            status_code=503,
            detail="Operator views need SUPABASE_SERVICE_ROLE_KEY set in backend/.env (RLS otherwise blocks cross-user reads)",
        )
    return get_supabase()
