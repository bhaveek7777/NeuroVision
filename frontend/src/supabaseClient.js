import { createClient } from "@supabase/supabase-js";
import { mockSupabase } from "./mockSupabase";

// ---------------------------------------------------------------------------
// If real Supabase keys are present in .env, use the real client.
// Otherwise fall back to the mock client so you can preview the app locally.
// ---------------------------------------------------------------------------
const SUPABASE_URL     = process.env.REACT_APP_SUPABASE_URL     || "";
const SUPABASE_ANON_KEY = process.env.REACT_APP_SUPABASE_ANON_KEY || "";

const isReal =
  SUPABASE_URL.startsWith("https://") &&
  !SUPABASE_URL.includes("your-project") &&
  SUPABASE_ANON_KEY.length > 20 &&
  !SUPABASE_ANON_KEY.includes("your-anon");

export const supabase = isReal
  ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
  : mockSupabase;

export const IS_MOCK = !isReal;
