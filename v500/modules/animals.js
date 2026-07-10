(function(){
'use strict';

function esc(v){return NGT500.esc(v||'')}

function jsArg(v){
 return String(v||'').replace(/\\/g,'\\\\').replace(/'/g,"\\'");
}

function isOffspringAnimal(a){
 if(window.NGTIdManager&&NGTIdManager.isOffspring){
  return NGTIdManager.isOffspring(a);
 }

 return String((a&&a.status)||'').toLowerCase()==='nachzucht' ||
  String((a&&a.collection)||'').toLowerCase()==='offspring' ||
  String((a&&a.collection)||'').toLowerCase()==='nachzuchten';
}

function statusOptions(cur){
 return ['Bestand','Verkauft','Abgegeben','Verstorben','Archiv']
  .map(function(status){
   return `<option ${cur===status?'selected':''}>${status}</option>`;
  })
  .join('');
}

function opt(list,cur){
 return (list||[])
  .map(function(value){
   return `<option value="${esc(value)}" ${String(cur||'')===String(value)?'selected':''}>${esc(value)}</option>`;
  })
  .join('');
}

function photoSrc(photo,preferThumb){
 if(!photo)return '';

 if(window.NGTPhotoStorage&&NGTPhotoStorage.src){
  return NGTPhotoStorage.src(photo,preferThumb);
 }

 if(preferThumb&&(photo.thumbUrl||photo.thumbnailUrl)){
  return photo.thumbUrl||photo.thumbnailUrl;
 }

 return photo.url||
  photo.thumbUrl||
  photo.thumbnailUrl||
  photo.data||
  '';
}

function isUsablePhoto(photo){
 return !!photoSrc(photo,true);
}

function coverPhoto(animal){
 const photos=(
  animal&&Array.isArray(animal.photos)
   ?animal.photos
   :[]
 ).filter(isUsablePhoto);

 return photos.find(function(photo){
  return photo.cover;
 })||photos[0]||null;
}

function hknDraft(){
 try{
  return JSON.parse(
   sessionStorage.getItem('terracontrol_hkn_import_v1')||'null'
  );
 }catch(e){
  return null;
 }
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
 const all=NGTStore.allAnimals
  ?NGTStore.allAnimals()
  :[];

 return all.filter(function(row){
  return ![
   'Archiv',
   'Verkauft',
   'Abgegeben',
   'Verstorben'
  ].includes(row.a.status) &&
  !isOffspringAnimal(row.a);
 });
}

function countBy(rows,keyFn){
 const map={};

 rows.forEach(function(row){
  const key=keyFn(row)||'Unsortiert';
  map[key]=(map[key]||0)+1;
 });

 return Object.keys(map)
  .sort()
  .map(function(key){
   return {
    label:key,
    count:map[key]
   };
  });
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
  ${items.map(function(item){
   return `<button class="tc2TaxFolder" onclick="${onclick(item)}">
    <span>●●●</span>
    <b>${esc(item.label)}</b>
    <small>${item.count} ${item.count===1?'Tier':'Tiere'}</small>
   </button>`;
  }).join('')}
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
  ${rows.map(function(row){
   const animal=row.a;
   const photo=coverPhoto(animal);
   const source=photoSrc(photo,true);

   const image=source
    ?`<img src="${esc(source)}" alt="${esc(animal.name||'Tierfoto')}" loading="lazy">`
    :`<span>📷</span>`;

   const taxonomy=[
    animal.genus,
    animal.species
   ].filter(Boolean).join(' ');

   return `<button class="tc2TaxAnimal" onclick="NGT500.route('profile',{t:'${jsArg(row.t)}',i:${row.i}})">
    <div>${image}</div>
    <b>${esc(animal.publicId||animal.displayId||'')}</b>
    <strong>${esc(animal.name||'Unbenannt')}</strong>
    <small>${esc(taxonomy||animal.animalGroup||'')}</small>
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
  const groups=countBy(
   all,
   function(row){
    return row.a.animalGroup||'Unsortiert';
   }
  );

  return `<div class="card tc2PageCard tc2AnimalsPage">
   <div class="tc2PageHead">
    <div>
     <h2>Bestand</h2>
     <p class="muted">Dynamische Tiergruppen aus deinem Bestand.</p>
    </div>
   </div>

   ${folderGrid(
    groups,
    function(item){
     return `NGT500.route('animals',{group:'${jsArg(item.label)}'})`;
    }
   )}
  </div>`;
 }

 const groupRows=all.filter(function(row){
  return String(row.a.animalGroup||'Unsortiert')===String(group);
 });

 if(group&&!genus){
  const genusRows=countBy(
   groupRows,
   function(row){
    return row.a.genus||'Ohne Gattung';
   }
  );

  return `<div class="card tc2PageCard tc2AnimalsPage">
   <div class="tc2PageHead">
    <div>
     ${backButton({group:group})}
     <h2>${esc(group)}</h2>
     <p class="muted">Wähle eine Gattung.</p>
    </div>
   </div>

   ${folderGrid(
    genusRows,
    function(item){
     return `NGT500.route('animals',{group:'${jsArg(group)}',genus:'${jsArg(item.label)}'})`;
    }
   )}
  </div>`;
 }

 const animalRows=groupRows.filter(function(row){
  return String(row.a.genus||'Ohne Gattung')===String(genus);
 });

 return `<div class="card tc2PageCard tc2AnimalsPage">
  <div class="tc2PageHead">
   <div>
    ${backButton({
     group:group,
     genus:genus
    })}
    <h2>${esc(genus)}</h2>
    <p class="muted">${esc(group)} · ${animalRows.length} ${animalRows.length===1?'Tier':'Tiere'}</p>
   </div>
  </div>

  ${animalIconGrid(animalRows)}
 </div>`;
}

function editor(t,i,fromHkn){
 const animal=i!==undefined
  ?NGTStore.animal(t,i)
  :{};

 const parsed=NGTStore.parseFeeder(
  animal.defaultFeeder||
  animal.futterStandard||
  animal.standardFeed||
  ''
 );

 const defState=animal.defaultFeederState||
  parsed.state||
  'Frost';

 const defType=animal.defaultFeederType||
  parsed.prey||
  'Ratte';

 const defSize=animal.defaultFeederSize||
  parsed.size||
  (
   (NGTStore.FEEDER_SIZES[defType]||[])[0]||
   ''
  );

 const feedInterval=animal.feedIntervalDays||
  animal.feedingInterval||
  animal.feedInterval||
  14;

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
    <label>
     <span>Tiergruppe</span>
     <input id="edAnimalGroup" placeholder="z. B. Pythons" value="${esc(animal.animalGroup||'')}">
    </label>

    <label>
     <span>Gattung</span>
     <input id="edGenus" placeholder="z. B. Python" value="${esc(animal.genus||'')}">
    </label>

    <label>
     <span>Art</span>
     <input id="edSpecies" placeholder="z. B. regius" value="${esc(animal.species||'')}">
    </label>
   </div>
  </div>

  <div class="tc2AnimalEditorBlock">
   <h4>Stammdaten</h4>

   <div class="tc2AnimalFields">
    <label>
     <span>Name</span>
     <input id="edName" value="${esc(animal.name||'')}">
    </label>

    <label>
     <span>Morph</span>
     <input id="edMorph" value="${esc(animal.morph||'')}">
    </label>

    <label>
     <span>Gewicht</span>
     <input id="edWeight" type="number" value="${esc(animal.weight||'')}">
    </label>

    <label>
     <span>Geschlecht</span>
     <select id="edSex">
      <option ${animal.sex==='Unbestimmt'?'selected':''}>Unbestimmt</option>
      <option ${animal.sex==='Männlich'?'selected':''}>Männlich</option>
      <option ${animal.sex==='Weiblich'?'selected':''}>Weiblich</option>
     </select>
    </label>

    <label>
     <span>Status</span>
     <select id="edStatus">
      ${statusOptions(animal.status||'Bestand')}
     </select>
    </label>
   </div>
  </div>

  <div class="tc2AnimalEditorBlock">
   <h4>Herkunft</h4>

   <div class="tc2AnimalFields">
    <label>
     <span>Herkunft / ENZ / FNZ</span>
     <input id="edOrigin" value="${esc(animal.origin||animal.originType||'')}">
    </label>

    <label>
     <span>Schlupfdatum</span>
     <input id="edBirth" type="date" value="${esc(animal.birth||animal.birthDate||'')}">
    </label>

    <label>
     <span>Vatertier</span>
     <input id="edFather" value="${esc(animal.father||animal.vater||animal.sire||'')}">
    </label>

    <label>
     <span>Muttertier</span>
     <input id="edMother" value="${esc(animal.mother||animal.mutter||animal.dam||'')}">
    </label>

    <label>
     <span>Kaufpreis</span>
     <input id="edBuy" type="number" value="${esc(animal.buyPrice||'')}">
    </label>
   </div>
  </div>

  <div class="tc2AnimalEditorBlock">
   <h4>Standardfutter</h4>

   <div class="tc2AnimalFields">
    <label>
     <span>Intervall in Tagen</span>
     <input id="edFeedInterval" type="number" min="1" value="${esc(feedInterval)}">
    </label>

    <label>
     <span>Zustand</span>
     <select id="edFeederState">
      <option ${defState==='Frost'?'selected':''}>Frost</option>
      <option ${defState==='Lebend'?'selected':''}>Lebend</option>
     </select>
    </label>

    <label>
     <span>Futtertier</span>
     <select id="edFeederType" onchange="NGTAnimals.refreshSizeSelect('edFeederType','edFeederSize')">
      ${opt(NGTStore.FEEDER_TYPES,defType)}
     </select>
    </label>

    <label>
     <span>Größe</span>
     <select id="edFeederSize">
      ${opt(NGTStore.FEEDER_SIZES[defType]||[],defSize)}
     </select>
    </label>
   </div>

   <p>Gewichtsintervall: 30 Tage festgelegt.</p>
  </div>

  <div class="tc2AnimalEditorBlock">
   <h4>Notizen</h4>
   <textarea id="edNote" placeholder="Notizen">${esc(animal.note||'')}</textarea>
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
  .map(function(value){
   return `<option value="${esc(value)}">${esc(value)}</option>`;
  })
  .join('');
}

function openEditor(t){
 const target=document.querySelector(
  '.tc2AnimalsPage, .card'
 );

 if(!target)return;

 target.insertAdjacentHTML(
  'afterbegin',
  editor(t)
 );
}

function save(t,i){
 const old=i===null
  ?{}
  :NGTStore.animal(t,i);

 const interval=Math.max(
  1,
  Number(document.getElementById('edFeedInterval').value||14)
 );

 const state=document.getElementById('edFeederState').value||'Frost';
 const type=document.getElementById('edFeederType').value||'Ratte';
 const size=document.getElementById('edFeederSize').value||'';
 const feeder=NGTStore.feederLabel(state,type,size);
 const h=hknDraft();
 const noteBase=document.getElementById('edNote').value.trim();

 const note=h&&i===null
  ?(
   noteBase
    ?noteBase+'\n\n'
    :''
  )+'HKN importiert: '+(h.name||'Herkunftsnachweis')
  :noteBase;

 const animal={
  ...old,
  animalGroup:document.getElementById('edAnimalGroup').value.trim()||
   old.animalGroup||
   'Unsortiert',
  genus:document.getElementById('edGenus').value.trim()||
   'Ohne Gattung',
  species:document.getElementById('edSpecies').value.trim(),
  name:document.getElementById('edName').value.trim(),
  morph:document.getElementById('edMorph').value.trim(),
  weight:document.getElementById('edWeight').value,
  origin:document.getElementById('edOrigin').value.trim(),
  originType:document.getElementById('edOrigin').value.trim(),
  birth:document.getElementById('edBirth').value,
  father:document.getElementById('edFather').value.trim(),
  vater:document.getElementById('edFather').value.trim(),
  sire:document.getElementById('edFather').value.trim(),
  mother:document.getElementById('edMother').value.trim(),
  mutter:document.getElementById('edMother').value.trim(),
  dam:document.getElementById('edMother').value.trim(),
  feedIntervalDays:interval,
  feedingInterval:interval,
  feedInterval:interval,
  weightIntervalDays:30,
  buyPrice:document.getElementById('edBuy').value,
  sex:document.getElementById('edSex').value,
  status:document.getElementById('edStatus').value,
  collection:'stock',
  defaultFeeder:feeder,
  defaultFeederState:state,
  defaultFeederType:type,
  defaultFeederSize:size,
  futterStandard:feeder,
  standardFeed:feeder,
  note:note
 };

 animal.feeds=animal.feeds||[];
 animal.sheds=animal.sheds||[];
 animal.weights=animal.weights||[];
 animal.photos=animal.photos||[];

 if(
  h&&
  h.data&&
  String(h.data).startsWith('data:image')&&
  i===null
 ){
  animal.photos.unshift({
   date:NGT500.today(),
   type:'Herkunftsnachweis',
   note:h.name||'Herkunftsnachweis',
   data:h.data,
   cover:false
  });
 }

 if(i===null){
  NGTStore.addAnimal(t,animal);

  try{
   sessionStorage.removeItem(
    'terracontrol_hkn_import_v1'
   );
  }catch(e){}

 }else{
  NGTStore.updateAnimal(t,i,animal);
 }

 NGT500.route('animals',{
  group:animal.animalGroup,
  genus:animal.genus
 });
}

function remove(t,i){
 if(!confirm('Tier wirklich löschen?'))return;

 const animal=NGTStore.animal(t,i)||{};

 NGTStore.deleteAnimal(t,i);

 NGT500.route('animals',{
  group:animal.animalGroup||'Unsortiert',
  genus:animal.genus||'Ohne Gattung'
 });
}

window.NGTAnimals={
 openEditor:openEditor,
 save:save,
 remove:remove,
 refreshSizeSelect:refreshSizeSelect
};

NGT500.register('animals',{
 render:render
});

})();