// Service worker: halaman SELALU diambil dari internet dulu (jadi update langsung terlihat).
// Bila internet mati atau lebih dari 4 detik tanpa jawaban, dipakai salinan yang tersimpan (tetap bisa offline).
const VERSI='cekstock-v4';
const FILE=['./','index.html','manifest.webmanifest','icon-192.png','icon-512.png'];
const BATAS_MS=4000;
self.addEventListener('install',e=>{e.waitUntil(caches.open(VERSI).then(c=>c.addAll(FILE.map(f=>new Request(f,{cache:'reload'})))).then(()=>self.skipWaiting()))});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(k=>Promise.all(k.filter(n=>n!==VERSI).map(n=>caches.delete(n)))).then(()=>self.clients.claim()))});
const halaman=u=>{const p=new URL(u).pathname;return p.endsWith('/')||p.endsWith('index.html')||p.endsWith('manifest.webmanifest')};
const ambil=r=>fetch(r,{cache:'no-store'}).then(res=>{if(res.ok){const c=res.clone();caches.open(VERSI).then(ca=>ca.put(r,c))}return res});
self.addEventListener('fetch',e=>{
  const r=e.request;
  if(r.method!=='GET'||new URL(r.url).origin!==location.origin)return;
  if(halaman(r.url)){
    const lama=new Promise((_,tolak)=>setTimeout(tolak,BATAS_MS));
    e.respondWith(Promise.race([ambil(r),lama]).catch(()=>caches.match(r,{ignoreSearch:true}).then(h=>h||ambil(r))));
  }else{ // ikon dan file lain: simpanan dulu
    e.respondWith(caches.match(r,{ignoreSearch:true}).then(h=>h||ambil(r)));
  }
});
