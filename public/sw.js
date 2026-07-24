/* HealthKeeper service worker.
   Goal: opening the app ALWAYS shows HealthKeeper instantly — even while the
   free server is still waking up — by keeping the app shell on the device.

   - Page opens ("navigations"): serve the cached app shell immediately and
     refresh the copy in the background (stale-while-revalidate), so updates
     arrive on the *next* open.
   - Static assets (hashed JS/CSS, icons): cache-first, filled as fetched —
     they are immutable, so this is always safe.
   - /api/* is NEVER cached: medical data is always live.
*/
const CACHE = 'healthkeeper-v1'

self.addEventListener('install', () => self.skipWaiting())

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys()
      await Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
      await self.clients.claim()
    })(),
  )
})

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url)
  if (event.request.method !== 'GET' || url.origin !== location.origin) return
  if (url.pathname.startsWith('/api/')) return // live data only, never cached

  if (event.request.mode === 'navigate') {
    event.respondWith(
      (async () => {
        const cache = await caches.open(CACHE)
        const cached = await cache.match('/')
        const refresh = fetch('/')
          .then((res) => {
            if (res.ok) cache.put('/', res.clone())
            return res
          })
          .catch(() => null)
        // Cached shell first (instant open); network only when there is no copy yet.
        return cached || (await refresh) || new Response('You are offline.', { status: 503 })
      })(),
    )
    return
  }

  event.respondWith(
    (async () => {
      const cache = await caches.open(CACHE)
      const cached = await cache.match(event.request)
      if (cached) return cached
      const res = await fetch(event.request)
      if (res.ok) cache.put(event.request, res.clone())
      return res
    })(),
  )
})
