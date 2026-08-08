/* GUESS IT service worker — scope-relative so it works at any base path
 * (root domain or GitHub Pages subpath). Cache-first for static assets,
 * network-first for pages with cache fallback, so the installed app opens
 * offline (BRD §48: the MVP is single-player and works offline). */
const VERSION = 'guessit-v2';
const STATIC = `${VERSION}-static`;
const PAGES = `${VERSION}-pages`;

const scopeUrl = new URL(self.registration.scope);

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(PAGES)
      .then((cache) => cache.add(new Request(scopeUrl.href)))
      .catch(() => {})
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
  if (url.origin !== scopeUrl.origin) return;
  if (!url.pathname.startsWith(scopeUrl.pathname)) return;

  // hashed build assets, fonts + icons: cache-first
  if (url.pathname.includes('/_next/static/') || /\.(png|woff2?)$/.test(url.pathname)) {
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

  // navigations + pages: network-first, cache fallback, then app shell
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
        caches.match(request).then((hit) => hit ?? caches.match(scopeUrl.href)),
      ),
  );
});
