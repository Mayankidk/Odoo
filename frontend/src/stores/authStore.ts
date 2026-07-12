import { create } from 'zustand';
import type { User } from '@supabase/supabase-js';

interface AuthState {
  user: User | null;
  role: string | null;
  isLoading: boolean;
  setUser: (user: User | null, role?: string | null) => void;
  setLoading: (isLoading: boolean) => void;
  clearSession: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null, 
  role: null,
  isLoading: true, // Start loading as true until we check the session
  setUser: (user, role = null) => set({ user, role, isLoading: false }),
  setLoading: (isLoading) => set({ isLoading }),
  clearSession: () => set({ user: null, role: null, isLoading: false }),
}));
