(function(){
'use strict';

let statusTimer=null;

const DAY=86400000;

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

 const originalRoute=NGT500.route;

 NGT500.route=function(name,args,options){
  tc2(
   name==='dashboard'||
   name==='smartDashboard'
  );

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
    tc2(
     event&&(
      event.name==='dashboard'||
      event.name==='smartDashboard'
     )
    );
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

async function googleSignIn(){
 if(window.NGTFirebaseSync){
  await NGTFirebaseSync.signIn();
 }

 updateCloudStatus();
}

async function firestoreSave(){
 if(window.NGTFirebaseSync){
  await NGTFirebaseSync.saveCloud();
  updateCloudStatus();
 }
}

async function firestoreLoad(){
 if(
  !window.NGTFirebaseSync||
  !confirm(
   'Daten aus Firestore laden? Lokale Daten können überschrieben werden.'
  )
 ){
  return;
 }

 await NGTFirebaseSync.loadCloud();
 location.reload();
}

function openHknImport(){
 if(window.NGTHknImport){
  NGTHknImport.run();
 }else{
  alert('HKN-Import lädt noch.');
 }
}

function manualAnimal(){
 NGT500.route(
  'animals',
  {}
 );

 setTimeout(function(){
  if(
   window.NGTAnimals&&
   NGTAnimals.openEditor
  ){
   NGTAnimals.openEditor('');
  }
 },120);
}

function manualOffspring(){
 NGT500.route(
  'offspring',
  {}
 );

 setTimeout(function(){
  if(
   window.NGTOffspring&&
   NGTOffspring.openEditor
  ){
   NGTOffspring.openEditor('');
  }
 },120);
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

function isInactiveStatus(status){
 return [
  'Archiv',
  'Verkauft',
  'Abgegeben',
  'Verstorben'
 ].includes(status);
}

function isOffspringAnimal(animal){
 if(
  window.NGTIdManager&&
  NGTIdManager.isOffspring
 ){
  return NGTIdManager.isOffspring(animal);
 }

 return (
  String(
   (animal&&animal.status)||''
  ).toLowerCase()==='nachzucht'||

  String(
   (animal&&animal.collection)||''
  ).toLowerCase()==='offspring'||

  String(
   (animal&&animal.collection)||''
  ).toLowerCase()==='nachzuchten'
 );
}

function allAnimals(){
 try{
  return NGTStore
   .allAnimals()
   .filter(function(row){
    return (
     !isInactiveStatus(row.a.status)&&
     !isOffspringAnimal(row.a)
    );
   });

 }catch(error){
  return [];
 }
}

function allOffspring(){
 try{
  if(NGTStore.allOffspring){
   return NGTStore
    .allOffspring()
    .filter(function(row){
     return !isInactiveStatus(row.a.status);
    });
  }

  return NGTStore
   .allAnimals()
   .filter(function(row){
    return (
     !isInactiveStatus(row.a.status)&&
     isOffspringAnimal(row.a)
    );
   });

 }catch(error){
  return [];
 }
}

function foodInventory(){
 try{
  const data=NGTStore.data();

  return Array.isArray(data.foodInventory)
   ?data.foodInventory
   :[];

 }catch(error){
  return [];
 }
}

function foodItemQuantity(item){
 const quantity=Number(item&&item.qty);

 return Number.isFinite(quantity)
  ?quantity
  :0;
}

function foodItemMinimum(item){
 const minimum=Number(
  item&&(
   item.minimum!==undefined
    ?item.minimum
    :item.minQty
  )
 );

 return Number.isFinite(minimum)
  ?minimum
  :5;
}

function lowFoodCount(){
 return foodInventory().filter(function(item){
  return foodItemQuantity(item)<=
   Math.max(
    0,
    foodItemMinimum(item)
   );
 }).length;
}

function latest(list){
 return (
  Array.isArray(list)
   ?list
   :[]
 )
  .slice()
  .sort(function(a,b){
   return String(b.date||'')
    .localeCompare(
     String(a.date||'')
    );
  })[0]||null;
}

function todayStart(){
 const date=new Date();

 date.setHours(0,0,0,0);

 return date;
}

function daysSince(value){
 const timestamp=Date.parse(value||'');

 if(!timestamp){
  return null;
 }

 const date=new Date(timestamp);

 date.setHours(0,0,0,0);

 return Math.floor(
  (
   todayStart().getTime()-
   date.getTime()
  )/DAY
 );
}

function feedInterval(animal){
 return Math.max(
  1,
  Number(
   animal.feedIntervalDays||
   animal.feedingInterval||
   animal.feedInterval||
   14
  )
 );
}

function weightInterval(animal){
 return Math.max(
  1,
  Number(
   animal.weightIntervalDays||
   animal.weightInterval||
   30
  )
 );
}

function dueTaskCount(){
 let count=0;

 allAnimals()
  .concat(allOffspring())
  .forEach(function(row){
   const animal=row.a||{};

   const lastFeed=latest(animal.feeds);
   const feedDays=daysSince(
    lastFeed&&lastFeed.date
   );

   if(
    feedDays!==null&&
    feedDays>=feedInterval(animal)
   ){
    count++;
   }

   const lastWeight=latest(animal.weights);
   const weightDays=daysSince(
    lastWeight&&lastWeight.date
   );

   if(
    weightDays!==null&&
    weightDays>=weightInterval(animal)
   ){
    count++;
   }
  });

 return count;
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
  alert(
   'Foto-Migration ist noch nicht geladen.'
  );

  return;
 }

 const count=legacyPhotoCount();

 if(!count){
  alert(
   'Keine alten Base64-Fotos zum Migrieren gefunden.'
  );

  return;
 }

 if(
  !confirm(
   count+
   ' alte Foto(s) in den dauerhaften Foto-Speicher migrieren? Bitte währenddessen nicht schließen.'
  )
 ){
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

  NGTStore.save();

  if(
   window.NGTFirebaseSync&&
   NGTFirebaseSync.saveCloud
  ){
   await NGTFirebaseSync.saveCloud();
  }

  alert(
   (result.count||0)+
   ' Foto(s) migriert.'
  );

  NGT500.route('dashboard');

 }catch(error){
  console.error(error);

  alert(
   error&&error.message
    ?error.message
    :'Foto-Migration fehlgeschlagen.'
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

 const stockCount=allAnimals().length;
 const offspringCount=allOffspring().length;
 const foodCount=foodInventory().length;
 const lowCount=lowFoodCount();
 const tasks=dueTaskCount();

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

   <section class="tc21CloudToolbar">
    <button
     type="button"
     onclick="NGTDashboard.googleSignIn()"
    >
     <span>☁</span>
     <b>Anmelden</b>
    </button>

    <button
     type="button"
     onclick="NGTDashboard.firestoreSave()"
    >
     <span>↑</span>
     <b>Speichern</b>
    </button>

    <button
     type="button"
     onclick="NGTDashboard.firestoreLoad()"
    >
     <span>↓</span>
     <b>Laden</b>
    </button>
   </section>

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

     ${quickAction(
      '▱',
      'Dokument',
      'NGTDashboard.openHknImport()'
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
      '🥩',
      'Futterbestand',
      'Bestände und Kategorien verwalten',
      foodCount,
      "NGT500.route('food')",
      'food'
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
      '💬',
      'TerraControl KI',
      'Fragen stellen und Einträge erfassen',
      null,
      "NGT500.route('chat')",
      'ai'
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
  <div class="card">
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
 googleSignIn:googleSignIn,
 firestoreSave:firestoreSave,
 firestoreLoad:firestoreLoad,
 openHknImport:openHknImport,
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

})();