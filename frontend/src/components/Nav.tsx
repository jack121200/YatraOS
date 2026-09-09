import { useState } from "react";
import { NavLink } from "react-router-dom";
import { useAuth } from "../lib/useAuth";

const LINKS = [
  { to: "/plan", label: "Plan a trip" },
  { to: "/itinerary", label: "Itinerary" },
  { to: "/recovery", label: "Recovery" },
  { to: "/my-trips", label: "My trips" },
];

const OPERATOR_LINK = { to: "/operator", label: "Operator" };

const NAV_LINK = "rounded-md px-3 py-2 text-sm font-medium text-slate transition-colors hover:bg-black/[0.03] hover:text-polar";
const NAV_LINK_ACTIVE = "bg-cyan/10 text-cyan";
const NAV_LINK_MOBILE = "block rounded-md px-3 py-3 text-base font-medium text-slate hover:bg-black/[0.03] hover:text-polar";

function MenuIcon({ open }: { open: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
      {open ? <path d="M6 6l12 12M18 6L6 18" /> : <path d="M4 7h16M4 12h16M4 17h16" />}
    </svg>
  );
}

// Broke on real mobile viewports before the collapse strategy below: the
// flex-row nav had no wrap/collapse, so "Plan a trip" wrapped to 3 lines and
// "Operator" visually detached past the viewport edge at 390px.
//
// Light-only warm-luxury per autonomous_tour_graph_platform/DESIGN.md
// (Biscoff Caramel) — no dark variant is defined in the source design.
export function Nav() {
  const [open, setOpen] = useState(false);
  const { user, signOut } = useAuth();

  return (
    <header className="sticky top-0 z-40 border-b border-black/[0.06] bg-surface-2/75 backdrop-blur-xl">
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <NavLink to="/" className="flex items-center gap-2 text-lg font-extrabold tracking-tight text-polar">
          <span className="h-2 w-2 rounded-full bg-cyan radar-dot" aria-hidden="true" />
          Yatra<span className="bg-gradient-to-r from-cyan to-indigo bg-clip-text text-transparent">OS</span>
        </NavLink>

        <div className="hidden items-center gap-1 md:flex">
          {LINKS.map((link) => (
            <NavLink key={link.to} to={link.to} className={({ isActive }) => `${NAV_LINK} ${isActive ? NAV_LINK_ACTIVE : ""}`}>
              {link.label}
            </NavLink>
          ))}
          <span className="mx-2 h-5 w-px bg-black/[0.08]" aria-hidden="true" />
          <NavLink to={OPERATOR_LINK.to} className={({ isActive }) => `${NAV_LINK} ${isActive ? NAV_LINK_ACTIVE : ""}`}>
            {OPERATOR_LINK.label}
          </NavLink>
          <span className="mx-2 h-5 w-px bg-black/[0.08]" aria-hidden="true" />
          {user ? (
            <button type="button" onClick={() => signOut()} className={`${NAV_LINK} cursor-pointer`}>
              Sign out
            </button>
          ) : (
            <NavLink to="/signin" className={({ isActive }) => `${NAV_LINK} ${isActive ? NAV_LINK_ACTIVE : ""}`}>
              Sign in
            </NavLink>
          )}
        </div>

        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-controls="mobile-nav"
          aria-label={open ? "Close menu" : "Open menu"}
          className="flex min-h-11 min-w-11 cursor-pointer items-center justify-center rounded-md text-polar hover:bg-black/[0.03] md:hidden"
        >
          <MenuIcon open={open} />
        </button>
      </nav>

      {open && (
        <div id="mobile-nav" className="border-t border-black/[0.06] bg-surface-2 px-4 py-2 md:hidden">
          {LINKS.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              onClick={() => setOpen(false)}
              className={({ isActive }) => `${NAV_LINK_MOBILE} ${isActive ? NAV_LINK_ACTIVE : ""}`}
            >
              {link.label}
            </NavLink>
          ))}
          <div className="my-1 h-px bg-black/[0.08]" aria-hidden="true" />
          <NavLink
            to={OPERATOR_LINK.to}
            onClick={() => setOpen(false)}
            className={({ isActive }) => `${NAV_LINK_MOBILE} ${isActive ? NAV_LINK_ACTIVE : ""}`}
          >
            {OPERATOR_LINK.label}
          </NavLink>
          {user ? (
            <button
              type="button"
              onClick={() => {
                signOut();
                setOpen(false);
              }}
              className={`${NAV_LINK_MOBILE} w-full cursor-pointer text-left`}
            >
              Sign out
            </button>
          ) : (
            <NavLink
              to="/signin"
              onClick={() => setOpen(false)}
              className={({ isActive }) => `${NAV_LINK_MOBILE} ${isActive ? NAV_LINK_ACTIVE : ""}`}
            >
              Sign in
            </NavLink>
          )}
        </div>
      )}
    </header>
  );
}
