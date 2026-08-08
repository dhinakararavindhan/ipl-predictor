/* GUESS IT service worker — cache-first for static assets, network-first for
 * pages with cache fallback, so an installed app opens offline (BRD §48:
 * single-player may work offline; the whole MVP is single-player). */
const VERSION = 'guessit-v1';
const STATIC = `${VERSION}-static`;
const PAGES = `${VERSION}-pages`;
const PRECACHE = ['/', '/play', '/daily', '/history', '/profile', '/how-to-play', '/settings'];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(PAGES)
      .then((cache) => cache.addAll(PRECACHE))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => !k.startsWith(VERSION)).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  // hashed build assets + icons: cache-first
  if (url.pathname.startsWith('/_next/static/') || url.pathname.endsWith('.png')) {
    event.respondWith(
      caches.open(STATIC).then((cache) =>
        cache.match(request).then(
          (hit) =>
            hit ??
            fetch(request).then((res) => {
              if (res.ok) cache.put(request, res.clone());
              return res;
            }),
        ),
      ),
    );
    return;
  }

  // navigations + pages: network-first, cache fallback
  if (request.mode === 'navigate' || url.pathname.startsWith('/')) {
    event.respondWith(
      fetch(request)
        .then((res) => {
          if (res.ok && request.mode === 'navigate') {
            const copy = res.clone();
            caches.open(PAGES).then((cache) => cache.put(request, copy));
          }
          return res;
        })
        .catch(() =>
          caches.match(request).then((hit) => hit ?? caches.match('/')),
        ),
    );
  }
});
