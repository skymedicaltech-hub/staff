/* スカイ スタッフアプリ(入口アプリ) サービスワーカー  Ver1.15.0
   ・この入口アプリのファイル(portal〜)だけを扱います。
     同じ場所にある当番アプリ(toban.html)など、ほかのアプリには関わりません。
     院長が作ったアプリのアイコン画像(portal-icon-〇〇.png)も、ここで扱います(電波がないときは前回の分を出します)。
   ・portal.html はいつも最新をとりにいき、電波がないときだけ前回の分を出します。 */
const CACHE = 'sky-portal-Ver1.15.0';
const FILES = ['portal.html', 'portal-config.js', 'portal.webmanifest', 'portal-icon-192.png', 'portal-icon-512.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k.startsWith('sky-portal-') && k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== location.origin) return;                         // GAS などほかのサイトは扱わない
  const name = url.pathname.split('/').pop();
  if (!/^portal/.test(name)) return;                                   // 入口アプリのファイルだけ
  e.respondWith(
    fetch(req).then(res => {
      if (res.ok) { const copy = res.clone(); caches.open(CACHE).then(c => c.put(name === 'portal.html' ? 'portal.html' : req, copy)); }
      return res;
    }).catch(() => caches.match(req, { ignoreSearch: true }).then(r => r || caches.match('portal.html')))
  );
});
