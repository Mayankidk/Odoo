import { useEffect, ReactNode } from 'react';
import { supabase } from '../config/supabase';
import { useAuthStore } from '../stores/authStore';

export function AuthProvider({ children }: { children: ReactNode }) {
  const { setUser, clearSession } = useAuthStore();

  useEffect(() => {
    // Check active sessions and sets the user
    supabase.auth.getSession()
      .then(({ data: { session } }) => {
        if (session?.user) {
          // In a real app, you would also fetch the user role from a custom table here
          // e.g. const { data } = await supabase.from('user_roles').select('role').eq('user_id', session.user.id)
          setUser(session.user, 'employee'); // Defaulting role for now
        } else {
          clearSession();
        }
      })
      .catch((err) => {
        console.error("Supabase connection error:", err);
        clearSession();
      });

    // Listen for changes on auth state (logged in, signed out, etc.)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setUser(session.user, 'employee');
      } else {
        clearSession();
      }
    });

    return () => subscription.unsubscribe();
  }, [setUser, clearSession]);

  return <>{children}</>;
}
