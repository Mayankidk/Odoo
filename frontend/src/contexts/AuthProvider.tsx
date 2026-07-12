import { useEffect, type ReactNode } from "react"
import type { User as SupabaseUser } from "@supabase/supabase-js"

import type { User as Profile } from "@/lib/database.types"
import { supabase } from "@/lib/supabase"
import { useAuthStore } from "@/stores/authStore"

async function loadProfile(user: SupabaseUser) {
  const { data, error } = await supabase
    .from("users")
    .select("name,email,role")
    .eq("id", user.id)
    .single<Pick<Profile, "name" | "email" | "role">>()

  if (error) {
    return {
      name: user.user_metadata?.name ?? user.email ?? "User",
      email: user.email ?? "",
      role: "employee" as const,
    }
  }

  return data
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const setSession = useAuthStore((state) => state.setSession)
  const clearSession = useAuthStore((state) => state.clearSession)

  useEffect(() => {
    let isMounted = true

    async function hydrateSession() {
      const { data } = await supabase.auth.getSession()
      const user = data.session?.user

      if (!isMounted) return
      if (!user) {
        clearSession()
        return
      }

      const profile = await loadProfile(user)
      if (isMounted) setSession(user, profile)
    }

    hydrateSession()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      const user = session?.user
      if (!user) {
        clearSession()
        return
      }

      loadProfile(user).then((profile) => {
        if (isMounted) setSession(user, profile)
      })
    })

    return () => {
      isMounted = false
      subscription.unsubscribe()
    }
  }, [clearSession, setSession])

  return <>{children}</>
}
