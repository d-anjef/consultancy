'use client';

import { useState, useEffect } from 'react';
import { usePushNotifications } from '@/hooks/usePushNotifications';
import { Button } from '@/components/ui/button';
import { Bell, X } from 'lucide-react';
import { toast } from 'sonner';

const DISMISS_KEY = 'push-permission-dismissed';
const DISMISS_DURATION_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

export function PushPermissionBanner() {
  const { isSupported, isSubscribed, permission, subscribe, isLoading } = usePushNotifications();
  const [dismissed, setDismissed] = useState(true); // Start hidden to avoid flash

  useEffect(() => {
    // Check if user previously dismissed
    if (typeof window === 'undefined') return;
    const dismissedAt = localStorage.getItem(DISMISS_KEY);
    if (dismissedAt) {
      const age = Date.now() - parseInt(dismissedAt, 10);
      if (age < DISMISS_DURATION_MS) {
        setDismissed(true);
        return;
      }
    }
    setDismissed(false);
  }, []);

  // Don't show if:
  // - Not supported
  // - Already subscribed
  // - Permission denied (browser blocked)
  // - Dismissed by user
  // - Still loading
  if (isLoading || !isSupported || isSubscribed || permission === 'denied' || dismissed) {
    return null;
  }

  async function handleEnable() {
    const ok = await subscribe();
    if (ok) {
      toast.success('Push notifications enabled! 🔔');
    } else {
      toast.error('Could not enable notifications. Check browser permissions.');
    }
  }

  function handleDismiss() {
    localStorage.setItem(DISMISS_KEY, Date.now().toString());
    setDismissed(true);
  }

  return (
    <div className="border-b border-yellow-200 bg-yellow-50">
      <div className="max-w-7xl mx-auto px-4 py-2.5 flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2 text-sm">
          <Bell className="w-4 h-4 text-yellow-700 shrink-0" />
          <span className="text-yellow-900">
            <strong>Enable notifications</strong> to get instant updates on your device.
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            onClick={handleEnable}
            className="bg-yellow-400 hover:bg-yellow-500 text-black h-8"
          >
            Enable
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={handleDismiss}
            className="h-8 w-8 p-0"
            aria-label="Dismiss"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}