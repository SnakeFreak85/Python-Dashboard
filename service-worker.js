const TC_CACHE='terracontrol-v1-0-0-rc1';
const APP_SHELL=[
  './',
  './v500.html',
  './manifest.json',
  './icon.svg',
  './icon-192.png',
  './icon-512.png',
  './v500/styles.css',
  './v500/core.js',
  './v500/store.js',
  './v500/ui.js',
  './v500/app.js'
];
self.addEventListener('install',event=>{
  event.waitUntil(caches.open(TC_CACHE).then(cache=>cache.addAll(APP_SHELL)).then(()=>self.skipWaiting()));
});
self.addEventListener('activate',event=>{
  event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==TC_CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));
});
self.addEventListener('fetch',event=>{
  if(event.request.method!=='GET')return;
  const url=new URL(event.request.url);
  if(url.origin!==location.origin)return;
  event.respondWith(fetch(event.request).then(response=>{
    const copy=response.clone();
    caches.open(TC_CACHE).then(cache=>cache.put(event.request,copy));
    return response;
  }).catch(()=>caches.match(event.request).then(cached=>cached||caches.match('./v500.html'))));
});
