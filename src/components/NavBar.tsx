'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { MapPin, Navigation } from 'lucide-react';

export default function NavBar() {
  const pathname = usePathname();
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-zinc-900 border-t border-zinc-700 flex z-50">
      <Link
        href="/"
        className={`flex-1 flex flex-col items-center gap-1 py-3 text-xs font-medium transition-colors ${
          pathname === '/' ? 'text-blue-400' : 'text-zinc-400 hover:text-white'
        }`}
      >
        <MapPin size={22} />
        Map
      </Link>
      <Link
        href="/track"
        className={`flex-1 flex flex-col items-center gap-1 py-3 text-xs font-medium transition-colors ${
          pathname === '/track' ? 'text-blue-400' : 'text-zinc-400 hover:text-white'
        }`}
      >
        <Navigation size={22} />
        Track
      </Link>
    </nav>
  );
}
