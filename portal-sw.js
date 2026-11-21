/* スカイ スタッフアプリ(入口アプリ) サービスワーカー  Ver3.4.23
   ・この入口アプリのファイル(portal〜)だけを扱います。
     同じ場所にある当番アプリ(toban.html)など、ほかのアプリには関わりません。
   ・portal.html などはいつも最新をとりにいき、電波がないときだけ前回の分を出します。
   ・Ver3.4.23〜:アプリのアイコン画像(portal-icon-〇〇.png)は、スマホの中に保存しておき、
     次からは保存した分をすぐに出します(電波がなくても・おそくても出る)。
     出したあとで、うしろで置き場所から読み直し、院長が画像を差しかえていれば次に開いたときに新しい画像になります。
     アイコンの保存場所は、版数を上げても消しません。
   ・Ver3.3.0〜:ほかのアプリの「数字の部品」(goikenbako-badge.html など)は扱いません(覚えない。いつも置き場所から読む)。 */
const CACHE = 'sky-portal-Ver3.4.23';
const ICONS = 'sky-portal-icons';                 // アイコン画像の保存場所(版数を上げても消さない)
const FILES = ['portal.html', 'portal-config.js', 'portal.webmanifest', 'portal-icon-192.png', 'portal-icon-512.png'];
const ICON_RE = /^portal-icon-[a-z0-9][a-z0-9-]{0,29}\.png$/;

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k.startsWith('sky-portal-') && k !== CACHE && k !== ICONS).map(k => caches.delete(k))))
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

  // アプリのアイコン画像:保存した分をすぐ出し、うしろで読み直して保存し直す
  if (ICON_RE.test(name) && name !== 'portal-icon-192.png' && name !== 'portal-icon-512.png') {
    const key = new Request(url.origin + url.pathname);              // ?r=… などは付けずに1つだけ保存
    e.respondWith(caches.open(ICONS).then(c => c.match(key).then(saved => {
      const fresh = fetch(key, { cache: 'no-cache' }).then(res => {
        if (res.ok && (res.headers.get('content-type') || '').startsWith('image/')) c.put(key, res.clone());
        else if (res.status === 404) c.delete(key);                  // 院長が画像を消したときは、保存した分も消す
        return res;
      });
      if (saved) { e.waitUntil(fresh.catch(() => {})); return saved; }
      return fresh;
    })));
    return;
  }

  e.respondWith(
    fetch(req).then(res => {
      if (res.ok) { const copy = res.clone(); caches.open(CACHE).then(c => c.put(name === 'portal.html' ? 'portal.html' : req, copy)); }
      return res;
    }).catch(() => caches.match(req, { ignoreSearch: true }).then(r => r || caches.match('portal.html')))
  );
});
