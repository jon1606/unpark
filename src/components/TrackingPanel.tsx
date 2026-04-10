'use client';
import { Navigation, MapPin, Car, AlertCircle } from 'lucide-react';
import type { TrackingState, GPSPosition } from '@/types';

interface TrackingPanelProps {
  isTracking: boolean;
  trackingState: TrackingState;
  position: GPSPosition | null;
  gpsError: string | null;
  onToggle: () => void;
}

const STATE_INFO: Record<TrackingState, { label: string; color: string; icon: React.ReactNode }> = {
  idle: { label: 'Not tracking', color: 'text-zinc-400', icon: <Navigation size={20} /> },
  tracking: { label: 'Tracking movement...', color: 'text-blue-400', icon: <Navigation size={20} className="animate-pulse" /> },
  parked: { label: 'Parked — will alert when you leave', color: 'text-green-400', icon: <Car size={20} /> },
  unparking: { label: 'Leaving spot...', color: 'text-yellow-400', icon: <MapPin size={20} /> },
};

export default function TrackingPanel({
  isTracking,
  trackingState,
  position,
  gpsError,
  onToggle,
}: TrackingPanelProps) {
  const info = STATE_INFO[trackingState];

  return (
    <div className="flex-1 flex flex-col items-center justify-center gap-8 p-6 pb-24">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-white mb-1">UnPark</h1>
        <p className="text-zinc-400 text-sm">Share your spot when you leave</p>
      </div>

      <div className={`flex items-center gap-2 ${info.color}`}>
        {info.icon}
        <span className="text-sm font-medium">{info.label}</span>
      </div>

      {gpsError && (
        <div className="flex items-center gap-2 text-red-400 text-sm bg-red-900/20 px-4 py-2 rounded-lg">
          <AlertCircle size={16} />
          {gpsError}
        </div>
      )}

      {position && isTracking && (
        <div className="text-zinc-500 text-xs text-center">
          {position.lat.toFixed(5)}, {position.lng.toFixed(5)}
          {position.speed !== null && (
            <span className="ml-2">· {(position.speed * 2.237).toFixed(1)} mph</span>
          )}
        </div>
      )}

      <button
        onClick={onToggle}
        className={`w-40 h-40 rounded-full flex flex-col items-center justify-center gap-2 font-bold text-lg shadow-xl transition-all active:scale-95 ${
          isTracking
            ? 'bg-red-500 hover:bg-red-600 text-white'
            : 'bg-blue-500 hover:bg-blue-600 text-white'
        }`}
      >
        <Navigation size={36} />
        {isTracking ? 'Stop' : 'Start'}
      </button>

      <p className="text-zinc-500 text-xs text-center max-w-xs">
        {isTracking
          ? 'When you drive away from a parked spot, UnPark will automatically share it with nearby users.'
          : 'Tap Start to begin sharing your parking activity.'}
      </p>
    </div>
  );
}
