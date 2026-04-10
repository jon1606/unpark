'use client';
import { useEffect, useState, useRef } from 'react';
import { getSupabaseClient } from '@/lib/supabase/client';
import type { ParkingSpot } from '@/types';

// Generate mock spots scattered around a center point
function generateMockSpots(centerLat: number, centerLng: number): ParkingSpot[] {
  const now = Date.now();
  // Offsets in degrees (~100–500m radius)
  const offsets = [
    [0.0014, 0.0008],
    [-0.0009, 0.0018],
    [0.0021, -0.0012],
    [-0.0016, -0.0005],
    [0.0005, 0.0025],
    [-0.0022, 0.0014],
    [0.0018, 0.0019],
  ];
  const minutesAgo = [2, 5, 1, 8, 3, 11, 6];

  return offsets.map(([dlat, dlng], i) => {
    const vacatedAt = new Date(now - minutesAgo[i] * 60 * 1000);
    const expiresAt = new Date(vacatedAt.getTime() + 15 * 60 * 1000);
    return {
      id: `mock-${i}`,
      lat: centerLat + dlat,
      lng: centerLng + dlng,
      vacated_at: vacatedAt.toISOString(),
      expires_at: expiresAt.toISOString(),
      is_available: true,
    };
  });
}

export function useParkingSpots(userLat: number | null, userLng: number | null) {
  const [realSpots, setRealSpots] = useState<ParkingSpot[]>([]);
  const [mockSpots, setMockSpots] = useState<ParkingSpot[]>([]);
  const mockGeneratedRef = useRef(false);

  // Generate mock spots once — use user location if available, else NYC default
  useEffect(() => {
    if (!mockGeneratedRef.current) {
      mockGeneratedRef.current = true;
      const lat = userLat ?? 40.7484;
      const lng = userLng ?? -73.9857;
      setMockSpots(generateMockSpots(lat, lng));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Fetch real spots from Supabase
  useEffect(() => {
    const supabase = getSupabaseClient();
    supabase
      .from('parking_spots')
      .select('id, lat, lng, vacated_at, expires_at, is_available')
      .eq('is_available', true)
      .gt('expires_at', new Date().toISOString())
      .then(({ data }) => {
        if (data) setRealSpots(data as ParkingSpot[]);
      });
  }, []);

  // Realtime subscription for real spots
  useEffect(() => {
    const supabase = getSupabaseClient();
    const channel = supabase
      .channel('parking_spots_changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'parking_spots' },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setRealSpots((prev) => [...prev, payload.new as ParkingSpot]);
          }
          if (payload.eventType === 'UPDATE') {
            setRealSpots((prev) =>
              prev
                .map((s) => (s.id === payload.new.id ? (payload.new as ParkingSpot) : s))
                .filter((s) => s.is_available)
            );
          }
          if (payload.eventType === 'DELETE') {
            setRealSpots((prev) => prev.filter((s) => s.id !== (payload.old as ParkingSpot).id));
          }
        }
      )
      .subscribe();

    const expireInterval = setInterval(() => {
      const now = new Date();
      setRealSpots((prev) => prev.filter((s) => new Date(s.expires_at) > now));
      setMockSpots((prev) => prev.filter((s) => new Date(s.expires_at) > now));
    }, 60_000);

    return () => {
      supabase.removeChannel(channel);
      clearInterval(expireInterval);
    };
  }, []);

  const spots = [...realSpots, ...mockSpots];
  return { spots };
}
