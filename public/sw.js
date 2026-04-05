const CACHE_NAME = 'hub-core-v1';
const DYNAMIC_CACHE = 'hub-dynamic-v1';

const coreAssets = [
  '/',
  '/login',
  '/dashboard',
  '/manifest.json',
  '/icon.svg'
];

// 1. O'rnatish: Eski keshni kutib o'tirmay, darhol yangisini faollashtirish
self.addEventListener('install', (e) => {
  self.skipWaiting(); 
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(coreAssets))
  );
});

// 2. Faollashish: Eski versiya fayllarini tozalab tashlash (Yangilanishlar yetib kelishi uchun)
self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME && key !== DYNAMIC_CACHE) {
            return caches.delete(key);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// 3. NETWORK-FIRST (Avval internetdan qidiradi, yo'q bo'lsa xotiradan beradi)
self.addEventListener('fetch', (e) => {
  // Faqat GET so'rovlarni va API emas fayllarni ushlaymiz
  if (e.request.method !== 'GET' || e.request.url.includes('/api/')) return;

  e.respondWith(
    fetch(e.request)
      .then((response) => {
        // Tizimda o'zgarish/yangilanish bo'lsa, uni darhol xotiraga yozamiz (Avtomatik yangilash)
        const resClone = response.clone();
        caches.open(DYNAMIC_CACHE).then((cache) => {
          cache.put(e.request, resClone);
        });
        return response; // Foydalanuvchiga doim eng yangisini beramiz
      })
      .catch(() => {
        // Agar internet umuman yo'q bo'lsa (Oflayn) keshdagi eski versiyani berib turamiz
        return caches.match(e.request);
      })
  );
});
