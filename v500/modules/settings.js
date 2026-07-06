(function(){
'use strict';

const KEY='terracontrol_settings_v1';
const SELLER_KEY='ngt_seller_profile_v1';
let editMode='';

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

function esc(v){return NGT500.esc(v||'')}
function days(v){return `${Number(v||0)} Tage`}

function field(id,label,value,type){
  return `
    <label class="tc2SettingsField">
      <span>${label}</span>
      <input id="${id}" ${type?'type="'+type+'"':''} value="${esc(value)}">
    </label>
  `;
}

function sellerSummary(p){
  const has=p.name||p.street||p.address||p.city||p.phone||p.email||p.mail;
  if(!has){
    return `
      <div class="tc2SettingsEmpty">
        <b>Noch keine Verkäuferdaten</b>
        <span>Füge deine Daten für Abgabenachweise hinzu.</span>
      </div>
    `;
  }

  return `
    <div class="tc2SettingsProfile">
      <b>${esc(p.name||'Unbenannter Verkäufer')}</b>
      <span>${esc(p.street||p.address||'')}</span>
      <span>${esc(p.city||'')}</span>
      <span>${esc(p.phone||'')}</span>
      <span>${esc(p.email||p.mail||'')}</span>
    </div>
  `;
}

function sellerEditor(p){
  return `
    <div class="tc2SettingsEdit">
      ${field('setSellerName','Name',p.name)}
      ${field('setSellerStreet','Straße / Hausnummer',p.street||p.address)}
      ${field('setSellerCity','PLZ / Ort',p.city)}
      ${field('setSellerPhone','Telefon',p.phone)}
      ${field('setSellerMail','E-Mail',p.email||p.mail)}
      <div class="tc2SettingsActions">
        <button onclick="NGTSettings.cancel()">Abbrechen</button>
        <button onclick="NGTSettings.saveSeller()">Speichern</button>
      </div>
    </div>
  `;
}

function defaultsSummary(v){
  return `
    <div class="tc2SettingsRows">
      <div><span>Jungtier</span><b>${days(v.feedBaby||7)}</b></div>
      <div><span>Subadult</span><b>${days(v.feedSubadult||10)}</b></div>
      <div><span>Adult</span><b>${days(v.feedAdult||14)}</b></div>
      <div><span>Gewicht</span><b>${days(v.weightDays||30)}</b></div>
    </div>
  `;
}

function defaultsEditor(v){
  return `
    <div class="tc2SettingsEdit">
      ${field('setFeedBaby','Fütterungsintervall Jungtier',v.feedBaby||7,'number')}
      ${field('setFeedSubadult','Fütterungsintervall Subadult',v.feedSubadult||10,'number')}
      ${field('setFeedAdult','Fütterungsintervall Adult',v.feedAdult||14,'number')}
      ${field('setWeightDays','Gewichtsintervall',v.weightDays||30,'number')}
      <div class="tc2SettingsActions">
        <button onclick="NGTSettings.cancel()">Abbrechen</button>
        <button onclick="NGTSettings.saveDefaults()">Speichern</button>
      </div>
    </div>
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
          <p>Profil, Standards, Cloud und App-Informationen.</p>
        </div>
      </div>

      <div class="tc2SettingsSection">
        <div class="tc2SettingsSectionHead">
          <h3>👤 Verkäufer</h3>
          ${editMode==='seller'?'':'<button onclick="NGTSettings.edit(\'seller\')">Bearbeiten</button>'}
        </div>
        ${editMode==='seller'?sellerEditor(p):sellerSummary(p)}
      </div>

      <div class="tc2SettingsSection">
        <div class="tc2SettingsSectionHead">
          <h3>⚙️ Standardwerte</h3>
          ${editMode==='defaults'?'':'<button onclick="NGTSettings.edit(\'defaults\')">Ändern</button>'}
        </div>
        ${editMode==='defaults'?defaultsEditor(v):defaultsSummary(v)}
      </div>

      <div class="tc2SettingsSection">
        <h3>☁️ Cloud</h3>
        <div class="tc2SettingsStatus">
          <span>Letzte Sicherung</span>
          <b>${esc(last)}</b>
        </div>
        <div class="tc2SettingsActions">
          <button onclick="NGTApp.loadAccount&&NGTApp.loadAccount()">Cloud öffnen</button>
          <button onclick="NGT500.route('backup')">Backup</button>
        </div>
      </div>

      <div class="tc2SettingsSection">
        <h3>📱 TerraControl</h3>
        <div class="tc2SettingsRows">
          <div><span>Version</span><b>1.0.4 RC11</b></div>
          <div><span>Design</span><b>TC2</b></div>
          <div><span>Modus</span><b>Mobile First</b></div>
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
    </section>
  `;
}

function rerender(){
  NGT500.route('settings');
}

function edit(mode){
  editMode=mode;
  rerender();
}

function cancel(){
  editMode='';
  rerender();
}

function currentDefaults(){
  const s=load();
  return s.defaults||{};
}

function saveSeller(){
  const oldDefaults=currentDefaults();
  const p={
    name:setSellerName.value.trim(),
    street:setSellerStreet.value.trim(),
    address:setSellerStreet.value.trim(),
    city:setSellerCity.value.trim(),
    phone:setSellerPhone.value.trim(),
    email:setSellerMail.value.trim(),
    mail:setSellerMail.value.trim()
  };

  saveSettingsToStore(p,oldDefaults);

  try{
    localStorage.setItem(SELLER_KEY,JSON.stringify(p));
    localStorage.setItem(KEY,JSON.stringify({seller:p,defaults:oldDefaults}));
  }catch(e){}

  editMode='';
  msg('Verkäuferdaten gespeichert.');
  rerender();
}

function saveDefaults(){
  const p=seller();
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

  editMode='';
  msg('Standardwerte gespeichert.');
  rerender();
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

window.NGTSettings={edit,cancel,saveSeller,saveDefaults,privacy,imprint,feedback,about};
NGT500.register('settings',{render});

})();