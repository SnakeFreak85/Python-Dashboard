(function(){
'use strict';

function esc(v){
 return NGT500.esc(v||'');
}

function latest(list){
 return (list||[])
  .slice()
  .sort(function(a,b){
   return String(b.date||'').localeCompare(String(a.date||''));
  })[0]||null;
}

function daysSince(d){
 const t=Date.parse(d||'');
 return t?Math.floor((Date.now()-t)/86400000):9999;
}

function age(birth){
 const t=Date.parse(birth||'');
 if(!t)return '-';
 const y=Math.floor((Date.now()-t)/31557600000);
 return y>0?y+' J.':'<1 J.';
}

function healthStatus(a){
 let score=0;
 const lf=latest(a.feeds);
 const lw=latest(a.weights);
 const lh=latest(a.health);

 const recent=(a.feeds||[])
  .slice()
  .sort(function(p,q){
   return String(q.date||'').localeCompare(String(p.date||''));
  })
  .slice(0,3);

 if(recent.length>=2&&recent.slice(0,2).every(function(f){return f.accepted===false;}))score+=2;

 if(lw){
  const w=(a.weights||[])
   .slice()
   .sort(function(p,q){
    return String(p.date||'').localeCompare(String(q.date||''));
   });

  if(w.length>=2&&Number(w[w.length-1].weight)<Number(w[w.length-2].weight))score+=2;
 }

 if(lf&&daysSince(lf.date)>=(Number(a.feedIntervalDays||a.feedingInterval||14)+7))score+=1;
 if(lw&&daysSince(lw.date)>=45)score+=1;
 if(lh&&String(lh.status||'').toLowerCase()!=='abgeschlossen')score+=1;

 if(score>=3)return {txt:'Handlung',icon:'🔴',cls:'danger'};
 if(score>=1)return {txt:'Beobachten',icon:'🟡',cls:'warn'};
 return {txt:'Gesund',icon:'🟢',cls:'ok'};
}

function rel(date){
 const d=daysSince(date);
 if(d===9999)return '-';
 if(d===0)return 'heute';
 if(d===1)return 'gestern';
 return 'vor '+d+' Tagen';
}

function animalCard(x){
 const a=x.a;
 const lf=latest(a.feeds);
 const lw=latest(a.weights);
 const ls=latest(a.sheds);
 const photo=(a.photos||[]).find(function(p){return p.cover;})||(a.photos||[])[0];
 const hs=healthStatus(a);
 const uid=encodeURIComponent(a.uuid||a.id||a.uid||'');
 const weight=lw?esc(lw.weight)+' g':(a.weight?esc(a.weight)+' g':'-');

 const img=photo
  ? `<img class="tc2AnimalPhoto" src="${photo.data}">`
  : `<div class="tc2AnimalPhoto tc2AnimalPhotoEmpty"><span>📷</span><b>Titelbild hinzufügen</b></div>`;

 return `<article class="tc2AnimalCard ${hs.cls}">
  <div class="tc2AnimalImageWrap">
   ${img}
   <div class="tc2AnimalBadge">${hs.icon} ${esc(hs.txt)}</div>
  </div>

  <div class="tc2AnimalBody">
   <div class="tc2AnimalTitleRow">
    <div>
     <h2>${esc(a.name||'Unbenannt')}</h2>
     <div class="tc2AnimalPills">
      <span>${esc(a.morph||'-')}</span>
      <span>${esc(a.sex||'-')}</span>
     </div>
    </div>
   </div>

   <div class="tc2AnimalStats">
    <div><small>Gewicht</small><b>${weight}</b></div>
    <div><small>Alter</small><b>${esc(age(a.birth))}</b></div>
   </div>

   <div class="tc2AnimalInfo">
    <div><span>🍽</span><p><b>Fütterung</b><small>${lf?rel(lf.date)+' · '+(lf.accepted===false?'verweigert':'gefressen'):'keine Fütterung'}</small></p></div>
    <div><span>🧤</span><p><b>Häutung</b><small>${ls?rel(ls.date):'keine Häutung'}</small></p></div>
    <div><span>⚖</span><p><b>Gewicht</b><small>${lw?rel(lw.date):'kein Gewicht'}</small></p></div>
    ${a.defaultFeeder?`<div><span>🐀</span><p><b>Standardfutter</b><small>${esc(a.defaultFeeder)}</small></p></div>`:''}
   </div>

   <div class="tc2AnimalActions">
    <button onclick="NGT500.route('profile',{t:'${x.t}',i:${x.i}})">Tierpass</button>
    <button onclick="NGT500.route('profile',{t:'${x.t}',i:${x.i},tab:'photos'})">Foto</button>
    <button onclick="NGT500.route('profile',{t:'${x.t}',i:${x.i},tab:'feeds'})">Fütterung</button>
    <button onclick="NGT500.route('profile',{t:'${x.t}',i:${x.i},tab:'sheds'})">Häutung</button>
    <button onclick="NGT500.route('profile',{t:'${x.t}',i:${x.i},tab:'weights'})">Gewicht</button>
    <button onclick="location.href='./abgabe.html?id=${uid}'">PDF</button>
    <button onclick="NGT500.route('animals',{t:'${x.t}',edit:${x.i}})">Bearbeiten</button>
    <button onclick="NGT500.route('profile',{t:'${x.t}',i:${x.i},tab:'qr'})">QR</button>
    <button class="danger" onclick="NGTAnimals.remove('${x.t}',${x.i})">Löschen</button>
   </div>
  </div>
 </article>`;
}

function list(rows){
 return rows.length
  ? rows.map(function(r){
   return `<div class="listLine"><b>${esc(r.d||'-')}</b> ${esc(r.txt||'')}</div>`;
  }).join('')
  : '<p class="muted">Keine Einträge.</p>';
}

function timeline(a){
 let rows=[];
 if(a.birth)rows.push({d:a.birth,txt:'Schlupf'});
 if(a.acquiredDate)rows.push({d:a.acquiredDate,txt:'Erworben'});

 (a.feeds||[]).forEach(function(f){
  rows.push({d:f.date,txt:(f.accepted===false?'Verweigert':'Gefressen')+' '+(f.amount?f.amount+'g ':'')+(f.prey||'')});
 });

 (a.sheds||[]).forEach(function(s){
  rows.push({d:s.date,txt:'Häutung'});
 });

 (a.weights||[]).forEach(function(w){
  rows.push({d:w.date,txt:'Gewicht '+w.weight+'g'});
 });

 (a.photos||[]).forEach(function(p){
  rows.push({d:p.date,txt:'Foto '+(p.type||'')+' '+(p.note||'')});
 });

 return rows.sort(function(x,y){
  return String(y.d).localeCompare(String(x.d));
 });
}

window.NGTUI={animalCard,list,timeline};

})();