const TC_VERSION='1.0.4-rc.11';
const TC_CACHE='terracontrol-'+TC_VERSION;
const VERSION_QUERY='?v='+TC_VERSION;

const APP_SHELL=[
  './',
  './index.html',
  './v500.html'+VERSION_QUERY,
  './manifest.json',
  './icon.svg',
  './icon-192.png',
  './icon-512.png',

  './v500/styles.css'+VERSION_QUERY,
  './v500/tc2.css'+VERSION_QUERY,

  './v500/core.js'+VERSION_QUERY,
  './v500/id-manager.js'+VERSION_QUERY,
  './v500/store.js'+VERSION_QUERY,
  './v500/ui.js'+VERSION_QUERY,

  './v500/taxonomy.js'+VERSION_QUERY,
  './v500/taxonomy-ui.js'+VERSION_QUERY,
  './v500/animal-engine.js'+VERSION_QUERY,

  './v500/ai-engine.js'+VERSION_QUERY,
  './v500/ai-context.js'+VERSION_QUERY,
  './v500/ai-query.js'+VERSION_QUERY,
  './v500/ai-recommendations.js'+VERSION_QUERY,
  './v500/ai-manager.js'+VERSION_QUERY,

  './v500/smart-dashboard.js'+VERSION_QUERY,
  './v500/photo-storage.js'+VERSION_QUERY,

  './v500/modules/dashboard.js'+VERSION_QUERY,
  './v500/hkn-import.js'+VERSION_QUERY,
  './v500/modules/animals-core.js'+VERSION_QUERY,
  './v500/modules/animals-food.js'+VERSION_QUERY,
  './v500/modules/animals-stock.js'+VERSION_QUERY,
  './v500/modules/animals-editor.js'+VERSION_QUERY,
  './v500/modules/animals.js'+VERSION_QUERY,
  './v500/modules/offspring.js'+VERSION_QUERY,

  './v500/modules/profile-core.js'+VERSION_QUERY,
  './v500/modules/profile-food.js'+VERSION_QUERY,
  './v500/modules/profile-health.js'+VERSION_QUERY,
  './v500/modules/profile-passport.js'+VERSION_QUERY,
  './v500/modules/profile-photos.js'+VERSION_QUERY,
  './v500/modules/profile.js'+VERSION_QUERY,

  './v500/modules/food.js'+VERSION_QUERY,
  './v500/modules/qr.js'+VERSION_QUERY,
  './v500/modules/backup.js'+VERSION_QUERY,
  './v500/modules/assistant-v2.js'+VERSION_QUERY,
  './v500/modules/chat.js'+VERSION_QUERY,

  './v500/firebase-sync.js'+VERSION_QUERY,
  './v500/app.js'+VERSION_QUERY
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
      .then(keys=>Promise.all(
        keys
          .filter(
            key=>
              key.startsWith('terracontrol-')&&
              key!==TC_CACHE
          )
          .map(key=>caches.delete(key))
      ))
      .then(()=>self.clients.claim())
  );
});

self.addEventListener('fetch',event=>{
  if(event.request.method!=='GET')return;

  const url=new URL(event.request.url);

  if(url.origin!==location.origin)return;

  if(
    url.pathname.endsWith('.js')||
    url.pathname.endsWith('.css')||
    url.pathname.endsWith('/v500.html')
  ){
    event.respondWith(
      fetch(event.request,{
        cache:'no-store'
      })
        .then(response=>{
          const copy=response.clone();

          caches.open(TC_CACHE)
            .then(cache=>
              cache.put(
                event.request,
                copy
              )
            );

          return response;
        })
        .catch(()=>
          caches.match(event.request)
        )
    );

    return;
  }

  event.respondWith(
    fetch(event.request)
      .then(response=>{
        const copy=response.clone();

        caches.open(TC_CACHE)
          .then(cache=>
            cache.put(
              event.request,
              copy
            )
          );

        return response;
      })
      .catch(()=>
        caches.match(event.request)
          .then(cached=>
            cached||
            caches.match(
              './v500.html'+VERSION_QUERY
            )
          )
      )
  );
});
