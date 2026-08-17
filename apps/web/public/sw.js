// Service Worker for Push Notifications
// Version: bump this on every deployment to force update
const SW_VERSION = '1.0.0';
const CACHE_NAME = `chiba-app-v${SW_VERSION}`;

console.log(`[SW] Loading version ${SW_VERSION}`);

self.addEventListener('install', (event) => {
  console.log(`[SW] Installing v${SW_VERSION}`);
  // Take control immediately without waiting
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  console.log(`[SW] Activated v${SW_VERSION}`);
  event.waitUntil(
    // Clean up old caches
    caches.keys().then((cacheNames) =>
      Promise.all(
        cacheNames
          .filter((name) => name.startsWith('chiba-app-') && name !== CACHE_NAME)
          .map((name) => {
            console.log(`[SW] Deleting old cache: ${name}`);
            return caches.delete(name);
          }),
      ),
    ),
  );
  // Take control of all open pages immediately
  event.waitUntil(self.clients.claim());
});

// Listen for messages from the page (e.g., "skip waiting")
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  if (event.data && event.data.type === 'GET_VERSION') {
    event.ports[0]?.postMessage({ version: SW_VERSION });
  }
});

// Receive push notification from server
self.addEventListener('push', (event) => {
  if (!event.data) return;

  let payload;
  try {
    payload = event.data.json();
  } catch {
    payload = { title: 'Notification', body: event.data.text() };
  }

  const {
    title = 'Chiba Education Center',
    body = '',
    icon = '/icon-192.png',
    badge = '/icon-192.png',
    tag,
    data = {},
    requireInteraction = false,
  } = payload;

  const options = {
    body,
    icon,
    badge,
    tag,
    data,
    requireInteraction,
    vibrate: [200, 100, 200],
    timestamp: Date.now(),
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

// Handle notification click
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const targetUrl = event.notification.data?.url || '/notifications';
  const fullUrl = new URL(targetUrl, self.location.origin).href;

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if ('focus' in client) {
          client.focus();
          if ('navigate' in client) {
            client.navigate(fullUrl);
          }
          return;
        }
      }
      if (self.clients.openWindow) {
        return self.clients.openWindow(fullUrl);
      }
    }),
  );
});

self.addEventListener('pushsubscriptionchange', (event) => {
  console.log('[SW] Subscription changed');
});