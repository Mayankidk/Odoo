import { createClient } from '@supabase/supabase-js';

// ---------------------------------------------------------------------------
// Environment validation
// ---------------------------------------------------------------------------
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl) {
  throw new Error(
    'Missing VITE_SUPABASE_URL — copy .env.example → .env and add your Supabase project URL.',
  );
}

if (!supabaseAnonKey) {
  throw new Error(
    'Missing VITE_SUPABASE_ANON_KEY — copy .env.example → .env and add your Supabase anon key.',
  );
}

// ---------------------------------------------------------------------------
// Client instance
// ---------------------------------------------------------------------------
// A single, shared Supabase client used across the entire app.
// Every hook and utility should import from here — never instantiate a second
// client — so that auth session and realtime subscriptions stay consistent.
// ---------------------------------------------------------------------------
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    // Persist session in localStorage (default) so users stay logged in
    // across tabs and page reloads.
    persistSession: true,
    // Automatically refresh the JWT before it expires.
    autoRefreshToken: true,
    // Listen to storage events so other tabs stay in sync when the user
    // logs in or out.
    detectSessionInUrl: true,
  },
});
