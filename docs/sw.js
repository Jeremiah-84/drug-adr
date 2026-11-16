// 설치(앱으로 열기)를 위한 최소 서비스 워커: 항상 네트워크에서 받고, 안 되면 마지막 사본 사용
self.addEventListener('fetch',e=>{if(e.request.method!=='GET')return;
  e.respondWith(fetch(e.request).then(r=>{const c=r.clone();caches.open('adr-web').then(x=>x.put(e.request,c));return r}).catch(()=>caches.match(e.request)))});
