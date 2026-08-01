/* Eras Life·璇 — Service Worker */
const CACHE_NAME = "eras-life-xuan-v2";
const CORE_FILES = [
  "./",
  "./index.html",
  "./css/style.css",
  "./js/core.js",
  "./js/data.js",
  "./js/mod-a.js",
  "./js/mod-b.js",
  "./js/sync.js",
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
  const { request } = e;
  const url = new URL(request.url);

  // 页面导航：永远先拿网络最新版，离线才回退缓存
  if (request.mode === "navigate") {
    e.respondWith(
      fetch(request, { cache: "reload" }).catch(() =>
        caches.match(request).then((r) => r || caches.match("./index.html"))
      )
    );
    return;
  }

  // 同域静态资源：缓存优先立即返回，同时后台更新缓存，兼顾速度与更新
  if (url.origin === self.location.origin) {
    e.respondWith(
      caches.match(request).then((cached) => {
        const network = fetch(request)
          .then((resp) => {
            if (resp && resp.status === 200) {
              const clone = resp.clone();
              caches.open(CACHE_NAME).then((c) => c.put(request, clone));
            }
            return resp;
          })
          .catch(() => cached);
        return cached || network;
      })
    );
    return;
  }

  // 跨域请求直接走网络
  e.respondWith(fetch(request));
});
