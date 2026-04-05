// ILM Mizan PWA Engine
const CACHE_NAME = 'startup-hub-v1';

// Yangi versiya yuklanganda ilovani to'g'ridan-to'g'ri yangilash (Play Market kutmasdan)
self.addEventListener('install', (e) => {
  self.skipWaiting(); 
});

self.addEventListener('activate', (e) => {
  e.waitUntil(clients.claim()); 
});

// Tarmoqqa so'rov yuborish, internet yo'q bo'lsa keshdan olish (Network-first)
self.addEventListener('fetch', (e) => {
  e.respondWith(
    fetch(e.request).catch(() => caches.match(e.request))
  );
});
