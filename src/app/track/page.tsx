'use client';
import { useState, useEffect } from 'react';
import { useGeolocation } from '@/hooks/useGeolocation';
import { useMotionDetector } from '@/hooks/useMotionDetector';
import TrackingPanel from '@/components/TrackingPanel';
import NavBar from '@/components/NavBar';

export default function TrackPage() {
  const [isTracking, setIsTracking] = useState(false);
  const { position, error } = useGeolocation(isTracking);
  const { trackingState, setTrackingState, onUnparkedRef } = useMotionDetector(
    isTracking ? position : null
  );

  useEffect(() => {
    onUnparkedRef.current = async (lat: number, lng: number) => {
      try {
        await fetch('/api/spots', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ lat, lng }),
        });
      } catch (err) {
        console.error('Failed to report spot:', err);
      }
    };
  }, [onUnparkedRef]);

  const handleToggle = () => {
    if (isTracking) {
      setTrackingState('idle');
    }
    setIsTracking((v) => !v);
  };

  return (
    <main className="flex flex-col h-screen bg-zinc-900 text-white">
      <TrackingPanel
        isTracking={isTracking}
        trackingState={isTracking ? trackingState : 'idle'}
        position={position}
        gpsError={error}
        onToggle={handleToggle}
      />
      <NavBar />
    </main>
  );
}
