import { Link } from "react-router-dom";
import { Reveal } from "../components/Reveal";
import { TelemetryField } from "../components/TelemetryField";

const CHAPTERS = [
  {
    eyebrow: "The problem",
    title: "One delayed flight breaks the whole trip.",
    body: "A cab misses its window, and suddenly the hotel check-in, the fort booking, and the dinner reservation are all wrong. Today an operator finds out when the traveller calls, angry, and then fixes it over the phone, one vendor at a time.",
    accent: "broken" as const,
  },
  {
    eyebrow: "The insight",
    title: "A trip isn't a list. It's a graph.",
    body: "Every stay, transfer, activity and meal depends on the ones before it. Model those dependencies properly and a single break stops being a mystery — you can compute exactly what it touches, what it costs, and how little time you have left to fix it.",
    accent: "primary" as const,
  },
  {
    eyebrow: "The system",
    title: "Break one node. Watch the ripple.",
    body: "The Ripple Engine walks downstream from the break, flags every affected node, and scores the damage. Then it generates three ways out — cheapest, fastest, least disruptive — each with the real cost and time delta already computed. One tap applies it.",
    accent: "safe" as const,
  },
];

const STATS = [
  { value: "7", label: "Cities, real seeded data" },
  { value: "3", label: "Recovery plans per break" },
  { value: "<1s", label: "Ripple computed" },
];

const ACCENT_CLASS = {
  broken: "text-critical",
  primary: "text-primary",
  safe: "text-nominal",
};

export default function Landing() {
  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden px-4 pb-20 pt-20 sm:pt-28">
        <TelemetryField />
        <div className="relative mx-auto max-w-4xl text-center">
          <Reveal>
            <span className="inline-flex items-center gap-2 rounded-full border border-border bg-surface-2/70 px-3 py-1.5 text-label-caps uppercase text-slate backdrop-blur">
              Dynamic tour planning &amp; operations
            </span>
          </Reveal>

          <Reveal delay={80}>
            <h1 className="mt-6 text-headline-2xl text-polar">
              Trips break.
              <br />
              <span className="bg-gradient-to-r from-primary to-indigo bg-clip-text text-transparent">YatraOS fixes them.</span>
            </h1>
          </Reveal>

          <Reveal delay={160}>
            <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-slate">
              Personalised itineraries built on a dependency graph — so when a fort closes or a road washes out, the system
              already knows what broke, what it costs, and three ways to recover.
            </p>
          </Reveal>

          <Reveal delay={240}>
            <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link
                to="/plan"
                className="inline-flex min-h-12 w-full cursor-pointer items-center justify-center rounded-xl bg-gradient-to-r from-cyan to-indigo px-7 text-sm font-bold text-white shadow-[0_0_16px_rgba(6,182,212,0.35)] transition-all duration-150 hover:brightness-110 active:scale-[0.98] sm:w-auto"
              >
                Plan a trip
              </Link>
              <Link
                to="/recovery"
                className="inline-flex min-h-12 w-full cursor-pointer items-center justify-center rounded-xl border border-border bg-surface-2 px-7 text-sm font-bold text-polar transition-all duration-150 hover:bg-surface-1 active:scale-[0.98] sm:w-auto"
              >
                See a live recovery
              </Link>
            </div>
          </Reveal>

          <Reveal delay={320}>
            <dl className="mx-auto mt-16 grid max-w-lg grid-cols-3 gap-6">
              {STATS.map((s) => (
                <div key={s.label}>
                  <dt className="text-telemetry-lg tabular-nums text-polar">{s.value}</dt>
                  <dd className="mt-1 text-xs leading-snug text-slate">{s.label}</dd>
                </div>
              ))}
            </dl>
          </Reveal>
        </div>
      </section>

      {/* Chapters: problem → insight → system */}
      <section className="border-t border-border bg-surface-2/40 px-4 py-20">
        <div className="mx-auto max-w-3xl space-y-16">
          {CHAPTERS.map((c, i) => (
            <Reveal key={c.eyebrow}>
              <article className="grid gap-4 sm:grid-cols-[auto_1fr] sm:gap-8">
                <div className="text-telemetry-lg tabular-nums text-border sm:text-right">{String(i + 1).padStart(2, "0")}</div>
                <div>
                  <span className={`text-label-caps uppercase ${ACCENT_CLASS[c.accent]}`}>{c.eyebrow}</span>
                  <h2 className="mt-2 text-headline-lg text-polar">{c.title}</h2>
                  <p className="mt-3 leading-relaxed text-slate">{c.body}</p>
                </div>
              </article>
            </Reveal>
          ))}
        </div>
      </section>

      {/* Two audiences */}
      <section className="px-4 py-20">
        <div className="mx-auto max-w-5xl">
          <Reveal>
            <h2 className="text-center text-headline-lg text-polar">Built for both sides of the trip</h2>
          </Reveal>
          <div className="mt-10 grid gap-5 md:grid-cols-2">
            <Reveal delay={80}>
              <div className="h-full panel panel-hover rounded-lg p-7">
                <span className="text-label-caps uppercase text-primary">Traveller</span>
                <h3 className="mt-2 text-headline-sm text-polar">Your day, planned and repairable</h3>
                <ul className="mt-4 space-y-2.5 text-sm text-slate">
                  <li>Itinerary drafted from your interests, budget and pace</li>
                  <li>Live budget tracking in the local currency</li>
                  <li>Group ledger that re-splits when someone skips a stop</li>
                  <li>Three recovery options the moment something breaks</li>
                </ul>
                <Link to="/plan" className="mt-6 inline-block text-sm font-bold text-primary hover:underline">
                  Build a trip →
                </Link>
              </div>
            </Reveal>
            <Reveal delay={160}>
              <div className="h-full panel panel-hover rounded-lg p-7">
                <span className="text-label-caps uppercase text-indigo">Operator</span>
                <h3 className="mt-2 text-headline-sm text-polar">See the break before the phone rings</h3>
                <ul className="mt-4 space-y-2.5 text-sm text-slate">
                  <li>Every live trip ranked by Ripple Impact Score</li>
                  <li>Cost at risk and affected nodes, per trip</li>
                  <li>Alerts filtered to what actually needs a human</li>
                  <li>Read-only vendor rates and hours</li>
                </ul>
                <Link to="/operator" className="mt-6 inline-block text-sm font-bold text-indigo hover:underline">
                  Open the dashboard →
                </Link>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* Climax CTA */}
      <section className="relative overflow-hidden border-t border-border px-4 py-24">
        <TelemetryField />
        <div className="relative mx-auto max-w-2xl text-center">
          <Reveal>
            <h2 className="text-headline-lg text-polar">Break a trip on purpose.</h2>
            <p className="mx-auto mt-4 max-w-xl leading-relaxed text-slate">
              The demo runs on hand-curated data for seven cities across India and Southeast Asia. Pick one, build a day,
              then trigger the disruption and watch the graph recover.
            </p>
            <Link
              to="/plan"
              className="mt-8 inline-flex min-h-12 cursor-pointer items-center justify-center rounded-xl bg-gradient-to-r from-cyan to-indigo px-8 text-sm font-bold text-white shadow-[0_0_16px_rgba(6,182,212,0.35)] transition-all duration-150 hover:brightness-110 active:scale-[0.98]"
            >
              Start planning
            </Link>
          </Reveal>
        </div>
      </section>
    </div>
  );
}
