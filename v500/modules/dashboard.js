(function(){
'use strict';

let statusTimer=null;
let dataRefreshTimer=null;
let announcement=null;
let announcementUnsubscribe=null;
let announcementListening=false;
let announcementRevision=0;

const ANNOUNCEMENT_SEEN_KEY=
 'terracontrol_announcement_seen_v1';

function tc2(on){
 document.body.classList.toggle(
  'tc2RefMode',
  !!on
 );
}

function installRouteGuard(){
 if(
  !window.NGT500||
  NGT500.__tc2RouteGuardInstalled
 ){
  return;
 }

 NGT500.__tc2RouteGuardInstalled=true;

 tc2(true);

 const originalRoute=NGT500.route;

 NGT500.route=function(name,args,options){
  tc2(true);

  return originalRoute.call(
   NGT500,
   name,
   args,
   options
  );
 };

 if(NGT500.on){
  NGT500.on(
   'route',
   function(event){
    tc2(true);
   }
  );
 }
}

installRouteGuard();

function esc(value){
 return NGT500.esc(value||'');
}

function userName(){
 const keys=[
  'tc_user_profile',
  'terracontrol_user',
  'ngt_user',
  'ngt_google_user'
 ];

 for(const key of keys){
  try{
   const user=JSON.parse(
    localStorage.getItem(key)||'{}'
   );

   if(user.given_name){
    return user.given_name;
   }

   if(user.name){
    return String(user.name).split(' ')[0];
   }

   if(user.displayName){
    return String(user.displayName).split(' ')[0];
   }

  }catch(error){}
 }

 return '';
}

function cloudLabel(){
 try{
  return window.NGTFirebaseSync
   ?NGTFirebaseSync.label()
   :'Firebase-Anmeldung nötig';

 }catch(error){
  return 'Firebase-Anmeldung nötig';
 }
}

function updateCloudStatus(){
 const element=document.getElementById(
  'dashboardCloudStatus'
 );

 if(element){
  element.textContent=cloudLabel();
 }
}

function announcementKey(value){
 if(!value){
  return '';
 }

 return String(
  value.publishedAtMs||
  ''
 );
}

function announcementSeen(value){
 try{
  return (
   announcementKey(value)&&
   localStorage.getItem(
    ANNOUNCEMENT_SEEN_KEY
   )===announcementKey(value)
  );
 }catch(error){
  return false;
 }
}

function renderAnnouncement(){
 if(
  !announcement||
  announcementSeen(announcement)
 ){
  return '';
 }

 return `
  <section class="tc2AnnouncementCard tc2StartAnnouncement ${announcement.important?'important':''}">
   <span class="tc2AnnouncementIcon">${announcement.important?'!':'i'}</span>

   <div>
    <small>${announcement.important?'Wichtige Mitteilung':'Mitteilung'}</small>
    <h3>${esc(announcement.title)}</h3>
    <p>${esc(announcement.message).replace(/\n/g,'<br>')}</p>
   </div>

   <button
    type="button"
    onclick="NGTDashboard.acknowledgeAnnouncement()"
    aria-label="Mitteilung als gelesen markieren"
   >
    Gelesen
   </button>
  </section>
 `;
}

function stopAnnouncementListener(){
 announcementRevision++;

 if(announcementUnsubscribe){
  try{
   announcementUnsubscribe();
  }catch(error){}
 }

 announcementUnsubscribe=null;
 announcementListening=false;
 announcement=null;
}

async function startAnnouncementListener(){
 if(
  announcementListening||
  announcementUnsubscribe||
  !window.NGTAnnouncementService||
  !window.NGTFirebaseSync||
  !NGTFirebaseSync.currentUser||
  !NGTFirebaseSync.currentUser()
 ){
  return;
 }

 const revision=++announcementRevision;
 announcementListening=true;

 try{
  const listener=
   await NGTAnnouncementService.listenCurrent(
    function(value){
     if(revision!==announcementRevision){
      return;
     }

     announcement=value;

     const current=
      NGT500.current&&
      NGT500.current();

     if(
      current&&
      current.name==='dashboard'
     ){
      NGT500.route(
       'dashboard',
       {},
       {
        replace:true,
        noHistory:true
       }
      );
     }
    },
    function(message,error){
     console.warn(
      message,
      error||''
     );
    }
   );

  if(revision===announcementRevision){
   announcementUnsubscribe=listener;
   announcementListening=false;
  }else if(listener){
   listener();
  }
 }catch(error){
  if(revision===announcementRevision){
   announcementListening=false;
  }

  console.warn(
   'Mitteilungen konnten nicht geladen werden.',
   error
  );
 }
}

function acknowledgeAnnouncement(){
 if(!announcement){
  return;
 }

 try{
  localStorage.setItem(
   ANNOUNCEMENT_SEEN_KEY,
   announcementKey(announcement)
  );
 }catch(error){}

 NGT500.route(
  'dashboard',
  {},
  {
   replace:true,
   noHistory:true
  }
 );
}

function refreshVisibleDashboard(){
 if(
  !window.NGT500||
  !NGT500.current
 ){
  return;
 }

 const current=NGT500.current();

 if(
  !current||
  (
   current.name!=='dashboard'&&
   current.name!=='smartDashboard'
  )
 ){
  return;
 }

 NGT500.route(
  current.name,
  current.args||{},
  {
   replace:true,
   noHistory:true
  }
 );
}

function scheduleDataRefresh(){
 clearTimeout(dataRefreshTimer);

 dataRefreshTimer=setTimeout(
  refreshVisibleDashboard,
  0
 );
}

function manualAnimal(){
 NGT500.route(
  'animals',
  {create:1}
 );
}

function manualOffspring(){
 NGT500.route(
  'offspring',
  {create:1}
 );
}

/*
 * Bleiben aus Kompatibilitätsgründen erhalten.
 * Auf der neuen Startseite werden die Bereiche
 * nicht mehr aufgeklappt.
 */
function toggleBestand(){
 NGT500.route('animals',{});
}

function toggleOffspring(){
 NGT500.route('offspring',{});
}

function openSmartDashboard(){
 NGT500.route('smartDashboard');
}

function legacyPhotoCount(){
 try{
  if(
   !window.NGTPhotoStorage||
   !NGTPhotoStorage.hasLegacyPhotos
  ){
   return 0;
  }

  return NGTStore
   .allAnimals()
   .reduce(function(total,row){
    const animal=row.a||{};

    if(
     !NGTPhotoStorage.hasLegacyPhotos(animal)
    ){
     return total;
    }

    return total+(
     animal.photos||[]
    ).filter(function(photo){
     return (
      photo&&
      photo.data&&
      String(photo.data).startsWith(
       'data:image'
      )&&
      !photo.storagePath&&
      !photo.url
     );
    }).length;
   },0);

 }catch(error){
  return 0;
 }
}

async function migrateAllPhotos(){
 if(
  !window.NGTPhotoStorage||
  !NGTPhotoStorage.migrateAll
 ){
  NGT500.toast(
   'Foto-Migration ist noch nicht geladen.',
   'warn'
  );

  return;
 }

 const count=legacyPhotoCount();

 if(!count){
  NGT500.toast(
   'Keine alten Base64-Fotos zum Migrieren gefunden.',
   'ok'
  );

  return;
 }

 if(!await NGT500.confirmAction(
  count+
  ' alte Foto(s) in den dauerhaften Foto-Speicher migrieren? Bitte währenddessen nicht schließen.',
  {
   title:'Alte Fotos migrieren',
   confirmText:'Migration starten'
  }
 )){
  return;
 }

 const element=document.getElementById(
  'photoMigrationStatusGlobal'
 );

 if(element){
  element.textContent=
   'Migration läuft... 0 / '+count;
 }

 try{
  const result=await NGTPhotoStorage.migrateAll(
   function(info){
    const current=
     info&&info.count
      ?info.count
      :0;

    const statusElement=
     document.getElementById(
      'photoMigrationStatusGlobal'
     );

    if(statusElement){
     statusElement.textContent=
      'Migration läuft... '+
      current+
      ' / '+
      count;
    }
   }
  );

  if(
   window.NGTFirebaseSync&&
   NGTFirebaseSync.saveCloud
  ){
   await NGTFirebaseSync.saveCloud();
  }

  NGT500.toast(
   (result.count||0)+
   ' Foto(s) migriert.',
   'ok'
  );

  NGT500.route('dashboard');

 }catch(error){
  console.error(error);

  NGT500.toast(
   error&&error.message
    ?error.message
    :'Foto-Migration fehlgeschlagen.',
   'danger'
  );
 }
}

function stat(
 icon,
 value,
 label,
 className
){
 return `
  <div class="tc21StartStat ${className||''}">
   <span>${icon}</span>

   <b>${value}</b>

   <small>${esc(label)}</small>
  </div>
 `;
}

function navigationCard(
 icon,
 title,
 subtitle,
 count,
 action,
 className
){
 return `
  <button
   type="button"
   class="tc21StartNavCard ${className||''}"
   onclick="${action}"
  >
   <span class="tc21StartNavIcon">
    ${icon}
   </span>

   <span class="tc21StartNavText">
    <b>${esc(title)}</b>
    <small>${esc(subtitle)}</small>
   </span>

   ${
    count!==null&&count!==undefined
     ?`<strong>${count}</strong>`
     :''
   }

   <em>›</em>
  </button>
 `;
}

function quickAction(
 icon,
 title,
 action
){
 return `
  <button
   type="button"
   class="tc21StartQuick"
   onclick="${action}"
  >
   <span>${icon}</span>
   <b>${esc(title)}</b>
  </button>
 `;
}

function bulkFoodInventory(){
 return FoodInventoryEngine.sortInventory(NGTStore.foodInventory());
}

function bulkFoodById(id){
 return FoodInventoryEngine.findById(NGTStore.foodInventory(),id);
}

function bulkDefaultFood(animal){
 const stored=String(animal.defaultFeederId||animal.foodInventoryId||'').trim();
 if(stored&&bulkFoodById(stored))return bulkFoodById(stored);

 const legacy=String(animal.defaultFeeder||animal.futterStandard||animal.standardFeed||'').trim();
 if(!legacy)return null;

 return bulkFoodInventory().find(function(item){
  return FoodInventoryEngine.itemLabel(item)===legacy||
   String(item.label||item.name||'').trim()===legacy;
 })||null;
}

function bulkAnimalLabel(animal){
 const publicId=String(animal.publicId||animal.displayId||'').trim();
 const name=String(AnimalEngine.getDisplayName(animal)||'Unbenannt').trim();
 return publicId&&publicId!==name?publicId+' · '+name:name;
}

function bulkFeedAnimals(){
 return NGTStore.allAnimals().filter(function(row){
  return AnimalEngine.isActiveAnimal(row.a);
 }).sort(function(a,b){
  return bulkAnimalLabel(a.a).localeCompare(bulkAnimalLabel(b.a),'de');
 });
}

function bulkFeedRow(row){
 const animal=row.a;
 const animalId=NGTStore.animalId(animal);
 const food=bulkDefaultFood(animal);
 const foodId=food&&food.id||'';
 const foodLabel=food?FoodInventoryEngine.itemLabel(food):'Kein Standardfutter hinterlegt';
 const stock=food?FoodInventoryEngine.quantity(food):0;

 return `<div class="tc2BulkFeedAnimal ${food?'':'is-missing'}" data-animal-id="${esc(animalId)}" data-food-id="${esc(foodId)}">
  <label class="tc2BulkFeedPick">
   <input type="checkbox" class="tc2BulkFeedCheck" value="${esc(animalId)}" ${food?'':'disabled'} onchange="NGTDashboard.updateBulkFeedSelection()">
   <span><b>${esc(bulkAnimalLabel(animal))}</b><small>${esc(animal.animalGroup||'Unsortiert')}</small></span>
  </label>
  <div class="tc2BulkFeedFood"><b>${esc(foodLabel)}</b>${food?`<small>${stock} ${esc(food.unit||'Stück')} vorhanden</small>`:'<small>Im Tierprofil zuerst ein Standardfutter auswählen.</small>'}</div>
  ${food?`<label><span>Anzahl</span><input class="tc2BulkFeedQuantity" type="number" inputmode="numeric" min="1" step="1" value="1"></label><label><span>Ergebnis</span><select class="tc2BulkFeedStatus"><option value="ok">Gefressen</option><option value="no">Verweigert</option></select></label>`:''}
 </div>`;
}

function renderBulkFeed(){
 const rows=bulkFeedAnimals();

 return `<section class="tc2PageCard tc2BulkFeedPage">
  <div class="tc2BulkFeedHero"><span>🍽️</span><div><h2>Sammelfütterung</h2><p>Mehrere Tiere mit ihrem hinterlegten Standardfutter erfassen.</p></div></div>
  <div class="tc2BulkFeedNotice">Auch bei „Verweigert“ wird die bereitgestellte Menge vom Futterbestand abgezogen.</div>
  <label class="tc2BulkFeedDate"><span>Datum</span><input id="bulkFeedDate" type="date" value="${NGT500.today()}"></label>
  <div class="tc2BulkFeedToolbar"><b id="bulkFeedSelectionCount">0 Tiere ausgewählt</b><button type="button" onclick="NGTDashboard.toggleAllBulkFeed(true)">Alle mit Standardfutter</button><button type="button" onclick="NGTDashboard.toggleAllBulkFeed(false)">Auswahl aufheben</button></div>
  <div class="tc2BulkFeedRows">${rows.map(bulkFeedRow).join('')||'<p class="muted">Keine aktiven Tiere vorhanden.</p>'}</div>
  <div class="tc2BulkFeedActions"><button type="button" onclick="NGT500.back()">Abbrechen</button><button type="button" id="bulkFeedSave" disabled onclick="NGTDashboard.saveBulkFeed()">Fütterungen speichern</button></div>
 </section>`;
}

function selectedBulkFeedRequests(){
 const dateField=document.getElementById('bulkFeedDate');
 const date=dateField&&dateField.value||NGT500.today();
 const requests=[];

 document.querySelectorAll('.tc2BulkFeedCheck:checked').forEach(function(check){
  const row=check.closest('.tc2BulkFeedAnimal');
  const quantityField=row&&row.querySelector('.tc2BulkFeedQuantity');
  const statusField=row&&row.querySelector('.tc2BulkFeedStatus');
  const quantity=Number(quantityField&&quantityField.value);
  const food=bulkFoodById(row&&row.dataset.foodId);

  requests.push({
   animalId:check.value,
   date:date,
   foodInventoryId:food&&food.id||'',
   category:food&&food.category||'',
   condition:food&&food.condition||'',
   prey:food&&food.itemName||'',
   variantLabel:food&&food.variant||'',
   unit:food&&food.unit||'Stück',
   quantity:quantity,
   displayLabel:food?FoodInventoryEngine.itemLabel(food):'',
   accepted:!statusField||statusField.value!=='no',
   source:'bulk'
  });
 });

 return requests;
}

function updateBulkFeedSelection(){
 const count=document.querySelectorAll('.tc2BulkFeedCheck:checked').length;
 const label=document.getElementById('bulkFeedSelectionCount');
 const save=document.getElementById('bulkFeedSave');
 if(label)label.textContent=count+' Tier'+(count===1?'':'e')+' ausgewählt';
 if(save)save.disabled=count===0;
}

function toggleAllBulkFeed(checked){
 document.querySelectorAll('.tc2BulkFeedCheck:not(:disabled)').forEach(function(input){input.checked=checked;});
 updateBulkFeedSelection();
}

async function saveBulkFeed(){
 const requests=selectedBulkFeedRequests();
 if(!requests.length)return;

 if(requests.some(function(row){return !Number.isSafeInteger(row.quantity)||row.quantity<1;})){
  NGT500.toast('Bitte für jedes ausgewählte Tier eine ganze Anzahl ab 1 eintragen.','warn');
  return;
 }

 const totals={};
 requests.forEach(function(row){totals[row.foodInventoryId]=(totals[row.foodInventoryId]||0)+row.quantity;});
 for(const foodId of Object.keys(totals)){
  const food=bulkFoodById(foodId);
  const stock=food?FoodInventoryEngine.quantity(food):0;
  if(!food||totals[foodId]>stock){
   NGT500.toast((food?FoodInventoryEngine.itemLabel(food):'Futterbestand')+': benötigt '+totals[foodId]+', vorhanden '+stock+'.','danger');
   return;
  }
 }

 if(!await NGT500.confirmAction(
  requests.length+' Fütterung'+(requests.length===1?'':'en')+' speichern und alle bereitgestellten Futtertiere vom Bestand abziehen?',
  {title:'Sammelfütterung speichern',confirmText:'Fütterungen speichern'}
 ))return;

 const result=NGTStore.recordFeedsBulk(requests);
 if(!result||!result.ok){
  NGT500.toast(result&&result.error||'Die Sammelfütterung konnte nicht gespeichert werden.','danger');
  return;
 }

 NGT500.toast(result.count+' Fütterung'+(result.count===1?' wurde':'en wurden')+' gespeichert.','success');
 NGT500.route('dashboard',{}, {replace:true,noHistory:true});
}

function renderPhotoMigrationCard(){
 const count=legacyPhotoCount();

 if(!count){
  return '';
 }

 return `
  <section class="tc21StartMigration">
   <span>📷</span>

   <div>
    <b>Alte Fotos migrieren</b>

    <small>
     ${count} Foto(s) warten auf Firebase Storage
    </small>

    <small id="photoMigrationStatusGlobal"></small>
   </div>

   <button
    type="button"
    onclick="NGTDashboard.migrateAllPhotos()"
   >
    Starten
   </button>
  </section>
 `;
}

function render(){
 tc2(true);

 const name=userName();

 const stockCount=
  NGTDashboardData.stockAnimals().length;
 const offspringCount=
  NGTDashboardData.offspringAnimals().length;
 const foodCount=
  NGTDashboardData.foodInventory().length;
 const lowCount=
  NGTDashboardData.lowFood().length;
 const tasks=
   NGTDashboardData.dueTaskCount(0);
 const breedingCount=
  NGTStore.breedingPlans
   ?NGTStore.breedingPlans().filter(function(plan){
     return ![
      'completed',
      'cancelled',
      'archived'
     ].includes(plan.status);
    }).length
   :0;

 return `
  <section class="tc2Screen tc2Start tc21Start">

   <header class="tc2AppTop">
    <button
     class="tc2Menu"
     onclick="NGT500.openMenu()"
    >
     ☰
    </button>

    <div class="tc2HeadTitle">
     <h1>TerraControl</h1>
     <p>Version 1.0.4 RC11</p>
    </div>

    <div class="tc2Sync">
     <span>☁</span>

     <b id="dashboardCloudStatus">
      ${esc(cloudLabel())}
     </b>

     <small>Heute</small>
    </div>

    <div class="tc2Avatar">
     TC
    </div>
   </header>

   <section class="tc21Welcome">
    <div>
     <h2>
      Hallo${name?' '+esc(name):''} 👋
     </h2>

     <p>
      ${stockCount+offspringCount}
      Tiere ·
      ${tasks}
      ${
       tasks===1
        ?'Aufgabe'
        :'Aufgaben'
      }
      fällig
     </p>
    </div>

    <span>🐍</span>
   </section>

   ${renderAnnouncement()}

   <section class="tc21StartStats">
    ${stat(
     '🐾',
     stockCount,
     'Bestand',
     'animals'
    )}

    ${stat(
     '🥚',
     offspringCount,
     'Nachzuchten',
     'offspring'
    )}

    ${stat(
     '🥩',
     foodCount,
     'Futter',
     'food'
    )}

    ${stat(
     '!',
     lowCount,
     'Niedrig',
     lowCount?'warn':'ok'
    )}
   </section>

   ${renderPhotoMigrationCard()}

   <section class="tc21StartQuickSection">
    <div class="tc21StartSectionHead">
     <h2>Schnell erfassen</h2>
    </div>

    <div class="tc21StartQuickGrid">
     ${quickAction(
      '＋',
      'Tier',
      'NGTDashboard.manualAnimal()'
     )}

     ${quickAction(
      '🥚',
      'Nachzucht',
      'NGTDashboard.manualOffspring()'
     )}

     ${quickAction(
      'ϟ',
      'Schnelleingabe',
      "NGT500.route('assistant')"
     )}

     ${quickAction(
      '🍽️',
      'Sammelfütterung',
      "NGT500.route('bulkFeed')"
     )}

    </div>
   </section>

   <section class="tc21StartNavigation">
    <div class="tc21StartSectionHead">
     <h2>Bereiche</h2>
    </div>

    <div class="tc21StartNavList">
     ${navigationCard(
      '●●●',
      'Bestand',
      'Tiergruppen und Tiere öffnen',
      stockCount,
      "NGT500.route('animals',{})",
      'animals'
     )}

     ${navigationCard(
      '🥚',
      'Nachzuchten',
      'Eigener Bereich und Nummernkreis',
      offspringCount,
      "NGT500.route('offspring',{})",
      'offspring'
     )}

     ${navigationCard(
      '▥',
      'Smart Dashboard',
      tasks+
       ' fällige '+
       (
        tasks===1
         ?'Aufgabe'
         :'Aufgaben'
       ),
      null,
      'NGTDashboard.openSmartDashboard()',
      'dashboard'
     )}

     ${navigationCard(
      '⚭',
      'Verpaarungsplanung',
      'Verpaarungen, Gelege, Würfe und Inkubation',
      breedingCount,
      "NGT500.route('breeding')",
      'breeding'
     )}

    </div>
   </section>

  </section>
 `;
}

function smartDashboardProxy(){
 if(
  window.NGTSmartDashboard&&
  NGTSmartDashboard.render
 ){
  return NGTSmartDashboard.render();
 }

 return `
  <div class="tc2PageCard tc2EmptyState">
   <h2>Smart Dashboard</h2>

   <p class="muted">
    Smart Dashboard lädt noch.
   </p>
  </div>
 `;
}

function afterRender(){
 tc2(true);
 updateCloudStatus();

 if(statusTimer){
  clearInterval(statusTimer);
 }

 statusTimer=setInterval(
  updateCloudStatus,
  1500
 );

 startAnnouncementListener();
}

window.NGTDashboard={
 updateCloudStatus:updateCloudStatus,
 manualAnimal:manualAnimal,
 manualOffspring:manualOffspring,
 toggleBestand:toggleBestand,
 toggleOffspring:toggleOffspring,
 openSmartDashboard:openSmartDashboard,
 migrateAllPhotos:migrateAllPhotos,
 acknowledgeAnnouncement:
  acknowledgeAnnouncement,
 updateBulkFeedSelection:updateBulkFeedSelection,
 toggleAllBulkFeed:toggleAllBulkFeed,
 saveBulkFeed:saveBulkFeed
};

NGT500.register(
 'dashboard',
 {
  render:render,
  afterRender:afterRender
 }
);

NGT500.register(
 'smartDashboard',
 {
  render:smartDashboardProxy
 }
);

NGT500.register(
 'bulkFeed',
 {render:renderBulkFeed}
);

if(NGT500.on){
 NGT500.on(
  'store:changed',
  scheduleDataRefresh
 );

 NGT500.on(
  'firebase:auth',
  function(event){
   if(
    !event||
    !event.signedIn
   ){
    stopAnnouncementListener();
    return;
   }

   startAnnouncementListener();
  }
 );
}

})();
