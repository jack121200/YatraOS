"""Supabase clients.

Two modes, on purpose:

1. Service-role (SUPABASE_SERVICE_ROLE_KEY set) — bypasses RLS. Needed for
   the operator views, whose entire job is reading other people's trips.
2. Anon + forwarded user JWT — every query runs as that user under the RLS
   policies in supabase/migrations/0001_init.sql.

Mode 2 means the app works with only the public anon key configured, so
nothing is blocked waiting on a secret; the operator dashboard is the only
thing that degrades (it can then see just the caller's own trips).
"""

from functools import lru_cache

from supabase import Client, create_client

from app.config import settings


def has_service_role() -> bool:
    return bool(settings.supabase_url and settings.supabase_service_role_key)


@lru_cache
def get_supabase() -> Client:
    """Privileged client. Prefers the service-role key; falls back to anon."""
    if not settings.supabase_url:
        raise RuntimeError("SUPABASE_URL not set in backend/.env")

    key = settings.supabase_service_role_key or settings.supabase_anon_key
    if not key:
        raise RuntimeError("Set SUPABASE_SERVICE_ROLE_KEY (preferred) or SUPABASE_ANON_KEY in backend/.env")
    return create_client(settings.supabase_url, key)


def get_user_client(access_token: str) -> Client:
    """Client scoped to one signed-in user — RLS applies to every query."""
    if not settings.supabase_url or not settings.supabase_anon_key:
        raise RuntimeError("SUPABASE_URL / SUPABASE_ANON_KEY not set in backend/.env")
    client = create_client(settings.supabase_url, settings.supabase_anon_key)
    client.postgrest.auth(access_token)
    return client
