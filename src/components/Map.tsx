'use client';
import { useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useParkingSpots } from '@/hooks/useParkingSpots';
import { MAP_DEFAULT_ZOOM } from '@/lib/constants';

delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// Blue P = available spot
const availableIcon = L.divIcon({
  html: `<div style="background:#3b82f6;color:white;width:36px;height:36px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:18px;font-weight:bold;border:3px solid white;box-shadow:0 2px 12px rgba(59,130,246,0.6)">P</div>`,
  className: '',
  iconSize: [36, 36],
  iconAnchor: [18, 18],
});

// Grey car = occupied spot (someone parked here)
const occupiedIcon = L.divIcon({
  html: `<div style="background:#52525b;color:#d4d4d8;width:34px;height:34px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:16px;border:2px solid #71717a;box-shadow:0 2px 8px rgba(0,0,0,0.4)">🚗</div>`,
  className: '',
  iconSize: [34, 34],
  iconAnchor: [17, 17],
});

// Blue dot = my location
const userIcon = L.divIcon({
  html: `<div style="width:16px;height:16px;border-radius:50%;background:#3b82f6;border:3px solid white;box-shadow:0 0 0 4px rgba(59,130,246,0.3)"></div>`,
  className: '',
  iconSize: [16, 16],
  iconAnchor: [8, 8],
});

function InitialCenter({ lat, lng }: { lat: number; lng: number }) {
  const map = useMap();
  const doneRef = useRef(false);
  useEffect(() => {
    if (!doneRef.current) {
      doneRef.current = true;
      map.setView([lat, lng], MAP_DEFAULT_ZOOM);
    }
  }, [lat, lng, map]);
  return null;
}

interface MapProps {
  userLat: number | null;
  userLng: number | null;
}

export default function Map({ userLat, userLng }: MapProps) {
  const { spots, occupiedSpots } = useParkingSpots();
  const defaultLat = userLat ?? 40.7484;
  const defaultLng = userLng ?? -73.9857;

  const availableCount = spots.length;
  const occupiedCount = occupiedSpots.length;

  return (
    <div style={{ position: 'relative', width: '100%', height: '100dvh' }}>
      <MapContainer
        center={[defaultLat, defaultLng]}
        zoom={MAP_DEFAULT_ZOOM}
        style={{ width: '100%', height: '100dvh' }}
        zoomControl={false}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {userLat && userLng && <InitialCenter lat={userLat} lng={userLng} />}

        {/* My location */}
        {userLat && userLng && (
          <Marker position={[userLat, userLng]} icon={userIcon} />
        )}

        {/* Available spots (blue P) */}
        {spots.map((spot) => {
          const minutesLeft = Math.max(
            0,
            Math.round((new Date(spot.expires_at).getTime() - Date.now()) / 60000)
          );
          return (
            <Marker key={spot.id} position={[spot.lat, spot.lng]} icon={availableIcon}>
              <Popup>
                <div style={{ textAlign: 'center', minWidth: '130px' }}>
                  <p style={{ fontWeight: 'bold', marginBottom: '4px' }}>🅿 Spot available</p>
                  <p style={{ color: '#6b7280', fontSize: '13px' }}>Expires in ~{minutesLeft}m</p>
                </div>
              </Popup>
            </Marker>
          );
        })}

        {/* Occupied spots (grey car) */}
        {occupiedSpots.map((session) => (
          <Marker
            key={session.user_id}
            position={[session.lat, session.lng]}
            icon={occupiedIcon}
          >
            <Popup>
              <div style={{ textAlign: 'center', minWidth: '130px' }}>
                <p style={{ fontWeight: 'bold', marginBottom: '4px' }}>🚗 Spot taken</p>
                <p style={{ color: '#6b7280', fontSize: '13px' }}>Someone is parked here</p>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>

      {/* Legend badge */}
      {(availableCount > 0 || occupiedCount > 0) && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[1000] bg-white text-zinc-800 text-sm px-4 py-2 rounded-full shadow-lg border border-zinc-200 pointer-events-none flex items-center gap-3">
          {availableCount > 0 && (
            <span><span className="font-bold text-blue-500">{availableCount}</span> free</span>
          )}
          {availableCount > 0 && occupiedCount > 0 && <span className="text-zinc-300">·</span>}
          {occupiedCount > 0 && (
            <span><span className="font-bold text-zinc-500">{occupiedCount}</span> taken</span>
          )}
        </div>
      )}
    </div>
  );
}
