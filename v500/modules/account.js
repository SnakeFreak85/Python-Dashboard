<!doctype html>
<html lang="de">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>TerraControl account.js RC4</title>
<style>
body{font-family:system-ui,-apple-system,Segoe UI,Roboto,Arial,sans-serif;margin:20px;background:#0d1722;color:#eef4ff}
textarea{width:100%;height:80vh;font-family:ui-monospace,SFMono-Regular,Consolas,monospace;font-size:13px;line-height:1.4;background:#07111d;color:#eef4ff;border:1px solid #29415a;border-radius:10px;padding:12px;box-sizing:border-box}
button{font-size:16px;padding:12px 16px;border-radius:10px;border:0;margin-bottom:12px}
code{background:#07111d;padding:2px 6px;border-radius:5px}
</style>
</head>
<body>
<h1>TerraControl account.js RC4</h1>
<p>Alles im Feld markieren/kopieren und komplett in <code>v500/modules/account.js</code> einfügen.</p>
<button onclick="navigator.clipboard.writeText(document.getElementById('code').value).then(()=>alert('Code kopiert'))">Code kopieren</button>
<textarea id="code" spellcheck="false">(function(){
&#x27;use strict&#x27;;

const KEY=&#x27;tc_user_profile&#x27;;
const GOOGLE_KEY=&#x27;ngt_google_user&#x27;;

function esc(v){
 return NGT500.esc(v||&#x27;&#x27;);
}

function get(){
 try{
  return JSON.parse(localStorage.getItem(KEY)||&#x27;{}&#x27;)||{};
 }catch(e){
  return {};
 }
}

function first(v){
 return String(v||&#x27;&#x27;).split(&#x27; &#x27;)[0]||&#x27;&#x27;;
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
 return &#x27;Firestore lädt...&#x27;;
}

function loadDrive(cb){
 if(window.NGTCloudBackup){
  cb();
  return;
 }

 const s=document.createElement(&#x27;script&#x27;);
 s.src=&#x27;./v500/cloud-backup.js?v=1.0.4-exportonly&#x27;;
 s.onload=cb;
 s.onerror=function(){
  alert(&#x27;Drive-Backup-Modul konnte nicht geladen werden.&#x27;);
 };
 document.head.appendChild(s);
}

function render(){
 const p=get();
 const ok=!!p.email;
 const displayName=p.name||p.displayName||&#x27;&#x27;;
 const welcome=first(p.given_name||p.name||p.displayName);

 return `&lt;div class=&quot;card&quot;&gt;
  &lt;h2&gt;👤 Konto&lt;/h2&gt;
  &lt;p class=&quot;muted&quot;&gt;Firebase-Anmeldung, Firestore-Synchronisierung und optionale Backup-Dateien.&lt;/p&gt;

  ${ok?`&lt;div class=&quot;subcard ok&quot;&gt;
   ${p.picture?`&lt;img src=&quot;${esc(p.picture)}&quot; style=&quot;width:72px;height:72px;border-radius:50%;object-fit:cover;float:right;margin-left:12px&quot;&gt;`:&#x27;&#x27;}
   &lt;b&gt;Angemeldet&lt;/b&gt;&lt;br&gt;
   ${esc(displayName)}&lt;br&gt;
   ${esc(p.email)}&lt;br&gt;
   &lt;span class=&quot;muted&quot;&gt;Willkommen ${esc(welcome)}&lt;/span&gt;
  &lt;/div&gt;`:`&lt;div class=&quot;subcard&quot;&gt;
   &lt;b&gt;Noch nicht angemeldet&lt;/b&gt;&lt;br&gt;
   &lt;span class=&quot;muted&quot;&gt;Melde dich mit Google/Firebase an.&lt;/span&gt;
  &lt;/div&gt;`}

  &lt;div class=&quot;subcard&quot;&gt;
   &lt;h3&gt;🔥 Firebase / Firestore&lt;/h3&gt;
   &lt;p&gt;&lt;b&gt;Status:&lt;/b&gt;&lt;br&gt;${esc(syncText())}&lt;/p&gt;
   &lt;p&gt;&lt;b&gt;Lokale Tiere:&lt;/b&gt;&lt;br&gt;${animalCount()}&lt;/p&gt;
   &lt;p class=&quot;muted&quot;&gt;Firestore ist jetzt der Hauptspeicher. Tiere werden automatisch geladen und nach Änderungen automatisch gespeichert.&lt;/p&gt;
   &lt;div class=&quot;btnRow&quot;&gt;
    &lt;button onclick=&quot;NGTAccount.googleSignIn()&quot;&gt;Mit Google anmelden&lt;/button&gt;
    &lt;button onclick=&quot;NGTAccount.firestoreSave()&quot;&gt;Jetzt in Firestore speichern&lt;/button&gt;
    &lt;button onclick=&quot;NGTAccount.firestoreLoad()&quot;&gt;Aus Firestore laden&lt;/button&gt;
   &lt;/div&gt;
  &lt;/div&gt;

  &lt;div class=&quot;subcard&quot;&gt;
   &lt;h3&gt;📦 Lokale Sicherung&lt;/h3&gt;
   &lt;p class=&quot;muted&quot;&gt;Lokales Backup als Datei. Unabhängig von Firebase.&lt;/p&gt;
   &lt;div class=&quot;btnRow&quot;&gt;
    &lt;button onclick=&quot;NGTAccount.localBackup()&quot;&gt;Backup-Datei speichern&lt;/button&gt;
    &lt;button onclick=&quot;NGTAccount.localRestorePick()&quot;&gt;Backup-Datei laden&lt;/button&gt;
   &lt;/div&gt;
   &lt;input id=&quot;accountRestoreFile&quot; type=&quot;file&quot; accept=&quot;application/json,.json&quot; style=&quot;display:none&quot; onchange=&quot;NGTAccount.localRestore(this.files[0])&quot;&gt;
  &lt;/div&gt;

  &lt;div class=&quot;subcard&quot;&gt;
   &lt;h3&gt;☁️ Google Drive optional&lt;/h3&gt;
   &lt;p class=&quot;muted&quot;&gt;Drive ist nur noch optionales Datei-Backup, nicht mehr Haupt-Synchronisierung.&lt;/p&gt;
   &lt;div class=&quot;btnRow&quot;&gt;
    &lt;button onclick=&quot;NGTAccount.driveBackup()&quot;&gt;In Google Drive sichern&lt;/button&gt;
    &lt;button onclick=&quot;NGTAccount.driveRestoreLatest()&quot;&gt;Neuestes Drive-Backup laden&lt;/button&gt;
    &lt;button onclick=&quot;NGTAccount.driveList()&quot;&gt;Backup-Historie&lt;/button&gt;
   &lt;/div&gt;
  &lt;/div&gt;

  &lt;div id=&quot;driveBackups&quot;&gt;&lt;/div&gt;

  &lt;button class=&quot;danger&quot; onclick=&quot;NGTAccount.clear()&quot;&gt;Abmelden / Profil entfernen&lt;/button&gt;
 &lt;/div&gt;`;
}

async function googleSignIn(){
 if(window.NGTFirebaseSync){
  try{
   await NGTFirebaseSync.signIn();
   return;
  }catch(e){
   alert(&#x27;Firebase-Anmeldung fehlgeschlagen: &#x27;+(e.message||e));
   return;
  }
 }

 alert(&#x27;Firebase-Sync ist noch nicht geladen. Bitte App neu laden.&#x27;);
}

async function firestoreSave(){
 if(!window.NGTFirebaseSync){
  alert(&#x27;Firebase-Sync lädt noch.&#x27;);
  return;
 }

 try{
  await NGTFirebaseSync.saveCloud();
  alert(&#x27;Firestore gespeichert.&#x27;);
  NGT500.route(&#x27;account&#x27;);
 }catch(e){
  alert(&#x27;Firestore speichern fehlgeschlagen: &#x27;+(e.message||e));
 }
}

async function firestoreLoad(){
 if(!window.NGTFirebaseSync){
  alert(&#x27;Firebase-Sync lädt noch.&#x27;);
  return;
 }

 if(!confirm(&#x27;Daten aus Firestore laden? Lokale Daten können überschrieben werden.&#x27;)){
  return;
 }

 try{
  await NGTFirebaseSync.loadCloud();
  alert(&#x27;Firestore geladen. App wird neu gestartet.&#x27;);
  location.reload();
 }catch(e){
  alert(&#x27;Firestore laden fehlgeschlagen: &#x27;+(e.message||e));
 }
}

function localBackup(){
 const payload={
  app:&#x27;TerraControl&#x27;,
  type:&#x27;local-backup&#x27;,
  version:&#x27;1.0.4-rc4&#x27;,
  createdAt:new Date().toISOString(),
  data:NGTStore.data()
 };

 const blob=new Blob([JSON.stringify(payload,null,2)],{type:&#x27;application/json&#x27;});
 const url=URL.createObjectURL(blob);
 const a=document.createElement(&#x27;a&#x27;);
 a.href=url;
 a.download=&#x27;TerraControl-Backup-&#x27;+new Date().toISOString().slice(0,19).replace(/[:.]/g,&#x27;-&#x27;)+&#x27;.json&#x27;;
 document.body.appendChild(a);
 a.click();
 a.remove();
 URL.revokeObjectURL(url);
}

function localRestorePick(){
 const el=document.getElementById(&#x27;accountRestoreFile&#x27;);
 if(el){
  el.click();
 }
}

function localRestore(file){
 if(!file){
  return;
 }

 if(!confirm(&#x27;Backup-Datei laden? Aktuelle lokale Daten können überschrieben werden.&#x27;)){
  return;
 }

 const r=new FileReader();
 r.onload=function(){
  try{
   const obj=JSON.parse(String(r.result||&#x27;{}&#x27;));
   const data=obj.data||obj;
   NGTStore.importJson(JSON.stringify(data));
   alert(&#x27;Backup geladen. App wird neu gestartet.&#x27;);
   location.reload();
  }catch(e){
   alert(&#x27;Import fehlgeschlagen: &#x27;+(e.message||e));
  }
 };
 r.onerror=function(){
  alert(&#x27;Datei konnte nicht gelesen werden.&#x27;);
 };
 r.readAsText(file);
}

function driveBackup(){
 loadDrive(function(){
  NGTCloudBackup.uploadToDrive()
   .then(function(){
    alert(&#x27;Drive-Backup gespeichert.&#x27;);
   })
   .catch(function(e){
    alert(e.message||String(e));
   });
 });
}

function driveRestoreLatest(){
 if(!confirm(&#x27;Neuestes Google-Drive-Backup laden? Aktuelle lokale Daten können überschrieben werden.&#x27;)){
  return;
 }

 loadDrive(function(){
  NGTCloudBackup.listDriveBackups(1)
   .then(function(files){
    if(!files||!files.length){
     throw new Error(&#x27;Kein Drive-Backup gefunden.&#x27;);
    }
    return NGTCloudBackup.downloadDriveFile(files[0].id);
   })
   .then(function(obj){
    NGTCloudBackup.restoreFromObject(obj);
    alert(&#x27;Drive-Backup geladen. App wird neu gestartet.&#x27;);
    location.reload();
   })
   .catch(function(e){
    alert(e.message||String(e));
   });
 });
}

function driveList(){
 loadDrive(function(){
  const box=document.getElementById(&#x27;driveBackups&#x27;);
  if(!box){
   return;
  }

  box.innerHTML=&#x27;&lt;div class=&quot;subcard&quot;&gt;Backup-Historie wird geladen...&lt;/div&gt;&#x27;;

  NGTCloudBackup.listDriveBackups(20)
   .then(function(files){
    if(!files||!files.length){
     box.innerHTML=&#x27;&lt;div class=&quot;subcard&quot;&gt;Keine Drive-Backups gefunden.&lt;/div&gt;&#x27;;
     return;
    }

    box.innerHTML=&#x27;&lt;div class=&quot;subcard&quot;&gt;&lt;h3&gt;Backup-Historie&lt;/h3&gt;&lt;p class=&quot;muted&quot;&gt;&#x27;+files.length+&#x27; Backups gefunden.&lt;/p&gt;&lt;/div&gt;&#x27;+
     files.map(function(f){
      return `&lt;div class=&quot;subcard&quot;&gt;
       &lt;b&gt;${esc(f.name)}&lt;/b&gt;&lt;br&gt;
       ${esc(new Date(f.createdTime).toLocaleString(&#x27;de-DE&#x27;))}
       &lt;div class=&quot;btnRow&quot;&gt;
        &lt;button onclick=&quot;NGTAccount.driveRestore(&#x27;${esc(f.id)}&#x27;)&quot;&gt;Wiederherstellen&lt;/button&gt;
       &lt;/div&gt;
      &lt;/div&gt;`;
     }).join(&#x27;&#x27;);
   })
   .catch(function(e){
    box.innerHTML=&#x27;&lt;div class=&quot;subcard danger&quot;&gt;&#x27;+esc(e.message||String(e))+&#x27;&lt;/div&gt;&#x27;;
   });
 });
}

function driveRestore(id){
 if(!confirm(&#x27;Dieses Drive-Backup wiederherstellen? Aktuelle lokale Daten können überschrieben werden.&#x27;)){
  return;
 }

 loadDrive(function(){
  NGTCloudBackup.downloadDriveFile(id)
   .then(function(obj){
    NGTCloudBackup.restoreFromObject(obj);
    alert(&#x27;Backup wiederhergestellt. App wird neu gestartet.&#x27;);
    location.reload();
   })
   .catch(function(e){
    alert(e.message||String(e));
   });
 });
}

async function clear(){
 if(!confirm(&#x27;Konto lokal entfernen? Lokale Tierdaten bleiben erhalten.&#x27;)){
  return;
 }

 localStorage.removeItem(KEY);
 localStorage.removeItem(GOOGLE_KEY);

 if(window.NGTFirebaseSync){
  try{
   await NGTFirebaseSync.signOut();
  }catch(e){}
 }

 NGT500.route(&#x27;account&#x27;);
}

function afterRender(){
 setTimeout(function(){
  try{
   if(window.NGTDashboard&amp;&amp;NGTDashboard.updateCloudStatus){
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

NGT500.register(&#x27;account&#x27;,{render,afterRender});

})();</textarea>
</body>
</html>
