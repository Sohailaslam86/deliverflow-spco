// DeliverFlow Service Worker — Offline POD Support
const CACHE_NAME = "deliverflow-v1";
const OFFLINE_ASSETS = [
  "/",
  "/index.html",
  "/favicon-192.png",
  "/favicon-512.png",
];

// Pending POD uploads queue
const POD_QUEUE_KEY = "pod_upload_queue";

// Install — cache assets
self.addEventListener("install", (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(OFFLINE_ASSETS))
  );
  self.skipWaiting();
});

// Activate
self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Fetch — serve from cache if offline
self.addEventListener("fetch", (e) => {
  // Firebase/Cloudinary requests — network only
  if (
    e.request.url.includes("firestore") ||
    e.request.url.includes("firebase") ||
    e.request.url.includes("cloudinary") ||
    e.request.url.includes("googleapis")
  ) {
    e.respondWith(
      fetch(e.request).catch(() => {
        // Network failed — return offline response
        return new Response(
          JSON.stringify({ error: "offline" }),
          { headers: { "Content-Type": "application/json" } }
        );
      })
    );
    return;
  }

  // App files — cache first, then network
  e.respondWith(
    caches.match(e.request).then((cached) => {
      return cached || fetch(e.request).then((response) => {
        const clone = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(e.request, clone));
        return response;
      });
    }).catch(() => caches.match("/index.html"))
  );
});

// Background sync — upload pending PODs when online
self.addEventListener("sync", (e) => {
  if (e.tag === "pod-upload-sync") {
    e.waitUntil(uploadPendingPODs());
  }
});

async function uploadPendingPODs() {
  try {
    const clients = await self.clients.matchAll();
    clients.forEach((client) => {
      client.postMessage({ type: "SYNC_POD_UPLOADS" });
    });
  } catch (e) {
    console.error("Sync error:", e);
  }
}

// Message from app
self.addEventListener("message", (e) => {
  if (e.data?.type === "SKIP_WAITING") self.skipWaiting();
});
