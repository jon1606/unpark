'use client';
import { useEffect, useRef, useState } from 'react';
import type { GPSPosition, TrackingState } from '@/types';
import {
  PARKING_SPEED_THRESHOLD_MPH,
  UNPARK_SPEED_THRESHOLD_MPH,
  STOPPED_DURATION_BEFORE_PARK_MS,
} from '@/lib/constants';

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

export function useMotionDetector(position: GPSPosition | null) {
  const [trackingState, setTrackingState] = useState<TrackingState>('idle');
  const prevPositionRef = useRef<GPSPosition | null>(null);
  const stoppedSinceRef = useRef<number | null>(null);
  const parkedLocationRef = useRef<{ lat: number; lng: number } | null>(null);
  const onUnparkedRef = useRef<((lat: number, lng: number) => void) | null>(null);

  useEffect(() => {
    if (!position) return;

    let speedMph: number;
    if (position.speed !== null && position.speed !== undefined) {
      speedMph = position.speed * MS_TO_MPH;
    } else if (prevPositionRef.current) {
      const dist = haversineMeters(prevPositionRef.current, position);
      const dtSeconds = (position.timestamp - prevPositionRef.current.timestamp) / 1000;
      speedMph = dtSeconds > 0 ? (dist / dtSeconds) * MS_TO_MPH : 0;
    } else {
      prevPositionRef.current = position;
      return;
    }

    const isStopped = speedMph < PARKING_SPEED_THRESHOLD_MPH;
    const isMoving = speedMph > UNPARK_SPEED_THRESHOLD_MPH;

    if (isStopped) {
      if (stoppedSinceRef.current === null) {
        stoppedSinceRef.current = position.timestamp;
      }
      const stoppedDuration = position.timestamp - stoppedSinceRef.current;
      if (stoppedDuration >= STOPPED_DURATION_BEFORE_PARK_MS && trackingState !== 'parked') {
        setTrackingState('parked');
        parkedLocationRef.current = { lat: position.lat, lng: position.lng };
      }
    } else {
      stoppedSinceRef.current = null;
    }

    if (isMoving && trackingState === 'parked' && parkedLocationRef.current) {
      setTrackingState('tracking');
      onUnparkedRef.current?.(parkedLocationRef.current.lat, parkedLocationRef.current.lng);
      parkedLocationRef.current = null;
    }

    prevPositionRef.current = position;
  }, [position, trackingState]);

  return { trackingState, setTrackingState, onUnparkedRef };
}
