'use client';

import { useState, useEffect } from 'react';
import { Bell, BellOff, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useAuth } from '@/context/AuthContext';

export function PushNotificationSetup() {
  const { isAuthenticated } = useAuth();
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [isSubscribed, setIsSubscribed] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setPermission(Notification.permission);
    }
    checkSubscription();
  }, []);

  async function checkSubscription() {
    if (!('serviceWorker' in navigator)) return;
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      setIsSubscribed(!!sub);
    } catch {
      // Push not supported
    }
  }

  async function requestPermission() {
    if (!('Notification' in window)) {
      alert('This browser does not support notifications');
      return;
    }

    const result = await Notification.requestPermission();
    setPermission(result);

    if (result === 'granted') {
      await subscribeToPush();
    }
  }

  async function subscribeToPush() {
    try {
      const reg = await navigator.serviceWorker.ready;

      // For demo: use a dummy VAPID key
      // In production, generate real VAPID keys and store on backend
      const subscription = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(
          'BEl62iUYgUivxIkv69yViEuiBIa-Ib9-SkvMeAtA3LFgDzkrxZJjSgSnfckjBJuBkr' +
            'oHBiMjOqE3lFYlk1eMDQ'
        ),
      });

      setIsSubscribed(true);
      console.log('Push subscription:', JSON.stringify(subscription));

      // TODO: Send subscription to backend to store for sending notifications
      // await api.post('/notifications/subscribe', { subscription: subscription.toJSON() });
    } catch (error) {
      console.error('Failed to subscribe to push:', error);
    }
  }

  if (!isAuthenticated) return null;
  if (permission === 'granted' && isSubscribed) return null;

  return null; // Render nothing — notifications are requested via settings
}

// Utility for VAPID key conversion
function urlBase64ToUint8Array(base64String: string): ArrayBuffer {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray.buffer.slice(0) as ArrayBuffer;
}

// Export for use in settings page
export async function requestNotificationPermission(): Promise<boolean> {
  if (!('Notification' in window)) return false;
  const result = await Notification.requestPermission();
  return result === 'granted';
}

export function getNotificationPermission(): NotificationPermission {
  if (typeof window === 'undefined' || !('Notification' in window)) return 'default';
  return Notification.permission;
}