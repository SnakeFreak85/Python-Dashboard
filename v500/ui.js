(function(){
'use strict';

function esc(v){
 return NGT500.esc(v||'');
}

function jsArg(value){
 return String(value||'')
  .replace(/\\/g,'\\\\')
  .replace(/'/g,"\\'");
}

function latest(list){
 return AnimalEngine.latest(list);
}

function daysSince(d){
 return AnimalEngine.daysSinceOr(
  d,
  9999
 );
}

function age(birth){
 const t=Date.parse(birth||'');
 if(!t)return '-';
 const y=Math.floor((Date.now()-t)/31557600000);
 return y>0?y+' J.':'<1 J.';
}

function healthStatus(animal){
 return CareRulesEngine.healthStatus(
  animal
 );
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
 const photo=AnimalEngine.coverPhoto(a);
 const photoUrl=AnimalEngine.photoSource(
  photo,
  true
 );
 const hs=healthStatus(a);
 const animalId=NGTStore.animalId(a);
 const jsAnimalId=jsArg(animalId);
 const uid=encodeURIComponent(animalId);
 const weight=lw?esc(lw.weight)+' g':(a.weight?esc(a.weight)+' g':'-');

 const img=photoUrl
  ? `<img class="tc2AnimalPhoto" src="${esc(photoUrl)}">`
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
    <button onclick="NGT500.route('profile',{animalId:'${jsAnimalId}'})">Tierpass</button>
    <button onclick="NGT500.route('profile',{animalId:'${jsAnimalId}',tab:'photos'})">Foto</button>
    <button onclick="NGT500.route('profile',{animalId:'${jsAnimalId}',tab:'feeds'})">Fütterung</button>
    <button onclick="NGT500.route('profile',{animalId:'${jsAnimalId}',tab:'sheds'})">Häutung</button>
    <button onclick="NGT500.route('profile',{animalId:'${jsAnimalId}',tab:'weights'})">Gewicht</button>
    <button onclick="location.href='./abgabe.html?id=${uid}'">PDF</button>
    <button onclick="NGT500.route('animals',{editId:'${jsAnimalId}'})">Bearbeiten</button>
    <button onclick="NGT500.route('profile',{animalId:'${jsAnimalId}',tab:'qr'})">QR</button>
    <button class="danger" onclick="NGTAnimals.removeById('${jsAnimalId}')">Löschen</button>
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
 return AnimalEngine.historyEvents(a);
}

window.NGTUI={animalCard,list,timeline};

})();
