// "Status Indicator Badges" per autonomous_tour_graph_platform/DESIGN.md: continuous
// pill, uppercase label-caps, breathing status dot.
export type NodeStatus = "planned" | "confirmed" | "at_risk" | "broken";

const STYLES: Record<NodeStatus, { bg: string; text: string; dot: string; label: string; pulse: boolean }> = {
  planned: { bg: "bg-black/[0.03]", text: "text-slate", dot: "bg-slate", label: "Planned", pulse: false },
  confirmed: { bg: "bg-nominal/10", text: "text-nominal", dot: "bg-nominal", label: "Nominal", pulse: true },
  at_risk: { bg: "bg-caution/10", text: "text-caution", dot: "bg-caution", label: "Caution", pulse: true },
  broken: { bg: "bg-critical/15", text: "text-critical", dot: "bg-critical", label: "Disruption", pulse: true },
};

// Status is conveyed by dot color + text label together, not color alone
// (WCAG color-not-only).
export function StatusBadge({ status }: { status: NodeStatus }) {
  const s = STYLES[status];
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-label-caps uppercase ${s.bg} ${s.text}`}
      role="status"
    >
      <span className={`relative h-1.5 w-1.5 rounded-full ${s.dot} ${s.pulse ? "radar-dot" : ""}`} aria-hidden="true" />
      {s.label}
    </span>
  );
}
