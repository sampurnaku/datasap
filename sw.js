// Service worker: aplikasi tetap bisa dibuka tanpa internet, dan memberi tahu halaman bila ada versi baru.
const VERSI='cekstock-v3';
const FILE=['./','index.html','manifest.webmanifest','icon-192.png','icon-512.png'];
self.addEventListener('install',e=>{e.waitUntil(caches.open(VERSI).then(c=>c.addAll(FILE.map(f=>new Request(f,{cache:'reload'})))).then(()=>self.skipWaiting()))});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(k=>Promise.all(k.filter(n=>n!==VERSI).map(n=>caches.delete(n)))).then(()=>self.clients.claim()))});
const halaman=u=>{const p=new URL(u).pathname;return p.endsWith('/')||p.endsWith('index.html')};
const kabari=()=>self.clients.matchAll().then(l=>l.forEach(c=>c.postMessage('update')));
self.addEventListener('fetch',e=>{
  const r=e.request;
  if(r.method!=='GET'||new URL(r.url).origin!==location.origin)return;
  // tampilkan cache dulu (cepat/offline), sambil memeriksa versi terbaru ke server
  e.respondWith(caches.open(VERSI).then(async c=>{
    const hit=await c.match(r,{ignoreSearch:true});
    const net=fetch(r,{cache:'no-cache'}).then(async res=>{
      if(res.ok){
        const copy=res.clone();
        if(hit&&halaman(r.url)){
          const[a,b]=await Promise.all([hit.clone().text(),res.clone().text()]);
          if(a!==b){await c.put(r,copy);kabari()}
        }else await c.put(r,copy);
      }
      return res;
    }).catch(()=>hit);
    return hit||net;
  }));
});
