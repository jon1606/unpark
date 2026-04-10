'use client';
import { useState, useEffect, useRef } from 'react';
import { useGeolocation } from '@/hooks/useGeolocation';
import { useMotionDetector } from '@/hooks/useMotionDetector';
import { useActiveSession } from '@/hooks/useActiveSession';
import NavBar from '@/components/NavBar';
import { Navigation, Car, MapPin, X } from 'lucide-react';
import type { TrackingState } from '@/types';

const PERMISSION_KEY = 'unpark-tracking-granted';

const STATE_LABEL: Record<TrackingState, string> = {
  idle: 'Starting...',
  tracking: 'Tracking movement',
  parked: 'You\'re parked',
  unparking: 'Leaving spot...',
};

const STATE_COLOR: Record<TrackingState, string> = {
  idle: 'text-zinc-400',
  tracking: 'text-blue-400',
  parked: 'text-green-400',
  unparking: 'text-yellow-400',
};

const STATE_BG: Record<TrackingState, string> = {
  idle: 'bg-zinc-700',
  tracking: 'bg-blue-500/20 border border-blue-500/40',
  parked: 'bg-green-500/20 border border-green-500/40',
  unparking: 'bg-yellow-500/20 border border-yellow-500/40',
};

function TrackingIcon({ state }: { state: TrackingState }) {
  if (state === 'parked') return <Car size={56} className="text-green-400" />;
  if (state === 'unparking') return <MapPin size={56} className="text-yellow-400" />;
  return <Navigation size={56} className={`text-blue-400 ${state === 'tracking' ? 'animate-pulse' : ''}`} />;
}

export default function TrackPage() {
  const [isTracking, setIsTracking] = useState(false);
  const [hasPermission, setHasPermission] = useState(false);
  const [sharedCount, setSharedCount] = useState(0);
  const { position, error } = useGeolocation(isTracking);
  const { trackingState, setTrackingState, onUnparkedRef, onPositionRef } = useMotionDetector(
    isTracking ? position : null
  );
  const { reportPosition } = useActiveSession(isTracking);
  const prevTrackingState = useRef(trackingState);

  // Auto-start if permission was previously granted
  useEffect(() => {
    const granted = localStorage.getItem(PERMISSION_KEY) === 'true';
    if (granted) {
      setHasPermission(true);
      setIsTracking(true);
    }
  }, []);

  // Count shared spots
  useEffect(() => {
    if (prevTrackingState.current === 'parked' && trackingState === 'tracking') {
      setSharedCount((c) => c + 1);
    }
    prevTrackingState.current = trackingState;
  }, [trackingState]);

  // Broadcast live position to active_sessions
  useEffect(() => {
    onPositionRef.current = (lat, lng, isParked) => {
      reportPosition(lat, lng, isParked);
    };
  }, [onPositionRef, reportPosition]);

  // Wire unpark event to API
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

  const handleStart = () => {
    localStorage.setItem(PERMISSION_KEY, 'true');
    setHasPermission(true);
    setIsTracking(true);
  };

  const handleStop = () => {
    localStorage.removeItem(PERMISSION_KEY);
    setIsTracking(false);
    setHasPermission(false);
    setTrackingState('idle');
  };

  // TRACKING ACTIVE state — minimal UI, only a stop option
  if (isTracking) {
    const state = trackingState === 'idle' ? 'tracking' : trackingState;
    return (
      <main className="flex flex-col h-screen bg-zinc-950 text-white">
        <div className="flex-1 flex flex-col items-center justify-center gap-6 px-6 pb-20">
          {/* Big status icon */}
          <div className={`w-44 h-44 rounded-full flex items-center justify-center ${STATE_BG[state]}`}>
            <TrackingIcon state={state} />
          </div>

          {/* Status text */}
          <div className="text-center">
            <p className={`text-2xl font-bold ${STATE_COLOR[state]}`}>
              {STATE_LABEL[state]}
            </p>
            {state === 'parked' && (
              <p className="text-zinc-400 text-sm mt-1">
                We&apos;ll share your spot when you drive away
              </p>
            )}
            {state === 'tracking' && (
              <p className="text-zinc-400 text-sm mt-1">
                Watching for when you park
              </p>
            )}
          </div>

          {/* GPS coords */}
          {position && (
            <p className="text-zinc-600 text-xs">
              {position.lat.toFixed(4)}, {position.lng.toFixed(4)}
              {position.speed !== null && ` · ${(position.speed * 2.237).toFixed(1)} mph`}
            </p>
          )}

          {/* GPS error */}
          {error && (
            <p className="text-red-400 text-sm bg-red-900/20 px-3 py-2 rounded-lg">{error}</p>
          )}

          {/* Shared count */}
          {sharedCount > 0 && (
            <div className="bg-green-500/10 border border-green-500/30 rounded-xl px-5 py-3 text-center">
              <p className="text-green-400 font-semibold">{sharedCount} spot{sharedCount > 1 ? 's' : ''} shared today</p>
            </div>
          )}

          {/* Stop tracking — secondary, subtle */}
          <button
            onClick={handleStop}
            className="mt-4 flex items-center gap-2 text-zinc-500 hover:text-red-400 text-sm transition-colors"
          >
            <X size={14} />
            Stop tracking
          </button>
        </div>
        <NavBar />
      </main>
    );
  }

  // FIRST TIME / NOT TRACKING — ask for permission once
  return (
    <main className="flex flex-col h-screen bg-zinc-950 text-white">
      <div className="flex-1 flex flex-col items-center justify-center gap-8 px-6 pb-20">
        <div className="text-center">
          <div className="w-20 h-20 rounded-full bg-blue-500/20 border border-blue-500/40 flex items-center justify-center mx-auto mb-4">
            <Navigation size={36} className="text-blue-400" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">Share your spot</h1>
          <p className="text-zinc-400 text-sm leading-relaxed max-w-xs">
            UnPark uses your location to automatically detect when you leave a parking spot and share it with nearby drivers.
          </p>
        </div>

        <div className="w-full max-w-xs space-y-3 text-sm text-zinc-400">
          {[
            { icon: '📍', text: 'Detects when you park or unpark' },
            { icon: '📡', text: 'Shares vacated spots in real time' },
            { icon: '🔒', text: 'Location is never stored permanently' },
          ].map(({ icon, text }) => (
            <div key={text} className="flex items-center gap-3">
              <span className="text-lg">{icon}</span>
              <span>{text}</span>
            </div>
          ))}
        </div>

        <button
          onClick={handleStart}
          className="w-full max-w-xs bg-blue-500 hover:bg-blue-400 active:bg-blue-600 text-white font-bold text-lg py-4 rounded-2xl shadow-lg shadow-blue-500/30 transition-colors"
        >
          Enable tracking
        </button>

        <p className="text-zinc-600 text-xs text-center">
          Your browser will ask to access your location. This only runs while you have the app open.
        </p>
      </div>
      <NavBar />
    </main>
  );
}
