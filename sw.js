/* Service worker Blueperf — uniquement les notifications push (aucune mise en cache). */
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (e) => e.waitUntil(self.clients.claim()));

self.addEventListener('push', (event) => {
  let d = {};
  try { d = event.data ? event.data.json() : {}; }
  catch (_) { d = { title: 'Blueperf', body: event.data ? event.data.text() : '' }; }
  const title = d.title || 'Blueperf';
  const opts = {
    body: d.body || '',
    icon: '/icons/icon-192.png',
    badge: '/icons/icon-192.png',
    vibrate: [80, 40, 80],
    data: { url: d.url || '/academie/espace.html' },
    tag: 'blueperf-rappel',
    renotify: true
  };
  event.waitUntil(self.registration.showNotification(title, opts));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = (event.notification.data && event.notification.data.url) || '/academie/espace.html';
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((list) => {
      for (const c of list) { if (c.url.includes('espace') && 'focus' in c) return c.focus(); }
      return self.clients.openWindow(url);
    })
  );
});
