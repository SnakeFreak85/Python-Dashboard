const TC_VERSION='1.0.4-rc.11';
const TC_CACHE='terracontrol-'+TC_VERSION;
const VERSION_QUERY='?v='+TC_VERSION;

const APP_SHELL=[
  './','./index.html','./v500.html'+VERSION_QUERY,'./manifest.json','./icon.svg','./icon-192.png','./icon-512.png',
  './v500/styles.css'+VERSION_QUERY,'./v500/tc2.css'+VERSION_QUERY,'./v500/taxonomy-ui-color.css'+VERSION_QUERY,
  './v500/vendor/qrcode.min.js'+VERSION_QUERY,
  './v500/core.js'+VERSION_QUERY,'./v500/id-manager.js'+VERSION_QUERY,'./v500/food-inventory-engine.js'+VERSION_QUERY,'./v500/animal-engine.js'+VERSION_QUERY,'./v500/store.js'+VERSION_QUERY,'./v500/ui.js'+VERSION_QUERY,
  './v500/taxonomy-core.js'+VERSION_QUERY,'./v500/taxonomy-store.js'+VERSION_QUERY,'./v500/taxonomy-cloud.js'+VERSION_QUERY,'./v500/taxonomy.js'+VERSION_QUERY,
  './v500/taxonomy-ui-illustrations.js'+VERSION_QUERY,'./v500/taxonomy-ui-animal-icons.js'+VERSION_QUERY,'./v500/taxonomy-ui-decoration.js'+VERSION_QUERY,'./v500/taxonomy-ui.js'+VERSION_QUERY,'./v500/care-rules-engine.js'+VERSION_QUERY,'./v500/sync-policy-engine.js'+VERSION_QUERY,
  './v500/assets/taxonomy/chameleon.png','./v500/assets/taxonomy/gecko.png','./v500/assets/taxonomy/python.png','./v500/assets/taxonomy/spider.png',
  './v500/ai-engine.js'+VERSION_QUERY,'./v500/ai-context.js'+VERSION_QUERY,'./v500/ai-query.js'+VERSION_QUERY,'./v500/ai-recommendations.js'+VERSION_QUERY,'./v500/ai-manager.js'+VERSION_QUERY,'./v500/ai-actions.js'+VERSION_QUERY,
  './v500/dashboard-data.js'+VERSION_QUERY,'./v500/smart-dashboard.js'+VERSION_QUERY,'./v500/photo-storage.js'+VERSION_QUERY,
  './v500/modules/dashboard.js'+VERSION_QUERY,'./v500/hkn-import.js'+VERSION_QUERY,'./v500/modules/animals-core.js'+VERSION_QUERY,'./v500/modules/animals-food.js'+VERSION_QUERY,'./v500/modules/animals-stock.js'+VERSION_QUERY,'./v500/modules/animals-editor.js'+VERSION_QUERY,'./v500/modules/animals.js'+VERSION_QUERY,'./v500/modules/offspring-core.js'+VERSION_QUERY,'./v500/modules/offspring-editor.js'+VERSION_QUERY,'./v500/modules/offspring.js'+VERSION_QUERY,
  './v500/modules/profile-core.js'+VERSION_QUERY,'./v500/modules/profile-history.js'+VERSION_QUERY,'./v500/modules/profile-food.js'+VERSION_QUERY,'./v500/modules/profile-health.js'+VERSION_QUERY,'./v500/modules/profile-passport.js'+VERSION_QUERY,'./v500/modules/profile-photos.js'+VERSION_QUERY,'./v500/modules/profile.js'+VERSION_QUERY,
  './v500/modules/food.js'+VERSION_QUERY,'./v500/modules/qr.js'+VERSION_QUERY,'./v500/modules/backup.js'+VERSION_QUERY,'./v500/modules/assistant-v2.js'+VERSION_QUERY,'./v500/modules/chat.js'+VERSION_QUERY,
  './v500/firebase-sync.js'+VERSION_QUERY,'./v500/app.js'+VERSION_QUERY
];

self.addEventListener('install',event=>{
 event.waitUntil(caches.open(TC_CACHE).then(cache=>cache.addAll(APP_SHELL)).then(()=>self.skipWaiting()));
});

self.addEventListener('activate',event=>{
 event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(key=>key.startsWith('terracontrol-')&&key!==TC_CACHE).map(key=>caches.delete(key)))).then(()=>self.clients.claim()));
});

async function cacheSuccessfulResponse(request,response){
 if(!response||!response.ok){
  return response;
 }

 const cache=await caches.open(TC_CACHE);
 await cache.put(
  request,
  response.clone()
 );

 return response;
}

async function networkFirst(request,options,fallbackRequest){
 try{
  const response=await fetch(
   request,
   options
  );

  if(response.ok){
   return cacheSuccessfulResponse(
    request,
    response
   );
  }

  const cached=await caches.match(request);
  return cached||response;

 }catch(error){
  const cached=await caches.match(request);

  if(cached){
   return cached;
  }

  if(fallbackRequest){
   const fallback=await caches.match(
    fallbackRequest
   );

   if(fallback){
    return fallback;
   }
  }

  throw error;
 }
}

self.addEventListener('fetch',event=>{
 if(event.request.method!=='GET')return;
 const url=new URL(event.request.url);
 if(url.origin!==location.origin)return;
 if(url.pathname.endsWith('.js')||url.pathname.endsWith('.css')||url.pathname.endsWith('/v500.html')){
  event.respondWith(
   networkFirst(
    event.request,
    {cache:'no-store'}
   )
  );
  return;
 }

 event.respondWith(
  networkFirst(
   event.request,
   undefined,
   './v500.html'+VERSION_QUERY
  )
 );
});
