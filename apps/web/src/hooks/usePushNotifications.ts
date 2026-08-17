'use client';

import { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api/client';

interface PushState {
  isSupported: boolean;
  isSubscribed: boolean;
  permission: NotificationPermission;
  isLoading: boolean;
}

/**
 * Converts base64 VAPID public key to Uint8Array (required by browser)
 */
function urlBase64ToUint8Array(base64String: string): BufferSource {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export function usePushNotifications() {
  const [state, setState] = useState<PushState>({
    isSupported: false,
    isSubscribed: false,
    permission: 'default',
    isLoading: true,
  });

  // Check current subscription status
  const checkStatus = useCallback(async () => {
    if (typeof window === 'undefined') return;

    const isSupported =
      'serviceWorker' in navigator &&
      'PushManager' in window &&
      'Notification' in window;

    if (!isSupported) {
      setState({
        isSupported: false,
        isSubscribed: false,
        permission: 'denied',
        isLoading: false,
      });
      return;
    }

    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();

      setState({
        isSupported: true,
        isSubscribed: !!subscription,
        permission: Notification.permission,
        isLoading: false,
      });
    } catch (err) {
      console.error('Push status check failed:', err);
      setState({
        isSupported: true,
        isSubscribed: false,
        permission: Notification.permission,
        isLoading: false,
      });
    }
  }, []);

  // Register service worker on mount + check status
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!('serviceWorker' in navigator)) return;

    navigator.serviceWorker
      .register('/sw.js')
      .then(() => {
        console.log('[Push] Service worker registered');
        checkStatus();
      })
      .catch((err) => {
        console.error('[Push] Service worker registration failed:', err);
        setState((s) => ({ ...s, isLoading: false }));
      });
  }, [checkStatus]);

  // Subscribe to push notifications
  const subscribe = useCallback(async (): Promise<boolean> => {
    const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
    if (!vapidKey) {
      console.error('[Push] VAPID public key not configured');
      return false;
    }

    try {
      // 1. Request permission
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        setState((s) => ({ ...s, permission }));
        return false;
      }

      // 2. Get service worker registration
      const registration = await navigator.serviceWorker.ready;

      // 3. Subscribe with VAPID key
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidKey),
      });

      // 4. Send subscription to backend
      const subscriptionJson = subscription.toJSON();
      await api.post('/push/subscribe', {
        endpoint: subscriptionJson.endpoint,
        keys: subscriptionJson.keys,
      });

      setState({
        isSupported: true,
        isSubscribed: true,
        permission: 'granted',
        isLoading: false,
      });

      return true;
    } catch (err) {
      console.error('[Push] Subscribe failed:', err);
      return false;
    }
  }, []);

  // Unsubscribe from push notifications
  const unsubscribe = useCallback(async (): Promise<boolean> => {
    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();

      if (subscription) {
        const endpoint = subscription.endpoint;
        await subscription.unsubscribe();
        await api.post('/push/unsubscribe', { endpoint });
      }

      setState((s) => ({ ...s, isSubscribed: false }));
      return true;
    } catch (err) {
      console.error('[Push] Unsubscribe failed:', err);
      return false;
    }
  }, []);

  // Send a test notification (for debugging)
  const sendTest = useCallback(async (): Promise<boolean> => {
    try {
      await api.post('/push/test', {});
      return true;
    } catch (err) {
      console.error('[Push] Test failed:', err);
      return false;
    }
  }, []);

  return {
    ...state,
    subscribe,
    unsubscribe,
    sendTest,
    refresh: checkStatus,
  };
}