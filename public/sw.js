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

// En local (next dev) los chunks de /_next/static no cambian de URL: cachearlos sirve JS
// obsoleto. Este SW se autodesinstala, vacía las cachés y recarga las pestañas abiertas.
const IS_LOCAL = ['localhost', '127.0.0.1'].includes(self.location.hostname);

self.addEventListener('install', (event) => {
  if (IS_LOCAL) {
    self.skipWaiting();
    return;
  }
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE_ASSETS)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  if (IS_LOCAL) {
    event.waitUntil(
      caches.keys()
        .then((names) => Promise.all(names.map((n) => caches.delete(n))))
        .then(() => self.registration.unregister())
        .then(() => self.clients.matchAll({ type: 'window' }))
        .then((clients) => clients.forEach((client) => client.navigate(client.url)))
    );
    return;
  }
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
  if (IS_LOCAL || request.method !== 'GET') return;

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

// ── Notificaciones push ──
// El servidor envía { title, body, url, tag, icon, badge } (lib/push.js)
self.addEventListener('push', (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch {
    data = { body: event.data ? event.data.text() : '' };
  }
  const title = data.title || 'Nutralab';
  event.waitUntil(
    self.registration.showNotification(title, {
      body: data.body || '',
      icon: data.icon || '/favico_nutralab-192x192.png',
      badge: data.badge || '/favico_nutralab-32x32.png',
      tag: data.tag,
      renotify: Boolean(data.tag),
      data: { url: data.url || '/dashboard' },
    })
  );
});

// Al pulsar el aviso se reutiliza una pestaña abierta de la app si la hay
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const target = new URL(event.notification.data?.url || '/dashboard', self.location.origin);
  if (target.origin !== self.location.origin) return;

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windows) => {
      const existing = windows.find((client) => new URL(client.url).origin === self.location.origin);
      if (existing) {
        return existing.focus().then((client) => (client && 'navigate' in client ? client.navigate(target.href) : client));
      }
      return self.clients.openWindow(target.href);
    })
  );
});
