const TC_CACHE='terracontrol-v1-0-4-rc11';

const APP_SHELL=[
  './',
  './v500.html',
  './manifest.json',
  './icon.svg',
  './icon-192.png',
  './icon-512.png',
  './v500/styles.css?v=1.0.4-rc11',
  './v500/tc2.css?v=1.0.4-rc11',
  './v500/core.js?v=1.0.4-rc11',
  './v500/store.js?v=1.0.4-rc11',
  './v500/ui.js?v=1.0.4-rc11',
  './v500/app.js?v=1.0.4-rc11',
  './v500/smart-dashboard.js?v=1.0.4-rc11',
  './v500/modules/dashboard.js?v=1.0.4-rc11',
  './v500/firebase-sync.js?v=1.0.4-rc11'
];

self.addEventListener('install',event=>{
  event.waitUntil(
    caches.open(TC_CACHE)
      .then(cache=>cache.addAll(APP_SHELL))
      .then(()=>self.skipWaiting())
  );
});

self.addEventListener('activate',event=>{
  event.waitUntil(
    caches.keys()
      .then(keys=>Promise.all(keys.filter(k=>k!==TC_CACHE).map(k=>caches.delete(k))))
      .then(()=>self.clients.claim())
  );
});

self.addEventListener('fetch',event=>{
  if(event.request.method!=='GET')return;

  const url=new URL(event.request.url);
  if(url.origin!==location.origin)return;

  if(url.pathname.endsWith('.js')||url.pathname.endsWith('.css')||url.pathname.endsWith('/v500.html')){
    event.respondWith(
      fetch(event.request,{cache:'no-store'})
        .then(response=>{
          const copy=response.clone();
          caches.open(TC_CACHE).then(cache=>cache.put(event.request,copy));
          return response;
        })
        .catch(()=>caches.match(event.request))
    );
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then(response=>{
        const copy=response.clone();
        caches.open(TC_CACHE).then(cache=>cache.put(event.request,copy));
        return response;
      })
      .catch(()=>caches.match(event.request).then(cached=>cached||caches.match('./v500.html')))
  );
});
