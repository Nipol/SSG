const CACHE_VERSION = '__CACHE_VERSION__';
const CACHE_LIST = [
        '/',
        '__CACHELIST__',
      ];
const OFFLINE_CACHE = 'offline-cache-' + CACHE_VERSION;
const VERSION_CACHE = 'version-info';
const VERSION_KEY = 'cache-version';

self.addEventListener('install', (event) => {
  event.waitUntil((async () => {
    // 새로운 캐시 생성
    const newCache = await caches.open(OFFLINE_CACHE);

    // 별도의 캐시에 저장된 이전 버전 정보를 조회
    const versionCache = await caches.open(VERSION_CACHE);

    const versionResponse = await versionCache.match(VERSION_KEY);
    const prevVersion = versionResponse ? await versionResponse.text() : null;

    let resourcesToCache = CACHE_LIST;

    if (prevVersion && prevVersion === CACHE_VERSION) {
      // 동일 버전인 경우에는 업데이트할 리소스가 없음
      resourcesToCache = [];
    } else if (prevVersion && prevVersion !== CACHE_VERSION) {
      // 이전 버전과 다른 경우, 이전 캐시에서 기존 리소스의 경로를 확인하여 중복된 리소스는 제외
      const oldCacheName = 'offline-cache-' + prevVersion;
      const oldCache = await caches.open(oldCacheName);
      const oldRequests = await oldCache.keys();
      const oldPaths = oldRequests.map(request => new URL(request.url).pathname);
      resourcesToCache = CACHE_LIST.filter(url => !oldPaths.includes(url));
    }
    // 새로 추가할 리소스가 있다면 캐시에 저장
    if (resourcesToCache.length > 0) {
      await newCache.addAll(resourcesToCache);
    }
    // 현재 버전을 저장해 다음 업데이트 시 비교에 사용
    await versionCache.put(VERSION_KEY, new Response(CACHE_VERSION));
    self.skipWaiting();
  })());
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then(response => response || fetch(event.request))
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    // 현재 사용 중인 캐시만 남기고 나머지는 삭제
    const expectedCaches = [OFFLINE_CACHE, VERSION_CACHE];
    const cacheNames = await caches.keys();
    await Promise.all(
      cacheNames.map(cacheName => {
        if (!expectedCaches.includes(cacheName)) {
          return caches.delete(cacheName);
        }
      })
    );
    self.clients.claim();
  })());
});