(function(){
'use strict';

let statusMessage='';
let statusType='';

function esc(value){
 return NGT500.esc(value||'');
}

function todayFileName(){
 const stamp=new Date()
  .toISOString()
  .slice(0,19)
  .replace(/[:.]/g,'-');

 return 'TerraControl-Backup-'+stamp+'.json';
}

function animalCount(){
 try{
  return NGTStore.allAnimals
   ?NGTStore.allAnimals().length
   :0;
 }catch(error){
  return 0;
 }
}

function foodCount(){
 try{
  return NGTStore
   .foodInventory()
   .length;
 }catch(error){
  return 0;
 }
}

function backupSize(){
 try{
  const json=NGTStore.exportJson();
  const bytes=new Blob([json]).size;

  if(bytes<1024){
   return bytes+' B';
  }

  if(bytes<1024*1024){
   return Math.round(bytes/1024)+' KB';
  }

  return (bytes/(1024*1024)).toFixed(1)+' MB';

 }catch(error){
  return '-';
 }
}

function statusBox(){
 if(!statusMessage)return '';

 return `<div class="tc2SubCard ${esc(statusType)}">
  <b>${esc(statusMessage)}</b>
 </div>`;
}

function render(){
 return `<section class="tc2Settings tc2BackupPage">
  <div class="tc2SettingsHero">
   <div>
    <h2>💾 Backup</h2>
    <p>
     Lokale TerraControl-Daten exportieren oder aus einer
     Sicherungsdatei wiederherstellen.
    </p>
   </div>
  </div>

  <div class="tc2ProfileOverviewGrid">
   <div>
    <small>Tiere</small>
    <b>${animalCount()}</b>
   </div>

   <div>
    <small>Futterpositionen</small>
    <b>${foodCount()}</b>
   </div>

   <div>
    <small>Backup-Größe</small>
    <b>${esc(backupSize())}</b>
   </div>

   <div>
    <small>Format</small>
    <b>JSON</b>
   </div>
  </div>

  ${statusBox()}

  <section class="tc2SettingsSection">
   <div class="tc2SettingsSectionHead">
    <div>
     <h3>⬇️ Backup exportieren</h3>
     <p class="muted">
      Speichert alle lokalen TerraControl-Daten in einer
      Sicherungsdatei auf deinem Gerät.
     </p>
    </div>
   </div>

   <div class="tc2InfoRows">
    <div>
     <b>Enthalten</b>
     <span>
      Tiere, Fütterungen, Gewichte, Fotos-Metadaten,
      Futterbestand und Einstellungen
     </span>
    </div>

    <div>
     <b>Dateityp</b>
     <span>TerraControl JSON-Backup</span>
    </div>
   </div>

   <div class="tc2SettingsActions">
    <button onclick="NGTBackup.export()">
     Backup herunterladen
    </button>
   </div>
  </section>

  <section class="tc2SettingsSection">
   <div class="tc2SettingsSectionHead">
    <div>
     <h3>⬆️ Backup importieren</h3>
     <p class="muted">
      Lädt eine vorhandene TerraControl-Sicherungsdatei.
     </p>
    </div>
   </div>

   <div class="tc2SubCard warn">
    <b>Wichtig</b>
    <p>
     Beim Import können die aktuell lokal gespeicherten Daten
     überschrieben werden. Erstelle vorher ein aktuelles Backup.
    </p>
   </div>

   <input
    id="backupFile"
    type="file"
    accept="application/json,.json"
    onchange="NGTBackup.selectFile(this.files[0])"
   >

   <div id="backupFileInfo" class="tc2SettingsRows">
    <div>
     <span>Ausgewählte Datei</span>
     <b>Keine Datei ausgewählt</b>
    </div>
   </div>

   <div class="tc2SettingsActions">
    <button
     id="backupImportButton"
     onclick="NGTBackup.importSelected()"
     disabled
    >
     Backup wiederherstellen
    </button>
   </div>
  </section>

  <section class="tc2SettingsSection">
   <h3>☁️ Cloud-Sicherung</h3>

   <p class="muted">
    Die lokale Backup-Datei funktioniert unabhängig von Firebase.
    Cloud-Synchronisation und lokale Sicherungen können parallel
    verwendet werden.
   </p>

   <div class="tc2SettingsActions">
    <button onclick="NGT500.route('dashboard')">
     Zur Startseite
    </button>

    <button onclick="NGTApp.loadAccount&&NGTApp.loadAccount()">
     Konto und Cloud
    </button>
   </div>
  </section>
 </section>`;
}

function exportData(){
 try{
  const payload=NGTStore.exportBackup();

  const blob=new Blob(
   [JSON.stringify(payload,null,2)],
   {
    type:'application/json'
   }
  );

  const url=URL.createObjectURL(blob);
  const link=document.createElement('a');

  link.href=url;
  link.download=todayFileName();

  document.body.appendChild(link);
  link.click();
  link.remove();

  URL.revokeObjectURL(url);

  statusMessage='Backup erfolgreich erstellt.';
  statusType='ok';

  NGT500.route('backup');

 }catch(error){
  console.error(error);

  statusMessage=
   'Backup konnte nicht erstellt werden: '+
   (error.message||error);

  statusType='danger';

  NGT500.route('backup');
 }
}

function selectFile(file){
 const info=document.getElementById('backupFileInfo');
 const button=document.getElementById('backupImportButton');

 if(!file){
  window.NGTBackup.selectedFile=null;

  if(info){
   info.innerHTML=`<div>
    <span>Ausgewählte Datei</span>
    <b>Keine Datei ausgewählt</b>
   </div>`;
  }

  if(button){
   button.disabled=true;
  }

  return;
 }

 window.NGTBackup.selectedFile=file;

 const size=file.size<1024
  ?file.size+' B'
  :Math.round(file.size/1024)+' KB';

 if(info){
  info.innerHTML=`
   <div>
    <span>Dateiname</span>
    <b>${esc(file.name)}</b>
   </div>

   <div>
    <span>Dateigröße</span>
    <b>${esc(size)}</b>
   </div>
  `;
 }

 if(button){
  button.disabled=false;
 }
}

function importSelected(){
 const file=window.NGTBackup.selectedFile;

 if(!file){
  NGT500.toast(
   'Bitte zuerst eine Backup-Datei auswählen.',
   'warn'
  );
  return;
 }

 importData(file);
}

async function importData(file){
 if(!file)return;

 if(!await NGT500.confirmAction(
  'Backup wirklich laden? Die aktuellen lokalen Daten können überschrieben werden.',
  {
   title:'Backup wiederherstellen',
   confirmText:'Backup laden',
   danger:true
  }
 )){
  return;
 }

 const reader=new FileReader();

 reader.onload=async function(){
  try{
   NGTStore.importBackup(
    String(reader.result||'{}')
   );

   statusMessage='Backup erfolgreich wiederhergestellt.';
   statusType='ok';

   await NGT500.notice(
    'Backup erfolgreich geladen. TerraControl wird neu gestartet.',
    {title:'Backup wiederhergestellt'}
   );

   location.reload();

  }catch(error){
   console.error(error);

   statusMessage=
    'Import fehlgeschlagen: '+
    (error.message||error);

   statusType='danger';

   NGT500.route('backup');
  }
 };

 reader.onerror=function(){
  statusMessage='Die Backup-Datei konnte nicht gelesen werden.';
  statusType='danger';

  NGT500.route('backup');
 };

 reader.readAsText(file);
}

window.NGTBackup={
 selectedFile:null,
 export:exportData,
 selectFile:selectFile,
 importSelected:importSelected,
 import:importData
};

NGT500.register('backup',{
 render:render
});

})();
