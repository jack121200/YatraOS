import { useState } from "react";
import { formatMoney } from "../lib/money";
import type { DayPlanItem } from "../store/tripStore";

// Roadmap MUST HAVE: "Group ledger: cost auto-splits, recalculates when
// someone joins/leaves/skips an activity." Client-side for now — the split
// itself needs no backend round-trip, only persistence does (Phase 3 wires
// this to LedgerEntry rows once a trip has a real id).
export function GroupLedger({ items, currency }: { items: DayPlanItem[]; currency: string }) {
  const [people, setPeople] = useState<string[]>(["You", "Friend 1"]);
  const [newName, setNewName] = useState("");
  // participation[itemId] = Set of people names sharing that item's cost
  const [participation, setParticipation] = useState<Record<string, Set<string>>>(() =>
    Object.fromEntries(items.map((i) => [i.id, new Set(["You", "Friend 1"])]))
  );

  function addPerson() {
    const name = newName.trim();
    if (!name || people.includes(name)) return;
    setPeople((prev) => [...prev, name]);
    setParticipation((prev) => {
      const next = { ...prev };
      for (const item of items) next[item.id] = new Set([...(next[item.id] ?? []), name]);
      return next;
    });
    setNewName("");
  }

  function removePerson(name: string) {
    setPeople((prev) => prev.filter((p) => p !== name));
    setParticipation((prev) => {
      const next = { ...prev };
      for (const id of Object.keys(next)) {
        const set = new Set(next[id]);
        set.delete(name);
        next[id] = set;
      }
      return next;
    });
  }

  function toggleParticipation(itemId: string, name: string) {
    setParticipation((prev) => {
      const set = new Set(prev[itemId] ?? []);
      if (set.has(name)) set.delete(name);
      else set.add(name);
      return { ...prev, [itemId]: set };
    });
  }

  const perPersonTotal: Record<string, number> = Object.fromEntries(people.map((p) => [p, 0]));
  for (const item of items) {
    const sharers = participation[item.id] ?? new Set();
    if (sharers.size === 0) continue;
    const share = item.avg_cost / sharers.size;
    for (const name of sharers) {
      if (name in perPersonTotal) perPersonTotal[name] += share;
    }
  }

  return (
    <div className="rounded-2xl border border-border bg-surface-2 p-5">
      <h3 className="mb-1 text-base font-bold text-polar">Group ledger</h3>
      <p className="mb-4 text-sm text-slate">Uncheck someone on a stop they're skipping — totals recalculate live.</p>

      <div className="mb-4 flex flex-wrap gap-2">
        {people.map((name) => (
          <span key={name} className="inline-flex items-center gap-1.5 rounded-full bg-surface-1 px-3 py-1.5 text-sm text-polar">
            {name}
            <button
              type="button"
              onClick={() => removePerson(name)}
              aria-label={`Remove ${name}`}
              className="cursor-pointer text-slate hover:text-critical"
            >
              ×
            </button>
          </span>
        ))}
        <input
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && addPerson()}
          placeholder="Add person"
          className="min-h-9 w-32 rounded-full border border-border bg-canvas px-3 py-1 text-sm text-polar focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan"
        />
        <button
          type="button"
          onClick={addPerson}
          className="min-h-9 cursor-pointer rounded-full border border-border px-3 py-1 text-sm font-medium text-polar hover:bg-surface-1"
        >
          Add
        </button>
      </div>

      <div className="mb-4 space-y-2">
        {items.map((item) => (
          <div key={item.id} className="flex items-center justify-between gap-3 text-sm">
            <span className="text-polar">{item.name}</span>
            <div className="flex items-center gap-3">
              {people.map((name) => (
                <label key={name} className="flex items-center gap-1 text-xs text-slate">
                  <input
                    type="checkbox"
                    checked={participation[item.id]?.has(name) ?? false}
                    onChange={() => toggleParticipation(item.id, name)}
                    className="h-4 w-4 cursor-pointer accent-primary"
                  />
                  {name}
                </label>
              ))}
            </div>
          </div>
        ))}
      </div>

      <dl className="space-y-1.5 border-t border-border pt-3">
        {people.map((name) => (
          <div key={name} className="flex items-center justify-between text-sm">
            <dt className="text-slate">{name}</dt>
            <dd className="font-semibold tabular-nums text-polar">{formatMoney(Math.round(perPersonTotal[name]), currency)}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
