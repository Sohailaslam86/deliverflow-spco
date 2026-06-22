// public/sw.js
// DeliverFlow SPCO — Service Worker v1
// Strategy: Network-first for app shell, skip all Firebase/Cloudinary requests

const CACHE_NAME = 'deliverflow-spco-v1';

const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/favicon-192.png',
  '/favicon-512.png',
];

// ── Install: cache static assets ─────────────────────────────────────────────
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(STATIC_ASSETS))
      .then(() => self.skipWaiting())
  );
});

// ── Activate: remove old caches ───────────────────────────────────────────────
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((names) => Promise.all(
        names
          .filter(name => name !== CACHE_NAME)
          .map(name => caches.delete(name))
      ))
      .then(() => self.clients.claim())
  );
});

// ── Fetch: network-first, cache fallback ──────────────────────────────────────
self.addEventListener('fetch', (event) => {
  // Only handle GET requests
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);

  // Skip external domains — Firebase, Cloudinary, Google APIs
  // These always need live network and must not be cached
  const skipDomains = [
    'firebaseio.com',
    'firestore.googleapis.com',
    'googleapis.com',
    'firebase.googleapis.com',
    'identitytoolkit.googleapis.com',
    'securetoken.googleapis.com',
    'cloudinary.com',
    'res.cloudinary.com',
  ];
  if (skipDomains.some(d => url.hostname.includes(d))) return;

  // For same-origin requests: network-first with cache fallback
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Cache valid responses
        if (response && response.status === 200 && response.type !== 'opaque') {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
        }
        return response;
      })
      .catch(() => {
        // Network failed — serve from cache
        return caches.match(event.request).then((cached) => {
          if (cached) return cached;
          // For page navigations, serve the app shell
          if (event.request.mode === 'navigate') {
            return caches.match('/index.html');
          }
        });
      })
  );
});
