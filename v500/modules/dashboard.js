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
  NGT500.route('animals',{t:'koenig'});
  setTimeout(function(){
    if(window.NGTAnimals&&NGTAnimals.openEditor)NGTAnimals.openEditor('koenig');
  },120);
}

function toggleBestand(){
  const el=document.getElementById('bestandPanel');
  if(el)el.classList.toggle('hidden');
}

function openSmartDashboard(){
  NGT500.route('smartDashboard');
}

function allAnimals(){
  try{
    return NGTStore.allAnimals().filter(function(x){
      return !['Archiv','Verkauft','Abgegeben','Verstorben'].includes(x.a.status);
    });
  }catch(e){
    return [];
  }
}

function groupRows(){
  const rows=[];
  const animals=allAnimals();

  (NGTStore.TYPES||[]).forEach(function(t){
    const count=animals.filter(function(x){return x.t===t}).length;
    if(count>0){
      rows.push({
        t:t,
        count:count,
        label:(NGTStore.LABELS&&NGTStore.LABELS[t])?NGTStore.LABELS[t]:t
      });
    }
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

function renderBestandButtons(){
  const rows=groupRows();

  if(!rows.length){
    return `<div class="tc2Empty">
      <b>Noch keine Tiere im Bestand.</b>
      <small>Lege dein erstes Tier an oder lade deine Cloud-Daten.</small>
    </div>`;
  }

  return rows.map(function(r){
    return `<button onclick="NGT500.route('animals',{t:'${r.t}'})">
      <span>${r.label.split(' ')[0]}</span>
      <b>${esc(r.label.replace(/^.\s*/,''))}</b>
      <small>${r.count}</small>
    </button>`;
  }).join('');
}

function render(){
  tc2(true);

  const name=userName();

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

    <section class="tc2Welcome">
      <div class="tc2Ghost tc2GhostSnake">🐍</div>
      <div class="tc2Ghost tc2GhostSpider">🕷</div>
      <div class="tc2Ghost tc2GhostGecko">🦎</div>
      <h2>Hallo${name?' '+esc(name):''} 👋</h2>
      <p>Schön, dass du wieder da bist!</p>
    </section>

    <h2 class="tc2SectionTitle">Schnellaktionen</h2>
    <div class="tc2QuickGrid">
      ${quick('▱','KI Dokumentenimport','Dokumente importieren','NGTDashboard.openHknImport()')}
      ${quick('ϟ','KI Schnelleingabe','Einträge per Text',"NGT500.route('assistant')")}
      ${quick('＋','Tier manuell anlegen','Neues Tier erfassen','NGTDashboard.manualAnimal()')}
      ${quick('⌂','Futterbestand hinzufügen','Bestände verwalten',"NGT500.route('food')")}
    </div>

    <section class="tc2Card tc2Bestand">
      <button class="tc2BestandHead" onclick="NGTDashboard.toggleBestand()">
        <span class="tc2GreenIcon">●●●</span>
        <span><b>Bestand</b><small>Nur echte Tiergruppen aus deinem Bestand</small></span>
        <em>⌄</em>
      </button>
      <div id="bestandPanel" class="tc2Species">
        ${renderBestandButtons()}
      </div>
    </section>

    <button class="tc2Card tc2SmartLink" onclick="NGTDashboard.openSmartDashboard()">
      <span class="tc2GreenIcon">▥</span>
      <span><b>Smart Dashboard</b><small>Eigene Analyse-Seite mit deinen echten Daten</small></span>
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
  toggleBestand,
  openSmartDashboard
};

NGT500.register('dashboard',{render,afterRender});
NGT500.register('smartDashboard',{render:smartDashboardProxy});

})();