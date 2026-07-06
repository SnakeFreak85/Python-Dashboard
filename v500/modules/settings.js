(function(){
'use strict';

const KEY='terracontrol_settings_v1';
const SELLER_KEY='ngt_seller_profile_v1';

function load(){try{return JSON.parse(localStorage.getItem(KEY)||'{}')}catch(e){return {}}}
function seller(){try{return JSON.parse(localStorage.getItem(SELLER_KEY)||'{}')}catch(e){return {}}}
function cloud(){try{return JSON.parse(localStorage.getItem('terracontrol_cloud_meta_v1')||'{}')}catch(e){return {}}}
function saveObj(k,o){localStorage.setItem(k,JSON.stringify(o));}
function msg(t,type){if(NGT500.toast)NGT500.toast(t,type);else alert(t)}
function mailto(subject){location.href='mailto:saschad1711@gmail.com?subject='+encodeURIComponent(subject||'TerraControl Feedback')}

function render(){
  const s=load(),v=s.defaults||{},p=seller(),c=cloud();
  const last=c.lastBackupAt?new Date(c.lastBackupAt).toLocaleString('de-DE'):'Noch keine Sicherung';

  return `
    <div class="tc2PageCard tc2Card">
      <div class="tc2PageHead">
        <div>
          <h2>⚙️ Einstellungen</h2>
          <p class="muted">Persönliche Daten, Standardwerte, Cloud und Support.</p>
        </div>
      </div>

      <div class="tc2FormCard tc2Card">
        <h3>Verkäuferdaten</h3>
        <p class="muted">Diese Angaben werden für Abgabenachweise und Dokumente verwendet.</p>
        <div class="tc2FormGrid">
          <input id="setSellerName" placeholder="Name" value="${NGT500.esc(p.name||'')}">
          <input id="setSellerStreet" placeholder="Straße / Hausnummer" value="${NGT500.esc(p.street||p.address||'')}">
          <input id="setSellerCity" placeholder="PLZ / Ort" value="${NGT500.esc(p.city||'')}">
          <input id="setSellerPhone" placeholder="Telefon" value="${NGT500.esc(p.phone||'')}">
          <input id="setSellerMail" placeholder="E-Mail" value="${NGT500.esc(p.email||p.mail||'')}">
        </div>
      </div>

      <div class="tc2FormCard tc2Card">
        <h3>Standardwerte</h3>
        <p class="muted">Diese Werte dienen als globale Empfehlungen. Einzeltiere können eigene Intervalle haben.</p>
        <div class="tc2FormGrid">
          <input id="setFeedBaby" type="number" min="1" placeholder="Fütterungsintervall Jungtier" value="${NGT500.esc(v.feedBaby||7)}">
          <input id="setFeedSubadult" type="number" min="1" placeholder="Fütterungsintervall Subadult" value="${NGT500.esc(v.feedSubadult||10)}">
          <input id="setFeedAdult" type="number" min="1" placeholder="Fütterungsintervall Adult" value="${NGT500.esc(v.feedAdult||14)}">
          <input id="setWeightDays" type="number" min="1" placeholder="Gewichtsintervall" value="${NGT500.esc(v.weightDays||30)}">
        </div>
      </div>

      <div class="tc2FormCard tc2Card">
        <h3>☁️ Cloud & Backup</h3>
        <div class="tc2EmptyState">
          <h3>Letzte Sicherung</h3>
          <p>${NGT500.esc(last)}</p>
        </div>
        <div class="btnRow">
          <button onclick="NGTApp.loadAccount&&NGTApp.loadAccount()">Konto & Cloud öffnen</button>
          <button onclick="NGT500.route('backup')">Lokales Backup</button>
        </div>
      </div>

      <div class="tc2FormCard tc2Card">
        <h3>📱 App</h3>
        <div class="tc2EmptyState">
          <h3>TerraControl</h3>
          <p>Release Candidate · TC2-Designsystem · Mobile First</p>
        </div>
      </div>

      <div class="tc2FormCard tc2Card">
        <h3>Rechtliches & Support</h3>
        <div class="btnRow">
          <button onclick="NGTSettings.privacy()">Datenschutz</button>
          <button onclick="NGTSettings.imprint()">Impressum</button>
        </div>
        <div class="btnRow">
          <button onclick="NGTSettings.feedback()">Feedback senden</button>
          <button onclick="NGTSettings.about()">Über TerraControl</button>
        </div>
        <div id="settingsInfo"></div>
      </div>

      <button onclick="NGTSettings.save()">Einstellungen speichern</button>
    </div>
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
  saveObj(SELLER_KEY,p);

  const s=load();
  s.defaults={
    feedBaby:Number(setFeedBaby.value||7),
    feedSubadult:Number(setFeedSubadult.value||10),
    feedAdult:Number(setFeedAdult.value||14),
    weightDays:Number(setWeightDays.value||30)
  };
  saveObj(KEY,s);
  msg('Einstellungen gespeichert.');
}

function info(html){
  const box=document.getElementById('settingsInfo');
  if(box)box.innerHTML='<div class="tc2EmptyState" style="margin-top:12px">'+html+'</div>';
}

function privacy(){
  info('<h3>Datenschutzerklärung</h3><p>TerraControl speichert Tier- und Nutzerdaten lokal im Browser/App-Speicher. Cloud-Funktionen nutzen Google Drive des angemeldeten Nutzers. Fotos werden nur nach aktiver Nutzung der Foto-Cloud in Google Drive gespeichert.</p>');
}

function imprint(){
  info('<h3>Impressum</h3><p>Impressum wird vor Veröffentlichung mit den finalen Betreiberangaben ergänzt.</p>');
}

function feedback(){
  mailto('TerraControl Feedback');
}

function about(){
  info('<h3>Über TerraControl</h3><p>TerraControl ist ein Terraristik Dashboard für Tierbestand, Pflege, Fütterung, Dokumentation, QR-Tierpass, Abgabenachweis und Cloud-Sicherung.</p>');
}

window.NGTSettings={save,privacy,imprint,feedback,about};
NGT500.register('settings',{render});

})();