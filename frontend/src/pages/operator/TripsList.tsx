import { Link } from "react-router-dom";
import { formatMoney } from "../../lib/money";
import { useOperatorTrips } from "../../lib/useOperatorTrips";
import { useRealOperatorTrips } from "../../lib/useRealOperatorTrips";

export default function TripsList() {
  const { trips, loading, error } = useOperatorTrips();
  const { trips: realTrips, loading: realLoading, unavailable } = useRealOperatorTrips();

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      {!realLoading && !unavailable && realTrips.length > 0 && (
        <div className="mb-8">
          <h2 className="mb-3 text-lg font-bold text-polar">Real live trips</h2>
          <div className="overflow-x-auto rounded-2xl border border-border bg-surface-2">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-slate">
                  <th className="px-4 py-3 font-medium">City</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Impact score</th>
                  <th className="px-4 py-3 font-medium">Cost at risk</th>
                </tr>
              </thead>
              <tbody>
                {realTrips.map((trip) => (
                  <tr key={trip.trip_id} className="border-b border-border last:border-0 hover:bg-black/[0.02]">
                    <td className="px-4 py-3">
                      <Link to={`/operator/trips/${trip.trip_id}`} className="capitalize text-cyan hover:underline">
                        {trip.city}
                      </Link>
                    </td>
                    <td className="px-4 py-3 capitalize text-polar">{trip.status}</td>
                    <td className="px-4 py-3 tabular-nums text-polar">{trip.ripple_impact_score.toFixed(0)}/100</td>
                    <td className="px-4 py-3 tabular-nums text-polar">{formatMoney(trip.total_cost_at_risk, trip.currency)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <h1 className="mb-6 text-2xl font-bold text-polar">Demo trips</h1>

      {loading && <p className="text-slate">Loading…</p>}
      {error && (
        <div className="rounded-xl bg-critical/10 px-4 py-3 text-sm font-medium text-critical" role="alert">
          {error}
        </div>
      )}

      {trips.length > 0 && (
        <div className="overflow-x-auto rounded-2xl border border-border bg-surface-2">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-slate">
                <th className="px-4 py-3 font-medium">City</th>
                <th className="px-4 py-3 font-medium">Broken node</th>
                <th className="px-4 py-3 font-medium">Impact score</th>
                <th className="px-4 py-3 font-medium">Cost at risk</th>
              </tr>
            </thead>
            <tbody>
              {trips.map((trip) => (
                <tr key={trip.trip_id} className="border-b border-border last:border-0">
                  <td className="px-4 py-3 text-polar">
                    {trip.city}, {trip.country}
                  </td>
                  <td className="px-4 py-3 text-polar">{trip.broken_node_name}</td>
                  <td className="px-4 py-3 tabular-nums text-polar">{trip.ripple_impact_score.toFixed(0)}/100</td>
                  <td className="px-4 py-3 tabular-nums text-polar">{formatMoney(trip.total_cost_at_risk, trip.currency)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
