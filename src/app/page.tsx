'use client';
import dynamic from 'next/dynamic';
import { useGeolocation } from '@/hooks/useGeolocation';
import NavBar from '@/components/NavBar';
import InstallPrompt from '@/components/InstallPrompt';

const Map = dynamic(() => import('@/components/Map'), {
  ssr: false,
  loading: () => (
    <div style={{ width: '100%', height: '100dvh' }} className="flex items-center justify-center bg-zinc-800">
      <div className="text-zinc-400 text-sm">Loading map...</div>
    </div>
  ),
});

export default function HomePage() {
  const { position } = useGeolocation(true);

  return (
    <main style={{ position: 'relative', width: '100%', height: '100dvh', overflow: 'hidden' }}>
      <Map userLat={position?.lat ?? null} userLng={position?.lng ?? null} />
      <InstallPrompt />
      <NavBar />
    </main>
  );
}
