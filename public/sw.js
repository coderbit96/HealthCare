const CACHE = "health-care-public-v2";
const OFFLINE = "/offline.html";
const PUBLIC_PAGES = new Set(["/", "/about", "/services", "/doctors", "/departments", "/facilities", "/health-packages", "/gallery", "/blogs", "/contact", "/appointments"]);

self.addEventListener("install", (event) => { event.waitUntil(caches.open(CACHE).then((cache) => cache.add(OFFLINE)).then(() => self.skipWaiting())); });
self.addEventListener("activate", (event) => { event.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((key) => key !== CACHE).map((key) => caches.delete(key)))).then(() => self.clients.claim())); });
function cacheResponse(event, request, response) {
  if (!response.ok || response.type === "opaque") return response;

  // Clone before the response is returned to the browser. Cloning later can
  // fail because the browser may already have consumed its response body.
  const responseForCache = response.clone();
  event.waitUntil(caches.open(CACHE).then((cache) => cache.put(request, responseForCache)));
  return response;
}

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin || url.pathname.startsWith("/api/") || url.pathname.startsWith("/portal") || url.pathname === "/admin" || url.pathname === "/login" || url.pathname === "/register") return;
  if (request.mode === "navigate") {
    event.respondWith(fetch(request).then((response) => {
      if (PUBLIC_PAGES.has(url.pathname)) return cacheResponse(event, request, response);
      return response;
    }).catch(async () => (await caches.match(request)) || (await caches.match(OFFLINE))));
    return;
  }
  if (url.pathname.startsWith("/_next/") || url.pathname.startsWith("/images/") || url.pathname === "/icon.svg") {
    event.respondWith(caches.match(request).then((cached) => cached || fetch(request).then((response) => cacheResponse(event, request, response))));
  }
});
