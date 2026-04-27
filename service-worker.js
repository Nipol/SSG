const CACHE_VERSION = '__CACHE_VERSION__';
const CACHE_LIST = [
  '/',
  '__CACHELIST__',
];
const OFFLINE_CACHE = 'offline-cache-' + CACHE_VERSION;
const FONT_CACHE = 'runtime-fonts';
const VERSION_CACHE = 'version-info';
const VERSION_KEY = 'cache-version';
const FONT_STYLESHEET_ORIGIN = 'https://fonts.googleapis.com';
const FONT_FILE_ORIGIN = 'https://fonts.gstatic.com';

const canCache = (response) => response && (response.ok || response.type === 'opaque');

async function networkFirst(request) {
  const cache = await caches.open(FONT_CACHE);

  try {
    const response = await fetch(request);
    if (canCache(response)) await cache.put(request, response.clone());
    return response;
  } catch (error) {
    const cached = await cache.match(request);
    if (cached) return cached;
    throw error;
  }
}

async function cacheFirst(request) {
  const cache = await caches.open(FONT_CACHE);
  const cached = await cache.match(request);
  if (cached) return cached;

  const response = await fetch(request);
  if (canCache(response)) await cache.put(request, response.clone());
  return response;
}

self.addEventListener('install', (event) => {
  event.waitUntil((async () => {
    // 새로운 캐시 생성
    const newCache = await caches.open(OFFLINE_CACHE);

    // 별도의 캐시에 저장된 이전 버전 정보를 조회
    const versionCache = await caches.open(VERSION_CACHE);

    const versionResponse = await versionCache.match(VERSION_KEY);
    const prevVersion = versionResponse ? await versionResponse.text() : null;

    const resourcesToCache = prevVersion && prevVersion === CACHE_VERSION ? [] : CACHE_LIST;
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
  if (event.request.method !== 'GET') return;

  const requestUrl = new URL(event.request.url);

  if (requestUrl.origin === FONT_STYLESHEET_ORIGIN) {
    event.respondWith(networkFirst(event.request));
    return;
  }

  if (event.request.destination === 'font' || requestUrl.origin === FONT_FILE_ORIGIN) {
    event.respondWith(cacheFirst(event.request));
    return;
  }

  event.respondWith(
    caches.match(event.request).then((response) => response || fetch(event.request)),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    // 현재 사용 중인 캐시만 남기고 나머지는 삭제
    const expectedCaches = [OFFLINE_CACHE, FONT_CACHE, VERSION_CACHE];
    const cacheNames = await caches.keys();
    await Promise.all(
      cacheNames.map((cacheName) => {
        if (!expectedCaches.includes(cacheName)) {
          return caches.delete(cacheName);
        }
      }),
    );
    self.clients.claim();
  })());
});
