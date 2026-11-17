/* スマホアプリ「当番」のサービスワーカー（Ver11.6.5）
   ・画面（toban.html）は、毎回ネットから新しいものを取りに行き、つながらないときだけ前のものを出す
   ・当番や希望のデータ（Apps Script）にはさわらない */
const CACHE = 'toban-11.6.5';
const FILES = ['toban.html', 'toban.webmanifest', 'toban-icon-192.png', 'toban-icon-512.png'];
self.addEventListener('install', e => { e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES)).catch(() => {})); self.skipWaiting(); });
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k.startsWith('toban-') && k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener('fetch', e => {
  const u = new URL(e.request.url);
  if (e.request.method !== 'GET' || u.origin !== location.origin || !/\/toban[^/]*$/.test(u.pathname)) return;
  e.respondWith(fetch(e.request).then(r => { const c = r.clone(); caches.open(CACHE).then(x => x.put(e.request, c)); return r; })
    .catch(() => caches.match(e.request, {ignoreSearch:true})));
});
