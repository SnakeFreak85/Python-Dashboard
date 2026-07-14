(function(){
'use strict';

const KEY='tc_user_profile';
const GOOGLE_KEY='ngt_google_user';

function esc(v){return NGT500.esc(v||'')}
function profile(){try{return JSON.parse(localStorage.getItem(KEY)||'{}')||{}}catch(e){return {}}}
function first(v){return String(v||'').split(' ')[0]||''}
function animalCount(){try{return NGTStore.allAnimals?NGTStore.allAnimals().length:0}catch(e){return 0}}
function syncText(){try{return window.NGTFirebaseSync?NGTFirebaseSync.label():'Firestore lädt...'}catch(e){return 'Nicht geprüft'}}

function initials(p){
  const n=p.name||p.displayName||p.email||'TC';
  return String(n).split(/\s+/).map(x=>x[0]).join('').slice(0,2).toUpperCase()||'TC';
}

function render(){
  const p=profile();
  const ok=!!p.email;
  const displayName=p.name||p.displayName||'';
  const welcome=first(p.given_name||p.name||p.displayName);

  return `
    <section class="tc2Account">
      <div class="tc2AccountHero">
        <div>
          <h2>👤 Konto</h2>
          <p>Konto, Cloud-Status und lokale Sicherungen.</p>
        </div>
      </div>

      <section class="tc2AccountProfile">
        ${
          ok
          ? `
            ${p.picture
              ? `<img src="${esc(p.picture)}" alt="">`
              : `<div class="tc2AccountAvatar">${esc(initials(p))}</div>`
            }
            <div>
              <b>Angemeldet</b>
              <strong>${esc(displayName||welcome||'TerraControl Nutzer')}</strong>
              <span>${esc(p.email)}</span>
            </div>
          `
          : `
            <div class="tc2AccountAvatar">TC</div>
            <div>
              <b>Nicht angemeldet</b>
              <strong>Lokaler Modus</strong>
              <span>Anmelden, Speichern und Laden befinden sich auf der Startseite.</span>
            </div>
          `
        }
      </section>

      <section class="tc2AccountCard">
        <div class="tc2AccountHead">
          <h3>☁ Cloud</h3>
        </div>
        <div class="tc2AccountRows">
          <div>
            <span>Status</span>
            <b>${esc(syncText())}</b>
          </div>
          <div>
            <span>Lokale Tiere</span>
            <b>${animalCount()}</b>
          </div>
        </div>
        <p>Anmeldung und Cloud-Synchronisation steuerst du über die Startseite.</p>
      </section>

      <section class="tc2AccountCard">
        <div class="tc2AccountHead">
          <h3>📦 Lokale Sicherung</h3>
        </div>
        <p>Backup-Dateien funktionieren unabhängig von Firebase und können lokal gespeichert oder wieder geladen werden.</p>
        <div class="tc2AccountActions">
          <button onclick="NGTAccount.localBackup()">Backup speichern</button>
          <button onclick="NGTAccount.localRestorePick()">Backup laden</button>
        </div>
        <input id="accountRestoreFile" class="hidden" type="file" accept="application/json,.json" onchange="NGTAccount.localRestore(this.files[0])">
      </section>

      <section class="tc2AccountCard">
        <div class="tc2AccountHead">
          <h3>⚠️ Konto lokal</h3>
        </div>
        <p>Entfernt nur das lokale Profil. Tierdaten bleiben auf diesem Gerät erhalten.</p>
        <button class="tc2AccountDanger" onclick="NGTAccount.clear()">Abmelden / Profil entfernen</button>
      </section>
    </section>
  `;
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

async function localRestore(file){
  if(!file)return;
  if(!await NGT500.confirmAction(
   'Backup-Datei laden? Aktuelle lokale Daten können überschrieben werden.',
   {
    title:'Lokales Backup laden',
    confirmText:'Backup laden',
    danger:true
   }
  ))return;

  const r=new FileReader();
  r.onload=async function(){
    try{
      const obj=JSON.parse(String(r.result||'{}'));
      const data=obj.data||obj;
      NGTStore.importJson(JSON.stringify(data));
      await NGT500.notice(
       'Backup geladen. App wird neu gestartet.',
       {title:'Backup wiederhergestellt'}
      );
      location.reload();
    }catch(e){
      NGT500.toast(
       'Import fehlgeschlagen: '+(e.message||e),
       'danger'
      );
    }
  };
  r.onerror=function(){
   NGT500.toast('Datei konnte nicht gelesen werden.','danger');
  };
  r.readAsText(file);
}

async function clear(){
  if(!await NGT500.confirmAction(
   'Konto lokal entfernen? Lokale Tierdaten bleiben erhalten.',
   {
    title:'Lokales Konto entfernen',
    confirmText:'Konto entfernen',
    danger:true
   }
  ))return;
  localStorage.removeItem(KEY);
  localStorage.removeItem(GOOGLE_KEY);
  if(window.NGTFirebaseSync){
    try{await NGTFirebaseSync.signOut()}catch(e){}
  }
  NGT500.route('account');
}

function afterRender(){
  try{
    if(window.NGTDashboard&&NGTDashboard.updateCloudStatus)NGTDashboard.updateCloudStatus();
  }catch(e){}
}

window.NGTAccount={googleSignIn,firestoreSave,firestoreLoad,localBackup,localRestorePick,localRestore,clear};
NGT500.register('account',{render,afterRender});

})();
