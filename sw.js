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
const CACHE = 'duplicate-v1';
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
      .then(noms => Promise.all(noms.filter(n => n !== CACHE).map(n => caches.delete(n))))
      .then(() => self.clients.claim())
  );
});

// Chaque requête : cache d'abord, réseau en secours
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  e.respondWith(
    caches.match(e.request, { ignoreSearch: true }).then(r => r || fetch(e.request))
  );
});
