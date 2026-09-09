from fastapi import APIRouter, Depends, HTTPException
from supabase import Client

from app.api.deps import optional_db
from app.db import trips_repo
from app.graph.trip_graph import TripGraph

router = APIRouter(prefix="/api/itinerary", tags=["itinerary"])


@router.get("/{trip_id}")
def get_itinerary(trip_id: str, auth: tuple[str | None, Client] = Depends(optional_db)):
    """Nodes in dependency order — the itinerary is a topological walk of the
    trip graph, not a separately-stored list."""
    _, sb = auth
    trip = trips_repo.get_trip(sb, trip_id)
    if not trip:
        raise HTTPException(status_code=404, detail="trip not found")

    nodes = trips_repo.get_nodes(sb, trip_id)
    edges = trips_repo.get_edges(sb, trip_id)
    graph = TripGraph.rehydrate(trip_id, nodes, edges)

    return {
        "trip": trip,
        "stops": graph.ordered_nodes(),
        "total_cost": sum(int(n.get("cost", 0)) for n in nodes),
    }
