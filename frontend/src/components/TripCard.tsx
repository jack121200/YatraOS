import { formatMoney } from "../lib/money";

export interface OperatorTrip {
  trip_id: string;
  city: string;
  country: string;
  currency: string;
  broken_node_name: string;
  reason: string;
  ripple_impact_score: number;
  total_cost_at_risk: number;
  affected_count: number;
}

function scoreTier(score: number): { label: string; badge: string; border: string; accent: string; glow: string } {
  if (score >= 60) {
    return { label: "High risk", badge: "bg-critical/15 text-critical", border: "border-critical/40", accent: "bg-critical", glow: "glow-critical" };
  }
  if (score >= 30) {
    return { label: "Medium risk", badge: "bg-caution/10 text-caution", border: "border-caution/40", accent: "bg-caution", glow: "" };
  }
  return { label: "Low risk", badge: "bg-nominal/10 text-nominal", border: "border-nominal/30", accent: "bg-nominal", glow: "" };
}

// Severity changes the card's actual weight (glass panel + left accent bar +
// glow on critical), not just a small pill — a "High risk" and "Low risk"
// card being pixel-identical except for one badge meant nothing on a busy
// dashboard drew the eye to what needed attention first.
export function TripCard({ trip }: { trip: OperatorTrip }) {
  const tier = scoreTier(trip.ripple_impact_score);
  return (
    <article className={`panel panel-hover relative flex flex-col gap-3 overflow-hidden rounded-lg p-5 pl-6 ${tier.border} ${tier.glow}`}>
      <span className={`absolute inset-y-0 left-0 w-1 ${tier.accent}`} aria-hidden="true" />

      <header className="flex items-start justify-between gap-2">
        <div>
          <h3 className="text-headline-sm text-polar">
            {trip.city}, {trip.country}
          </h3>
          <p className="text-sm text-slate">{trip.broken_node_name} broken</p>
        </div>
        <span className={`shrink-0 rounded-full px-2.5 py-1 text-label-caps uppercase ${tier.badge}`}>{tier.label}</span>
      </header>

      <p className="text-sm text-slate">{trip.reason}</p>

      <dl className="grid grid-cols-3 gap-3 rounded-md bg-black/[0.03] p-3">
        <div>
          <dt className="text-telemetry-sm uppercase text-slate">Impact</dt>
          <dd className="font-semibold tabular-nums text-polar">{trip.ripple_impact_score.toFixed(0)}/100</dd>
        </div>
        <div>
          <dt className="text-telemetry-sm uppercase text-slate">At risk</dt>
          <dd className="font-semibold tabular-nums text-polar">{formatMoney(trip.total_cost_at_risk, trip.currency)}</dd>
        </div>
        <div>
          <dt className="text-telemetry-sm uppercase text-slate">Nodes</dt>
          <dd className="font-semibold tabular-nums text-polar">{trip.affected_count}</dd>
        </div>
      </dl>
    </article>
  );
}
