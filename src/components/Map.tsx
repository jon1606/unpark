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
  html: '<div style="background:#3b82f6;color:white;width:32px;height:32px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:16px;border:2px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.4)">P</div>',
  className: '',
  iconSize: [32, 32],
  iconAnchor: [16, 16],
});

function RecenterMap({ lat, lng }: { lat: number; lng: number }) {
  const map = useMap();
  useEffect(() => {
    map.setView([lat, lng], MAP_DEFAULT_ZOOM);
  }, [lat, lng, map]);
  return null;
}

interface MapProps {
  userLat: number | null;
  userLng: number | null;
}

export default function Map({ userLat, userLng }: MapProps) {
  const { spots } = useParkingSpots();
  const defaultLat = userLat ?? 40.7484;
  const defaultLng = userLng ?? -73.9857;

  return (
    <MapContainer
      center={[defaultLat, defaultLng]}
      zoom={MAP_DEFAULT_ZOOM}
      style={{ width: '100%', height: '100%' }}
      zoomControl={false}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {userLat && userLng && <RecenterMap lat={userLat} lng={userLng} />}
      {spots.map((spot) => {
        const minutesLeft = Math.max(
          0,
          Math.round((new Date(spot.expires_at).getTime() - Date.now()) / 60000)
        );
        return (
          <Marker key={spot.id} position={[spot.lat, spot.lng]} icon={spotIcon}>
            <Popup>
              <div className="text-center">
                <p className="font-bold">Spot available</p>
                <p className="text-sm text-gray-500">Expires in ~{minutesLeft}m</p>
              </div>
            </Popup>
          </Marker>
        );
      })}
    </MapContainer>
  );
}
