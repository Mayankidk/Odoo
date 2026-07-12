import { useEffect } from 'react';
import type { ReactNode } from 'react';
import { supabase } from '../config/supabase';
import { useAuthStore } from '../stores/authStore';

export function AuthProvider({ children }: { children: ReactNode }) {
  const { setUser, clearSession } = useAuthStore();

  useEffect(() => {
    const initSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          const { data } = await supabase
            .from('users')
            .select('role')
            .eq('id', session.user.id)
            .single();
            
          setUser(session.user, data?.role || 'employee');
        } else {
          clearSession();
        }
      } catch (err) {
        console.error("Supabase connection error:", err);
        clearSession();
      }
    };

    initSession();

    // Listen for changes on auth state (logged in, signed out, etc.)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) {
        const { data } = await supabase
          .from('users')
          .select('role')
          .eq('id', session.user.id)
          .single();
          
        setUser(session.user, data?.role || 'employee');
      } else {
        clearSession();
      }
    });

    return () => subscription.unsubscribe();
  }, [setUser, clearSession]);

  return <>{children}</>;
}
