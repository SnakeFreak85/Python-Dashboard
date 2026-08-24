(function(){
'use strict';

let editMode='';

function seller(){
 try{
  return NGTStore.sellerProfile();
 }catch(error){
  return {};
 }
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

function selectedTheme(){
 try{
  return window.NGTTheme
   ?NGTTheme.current()
   :'dark';
 }catch(error){
  return 'dark';
 }
}

function selectedLanguage(){
 try{
  return window.TCI18n
   ?TCI18n.current()
   :'de';
 }catch(error){
  return 'de';
 }
}

function saveSettingsToStore(
 sellerData
){
 return NGTStore.saveSellerProfile(
  sellerData
 );
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
 const theme=selectedTheme();
 const language=selectedLanguage();

 const lastBackup=
  cloudMeta.lastBackupAt
   ?new Date(
     cloudMeta.lastBackupAt
    ).toLocaleString(
     window.TCI18n
      ?TCI18n.locale()
      :'de-DE'
    )
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
    <h3>🌐 Sprache</h3>

    <div class="tc2ThemeChoices" data-tc-i18n-skip>
     <button
      type="button"
      class="tc2ThemeChoice ${language==='de'?'on':''}"
      onclick="NGTSettings.setLanguage('de')"
      aria-pressed="${language==='de'?'true':'false'}"
     >
      <span>🇩🇪</span>
      <span><b>Deutsch</b><small>German</small></span>
     </button>

     <button
      type="button"
      class="tc2ThemeChoice ${language==='en'?'on':''}"
      onclick="NGTSettings.setLanguage('en')"
      aria-pressed="${language==='en'?'true':'false'}"
     >
      <span>🇬🇧</span>
      <span><b>English</b><small>Englisch</small></span>
     </button>

     <button
      type="button"
      class="tc2ThemeChoice ${language==='it'?'on':''}"
      onclick="NGTSettings.setLanguage('it')"
      aria-pressed="${language==='it'?'true':'false'}"
     >
      <span>🇮🇹</span>
      <span><b>Italiano</b><small>Italienisch</small></span>
     </button>

     <button
      type="button"
      class="tc2ThemeChoice ${language==='hu'?'on':''}"
      onclick="NGTSettings.setLanguage('hu')"
      aria-pressed="${language==='hu'?'true':'false'}"
     >
      <span>🇭🇺</span>
      <span><b>Magyar</b><small>Ungarisch</small></span>
     </button>
    </div>

    <button
     type="button"
     class="tc2LanguageOpen"
     onclick="NGTSettings.openLanguagePicker()"
    >
     Sprachauswahl öffnen
    </button>
   </div>

   <div class="tc2SettingsSection">
    <h3>Darstellung</h3>

    <div class="tc2ThemeChoices">
     <button
      type="button"
      class="tc2ThemeChoice ${theme==='dark'?'on':''}"
      onclick="NGTSettings.setTheme('dark')"
      aria-pressed="${theme==='dark'?'true':'false'}"
     >
      <span class="dark">☾</span>
      <span>
       <b>Dunkel</b>
       <small>TC2 Dark</small>
      </span>
     </button>

     <button
      type="button"
      class="tc2ThemeChoice ${theme==='light'?'on':''}"
      onclick="NGTSettings.setTheme('light')"
      aria-pressed="${theme==='light'?'true':'false'}"
     >
      <span class="light">☀</span>
      <span>
       <b>Hell</b>
       <small>TC2 Light</small>
      </span>
     </button>
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

     <button onclick="NGT500.route('support')">
      Supportchat
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
  '<p>TerraControl speichert Tier- und Nutzerdaten lokal im Browser/App-Speicher. Cloud-Funktionen nutzen den angemeldeten Nutzer-Account. Nachrichten im Supportchat werden zur Bearbeitung der Anfrage in Firebase gespeichert und sind nur für den jeweiligen Nutzer und den TerraControl-Support bestimmt.</p>'
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

function setTheme(theme){
 if(!window.NGTTheme){
  message(
   'Darstellung konnte nicht geladen werden.',
   'danger'
  );
  return;
 }

 NGTTheme.set(theme);
 rerender();
}

function setLanguage(language){
 if(!window.TCI18n){
  message(
   'Sprachauswahl konnte nicht geladen werden.',
   'danger'
  );
  return;
 }

 TCI18n.set(language);
}

function openLanguagePicker(){
 if(window.TCI18n){
  TCI18n.open();
 }
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
 setTheme:setTheme,
 setLanguage:setLanguage,
 openLanguagePicker:openLanguagePicker,
 about:about
};

NGT500.register(
 'settings',
 {
  render:render
 }
);

})();
