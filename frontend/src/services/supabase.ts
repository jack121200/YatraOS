import { createClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL;
const key = import.meta.env.VITE_SUPABASE_ANON_KEY;

// The publishable/anon key is meant to ship in the browser bundle — every row
// it can reach is gated by the RLS policies in
// backend/supabase/migrations/0001_init.sql. The service-role key must never
// appear here; it lives only in backend/.env.
export const supabase = url && key ? createClient(url, key) : null;

export const isAuthConfigured = Boolean(supabase);
