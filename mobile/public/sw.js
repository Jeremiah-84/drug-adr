// Offline support for the MediScan mobile app (docs/m/).
// - pages: network first, cached copy when offline
// - drug data (../data/): network first so the monthly update shows up; cached copy when offline
// - built assets, OCR/barcode engines, fonts: cache first (file names change when they change)
const CACHE = 'mediscan-v2';
const SCOPE = new URL('./', self.location).href;
const DATA = new URL('../data/', self.location).href;
const VENDOR = new URL('../vendor/', self.location).href;

self.addEventListener('install', e => { self.skipWaiting(); e.waitUntil(caches.open(CACHE).then(c => c.addAll(['./', './index.html']))); });
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k.startsWith('mediscan-') && k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
const put = (req, r) => { if (r.ok || r.type === 'opaque') { const copy = r.clone(); caches.open(CACHE).then(c => c.put(req, copy)); } return r; };
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = req.url;
  if (req.mode === 'navigate') {
    e.respondWith(fetch(req).then(r => put('./index.html', r)).catch(() => caches.match('./index.html')));
    return;
  }
  if (url.startsWith(DATA)) {
    e.respondWith(fetch(req).then(r => put(req, r)).catch(() => caches.match(req)));
    return;
  }
  const fonts = url.startsWith('https://fonts.googleapis.com/') || url.startsWith('https://fonts.gstatic.com/');
  if (!(url.startsWith(SCOPE) || url.startsWith(VENDOR) || fonts)) return;
  e.respondWith(caches.match(req).then(hit => hit || fetch(req).then(r => put(req, r))));
});
