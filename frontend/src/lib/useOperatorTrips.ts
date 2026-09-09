import { useEffect, useState } from "react";
import { api } from "../services/api";
import type { OperatorTrip } from "../components/TripCard";

export function useOperatorTrips() {
  const [trips, setTrips] = useState<OperatorTrip[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api
      .get<{ trips: OperatorTrip[] }>("/api/demo/operator-trips")
      .then(({ data }) => setTrips(data.trips))
      .catch(() => setError("Couldn't reach the backend — is `uvicorn app.main:app` running?"))
      .finally(() => setLoading(false));
  }, []);

  return { trips, loading, error };
}
