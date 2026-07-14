(function(){
'use strict';

const KEY='terracontrol_settings_v1';
const SELLER_KEY='ngt_seller_profile_v1';

let editMode='';

function storeSettings(){
 try{
  const data=
   window.NGTStore&&
   NGTStore.data
    ?NGTStore.data()
    :null;

  if(!data){
   return {};
  }

  data.settings=data.settings||{};

  return data.settings;

 }catch(error){
  return {};
 }
}

function legacyLoad(key){
 try{
  return JSON.parse(
   localStorage.getItem(key)||'{}'
  );
 }catch(error){
  return {};
 }
}

function load(){
 const stored=storeSettings();

 return Object.keys(stored).length
  ?stored
  :legacyLoad(KEY);
}

function seller(){
 const stored=storeSettings();

 if(
  stored.seller&&
  Object.keys(stored.seller).length
 ){
  return stored.seller;
 }

 return legacyLoad(
  SELLER_KEY
 );
}

function cloud(){
 try{
  return JSON.parse(
   localStorage.getItem(
    'terracontrol_cloud_meta_v1'
   )||'{}'
  );
 }catch(error){
  return {};
 }
}

function saveSettingsToStore(
 sellerData
){
 const data=NGTStore.data();

 data.settings=data.settings||{};
 data.settings.seller=sellerData;

 /*
  * Alte globale Intervallwerte werden bewusst entfernt.
  * Pflegeintervalle gehören ausschließlich zum jeweiligen Tier.
  */
 delete data.settings.defaults;

 NGTStore.save();
}

function message(
 text,
 type
){
 if(
  window.NGT500&&
  NGT500.toast
 ){
  NGT500.toast(
   text,
   type
  );

  return;
 }

 console.warn(text);
}

function mailto(subject){
 location.href=
  'mailto:saschad1711@gmail.com?subject='+
  encodeURIComponent(
   subject||
   'TerraControl Feedback'
  );
}

function esc(value){
 return NGT500.esc(
  value||''
 );
}

function field(
 id,
 label,
 value,
 type
){
 return `
  <label class="tc2SettingsField">
   <span>${esc(label)}</span>

   <input
    id="${esc(id)}"
    ${type?'type="'+esc(type)+'"':''}
    value="${esc(value)}"
   >
  </label>
 `;
}

function sellerSummary(profile){
 const hasData=
  profile.name||
  profile.street||
  profile.address||
  profile.city||
  profile.phone||
  profile.email||
  profile.mail;

 if(!hasData){
  return `
   <div class="tc2SettingsEmpty">
    <b>Noch keine Verkäuferdaten</b>

    <span>
     Füge deine Daten für Abgabenachweise hinzu.
    </span>
   </div>
  `;
 }

 return `
  <div class="tc2SettingsProfile">
   <b>
    ${esc(profile.name||'Unbenannter Verkäufer')}
   </b>

   <span>
    ${esc(
     profile.street||
     profile.address||
     ''
    )}
   </span>

   <span>
    ${esc(profile.city||'')}
   </span>

   <span>
    ${esc(profile.phone||'')}
   </span>

   <span>
    ${esc(
     profile.email||
     profile.mail||
     ''
    )}
   </span>
  </div>
 `;
}

function sellerEditor(profile){
 return `
  <div class="tc2SettingsEdit">
   ${field(
    'setSellerName',
    'Name',
    profile.name||''
   )}

   ${field(
    'setSellerStreet',
    'Straße / Hausnummer',
    profile.street||
    profile.address||
    ''
   )}

   ${field(
    'setSellerCity',
    'PLZ / Ort',
    profile.city||''
   )}

   ${field(
    'setSellerPhone',
    'Telefon',
    profile.phone||''
   )}

   ${field(
    'setSellerMail',
    'E-Mail',
    profile.email||
    profile.mail||
    ''
   )}

   <div class="tc2SettingsActions">
    <button onclick="NGTSettings.cancel()">
     Abbrechen
    </button>

    <button onclick="NGTSettings.saveSeller()">
     Speichern
    </button>
   </div>
  </div>
 `;
}

function render(){
 const profile=seller();
 const cloudMeta=cloud();

 const lastBackup=
  cloudMeta.lastBackupAt
   ?new Date(
     cloudMeta.lastBackupAt
    ).toLocaleString('de-DE')
   :'Noch keine Sicherung';

 return `
  <section class="tc2Settings">
   <div class="tc2SettingsHero">
    <div>
     <h2>⚙️ Einstellungen</h2>

     <p>
      Profil, Cloud und App-Informationen.
     </p>
    </div>
   </div>

   <div class="tc2SettingsSection">
    <div class="tc2SettingsSectionHead">
     <h3>👤 Verkäufer</h3>

     ${
      editMode==='seller'
       ?''
       :`
        <button
         onclick="NGTSettings.edit('seller')"
        >
         Bearbeiten
        </button>
       `
     }
    </div>

    ${
     editMode==='seller'
      ?sellerEditor(profile)
      :sellerSummary(profile)
    }
   </div>

   <div class="tc2SettingsSection">
    <h3>☁️ Cloud</h3>

    <div class="tc2SettingsStatus">
     <span>Letzte Sicherung</span>
     <b>${esc(lastBackup)}</b>
    </div>

    <div class="tc2SettingsActions">
     <button
      onclick="NGTApp.loadAccount&&NGTApp.loadAccount()"
     >
      Cloud öffnen
     </button>

     <button onclick="NGT500.route('backup')">
      Backup
     </button>
    </div>
   </div>

   <div class="tc2SettingsSection">
    <h3>📱 TerraControl</h3>

    <div class="tc2SettingsRows">
     <div>
      <span>Version</span>
      <b>1.0.4 RC11</b>
     </div>

     <div>
      <span>Design</span>
      <b>TC2</b>
     </div>

     <div>
      <span>Modus</span>
      <b>Mobile First</b>
     </div>
    </div>
   </div>

   <div class="tc2SettingsSection">
    <h3>Rechtliches & Support</h3>

    <div class="tc2SettingsActions">
     <button onclick="NGTSettings.privacy()">
      Datenschutz
     </button>

     <button onclick="NGTSettings.imprint()">
      Impressum
     </button>

     <button onclick="NGTSettings.feedback()">
      Feedback
     </button>

     <button onclick="NGTSettings.about()">
      Über
     </button>
    </div>

    <div id="settingsInfo"></div>
   </div>
  </section>
 `;
}

function rerender(){
 NGT500.route(
  'settings'
 );
}

function edit(mode){
 editMode=mode;
 rerender();
}

function cancel(){
 editMode='';
 rerender();
}

function saveSeller(){
 const street=
  document.getElementById(
   'setSellerStreet'
  ).value.trim();

 const mail=
  document.getElementById(
   'setSellerMail'
  ).value.trim();

 const profile={
  name:
   document.getElementById(
    'setSellerName'
   ).value.trim(),

  street:street,
  address:street,

  city:
   document.getElementById(
    'setSellerCity'
   ).value.trim(),

  phone:
   document.getElementById(
    'setSellerPhone'
   ).value.trim(),

  email:mail,
  mail:mail
 };

 saveSettingsToStore(
  profile
 );

 try{
  localStorage.setItem(
   SELLER_KEY,
   JSON.stringify(profile)
  );

  localStorage.setItem(
   KEY,
   JSON.stringify({
    seller:profile
   })
  );

 }catch(error){
  console.warn(
   'Lokale Einstellungen konnten nicht gespiegelt werden.',
   error
  );
 }

 editMode='';

 message(
  'Verkäuferdaten gespeichert.'
 );

 rerender();
}

function info(html){
 const box=
  document.getElementById(
   'settingsInfo'
  );

 if(box){
  box.innerHTML=
   '<div class="tc2SettingsInlineInfo">'+
   html+
   '</div>';
 }
}

function privacy(){
 info(
  '<h4>Datenschutz</h4>'+
  '<p>TerraControl speichert Tier- und Nutzerdaten lokal im Browser/App-Speicher. Cloud-Funktionen nutzen den angemeldeten Nutzer-Account.</p>'
 );
}

function imprint(){
 info(
  '<h4>Impressum</h4>'+
  '<p>Impressum wird vor Veröffentlichung mit den finalen Betreiberangaben ergänzt.</p>'
 );
}

function feedback(){
 mailto(
  'TerraControl Feedback'
 );
}

function about(){
 info(
  '<h4>Über TerraControl</h4>'+
  '<p>Terraristikverwaltung für Bestand, Pflege, Fütterung, QR-Tierpass, Abgabenachweis und Cloud-Sicherung.</p>'
 );
}

window.NGTSettings={
 edit:edit,
 cancel:cancel,
 saveSeller:saveSeller,
 privacy:privacy,
 imprint:imprint,
 feedback:feedback,
 about:about
};

NGT500.register(
 'settings',
 {
  render:render
 }
);

})();
