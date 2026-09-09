import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { CardSkeletonGrid } from "../../components/CardSkeleton";
import { RecoveryPlan, RecoveryPlanCard } from "../../components/RecoveryPlanCard";
import { StatusBadge } from "../../components/StatusBadge";
import { useCities } from "../../lib/useCities";
import { useTripStore } from "../../store/tripStore";

interface DisruptionScenario {
  city: string;
  scenario_name: string;
  currency: string;
  trigger: {
    broken_node_name: string;
    announced_at: string;
    reason: string;
    affected_window: { start: string; end: string; duration_min: number };
  };
  recovery_plans: RecoveryPlan[];
}

// Combined-value score: cost and time deltas weighted equally (1 rupee ~
// 1 minute isn't literally true, but treating them as comparable is enough
// to break the 3-way tie deterministically and put ONE plan forward instead
// of three identical-weight cards the user has to fully read to compare.
function bestPlanId(plans: RecoveryPlan[]): string | null {
  if (plans.length === 0) return null;
  return plans.reduce((best, p) => (p.cost_delta + p.time_delta_min < best.cost_delta + best.time_delta_min ? p : best)).id;
}

// Reads the seeded demo scenarios directly for now (public/demo-data/) so
// this screen is demoable before the backend recovery_ranker endpoint
// returns this same shape from a real trip_id. Swap the fetch URL for
// `/api/recovery/:trip_id/plans` once Phase 2 DB wiring lands.
//
// City resolution order: ?city= in the URL (set by DisruptionModal's "See
// recovery plans" link) > the last trip built in TripBuilder > Jaipur.
// Previously this always defaulted to Jaipur regardless of what city the
// user was actually looking at — a real continuity bug, fixed here.
export default function RecoveryPicker() {
  const cities = useCities();
  const [searchParams, setSearchParams] = useSearchParams();
  const lastBuiltTrip = useTripStore((s) => s.lastBuiltTrip);

  const [cityId, setCityId] = useState(() => searchParams.get("city") ?? lastBuiltTrip?.city ?? "jaipur");
  const [scenario, setScenario] = useState<DisruptionScenario | null>(null);
  const [applied, setApplied] = useState<string | null>(null);

  function handleCityChange(id: string) {
    setCityId(id);
    setSearchParams({ city: id });
  }

  useEffect(() => {
    setScenario(null);
    setApplied(null);
    fetch(`/demo-data/${cityId}_disruption_scenario.json`)
      .then((r) => r.json())
      .then(setScenario)
      .catch(() => setScenario(null));
  }, [cityId]);

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="mb-6 flex items-center gap-3">
        <label htmlFor="city-select" className="text-sm font-medium text-slate">
          Demo city
        </label>
        <select
          id="city-select"
          value={cityId}
          onChange={(e) => handleCityChange(e.target.value)}
          className="min-h-11 rounded-lg border border-border bg-surface-2 px-3 py-2 text-sm text-polar focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan"
        >
          {cities.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}, {c.country}
            </option>
          ))}
        </select>
      </div>

      {!scenario ? (
        <CardSkeletonGrid count={3} />
      ) : (
        <>
          <div className="mb-6 flex items-start gap-3 rounded-2xl border border-critical/30 bg-critical/10 p-4">
            <StatusBadge status="broken" />
            <div>
              <p className="font-semibold text-polar">
                {scenario.trigger.broken_node_name} — {scenario.scenario_name}
              </p>
              <p className="text-sm text-slate">
                {scenario.trigger.reason} · announced {scenario.trigger.announced_at}, affects{" "}
                {scenario.trigger.affected_window.start}–{scenario.trigger.affected_window.end}
              </p>
            </div>
          </div>

          <h2 className="mb-1 text-xl font-bold text-polar">Choose a recovery plan</h2>
          <p className="mb-6 text-sm text-slate">
            All numbers below are pre-computed — pick one, everything updates in one tap.
          </p>

          <div className="grid grid-cols-1 gap-5 pt-3 md:grid-cols-3">
            {scenario.recovery_plans.map((plan) => (
              <RecoveryPlanCard
                key={plan.id}
                plan={plan}
                currency={scenario.currency}
                recommended={plan.id === bestPlanId(scenario.recovery_plans)}
                onApply={setApplied}
              />
            ))}
          </div>

          {applied && (
            <div className="mt-6 rounded-xl bg-nominal/10 px-4 py-3 text-sm font-medium text-nominal" role="status">
              Applied — itinerary, cost, and vendor updated.
            </div>
          )}
        </>
      )}
    </div>
  );
}
