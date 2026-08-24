const TC_VERSION='1.0.4-rc.11';
const TC_CACHE=
 'terracontrol-'+TC_VERSION+'-breeding-4-genetics-5-bulk-actions-1-household-1-i18n-4';
const VERSION_QUERY='?v='+TC_VERSION;
const LIGHT_THEME_QUERY=
 VERSION_QUERY+
 '&r=light-contrast-3-animal-archive-2';
const ANIMAL_ARCHIVE_QUERY=
 VERSION_QUERY+
 '&r=animal-archive-2';
const DATE_DISPLAY_QUERY=
 VERSION_QUERY+
 '&r=date-display-1';
const PROFILE_RECOMMENDATION_QUERY=
 VERSION_QUERY+
 '&r=profile-recommendation-1';
const PROFILE_MODULE_QUERY=
 VERSION_QUERY+
 '&r=animal-archive-2-profile-recommendation-1';
const TC2_POLISH_QUERY=
 VERSION_QUERY+
 '&r=tc2-polish-2-breeding-4-genetics-5-bulk-actions-1';
const BREEDING_QUERY=
 VERSION_QUERY+
 '&r=breeding-4-genetics-5';
const BULK_ACTIONS_QUERY=
 VERSION_QUERY+
 '&r=bulk-actions-1';
const ANIMAL_BULK_ACTIONS_QUERY=
 VERSION_QUERY+
 '&r=animal-archive-2-bulk-actions-1';
const OFFSPRING_BREEDING_QUERY=
 VERSION_QUERY+
 '&r=animal-archive-2-breeding-4-genetics-5-bulk-actions-1';
const HOUSEHOLD_QUERY=
 VERSION_QUERY+
 '&r=household-1';
const I18N_QUERY=
 VERSION_QUERY+
 '&r=i18n-4';

const APP_SHELL=[
 './',
 './index.html',
 './v500.html'+VERSION_QUERY,
 './manifest.json',
 './icon.svg',
 './icon-192.png',
 './icon-512.png',

 './v500/styles.css'+VERSION_QUERY,
 './v500/tc2.css'+LIGHT_THEME_QUERY,
 './v500/taxonomy-ui-color.css'+PROFILE_RECOMMENDATION_QUERY,
 './v500/theme.css'+LIGHT_THEME_QUERY,
 './v500/tc2-polish.css'+TC2_POLISH_QUERY+'-household-1',
 './v500/i18n.css'+I18N_QUERY,

 './v500/vendor/qrcode.min.js'+VERSION_QUERY,
 './v500/locales/de.js'+I18N_QUERY,
 './v500/locales/en.js'+I18N_QUERY,
 './v500/locales/it.js'+I18N_QUERY,
 './v500/locales/hu.js'+I18N_QUERY,
 './v500/i18n.js'+I18N_QUERY,

 './v500/core.js'+BULK_ACTIONS_QUERY,
 './v500/date-display.js'+DATE_DISPLAY_QUERY,
 './v500/theme.js'+VERSION_QUERY,
 './v500/id-manager.js'+VERSION_QUERY,
 './v500/food-inventory-engine.js'+VERSION_QUERY,
 './v500/animal-engine.js'+ANIMAL_ARCHIVE_QUERY,
 './v500/store.js'+BULK_ACTIONS_QUERY,
 './v500/ui.js'+VERSION_QUERY,

 './v500/taxonomy-core.js'+VERSION_QUERY,
 './v500/taxonomy-store.js'+VERSION_QUERY,
 './v500/taxonomy-cloud.js'+VERSION_QUERY,
 './v500/taxonomy.js'+VERSION_QUERY,
 './v500/taxonomy-ui-illustrations.js'+VERSION_QUERY,
 './v500/taxonomy-ui-animal-icons.js'+VERSION_QUERY,
 './v500/taxonomy-ui-decoration.js'+LIGHT_THEME_QUERY,
 './v500/taxonomy-ui.js'+VERSION_QUERY,

 './v500/care-rules-engine.js'+VERSION_QUERY,
 './v500/feeding-recommendation-engine.js'+PROFILE_RECOMMENDATION_QUERY,
 './v500/genetics-catalog.js'+BREEDING_QUERY,
 './v500/genetics-engine.js'+BREEDING_QUERY,
 './v500/sync-policy-engine.js'+BREEDING_QUERY,

 './v500/assets/taxonomy/chameleon.png',
 './v500/assets/taxonomy/gecko.png',
 './v500/assets/taxonomy/python.png',
 './v500/assets/taxonomy/spider.png',

 './v500/ai-engine.js'+VERSION_QUERY,
 './v500/ai-context.js'+VERSION_QUERY,
 './v500/ai-query.js'+VERSION_QUERY,
 './v500/ai-recommendations.js'+VERSION_QUERY,
 './v500/ai-manager.js'+VERSION_QUERY,
 './v500/ai-actions.js'+VERSION_QUERY,

 './v500/dashboard-data.js'+BREEDING_QUERY,
 './v500/smart-dashboard.js'+BREEDING_QUERY,
 './v500/photo-storage.js'+HOUSEHOLD_QUERY,

 './v500/modules/dashboard.js'+BULK_ACTIONS_QUERY,
 './v500/hkn-import.js'+VERSION_QUERY,

 './v500/modules/animals-core.js'+ANIMAL_ARCHIVE_QUERY,
 './v500/modules/animals-food.js'+VERSION_QUERY,
 './v500/modules/animals-stock.js'+ANIMAL_ARCHIVE_QUERY,
 './v500/modules/animals-editor.js'+BREEDING_QUERY,
 './v500/modules/animals.js'+ANIMAL_BULK_ACTIONS_QUERY,

 './v500/modules/offspring-core.js'+ANIMAL_ARCHIVE_QUERY,
 './v500/modules/offspring-editor.js'+OFFSPRING_BREEDING_QUERY,
 './v500/modules/offspring.js'+OFFSPRING_BREEDING_QUERY,
 './v500/modules/breeding.js'+BREEDING_QUERY,

 './v500/modules/profile-core.js'+ANIMAL_ARCHIVE_QUERY,
 './v500/modules/profile-history.js'+VERSION_QUERY,
 './v500/modules/profile-food.js'+BULK_ACTIONS_QUERY,
 './v500/modules/profile-health.js'+VERSION_QUERY,
 './v500/modules/profile-passport.js'+VERSION_QUERY,
 './v500/modules/profile-photos.js'+VERSION_QUERY,
 './v500/modules/profile.js'+PROFILE_MODULE_QUERY,

 './v500/modules/food.js'+VERSION_QUERY,
 './v500/modules/qr.js'+VERSION_QUERY,
 './v500/modules/backup.js'+BREEDING_QUERY,
 './v500/modules/assistant-v2.js'+VERSION_QUERY,
 './v500/modules/chat.js'+VERSION_QUERY,

 './v500/household-engine.js'+HOUSEHOLD_QUERY,
 './v500/firebase-sync.js'+HOUSEHOLD_QUERY,
 './v500/modules/account.js'+HOUSEHOLD_QUERY,
 './v500/support-service.js'+VERSION_QUERY,
 './v500/announcement-service.js'+VERSION_QUERY,
 './v500/modules/support.js'+VERSION_QUERY,
 './v500/modules/announcements.js'+VERSION_QUERY,
 './v500/app.js'+HOUSEHOLD_QUERY
];

self.addEventListener(
 'install',
 function(event){
  event.waitUntil(
   caches
    .open(TC_CACHE)
    .then(
     function(cache){
      return cache.addAll(
       APP_SHELL
      );
     }
    )
    .then(
     function(){
      return self.skipWaiting();
     }
    )
  );
 }
);

self.addEventListener(
 'activate',
 function(event){
  event.waitUntil(
   caches
    .keys()
    .then(
     function(keys){
      return Promise.all(
       keys
        .filter(
         function(key){
          return (
           key.startsWith(
            'terracontrol-'
           )&&
           key!==TC_CACHE
          );
         }
        )
        .map(
         function(key){
          return caches.delete(key);
         }
        )
      );
     }
    )
    .then(
     function(){
      return self.clients.claim();
     }
    )
  );
 }
);

async function cacheSuccessfulResponse(
 request,
 response
){
 if(!response||!response.ok){
  return response;
 }

 const cache=
  await caches.open(
   TC_CACHE
  );

 await cache.put(
  request,
  response.clone()
 );

 return response;
}

async function networkFirst(
 request,
 options,
 fallbackRequest
){
 try{
  const response=
   await fetch(
    request,
    options
   );

  if(response.ok){
   return cacheSuccessfulResponse(
    request,
    response
   );
  }

  const cached=
   await caches.match(
    request
   );

  return cached||response;

 }catch(error){
  const cached=
   await caches.match(
    request
   );

  if(cached){
   return cached;
  }

  if(fallbackRequest){
   const fallback=
    await caches.match(
     fallbackRequest
    );

   if(fallback){
    return fallback;
   }
  }

  throw error;
 }
}

self.addEventListener(
 'fetch',
 function(event){
  if(
   event.request.method!=='GET'
  ){
   return;
  }

  const url=
   new URL(
    event.request.url
   );

  if(
   url.origin!==location.origin
  ){
   return;
  }

  if(
   url.pathname.endsWith('.js')||
   url.pathname.endsWith('.css')||
   url.pathname.endsWith('/v500.html')
  ){
   event.respondWith(
    networkFirst(
     event.request,
     {
      cache:'no-store'
     }
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
 }
);
