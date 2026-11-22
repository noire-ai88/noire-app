const CACHE_NAME = 'noire-shell-v2';

const CORE_ASSETS = [
'./',
'./index.html',
'./manifest.webmanifest',
'./icons/noire-192.png',
'./icons/noire-512.png'
];

self.addEventListener('install', event => {
event.waitUntil(
caches.open(CACHE_NAME).then(cache => cache.addAll(CORE_ASSETS))
);
self.skipWaiting();
});

self.addEventListener('activate', event => {
event.waitUntil(
caches.keys().then(keys =>
Promise.all(
keys
.filter(key => key !== CACHE_NAME)
.map(key => caches.delete(key))
)
).then(() => self.clients.claim())
);
});

self.addEventListener('fetch', event => {
if (event.request.method !== 'GET') return;

const url = new URL(event.request.url);

if (url.origin !== self.location.origin) return;

// Для страниц сначала пробуем получить свежую версию с GitHub
if (event.request.mode === 'navigate') {
event.respondWith(
fetch(event.request)
.then(response => {
if (response.ok) {
const copy = response.clone();
caches.open(CACHE_NAME).then(cache =>
cache.put('./index.html', copy)
);
}
return response;
})
.catch(() => caches.match('./index.html'))
);
return;
}

// Для остальных файлов используем кэш
event.respondWith(
caches.match(event.request).then(cached => {
if (cached) return cached;

  return fetch(event.request).then(response => {
    if (response.ok) {
      const copy = response.clone();
      caches.open(CACHE_NAME).then(cache =>
        cache.put(event.request, copy)
      );
    }
    return response;
  });
})
);
});
