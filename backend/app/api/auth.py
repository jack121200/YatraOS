"""Signup/signin happen client-side via the Supabase JS SDK (see
frontend/src/pages/SignIn.tsx) — routing them through this backend would just
proxy Supabase for no benefit and would put passwords through an extra hop.
What's left here is the token-check endpoint the frontend can use to confirm
the backend accepts its session."""

from fastapi import APIRouter, Depends
from supabase import Client

from app.api.deps import current_user, optional_db

router = APIRouter(prefix="/api/auth", tags=["auth"])


@router.get("/session")
def read_session(auth: tuple[str | None, Client] = Depends(optional_db)):
    user_id, _ = auth
    return {"authenticated": user_id is not None, "user_id": user_id}


@router.get("/me")
def read_profile(auth: tuple[str, Client] = Depends(current_user)):
    user_id, sb = auth
    rows = sb.table("profiles").select("*").eq("id", user_id).execute().data
    return {"profile": rows[0] if rows else None}
