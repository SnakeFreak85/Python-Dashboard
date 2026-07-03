(function(){
'use strict';

const KEY='tc_user_profile';
const GOOGLE_KEY='ngt_google_user';

function esc(v){
 return NGT500.esc(v||'');
}

function get(){
 try{
  return JSON.parse(localStorage.getItem(KEY)||'{}')||{};
 }catch(e){
  return {};
 }
}

function first(v){
 return String(v||'').split(' ')[0]||'';
}

function animalCount(){
 try{
  return NGTStore.allAnimals ? NGTStore.allAnimals().length : 0;
 }catch(e){
  return 0;
 }
}

function syncText(){
 if(window.NGTFirebaseSync){
  return NGTFirebaseSync.label();
 }
 return 'Firestore lädt...';
}

function loadDrive(cb){
 if(window.NGTCloudBackup){
  cb();
  return;
 }

 const s=document.createElement('script');
 s.src='./v500/cloud-backup.js?v=1.0.4-exportonly';
 s.onload=cb;
 s.onerror=function(){
  alert('Drive-Backup-Modul konnte nicht geladen werden.');
 };
 document.head.appendChild(s);
}

function render(){
 const p=get();
 const ok=!!p.email;
 const displayName=p.name||p.displayName||'';
 const welcome=first(p.given_name||p.name||p.displayName);

 return `<div class="card">
  <h2>👤 Konto</h2>
  <p class="muted">Firebase-Anmeldung, Firestore-Synchronisierung und optionale Backup-Dateien.</p>

  ${ok?`<div class="subcard ok">
   ${p.picture?`<img src="${esc(p.picture)}" style="width:72px;height:72px;border-radius:50%;object-fit:cover;float:right;margin-left:12px">`:''}
   <b>Angemeldet</b><br>
   ${esc(displayName)}<br>
   ${esc(p.email)}<br>
   <span class="muted">Willkommen ${esc(welcome)}</span>
  </div>`:`<div class="subcard">
   <b>Noch nicht angemeldet</b><br>
   <span class="muted">Melde dich mit Google/Firebase an.</span>
  </div>`}

  <div class="subcard">
   <h3>🔥 Firebase / Firestore</h3>
   <p><b>Status:</b><br>${esc(syncText())}</p>
   <p><b>Lokale Tiere:</b><br>${animalCount()}</p>
   <p class="muted">Firestore ist jetzt der Hauptspeicher. Tiere werden automatisch geladen und nach Änderungen automatisch gespeichert.</p>
   <div class="btnRow">
    <button onclick="NGTAccount.googleSignIn()">Mit Google anmelden</button>
    <button onclick="NGTAccount.firestoreSave()">Jetzt in Firestore speichern</button>
    <button onclick="NGTAccount.firestoreLoad()">Aus Firestore laden</button>
   </div>
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

  <div class="subcard">
   <h3>☁️ Google Drive optional</h3>
   <p class="muted">Drive ist nur noch optionales Datei-Backup, nicht mehr Haupt-Synchronisierung.</p>
   <div class="btnRow">
    <button onclick="NGTAccount.driveBackup()">In Google Drive sichern</button>
    <button onclick="NGTAccount.driveRestoreLatest()">Neuestes Drive-Backup laden</button>
    <button onclick="NGTAccount.driveList()">Backup-Historie</button>
   </div>
  </div>

  <div id="driveBackups"></div>

  <button class="danger" onclick="NGTAccount.clear()">Abmelden / Profil entfernen</button>
 </div>`;
}

async function googleSignIn(){
 if(window.NGTFirebaseSync){
  try{
   await NGTFirebaseSync.signIn();
   return;
  }catch(e){
   alert('Firebase-Anmeldung fehlgeschlagen: '+(e.message||e));
   return;
  }
 }

 alert('Firebase-Sync ist noch nicht geladen. Bitte App neu laden.');
}

async function firestoreSave(){
 if(!window.NGTFirebaseSync){
  alert('Firebase-Sync lädt noch.');
  return;
 }

 try{
  await NGTFirebaseSync.saveCloud();
  alert('Firestore gespeichert.');
  NGT500.route('account');
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

function localBackup(){
 const payload={
  app:'TerraControl',
  type:'local-backup',
  version:'1.0.4-rc4',
  createdAt:new Date().toISOString(),
  data:NGTStore.data()
 };

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
 if(el){
  el.click();
 }
}

function localRestore(file){
 if(!file){
  return;
 }

 if(!confirm('Backup-Datei laden? Aktuelle lokale Daten können überschrieben werden.')){
  return;
 }

 const r=new FileReader();
 r.onload=function(){
  try{
   const obj=JSON.parse(String(r.result||'{}'));
   const data=obj.data||obj;
   NGTStore.importJson(JSON.stringify(data));
   alert('Backup geladen. App wird neu gestartet.');
   location.reload();
  }catch(e){
   alert('Import fehlgeschlagen: '+(e.message||e));
  }
 };
 r.onerror=function(){
  alert('Datei konnte nicht gelesen werden.');
 };
 r.readAsText(file);
}

function driveBackup(){
 loadDrive(function(){
  NGTCloudBackup.uploadToDrive()
   .then(function(){
    alert('Drive-Backup gespeichert.');
   })
   .catch(function(e){
    alert(e.message||String(e));
   });
 });
}

function driveRestoreLatest(){
 if(!confirm('Neuestes Google-Drive-Backup laden? Aktuelle lokale Daten können überschrieben werden.')){
  return;
 }

 loadDrive(function(){
  NGTCloudBackup.listDriveBackups(1)
   .then(function(files){
    if(!files||!files.length){
     throw new Error('Kein Drive-Backup gefunden.');
    }
    return NGTCloudBackup.downloadDriveFile(files[0].id);
   })
   .then(function(obj){
    NGTCloudBackup.restoreFromObject(obj);
    alert('Drive-Backup geladen. App wird neu gestartet.');
    location.reload();
   })
   .catch(function(e){
    alert(e.message||String(e));
   });
 });
}

function driveList(){
 loadDrive(function(){
  const box=document.getElementById('driveBackups');
  if(!box){
   return;
  }

  box.innerHTML='<div class="subcard">Backup-Historie wird geladen...</div>';

  NGTCloudBackup.listDriveBackups(20)
   .then(function(files){
    if(!files||!files.length){
     box.innerHTML='<div class="subcard">Keine Drive-Backups gefunden.</div>';
     return;
    }

    box.innerHTML='<div class="subcard"><h3>Backup-Historie</h3><p class="muted">'+files.length+' Backups gefunden.</p></div>'+
     files.map(function(f){
      return `<div class="subcard">
       <b>${esc(f.name)}</b><br>
       ${esc(new Date(f.createdTime).toLocaleString('de-DE'))}
       <div class="btnRow">
        <button onclick="NGTAccount.driveRestore('${esc(f.id)}')">Wiederherstellen</button>
       </div>
      </div>`;
     }).join('');
   })
   .catch(function(e){
    box.innerHTML='<div class="subcard danger">'+esc(e.message||String(e))+'</div>';
   });
 });
}

function driveRestore(id){
 if(!confirm('Dieses Drive-Backup wiederherstellen? Aktuelle lokale Daten können überschrieben werden.')){
  return;
 }

 loadDrive(function(){
  NGTCloudBackup.downloadDriveFile(id)
   .then(function(obj){
    NGTCloudBackup.restoreFromObject(obj);
    alert('Backup wiederhergestellt. App wird neu gestartet.');
    location.reload();
   })
   .catch(function(e){
    alert(e.message||String(e));
   });
 });
}

async function clear(){
 if(!confirm('Konto lokal entfernen? Lokale Tierdaten bleiben erhalten.')){
  return;
 }

 localStorage.removeItem(KEY);
 localStorage.removeItem(GOOGLE_KEY);

 if(window.NGTFirebaseSync){
  try{
   await NGTFirebaseSync.signOut();
  }catch(e){}
 }

 NGT500.route('account');
}

function afterRender(){
 setTimeout(function(){
  try{
   if(window.NGTDashboard&&NGTDashboard.updateCloudStatus){
    NGTDashboard.updateCloudStatus();
   }
  }catch(e){}
 },200);
}

window.NGTAccount={
 googleSignIn,
 firestoreSave,
 firestoreLoad,
 localBackup,
 localRestorePick,
 localRestore,
 driveBackup,
 driveRestoreLatest,
 driveList,
 driveRestore,
 clear
};

NGT500.register('account',{render,afterRender});

})();
