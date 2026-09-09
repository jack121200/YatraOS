import { useEffect, useState } from "react";

const STORAGE_KEY = "yatraos_mock_user";

interface MockUser {
  email: string;
}

// Local-only mock auth: no real Supabase account, no confirmation email, no
// rate limits. "Signing in" with any email/password just remembers that
// email in localStorage on this device — enough to unlock My Trips/Booking
// (which are themselves local-only, see lib/savedTrips.ts) without a real
// backend account. The demo click-path (build/break/recover a trip) never
// needed auth in the first place and still doesn't.
function readMockUser(): MockUser | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function mockSignIn(email: string) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ email }));
  window.dispatchEvent(new Event("yatraos-auth-change"));
}

export function mockSignOut() {
  localStorage.removeItem(STORAGE_KEY);
  window.dispatchEvent(new Event("yatraos-auth-change"));
}

export function useAuth() {
  const [user, setUser] = useState<MockUser | null>(() => readMockUser());

  useEffect(() => {
    const sync = () => setUser(readMockUser());
    window.addEventListener("yatraos-auth-change", sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener("yatraos-auth-change", sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  return {
    user,
    loading: false,
    signOut: mockSignOut,
  };
}
