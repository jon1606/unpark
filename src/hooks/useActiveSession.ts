'use client';
import { useEffect, useRef } from 'react';
import { getSupabaseClient } from '@/lib/supabase/client';

export function useActiveSession(active: boolean) {
  const userIdRef = useRef<string | null>(null);

  // Get user id once
  useEffect(() => {
    const supabase = getSupabaseClient();
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) userIdRef.current = data.user.id;
    });
  }, []);

  // Report position to active_sessions
  const reportPosition = async (lat: number, lng: number, isParked: boolean) => {
    if (!active || !userIdRef.current) return;
    const supabase = getSupabaseClient();
    await supabase.from('active_sessions').upsert({
      user_id: userIdRef.current,
      lat,
      lng,
      is_parked: isParked,
      last_seen: new Date().toISOString(),
    });
  };

  // Clean up session when tracking stops
  useEffect(() => {
    return () => {
      if (userIdRef.current) {
        const supabase = getSupabaseClient();
        supabase
          .from('active_sessions')
          .delete()
          .eq('user_id', userIdRef.current)
          .then(() => {});
      }
    };
  }, []);

  // Delete session when active goes false
  useEffect(() => {
    if (!active && userIdRef.current) {
      const supabase = getSupabaseClient();
      supabase
        .from('active_sessions')
        .delete()
        .eq('user_id', userIdRef.current)
        .then(() => {});
    }
  }, [active]);

  return { reportPosition };
}
