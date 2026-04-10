'use client';
import { useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useParkingSpots } from '@/hooks/useParkingSpots';
import { MAP_DEFAULT_ZOOM } from '@/lib/constants';

// Fix default marker icons in Next.js
delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const spotIcon = L.divIcon({
  html: `<div style="background:#3b82f6;color:white;width:36px;height:36px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:18px;font-weight:bold;border:3px solid white;box-shadow:0 2px 12px rgba(59,130,246,0.6)">P</div>`,
  className: '',
  iconSize: [36, 36],
  iconAnchor: [18, 18],
});

const userIcon = L.divIcon({
  html: `<div style="width:16px;height:16px;border-radius:50%;background:#3b82f6;border:3px solid white;box-shadow:0 0 0 4px rgba(59,130,246,0.3)"></div>`,
  className: '',
  iconSize: [16, 16],
  iconAnchor: [8, 8],
});

// Only recenters once on first valid position
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
  const { spots } = useParkingSpots(userLat, userLng);
  const defaultLat = userLat ?? 40.7484;
  const defaultLng = userLng ?? -73.9857;
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

        {/* Recenter once on first user position */}
        {userLat && userLng && <InitialCenter lat={userLat} lng={userLng} />}

        {/* User location dot */}
        {userLat && userLng && (
          <Marker position={[userLat, userLng]} icon={userIcon} />
        )}

        {/* Parking spot markers */}
        {spots.map((spot) => {
          const minutesLeft = Math.max(
            0,
            Math.round((new Date(spot.expires_at).getTime() - Date.now()) / 60000)
          );
          const isMock = spot.id.startsWith('mock-');
          return (
            <Marker
              key={spot.id}
              position={[spot.lat, spot.lng]}
              icon={spotIcon}
            >
              <Popup>
                <div style={{ textAlign: 'center', minWidth: '140px' }}>
                  <p style={{ fontWeight: 'bold', marginBottom: '4px' }}>
                    {isMock ? '🅿 Demo spot' : '🅿 Spot available'}
                  </p>
                  <p style={{ color: '#6b7280', fontSize: '13px' }}>
                    Expires in ~{minutesLeft}m
                  </p>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>

      {/* Spot count badge */}
      {spots.length > 0 && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[1000] bg-white text-zinc-800 font-semibold text-sm px-4 py-2 rounded-full shadow-lg border border-zinc-200 pointer-events-none">
          {spots.length} spot{spots.length !== 1 ? 's' : ''} available nearby
        </div>
      )}

      {/* Bottom nav safe area */}
      <div className="absolute bottom-0 left-0 right-0 h-16 z-[999] pointer-events-none" />
    </div>
  );
}
