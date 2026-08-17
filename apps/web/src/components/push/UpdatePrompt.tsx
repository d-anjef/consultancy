'use client';

import { useServiceWorkerAutoUpdate } from '@/hooks/useServiceWorkerUpdate';

/**
 * Silent auto-updater. No UI — just checks and applies updates in background.
 * Add this to your root layouts once.
 */
export function AutoUpdater() {
  useServiceWorkerAutoUpdate();
  return null; // No UI needed
}