import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../../services/api";
import { useAuth } from "../../lib/useAuth";
import { formatMoney } from "../../lib/money";

interface Trip {
  id: string;
  city: string;
  currency: string;
  start_date: string;
  end_date: string;
  budget: number;
  status: string;
}

export default function MyTrips() {
  const { user, loading: authLoading } = useAuth();
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      setLoading(false);
      return;
    }
    api
      .get<{ trips: Trip[] }>("/api/trips")
      .then(({ data }) => setTrips(data.trips))
      .catch(() => setError("Couldn't load your trips."))
      .finally(() => setLoading(false));
  }, [user, authLoading]);

  if (!authLoading && !user) {
    return (
      <div className="mx-auto flex min-h-[60vh] max-w-2xl flex-col items-center justify-center gap-3 px-4 text-center">
        <h1 className="text-2xl font-bold text-polar">Sign in to see your trips</h1>
        <Link to="/signin" className="inline-flex min-h-11 items-center justify-center rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90">
          Sign in
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="mb-1 text-2xl font-bold text-polar">My trips</h1>
      <p className="mb-6 text-sm text-slate">Trips you've built and booked, saved to your account.</p>

      {loading && <p className="text-slate">Loading…</p>}
      {error && (
        <div className="rounded-xl bg-critical/10 px-4 py-3 text-sm font-medium text-critical" role="alert">{error}</div>
      )}

      {!loading && trips.length === 0 && !error && (
        <div className="rounded-2xl border border-border bg-surface-2 p-6 text-center">
          <p className="mb-4 text-slate">No trips yet.</p>
          <Link to="/plan" className="inline-flex min-h-11 items-center justify-center rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90">
            Build a trip
          </Link>
        </div>
      )}

      <ul className="space-y-3">
        {trips.map((trip) => (
          <li key={trip.id}>
            <Link
              to={`/trips/${trip.id}`}
              className="flex items-center justify-between gap-3 rounded-xl border border-border bg-surface-2 px-4 py-3 hover:border-cyan/40"
            >
              <div>
                <p className="font-semibold capitalize text-polar">{trip.city}</p>
                <p className="text-sm text-slate">{trip.start_date} → {trip.end_date}</p>
              </div>
              <div className="text-right">
                <p className="tabular-nums font-semibold text-polar">{formatMoney(trip.budget, trip.currency)}</p>
                <p className="text-xs capitalize text-slate">{trip.status}</p>
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
