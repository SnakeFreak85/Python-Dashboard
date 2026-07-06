(function(){
'use strict';

const KEY='terracontrol_settings_v1';
const SELLER_KEY='ngt_seller_profile_v1';

function storeSettings(){
  try{
    const d=NGTStore&&NGTStore.data?NGTStore.data():null;
    if(!d)return {};
    d.settings=d.settings||{};
    return d.settings;
  }catch(e){return {}}
}

function legacyLoad(k){
  try{return JSON.parse(localStorage.getItem(k)||'{}')}catch(e){return {}}
}

function load(){
  const st=storeSettings();
  return Object.keys(st).length?st:legacyLoad(KEY);
}

function seller(){
  const st=storeSettings();
  if(st.seller&&Object.keys(st.seller).length)return st.seller;
  return legacyLoad(SELLER_KEY);
}

function cloud(){
  try{return JSON.parse(localStorage.getItem('terracontrol_cloud_meta_v1')||'{}')}catch(e){return {}}
}

function saveSettingsToStore(sellerData,defaultsData){
  const d=NGTStore.data();
  d.settings=d.settings||{};
  d.settings.seller=sellerData;
  d.settings.defaults=defaultsData;
  NGTStore.save();
}

function msg(t,type){if(NGT500.toast)NGT500.toast(t,type);else alert(t)}
function mailto(subject){location.href='mailto:saschad1711@gmail.com?subject='+encodeURIComponent(subject||'TerraControl Feedback')}

function field(id,label,value,type){
  return `
    <label class="tc2SettingsField">
      <span>${label}</span>
      <input id="${id}" ${type?'type="'+type+'"':''} value="${NGT500.esc(value||'')}">
    </label>
  `;
}

function render(){
  const s=load(),v=s.defaults||{},p=seller(),c=cloud();
  const last=c.lastBackupAt?new Date(c.lastBackupAt).toLocaleString('de-DE'):'Noch keine Sicherung';

  return `
    <section class="tc2Settings">
      <div class="tc2SettingsHero">
        <div>
          <h2>⚙️ Einstellungen</h2>
          <p>Persönliche Daten, Standardwerte und Systemfunktionen.</p>
        </div>
      </div>

      <div class="tc2SettingsSection">
        <h3>👤 Verkäufer</h3>
        ${field('setSellerName','Name',p.name)}
        ${field('setSellerStreet','Straße / Hausnummer',p.street||p.address)}
        ${field('setSellerCity','PLZ / Ort',p.city)}
        ${field('setSellerPhone','Telefon',p.phone)}
        ${field('setSellerMail','E-Mail',p.email||p.mail)}
      </div>

      <div class="tc2SettingsSection">
        <h3>⚙️ Standardwerte</h3>
        ${field('setFeedBaby','Fütterungsintervall Jungtier',v.feedBaby||7,'number')}
        ${field('setFeedSubadult','Fütterungsintervall Subadult',v.feedSubadult||10,'number')}
        ${field('setFeedAdult','Fütterungsintervall Adult',v.feedAdult||14,'number')}
        ${field('setWeightDays','Gewichtsintervall',v.weightDays||30,'number')}
      </div>

      <div class="tc2SettingsSection">
        <h3>☁️ Cloud & Backup</h3>
        <div class="tc2SettingsStatus">
          <span>Letzte Sicherung</span>
          <b>${NGT500.esc(last)}</b>
        </div>
        <div class="tc2SettingsActions">
          <button onclick="NGTApp.loadAccount&&NGTApp.loadAccount()">Konto & Cloud</button>
          <button onclick="NGT500.route('backup')">Backup</button>
        </div>
      </div>

      <div class="tc2SettingsSection">
        <h3>📱 App</h3>
        <div class="tc2SettingsInfo">
          <b>TerraControl</b>
          <span>Version 1.0.4 RC11 · TC2 · Mobile First</span>
        </div>
      </div>

      <div class="tc2SettingsSection">
        <h3>Rechtliches & Support</h3>
        <div class="tc2SettingsActions">
          <button onclick="NGTSettings.privacy()">Datenschutz</button>
          <button onclick="NGTSettings.imprint()">Impressum</button>
          <button onclick="NGTSettings.feedback()">Feedback</button>
          <button onclick="NGTSettings.about()">Über</button>
        </div>
        <div id="settingsInfo"></div>
      </div>

      <button class="tc2SettingsSave" onclick="NGTSettings.save()">Speichern</button>
    </section>
  `;
}

function save(){
  const p={
    name:setSellerName.value.trim(),
    street:setSellerStreet.value.trim(),
    address:setSellerStreet.value.trim(),
    city:setSellerCity.value.trim(),
    phone:setSellerPhone.value.trim(),
    email:setSellerMail.value.trim(),
    mail:setSellerMail.value.trim()
  };

  const defaults={
    feedBaby:Number(setFeedBaby.value||7),
    feedSubadult:Number(setFeedSubadult.value||10),
    feedAdult:Number(setFeedAdult.value||14),
    weightDays:Number(setWeightDays.value||30)
  };

  saveSettingsToStore(p,defaults);

  try{
    localStorage.setItem(SELLER_KEY,JSON.stringify(p));
    localStorage.setItem(KEY,JSON.stringify({seller:p,defaults}));
  }catch(e){}

  msg('Einstellungen gespeichert.');
}

function info(html){
  const box=document.getElementById('settingsInfo');
  if(box)box.innerHTML='<div class="tc2SettingsInlineInfo">'+html+'</div>';
}

function privacy(){
  info('<h4>Datenschutz</h4><p>TerraControl speichert Tier- und Nutzerdaten lokal im Browser/App-Speicher. Cloud-Funktionen nutzen den angemeldeten Nutzer-Account.</p>');
}

function imprint(){
  info('<h4>Impressum</h4><p>Impressum wird vor Veröffentlichung mit den finalen Betreiberangaben ergänzt.</p>');
}

function feedback(){mailto('TerraControl Feedback')}

function about(){
  info('<h4>Über TerraControl</h4><p>Terraristikverwaltung für Bestand, Pflege, Fütterung, QR-Tierpass, Abgabenachweis und Cloud-Sicherung.</p>');
}

window.NGTSettings={save,privacy,imprint,feedback,about};
NGT500.register('settings',{render});

})();