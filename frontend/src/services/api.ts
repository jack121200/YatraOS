import axios from "axios";
import { supabase } from "./supabase";

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8000",
});

// Every authenticated backend endpoint (app/api/deps.py) reads the Supabase
// access token from this header and verifies it server-side — attaching it
// here means every call site doesn't have to remember to. Signed-out
// requests simply go through with no header, which the demo endpoints (and
// deps.optional_db) accept.
api.interceptors.request.use(async (config) => {
  if (!supabase) return config;
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
