import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../../services/api";
import { StatusBadge } from "../../components/StatusBadge";
import { formatMoney } from "../../lib/money";
import { useTripStore } from "../../store/tripStore";

interface RippleResponse {
  city: string;
  trigger: { broken_node_name: string; reason: string };
  ripple: {
    affected_node_ids: string[];
    total_cost_at_risk: number;
    total_time_at_risk_min: number;
    ripple_impact_score: number;
  };
  graph: { nodes: { id: string; name: string; status: string }[] };
}

// Detection step, one tap before RecoveryPicker: shows exactly which nodes
// the Ripple Engine marked at_risk/broken for the built trip's city, before
// offering the 3 recovery plans. Uses the real engine (/api/demo/ripple),
// same one RecoveryPicker's numbers ultimately come from.
export default function DisruptionModal() {
  const trip = useTripStore((s) => s.lastBuiltTrip);
  const [data, setData] = useState<RippleResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!trip) return;
    api
      .get<RippleResponse>("/api/demo/ripple", { params: { city: trip.city } })
      .then(({ data }) => setData(data))
      .catch(() => setError("Couldn't reach the backend."));
  }, [trip]);

  if (!trip) {
    return (
      <div className="mx-auto flex min-h-[60vh] max-w-2xl flex-col items-center justify-center gap-3 px-4 text-center">
        <h1 className="text-2xl font-bold text-polar">No trip built yet</h1>
        <p className="text-slate">Build a trip first — this screen shows what the Ripple Engine flags when something breaks.</p>
        <Link to="/plan" className="inline-flex min-h-11 items-center justify-center rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90">
          Build a trip
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <h1 className="mb-1 text-2xl font-bold capitalize text-polar">{trip.city}: disruption detected</h1>
      <p className="mb-6 text-sm text-slate">Nodes the Ripple Engine flagged downstream of the break.</p>

      {error && (
        <div className="rounded-xl bg-critical/10 px-4 py-3 text-sm font-medium text-critical" role="alert">
          {error}
        </div>
      )}

      {!data && !error && <p className="text-slate">Loading…</p>}

      {data && (
        <>
          <div className="mb-4 flex items-start gap-3 rounded-2xl border border-critical/30 bg-critical/10 p-4">
            <StatusBadge status="broken" />
            <div>
              <p className="font-semibold text-polar">{data.trigger.broken_node_name}</p>
              <p className="text-sm text-slate">{data.trigger.reason}</p>
            </div>
          </div>

          <dl className="mb-4 grid grid-cols-3 gap-3 rounded-xl bg-surface-1 p-3 text-sm">
            <div>
              <dt className="text-xs text-slate">Impact score</dt>
              <dd className="font-semibold tabular-nums text-polar">{data.ripple.ripple_impact_score.toFixed(0)}/100</dd>
            </div>
            <div>
              <dt className="text-xs text-slate">Cost at risk</dt>
              <dd className="font-semibold tabular-nums text-polar">{formatMoney(data.ripple.total_cost_at_risk, trip.currency)}</dd>
            </div>
            <div>
              <dt className="text-xs text-slate">Time at risk</dt>
              <dd className="font-semibold tabular-nums text-polar">{data.ripple.total_time_at_risk_min}m</dd>
            </div>
          </dl>

          <ul className="mb-6 space-y-2">
            {data.graph.nodes
              .filter((n) => n.status !== "planned")
              .map((n) => (
                <li key={n.id} className="flex items-center justify-between rounded-lg border border-border bg-surface-2 px-3 py-2 text-sm">
                  <span className="text-polar">{n.name}</span>
                  <StatusBadge status={n.status as "broken" | "at_risk"} />
                </li>
              ))}
          </ul>

          <Link
            to={`/recovery?city=${trip.city}`}
            className="inline-flex min-h-11 w-full items-center justify-center rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
          >
            See recovery plans
          </Link>
        </>
      )}
    </div>
  );
}
