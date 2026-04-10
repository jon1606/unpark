'use client';
import { useEffect, useState } from 'react';
import { getSupabaseClient } from '@/lib/supabase/client';
import type { ParkingSpot } from '@/types';

export function useParkingSpots() {
  const [spots, setSpots] = useState<ParkingSpot[]>([]);

  useEffect(() => {
    const supabase = getSupabaseClient();

    supabase
      .from('parking_spots')
      .select('id, lat, lng, vacated_at, expires_at, is_available')
      .eq('is_available', true)
      .gt('expires_at', new Date().toISOString())
      .then(({ data }) => {
        if (data) setSpots(data as ParkingSpot[]);
      });
  }, []);

  useEffect(() => {
    const supabase = getSupabaseClient();
    const channel = supabase
      .channel('parking_spots_changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'parking_spots' },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setSpots((prev) => [...prev, payload.new as ParkingSpot]);
          }
          if (payload.eventType === 'UPDATE') {
            setSpots((prev) =>
              prev
                .map((s) => (s.id === payload.new.id ? (payload.new as ParkingSpot) : s))
                .filter((s) => s.is_available)
            );
          }
          if (payload.eventType === 'DELETE') {
            setSpots((prev) => prev.filter((s) => s.id !== (payload.old as ParkingSpot).id));
          }
        }
      )
      .subscribe();

    const expireInterval = setInterval(() => {
      setSpots((prev) => prev.filter((s) => new Date(s.expires_at) > new Date()));
    }, 60_000);

    return () => {
      supabase.removeChannel(channel);
      clearInterval(expireInterval);
    };
  }, []);

  return { spots };
}
