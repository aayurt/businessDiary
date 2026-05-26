const CACHE_NAME = 'nextjs-app-v4'
const API_CACHE_NAME = 'nextjs-api-v3'
const ASSET_CACHE_NAME = 'nextjs-assets-v3'
const DYNAMIC_CACHE_NAME = 'nextjs-dynamic-v2'
const IMAGE_CACHE_NAME = 'nextjs-images-v1'

const PRECACHE_URLS = [
  '/',
  '/dashboard',
  '/auth/signin',
  '/auth/signup',
  '/manifest.json',
]

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(PRECACHE_URLS).catch((err) => {
        console.warn('Precache failed for some URLs:', err)
      })
    })
  )
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  const cacheWhitelist = [CACHE_NAME, API_CACHE_NAME, ASSET_CACHE_NAME, DYNAMIC_CACHE_NAME, IMAGE_CACHE_NAME]
  event.waitUntil(
    caches.keys().then((cacheNames) =>
      Promise.all(
        cacheNames.map((cacheName) => {
          if (!cacheWhitelist.includes(cacheName)) {
            return caches.delete(cacheName)
          }
        })
      )
    ).then(() => self.clients.claim())
  )
})

self.addEventListener('fetch', (event) => {
  const { request } = event
  const url = new URL(request.url)

  if (request.method !== 'GET') return

  // Image requests: cache-first
  if (
    url.pathname.match(/\.(png|jpg|jpeg|gif|webp|avif|svg|ico)$/i) ||
    request.destination === 'image'
  ) {
    event.respondWith(cacheFirst(request, IMAGE_CACHE_NAME))
    return
  }

  // API routes
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(networkFirstWithCache(request, API_CACHE_NAME))
    return
  }

  // Static assets
  if (
    url.pathname.startsWith('/_next/static/') ||
    url.pathname.startsWith('/icons/') ||
    url.pathname.startsWith('/fonts/')
  ) {
    event.respondWith(cacheFirst(request, ASSET_CACHE_NAME))
    return
  }

  // Navigation routes
  if (request.mode === 'navigate') {
    event.respondWith(networkFirstWithCache(request, CACHE_NAME))
    return
  }

  event.respondWith(cacheFirstWithNetworkUpdate(request, DYNAMIC_CACHE_NAME))
})

// Background sync for queued mutations
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-mutations') {
    event.waitUntil(syncMutations())
  }
})

// Message channel for cache invalidation
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'CLEAR_CACHE') {
    const cacheName = event.data.cacheName
    if (cacheName) {
      caches.delete(cacheName)
    } else {
      caches.keys().then((names) =>
        Promise.all(names.map((name) => caches.delete(name)))
      )
    }
  }

  if (event.data && event.data.type === 'INVALIDATE_API_CACHE') {
    caches.open(API_CACHE_NAME).then((cache) => {
      cache.keys().then((keys) => {
        keys.forEach((key) => cache.delete(key))
      })
    })
  }
})

async function syncMutations() {
  const clients = await self.clients.matchAll()
  clients.forEach((client) => {
    client.postMessage({ type: 'SYNC_NOW' })
  })
}

async function cacheFirst(request, cacheName) {
  const cached = await caches.match(request)
  if (cached) return cached

  try {
    const networkResponse = await fetch(request)
    if (networkResponse && networkResponse.status === 200) {
      const cache = await caches.open(cacheName)
      cache.put(request, networkResponse.clone())
    }
    return networkResponse
  } catch {
    return new Response('Offline', { status: 503 })
  }
}

async function networkFirstWithCache(request, cacheName) {
  try {
    const networkResponse = await fetch(request)
    if (networkResponse && networkResponse.status === 200) {
      const cache = await caches.open(cacheName)
      cache.put(request, networkResponse.clone())
    }
    return networkResponse
  } catch {
    const cached = await caches.match(request)
    if (cached) return cached

    if (request.mode === 'navigate') {
      const fallback = await caches.match('/')
      if (fallback) return fallback
    }

    return new Response(
      JSON.stringify({ success: false, error: { code: 'OFFLINE', message: 'You are offline' } }),
      {
        status: 503,
        headers: { 'Content-Type': 'application/json' },
      }
    )
  }
}

async function cacheFirstWithNetworkUpdate(request, cacheName) {
  const cached = await caches.match(request)
  const fetchPromise = fetch(request).then(async (networkResponse) => {
    if (networkResponse && networkResponse.status === 200) {
      const cache = await caches.open(cacheName)
      cache.put(request, networkResponse.clone())
    }
    return networkResponse
  }).catch(() => undefined)

  if (cached) return cached

  const result = await fetchPromise
  return result ?? new Response('Offline', { status: 503 })
}
