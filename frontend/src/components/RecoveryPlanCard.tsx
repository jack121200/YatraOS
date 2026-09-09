import { formatMoney } from "../lib/money";

export interface RecoveryStep {
  place_id: string;
  name: string;
  start: string;
  duration_min: number;
  cost: number;
}

export interface RecoveryPlan {
  id: string;
  label: string;
  description: string;
  steps: RecoveryStep[];
  total_cost: number;
  total_duration_min: number;
  cost_delta: number;
  time_delta_min: number;
  tradeoff: string;
  best_for: string;
}

const BADGE_BY_ID: Record<string, { label: string; className: string }> = {
  "plan-a-reorder": { label: "Least disruptive", className: "bg-indigo/15 text-indigo" },
  "plan-b-substitute": { label: "Cheapest", className: "bg-nominal/10 text-nominal" },
  "plan-c-evening-pivot": { label: "Best experience", className: "bg-caution/10 text-caution" },
  "plan-cheapest": { label: "Cheapest", className: "bg-nominal/10 text-nominal" },
  "plan-fastest": { label: "Fastest", className: "bg-cyan/15 text-cyan" },
  "plan-least-disruption": { label: "Least disruptive", className: "bg-indigo/15 text-indigo" },
};

function Delta({ value, unit, invertGood }: { value: number; unit: string; invertGood?: boolean }) {
  if (value === 0) {
    return <span className="font-normal text-slate">no change</span>;
  }
  const isGood = invertGood ? value <= 0 : value >= 0;
  const sign = value > 0 ? "+" : "";
  return (
    <span className={`font-semibold tabular-nums ${isGood ? "text-nominal" : "text-caution"}`}>
      {sign}
      {value}
      {unit}
    </span>
  );
}

// "Selected Card" / primary action treatment per autonomous_tour_graph_platform
// DESIGN.md: glassmorphic panel, warm specular tint + gradient CTA for the
// recommended option, everything else recedes to the ghost treatment.
export function RecoveryPlanCard({
  plan,
  currency = "INR",
  recommended = false,
  onApply,
}: {
  plan: RecoveryPlan;
  currency?: string;
  recommended?: boolean;
  onApply?: (planId: string) => void;
}) {
  const badge = BADGE_BY_ID[plan.id];
  return (
    <article
      className={`panel relative flex flex-col gap-4 rounded-lg p-5 transition-all duration-200 hover:-translate-y-0.5 ${
        recommended ? "glow-cyan border-cyan/40" : "hover:border-cyan/30"
      }`}
    >
      {recommended && (
        <span className="absolute -top-3 left-5 rounded-full bg-gradient-to-r from-cyan to-indigo px-3 py-1 text-label-caps uppercase text-white shadow-[0_0_12px_rgba(140,83,43,0.35)]">
          Recommended
        </span>
      )}

      <header className="flex items-start justify-between gap-2">
        <div>
          <h3 className="text-headline-sm text-polar">{plan.label}</h3>
          <p className="mt-1 text-sm text-slate">{plan.description}</p>
        </div>
        {badge && (
          <span className={`shrink-0 rounded-full px-2.5 py-1 text-label-caps uppercase ${badge.className}`}>
            {badge.label}
          </span>
        )}
      </header>

      <dl className={`grid grid-cols-2 gap-3 rounded-md p-3 ${recommended ? "bg-cyan/5" : "bg-black/[0.03]"}`}>
        <div>
          <dt className="text-telemetry-sm uppercase text-slate">Cost</dt>
          <dd className={`font-bold tabular-nums text-polar ${recommended ? "text-telemetry-lg" : "text-headline-sm"}`}>
            {formatMoney(plan.total_cost, currency)}
          </dd>
          <dd className="text-xs">
            <Delta value={plan.cost_delta} unit="" invertGood />
          </dd>
        </div>
        <div>
          <dt className="text-telemetry-sm uppercase text-slate">Time</dt>
          <dd className={`font-bold tabular-nums text-polar ${recommended ? "text-telemetry-lg" : "text-headline-sm"}`}>
            {plan.total_duration_min}m
          </dd>
          <dd className="text-xs">
            <Delta value={plan.time_delta_min} unit="m" invertGood />
          </dd>
        </div>
      </dl>

      <ol className="space-y-2 text-sm">
        {plan.steps.map((step) => (
          <li key={step.place_id} className="flex items-baseline justify-between gap-2">
            <span className="text-polar">
              <span className="tabular-nums text-slate">{step.start}</span> · {step.name}
            </span>
            <span className="shrink-0 tabular-nums text-slate">{formatMoney(step.cost, currency)}</span>
          </li>
        ))}
      </ol>

      <p className="text-xs leading-relaxed text-muted">{plan.tradeoff}</p>

      <button
        type="button"
        onClick={() => onApply?.(plan.id)}
        className={`mt-auto inline-flex min-h-11 cursor-pointer items-center justify-center rounded-md px-4 py-2.5 text-sm font-semibold transition-all duration-150 active:scale-[0.98] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan ${
          recommended
            ? "bg-gradient-to-r from-cyan to-indigo text-white shadow-[0_0_16px_rgba(140,83,43,0.3)] hover:brightness-110"
            : "border border-black/[0.08] bg-black/[0.03] text-polar hover:border-cyan/40"
        }`}
      >
        Apply this plan
      </button>
    </article>
  );
}
