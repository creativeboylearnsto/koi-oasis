/* Koi Oasis offline cache. Network first so updates arrive; the cache is the fallback when offline. */
const CACHE='koi-oasis-v4';
const SHELL=['./','index.html','fonts.css?v=3','app.css?v=3','engine.js?v=3','app.js?v=3','fonts/Figtree-latin-1.woff2','fonts/Figtree-latin-ext-0.woff2','fonts/IBMPlexMono-latin-3.woff2','fonts/IBMPlexMono-latin-ext-2.woff2','fonts/PixelifySans-latin-5.woff2','fonts/PixelifySans-latin-ext-4.woff2','manifest.webmanifest','icons/icon-192.png','icons/icon-512.png','icons/icon-180.png'];
self.addEventListener('install',e=>{e.waitUntil(caches.open(CACHE).then(c=>c.addAll(SHELL)).then(()=>self.skipWaiting()))});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()))});
self.addEventListener('fetch',e=>{
  if(e.request.method!=='GET')return;
  e.respondWith(fetch(e.request,{cache:'no-cache'}).then(r=>{if(r&&(r.ok||r.type==='opaque')){const cp=r.clone();caches.open(CACHE).then(c=>c.put(e.request,cp))}return r}).catch(()=>caches.match(e.request,{ignoreSearch:true})));
});
