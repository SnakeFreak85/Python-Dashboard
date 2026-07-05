(function(){
'use strict';

let statusTimer=null;

function tc2(on){document.body.classList.toggle('tc2RefMode',!!on);}
if(window.NGT500&&NGT500.on){NGT500.on('route',e=>tc2(e&&['dashboard','smartDashboard'].includes(e.name)));}

function userName(){
 const keys=['tc_user_profile','terracontrol_user','ngt_user','ngt_google_user'];
 for(const k of keys){try{const u=JSON.parse(localStorage.getItem(k)||'{}');if(u.given_name)return u.given_name;if(u.name)return String(u.name).split(' ')[0];if(u.displayName)return String(u.displayName).split(' ')[0];}catch(e){}}
 return '';
}
function cloudLabel(){try{return window.NGTFirebaseSync?NGTFirebaseSync.label():'Synchronisiert';}catch(e){return 'Synchronisiert';}}
function updateCloudStatus(){const el=document.getElementById('dashboardCloudStatus');if(el)el.textContent=cloudLabel();}

async function googleSignIn(){if(window.NGTFirebaseSync)await NGTFirebaseSync.signIn();}
async function firestoreSave(){if(window.NGTFirebaseSync){await NGTFirebaseSync.saveCloud();updateCloudStatus();}}
async function firestoreLoad(){if(window.NGTFirebaseSync&&confirm('Daten aus Firestore laden?')){await NGTFirebaseSync.loadCloud();location.reload();}}

function openHknImport(){if(window.NGTHknImport)NGTHknImport.run();else alert('HKN-Import lädt noch.');}
function manualAnimal(){NGT500.route('animals',{t:'koenig'});setTimeout(()=>{if(window.NGTAnimals&&NGTAnimals.openEditor)NGTAnimals.openEditor('koenig');},120);}
function toggleBestand(){const el=document.getElementById('bestandPanel');if(el)el.classList.toggle('hidden');}
function openSmartDashboard(){NGT500.route('smartDashboard');}

function quick(icon,title,sub,onclick){
 return `<button class="tc2Quick" onclick="${onclick}">
  <span class="tc2GreenIcon">${icon}</span>
  <span><b>${NGT500.esc(title)}</b><small>${NGT500.esc(sub)}</small></span>
  <em>›</em>
 </button>`;
}

function render(){
 tc2(true);
 const name=userName();
 return `<section class="tc2Screen tc2Start">

  <header class="tc2AppTop">
   <button class="tc2Menu" onclick="NGT500.openMenu()">☰</button>
   <div class="tc2HeadTitle"><h1>TerraControl</h1><p>Version 1.0.4 RC7</p></div>
   <div class="tc2Sync"><span>☁</span><b id="dashboardCloudStatus">${NGT500.esc(cloudLabel())}</b><small>Heute, 09:58</small></div>
   <div class="tc2Avatar">SC</div>
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
   <h2>Hallo${name?' '+NGT500.esc(name):''} 👋</h2>
   <p>Schön, dass du wieder da bist!</p>
  </section>

  <h2 class="tc2SectionTitle">Schnellaktionen</h2>
  <div class="tc2QuickGrid">
   ${quick('▱','KI Dokumentenimport','erst anmelden','NGTDashboard.openHknImport()')}
   ${quick('ϟ','KI Schnelleingabe','erst anmelden',"NGT500.route('assistant')")}
   ${quick('＋','Tier manuell anlegen','erst anmelden','NGTDashboard.manualAnimal()')}
   ${quick('⌂','Futterbestand hinzufügen','erst anmelden',"NGT500.route('food')")}
  </div>

  <section class="tc2Card tc2Bestand">
   <button class="tc2BestandHead" onclick="NGTDashboard.toggleBestand()">
    <span class="tc2GreenIcon">●●●</span>
    <span><b>Bestand</b><small>Wähle eine Tierart aus</small></span>
    <em>⌄</em>
   </button>
   <div id="bestandPanel" class="tc2Species">
    <button onclick="NGT500.route('animals',{t:'koenig'})"><span>♒</span><b>Königspythons</b></button>
    <button onclick="NGT500.route('animals',{t:'boas'})"><span>♒</span><b>Boas</b></button>
    <button onclick="NGT500.route('animals',{t:'spinnen'})"><span>✣</span><b>Vogelspinnen</b></button>
    <button onclick="NGT500.route('animals',{t:'geckos'})"><span>⌁</span><b>Leopardgeckos</b></button>
   </div>
  </section>

  <button class="tc2Card tc2SmartLink" onclick="NGTDashboard.openSmartDashboard()">
   <span class="tc2GreenIcon">▥</span>
   <span><b>Smart Dashboard</b><small>Deine intelligente Übersicht</small></span>
   <em>›</em>
  </button>

 </section>`;
}

function smartRender(){
 tc2(true);
 return `<section class="tc2Screen tc2Smart">

  <header class="tc2AppTop">
   <button class="tc2Menu" onclick="NGT500.route('dashboard')">☰</button>
   <div class="tc2HeadTitle"><h1>Smart Dashboard</h1><p>Deine intelligente Übersicht</p></div>
   <div class="tc2Sync"><span>☁</span><b>Synchronisiert</b><small>Heute, 09:58</small></div>
   <div class="tc2Avatar">SC</div>
  </header>

  <div class="tc2Stats">
   <div><span>●●●</span><b>24</b><small>Tiere</small><em>+2 seit letzter Woche</em></div>
   <div><span>⌂</span><b>18</b><small>Futterartikel</small><em class="warn">5 niedrig</em></div>
   <div><span>▣</span><b>7</b><small>Heute fällig</small><em class="warn">3 Fütterungen</em></div>
   <div><span>▱</span><b>32</b><small>Dokumente</small><em class="blue">2 neu</em></div>
  </div>

  <section class="tc2Card tc2ChartCard">
   <h2>Bestand nach Tierart <button>Alle anzeigen ›</button></h2>
   <div class="tc2ChartRow">
    <div class="tc2Donut"><b>24</b><small>Gesamt</small></div>
    <ul>
     <li><i class="g"></i>Königspythons <b>8</b></li>
     <li><i class="b"></i>Boas <b>5</b></li>
     <li><i class="p"></i>Vogelspinnen <b>6</b></li>
     <li><i class="o"></i>Leopardgeckos <b>5</b></li>
    </ul>
   </div>
  </section>

  ${smartList('Heute fällig',[
   ['♒','Medusa','Fütterung','18:00 Uhr','heute'],
   ['✣','Grammostola pulchra','Fütterung','19:00 Uhr','heute'],
   ['⌁','Leo','Fütterung','20:00 Uhr','heute']
  ],'+ 4 weitere')}

  <section class="tc2Card">
   <h2>Futterbestand <button>Alle anzeigen ›</button></h2>
   <div class="tc2FoodGrid">
    ${food('Ratte 200g','23 Stück','Ausreichend')}
    ${food('Ratte 400g','8 Stück','Niedrig','warn')}
    ${food('Heuschrecken','45 Stück','Ausreichend')}
    ${food('Mehlwürmer','120 Stück','Ausreichend')}
   </div>
  </section>

  ${smartList('Letzte Aktivitäten',[
   ['＋','Neues Tier hinzugefügt: Python regius "Ghost"','','Heute, 09:15',''],
   ['▱','Dokument aktualisiert: Medusa - Tierpass','','Heute, 08:42',''],
   ['⌂','Fütterung erfasst: Grammostola pulchra','','Gestern, 20:10',''],
   ['▣','Gewicht erfasst: Leo','','Gestern, 19:45','']
  ])}

  <nav class="tc2BottomNav">
   <button class="on">▥<span>Übersicht</span></button>
   <button>●●●<span>Tiere</span></button>
   <button>⌂<span>Futter</span></button>
   <button>▣<span>Kalender</span></button>
   <button>▱<span>Dokumente</span></button>
  </nav>
 </section>`;
}

function smartList(title,rows,more){
 return `<section class="tc2Card tc2List"><h2>${title} <button>Alle anzeigen ›</button></h2>
 ${rows.map(r=>`<div class="tc2ListRow"><span>${r[0]}</span><div><b>${r[1]}</b>${r[2]?`<small>${r[2]}</small>`:''}</div><em>${r[3]}${r[4]?`<small>${r[4]}</small>`:''}</em><i>›</i></div>`).join('')}
 ${more?`<p class="tc2More">${more}</p>`:''}</section>`;
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

window.NGTDashboard={updateCloudStatus,googleSignIn,firestoreSave,firestoreLoad,openHknImport,manualAnimal,toggleBestand,openSmartDashboard};
NGT500.register('dashboard',{render,afterRender});
NGT500.register('smartDashboard',{render:smartRender});
})();
