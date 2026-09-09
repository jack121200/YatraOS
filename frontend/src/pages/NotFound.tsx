import { Link, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";

export default function NotFound() {
  const location = useLocation();
  const [animate, setAnimate] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setAnimate(true), 100);
    return () => clearTimeout(t);
  }, []);

  return (
    <div className="mx-auto flex min-h-[80vh] max-w-2xl flex-col items-center justify-center px-4 text-center">
      {/* Animated 404 number */}
      <div className={`transition-all duration-700 ease-out ${animate ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0"}`}>
        <h1
          className="text-[10rem] font-extrabold leading-none tracking-tighter sm:text-[12rem]"
          style={{
            background: "linear-gradient(135deg, rgb(var(--cyan)), rgb(var(--indigo)), rgb(var(--tertiary)))",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
          }}
        >
          404
        </h1>
      </div>

      {/* Decorative broken path line */}
      <div className={`mb-6 transition-all duration-700 delay-200 ease-out ${animate ? "scale-x-100 opacity-100" : "scale-x-0 opacity-0"}`}>
        <svg width="200" height="24" viewBox="0 0 200 24" fill="none" className="mx-auto">
          <path
            d="M0 12 H70 L80 4 L90 20 L100 4 L110 20 L120 12 H200"
            stroke="rgb(var(--cyan))"
            strokeWidth="2"
            strokeLinecap="round"
            strokeDasharray="4 6"
            opacity="0.5"
          />
          {/* Break indicator */}
          <circle cx="95" cy="12" r="4" fill="rgb(var(--critical))" opacity="0.7" />
        </svg>
      </div>

      {/* Message */}
      <div className={`transition-all duration-700 delay-300 ease-out ${animate ? "translate-y-0 opacity-100" : "translate-y-6 opacity-0"}`}>
        <h2 className="text-headline-sm text-polar">Route disruption detected</h2>
        <p className="mt-2 text-sm text-slate">
          The path <code className="rounded-md bg-surface-1 px-2 py-1 text-xs font-medium text-cyan">{location.pathname}</code> doesn't exist in our itinerary.
        </p>
        <p className="mt-1 text-sm text-muted">
          Looks like this leg of the journey hit a dead end. Let's reroute you.
        </p>
      </div>

      {/* Recovery options — matching the app's recovery pattern */}
      <div className={`mt-8 flex flex-col gap-3 sm:flex-row transition-all duration-700 delay-500 ease-out ${animate ? "translate-y-0 opacity-100" : "translate-y-6 opacity-0"}`}>
        <Link
          to="/"
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-cyan px-6 py-2.5 text-sm font-bold text-white transition-all duration-150 hover:bg-cyan-bright active:scale-[0.98]"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
            <polyline points="9 22 9 12 15 12 15 22" />
          </svg>
          Back to home
        </Link>
        <Link
          to="/plan"
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-border bg-surface-2 px-6 py-2.5 text-sm font-semibold text-polar transition-all duration-150 hover:bg-surface-1 active:scale-[0.98]"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polygon points="3 11 22 2 13 21 11 13 3 11" />
          </svg>
          Plan a trip
        </Link>
      </div>

      {/* Subtle floating animation on the 404 */}
      <style>{`
        @keyframes gentle-float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-8px); }
        }
      `}</style>
    </div>
  );
}
