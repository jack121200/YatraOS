import { useEffect, useState } from "react";
import { api } from "../services/api";

export interface RealOperatorTrip {
  trip_id: string;
  city: string;
  currency: string;
  status: string;
  ripple_impact_score: number;
  total_cost_at_risk: number;
  broken_node_name: string | null;
}

// Real, persisted trips (Supabase) as opposed to useOperatorTrips, which
// reads the always-on demo cities via /api/demo/operator-trips. Needs
// SUPABASE_SERVICE_ROLE_KEY set in backend/.env — see app/api/deps.py.
export function useRealOperatorTrips() {
  const [trips, setTrips] = useState<RealOperatorTrip[]>([]);
  const [loading, setLoading] = useState(true);
  const [unavailable, setUnavailable] = useState(false);

  useEffect(() => {
    api
      .get<{ trips: RealOperatorTrip[] }>("/api/operator/trips")
      .then(({ data }) => setTrips(data.trips))
      .catch(() => setUnavailable(true))
      .finally(() => setLoading(false));
  }, []);

  return { trips, loading, unavailable };
}
