/* Service worker Elite Adapt.
   - Notifications push.
   - Installabilité (PWA) + repli hors ligne : on NE met PAS en cache les données ni le code de
     l'app (pour ne jamais servir de contenu périmé). On met seulement en cache une page « hors
     ligne » et les icônes. Les pages sont servies réseau d'abord ; en cas de coupure, on affiche
     la page hors ligne au lieu de l'erreur du navigateur. */
const CACHE = 'elite-adapt-shell-v2';
const PRECACHE = ['/offline.html', '/icons/icon-192.png', '/icons/icon-512.png', '/icons/apple-touch-icon.png', '/elite-adapt-icon.svg', '/elite-adapt-mark.svg'];

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

  // Icônes et logos (statiques) : on sert le cache tout de suite MAIS on rafraîchit
  // toujours en arrière-plan (stale-while-revalidate), pour que le logo se mette à
  // jour tout seul au prochain affichage après un changement de marque.
  if (url.origin === self.location.origin && (url.pathname.startsWith('/icons/') || /\/elite-adapt-[a-z]+\.svg$/.test(url.pathname))) {
    event.respondWith(
      caches.open(CACHE).then((c) => c.match(req).then((hit) => {
        const net = fetch(req).then((res) => { c.put(req, res.clone()).catch(() => {}); return res; }).catch(() => hit);
        return hit || net;
      }))
    );
  }
});

self.addEventListener('push', (event) => {
  let d = {};
  try { d = event.data ? event.data.json() : {}; }
  catch (_) { d = { title: 'Elite Adapt', body: event.data ? event.data.text() : '' }; }
  const title = d.title || 'Elite Adapt';
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
