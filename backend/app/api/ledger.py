from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from supabase import Client

from app.api.deps import optional_db
from app.db import trips_repo

router = APIRouter(prefix="/api/ledger", tags=["ledger"])


class LedgerShare(BaseModel):
    node_id: str | None = None
    person_name: str
    amount: int
    description: str = ""


class LedgerSaveRequest(BaseModel):
    entries: list[LedgerShare]


@router.get("/{trip_id}")
def get_ledger(trip_id: str, auth: tuple[str | None, Client] = Depends(optional_db)):
    _, sb = auth
    trip = trips_repo.get_trip(sb, trip_id)
    if not trip:
        raise HTTPException(status_code=404, detail="trip not found")

    entries = trips_repo.get_ledger(sb, trip_id)

    totals: dict[str, int] = {}
    for e in entries:
        totals[e["person_name"]] = totals.get(e["person_name"], 0) + int(e["amount"])

    return {"trip_id": trip_id, "currency": trip["currency"], "entries": entries, "totals": totals}


@router.put("/{trip_id}")
def save_ledger(trip_id: str, payload: LedgerSaveRequest, auth: tuple[str | None, Client] = Depends(optional_db)):
    """Replaces the trip's split wholesale. The client owns the participation
    matrix (who's on which stop); the server just stores the resulting shares."""
    _, sb = auth
    trip = trips_repo.get_trip(sb, trip_id)
    if not trip:
        raise HTTPException(status_code=404, detail="trip not found")

    saved = trips_repo.upsert_ledger(sb, trip_id, [e.model_dump() for e in payload.entries])
    return {"trip_id": trip_id, "saved": len(saved)}
