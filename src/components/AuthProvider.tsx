'use client';
import { useEffect } from 'react';
import { getSupabaseClient } from '@/lib/supabase/client';

export default function AuthProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const supabase = getSupabaseClient();
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) {
        supabase.auth.signInAnonymously();
      }
    });
  }, []);
  return <>{children}</>;
}
