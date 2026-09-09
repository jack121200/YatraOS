import { CardSkeletonGrid } from "../../components/CardSkeleton";
import { TripCard } from "../../components/TripCard";
import { useOperatorTrips } from "../../lib/useOperatorTrips";

// Roadmap MUST HAVE: "list of live trips, risk alerts surfaced before the
// traveller complains." Real data (via /api/demo/operator-trips, which runs
// the actual ripple engine per city) — placeholder only in the sense that
// Phase 2 will swap "every demo city" for "every real live trip."
export default function Dashboard() {
  const { trips, loading, error } = useOperatorTrips();

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <h1 className="mb-1 text-2xl font-bold text-polar">Live trips</h1>
      <p className="mb-6 text-sm text-slate">Sorted by Ripple Impact Score — highest risk first.</p>

      {error && (
        <div className="rounded-xl bg-critical/10 px-4 py-3 text-sm font-medium text-critical" role="alert">
          {error}
        </div>
      )}

      {loading ? (
        <CardSkeletonGrid />
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {trips.map((trip) => (
            <TripCard key={trip.trip_id} trip={trip} />
          ))}
        </div>
      )}
    </div>
  );
}
