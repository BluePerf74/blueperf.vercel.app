/* Service worker Elite Adapt.
   - Notifications push.
   - Mode HORS-LIGNE (PWA) : l'application s'ouvre et fonctionne sans connexion.
     On met en cache la « coquille » (pages HTML + code JS/CSS + icônes/polices) pour
     pouvoir afficher l'app même sans réseau. Les données (ce que saisit le client) sont
     gérées côté page : enregistrées localement (localStorage) puis synchronisées avec le
     serveur dès le retour de la connexion. Les appels /api/* ne sont JAMAIS mis en cache
     (sinon on servirait des données périmées) — c'est la page qui garde la dernière copie.

   Stratégies :
   - Navigation (ouverture d'une page) : réseau d'abord → on garde une copie en cache →
     en cas de coupure on ressert la dernière page mise en cache (ou la page hors-ligne).
   - Fichiers statiques (code, styles, images, polices) : « stale-while-revalidate » —
     on sert le cache tout de suite (rapide + hors-ligne) ET on rafraîchit en arrière-plan,
     donc le rechargement suivant a la version à jour.
   - /api/* : jamais touché (toujours réseau direct). */
const CACHE = 'elite-adapt-shell-v5';
const PRECACHE = [
  '/offline.html',
  '/',
  '/app.min.js',
  '/academie/espace.html',
  '/academie/apa.html',
  '/academie/individuel.html',
  '/academie/index.html',
  '/academie/foot.html',
  '/academie/nutrition.html',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
  '/icons/apple-touch-icon.png',
  '/elite-adapt-icon.svg',
  '/elite-adapt-mark.svg',
  '/elite-adapt-mark-leaf.svg'
];

self.addEventListener('install', (e) => {
  // On précharge au mieux ; un fichier manquant ne doit pas faire échouer l'installation.
  e.waitUntil(
    caches.open(CACHE).then((c) =>
      Promise.all(PRECACHE.map((u) => c.add(u).catch(() => {})))
    ).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

function isStaticAsset(url) {
  if (url.origin === self.location.origin) {
    return /\.(?:js|css|svg|png|jpg|jpeg|webp|gif|ico|woff2?|ttf|otf|json)$/i.test(url.pathname)
      || url.pathname.startsWith('/icons/')
      || /\/elite-adapt-[a-z]+\.svg$/.test(url.pathname);
  }
  // Polices et feuilles de style Google (externes) : utiles à mettre en cache pour le hors-ligne.
  return /(?:fonts\.googleapis\.com|fonts\.gstatic\.com)$/.test(url.hostname);
}

// Sert le cache tout de suite puis rafraîchit en arrière-plan.
function staleWhileRevalidate(req) {
  return caches.open(CACHE).then((c) =>
    c.match(req, { ignoreSearch: false }).then((hit) => {
      const net = fetch(req).then((res) => {
        // On ne met en cache que les réponses exploitables (ok, ou opaques pour les polices).
        if (res && (res.ok || res.type === 'opaque')) { c.put(req, res.clone()).catch(() => {}); }
        return res;
      }).catch(() => hit);
      return hit || net;
    })
  );
}

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);

  // Données : jamais mises en cache par le service worker (la page gère le hors-ligne).
  if (url.origin === self.location.origin && url.pathname.startsWith('/api/')) return;

  // Navigation (ouverture d'une page) : réseau d'abord, on garde une copie, repli hors-ligne.
  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req).then((res) => {
        if (res && res.ok) {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(req, copy)).catch(() => {});
        }
        return res;
      }).catch(() =>
        caches.match(req, { ignoreSearch: true })
          .then((hit) => hit || caches.match('/offline.html', { ignoreSearch: true }))
      )
    );
    return;
  }

  // Fichiers statiques (code, styles, images, polices) : stale-while-revalidate.
  if (isStaticAsset(url)) {
    event.respondWith(staleWhileRevalidate(req));
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
