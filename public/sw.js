// DeliverFlow SPCO — Service Worker
// Empty SW to prevent 404 error
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', () => self.clients.claim());
