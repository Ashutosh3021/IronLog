const CACHE_NAME = 'ironlog-v6';
const BASE = self.location.pathname.replace(/\/sw\.js$/, '');

const STATIC_ASSETS = [
  `${BASE}/`,
  `${BASE}/index.html`,
  `${BASE}/manifest.json`,
  `${BASE}/Assets/logo.jpg`,
  'https://fonts.googleapis.com/css2?family=Bebas+Neue&family=JetBrains+Mono:wght@400;700&family=Barlow+Condensed:wght@300;400;600;700;900&display=swap',
  'https://cdnjs.cloudflare.com/ajax/libs/Chart.js/4.4.1/chart.umd.min.js'
];

// ── INSTALL EVENT ──
self.addEventListener('install', event => {
  console.log('[SW] Install event');
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      console.log('[SW] Pre-caching static assets');
      // Cache each asset individually so one failure doesn't kill the whole install
      return Promise.allSettled(
        STATIC_ASSETS.map(asset => 
          cache.add(asset).catch(err => console.warn('[SW] Failed to cache:', asset, err.message))
        )
      );
    })
  );
  self.skipWaiting();
});

// ── ACTIVATE EVENT ──
self.addEventListener('activate', event => {
  console.log('[SW] Activate event');
  event.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(
        keys.filter(key => key !== CACHE_NAME)
            .map(key => caches.delete(key))
      );
    })
  );
  self.clients.claim();
});

// ── FETCH EVENT ──
self.addEventListener('fetch', event => {
  const request = event.request;
  const url = new URL(request.url);

  // Strategy: Stale-While-Revalidate for static assets, 
  // Network-First for everything else.
  
  const isStatic = STATIC_ASSETS.some(asset => {
    if (asset.startsWith('http')) return request.url === asset;
    const assetPath = new URL(asset, self.location.origin).pathname;
    return url.pathname === assetPath || 
           url.pathname === assetPath.replace(/\/index\.html$/, '/');
  });

  if (isStatic) {
    event.respondWith(
      caches.match(request).then(cachedResponse => {
        const fetchPromise = fetch(request).then(networkResponse => {
          if (networkResponse && networkResponse.ok) {
            const responseClone = networkResponse.clone();
            caches.open(CACHE_NAME).then(cache => {
              cache.put(request, responseClone);
            });
          }
          return networkResponse;
        }).catch(() => null);
        
        return cachedResponse || fetchPromise;
      })
    );
  } else {
    // Network first strategy
    event.respondWith(
      fetch(request)
        .catch(() => {
          return caches.match(request) || (url.pathname.endsWith('.html') ? caches.match(`${BASE}/index.html`) : null);
        })
    );
  }
});

// ── SYNC and PUSH handlers remain same ──
self.addEventListener('sync', event => {
  if (event.tag === 'sync-workouts') {
    event.waitUntil(syncWorkouts());
  }
});

async function syncWorkouts() {
  console.log('[SW] Syncing workouts...');
  return Promise.resolve();
}

self.addEventListener('push', event => {
  const data = event.data ? event.data.json() : { title: 'IRON LOG', body: 'Time for your workout!' };
  const options = {
    body: data.body,
    icon: './Assets/logo.jpg',
    badge: './Assets/logo.jpg',
    vibrate: [100, 50, 100],
    data: { url: './ironlog.html' }
  };
  event.waitUntil(self.registration.showNotification(data.title, options));
});

self.addEventListener('notificationclick', event => {
  event.notification.close();
  event.waitUntil(clients.openWindow(event.notification.data.url));
});