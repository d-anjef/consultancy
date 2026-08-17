'use client';

import { useState, useEffect } from 'react';
import { X, Share } from 'lucide-react';
import { Button } from '@/components/ui/button';

const DISMISS_KEY = 'ios-install-dismissed';

export function IosInstallPrompt() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Only show on iOS Safari, not installed
    const isIos = /iPad|iPhone|iPod/.test(navigator.userAgent);
    const isStandalone =
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (window.navigator as any).standalone ||
      window.matchMedia('(display-mode: standalone)').matches;
    const dismissed = localStorage.getItem(DISMISS_KEY);

    if (isIos && !isStandalone && !dismissed) {
      setShow(true);
    }
  }, []);

  function handleDismiss() {
    localStorage.setItem(DISMISS_KEY, Date.now().toString());
    setShow(false);
  }

  if (!show) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 bg-white border-2 border-yellow-400 rounded-xl shadow-xl p-4 max-w-md mx-auto">
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1">
          <p className="font-semibold text-gray-900">📱 Install App</p>
          <p className="text-sm text-gray-600 mt-1">
            Tap <Share className="inline w-4 h-4" /> then <strong>&quot;Add to Home Screen&quot;</strong> to enable push notifications.
          </p>
        </div>
        <Button size="icon-sm" variant="ghost" onClick={handleDismiss}>
          <X className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}