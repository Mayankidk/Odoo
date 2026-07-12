import type { User as SupabaseUser } from "@supabase/supabase-js"
import { create } from "zustand"

import type { UserRole } from "@/lib/database.types"

type Profile = {
  name: string
  email: string
  role: UserRole
}

type AuthState = {
  user: SupabaseUser | null
  profile: Profile | null
  isLoading: boolean
  setSession: (user: SupabaseUser, profile: Profile | null) => void
  setLoading: (isLoading: boolean) => void
  clearSession: () => void
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  profile: null,
  isLoading: true,
  setSession: (user, profile) => set({ user, profile, isLoading: false }),
  setLoading: (isLoading) => set({ isLoading }),
  clearSession: () => set({ user: null, profile: null, isLoading: false }),
}))
