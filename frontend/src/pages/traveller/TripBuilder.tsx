import { useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../../services/api";
import { StatusBadge } from "../../components/StatusBadge";
import { formatMoney } from "../../lib/money";
import { useCities } from "../../lib/useCities";
import { useTripStore, type DayPlanItem } from "../../store/tripStore";

interface BuildItineraryResponse {
  city: string;
  interests_used: string[];
  pace_used: string;
  day_plan: DayPlanItem[];
  validation: { ok: boolean; total_cost: number; issues: { kind: string; message: string }[] };
}

const ALL_INTERESTS = ["heritage", "beach", "nightlife", "nature", "adventure", "food", "shopping", "relaxation", "culture", "family", "wildlife"];
const PACES = ["relaxed", "moderate", "packed"] as const;

function formatClock(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

export default function TripBuilder() {
  const cities = useCities();
  const [cityId, setCityId] = useState("jaipur");
  const [interests, setInterests] = useState<string[]>(["heritage", "food"]);
  const [budget, setBudget] = useState(2000);
  const [pace, setPace] = useState<(typeof PACES)[number]>("moderate");
  const [result, setResult] = useState<BuildItineraryResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const setLastBuiltTrip = useTripStore((s) => s.setLastBuiltTrip);

  const currency = cities.find((c) => c.id === cityId)?.currency ?? "INR";

  function toggleInterest(interest: string) {
    setInterests((prev) => (prev.includes(interest) ? prev.filter((i) => i !== interest) : [...prev, interest]));
  }

  async function handleBuild() {
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const { data } = await api.get<BuildItineraryResponse>("/api/demo/build-itinerary", {
        params: { city: cityId, interests: interests.join(","), budget, pace },
      });
      setResult(data);
      setLastBuiltTrip({
        city: cityId,
        currency,
        budget,
        dayPlan: data.day_plan,
        totalCost: data.validation.total_cost,
      });
    } catch {
      setError("Couldn't reach the backend — is `uvicorn app.main:app` running on the configured API URL?");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="mb-1 text-2xl font-bold text-polar">Where to?</h1>
      <p className="mb-6 text-sm text-slate">Pick a city, tell us what you're into, we'll draft a day.</p>

      <div className="space-y-5 rounded-2xl border border-border bg-surface-2 p-5">
        <div>
          <label htmlFor="city" className="mb-1.5 block text-sm font-medium text-polar">
            City
          </label>
          <select
            id="city"
            value={cityId}
            onChange={(e) => setCityId(e.target.value)}
            className="min-h-11 w-full rounded-lg border border-border bg-canvas px-3 py-2 text-sm text-polar focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan"
          >
            {cities.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}, {c.country}
              </option>
            ))}
          </select>
        </div>

        <fieldset>
          <legend className="mb-1.5 text-sm font-medium text-polar">Interests</legend>
          <div className="flex flex-wrap gap-2">
            {ALL_INTERESTS.map((interest) => {
              const active = interests.includes(interest);
              return (
                <button
                  key={interest}
                  type="button"
                  aria-pressed={active}
                  onClick={() => toggleInterest(interest)}
                  className={`min-h-9 cursor-pointer rounded-full border px-3 py-1.5 text-sm font-medium capitalize transition-all duration-150 active:scale-95 ${
                    active
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border bg-canvas text-slate hover:bg-surface-1"
                  }`}
                >
                  {interest}
                </button>
              );
            })}
          </div>
        </fieldset>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="budget" className="mb-1.5 block text-sm font-medium text-polar">
              Budget for the day ({currency})
            </label>
            <input
              id="budget"
              type="number"
              min={0}
              value={budget}
              onChange={(e) => setBudget(Number(e.target.value))}
              className="min-h-11 w-full rounded-lg border border-border bg-canvas px-3 py-2 text-sm text-polar focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan"
            />
          </div>
          <div>
            <label htmlFor="pace" className="mb-1.5 block text-sm font-medium text-polar">
              Pace
            </label>
            <select
              id="pace"
              value={pace}
              onChange={(e) => setPace(e.target.value as (typeof PACES)[number])}
              className="min-h-11 w-full rounded-lg border border-border bg-canvas px-3 py-2 text-sm capitalize text-polar focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan"
            >
              {PACES.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </div>
        </div>

        <button
          type="button"
          onClick={handleBuild}
          disabled={loading}
          className="inline-flex min-h-11 w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition-all duration-150 hover:bg-primary/90 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60 disabled:active:scale-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan"
        >
          {loading && (
            <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
            </svg>
          )}
          {loading ? "Building…" : "Build my day"}
        </button>
      </div>

      {error && (
        <div className="mt-6 rounded-xl bg-critical/10 px-4 py-3 text-sm font-medium text-critical" role="alert">
          {error}
        </div>
      )}

      {result && (
        <div className="mt-6 rounded-2xl border border-border bg-surface-2 p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-bold text-polar">Your day</h2>
            <StatusBadge status={result.validation.ok ? "confirmed" : "at_risk"} />
          </div>

          <ol className="space-y-3">
            {result.day_plan.map((item) => (
              <li key={item.id} className="flex items-baseline justify-between gap-3 text-sm">
                <span className="text-polar">
                  <span className="tabular-nums text-slate">{formatClock(item.start_minutes)}</span> ·{" "}
                  {item.name}
                </span>
                <span className="shrink-0 tabular-nums text-slate">{formatMoney(item.avg_cost, currency)}</span>
              </li>
            ))}
          </ol>

          <div className="mt-4 flex items-center justify-between border-t border-border pt-3 text-sm">
            <span className="text-slate">Total</span>
            <span className="font-semibold tabular-nums text-polar">{formatMoney(result.validation.total_cost, currency)}</span>
          </div>

          {result.validation.issues.length > 0 && (
            <ul className="mt-4 space-y-1.5 rounded-lg bg-caution/10 p-3 text-xs text-caution">
              {result.validation.issues.map((issue, i) => (
                <li key={i}>{issue.message}</li>
              ))}
            </ul>
          )}

          <Link
            to="/itinerary"
            className="mt-4 inline-flex min-h-11 w-full items-center justify-center rounded-xl border border-primary px-4 py-2.5 text-sm font-semibold text-primary transition-colors hover:bg-primary/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan"
          >
            View full itinerary + split costs
          </Link>
        </div>
      )}
    </div>
  );
}
