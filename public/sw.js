const CACHE = "health-care-public-v1";
const OFFLINE = "/offline.html";
const PUBLIC_PAGES = new Set(["/", "/about", "/services", "/doctors", "/departments", "/facilities", "/health-packages", "/gallery", "/blogs", "/contact", "/appointments"]);

self.addEventListener("install", (event) => { event.waitUntil(caches.open(CACHE).then((cache) => cache.add(OFFLINE)).then(() => self.skipWaiting())); });
self.addEventListener("activate", (event) => { event.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((key) => key !== CACHE).map((key) => caches.delete(key)))).then(() => self.clients.claim())); });
self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin || url.pathname.startsWith("/api/") || url.pathname.startsWith("/portal") || url.pathname === "/admin" || url.pathname === "/login" || url.pathname === "/register") return;
  if (request.mode === "navigate") {
    event.respondWith(fetch(request).then((response) => { if (response.ok && PUBLIC_PAGES.has(url.pathname)) caches.open(CACHE).then((cache) => cache.put(request, response.clone())); return response; }).catch(async () => (await caches.match(request)) || (await caches.match(OFFLINE))));
    return;
  }
  if (url.pathname.startsWith("/_next/") || url.pathname.startsWith("/images/") || url.pathname === "/icon.svg") event.respondWith(caches.match(request).then((cached) => cached || fetch(request).then((response) => { if (response.ok) caches.open(CACHE).then((cache) => cache.put(request, response.clone())); return response; })));
});
