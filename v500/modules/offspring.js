(function(){
'use strict';

function esc(v){return NGT500.esc(v||'')}

function jsArg(v){
 return String(v||'').replace(/\\/g,'\\\\').replace(/'/g,"\\'");
}

function statusOptions(cur){
 return ['Nachzucht','Reserviert','Verkauft','Verstorben','Archiv']
  .map(s=>`<option ${cur===s?'selected':''}>${s}</option>`)
  .join('');
}

function opt(list,cur){
 return (list||[])
  .map(v=>`<option value="${esc(v)}" ${String(cur||'')===String(v)?'selected':''}>${esc(v)}</option>`)
  .join('');
}

function isInactiveStatus(status){
 return ['Archiv','Verkauft','Abgegeben','Verstorben'].includes(status);
}

function isOffspringAnimal(a){
 if(window.NGTIdManager&&NGTIdManager.isOffspring)return NGTIdManager.isOffspring(a);
 return String((a&&a.status)||'').toLowerCase()==='nachzucht' ||
  String((a&&a.collection)||'').toLowerCase()==='offspring' ||
  String((a&&a.collection)||'').toLowerCase()==='nachzuchten';
}

function allOffspring(){
 if(NGTStore.allOffspring)return NGTStore.allOffspring().filter(x=>!isInactiveStatus(x.a.status));

 const all=NGTStore.allAnimals?NGTStore.allAnimals():[];
 return all.filter(x=>!isInactiveStatus(x.a.status)&&isOffspringAnimal(x.a));
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
  return `<button onclick="NGT500.route('offspring',{group:'${jsArg(args.group)}'})">‹ ${esc(args.group)}</button>`;
 }
 if(args&&args.group){
  return `<button onclick="NGT500.route('dashboard')">‹ Start</button>`;
 }
 return `<button onclick="NGT500.route('dashboard')">‹ Start</button>`;
}

function folderGrid(items,onclick){
 if(!items.length){
  return `<div class="subcard tc2EmptyState">
   <h3>Noch keine Nachzuchten</h3>
   <p class="muted">Lege deine erste Nachzucht über die Startseite an. Nachzuchten bekommen eigene IDs wie KP-NZ001 oder VS-NZ001.</p>
  </div>`;
 }

 return `<div class="tc2TaxGrid">
  ${items.map(item=>`<button class="tc2TaxFolder tc2OffspringFolder" onclick="${onclick(item)}">
   <span>🥚</span>
   <b>${esc(item.label)}</b>
   <small>${item.count} ${item.count===1?'Nachzucht':'Nachzuchten'}</small>
  </button>`).join('')}
 </div>`;
}

function animalIconGrid(rows){
 if(!rows.length){
  return `<div class="subcard tc2EmptyState">
   <h3>Noch keine Nachzuchten</h3>
   <p class="muted">In dieser Gattung ist noch keine aktive Nachzucht gespeichert.</p>
  </div>`;
 }

 return `<div class="tc2TaxAnimalGrid">
  ${rows.map(x=>{
   const a=x.a;
   const photo=(a.photos||[]).find(p=>p.cover)||(a.photos||[])[0];
   const img=photo&&photo.data
    ? `<img src="${photo.data}">`
    : `<span>🥚</span>`;
   const tax=[a.genus,a.species].filter(Boolean).join(' ');
   return `<button class="tc2TaxAnimal tc2OffspringAnimal" onclick="NGT500.route('profile',{t:'${jsArg(x.t)}',i:${x.i}})">
    <div>${img}</div>
    <b>${esc(a.publicId||a.displayId||'')}</b>
    <strong>${esc(a.name||'Unbenannt')}</strong>
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

 if(edit!==undefined){
  return `<div class="card tc2PageCard tc2AnimalsPage tc2OffspringPage">
   <div class="tc2PageHead">
    <div>
     <h2>Nachzucht bearbeiten</h2>
     <p class="muted">Tiergruppe, Gattung, Art und Nachzuchtdaten.</p>
    </div>
   </div>
   ${editor(t,Number(edit))}
  </div>`;
 }

 const all=allOffspring();

 if(!group){
  const groups=countBy(all,x=>x.a.animalGroup||'Unsortiert');

  return `<div class="card tc2PageCard tc2AnimalsPage tc2OffspringPage">
   <div class="tc2PageHead">
    <div>
     <h2>Nachzuchten</h2>
     <p class="muted">Eigener Bereich mit eigenem Nummernkreis.</p>
    </div>
   </div>
   ${folderGrid(groups,item=>`NGT500.route('offspring',{group:'${jsArg(item.label)}'})`)}
  </div>`;
 }

 const groupRows=all.filter(x=>String(x.a.animalGroup||'Unsortiert')===String(group));

 if(group&&!genus){
  const genusRows=countBy(groupRows,x=>x.a.genus||'Ohne Gattung');

  return `<div class="card tc2PageCard tc2AnimalsPage tc2OffspringPage">
   <div class="tc2PageHead">
    <div>
     ${backButton({group})}
     <h2>${esc(group)}</h2>
     <p class="muted">Wähle eine Gattung der Nachzuchten.</p>
    </div>
   </div>
   ${folderGrid(genusRows,item=>`NGT500.route('offspring',{group:'${jsArg(group)}',genus:'${jsArg(item.label)}'})`)}
  </div>`;
 }

 const animalRows=groupRows.filter(x=>String(x.a.genus||'Ohne Gattung')===String(genus));

 return `<div class="card tc2PageCard tc2AnimalsPage tc2OffspringPage">
  <div class="tc2PageHead">
   <div>
    ${backButton({group,genus})}
    <h2>${esc(genus)}</h2>
    <p class="muted">${esc(group)} · ${animalRows.length} ${animalRows.length===1?'Nachzucht':'Nachzuchten'}</p>
   </div>
  </div>
  ${animalIconGrid(animalRows)}
 </div>`;
}

function editor(t,i){
 const a=i!==undefined?NGTStore.animal(t,i):{};
 const parsed=NGTStore.parseFeeder(a.defaultFeeder||a.futterStandard||a.standardFeed||'');
 const defState=a.defaultFeederState||parsed.state||'Frost';
 const defType=a.defaultFeederType||parsed.prey||'Ratte';
 const defSize=a.defaultFeederSize||parsed.size||((NGTStore.FEEDER_SIZES[defType]||[])[0]||'');
 const feedInterval=a.feedIntervalDays||a.feedingInterval||a.feedInterval||7;

 return `<section class="tc2AnimalEditor tc2OffspringEditor">
  <div class="tc2AnimalEditorHead">
   <div>
    <h3>${i!==undefined?'Nachzucht bearbeiten':'Nachzucht anlegen'}</h3>
    <p>Nachzuchten bekommen eigene IDs wie KP-NZ001, VS-NZ001 oder LG-NZ001.</p>
   </div>
  </div>

  <div class="tc2AnimalEditorBlock">
   <h4>Taxonomie</h4>
   <div class="tc2AnimalFields">
    <label><span>Tiergruppe</span><input id="edAnimalGroup" placeholder="z. B. Pythons" value="${esc(a.animalGroup||'')}"></label>
    <label><span>Gattung</span><input id="edGenus" placeholder="z. B. Python" value="${esc(a.genus||'')}"></label>
    <label><span>Art</span><input id="edSpecies" placeholder="z. B. regius" value="${esc(a.species||'')}"></label>
   </div>
  </div>

  <div class="tc2AnimalEditorBlock">
   <h4>Stammdaten</h4>
   <div class="tc2AnimalFields">
    <label><span>Name / Kennung</span><input id="edName" placeholder="optional" value="${esc(a.name||'')}"></label>
    <label><span>Morph</span><input id="edMorph" value="${esc(a.morph||'')}"></label>
    <label><span>Gewicht</span><input id="edWeight" type="number" value="${esc(a.weight||'')}"></label>
    <label><span>Geschlecht</span><select id="edSex">
     <option ${a.sex==='Unbestimmt'?'selected':''}>Unbestimmt</option>
     <option ${a.sex==='Männlich'?'selected':''}>Männlich</option>
     <option ${a.sex==='Weiblich'?'selected':''}>Weiblich</option>
    </select></label>
    <label><span>Status</span><select id="edStatus">${statusOptions(a.status||'Nachzucht')}</select></label>
   </div>
  </div>

  <div class="tc2AnimalEditorBlock">
   <h4>Zucht / Herkunft</h4>
   <div class="tc2AnimalFields">
    <label><span>Schlupf / Geburt</span><input id="edBirth" type="date" value="${esc(a.birth||a.birthDate||'')}"></label>
    <label><span>Gelege / Wurf</span><input id="edClutch" placeholder="z. B. CL-001" value="${esc(a.clutchId||a.clutch||'')}"></label>
    <label><span>Vatertier</span><input id="edFather" placeholder="z. B. KP-001" value="${esc(a.father||a.vater||a.sire||'')}"></label>
    <label><span>Muttertier</span><input id="edMother" placeholder="z. B. KP-002" value="${esc(a.mother||a.mutter||a.dam||'')}"></label>
    <label><span>Verkaufspreis</span><input id="edBuy" type="number" value="${esc(a.buyPrice||a.salePrice||'')}"></label>
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
    <label><span>Futtertier</span><select id="edFeederType" onchange="NGTOffspring.refreshSizeSelect('edFeederType','edFeederSize')">
     ${opt(NGTStore.FEEDER_TYPES,defType)}
    </select></label>
    <label><span>Größe</span><select id="edFeederSize">
     ${opt(NGTStore.FEEDER_SIZES[defType]||[],defSize)}
    </select></label>
   </div>
  </div>

  <div class="tc2AnimalEditorBlock">
   <h4>Notizen</h4>
   <textarea id="edNote" placeholder="Notizen">${esc(a.note||'')}</textarea>
  </div>

  <div class="tc2AnimalEditorActions">
   <button onclick="NGT500.route('dashboard')">Abbrechen</button>
   <button onclick="NGTOffspring.save('${jsArg(t)}',${i===undefined?'null':i})">Speichern</button>
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
 document.querySelector('.tc2OffspringPage, .tc2AnimalsPage, .card').insertAdjacentHTML('afterbegin',editor(t));
}

function save(t,i){
 const old=i===null?{}:NGTStore.animal(t,i);
 const interval=Math.max(1,Number(edFeedInterval.value||7));
 const state=edFeederState.value||'Frost';
 const type=edFeederType.value||'Ratte';
 const size=edFeederSize.value||'';
 const feeder=NGTStore.feederLabel(state,type,size);

 const a={
  ...old,
  animalGroup:edAnimalGroup.value.trim()||old.animalGroup||'Unsortiert',
  genus:edGenus.value.trim()||'Ohne Gattung',
  species:edSpecies.value.trim(),
  name:edName.value.trim(),
  morph:edMorph.value.trim(),
  weight:edWeight.value,
  origin:'Nachzucht',
  originType:'Nachzucht',
  birth:edBirth.value,
  birthDate:edBirth.value,
  clutchId:edClutch.value.trim(),
  clutch:edClutch.value.trim(),
  father:edFather.value.trim(),
  vater:edFather.value.trim(),
  sire:edFather.value.trim(),
  mother:edMother.value.trim(),
  mutter:edMother.value.trim(),
  dam:edMother.value.trim(),
  feedIntervalDays:interval,
  feedingInterval:interval,
  feedInterval:interval,
  weightIntervalDays:14,
  buyPrice:edBuy.value,
  salePrice:edBuy.value,
  sex:edSex.value,
  status:edStatus.value||'Nachzucht',
  collection:'offspring',
  defaultFeeder:feeder,
  defaultFeederState:state,
  defaultFeederType:type,
  defaultFeederSize:size,
  futterStandard:feeder,
  standardFeed:feeder,
  note:edNote.value.trim()
 };

 a.feeds=a.feeds||[];
 a.sheds=a.sheds||[];
 a.weights=a.weights||[];
 a.photos=a.photos||[];
 a.health=a.health||[];

 if(i===null){
  NGTStore.addAnimal(t,a);
 }else{
  NGTStore.updateAnimal(t,i,a);
 }

 NGT500.route('offspring',{group:a.animalGroup,genus:a.genus});
}

function remove(t,i){
 if(confirm('Nachzucht wirklich löschen?')){
  const a=NGTStore.animal(t,i)||{};
  NGTStore.deleteAnimal(t,i);
  NGT500.route('offspring',{group:a.animalGroup||'Unsortiert',genus:a.genus||'Ohne Gattung'});
 }
}

window.NGTOffspring={openEditor,save,remove,refreshSizeSelect};
NGT500.register('offspring',{render});
})();