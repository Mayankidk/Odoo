import { createClient } from "@supabase/supabase-js"

import type { Database } from "./database.types"

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined
const supabasePublishableKey = (
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ?? import.meta.env.VITE_SUPABASE_ANON_KEY
) as string | undefined

if (!supabaseUrl || !supabasePublishableKey) {
  console.warn("Missing Supabase environment variables. Check frontend/.env.example.")
}

export const supabase = createClient<Database>(supabaseUrl ?? "", supabasePublishableKey ?? "")
