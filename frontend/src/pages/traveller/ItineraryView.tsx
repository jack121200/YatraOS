import { Link } from "react-router-dom";
import { BudgetTracker } from "../../components/BudgetTracker";
import { GroupLedger } from "../../components/GroupLedger";
import { formatMoney } from "../../lib/money";
import { useTripStore } from "../../store/tripStore";

function formatClock(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

export default function ItineraryView() {
  const trip = useTripStore((s) => s.lastBuiltTrip);

  if (!trip) {
    return (
      <div className="mx-auto flex min-h-[60vh] max-w-2xl flex-col items-center justify-center gap-3 px-4 text-center">
        <h1 className="text-2xl font-bold text-polar">No trip built yet</h1>
        <p className="text-slate">Build a day first, then come back here for the full view + group ledger.</p>
        <Link
          to="/plan"
          className="inline-flex min-h-11 items-center justify-center rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
        >
          Build a trip
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6 px-4 py-8">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="mb-1 text-2xl font-bold capitalize text-polar">{trip.city} itinerary</h1>
          <p className="text-sm text-slate">Trip dependency graph, rendered day-by-day.</p>
        </div>
        <Link
          to="/disruption"
          className="shrink-0 rounded-lg border border-critical/40 px-3 py-2 text-xs font-semibold text-critical hover:bg-critical/10"
        >
          Simulate a disruption
        </Link>
      </div>

      <BudgetTracker spent={trip.totalCost} budget={trip.budget} currency={trip.currency} />

      <div className="rounded-2xl border border-border bg-surface-2 p-5">
        <h2 className="mb-3 text-base font-bold text-polar">Schedule</h2>
        <ol className="space-y-3">
          {trip.dayPlan.map((item) => (
            <li key={item.id} className="flex items-baseline justify-between gap-3 text-sm">
              <span className="text-polar">
                <span className="tabular-nums text-slate">{formatClock(item.start_minutes)}</span> · {item.name}
              </span>
              <span className="shrink-0 tabular-nums text-slate">{formatMoney(item.avg_cost, trip.currency)}</span>
            </li>
          ))}
        </ol>
      </div>

      <GroupLedger items={trip.dayPlan} currency={trip.currency} />
    </div>
  );
}
