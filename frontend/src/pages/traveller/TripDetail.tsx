import { useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { api } from "../../services/api";
import { StatusBadge, type NodeStatus } from "../../components/StatusBadge";
import { RecoveryPlan, RecoveryPlanCard } from "../../components/RecoveryPlanCard";
import { formatMoney } from "../../lib/money";

interface TripNode {
  id: string;
  name: string;
  type: string;
  cost: number;
  start_minutes: number | null;
  status: NodeStatus;
}

interface Trip {
  id: string;
  city: string;
  currency: string;
  status: string;
  budget: number;
}

interface RecoveryResponse {
  broken_node: { id: string; name: string } | null;
  ripple_impact_score?: number;
  recovery_plans: RecoveryPlan[];
}

function formatClock(minutes: number | null): string {
  if (minutes == null) return "—";
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

// The live graph for one real, persisted trip — this is the "Trip View" +
// "Disruption & Recovery" screens from the roadmap, backed by
// /api/trips/:id, /api/disruptions/trigger and /api/recovery, as opposed to
// TripBuilder/ItineraryView/DisruptionModal/RecoveryPicker, which run the
// same engines but over unauthenticated demo data for the click-through demo.
export default function TripDetail() {
  const { tripId } = useParams<{ tripId: string }>();
  const [trip, setTrip] = useState<Trip | null>(null);
  const [nodes, setNodes] = useState<TripNode[]>([]);
  const [recovery, setRecovery] = useState<RecoveryResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [applied, setApplied] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!tripId) return;
    setLoading(true);
    try {
      const { data } = await api.get(`/api/trips/${tripId}`);
      setTrip(data.trip);
      setNodes(data.graph.nodes);
      const broken = (data.graph.nodes as TripNode[]).find((n) => n.status === "broken");
      if (broken) {
        const { data: rec } = await api.get<RecoveryResponse>(`/api/recovery/${tripId}/plans`);
        setRecovery(rec);
      } else {
        setRecovery(null);
      }
    } catch {
      setError("Couldn't load this trip.");
    } finally {
      setLoading(false);
    }
  }, [tripId]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleSimulateDisruption() {
    if (!tripId) return;
    const target = nodes.find((n) => n.type === "activity" && n.status === "planned") ?? nodes.find((n) => n.status === "planned");
    if (!target) return;
    setBusy(true);
    setApplied(null);
    try {
      await api.post("/api/disruptions/trigger", {
        trip_id: tripId,
        node_id: target.id,
        reason: "Simulated disruption — closed for the day.",
        minutes_to_next_event: 15,
      });
      await load();
    } catch {
      setError("Couldn't trigger a disruption.");
    } finally {
      setBusy(false);
    }
  }

  async function handleApply(planId: string) {
    if (!tripId) return;
    setBusy(true);
    try {
      await api.post("/api/recovery/apply", { trip_id: tripId, plan_id: planId });
      setApplied(planId);
      await load();
    } catch {
      setError("Couldn't apply that plan.");
    } finally {
      setBusy(false);
    }
  }

  if (loading) return <div className="mx-auto max-w-3xl px-4 py-8 text-slate">Loading…</div>;
  if (error || !trip) {
    return (
      <div className="mx-auto flex min-h-[60vh] max-w-2xl flex-col items-center justify-center gap-3 px-4 text-center">
        <h1 className="text-2xl font-bold text-polar">Trip not found</h1>
        <p className="text-slate">{error ?? "This trip doesn't exist or you don't have access to it."}</p>
        <Link to="/my-trips" className="inline-flex min-h-11 items-center justify-center rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90">
          My trips
        </Link>
      </div>
    );
  }

  const hasBroken = nodes.some((n) => n.status === "broken");

  return (
    <div className="mx-auto max-w-3xl space-y-6 px-4 py-8">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="mb-1 text-2xl font-bold capitalize text-polar">{trip.city} — live trip</h1>
          <p className="text-sm text-slate">Connected node graph, rendered as a timeline. Status updates live.</p>
        </div>
        <button
          type="button"
          onClick={handleSimulateDisruption}
          disabled={busy || hasBroken}
          className="shrink-0 rounded-lg border border-critical/40 px-3 py-2 text-xs font-semibold text-critical hover:bg-critical/10 disabled:opacity-50"
        >
          Simulate a disruption
        </button>
      </div>

      <ol className="relative space-y-0 border-l border-border pl-6">
        {nodes.map((node, i) => (
          <li key={node.id} className="relative pb-5 last:pb-0">
            <span
              className={`absolute -left-[29px] top-1 h-3 w-3 rounded-full border-2 border-canvas ${
                node.status === "broken" ? "bg-critical" : node.status === "at_risk" ? "bg-caution" : node.status === "confirmed" ? "bg-nominal" : "bg-slate"
              }`}
              aria-hidden="true"
            />
            <div className="flex items-center justify-between gap-3 rounded-xl border border-border bg-surface-2 px-4 py-3">
              <div>
                <p className="text-sm font-semibold text-polar">
                  <span className="tabular-nums text-slate">{formatClock(node.start_minutes)}</span> · {node.name}
                </p>
                <p className="text-xs text-slate">{node.type}</p>
              </div>
              <div className="flex shrink-0 items-center gap-3">
                <span className="tabular-nums text-sm text-slate">{formatMoney(node.cost, trip.currency)}</span>
                <StatusBadge status={node.status} />
              </div>
            </div>
            {i < nodes.length - 1 && <div className="ml-1 mt-1 h-px w-4 bg-border" aria-hidden="true" />}
          </li>
        ))}
      </ol>

      {recovery?.broken_node && (
        <div className="space-y-4 rounded-2xl border border-critical/30 bg-critical/5 p-5">
          <div>
            <p className="font-semibold text-polar">{recovery.broken_node.name} is broken</p>
            {recovery.ripple_impact_score != null && (
              <p className="text-sm text-slate">Ripple impact score: {recovery.ripple_impact_score.toFixed(0)}/100</p>
            )}
          </div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {recovery.recovery_plans.map((plan) => (
              <RecoveryPlanCard key={plan.id} plan={plan} currency={trip.currency} onApply={handleApply} />
            ))}
          </div>
          {applied && (
            <div className="rounded-xl bg-nominal/10 px-4 py-3 text-sm font-medium text-nominal" role="status">
              Applied — itinerary and costs updated above.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
