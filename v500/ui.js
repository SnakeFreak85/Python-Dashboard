(function(){
'use strict';
function animalCard(x){
 const a=x.a,esc=NGT500.esc;
 const lf=(a.feeds||[]).slice(-1)[0],lw=(a.weights||[]).slice(-1)[0],photo=(a.photos||[]).find(p=>p.cover)||(a.photos||[])[0];
 const uid=encodeURIComponent(a.uuid||a.id||a.uid||'');
 const img=photo?`<img class="photo" src="${photo.data}">`:`<div class="subcard" style="text-align:center;padding:28px">📷<br>Kein Titelbild</div>`;
 return `<div class="animal">${img}<h2>${esc(a.name)}</h2><span class="pill">${esc(a.morph||'-')}</span><span class="pill">${esc(a.sex||'-')}</span><span class="pill">${esc(a.status||'-')}</span><br>${a.birth?`Schlupf: <b>${esc(a.birth)}</b><br>`:''}${a.defaultFeeder?`Standard: <b>${esc(a.defaultFeeder)}</b><br>`:''}Kauf: ${NGT500.money(a.buyPrice||0)} · Markt: ${NGT500.money(NGTStore.market(a))}<br>${lf?`Letzte Fütterung: ${esc(lf.date)} ${lf.accepted===false?'verweigert':'gefressen'}<br>`:''}${lw?`Gewicht: ${esc(lw.weight)}g (${esc(lw.date)})<br>`:''}<div class="btnRow"><button onclick="NGT500.route('profile',{t:'${x.t}',i:${x.i}})">Tierpass</button><button onclick="NGT500.route('animals',{t:'${x.t}',edit:${x.i}})">Bearbeiten</button><button onclick="location.href='./abgabe.html?id=${uid}'">PDF</button><button onclick="NGT500.route('profile',{t:'${x.t}',i:${x.i},tab:'qr'})">QR</button><button class="danger" onclick="NGTAnimals.remove('${x.t}',${x.i})">Löschen</button></div></div>`
}
function list(rows){return rows.length?rows.map(r=>`<div class="listLine"><b>${NGT500.esc(r.d||'-')}</b> ${NGT500.esc(r.txt||'')}</div>`).join(''):'<p class="muted">Keine Einträge.</p>'}
function timeline(a){let rows=[];if(a.birth)rows.push({d:a.birth,txt:'Schlupf'});if(a.acquiredDate)rows.push({d:a.acquiredDate,txt:'Erworben'});(a.feeds||[]).forEach(f=>rows.push({d:f.date,txt:`${f.accepted===false?'Verweigert':'Gefressen'} ${f.amount?f.amount+'g ':''}${f.prey||''}`}));(a.sheds||[]).forEach(s=>rows.push({d:s.date,txt:'Häutung'}));(a.weights||[]).forEach(w=>rows.push({d:w.date,txt:`Gewicht ${w.weight}g`}));(a.photos||[]).forEach(p=>rows.push({d:p.date,txt:`Foto ${p.type||''} ${p.note||''}`}));return rows.sort((x,y)=>String(y.d).localeCompare(String(x.d)))}
window.NGTUI={animalCard,list,timeline};
})();