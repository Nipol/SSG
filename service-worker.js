const PREV_CACHE_VERSION = '// PREV_CACHE_NAME';
const CACHE_VERSION = '// CACHE_NAME';

const CURRENT_CACHES = {
  prev: 'offline-cache-' + PREV_CACHE_VERSION,
  offline: 'offline-cache-' + CACHE_VERSION,
};

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CURRENT_CACHES.offline).then((cache) => {
      return cache.addAll([
        '/',
        '// CACHELIST',
      ]);
    }),
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request);
    }),
  );
});

self.addEventListener('activate', (event) => {
  // 이전 버전의 캐시를 모두 제거합니다.
  event.waitUntil(
    caches.delete(CURRENT_CACHES.prev),
  );
});
