import { StatusBadge } from "../../components/StatusBadge";
import { formatMoney } from "../../lib/money";
import { useOperatorTrips } from "../../lib/useOperatorTrips";

const ALERT_THRESHOLD = 30; // ripple_impact_score above this surfaces as an alert

export default function AlertsPanel() {
  const { trips, loading, error } = useOperatorTrips();
  const alerts = trips.filter((t) => t.ripple_impact_score >= ALERT_THRESHOLD);

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="mb-1 text-2xl font-bold text-polar">Risk alerts</h1>
      <p className="mb-6 text-sm text-slate">
        Trips with a Ripple Impact Score ≥ {ALERT_THRESHOLD} — surfaced here before the traveller has to ask.
      </p>

      {loading && <p className="text-slate">Loading…</p>}
      {error && (
        <div className="rounded-xl bg-critical/10 px-4 py-3 text-sm font-medium text-critical" role="alert">
          {error}
        </div>
      )}

      {!loading && !error && alerts.length === 0 && (
        <div className="rounded-2xl border border-border bg-surface-2 p-6 text-center text-slate">
          No active alerts.
        </div>
      )}

      <ul className="space-y-3">
        {alerts.map((trip) => (
          <li key={trip.trip_id} className="flex items-start gap-3 rounded-2xl border border-border bg-surface-2 p-4">
            <StatusBadge status={trip.ripple_impact_score >= 60 ? "broken" : "at_risk"} />
            <div className="flex-1">
              <p className="font-semibold text-polar">
                {trip.city} — {trip.broken_node_name}
              </p>
              <p className="text-sm text-slate">{trip.reason}</p>
              <p className="mt-1 text-xs text-slate">
                Score {trip.ripple_impact_score.toFixed(0)}/100 · {formatMoney(trip.total_cost_at_risk, trip.currency)} at risk ·{" "}
                {trip.affected_count} node(s) affected
              </p>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
