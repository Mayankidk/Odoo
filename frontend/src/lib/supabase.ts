import { createClient } from "@supabase/supabase-js"

import type { Database } from "./database.types"

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || "https://placeholder-url-for-build.supabase.co"
const supabasePublishableKey = (
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ?? import.meta.env.VITE_SUPABASE_ANON_KEY ?? "placeholder-key"
) as string

if (!import.meta.env.VITE_SUPABASE_URL || (!import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY && !import.meta.env.VITE_SUPABASE_ANON_KEY)) {
  console.warn("Missing Supabase environment variables. Check frontend/.env.example.")
}

export const supabase = createClient<Database>(supabaseUrl, supabasePublishableKey)
