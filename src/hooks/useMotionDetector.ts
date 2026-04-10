'use client';
import { useEffect, useRef, useState } from 'react';
import type { GPSPosition, TrackingState } from '@/types';
import { UNPARK_SPEED_THRESHOLD_MPH } from '@/lib/constants';

const MS_TO_MPH = 2.237;

function haversineMeters(a: GPSPosition, b: GPSPosition): number {
  const R = 6371000;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const x =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((a.lat * Math.PI) / 180) *
      Math.cos((b.lat * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x));
}

function getSpeedMph(position: GPSPosition, prev: GPSPosition | null): number {
  if (position.speed !== null && position.speed !== undefined) {
    return position.speed * MS_TO_MPH;
  }
  if (prev) {
    const dist = haversineMeters(prev, position);
    const dtSeconds = (position.timestamp - prev.timestamp) / 1000;
    return dtSeconds > 0 ? (dist / dtSeconds) * MS_TO_MPH : 0;
  }
  return 0;
}

export function useMotionDetector(position: GPSPosition | null) {
  const [trackingState, setTrackingState] = useState<TrackingState>('idle');
  const prevPositionRef = useRef<GPSPosition | null>(null);
  const parkedLocationRef = useRef<{ lat: number; lng: number } | null>(null);
  const onUnparkedRef = useRef<((lat: number, lng: number) => void) | null>(null);
  // Called on every position update with current speed and parked state
  const onPositionRef = useRef<((lat: number, lng: number, isParked: boolean) => void) | null>(null);

  useEffect(() => {
    if (!position) return;

    const speedMph = getSpeedMph(position, prevPositionRef.current);
    const isMoving = speedMph > UNPARK_SPEED_THRESHOLD_MPH;
    // Speed = 0 means parked immediately
    const isStopped = speedMph === 0;

    if (isStopped && trackingState !== 'parked') {
      setTrackingState('parked');
      parkedLocationRef.current = { lat: position.lat, lng: position.lng };
    }

    if (isMoving && trackingState === 'parked' && parkedLocationRef.current) {
      setTrackingState('tracking');
      onUnparkedRef.current?.(parkedLocationRef.current.lat, parkedLocationRef.current.lng);
      parkedLocationRef.current = null;
    }

    if (!isStopped && !isMoving && trackingState === 'parked') {
      // Slow movement (e.g. 2-5 mph) — still treat as moving away from parked
      setTrackingState('tracking');
      if (parkedLocationRef.current) {
        onUnparkedRef.current?.(parkedLocationRef.current.lat, parkedLocationRef.current.lng);
        parkedLocationRef.current = null;
      }
    }

    // Broadcast live position
    const parked = isStopped || trackingState === 'parked';
    onPositionRef.current?.(position.lat, position.lng, parked);

    prevPositionRef.current = position;
  }, [position, trackingState]);

  return { trackingState, setTrackingState, onUnparkedRef, onPositionRef };
}
