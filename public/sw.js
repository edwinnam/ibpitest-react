// Service Worker for IBPI React App
const CACHE_NAME = 'ibpi-v1';
const STATIC_CACHE_NAME = 'ibpi-static-v1';
const API_CACHE_NAME = 'ibpi-api-v1';

// Files to cache on install
const STATIC_FILES = [
  '/',
  '/index.html',
  '/manifest.json',
  '/images/ibpi-logo.png'
];

// Cache strategies
const CACHE_STRATEGIES = {
  // Network first, fallback to cache
  networkFirst: [
    '/api/',
    '/auth/',
    '/rest/'
  ],
  
  // Cache first, fallback to network
  cacheFirst: [
    '/assets/',
    '/images/',
    '/fonts/',
    '/.css',
    '/.js'
  ],
  
  // Stale while revalidate
  staleWhileRevalidate: [
    '/reports/',
    '/test-results/'
  ]
};

// Install event - cache static assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE_NAME)
      .then((cache) => {
        console.log('Caching static assets');
        return cache.addAll(STATIC_FILES);
      })
      .then(() => self.skipWaiting())
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter((cacheName) => {
              return cacheName.startsWith('ibpi-') && 
                     cacheName !== CACHE_NAME &&
                     cacheName !== STATIC_CACHE_NAME &&
                     cacheName !== API_CACHE_NAME;
            })
            .map((cacheName) => caches.delete(cacheName))
        );
      })
      .then(() => self.clients.claim())
  );
});

// Fetch event - implement caching strategies
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }

  // Skip chrome extension requests
  if (url.protocol === 'chrome-extension:') {
    return;
  }

  // Determine cache strategy
  const strategy = getCacheStrategy(url.pathname);

  switch (strategy) {
    case 'networkFirst':
      event.respondWith(networkFirst(request));
      break;
    case 'cacheFirst':
      event.respondWith(cacheFirst(request));
      break;
    case 'staleWhileRevalidate':
      event.respondWith(staleWhileRevalidate(request));
      break;
    default:
      event.respondWith(fetch(request));
  }
});

// Get cache strategy for a given path
function getCacheStrategy(pathname) {
  for (const [strategy, patterns] of Object.entries(CACHE_STRATEGIES)) {
    if (patterns.some(pattern => pathname.includes(pattern))) {
      return strategy;
    }
  }
  return null;
}

// Network first strategy
async function networkFirst(request) {
  try {
    const networkResponse = await fetch(request);
    
    // Cache successful responses
    if (networkResponse.ok) {
      const cache = await caches.open(API_CACHE_NAME);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    // Fallback to cache
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // Return offline page for navigation requests
    if (request.mode === 'navigate') {
      return caches.match('/offline.html');
    }
    
    throw error;
  }
}

// Cache first strategy
async function cacheFirst(request) {
  const cachedResponse = await caches.match(request);
  
  if (cachedResponse) {
    return cachedResponse;
  }
  
  try {
    const networkResponse = await fetch(request);
    
    // Cache successful responses
    if (networkResponse.ok) {
      const cache = await caches.open(STATIC_CACHE_NAME);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    // Return offline page for navigation requests
    if (request.mode === 'navigate') {
      return caches.match('/offline.html');
    }
    
    throw error;
  }
}

// Stale while revalidate strategy
async function staleWhileRevalidate(request) {
  const cachedResponse = await caches.match(request);
  
  const fetchPromise = fetch(request).then((networkResponse) => {
    if (networkResponse.ok) {
      const cache = caches.open(API_CACHE_NAME);
      cache.then((cache) => {
        cache.put(request, networkResponse.clone());
      });
    }
    return networkResponse;
  });
  
  return cachedResponse || fetchPromise;
}

// Handle background sync for offline requests
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-test-results') {
    event.waitUntil(syncTestResults());
  }
});

// Sync offline test results
async function syncTestResults() {
  try {
    // Get pending test results from IndexedDB
    const pendingResults = await getPendingTestResults();
    
    for (const result of pendingResults) {
      try {
        const response = await fetch('/api/test-results', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(result)
        });
        
        if (response.ok) {
          await removePendingTestResult(result.id);
        }
      } catch (error) {
        console.error('Failed to sync test result:', error);
      }
    }
  } catch (error) {
    console.error('Background sync failed:', error);
  }
}

// IndexedDB helpers for offline data
async function getPendingTestResults() {
  // Implementation would connect to IndexedDB and retrieve pending results
  return [];
}

async function removePendingTestResult(id) {
  // Implementation would remove synced result from IndexedDB
}

// Handle push notifications
self.addEventListener('push', (event) => {
  const options = {
    body: event.data ? event.data.text() : '새로운 알림이 있습니다',
    icon: '/images/ibpi-logo.png',
    badge: '/images/badge.png',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    }
  };
  
  event.waitUntil(
    self.registration.showNotification('IBPI 알림', options)
  );
});

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  event.waitUntil(
    clients.openWindow('/')
  );
});