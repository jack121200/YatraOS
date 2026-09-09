import { useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { api } from "../../services/api";
import { StatusBadge, type NodeStatus } from "../../components/StatusBadge";
import { formatMoney } from "../../lib/money";

interface TripNode {
  id: string;
  name: string;
  type: string;
  cost: number;
  status: NodeStatus;
}

interface Payment {
  id: string;
  amount: number;
  status: string;
}

interface DetailResponse {
  trip: { id: string; city: string; currency: string; status: string };
  nodes: TripNode[];
  payments: Payment[];
  summary: { ripple_impact_score: number; total_cost_at_risk: number; broken_node_name: string | null };
}

const OVERRIDE_STATUSES: NodeStatus[] = ["planned", "confirmed", "at_risk", "broken"];

// Operator "Operations View" (roadmap Section 4) — full graph, vendor/payment
// status, and a manual override for when an operator needs to correct state
// by hand (e.g. after a phone call the automated feeds don't see). Backed by
// the real GET/POST /api/operator/trips/:id endpoints, so this only works for
// real persisted trips (not the demo-city rows shown on /operator).
export default function TripDetail() {
  const { tripId } = useParams<{ tripId: string }>();
  const [data, setData] = useState<DetailResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busyNodeId, setBusyNodeId] = useState<string | null>(null);

  const load = useCallback(() => {
    if (!tripId) return;
    api
      .get<DetailResponse>(`/api/operator/trips/${tripId}`)
      .then(({ data }) => setData(data))
      .catch(() => setError("Couldn't load this trip. It may need SUPABASE_SERVICE_ROLE_KEY set in backend/.env."));
  }, [tripId]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleOverride(nodeId: string, status: NodeStatus) {
    if (!tripId) return;
    setBusyNodeId(nodeId);
    try {
      await api.post(`/api/operator/trips/${tripId}/override`, null, { params: { node_id: nodeId, status } });
      load();
    } finally {
      setBusyNodeId(null);
    }
  }

  if (error) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-8">
        <div className="rounded-xl bg-critical/10 px-4 py-3 text-sm font-medium text-critical" role="alert">{error}</div>
        <Link to="/operator/trips" className="mt-4 inline-block text-sm text-cyan">← Back to all trips</Link>
      </div>
    );
  }
  if (!data) return <div className="mx-auto max-w-3xl px-4 py-8 text-slate">Loading…</div>;

  return (
    <div className="mx-auto max-w-3xl space-y-6 px-4 py-8">
      <div>
        <Link to="/operator/trips" className="text-sm text-cyan">← Back to all trips</Link>
        <h1 className="mb-1 mt-2 text-2xl font-bold capitalize text-polar">{data.trip.city} — operations</h1>
        <p className="text-sm text-slate">Status: {data.trip.status}</p>
      </div>

      <dl className="grid grid-cols-3 gap-3 rounded-xl bg-surface-1 p-3 text-sm">
        <div>
          <dt className="text-xs text-slate">Impact score</dt>
          <dd className="font-semibold tabular-nums text-polar">{data.summary.ripple_impact_score.toFixed(0)}/100</dd>
        </div>
        <div>
          <dt className="text-xs text-slate">Cost at risk</dt>
          <dd className="font-semibold tabular-nums text-polar">{formatMoney(data.summary.total_cost_at_risk, data.trip.currency)}</dd>
        </div>
        <div>
          <dt className="text-xs text-slate">Broken node</dt>
          <dd className="font-semibold text-polar">{data.summary.broken_node_name ?? "None"}</dd>
        </div>
      </dl>

      <div className="rounded-2xl border border-border bg-surface-2 p-5">
        <h2 className="mb-3 text-base font-bold text-polar">Nodes</h2>
        <ul className="space-y-2">
          {data.nodes.map((node) => (
            <li key={node.id} className="flex items-center justify-between gap-3 rounded-lg border border-border px-3 py-2 text-sm">
              <div>
                <p className="text-polar">{node.name}</p>
                <p className="text-xs text-slate">{node.type} · {formatMoney(node.cost, data.trip.currency)}</p>
              </div>
              <div className="flex items-center gap-2">
                <StatusBadge status={node.status} />
                <select
                  aria-label={`Override status for ${node.name}`}
                  disabled={busyNodeId === node.id}
                  value={node.status}
                  onChange={(e) => handleOverride(node.id, e.target.value as NodeStatus)}
                  className="rounded-md border border-border bg-canvas px-2 py-1 text-xs text-polar"
                >
                  {OVERRIDE_STATUSES.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
            </li>
          ))}
        </ul>
      </div>

      <div className="rounded-2xl border border-border bg-surface-2 p-5">
        <h2 className="mb-3 text-base font-bold text-polar">Payments</h2>
        {data.payments.length === 0 ? (
          <p className="text-sm text-slate">No payment records yet.</p>
        ) : (
          <ul className="space-y-2">
            {data.payments.map((p) => (
              <li key={p.id} className="flex items-center justify-between text-sm">
                <span className="text-polar">{formatMoney(p.amount, data.trip.currency)}</span>
                <span className="capitalize text-slate">{p.status}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
