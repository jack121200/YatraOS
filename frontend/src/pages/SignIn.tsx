import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase, isAuthConfigured } from "../services/supabase";

export default function SignIn() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState<{ kind: "error" | "info"; text: string } | null>(null);
  const [busy, setBusy] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!supabase) return;
    setBusy(true);
    setStatus(null);

    const { error, data } =
      mode === "signin"
        ? await supabase.auth.signInWithPassword({ email, password })
        : await supabase.auth.signUp({
            email,
            password,
            options: { emailRedirectTo: `${window.location.origin}/signin` },
          });

    setBusy(false);
    if (error) {
      setStatus({ kind: "error", text: error.message });
      return;
    }
    if (mode === "signup" && !data.session) {
      setStatus({ kind: "info", text: "Check your email to confirm the account, then sign in." });
      return;
    }
    navigate("/plan");
  }

  if (!isAuthConfigured) {
    return (
      <div className="mx-auto flex min-h-[60vh] max-w-md flex-col items-center justify-center px-4 text-center">
        <h1 className="text-headline-sm text-polar">Auth isn't configured</h1>
        <p className="mt-2 text-sm text-slate">
          Set <code className="rounded bg-surface-1 px-1.5 py-0.5">VITE_SUPABASE_URL</code> and{" "}
          <code className="rounded bg-surface-1 px-1.5 py-0.5">VITE_SUPABASE_ANON_KEY</code> in{" "}
          <code className="rounded bg-surface-1 px-1.5 py-0.5">frontend/.env.local</code>.
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-md px-4 py-16">
      <h1 className="text-headline-lg text-polar">{mode === "signin" ? "Welcome back" : "Create an account"}</h1>
      <p className="mt-2 text-sm text-slate">
        Signing in saves your trips. The demo works without an account too — this is only for persistence.
      </p>

      <form onSubmit={handleSubmit} className="mt-8 space-y-4 rounded-2xl border border-border bg-surface-2 p-6">
        <div>
          <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-polar">
            Email
          </label>
          <input
            id="email"
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="min-h-11 w-full rounded-lg border border-border bg-canvas px-3 py-2 text-sm text-polar"
          />
        </div>
        <div>
          <label htmlFor="password" className="mb-1.5 block text-sm font-medium text-polar">
            Password
          </label>
          <input
            id="password"
            type="password"
            required
            minLength={6}
            autoComplete={mode === "signin" ? "current-password" : "new-password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="min-h-11 w-full rounded-lg border border-border bg-canvas px-3 py-2 text-sm text-polar"
          />
          {mode === "signup" && <p className="mt-1.5 text-xs text-slate">At least 6 characters.</p>}
        </div>

        {status && (
          <div
            role={status.kind === "error" ? "alert" : "status"}
            className={`rounded-lg px-3 py-2 text-sm ${
              status.kind === "error" ? "bg-critical/10 text-critical" : "bg-nominal/10 text-nominal"
            }`}
          >
            {status.text}
          </div>
        )}

        <button
          type="submit"
          disabled={busy}
          className="inline-flex min-h-11 w-full cursor-pointer items-center justify-center rounded-xl bg-primary px-4 text-sm font-bold text-primary-foreground transition-all duration-150 hover:bg-primary/90 active:scale-[0.98] disabled:opacity-60"
        >
          {busy ? "Working…" : mode === "signin" ? "Sign in" : "Create account"}
        </button>
      </form>

      <button
        type="button"
        onClick={() => {
          setMode(mode === "signin" ? "signup" : "signin");
          setStatus(null);
        }}
        className="mt-4 w-full cursor-pointer text-sm text-slate hover:text-polar"
      >
        {mode === "signin" ? "Need an account? Sign up" : "Already have an account? Sign in"}
      </button>
    </div>
  );
}
