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

function activeAnimals(){
 return NGTStore.allAnimals().filter(function(x){
  return !['Archiv','Verkauft','Abgegeben','Verstorben'].includes(x.a.status);
 });
}

function cloudLabel(){
 try{
  if(window.NGTFirebaseSync){
   return NGTFirebaseSync.label();
  }
  return 'Firestore lädt...';
 }catch(e){
  return 'Nicht geprüft';
 }
}

function updateCloudStatus(){
 const el=document.getElementById('dashboardCloudStatus');
 if(el){
  el.textContent=cloudLabel();
 }
}

function topCloudButtons(){
 return `<div class="btnRow" style="margin:14px 0 18px 0">
  <button onclick="NGTDashboard.googleSignIn()">Mit Google anmelden</button>
  <button onclick="NGTDashboard.firestoreSave()">Jetzt in Firestore speichern</button>
  <button onclick="NGTDashboard.firestoreLoad()">Aus Firestore laden</button>
 </div>`;
}

function quickActions(){
 return `<div class="subcard">
  <h3>🚀 Schnellaktionen</h3>
  <p class="muted">Tiere schneller anlegen oder wichtige Aktionen direkt starten.</p>
  <div class="btnRow">
   <button onclick="NGTDashboard.openHknImport()">📄 Tier aus Herkunftsnachweis anlegen</button>
   <button onclick="NGT500.route('animals',{t:'koenig'})">➕ Tier manuell anlegen</button>
  </div>
  <input id="hknImportFile" type="file" accept="image/*,.pdf" capture="environment" style="display:none" onchange="NGTDashboard.handleHknFile(this.files[0])">
 </div>`;
}

function openHknImport(){
 const el=document.getElementById('hknImportFile');
 if(el)el.click();
}

function handleHknFile(file){
 if(!file)return;
 const reader=new FileReader();
 reader.onload=function(){
  try{
   sessionStorage.setItem('terracontrol_hkn_import_v1',JSON.stringify({
    name:file.name||'Herkunftsnachweis',
    type:file.type||'',
    data:String(reader.result||''),
    at:new Date().toISOString()
   }));
  }catch(e){}
  NGT500.route('animals',{t:'koenig',hkn:1});
 };
 reader.onerror=function(){alert('HKN-Datei konnte nicht gelesen werden.')};
 reader.readAsDataURL(file);
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
 if(!confirm('Daten aus Firestore laden? Lokale Daten können überschrieben werden.')){
  return;
 }
 try{
  await NGTFirebaseSync.loadCloud();
  alert('Firestore geladen. App wird neu gestartet.');
  location.reload();
 }catch(e){
  alert('Firestore laden fehlgeschlagen: '+(e.message||e));
 }
}

function foodStatus(){
 try{
  const d=NGTStore.data();
  const n=(d.foodInventory||[]).reduce(function(s,x){
   return s+Number(x.qty||0);
  },0);

  return n>0 ? String(n)+' Bestand' : 'prüfen';
 }catch(e){
  return 'prüfen';
 }
}

function warningCount(){
 try{
  const all=activeAnimals();
  let n=0;

  all.forEach(function(x){
   const a=x.a||{};
   const weights=a.weights||[];
   const feeds=a.feeds||[];

   if(weights.length>1){
    const last=Number(weights[weights.length-1].weight||0);
    const prev=Number(weights[weights.length-2].weight||0);

    if(last&&prev&&last<prev){
     n++;
    }
   }

   const lastFeed=feeds.length ? feeds[feeds.length-1].date : '';
   const interval=Number(a.feedIntervalDays||a.feedingInterval||a.feedInterval||14);

   if(lastFeed&&((Date.now()-new Date(lastFeed).getTime())/86400000)>interval){
    n++;
   }
  });

  return n;
 }catch(e){
  return 0;
 }
}

function render(){
 const all=activeAnimals();
 const buy=all.reduce(function(s,x){
  return s+Number(x.a.buyPrice||0);
 },0);

 const mv=all.reduce(function(s,x){
  return s+NGTStore.market(x.a);
 },0);

 const smart=window.NGTSmartDashboard ? NGTSmartDashboard.render() : '';
 const name=userName();
 const wc=warningCount();

 return `<div class="card">
  <h2>Hallo${name?' '+NGT500.esc(name):''} 👋</h2>
  <p class="muted">Schön, dass du wieder da bist.</p>

  ${topCloudButtons()}
  ${quickActions()}

  <div class="grid">
   <div class="stat">🐍 Tiere<b>${all.length}</b></div>
   <div class="stat">⚠️ Warnungen<b>${wc}</b></div>
   <div class="stat">☁️ Cloud<b id="dashboardCloudStatus">${NGT500.esc(cloudLabel())}</b></div>
   <div class="stat">🍽️ Futter<b>${NGT500.esc(foodStatus())}</b></div>
  </div>

  <input placeholder="Tier suchen nach Name, ID, Morph, Geschlecht, Eltern oder Futter..." oninput="NGTDashboard.search(this.value)">
  <div id="searchBox"></div>
 </div>

 ${smart}

 <div class="card">
  <h2>Bestandsübersicht</h2>
  <div class="grid">
   <div class="stat">Aktiver Bestand<b>${all.length}</b></div>
   <div class="stat">Kaufwert<b>${NGT500.money(buy)}</b></div>
   <div class="stat">Marktwert<b>${NGT500.money(mv)}</b></div>
   <div class="stat">Differenz<b>${NGT500.money(mv-buy)}</b></div>
  </div>
 </div>`;
}

function afterRender(){
 updateCloudStatus();

 if(statusTimer){
  clearInterval(statusTimer);
 }

 statusTimer=setInterval(updateCloudStatus,1500);
}

function textFor(x){
 const a=x.a||{};

 return [
  a.name,
  a.uuid,
  a.uid,
  a.displayId,
  a.morph,
  a.sex,
  a.status,
  a.birth,
  a.origin,
  a.originType,
  a.father,
  a.vater,
  a.sire,
  a.mother,
  a.mutter,
  a.dam,
  a.defaultFeeder,
  a.futterStandard,
  a.standardFeed,
  a.note
 ].filter(Boolean).join(' ').toLowerCase();
}

function search(q){
 q=String(q||'').toLowerCase().trim();

 const box=document.getElementById('searchBox');

 if(!box){
  return;
 }

 if(!q){
  box.innerHTML='';
  return;
 }

 const rows=activeAnimals().filter(function(x){
  return textFor(x).includes(q);
 });

 box.innerHTML=rows.length
  ? '<p class="muted">'+rows.length+' Treffer</p>'+rows.map(NGTUI.animalCard).join('')
  : '<div class="subcard">Keine Treffer gefunden.</div>';
}

window.NGTDashboard={
 search,
 updateCloudStatus,
 googleSignIn,
 firestoreSave,
 firestoreLoad,
 openHknImport,
 handleHknFile
};

NGT500.register('dashboard',{
 render,
 afterRender
});

})();