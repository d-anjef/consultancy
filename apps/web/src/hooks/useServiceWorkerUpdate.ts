'use client';

import { useEffect } from 'react';

const UPDATE_CHECK_INTERVAL_MS = 5 * 60 * 1000; // Check every 5 minutes
const APPLY_UPDATE_DELAY_MS = 30 * 1000; // Wait 30s before auto-reload

/**
 * Fully automatic service worker updater.
 * - Checks for updates every 5 minutes
 * - When update found, waits 30 seconds then auto-reloads
 * - No user interaction required
 */
export function useServiceWorkerAutoUpdate() {
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!('serviceWorker' in navigator)) return;

    let intervalId: NodeJS.Timeout;
    let refreshing = false;

    navigator.serviceWorker.ready.then((reg) => {
      // Listen for new service worker installations
      reg.addEventListener('updatefound', () => {
        const newWorker = reg.installing;
        if (!newWorker) return;

        newWorker.addEventListener('statechange', () => {
          if (
            newWorker.state === 'installed' &&
            navigator.serviceWorker.controller
          ) {
            console.log('[SW Auto-Update] New version detected, applying in 30s...');

            // Wait 30 seconds so user can finish current action
            setTimeout(() => {
              console.log('[SW Auto-Update] Applying update now');
              newWorker.postMessage({ type: 'SKIP_WAITING' });
            }, APPLY_UPDATE_DELAY_MS);
          }
        });
      });

      // Check immediately on load
      reg.update().catch((err) => {
        console.warn('[SW Auto-Update] Initial check failed:', err);
      });

      // Check every 5 minutes
      intervalId = setInterval(() => {
        console.log('[SW Auto-Update] Checking for updates...');
        reg.update().catch((err) => {
          console.warn('[SW Auto-Update] Check failed:', err);
        });
      }, UPDATE_CHECK_INTERVAL_MS);
    });

    // When new SW takes control, reload page automatically
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (refreshing) return;
      refreshing = true;
      console.log('[SW Auto-Update] Reloading page with new version...');
      window.location.reload();
    });

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, []);
}