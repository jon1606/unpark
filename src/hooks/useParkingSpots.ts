'use client';
import { useEffect, useState } from 'react';
import { getSupabaseClient } from '@/lib/supabase/client';
import type { ParkingSpot } from '@/types';

export interface OccupiedSpot {
  user_id: string;
  lat: number;
  lng: number;
  last_seen: string;
}

export function useParkingSpots() {
  const [spots, setSpots] = useState<ParkingSpot[]>([]);
  const [occupiedSpots, setOccupiedSpots] = useState<OccupiedSpot[]>([]);

  // Fetch available spots
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

  // Fetch occupied sessions (parked devices)
  useEffect(() => {
    const supabase = getSupabaseClient();
    supabase
      .from('active_sessions')
      .select('user_id, lat, lng, last_seen')
      .eq('is_parked', true)
      .then(({ data }) => {
        if (data) setOccupiedSpots(data as OccupiedSpot[]);
      });
  }, []);

  // Realtime: available spots
  useEffect(() => {
    const supabase = getSupabaseClient();
    const spotsChannel = supabase
      .channel('parking_spots_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'parking_spots' }, (payload) => {
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
      })
      .subscribe();

    // Realtime: occupied sessions
    const sessionsChannel = supabase
      .channel('active_sessions_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'active_sessions' }, (payload) => {
        if (payload.eventType === 'INSERT') {
          const s = payload.new as OccupiedSpot & { is_parked: boolean };
          if (s.is_parked) setOccupiedSpots((prev) => [...prev, s]);
        }
        if (payload.eventType === 'UPDATE') {
          const s = payload.new as OccupiedSpot & { is_parked: boolean };
          setOccupiedSpots((prev) => {
            const without = prev.filter((o) => o.user_id !== s.user_id);
            return s.is_parked ? [...without, s] : without;
          });
        }
        if (payload.eventType === 'DELETE') {
          setOccupiedSpots((prev) =>
            prev.filter((o) => o.user_id !== (payload.old as OccupiedSpot).user_id)
          );
        }
      })
      .subscribe();

    const expireInterval = setInterval(() => {
      setSpots((prev) => prev.filter((s) => new Date(s.expires_at) > new Date()));
    }, 60_000);

    return () => {
      supabase.removeChannel(spotsChannel);
      supabase.removeChannel(sessionsChannel);
      clearInterval(expireInterval);
    };
  }, []);

  return { spots, occupiedSpots };
}
