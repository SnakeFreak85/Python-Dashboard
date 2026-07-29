(function(){
'use strict';

let statusTimer=null;
let dataRefreshTimer=null;

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
}

window.NGTDashboard={
 updateCloudStatus:updateCloudStatus,
 manualAnimal:manualAnimal,
 manualOffspring:manualOffspring,
 toggleBestand:toggleBestand,
 toggleOffspring:toggleOffspring,
 openSmartDashboard:openSmartDashboard,
 migrateAllPhotos:migrateAllPhotos
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

if(NGT500.on){
 NGT500.on(
  'store:changed',
  scheduleDataRefresh
 );
}

})();
