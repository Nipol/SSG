const CACHE_VERSION = '// CACHE_NAME';

const CURRENT_CACHES = {
  offline: 'offline-cache-' + CACHE_VERSION
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

self.addEventListener('activate', (event) => {
  // 이전 버전의 캐시를 모두 제거합니다.
  const expectedCacheNames = Object.keys(CURRENT_CACHES).map((key) => {
    return CURRENT_CACHES[key];
  });

  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (expectedCacheNames.indexOf(cacheName) === -1) {
            // 이전 버전의 캐시를 제거합니다.
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request);
    }),
  );
});
