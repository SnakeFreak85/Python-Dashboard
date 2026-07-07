(function(){
'use strict';

function esc(v){return NGT500.esc(v||'')}

function jsArg(v){
 return String(v||'').replace(/\\/g,'\\\\').replace(/'/g,"\\'");
}

function statusOptions(cur){
 return ['Bestand','Nachzucht','Verkauft','Abgegeben','Verstorben','Archiv']
  .map(s=>`<option ${cur===s?'selected':''}>${s}</option>`)
  .join('');
}

function opt(list,cur){
 return (list||[])
  .map(v=>`<option value="${esc(v)}" ${String(cur||'')===String(v)?'selected':''}>${esc(v)}</option>`)
  .join('');
}

function hknDraft(){
 try{return JSON.parse(sessionStorage.getItem('terracontrol_hkn_import_v1')||'null')}
 catch(e){return null}
}

function hknInfo(){
 const h=hknDraft();
 if(!h)return '';
 return `<div class="subcard ok tc2FormCard">
  <h3>📄 Herkunftsnachweis übernommen</h3>
  <p class="muted">Das Foto wurde übernommen. Die KI-Analyse läuft automatisch und füllt die Felder aus, sobald Daten erkannt wurden.</p>
  ${h.data&&String(h.data).startsWith('data:image')?`<img class="photo" src="${h.data}">`:''}
  <p><b>Datei:</b><br>${esc(h.name||'Herkunftsnachweis')}</p>
  <div id="hknAutoStatus" class="subcard">⏳ KI-Analyse wird vorbereitet...</div>
 </div>`;
}

function allActive(){
 const all=NGTStore.allAnimals?NGTStore.allAnimals():[];
 return all.filter(x=>!['Archiv','Verkauft','Abgegeben','Verstorben'].includes(x.a.status));
}

function countBy(rows,keyFn){
 const map={};
 rows.forEach(x=>{
  const k=keyFn(x)||'Unsortiert';
  map[k]=(map[k]||0)+1;
 });
 return Object.keys(map).sort().map(k=>({label:k,count:map[k]}));
}

function backButton(args){
 if(args&&args.genus){
  return `<button onclick="NGT500.route('animals',{group:'${jsArg(args.group)}'})">‹ ${esc(args.group)}</button>`;
 }
 if(args&&args.group){
  return `<button onclick="NGT500.route('dashboard')">‹ Start</button>`;
 }
 return `<button onclick="NGT500.route('dashboard')">‹ Start</button>`;
}

function folderGrid(items,onclick){
 if(!items.length){
  return `<div class="subcard tc2EmptyState">
   <h3>Noch keine Einträge</h3>
   <p class="muted">Lege dein erstes Tier über die Startseite an.</p>
  </div>`;
 }

 return `<div class="tc2TaxGrid">
  ${items.map(item=>`<button class="tc2TaxFolder" onclick="${onclick(item)}">
   <span>●●●</span>
   <b>${esc(item.label)}</b>
   <small>${item.count} ${item.count===1?'Tier':'Tiere'}</small>
  </button>`).join('')}
 </div>`;
}

function animalIconGrid(rows){
 if(!rows.length){
  return `<div class="subcard tc2EmptyState">
   <h3>Noch keine Tiere</h3>
   <p class="muted">In dieser Gattung ist noch kein Tier gespeichert.</p>
  </div>`;
 }

 return `<div class="tc2TaxAnimalGrid">
  ${rows.map(x=>{
   const a=x.a;
   const photo=(a.photos||[]).find(p=>p.cover)||(a.photos||[])[0];
   const img=photo&&photo.data
    ? `<img src="${photo.data}">`
    : `<span>📷</span>`;
   const tax=[a.genus,a.species].filter(Boolean).join(' ');
   return `<button class="tc2TaxAnimal" onclick="NGT500.route('profile',{t:'${jsArg(x.t)}',i:${x.i}})">
    <div>${img}</div>
    <b>${esc(a.name||'Unbenannt')}</b>
    <small>${esc(tax||a.animalGroup||'')}</small>
   </button>`;
  }).join('')}
 </div>`;
}

function render(args){
 args=args||{};

 const t=args.t||'';
 const group=args.group||'';
 const genus=args.genus||'';
 const edit=args.edit;
 const hkn=!!args.hkn;

 if(hkn||edit!==undefined){
  return `<div class="card tc2PageCard tc2AnimalsPage">
   <div class="tc2PageHead">
    <div>
     <h2>${edit!==undefined?'Tier bearbeiten':'Tier anlegen'}</h2>
     <p class="muted">Tiergruppe, Gattung, Art und Stammdaten.</p>
    </div>
   </div>
   ${hkn?hknInfo()+editor(t,undefined,true):''}
   ${edit!==undefined?editor(t,Number(edit)):''}
  </div>`;
 }

 const all=allActive();

 if(!group){
  const groups=countBy(all,x=>x.a.animalGroup||'Unsortiert');

  return `<div class="card tc2PageCard tc2AnimalsPage">
   <div class="tc2PageHead">
    <div>
     <h2>Bestand</h2>
     <p class="muted">Dynamische Tiergruppen aus deinem Bestand.</p>
    </div>
   </div>
   ${folderGrid(groups,item=>`NGT500.route('animals',{group:'${jsArg(item.label)}'})`)}
  </div>`;
 }

 const groupRows=all.filter(x=>String(x.a.animalGroup||'Unsortiert')===String(group));

 if(group&&!genus){
  const genusRows=countBy(groupRows,x=>x.a.genus||'Ohne Gattung');

  return `<div class="card tc2PageCard tc2AnimalsPage">
   <div class="tc2PageHead">
    <div>
     ${backButton({group})}
     <h2>${esc(group)}</h2>
     <p class="muted">Wähle eine Gattung.</p>
    </div>
   </div>
   ${folderGrid(genusRows,item=>`NGT500.route('animals',{group:'${jsArg(group)}',genus:'${jsArg(item.label)}'})`)}
  </div>`;
 }

 const animalRows=groupRows.filter(x=>String(x.a.genus||'Ohne Gattung')===String(genus));

 return `<div class="card tc2PageCard tc2AnimalsPage">
  <div class="tc2PageHead">
   <div>
    ${backButton({group,genus})}
    <h2>${esc(genus)}</h2>
    <p class="muted">${esc(group)} · ${animalRows.length} ${animalRows.length===1?'Tier':'Tiere'}</p>
   </div>
  </div>
  ${animalIconGrid(animalRows)}
 </div>`;
}

function editor(t,i,fromHkn){
 const a=i!==undefined?NGTStore.animal(t,i):{};
 const parsed=NGTStore.parseFeeder(a.defaultFeeder||a.futterStandard||a.standardFeed||'');
 const defState=a.defaultFeederState||parsed.state||'Frost';
 const defType=a.defaultFeederType||parsed.prey||'Ratte';
 const defSize=a.defaultFeederSize||parsed.size||((NGTStore.FEEDER_SIZES[defType]||[])[0]||'');
 const feedInterval=a.feedIntervalDays||a.feedingInterval||a.feedInterval||14;

 return `<section class="tc2AnimalEditor">
  <div class="tc2AnimalEditorHead">
   <div>
    <h3>${i!==undefined?'Tier bearbeiten':(fromHkn?'Tier aus HKN anlegen':'Tier anlegen')}</h3>
    <p>Tiergruppe, Gattung, Art, Stammdaten und Standardfutter.</p>
   </div>
  </div>

  <div class="tc2AnimalEditorBlock">
   <h4>Taxonomie</h4>
   <div class="tc2AnimalFields">
    <label><span>Tiergruppe</span><input id="edAnimalGroup" placeholder="z. B. Vogelspinnen" value="${esc(a.animalGroup||'')}"></label>
    <label><span>Gattung</span><input id="edGenus" placeholder="z. B. Brachypelma" value="${esc(a.genus||'')}"></label>
    <label><span>Art</span><input id="edSpecies" placeholder="z. B. hamorii" value="${esc(a.species||'')}"></label>
   </div>
  </div>

  <div class="tc2AnimalEditorBlock">
   <h4>Stammdaten</h4>
   <div class="tc2AnimalFields">
    <label><span>Name</span><input id="edName" value="${esc(a.name||'')}"></label>
    <label><span>Morph</span><input id="edMorph" value="${esc(a.morph||'')}"></label>
    <label><span>Gewicht</span><input id="edWeight" type="number" value="${esc(a.weight||'')}"></label>
    <label><span>Geschlecht</span><select id="edSex">
     <option ${a.sex==='Unbestimmt'?'selected':''}>Unbestimmt</option>
     <option ${a.sex==='Männlich'?'selected':''}>Männlich</option>
     <option ${a.sex==='Weiblich'?'selected':''}>Weiblich</option>
    </select></label>
    <label><span>Status</span><select id="edStatus">${statusOptions(a.status||'Bestand')}</select></label>
   </div>
  </div>

  <div class="tc2AnimalEditorBlock">
   <h4>Herkunft</h4>
   <div class="tc2AnimalFields">
    <label><span>Herkunft / ENZ / FNZ</span><input id="edOrigin" value="${esc(a.origin||a.originType||'')}"></label>
    <label><span>Schlupfdatum</span><input id="edBirth" type="date" value="${esc(a.birth||a.birthDate||'')}"></label>
    <label><span>Vatertier</span><input id="edFather" value="${esc(a.father||a.vater||a.sire||'')}"></label>
    <label><span>Muttertier</span><input id="edMother" value="${esc(a.mother||a.mutter||a.dam||'')}"></label>
    <label><span>Kaufpreis</span><input id="edBuy" type="number" value="${esc(a.buyPrice||'')}"></label>
   </div>
  </div>

  <div class="tc2AnimalEditorBlock">
   <h4>Standardfutter</h4>
   <div class="tc2AnimalFields">
    <label><span>Intervall in Tagen</span><input id="edFeedInterval" type="number" min="1" value="${esc(feedInterval)}"></label>
    <label><span>Zustand</span><select id="edFeederState">
     <option ${defState==='Frost'?'selected':''}>Frost</option>
     <option ${defState==='Lebend'?'selected':''}>Lebend</option>
    </select></label>
    <label><span>Futtertier</span><select id="edFeederType" onchange="NGTAnimals.refreshSizeSelect('edFeederType','edFeederSize')">
     ${opt(NGTStore.FEEDER_TYPES,defType)}
    </select></label>
    <label><span>Größe</span><select id="edFeederSize">
     ${opt(NGTStore.FEEDER_SIZES[defType]||[],defSize)}
    </select></label>
   </div>
   <p>Gewichtsintervall: 30 Tage festgelegt.</p>
  </div>

  <div class="tc2AnimalEditorBlock">
   <h4>Notizen</h4>
   <textarea id="edNote" placeholder="Notizen">${esc(a.note||'')}</textarea>
  </div>

  <div class="tc2AnimalEditorActions">
   <button onclick="NGT500.route('dashboard')">Abbrechen</button>
   <button onclick="NGTAnimals.save('${jsArg(t)}',${i===undefined?'null':i})">Speichern</button>
  </div>
 </section>`;
}

function refreshSizeSelect(typeId,sizeId){
 const type=document.getElementById(typeId).value;
 const size=document.getElementById(sizeId);
 size.innerHTML=(NGTStore.FEEDER_SIZES[type]||[])
  .map(v=>`<option value="${esc(v)}">${esc(v)}</option>`)
  .join('');
}

function openEditor(t){
 document.querySelector('.tc2AnimalsPage, .card').insertAdjacentHTML('afterbegin',editor(t));
}

function save(t,i){
 const old=i===null?{}:NGTStore.animal(t,i);
 const interval=Math.max(1,Number(edFeedInterval.value||14));
 const state=edFeederState.value||'Frost';
 const type=edFeederType.value||'Ratte';
 const size=edFeederSize.value||'';
 const feeder=NGTStore.feederLabel(state,type,size);
 const h=hknDraft();
 const noteBase=edNote.value.trim();
 const note=h&&i===null
  ? (noteBase?noteBase+'\n\n':'')+'HKN importiert: '+(h.name||'Herkunftsnachweis')
  : noteBase;

 const a={
  ...old,
  animalGroup:edAnimalGroup.value.trim()||old.animalGroup||'Unsortiert',
  genus:edGenus.value.trim()||'Ohne Gattung',
  species:edSpecies.value.trim(),
  name:edName.value.trim()||'Unbenannt',
  morph:edMorph.value.trim(),
  weight:edWeight.value,
  origin:edOrigin.value.trim(),
  originType:edOrigin.value.trim(),
  birth:edBirth.value,
  father:edFather.value.trim(),
  vater:edFather.value.trim(),
  sire:edFather.value.trim(),
  mother:edMother.value.trim(),
  mutter:edMother.value.trim(),
  dam:edMother.value.trim(),
  feedIntervalDays:interval,
  feedingInterval:interval,
  feedInterval:interval,
  weightIntervalDays:30,
  buyPrice:edBuy.value,
  sex:edSex.value,
  status:edStatus.value,
  defaultFeeder:feeder,
  defaultFeederState:state,
  defaultFeederType:type,
  defaultFeederSize:size,
  futterStandard:feeder,
  standardFeed:feeder,
  note
 };

 a.feeds=a.feeds||[];
 a.sheds=a.sheds||[];
 a.weights=a.weights||[];
 a.photos=a.photos||[];

 if(h&&h.data&&String(h.data).startsWith('data:image')&&i===null){
  a.photos.unshift({
   date:NGT500.today(),
   type:'Herkunftsnachweis',
   note:h.name||'Herkunftsnachweis',
   data:h.data,
   cover:false
  });
 }

 if(i===null){
  NGTStore.addAnimal(t,a);
  try{sessionStorage.removeItem('terracontrol_hkn_import_v1')}catch(e){}
 }else{
  NGTStore.updateAnimal(t,i,a);
 }

 NGT500.route('animals',{group:a.animalGroup,genus:a.genus});
}

function remove(t,i){
 if(confirm('Tier wirklich löschen?')){
  const a=NGTStore.animal(t,i)||{};
  NGTStore.deleteAnimal(t,i);
  NGT500.route('animals',{group:a.animalGroup||'Unsortiert',genus:a.genus||'Ohne Gattung'});
 }
}

window.NGTAnimals={openEditor,save,remove,refreshSizeSelect};
NGT500.register('animals',{render});
})();