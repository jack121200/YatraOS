// Decorative backdrop for hero sections — a coordinate grid with glowing,
// pulse-connected nodes in the Biscoff Caramel palette, evoking the
// "Autonomous Graph Flow Line" motif from the design spec (SVG Bezier
// connections in tertiary tone with caramel particle pulses). Pure SVG, no
// image asset, respects prefers-reduced-motion via the shared .pulse-line
// keyframe (gated in index.css).
export function TelemetryField() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
      <div
        className="absolute inset-0"
        style={{
          backgroundImage:
            "radial-gradient(ellipse 70% 60% at 50% 20%, rgba(184,92,56,0.10), transparent 60%), radial-gradient(ellipse 50% 40% at 80% 60%, rgba(140,83,43,0.10), transparent 60%)",
        }}
      />
      <svg className="absolute inset-0 h-full w-full opacity-30" viewBox="0 0 800 400" preserveAspectRatio="xMidYMid slice">
        <defs>
          <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
            <path d="M40 0H0V40" fill="none" stroke="rgba(122,108,98,0.10)" strokeWidth="1" />
          </pattern>
        </defs>
        <rect width="800" height="400" fill="url(#grid)" />
        <g strokeWidth="1.5" fill="none">
          <path className="pulse-line" d="M120 300 L300 180 L480 220" stroke="#8C532B" opacity="0.45" />
          <path className="pulse-line" d="M300 180 L520 90 L680 160" stroke="#B85C38" opacity="0.35" />
        </g>
        <circle cx="120" cy="300" r="4" fill="#2D6A4F" />
        <circle cx="300" cy="180" r="5" fill="#8C532B" />
        <circle cx="480" cy="220" r="4" fill="#D97706" />
        <circle cx="520" cy="90" r="4" fill="#B85C38" />
        <circle cx="680" cy="160" r="4" fill="#C2410C" />
      </svg>
    </div>
  );
}
