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
 try{return NGTStore.allAnimals().filter(x=>!['Archiv','Verkauft','Abgegeben','Verstorben'].includes(x.a.status))}
 catch(e){return []}
}

function foodItems(){
 try{return (NGTStore.data().foodInventory||[]).filter(x=>Number(x.qty||0)>0)}
 catch(e){return []}
}

function groupRows(){
 const rows=[];
 const animals=allAnimals();
 (NGTStore.TYPES||[]).forEach(function(t){
  const count=animals.filter(x=>x.t===t).length;
  if(count>0){
   rows.push({
    t,
    count,
    label:(NGTStore.LABELS&&NGTStore.LABELS[t])?NGTStore.LABELS[t]:t
   });
  }
 });
 return rows;
}

function latest(list){
 return (list||[]).slice().sort((a,b)=>String(b.date||'').localeCompare(String(a.date||'')))[0]||null;
}

function todayISO(){return new Date().toISOString().slice(0,10)}

function dueToday(){
 const today=todayISO();
 const rows=[];
 allAnimals().forEach(function(x){
  const a=x.a;
  const lf=latest(a.feeds);
  const lw=latest(a.weights);
  if(lf&&lf.date===today)rows.push({icon:'🍽',name:a.name||'Unbenannt',type:'Fütterung',time:'heute'});
  if(lw&&lw.date===today)rows.push({icon:'⚖',name:a.name||'Unbenannt',type:'Gewicht',time:'heute'});
 });
 return rows;
}

function recentActivities(){
 const rows=[];
 allAnimals().forEach(function(x){
  const a=x.a;
  (a.feeds||[]).slice(-3).forEach(f=>rows.push({icon:'🍽',text:'Fütterung erfasst: '+(a.name||'Unbenannt'),date:f.date||''}));
  (a.weights||[]).slice(-3).forEach(w=>rows.push({icon:'⚖',text:'Gewicht erfasst: '+(a.name||'Unbenannt'),date:w.date||''}));
  (a.sheds||[]).slice(-3).forEach(s=>rows.push({icon:'🧤',text:'Häutung erfasst: '+(a.name||'Unbenannt'),date:s.date||''}));
 });
 return rows.sort((a,b)=>String(b.date).localeCompare(String(a.date))).slice(0,4);
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
   <small>Lege dein erstes Tier über „Tier manuell anlegen“ an. TerraControl baut den Bestand danach automatisch auf.</small>
  </div>`;
 }
 return rows.map(r=>`<button onclick="NGT500.route('animals',{t:'${r.t}'})"><span>${r.label.split(' ')[0]}</span><b>${esc(r.label.replace(/^.\s*/,''))}</b><small>${r.count}</small></button>`).join('');
}

function render(){
 tc2(true);
 const name=userName();

 return `<section class="tc2Screen tc2Start">

  <header class="tc2AppTop">
   <button class="tc2Menu" onclick="NGT500.openMenu()">☰</button>
   <div class="tc2HeadTitle"><h1>TerraControl</h1><p>Version 1.0.4 RC8</p></div>
   <div class="tc2Sync"><span>☁</span><b id="dashboardCloudStatus">${esc(cloudLabel())}</b><small>Heute</small></div>
   <div class="tc2Avatar">TC</div>
  </header>

  <div class="tc2CloudBtns">
   <button onclick="NGTDashboard.googleSignIn()">♙ <span>Anmelden</span></button>
   <button onclick="NGTDashboard.firestoreSave()">☁ <span>Speichern</span></button>
   <button onclick="NGTDashboard.firestoreLoad()">☁ <span>Laden</span></button>
  </div>

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
   ${quick('ϟ','KI Schnelleingabe','Einträge per Text','NGT500.route(\\'assistant\\')')}
   ${quick('＋','Tier manuell anlegen','Neues Tier erfassen','NGTDashboard.manualAnimal()')}
   ${quick('⌂','Futterbestand hinzufügen','Bestände verwalten','NGT500.route(\\'food\\')')}
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
   <span><b>Smart Dashboard</b><small>Deine echten Bestandsdaten</small></span>
   <em>›</em>
  </button>

 </section>`;
}

function smartRender(){
 tc2(true);
 const animals=allAnimals();
 const foods=foodItems();
 const due=dueToday();
 const acts=recentActivities();
 const groups=groupRows();

 return `<section class="tc2Screen tc2Smart">

  <header class="tc2AppTop">
   <button class="tc2Menu" onclick="NGT500.openMenu()">☰</button>
   <div class="tc2HeadTitle"><h1>Smart Dashboard</h1><p>Deine echten Daten</p></div>
   <div class="tc2Sync"><span>☁</span><b>${esc(cloudLabel())}</b><small>Heute</small></div>
   <div class="tc2Avatar">TC</div>
  </header>

  <div class="tc2Stats">
   <div><span>●●●</span><b>${animals.length}</b><small>Tiere</small><em>echter Bestand</em></div>
   <div><span>⌂</span><b>${foods.length}</b><small>Futterarten</small><em>erfasst</em></div>
   <div><span>▣</span><b>${due.length}</b><small>Heute</small><em>Einträge</em></div>
   <div><span>▱</span><b>${acts.length}</b><small>Aktivitäten</small><em>zuletzt</em></div>
  </div>

  <section class="tc2Card tc2ChartCard">
   <h2>Bestand nach Tiergruppe</h2>
   ${groups.length?`<div class="tc2ChartRow">
    <div class="tc2Donut"><b>${animals.length}</b><small>Gesamt</small></div>
    <ul>
     ${groups.map((g,i)=>`<li><i class="${['g','b','p','o'][i%4]}"></i>${esc(g.label.replace(/^.\s*/,''))} <b>${g.count}</b></li>`).join('')}
    </ul>
   </div>`:`<div class="tc2Empty"><b>Keine Tiere vorhanden.</b><small>Das Dashboard zeigt Daten, sobald Tiere angelegt oder aus Firestore geladen wurden.</small></div>`}
  </section>

  <section class="tc2Card tc2List">
   <h2>Heute fällig</h2>
   ${due.length?due.map(r=>`<div class="tc2ListRow"><span>${r.icon}</span><div><b>${esc(r.name)}</b><small>${esc(r.type)}</small></div><em>${esc(r.time)}</em><i>›</i></div>`).join(''):`<div class="tc2Empty"><b>Heute nichts fällig.</b><small>Keine Einträge für heute vorhanden.</small></div>`}
  </section>

  <section class="tc2Card">
   <h2>Futterbestand</h2>
   ${foods.length?`<div class="tc2FoodGrid">
    ${foods.map(f=>food(esc(f.label||f.name),Number(f.qty||0)+' Stück',Number(f.qty||0)<=5?'Niedrig':'Ausreichend',Number(f.qty||0)<=5?'warn':'')).join('')}
   </div>`:`<div class="tc2Empty"><b>Kein Futterbestand erfasst.</b><small>Füge Futter über „Futterbestand hinzufügen“ hinzu.</small></div>`}
  </section>

  <section class="tc2Card tc2List">
   <h2>Letzte Aktivitäten</h2>
   ${acts.length?acts.map(r=>`<div class="tc2ListRow"><span>${r.icon}</span><div><b>${esc(r.text)}</b><small>${esc(r.date||'-')}</small></div><em></em><i>›</i></div>`).join(''):`<div class="tc2Empty"><b>Noch keine Aktivitäten.</b><small>Fütterungen, Häutungen und Gewichte erscheinen hier nach dem Eintragen.</small></div>`}
  </section>

  <nav class="tc2BottomNav">
   <button class="on">▥<span>Übersicht</span></button>
   <button onclick="NGT500.route('dashboard')">●●●<span>Start</span></button>
   <button onclick="NGT500.route('food')">⌂<span>Futter</span></button>
   <button onclick="NGT500.route('assistant')">▣<span>KI</span></button>
   <button onclick="NGT500.route('backup')">▱<span>Backup</span></button>
  </nav>
 </section>`;
}

function food(name,qty,status,cls){
 return `<div class="tc2Food"><b>${name}</b><small>${qty}</small><div><i class="${cls||''}"></i></div><em class="${cls||''}">${status}</em></div>`;
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
NGT500.register('smartDashboard',{render:smartRender});
})();
