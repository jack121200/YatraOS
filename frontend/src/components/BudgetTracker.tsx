import { formatMoney } from "../lib/money";

export function BudgetTracker({ spent, budget, currency }: { spent: number; budget: number; currency: string }) {
  const pct = budget > 0 ? Math.min((spent / budget) * 100, 100) : 0;
  const overBudget = spent > budget;

  return (
    <div className="rounded-2xl border border-border bg-surface-2 p-5">
      <div className="mb-2 flex items-baseline justify-between">
        <h3 className="text-base font-bold text-polar">Budget</h3>
        <span className={`text-sm font-semibold tabular-nums ${overBudget ? "text-critical" : "text-polar"}`}>
          {formatMoney(spent, currency)} / {formatMoney(budget, currency)}
        </span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-surface-1" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
        <div
          className={`h-full rounded-full transition-all ${overBudget ? "bg-critical" : "bg-primary"}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      {overBudget && <p className="mt-2 text-xs text-critical">Over budget by {formatMoney(spent - budget, currency)}</p>}
    </div>
  );
}
