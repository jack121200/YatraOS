import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../../services/api";
import { useAuth } from "../../lib/useAuth";
import { formatMoney } from "../../lib/money";
import { useTripStore } from "../../store/tripStore";

declare global {
  interface Window {
    Razorpay: new (options: Record<string, unknown>) => { open: () => void };
  }
}

function loadRazorpayScript(): Promise<boolean> {
  return new Promise((resolve) => {
    if (window.Razorpay) return resolve(true);
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

// Real booking flow against persisted Supabase data: create the trip
// (POST /api/trips, which re-runs the AI builder + validator server-side so
// what gets saved matches what a fresh page load will show), take payment
// (Razorpay test mode, or a mock order when keys aren't configured yet — see
// backend/app/services/payments.py), then confirm. This is separate from the
// TripBuilder -> ItineraryView demo click-path, which intentionally stays
// signed-out and never touches the database.
export default function Booking() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const trip = useTripStore((s) => s.lastBuiltTrip);
  const setActiveTripId = useTripStore((s) => s.setActiveTripId);

  const today = new Date();
  const tomorrow = new Date(today.getTime() + 86_400_000);
  const [startDate, setStartDate] = useState(today.toISOString().slice(0, 10));
  const [endDate, setEndDate] = useState(tomorrow.toISOString().slice(0, 10));
  const [status, setStatus] = useState<"idle" | "creating" | "paying" | "confirming" | "done">("idle");
  const [error, setError] = useState<string | null>(null);

  if (!trip) {
    return (
      <div className="mx-auto flex min-h-[60vh] max-w-2xl flex-col items-center justify-center gap-3 px-4 text-center">
        <h1 className="text-2xl font-bold text-polar">No trip to book yet</h1>
        <p className="text-slate">Build a day first, then come back here to save and pay for it.</p>
        <Link to="/plan" className="inline-flex min-h-11 items-center justify-center rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90">
          Build a trip
        </Link>
      </div>
    );
  }

  if (!authLoading && !user) {
    return (
      <div className="mx-auto flex min-h-[60vh] max-w-2xl flex-col items-center justify-center gap-3 px-4 text-center">
        <h1 className="text-2xl font-bold text-polar">Sign in to book</h1>
        <p className="text-slate">Booking saves this trip to your account so it survives a refresh and shows up in My Trips.</p>
        <Link to="/signin" className="inline-flex min-h-11 items-center justify-center rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90">
          Sign in
        </Link>
      </div>
    );
  }

  async function handleBook() {
    if (!trip) return;
    setError(null);
    try {
      setStatus("creating");
      const { data: created } = await api.post("/api/trips", {
        city: trip.city,
        start_date: startDate,
        end_date: endDate,
        budget: trip.budget,
        interests: trip.interests,
        pace: trip.pace,
      });
      const tripId: string = created.trip.id;

      setStatus("paying");
      const { data: order } = await api.post("/api/payments/create-order", {
        trip_id: tripId,
        amount: trip.totalCost,
      });

      if (order.mode === "razorpay") {
        const ok = await loadRazorpayScript();
        if (!ok) throw new Error("Couldn't load the Razorpay checkout script.");
        await new Promise<void>((resolve, reject) => {
          const rzp = new window.Razorpay({
            key: order.key_id,
            order_id: order.razorpay_order_id,
            amount: order.amount * 100,
            currency: order.currency,
            name: "YatraOS",
            description: `${trip.city} trip`,
            handler: async (response: { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string }) => {
              setStatus("confirming");
              await api.post("/api/payments/confirm", { payment_id: order.payment_id, ...response });
              resolve();
            },
            modal: { ondismiss: () => reject(new Error("Payment cancelled.")) },
          });
          rzp.open();
        });
      } else {
        // Mock mode (no Razorpay keys set in backend/.env yet) — confirm
        // immediately so the rest of the flow (trip goes active, ledger,
        // disruption/recovery) is still testable end-to-end.
        setStatus("confirming");
        await api.post("/api/payments/confirm", {
          payment_id: order.payment_id,
          razorpay_order_id: order.razorpay_order_id,
          razorpay_payment_id: `mock_pay_${tripId}`,
          razorpay_signature: "mock",
        });
      }

      setActiveTripId(tripId);
      setStatus("done");
      navigate(`/trips/${tripId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Booking failed.");
      setStatus("idle");
    }
  }

  const busy = status !== "idle";

  return (
    <div className="mx-auto max-w-lg px-4 py-8">
      <h1 className="mb-1 text-2xl font-bold capitalize text-polar">Book your {trip.city} trip</h1>
      <p className="mb-6 text-sm text-slate">This saves the itinerary to your account and takes payment (Razorpay test mode).</p>

      <div className="space-y-4 rounded-2xl border border-border bg-surface-2 p-5">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="start" className="mb-1.5 block text-sm font-medium text-polar">Start date</label>
            <input id="start" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="min-h-11 w-full rounded-lg border border-border bg-canvas px-3 py-2 text-sm text-polar" />
          </div>
          <div>
            <label htmlFor="end" className="mb-1.5 block text-sm font-medium text-polar">End date</label>
            <input id="end" type="date" value={endDate} min={startDate} onChange={(e) => setEndDate(e.target.value)} className="min-h-11 w-full rounded-lg border border-border bg-canvas px-3 py-2 text-sm text-polar" />
          </div>
        </div>

        <div className="flex items-center justify-between border-t border-border pt-4 text-sm">
          <span className="text-slate">Total due</span>
          <span className="text-lg font-bold tabular-nums text-polar">{formatMoney(trip.totalCost, trip.currency)}</span>
        </div>

        {error && (
          <div className="rounded-lg bg-critical/10 px-3 py-2 text-sm text-critical" role="alert">{error}</div>
        )}

        <button
          type="button"
          onClick={handleBook}
          disabled={busy}
          className="inline-flex min-h-11 w-full cursor-pointer items-center justify-center rounded-xl bg-primary px-4 py-2.5 text-sm font-bold text-primary-foreground transition-all duration-150 hover:bg-primary/90 active:scale-[0.98] disabled:opacity-60"
        >
          {status === "idle" && `Pay ${formatMoney(trip.totalCost, trip.currency)}`}
          {status === "creating" && "Saving trip…"}
          {status === "paying" && "Opening payment…"}
          {status === "confirming" && "Confirming…"}
          {status === "done" && "Done"}
        </button>
      </div>
    </div>
  );
}
