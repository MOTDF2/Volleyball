// Service Worker: Spiel offline verfügbar machen
// Bei jeder neuen Version CACHE_NAME hochzählen.
const CACHE_NAME = 'bombenvb-v3';
const FILES = ['./', './index.html', './engine.js', './world.js', './game.js', './ui.js', './manifest.json', './icon-192.png', './icon-512.png'];
self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE_NAME).then(c => c.addAll(FILES)));
  self.skipWaiting();
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
// Spieldateien: zuerst Netz (damit Updates ankommen), sonst Cache. Icons: zuerst Cache.
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== location.origin) return;
  if (/\.png$/.test(req.url)) {
    e.respondWith(caches.match(req).then(r => r || fetch(req)));
    return;
  }
  e.respondWith(
    fetch(req).then(res => {
      const copy = res.clone();
      caches.open(CACHE_NAME).then(c => c.put(req, copy));
      return res;
    }).catch(() => caches.match(req).then(r => r || caches.match('./index.html')))
  );
});
