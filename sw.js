/* Eras Life·璇 — Service Worker (v25)
 * 自我注销型：安装后立刻清除所有可能残留的站点缓存并注销自己，
 * 之后页面完全依赖网络请求（index.html 已设置 no-cache），杜绝旧版本缓存导致的「刷新无效 / B站iframe」等僵局。
 * fetch 一律走网络，离线时再回退缓存（仅兜底，不主动缓存 HTML）。
 */
self.addEventListener('install', () => self.skipWaiting());

self.addEventListener('activate', (e) => {
  e.waitUntil((async () => {
    try {
      const keys = await caches.keys();
      await Promise.all(keys.map((k) => caches.delete(k)));
    } catch (_) {}
    try { await self.registration.unregister(); } catch (_) {}
    try { await self.clients.claim(); } catch (_) {}
  })());
});

self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return;
  // 全部走网络；仅在完全离线且缓存命中时回退（兜底，不主动缓存 HTML）
  e.respondWith(
    fetch(e.request).catch(() => caches.match(e.request))
  );
});
