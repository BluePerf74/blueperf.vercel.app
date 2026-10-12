/* Service worker Blueperf.
   - Notifications push.
   - Installabilité (PWA) + repli hors ligne : on NE met PAS en cache les données ni le code de
     l'app (pour ne jamais servir de contenu périmé). On met seulement en cache une page « hors
     ligne » et les icônes. Les pages sont servies réseau d'abord ; en cas de coupure, on affiche
     la page hors ligne au lieu de l'erreur du navigateur. */
const CACHE = 'blueperf-shell-v1';
const PRECACHE = ['/offline.html', '/icons/icon-192.png', '/icons/icon-512.png', '/icons/apple-touch-icon.png'];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(PRECACHE)).catch(() => {}).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);

  // Navigation (ouverture d'une page) : réseau d'abord, repli hors ligne si coupure.
  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req).catch(() => caches.match('/offline.html', { ignoreSearch: true }))
    );
    return;
  }

  // Icônes (statiques) : cache d'abord, mise à jour en arrière-plan. Reste du trafic : non intercepté.
  if (url.origin === self.location.origin && url.pathname.startsWith('/icons/')) {
    event.respondWith(
      caches.match(req).then((hit) => hit || fetch(req).then((res) => {
        const copy = res.clone();
        caches.open(CACHE).then((c) => c.put(req, copy)).catch(() => {});
        return res;
      }).catch(() => hit))
    );
  }
});

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
