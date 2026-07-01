(function(){
'use strict';
const KEY='terracontrol_release_test_v1';
const TESTS=['Tier anlegen','Tier bearbeiten','Foto hinzufügen','Titelbild setzen','Fütterung speichern','Gewicht speichern','Häutung speichern','Gesundheitseintrag speichern','Futterbestand anlegen','Einkaufsplanung prüfen','SmartDashboard prüfen','Digitalen Tierpass öffnen','QR-Code erzeugen','Abgabenachweis/PDF erstellen','Backup exportieren','Backup importieren','TerraControl KI testen','Schnelleingabe testen','Einstellungen speichern','App neu laden'];
function load(){try{return JSON.parse(localStorage.getItem(KEY)||'{}')}catch(e){return {}}}
function saveObj(o){localStorage.setItem(KEY,JSON.stringify(o))}
function pct(done){return Math.round((done/TESTS.length)*100)}
function render(){const s=load();const done=TESTS.filter((_,i)=>s[i]).length;return `<div class="card"><h2>Release-Test</h2><p class="muted">TerraControl 1.0 · Qualitätscheck vor Veröffentlichung</p><div class="grid"><div class="stat">Erledigt<b>${done}/${TESTS.length}</b></div><div class="stat">Fortschritt<b>${pct(done)}%</b></div></div><div class="subcard"><h3>Prüfliste</h3>${TESTS.map((t,i)=>`<label class="listLine" style="display:block"><input type="checkbox" ${s[i]?'checked':''} onchange="NGTReleaseTest.toggle(${i},this.checked)" style="width:auto;display:inline-block;margin-right:10px">${NGT500.esc(t)}</label>`).join('')}</div><div class="btnRow"><button onclick="NGTReleaseTest.reset()">Zurücksetzen</button><button onclick="NGTReleaseTest.markAll()">Alles erledigt</button></div><div class="subcard ${done===TESTS.length?'ok':''}"><b>Status:</b> ${done===TESTS.length?'Release-Test bestanden':'Noch nicht vollständig getestet'}</div></div>`}
function toggle(i,v){const s=load();s[i]=!!v;saveObj(s);NGT500.route('releaseTest')}
function reset(){if(confirm('Release-Test zurücksetzen?')){localStorage.removeItem(KEY);NGT500.route('releaseTest')}}
function markAll(){const s={};TESTS.forEach((_,i)=>s[i]=true);saveObj(s);NGT500.route('releaseTest')}
window.NGTReleaseTest={toggle,reset,markAll};NGT500.register('releaseTest',{render});
})();