(function(){
'use strict';

const KEY='tc_user_profile';
const GOOGLE_KEY='ngt_google_user';

function esc(v){return NGT500.esc(v||'')}
function profile(){try{return JSON.parse(localStorage.getItem(KEY)||'{}')||{}}catch(e){return {}}}
function first(v){return String(v||'').split(' ')[0]||''}
function animalCount(){try{return NGTStore.allAnimals?NGTStore.allAnimals().length:0}catch(e){return 0}}
function syncText(){try{return window.NGTFirebaseSync?NGTFirebaseSync.label():'Firestore lädt...'}catch(e){return 'Nicht geprüft'}}

function render(){
 const p=profile();
 const ok=!!p.email;
 const displayName=p.name||p.displayName||'';
 const welcome=first(p.given_name||p.name||p.displayName);
 return `<div class="card">
  <h2>👤 Konto</h2>
  <p class="muted">Konto, Cloud-Status und lokale Backup-Dateien.</p>

  ${ok?`<div class="subcard ok">
   ${p.picture?`<img src="${esc(p.picture)}" style="width:72px;height:72px;border-radius:50%;object-fit:cover;float:right;margin-left:12px">`:''}
   <b>Angemeldet</b><br>
   ${esc(displayName)}<br>
   ${esc(p.email)}<br>
   <span class="muted">Willkommen ${esc(welcome)}</span>
  </div>`:`<div class="subcard">
   <b>Noch nicht angemeldet</b><br>
   <span class="muted">Die Anmeldung befindet sich direkt oben auf der Startseite.</span>
  </div>`}

  <div class="subcard">
   <h3>🔥 Firebase / Firestore</h3>
   <p><b>Status:</b><br>${esc(syncText())}</p>
   <p><b>Lokale Tiere:</b><br>${animalCount()}</p>
   <p class="muted">Anmelden, Speichern und Laden befinden sich ab sofort ganz oben auf der Startseite.</p>
  </div>

  <div class="subcard">
   <h3>📦 Lokale Sicherung</h3>
   <p class="muted">Lokales Backup als Datei. Unabhängig von Firebase.</p>
   <div class="btnRow">
    <button onclick="NGTAccount.localBackup()">Backup-Datei speichern</button>
    <button onclick="NGTAccount.localRestorePick()">Backup-Datei laden</button>
   </div>
   <input id="accountRestoreFile" type="file" accept="application/json,.json" style="display:none" onchange="NGTAccount.localRestore(this.files[0])">
  </div>

  <button class="danger" onclick="NGTAccount.clear()">Abmelden / Profil entfernen</button>
 </div>`;
}

async function googleSignIn(){if(window.NGTFirebaseSync)return NGTFirebaseSync.signIn()}
async function firestoreSave(){if(window.NGTFirebaseSync)return NGTFirebaseSync.saveCloud()}
async function firestoreLoad(){if(window.NGTFirebaseSync)return NGTFirebaseSync.loadCloud()}

function localBackup(){
 const payload={app:'TerraControl',type:'local-backup',version:'1.0.4-rc4',createdAt:new Date().toISOString(),data:NGTStore.data()};
 const blob=new Blob([JSON.stringify(payload,null,2)],{type:'application/json'});
 const url=URL.createObjectURL(blob);
 const a=document.createElement('a');
 a.href=url;
 a.download='TerraControl-Backup-'+new Date().toISOString().slice(0,19).replace(/[:.]/g,'-')+'.json';
 document.body.appendChild(a);
 a.click();
 a.remove();
 URL.revokeObjectURL(url);
}

function localRestorePick(){
 const el=document.getElementById('accountRestoreFile');
 if(el)el.click();
}

function localRestore(file){
 if(!file)return;
 if(!confirm('Backup-Datei laden? Aktuelle lokale Daten können überschrieben werden.'))return;
 const r=new FileReader();
 r.onload=function(){
  try{
   const obj=JSON.parse(String(r.result||'{}'));
   const data=obj.data||obj;
   NGTStore.importJson(JSON.stringify(data));
   alert('Backup geladen. App wird neu gestartet.');
   location.reload();
  }catch(e){alert('Import fehlgeschlagen: '+(e.message||e))}
 };
 r.onerror=function(){alert('Datei konnte nicht gelesen werden.')};
 r.readAsText(file);
}

async function clear(){
 if(!confirm('Konto lokal entfernen? Lokale Tierdaten bleiben erhalten.'))return;
 localStorage.removeItem(KEY);
 localStorage.removeItem(GOOGLE_KEY);
 if(window.NGTFirebaseSync){try{await NGTFirebaseSync.signOut()}catch(e){}}
 NGT500.route('account');
}

function afterRender(){try{if(window.NGTDashboard&&NGTDashboard.updateCloudStatus)NGTDashboard.updateCloudStatus()}catch(e){}}

window.NGTAccount={googleSignIn,firestoreSave,firestoreLoad,localBackup,localRestorePick,localRestore,clear};
NGT500.register('account',{render,afterRender});

})();