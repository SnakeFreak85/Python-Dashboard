(function(){
'use strict';
const KEY='spd_v53';
const TYPES=['koenig','boas','geckos','spinnen'];
function $(id){return document.getElementById(id)}
function esc(s){return String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
function load(){try{return JSON.parse(localStorage.getItem(KEY)||'{}')||{};}catch(e){return {};}}
function save(db){localStorage.setItem(KEY,JSON.stringify(db));}
function uid(){return 'ngt-'+Date.now().toString(36)+'-'+Math.random().toString(36).slice(2,8)}
function nameOf(a){return a&&(a.name||a.displayId||a.uid)||'Tier'}
function allAnimals(db){return TYPES.flatMap(t=>(db[t]||[]).map((a,i)=>({t,i,a})));}
function timeline(a){let rows=[];(a.feeds||[]).forEach(f=>rows.push({d:f.date,txt:`🍴 ${f.accepted===false?'Verweigert':'Gefressen'} ${f.amount?f.amount+'g ':''}${f.prey||''}`}));(a.sheds||[]).forEach(s=>rows.push({d:s.date,txt:'🧤 Häutung'}));(a.weights||[]).forEach(w=>rows.push({d:w.date,txt:`⚖️ ${w.weight}g`}));(a.photos||[]).forEach(p=>rows.push({d:p.date,txt:`📷 Foto ${p.note||''}`}));return rows.sort((x,y)=>String(y.d).localeCompare(String(x.d)));}
let profileType=null,profileIndex=null,profileTab='overview';
function inject(){
 if($('v400phase1style'))return;
 document.head.insertAdjacentHTML('beforeend',`<style id="v400phase1style">.tabbar{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin:10px 0}.tabbar button{font-size:14px;padding:10px}.profilePhoto{width:100%;max-height:310px;object-fit:cover;border-radius:14px;background:#0f1a25}.profileThumb{width:100%;border-radius:14px;background:#0f1a25}.animal img.profilePhotoSmall{width:100%;max-height:230px;object-fit:cover;border-radius:14px;margin-bottom:10px}</style>`);
 if(!$('profileModal'))document.body.insertAdjacentHTML('beforeend',`<div id="profileModal" class="modal"><div class="modalBox"><h2 id="profileTitle">Tierakte</h2><div id="profileHead"></div><div class="tabbar"><button onclick="NGTPhase1.tab('overview')">Übersicht</button><button onclick="NGTPhase1.tab('timeline')">Timeline</button><button onclick="NGTPhase1.tab('feeds')">Fütterungen</button><button onclick="NGTPhase1.tab('sheds')">Häutungen</button><button onclick="NGTPhase1.tab('weights')">Gewichte</button><button onclick="NGTPhase1.tab('photos')">Fotos</button><button onclick="NGTPhase1.tab('analysis')">Analyse</button><button onclick="NGTPhase1.tab('qr')">QR</button></div><div id="profileBody"></div><button onclick="NGTPhase1.close()">Schließen</button></div></div>`);
}
function open(t,i){inject();profileType=t;profileIndex=i;profileTab='overview';$('profileModal').classList.add('show');render();}
function close(){$('profileModal').classList.remove('show')}
function tab(x){profileTab=x;render();}
function current(){const db=load();return {db,a:(db[profileType]||[])[profileIndex]};}
function list(rows){return rows.length?rows.map(r=>`<div class="listLine"><b>${esc(r.d||'-')}</b> ${esc(r.txt||'')}</div>`).join(''):'<p class="muted">Keine Einträge.</p>'}
function render(){const {db,a}=current();if(!a)return;ensure(a);$('profileTitle').textContent='📁 Tierakte · '+nameOf(a);$('profileHead').innerHTML=`<div class="subcard"><b>${esc(nameOf(a))}</b><br>${esc(a.morph||'-')} · ${esc(a.sex||'-')} · ${esc(a.status||'-')}<br>Standardfutter: ${esc(a.defaultFeeder||a.futterStandard||'-')}<br>UUID: <span class="muted">${esc(a.uuid||a.uid)}</span></div>`;const b=$('profileBody');if(profileTab==='overview')b.innerHTML=overview(a);if(profileTab==='timeline')b.innerHTML=list(timeline(a));if(profileTab==='feeds')b.innerHTML=list((a.feeds||[]).slice().reverse().map(f=>({d:f.date,txt:`${f.accepted===false?'Verweigert':'Gefressen'} ${f.amount||''}g ${f.prey||''}`})));if(profileTab==='sheds')b.innerHTML=list((a.sheds||[]).slice().reverse().map(s=>({d:s.date,txt:'Häutung'})));if(profileTab==='weights')b.innerHTML=list((a.weights||[]).slice().reverse().map(w=>({d:w.date,txt:w.weight+'g'})));if(profileTab==='photos')b.innerHTML=photos(a);if(profileTab==='analysis')b.innerHTML=analysis(a);if(profileTab==='qr'){b.innerHTML=`<div class="qrBox"><div id="profileQr"></div><div>${esc(a.uuid||a.uid)}</div></div>`;if(window.QRCode)new QRCode($('profileQr'),{text:a.uuid||a.uid,width:220,height:220});}}
function ensure(a){a.uuid=a.uuid||a.uid||uid();a.uid=a.uid||a.uuid;a.photos=Array.isArray(a.photos)?a.photos:[];a.feeds=Array.isArray(a.feeds)?a.feeds:[];a.sheds=Array.isArray(a.sheds)?a.sheds:[];a.weights=Array.isArray(a.weights)?a.weights:[];}
function overview(a){const p=(a.photos||[])[0],lf=(a.feeds||[]).slice(-1)[0],lw=(a.weights||[]).slice(-1)[0];return `<div class="subcard">${p?`<img class="profilePhoto" src="${p.data}">`:''}<br>Kaufwert: ${esc(a.buyPrice||0)} €<br>Letzte Fütterung: ${lf?esc(lf.date)+' '+(lf.accepted===false?'verweigert':'gefressen'):'-'}<br>Gewicht: ${lw?esc(lw.weight)+'g am '+esc(lw.date):'-'}<br>Fotos: ${(a.photos||[]).length}<br>Notizen:<br>${esc(a.note||'-')}</div>`}
function photos(a){return `<div class="subcard"><input type="file" accept="image/*" onchange="NGTPhase1.addPhoto(this.files[0])"><input id="photoNote" placeholder="Notiz zum Foto"></div>`+(a.photos||[]).map((p,i)=>`<div class="subcard"><img class="profileThumb" src="${p.data}"><b>${esc(p.date||'')}</b><br>${esc(p.note||'')}<button class="danger" onclick="NGTPhase1.deletePhoto(${i})">Foto löschen</button></div>`).join('')}
function analysis(a){const refused=(a.feeds||[]).filter(f=>f.accepted===false).length,accepted=(a.feeds||[]).filter(f=>f.accepted!==false).length,first=(a.weights||[])[0],last=(a.weights||[]).slice(-1)[0];let diff='-';if(first&&last&&first!==last)diff=(Number(last.weight)-Number(first.weight))+'g';return `<div class="subcard">Fütterungen angenommen: ${accepted}<br>Verweigert: ${refused}<br>Häutungen: ${(a.sheds||[]).length}<br>Gewichtsentwicklung: ${diff}<br>Fotos: ${(a.photos||[]).length}</div>`}
function addPhoto(file){if(!file)return;const r=new FileReader();r.onload=()=>{const db=load();const a=(db[profileType]||[])[profileIndex];ensure(a);a.photos.push({id:uid(),date:new Date().toISOString().slice(0,10),note:($('photoNote')?.value||''),data:r.result});save(db);profileTab='photos';render();location.reload();};r.readAsDataURL(file)}
function deletePhoto(i){if(!confirm('Foto löschen?'))return;const db=load();const a=(db[profileType]||[])[profileIndex];a.photos.splice(i,1);save(db);profileTab='photos';render();location.reload();}
function patchCards(){const db=load();allAnimals(db).forEach(({t,i,a})=>{ensure(a);});save(db);}
window.NGTPhase1={open,close,tab,addPhoto,deletePhoto,patchCards};
document.addEventListener('DOMContentLoaded',()=>{inject();patchCards();});
})();
