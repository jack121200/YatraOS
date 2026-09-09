/** @type {import('tailwindcss').Config} */
const rgb = (v) => `rgb(var(${v}) / <alpha-value>)`;

// Tokens transcribed from
// stitch_yatraos_dynamic_tour_platform/autonomous_tour_graph_platform/DESIGN.md
// — the "Biscoff Caramel" warm-luxury design system. Values here should
// match that file exactly; if they ever diverge, DESIGN.md is the source of
// truth. Utility KEY NAMES (cyan/indigo/telemetry-*) are carried over from an
// earlier dark-theme pass — treat them as roles (primary/secondary/data
// figure), not literal hues.
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        canvas: rgb("--canvas"),
        surface: {
          1: rgb("--surface-01"),
          2: rgb("--surface-02"),
          elevated: rgb("--surface-elevated"),
        },
        cyan: { DEFAULT: rgb("--cyan"), bright: rgb("--cyan-bright") },
        indigo: rgb("--indigo"),
        tertiary: rgb("--tertiary"),
        nominal: rgb("--nominal"),
        caution: rgb("--caution"),
        critical: rgb("--critical"),
        polar: rgb("--text-polar"),
        slate: rgb("--text-slate"),
        muted: rgb("--text-muted"),
        primary: { DEFAULT: rgb("--cyan"), foreground: "#FDFBF7" },
        secondary: { DEFAULT: rgb("--indigo"), foreground: "#FDFBF7" },
        border: rgb("--border-hairline"),
        status: {
          safe: rgb("--nominal"),
          "at-risk": rgb("--caution"),
          broken: rgb("--critical"),
        },
      },
      fontFamily: {
        // Biscoff spec: exclusively Plus Jakarta Sans, no separate mono —
        // telemetry numbers use its tabular-figure feature instead.
        sans: ["Plus Jakarta Sans", "system-ui", "sans-serif"],
        mono: ["Plus Jakarta Sans", "system-ui", "sans-serif"],
      },
      // Exact scale from DESIGN.md's `typography` block (key names kept
      // from the earlier pass; values now match Biscoff, not Obsidian).
      fontSize: {
        "headline-2xl": ["44px", { lineHeight: "52px", letterSpacing: "-0.03em", fontWeight: "700" }],
        "headline-xl": ["32px", { lineHeight: "40px", letterSpacing: "-0.02em", fontWeight: "600" }],
        "headline-lg": ["32px", { lineHeight: "40px", letterSpacing: "-0.02em", fontWeight: "600" }],
        "headline-md": ["24px", { lineHeight: "32px", letterSpacing: "-0.015em", fontWeight: "600" }],
        "headline-sm": ["20px", { lineHeight: "28px", letterSpacing: "-0.01em", fontWeight: "600" }],
        "body-lg": ["16px", { lineHeight: "26px", fontWeight: "400" }],
        "body-md": ["14px", { lineHeight: "22px", letterSpacing: "0.005em", fontWeight: "400" }],
        "body-sm": ["12px", { lineHeight: "18px", letterSpacing: "0.01em", fontWeight: "400" }],
        "telemetry-lg": ["24px", { lineHeight: "32px", letterSpacing: "-0.015em", fontWeight: "700" }],
        "telemetry-md": ["16px", { lineHeight: "24px", fontWeight: "600" }],
        "telemetry-sm": ["13px", { lineHeight: "18px", letterSpacing: "0.03em", fontWeight: "600" }],
        "label-caps": ["10px", { lineHeight: "14px", letterSpacing: "0.08em", fontWeight: "700" }],
      },
      spacing: {
        "2xs": "0.125rem",
        xs: "0.25rem",
        sm: "0.75rem",
        md: "1rem",
        base: "1rem",
        lg: "1.5rem",
        xl: "2rem",
        "2xl": "3rem",
        "3xl": "4rem",
      },
      borderRadius: {
        DEFAULT: "0.5rem",
        md: "0.75rem",
        lg: "1rem",
      },
      boxShadow: {
        frame: "0px 1px 3px rgba(36, 28, 21, 0.04), 0px 4px 12px rgba(140, 83, 43, 0.03)",
      },
    },
  },
  plugins: [],
};
