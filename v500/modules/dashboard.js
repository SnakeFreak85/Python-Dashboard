(function(){
'use strict';

let statusTimer=null;

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
 try{
  const seller=JSON.parse(localStorage.getItem('ngt_seller_profile_v1')||'{}');
  if(seller.name)return String(seller.name).split(' ')[0];
 }catch(e){}
 return '';
}

function cloudLabel(){
 try{
  if(window.NGTFirebaseSync){return NGTFirebaseSync.label();}
  return 'Firestore lädt...';
 }catch(e){
  return 'Nicht geprüft';
 }
}

function updateCloudStatus(){
 const el=document.getElementById('dashboardCloudStatus');
 if(el){el.textContent=cloudLabel();}
}

function loadScript(src){
 return new Promise(function(resolve,reject){
  const existing=[].slice.call(document.scripts).find(function(s){return s.src&&s.src.indexOf(src)>=0});
  if(existing){resolve();return;}
  const s=document.createElement('script');
  s.src=src;
  s.onload=resolve;
  s.onerror=function(){reject(new Error('Modul konnte nicht geladen werden: '+src))};
  document.head.appendChild(s);
 });
}

async function openHknImport(){
 try{
  if(window.NGTHknImport){NGTHknImport.run();return;}
  await loadScript('./v500/hkn-import.js?v='+Date.now());
  if(window.NGTHknImport){NGTHknImport.run();return;}
  throw new Error('HKN-Import nicht verfügbar.');
 }catch(e){
  alert('HKN-Import konnte nicht gestartet werden: '+(e.message||e));
 }
}

async function googleSignIn(){
 if(!window.NGTFirebaseSync){
  alert('Firebase-Sync lädt noch. Bitte kurz warten.');
  return;
 }
 try{
  await NGTFirebaseSync.signIn();
 }catch(e){
  alert('Firebase-Anmeldung fehlgeschlagen: '+(e.message||e));
 }
}

async function firestoreSave(){
 if(!window.NGTFirebaseSync){
  alert('Firebase-Sync lädt noch.');
  return;
 }
 try{
  await NGTFirebaseSync.saveCloud();
  alert('Firestore gespeichert.');
  updateCloudStatus();
 }catch(e){
  alert('Firestore speichern fehlgeschlagen: '+(e.message||e));
 }
}

async function firestoreLoad(){
 if(!window.NGTFirebaseSync){
  alert('Firebase-Sync lädt noch.');
  return;
 }
 if(!confirm('Daten aus Firestore laden? Lokale Daten können überschrieben werden.')){return;}
 try{
  await NGTFirebaseSync.loadCloud();
  alert('Firestore geladen. App wird neu gestartet.');
  location.reload();
 }catch(e){
  alert('Firestore laden fehlgeschlagen: '+(e.message||e));
 }
}

function manualAnimal(){
 NGT500.route('animals',{t:'koenig'});
 setTimeout(function(){
  if(window.NGTAnimals&&NGTAnimals.openEditor){NGTAnimals.openEditor('koenig');}
 },120);
}

function toggleBestand(){
 const el=document.getElementById('bestandPanel');
 if(!el)return;
 el.classList.toggle('hidden');
}

function toggleSmart(){
 const el=document.getElementById('smartPanel');
 if(!el)return;
 if(el.innerHTML.trim()){
  el.innerHTML='';
  el.classList.add('hidden');
  return;
 }
 const smart=window.NGTSmartDashboard ? NGTSmartDashboard.render() : '<div class="subcard">Smart Dashboard lädt noch.</div>';
 el.innerHTML=smart;
 el.classList.remove('hidden');
 setTimeout(function(){el.scrollIntoView({behavior:'smooth',block:'start'});},60);
}

function openTerrariums(){
 alert('Terrarienverwaltung kommt in Phase 2.');
}

function actionCard(icon,title,sub,onclick,extra){
 return `<button class="tc2Action ${extra||''}" onclick="${onclick}">
  <span class="tc2ActionIcon">${icon}</span>
  <span><b>${NGT500.esc(title)}</b><small>${NGT500.esc(sub)}</small></span>
 </button>`;
}

function render(){
 const name=userName();

 return `<section class="tc2Home">
  <div class="tc2Hero card">
   <div class="tc2Topline">
    <div>
     <div class="tc2Brand">TerraControl</div>
     <div class="tc2Sub">Version 1.0.4 RC4</div>
    </div>
    <div class="tc2Status" id="dashboardCloudStatus">${NGT500.esc(cloudLabel())}</div>
   </div>

   <div class="tc2CloudRow">
    <button onclick="NGTDashboard.googleSignIn()">Anmelden</button>
    <button onclick="NGTDashboard.firestoreSave()">Speichern</button>
    <button onclick="NGTDashboard.firestoreLoad()">Laden</button>
   </div>

   <div class="tc2Welcome">
    <h2>Hallo${name?' '+NGT500.esc(name):''} 👋</h2>
    <p>Schön, dass du wieder da bist.</p>
   </div>
  </div>

  <div class="tc2Actions card">
   <h2>Schnellaktionen</h2>
   <div class="tc2ActionGrid">
    ${actionCard('📄','KI Dokumentenimport','HKN, Notizen, Dokumente','NGTDashboard.openHknImport()')}
    ${actionCard('⚡','KI Schnelleingabe','Fütterung, Gewicht, Häutung','NGT500.route(\'assistant\')')}
    ${actionCard('➕','Tier manuell anlegen','Neues Tier erfassen','NGTDashboard.manualAnimal()')}
    ${actionCard('🍽️','Futterbestand hinzufügen','Bestände verwalten','NGT500.route(\'food\')')}
    ${actionCard('🐾','Bestand','Tiergruppen öffnen','NGTDashboard.toggleBestand()','tc2Accent')}
    ${actionCard('🏡','Terrarienverwaltung','Anlagen, Racks, Fächer','NGTDashboard.openTerrariums()')}
    ${actionCard('📊','Smart Dashboard','Übersicht öffnen','NGTDashboard.toggleSmart()','tc2Wide')}
   </div>
  </div>

  <div id="bestandPanel" class="card hidden">
   <h2>Bestand</h2>
   <p class="muted">Dein Bestand wird später automatisch aus den angelegten Tieren aufgebaut.</p>
   <div class="tc2SpeciesGrid">
    <button onclick="NGT500.route('animals',{t:'koenig'})">🐍 Königspythons</button>
    <button onclick="NGT500.route('animals',{t:'boas'})">🐍 Boas</button>
    <button onclick="NGT500.route('animals',{t:'spinnen'})">🕷️ Vogelspinnen</button>
    <button onclick="NGT500.route('animals',{t:'geckos'})">🦎 Leopardgeckos</button>
   </div>
  </div>

  <div id="smartPanel" class="tc2SmartPanel hidden"></div>
 </section>`;
}

function afterRender(){
 updateCloudStatus();
 if(statusTimer){clearInterval(statusTimer);}
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
 toggleSmart,
 openTerrariums
};

NGT500.register('dashboard',{render,afterRender});
})();
