(function(){
'use strict';

let statusTimer=null;

function tc2(on){
  document.body.classList.toggle('tc2RefMode',!!on);
}

function installRouteGuard(){
  if(!window.NGT500 || NGT500.__tc2RouteGuardInstalled)return;
  NGT500.__tc2RouteGuardInstalled=true;

  const originalRoute=NGT500.route;
  NGT500.route=function(name,args){
    tc2(name==='dashboard'||name==='smartDashboard');
    return originalRoute.call(NGT500,name,args);
  };

  if(NGT500.on){
    NGT500.on('route',function(e){
      tc2(e&&(e.name==='dashboard'||e.name==='smartDashboard'));
    });
  }
}

installRouteGuard();

function esc(v){return NGT500.esc(v||'')}

function userName(){
  const keys=['tc_user_profile','terracontrol_user','ngt_user','ngt_google_user'];
  for(const k of keys){
    try{
      const u=JSON.parse(localStorage.getItem(k)||'{}');
      if(u.given_name)return u.given_name;
      if(u.name)return String(u.name).split(' ')[0];
      if(u.displayName)return String(u.displayName).split(' ')[0];
    }catch(e){}
  }
  return '';
}

function cloudLabel(){
  try{
    return window.NGTFirebaseSync?NGTFirebaseSync.label():'Firebase-Anmeldung nötig';
  }catch(e){
    return 'Firebase-Anmeldung nötig';
  }
}

function updateCloudStatus(){
  const el=document.getElementById('dashboardCloudStatus');
  if(el)el.textContent=cloudLabel();
}

async function googleSignIn(){
  if(window.NGTFirebaseSync)await NGTFirebaseSync.signIn();
  updateCloudStatus();
}

async function firestoreSave(){
  if(window.NGTFirebaseSync){
    await NGTFirebaseSync.saveCloud();
    updateCloudStatus();
  }
}

async function firestoreLoad(){
  if(window.NGTFirebaseSync&&confirm('Daten aus Firestore laden? Lokale Daten können überschrieben werden.')){
    await NGTFirebaseSync.loadCloud();
    location.reload();
  }
}

function openHknImport(){
  if(window.NGTHknImport)NGTHknImport.run();
  else alert('HKN-Import lädt noch.');
}

function manualAnimal(){
  NGT500.route('animals',{});
  setTimeout(function(){
    if(window.NGTAnimals&&NGTAnimals.openEditor)NGTAnimals.openEditor('');
  },120);
}

function manualOffspring(){
  NGT500.route('offspring',{});
  setTimeout(function(){
    if(window.NGTOffspring&&NGTOffspring.openEditor)NGTOffspring.openEditor('');
  },120);
}

function toggleBestand(){
  const el=document.getElementById('bestandPanel');
  if(el)el.classList.toggle('hidden');
}

function toggleOffspring(){
  const el=document.getElementById('offspringPanel');
  if(el)el.classList.toggle('hidden');
}

function openSmartDashboard(){
  NGT500.route('smartDashboard');
}

function isInactiveStatus(status){
  return ['Archiv','Verkauft','Abgegeben','Verstorben'].includes(status);
}

function isOffspringAnimal(a){
  if(window.NGTIdManager&&NGTIdManager.isOffspring)return NGTIdManager.isOffspring(a);
  return String((a&&a.status)||'').toLowerCase()==='nachzucht' ||
    String((a&&a.collection)||'').toLowerCase()==='offspring' ||
    String((a&&a.collection)||'').toLowerCase()==='nachzuchten';
}

function allAnimals(){
  try{
    return NGTStore.allAnimals().filter(function(x){
      return !isInactiveStatus(x.a.status) && !isOffspringAnimal(x.a);
    });
  }catch(e){
    return [];
  }
}

function allOffspring(){
  try{
    if(NGTStore.allOffspring)return NGTStore.allOffspring().filter(function(x){
      return !isInactiveStatus(x.a.status);
    });

    return NGTStore.allAnimals().filter(function(x){
      return !isInactiveStatus(x.a.status) && isOffspringAnimal(x.a);
    });
  }catch(e){
    return [];
  }
}

function legacyPhotoCount(){
  try{
    if(!window.NGTPhotoStorage||!NGTPhotoStorage.hasLegacyPhotos)return 0;

    return NGTStore.allAnimals().reduce(function(n,x){
      const a=x.a||{};
      if(!NGTPhotoStorage.hasLegacyPhotos(a))return n;

      return n+(a.photos||[]).filter(function(p){
        return p&&p.data&&String(p.data).startsWith('data:image')&&!p.storagePath&&!p.url;
      }).length;
    },0);
  }catch(e){
    return 0;
  }
}

async function migrateAllPhotos(){
  if(!window.NGTPhotoStorage||!NGTPhotoStorage.migrateAll){
    alert('Foto-Migration ist noch nicht geladen.');
    return;
  }

  const count=legacyPhotoCount();

  if(!count){
    alert('Keine alten Base64-Fotos zum Migrieren gefunden.');
    return;
  }

  if(!confirm(count+' alte Foto(s) in den dauerhaften Foto-Speicher migrieren? Bitte währenddessen nicht schließen.')){
    return;
  }

  const el=document.getElementById('photoMigrationStatusGlobal');
  if(el)el.textContent='Migration läuft... 0 / '+count;

  try{
    const res=await NGTPhotoStorage.migrateAll(function(info){
      const now=info&&info.count?info.count:0;
      const box=document.getElementById('photoMigrationStatusGlobal');
      if(box)box.textContent='Migration läuft... '+now+' / '+count;
    });

    NGTStore.save();

    if(window.NGTFirebaseSync&&NGTFirebaseSync.saveCloud){
      await NGTFirebaseSync.saveCloud();
    }

    alert((res.count||0)+' Foto(s) migriert.');
    NGT500.route('dashboard');

  }catch(e){
    console.error(e);
    alert(e&&e.message?e.message:'Foto-Migration fehlgeschlagen.');
  }
}

function groupRows(list){
  const rows=[];
  const animals=list||[];
  const map={};

  animals.forEach(function(x){
    const group=x.a.animalGroup||'Unsortiert';
    if(!map[group])map[group]=0;
    map[group]++;
  });

  Object.keys(map).sort().forEach(function(group){
    rows.push({
      group:group,
      count:map[group],
      label:group
    });
  });

  return rows;
}

function quick(icon,title,sub,onclick){
  return `<button class="tc2Quick" onclick="${onclick}">
    <span class="tc2GreenIcon">${icon}</span>
    <span><b>${esc(title)}</b><small>${esc(sub)}</small></span>
    <em>›</em>
  </button>`;
}

function jsArg(v){
  return String(v||'').replace(/\\/g,'\\\\').replace(/'/g,"\\'");
}

function renderBestandButtons(){
  const rows=groupRows(allAnimals());

  if(!rows.length){
    return `<div class="tc2Empty">
      <b>Noch keine Tiere im Bestand.</b>
      <small>Lege dein erstes Tier an oder lade deine Cloud-Daten.</small>
    </div>`;
  }

  return rows.map(function(r){
    return `<button onclick="NGT500.route('animals',{group:'${jsArg(r.group)}'})">
      <span>●●●</span>
      <b>${esc(r.label)}</b>
      <small>${r.count}</small>
    </button>`;
  }).join('');
}

function renderOffspringButtons(){
  const rows=groupRows(allOffspring());

  if(!rows.length){
    return `<div class="tc2Empty">
      <b>Noch keine Nachzuchten.</b>
      <small>Lege Nachzuchten an, sobald Tiere geschlüpft oder geboren sind.</small>
    </div>`;
  }

  return rows.map(function(r){
    return `<button onclick="NGT500.route('offspring',{group:'${jsArg(r.group)}'})">
      <span>🥚</span>
      <b>${esc(r.label)}</b>
      <small>${r.count}</small>
    </button>`;
  }).join('');
}

function renderPhotoMigrationCard(){
  const count=legacyPhotoCount();

  if(!count)return '';

  return `<section class="tc2Card tc2SmartLink">
    <span class="tc2GreenIcon">📷</span>
    <span>
      <b>Alte Fotos migrieren</b>
      <small>${count} eingebettete Foto(s) in Firebase Storage verschieben</small>
      <small id="photoMigrationStatusGlobal"></small>
    </span>
    <button onclick="NGTDashboard.migrateAllPhotos()">Starten</button>
  </section>`;
}

function render(){
  tc2(true);

  const name=userName();
  const stockCount=allAnimals().length;
  const offspringCount=allOffspring().length;

  return `<section class="tc2Screen tc2Start">

    <header class="tc2AppTop">
      <button class="tc2Menu" onclick="NGT500.openMenu()">☰</button>
      <div class="tc2HeadTitle">
        <h1>TerraControl</h1>
        <p>Version 1.0.4 RC11</p>
      </div>
      <div class="tc2Sync">
        <span>☁</span>
        <b id="dashboardCloudStatus">${esc(cloudLabel())}</b>
        <small>Heute</small>
      </div>
      <div class="tc2Avatar">TC</div>
    </header>

    <section class="tc2CloudBtns">
      <button onclick="NGTDashboard.googleSignIn()">☁ <span>Anmelden</span></button>
      <button onclick="NGTDashboard.firestoreSave()">↑ <span>Speichern</span></button>
      <button onclick="NGTDashboard.firestoreLoad()">↓ <span>Laden</span></button>
    </section>

    <section class="tc2Welcome">
      <div class="tc2Ghost tc2GhostSnake">🐍</div>
      <div class="tc2Ghost tc2GhostSpider">🕷</div>
      <div class="tc2Ghost tc2GhostGecko">🦎</div>
      <h2>Hallo${name?' '+esc(name):''} 👋</h2>
      <p>Schön, dass du wieder da bist!</p>
    </section>

    ${renderPhotoMigrationCard()}

    <h2 class="tc2SectionTitle">Schnellaktionen</h2>
    <div class="tc2QuickGrid">
      ${quick('▱','KI Dokumentenimport','Dokumente importieren','NGTDashboard.openHknImport()')}
      ${quick('ϟ','KI Schnelleingabe','Einträge per Text',"NGT500.route('assistant')")}
      ${quick('＋','Tier manuell anlegen','Neues Tier erfassen','NGTDashboard.manualAnimal()')}
      ${quick('🥚','Nachzucht anlegen','Neue Nachzucht erfassen','NGTDashboard.manualOffspring()')}
    </div>

    <section class="tc2Card tc2Bestand">
      <button class="tc2BestandHead" onclick="NGTDashboard.toggleBestand()">
        <span class="tc2GreenIcon">●●●</span>
        <span><b>Bestand</b><small>${stockCount} ${stockCount===1?'Tier':'Tiere'} · Dynamische Tiergruppen</small></span>
        <em>⌄</em>
      </button>
      <div id="bestandPanel" class="tc2Species">
        ${renderBestandButtons()}
      </div>
    </section>

    <section class="tc2Card tc2Bestand tc2OffspringCard">
      <button class="tc2BestandHead" onclick="NGTDashboard.toggleOffspring()">
        <span class="tc2GreenIcon">🥚</span>
        <span><b>Nachzuchten</b><small>${offspringCount} ${offspringCount===1?'Tier':'Tiere'} · Eigener Nummernkreis</small></span>
        <em>⌄</em>
      </button>
      <div id="offspringPanel" class="tc2Species">
        ${renderOffspringButtons()}
      </div>
    </section>

    <button class="tc2Card tc2SmartLink" onclick="NGTDashboard.openSmartDashboard()">
      <span class="tc2GreenIcon">▥</span>
      <span><b>Smart Dashboard</b><small>Eigene Analyse-Seite mit deinen echten Daten</small></span>
      <em>›</em>
    </button>

    <button class="tc2Card tc2SmartLink" onclick="NGT500.route('food')">
      <span class="tc2GreenIcon">⌂</span>
      <span><b>Futterbestand</b><small>Bestände verwalten und Futter erfassen</small></span>
      <em>›</em>
    </button>

  </section>`;
}

function smartDashboardProxy(){
  if(window.NGTSmartDashboard&&NGTSmartDashboard.render){
    return NGTSmartDashboard.render();
  }

  return `<div class="card">
    <h2>Smart Dashboard</h2>
    <p class="muted">Smart Dashboard lädt noch.</p>
  </div>`;
}

function afterRender(){
  tc2(true);
  updateCloudStatus();

  if(statusTimer)clearInterval(statusTimer);
  statusTimer=setInterval(updateCloudStatus,1500);
}

window.NGTDashboard={
  updateCloudStatus,
  googleSignIn,
  firestoreSave,
  firestoreLoad,
  openHknImport,
  manualAnimal,
  manualOffspring,
  toggleBestand,
  toggleOffspring,
  openSmartDashboard,
  migrateAllPhotos
};

NGT500.register('dashboard',{render,afterRender});
NGT500.register('smartDashboard',{render:smartDashboardProxy});

})();