// Read Thai service worker
// Hand-written for Vite 8 / Rolldown compatibility.

const VERSION = 'v3.0.0-domain';
const APP_CACHE = `readthai-app-${VERSION}`;
const RUNTIME_CACHE = `readthai-runtime-${VERSION}`;
const AUDIO_CACHE = `readthai-audio-${VERSION}`;
const IMAGE_CACHE = `readthai-image-${VERSION}`;
const DATA_CACHE = `readthai-data-${VERSION}`;
const FONT_CACHE = `readthai-font-${VERSION}`;
const KEEP = new Set([APP_CACHE, RUNTIME_CACHE, AUDIO_CACHE, IMAGE_CACHE, DATA_CACHE, FONT_CACHE]);

const APP_SHELL = [
  '/',
  '/index.html',
  '/manifest.webmanifest',
  '/favicon.svg',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
  '/icons/apple-touch-icon-180.png',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(APP_CACHE).then((cache) =>
      Promise.all(
        APP_SHELL.map((url) =>
          fetch(url, { credentials: 'same-origin' })
            .then((res) => (res.ok ? cache.put(url, res) : null))
            .catch(() => null),
        ),
      ),
    ),
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.map((k) => (KEEP.has(k) ? null : caches.delete(k)))),
    ),
  );
  self.clients.claim();
});

function isSameOrigin(url) {
  return url.origin === self.location.origin;
}

async function staleWhileRevalidate(event, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(event.request);
  const network = fetch(event.request)
    .then((res) => {
      if (res.ok) cache.put(event.request, res.clone());
      return res;
    })
    .catch(() => cached);
  return cached || network;
}

async function cacheFirst(event, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(event.request);
  if (cached) return cached;
  try {
    const res = await fetch(event.request);
    if (res.ok || res.type === 'opaque') cache.put(event.request, res.clone());
    return res;
  } catch (err) {
    return cached || Response.error();
  }
}

async function networkFirst(event, cacheName) {
  const cache = await caches.open(cacheName);
  try {
    const res = await fetch(event.request);
    if (res.ok) cache.put(event.request, res.clone());
    return res;
  } catch (err) {
    const cached = await cache.match(event.request);
    if (cached) return cached;
    throw err;
  }
}

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;

  const url = new URL(req.url);
  if (!isSameOrigin(url) && !/fonts\.gstatic\.com/.test(url.host)) return;

  // SPA navigation fallback (but not for audio paths)
  if (req.mode === 'navigate') {
    if (url.pathname.includes('/audio/') || url.pathname.endsWith('.mp3')) return;
    event.respondWith(
      fetch(req).catch(() =>
        caches.match('/index.html').then((r) => r || Response.error()),
      ),
    );
    return;
  }

  const dest = req.destination;
  const path = url.pathname;

  if (dest === 'audio' || /\.mp3$/.test(path)) {
    event.respondWith(cacheFirst(event, AUDIO_CACHE));
    return;
  }
  if (dest === 'image' || /\.(?:png|jpe?g|webp|svg|gif)$/.test(path)) {
    event.respondWith(staleWhileRevalidate(event, IMAGE_CACHE));
    return;
  }
  if (dest === 'font' || /\.(?:woff2?|ttf|otf)$/.test(path)) {
    event.respondWith(cacheFirst(event, FONT_CACHE));
    return;
  }
  if (/\.json$/.test(path)) {
    event.respondWith(staleWhileRevalidate(event, DATA_CACHE));
    return;
  }
  if (path.startsWith('/assets/')) {
    event.respondWith(cacheFirst(event, RUNTIME_CACHE));
    return;
  }
  // For other same-origin GETs, prefer network with cache fallback.
  event.respondWith(networkFirst(event, RUNTIME_CACHE));
});

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
