export interface ParkingSpot {
  id: string;
  lat: number;
  lng: number;
  vacated_at: string;
  expires_at: string;
  is_available: boolean;
}

export interface GPSPosition {
  lat: number;
  lng: number;
  speed: number | null;
  accuracy: number;
  timestamp: number;
}

export type TrackingState = 'idle' | 'tracking' | 'parked' | 'unparking';
