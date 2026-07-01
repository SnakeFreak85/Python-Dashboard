(function(){
'use strict';
const KEY='tc_user_profile';
function esc(v){return NGT500.esc(v||'')}
function get(){try{return JSON.parse(localStorage.getItem(KEY)||'{}')||{}}catch(e){return {}}}
function first(v){return String(v||'').split(' ')[0]||''}
function render(){const p=get();const ok=!!p.email;return `<div class="card"><h2>Konto</h2><p class="muted">Benutzerprofil und Vorbereitung für Cloud-Backup.</p>${ok?`<div class="subcard ok"><b>Profil aktiv</b><br>${esc(p.name)}<br>${esc(p.email)}<br><span class="muted">Willkommen ${esc(first(p.name))}</span></div>`:`<div class="subcard"><b>Noch kein Profil gespeichert</b><br><span class="muted">Lege dein Profil an. Später wird hier die Cloud-Anmeldung ergänzt.</span></div>`}<div class="subcard"><h3>Profil</h3><input id="accName" placeholder="Name" value="${esc(p.name)}"><input id="accEmail" placeholder="E-Mail" value="${esc(p.email)}"><button onclick="NGTAccount.save()">Profil speichern</button></div><div class="subcard"><h3>Cloud</h3>Backup: <b>vorbereitet</b><br>Synchronisierung: <b>geplant</b></div><button class="danger" onclick="NGTAccount.clear()">Profil entfernen</button></div>`}
function save(){localStorage.setItem(KEY,JSON.stringify({name:accName.value.trim(),email:accEmail.value.trim(),updatedAt:new Date().toISOString()}));alert('Profil gespeichert.');NGT500.route('account')}
function clear(){if(confirm('Profil entfernen?')){localStorage.removeItem(KEY);NGT500.route('account')}}
window.NGTAccount={save,clear};NGT500.register('account',{render});
})();