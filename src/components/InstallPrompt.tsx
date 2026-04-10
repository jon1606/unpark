'use client';
import { usePWAInstall } from '@/hooks/usePWAInstall';
import { Download } from 'lucide-react';

export default function InstallPrompt() {
  const { canInstall, install } = usePWAInstall();

  if (!canInstall) return null;

  return (
    <div className="fixed top-4 left-4 right-4 z-50 bg-blue-600 text-white rounded-xl px-4 py-3 flex items-center gap-3 shadow-lg">
      <Download size={20} className="shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-sm">Install UnPark</p>
        <p className="text-xs text-blue-100">Get the best experience on your phone</p>
      </div>
      <button
        onClick={install}
        className="shrink-0 bg-white text-blue-600 font-semibold text-sm px-3 py-1.5 rounded-lg"
      >
        Install
      </button>
    </div>
  );
}
