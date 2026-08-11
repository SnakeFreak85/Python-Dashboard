(function(){
'use strict';

const KEY='tc_user_profile';
const GOOGLE_KEY='ngt_google_user';

function esc(v){return NGT500.esc(v||'')}
function profile(){try{return JSON.parse(localStorage.getItem(KEY)||'{}')||{}}catch(e){return {}}}
function first(v){return String(v||'').split(' ')[0]||''}
function animalCount(){try{return NGTStore.allAnimals?NGTStore.allAnimals().length:0}catch(e){return 0}}
function syncText(){try{return window.NGTFirebaseSync?NGTFirebaseSync.label():'Firestore lädt...'}catch(e){return 'Nicht geprüft'}}
function household(){
 try{
  return window.NGTFirebaseSync&&NGTFirebaseSync.householdState
   ?NGTFirebaseSync.householdState()
   :{type:'personal',name:'Persönlicher Bestand',role:'owner'};
 }catch(e){
  return {type:'personal',name:'Persönlicher Bestand',role:'owner'};
 }
}

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
              <span>Du kannst TerraControl lokal verwenden oder dich hier anmelden.</span>
            </div>
          `
        }
      </section>

      <section class="tc2AccountCard tc2HouseholdCard">
        <div class="tc2AccountHead">
          <h3>👥 Gemeinsamer Bestand</h3>
        </div>
        <div id="accountHouseholdPanel">
          <p>Haushalt und Einladungen werden geladen …</p>
        </div>
      </section>

      <section class="tc2AccountCard">
        <div class="tc2AccountHead">
          <h3>☁ Cloud</h3>
        </div>
        <div class="tc2AccountRows">
          <div>
            <span>Status</span>
            <b id="accountCloudStatus">${esc(syncText())}</b>
          </div>
          <div>
            <span>Lokale Tiere</span>
            <b>${animalCount()}</b>
          </div>
        </div>
        <p>Anmeldung und Cloud-Synchronisation werden zentral in diesem Bereich gesteuert.</p>
        <div class="tc2AccountActions tc2AccountCloudActions">
          <button onclick="NGTAccount.googleSignIn()">Anmelden</button>
          <button onclick="NGTAccount.firestoreSave()">Cloud speichern</button>
          <button onclick="NGTAccount.firestoreLoad()">Cloud laden</button>
        </div>
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

function updateCloudStatus(){
 const element=document.getElementById('accountCloudStatus');
 if(element)element.textContent=syncText();
}

function invitationMarkup(rows){
 if(!rows.length)return '';

 return `<div class="tc2HouseholdInvites">
  <h4>Offene Einladungen</h4>
  ${rows.map(function(row){
   return `<div class="tc2HouseholdInvite">
    <div><b>${esc(row.householdName||'Gemeinsamer Bestand')}</b><span>Einladung von ${esc(row.invitedByName||row.invitedByEmail||'einem Mitglied')}</span></div>
    <button type="button" onclick="NGTAccount.acceptHouseholdInvite('${esc(row.id)}')">Annehmen</button>
   </div>`;
  }).join('')}
 </div>`;
}

function memberMarkup(rows,scope,owner){
 return `<div class="tc2HouseholdMembers">
  <h4>Mitglieder</h4>
  ${rows.map(function(row){
   const removable=owner&&row.uid!==scope.ownerUid;
   return `<div class="tc2HouseholdMember">
    <div><b>${esc(row.displayName||row.email||'Mitglied')}</b><span>${esc(row.email||'')}${row.role==='owner'?' · Eigentümer':' · Mitglied'}</span></div>
    ${removable?`<button type="button" class="danger" onclick="NGTAccount.removeHouseholdMember('${esc(row.uid)}')">Entfernen</button>`:''}
   </div>`;
  }).join('')}
 </div>`;
}

async function renderHouseholdPanel(){
 const panel=document.getElementById('accountHouseholdPanel');
 if(!panel)return;

 if(!window.NGTFirebaseSync||!NGTFirebaseSync.currentUser()){
  panel.innerHTML='<p>Melde dich zuerst mit deinem Google-Konto an, um einen gemeinsamen Bestand zu erstellen oder eine Einladung anzunehmen.</p>';
  return;
 }

 panel.innerHTML='<p>Haushalt und Einladungen werden geladen …</p>';

 try{
  const scope=household();
  const invitations=await NGTFirebaseSync.pendingInvitations();

  if(scope.type!=='household'){
   panel.innerHTML=`
    <div class="tc2HouseholdCurrent"><b>Persönlicher Bestand</b><span>Deine Cloud-Daten gehören derzeit nur zu deinem Konto.</span></div>
    ${invitationMarkup(invitations)}
    <div class="tc2HouseholdCreate">
     <label><span>Name des gemeinsamen Bestands</span><input id="householdName" maxlength="80" placeholder="z. B. Familie Döring"></label>
     <p>Beim Erstellen wird dein aktueller Bestand sicher in den neuen Haushalt kopiert. Dein bisheriger persönlicher Cloud-Stand wird nicht gelöscht.</p>
     <button type="button" onclick="NGTAccount.createHousehold()">Gemeinsamen Bestand erstellen</button>
    </div>`;
   return;
  }

  const owner=NGTFirebaseSync.householdOwner();
  const members=await NGTFirebaseSync.householdMembers();

  panel.innerHTML=`
   <div class="tc2HouseholdCurrent is-shared"><b>${esc(scope.name)}</b><span>${owner?'Du bist Eigentümer.':'Du bist Mitglied.'} Änderungen werden mit allen Mitgliedern synchronisiert.</span></div>
   ${invitationMarkup(invitations)}
   ${memberMarkup(members,scope,owner)}
   ${owner?`<div class="tc2HouseholdInviteForm"><label><span>Mitglied per Google-E-Mail einladen</span><input id="householdInviteEmail" type="email" autocomplete="email" placeholder="name@gmail.com"></label><button type="button" onclick="NGTAccount.inviteHouseholdMember()">Einladung senden</button></div>`:`<button type="button" class="tc2AccountDanger" onclick="NGTAccount.leaveHousehold()">Gemeinsamen Bestand verlassen</button>`}`;
 }catch(error){
  panel.innerHTML='<p class="danger">Gemeinsamer Bestand konnte nicht geladen werden: '+esc(error.message||error)+'</p>';
 }
}

async function createHousehold(){
 const field=document.getElementById('householdName');
 const name=String(field&&field.value||'').trim();
 if(!name){NGT500.toast('Bitte einen Namen für den gemeinsamen Bestand eingeben.','warn');return;}

 if(!await NGT500.confirmAction(
  'Deinen aktuellen Bestand in „'+name+'“ kopieren und ab jetzt gemeinsam synchronisieren?',
  {title:'Gemeinsamen Bestand erstellen',confirmText:'Erstellen'}
 ))return;

 try{
  await NGTFirebaseSync.createHousehold(name);
  NGT500.toast('Gemeinsamer Bestand wurde erstellt.','success');
  await renderHouseholdPanel();
 }catch(error){
  NGT500.toast(error.message||String(error),'danger');
 }
}

async function inviteHouseholdMember(){
 const field=document.getElementById('householdInviteEmail');
 const email=String(field&&field.value||'').trim();

 try{
  await NGTFirebaseSync.inviteMember(email);
  if(field)field.value='';
  NGT500.toast('Einladung wurde für '+email+' hinterlegt.','success');
 }catch(error){
  NGT500.toast(error.message||String(error),'danger');
 }
}

async function acceptHouseholdInvite(id){
 if(!await NGT500.confirmAction(
  'Einladung annehmen? Die App wechselt anschließend zum gemeinsamen Bestand. Dein persönlicher Cloud-Stand bleibt als Sicherung erhalten.',
  {title:'Gemeinsamen Bestand öffnen',confirmText:'Einladung annehmen'}
 ))return;

 try{
  await NGTFirebaseSync.acceptInvitation(id);
  NGT500.toast('Gemeinsamer Bestand wurde geöffnet.','success');
  NGT500.route('dashboard',{}, {replace:true,noHistory:true});
 }catch(error){
  NGT500.toast(error.message||String(error),'danger');
 }
}

async function removeHouseholdMember(userId){
 if(!await NGT500.confirmAction(
  'Dieses Mitglied aus dem gemeinsamen Bestand entfernen?',
  {title:'Mitglied entfernen',confirmText:'Entfernen',danger:true}
 ))return;

 try{
  await NGTFirebaseSync.removeHouseholdMember(userId);
  NGT500.toast('Mitglied wurde entfernt.','success');
  await renderHouseholdPanel();
 }catch(error){
  NGT500.toast(error.message||String(error),'danger');
 }
}

async function leaveHousehold(){
 if(!await NGT500.confirmAction(
  'Gemeinsamen Bestand verlassen? Danach wird wieder dein persönlicher Cloud-Bestand geladen.',
  {title:'Gemeinsamen Bestand verlassen',confirmText:'Verlassen',danger:true}
 ))return;

 try{
  await NGTFirebaseSync.leaveHousehold();
  NGT500.toast('Du hast den gemeinsamen Bestand verlassen.','success');
  NGT500.route('dashboard',{}, {replace:true,noHistory:true});
 }catch(error){
  NGT500.toast(error.message||String(error),'danger');
 }
}

async function googleSignIn(){
 if(!window.NGTFirebaseSync)return;
 await NGTFirebaseSync.signIn();
 updateCloudStatus();
}

async function firestoreSave(){
 if(!window.NGTFirebaseSync)return;
 await NGTFirebaseSync.saveCloud();
 updateCloudStatus();
}

async function firestoreLoad(){
 if(!window.NGTFirebaseSync)return;
 if(!await NGT500.confirmAction(
  'Cloud-Daten laden? Der lokale Stand wird durch den gespeicherten Cloud-Stand ersetzt.',
  {
   title:'Cloud-Daten laden',
   confirmText:'Daten laden',
   danger:true
  }
 ))return;
 await NGTFirebaseSync.loadCloud({force:true});
 location.reload();
}

function localBackup(){
  const payload=NGTStore.exportBackup();
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
      NGTStore.importBackup(
       String(r.result||'{}')
      );
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
 updateCloudStatus();
 renderHouseholdPanel();
}

window.NGTAccount={
 googleSignIn,
 firestoreSave,
 firestoreLoad,
 localBackup,
 localRestorePick,
 localRestore,
 clear,
 createHousehold,
 inviteHouseholdMember,
 acceptHouseholdInvite,
 removeHouseholdMember,
 leaveHousehold
};
NGT500.register('account',{render,afterRender});

if(NGT500.on){
 NGT500.on('firebase:household',function(){
  renderHouseholdPanel();
 });
}

})();
