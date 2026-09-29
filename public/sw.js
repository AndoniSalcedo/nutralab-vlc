// Solo se cachean recursos estáticos públicos. Las páginas y respuestas RSC del
// panel contienen datos de salud de usuarios autenticados: NUNCA se guardan en
// caché, para que no queden en dispositivos compartidos tras cerrar sesión.
const CACHE_NAME = 'nutralab-cache-v2';

const PRECACHE_ASSETS = [
  '/manifest.json',
  '/favico_nutralab-32x32.png',
  '/favico_nutralab-192x192.png',
  '/favico_nutralab-512x512.png',
];

const STATIC_PATH = /^\/(_next\/static\/|favico_|icons-3d\/|manifest\.json)/;

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE_ASSETS)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      // Borra también las cachés antiguas (v1) que contenían páginas del panel.
      .then((names) => Promise.all(names.filter((n) => n !== CACHE_NAME).map((n) => caches.delete(n))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('message', (event) => {
  if (event.data === 'CLEAR_CACHES') {
    event.waitUntil(caches.keys().then((names) => Promise.all(names.map((n) => caches.delete(n)))));
  }
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  if (!STATIC_PATH.test(url.pathname)) return; // páginas, RSC y /api/: siempre a red

  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) return cached;
      return fetch(request).then((response) => {
        if (response && response.status === 200 && response.type === 'basic') {
          const copy = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
        }
        return response;
      });
    })
  );
});
