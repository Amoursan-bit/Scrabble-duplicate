/* ============================================================
   Service worker : c'est lui qui rend l'appli utilisable hors connexion.
   Principe :
   1. À l'installation, il télécharge tous les fichiers de l'appli
      et les range dans un cache (une mémoire du navigateur).
   2. Ensuite, à chaque demande de fichier, il répond depuis le cache
      sans passer par internet (stratégie "cache d'abord").
   Pour publier une nouvelle version : change le numéro dans CACHE.
   Les téléphones récupèrent alors les nouveaux fichiers.
   ============================================================ */
const CACHE = 'duplicate-v4';
const FICHIERS = [
  './', 'index.html', 'style.css', 'app.js', 'data.js', 'dict.js',
  'pdf.min.js', 'pdf.worker.min.js', 'manifest.webmanifest',
  'icon-192.png', 'icon-512.png'
];

// Installation : on remplit le cache
self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(FICHIERS)));
  self.skipWaiting();
});

// Activation : on supprime les anciens caches
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(noms => Promise.all(noms.filter(n => n !== CACHE && n !== 'duplicate-data').map(n => caches.delete(n))))
      .then(() => self.clients.claim())
  );
});

// Chaque requête : cache d'abord, réseau en secours
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  // parties.json (parties partagées) : réseau d'abord pour avoir les nouveautés, cache en secours
  if (new URL(e.request.url).pathname.endsWith('/parties.json')) {
    e.respondWith(
      fetch(e.request, { cache: 'no-store' })
        .then(r => { const c = r.clone(); caches.open('duplicate-data').then(x => x.put(e.request, c)); return r; })
        .catch(() => caches.match(e.request))
    );
    return;
  }
  e.respondWith(
    caches.match(e.request, { ignoreSearch: true }).then(r => r || fetch(e.request))
  );
});
