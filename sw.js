/* Eras Life・璇 — Service Worker */
const CACHE_NAME = "eras-life-xuan-v1";
const CORE_FILES = [
  "./",
  "./index.html",
  "./css/style.css",
  "./js/core.js",
  "./js/data.js",
  "./js/mod-a.js",
  "./js/mod-b.js",
  "./js/app.js",
  "./manifest.webmanifest",
  "./favicon.svg",
  "./icon-192.png",
  "./icon-512.png"
];

self.addEventListener("install", (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(CORE_FILES))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (e) => {
  e.respondWith(
    caches.match(e.request).then((cached) => {
      return (
        cached ||
        fetch(e.request).catch(() => {
          // offline fallback for navigation
          if (e.request.mode === "navigate") return caches.match("./index.html");
        })
      );
    })
  );
});
