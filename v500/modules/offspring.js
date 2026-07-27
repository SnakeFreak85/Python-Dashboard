(function(){
'use strict';

function esc(value){
 return NGT500.esc(value||'');
}

function text(value){
 return String(value==null?'':value).trim();
}

function jsArg(value){
 return String(value||'')
  .replace(/\\/g,'\\\\')
  .replace(/'/g,"\\'");
}

function statusOptions(current){
 return [
  'Nachzucht',
  'Reserviert',
  'Verkauft',
  'Verstorben',
  'Archiv'
 ].map(function(status){
  return `<option ${current===status?'selected':''}>
   ${status}
  </option>`;
 }).join('');
}

function isInactiveStatus(status){
 return [
  'Archiv',
  'Verkauft',
  'Abgegeben',
  'Verstorben'
 ].includes(status);
}

function isOffspringAnimal(animal){
 if(window.NGTIdManager&&NGTIdManager.isOffspring){
  return NGTIdManager.isOffspring(animal);
 }

 return String((animal&&animal.status)||'').toLowerCase()==='nachzucht'||
  String((animal&&animal.collection)||'').toLowerCase()==='offspring'||
  String((animal&&animal.collection)||'').toLowerCase()==='nachzuchten';
}

function allOffspring(){
 if(NGTStore.allOffspring){
  return NGTStore.allOffspring().filter(function(row){
   return !isInactiveStatus(row.a.status);
  });
 }

 const all=NGTStore.allAnimals
  ?NGTStore.allAnimals()
  :[];

 return all.filter(function(row){
  return !isInactiveStatus(row.a.status)&&
   isOffspringAnimal(row.a);
 });
}

function photoSrc(photo,preferThumbnail){
 if(!photo)return '';

 if(window.NGTPhotoStorage&&NGTPhotoStorage.src){
  return NGTPhotoStorage.src(
   photo,
   preferThumbnail
  );
 }

 if(
  preferThumbnail&&
  (
   photo.thumbUrl||
   photo.thumbnailUrl
  )
 ){
  return photo.thumbUrl||
   photo.thumbnailUrl;
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

function foodInventory(){
 const data=NGTStore.data();

 if(!Array.isArray(data.foodInventory)){
  data.foodInventory=[];
 }

 return data.foodInventory;
}

function normalizeFoodItem(item){
 item=item||{};

 const parsed=
  window.NGTStore&&
  NGTStore.parseFeeder
   ?NGTStore.parseFeeder(
    item.label||
    item.name||
    ''
   )
   :{};

 item.id=item.id||
  item.key||
  'food_'+Math.random().toString(36).slice(2,10);

 item.category=text(
  item.category||
  item.group||
  item.foodCategory||
  'Futtertiere'
 );

 item.condition=text(
  item.condition||
  item.state||
  parsed.state||
  ''
 );

 item.itemName=text(
  item.itemName||
  item.prey||
  item.type||
  parsed.prey||
  item.label||
  item.name||
  'Unbenannt'
 );

 item.variant=text(
  item.variant||
  item.size||
  parsed.size||
  ''
 );

 item.unit=text(
  item.unit||
  'Stück'
 );

 item.qty=Number(item.qty||0);

 item.label=text(item.label)||
  [
   item.condition,
   item.itemName,
   item.variant
  ].filter(Boolean).join(' ');

 item.name=item.label;

 return item;
}

function normalizedFoodInventory(){
 return foodInventory()
  .map(normalizeFoodItem)
  .sort(function(a,b){
   const categoryCompare=
    String(a.category||'')
     .localeCompare(
      String(b.category||''),
      'de'
     );

   if(categoryCompare!==0){
    return categoryCompare;
   }

   return foodLabel(a)
    .localeCompare(
     foodLabel(b),
     'de'
    );
  });
}

function foodLabel(item){
 if(!item)return '';

 return [
  item.condition,
  item.itemName,
  item.variant
 ].filter(Boolean).join(' ')||
 item.label||
 item.name||
 'Unbenannt';
}

function foodMeta(item){
 if(!item)return '';

 return [
  item.category,
  Number(item.qty||0)+' '+(item.unit||'Stück')
 ].filter(Boolean).join(' · ');
}

function foodById(id){
 return normalizedFoodInventory().find(function(item){
  return String(item.id)===String(id);
 })||null;
}

function defaultFoodId(animal){
 const stored=text(
  animal.defaultFeederId||
  animal.foodInventoryId||
  ''
 );

 if(stored&&foodById(stored)){
  return stored;
 }

 const legacy=text(
  animal.defaultFeeder||
  animal.futterStandard||
  animal.standardFeed||
  ''
 );

 if(!legacy)return '';

 const match=normalizedFoodInventory().find(function(item){
  return foodLabel(item)===legacy||
   text(item.label)===legacy||
   text(item.name)===legacy;
 });

 return match?match.id:'';
}

function foodOptions(animal){
 const items=normalizedFoodInventory();
 const selectedId=defaultFoodId(animal);

 let options='<option value="">Kein Standardfutter</option>';
 let selectedFound=false;

 items.forEach(function(item){
  const selected=
   String(item.id)===String(selectedId);

  if(selected){
   selectedFound=true;
  }

  options+=`<option
   value="${esc(item.id)}"
   ${selected?'selected':''}
  >
   ${esc(foodLabel(item))} · ${esc(foodMeta(item))}
  </option>`;
 });

 const legacy=text(
  animal.defaultFeeder||
  animal.futterStandard||
  animal.standardFeed||
  ''
 );

 if(
  legacy&&
  !selectedFound
 ){
  options+=`<option
   value="legacy:${esc(legacy)}"
   selected
  >
   ${esc(legacy)} · bisherige Auswahl
  </option>`;
 }

 return options;
}

function countBy(rows,keyFunction){
 const map={};

 rows.forEach(function(row){
  const key=keyFunction(row)||'Unsortiert';
  map[key]=(map[key]||0)+1;
 });

 return Object.keys(map)
  .sort(function(a,b){
   return a.localeCompare(b,'de');
  })
  .map(function(key){
   return {
    label:key,
    count:map[key]
   };
  });
}

function backButton(args){
 if(args&&args.genus){
  return `<button
   class="tc2ProfileTopBack"
   onclick="NGT500.route('offspring',{group:'${jsArg(args.group)}'})"
  >
   ‹ ${esc(args.group)}
  </button>`;
 }

 return `<button
  class="tc2ProfileTopBack"
  onclick="NGT500.route('dashboard')"
 >
  ‹ Start
 </button>`;
}

function summary(all){
 const reserved=all.filter(function(row){
  return row.a.status==='Reserviert';
 }).length;

 const groups=new Set(
  all.map(function(row){
   return row.a.animalGroup||'Unsortiert';
  })
 ).size;

 const photos=all.reduce(function(total,row){
  return total+(
   Array.isArray(row.a.photos)
    ?row.a.photos.filter(isUsablePhoto).length
    :0
  );
 },0);

 return `<div class="tc2ProfileOverviewGrid tc2OffspringSummary">
  <div>
   <small>Aktive Nachzuchten</small>
   <b>${all.length}</b>
  </div>

  <div>
   <small>Reserviert</small>
   <b>${reserved}</b>
  </div>

  <div>
   <small>Tiergruppen</small>
   <b>${groups}</b>
  </div>

  <div>
   <small>Fotos</small>
   <b>${photos}</b>
  </div>
 </div>`;
}

function emptyState(title,message){
 return `<div class="tc2EmptyState">
  <div class="tc2EmptyStateIcon">🥚</div>
  <h3>${esc(title)}</h3>
  <p>${esc(message)}</p>
 </div>`;
}

function folderGrid(items,onclick){
 if(!items.length){
  return emptyState(
   'Noch keine Nachzuchten',
   'Lege deine erste Nachzucht über die Startseite an.'
  );
 }

 return `<div class="tc2TaxGrid">
  ${items.map(function(item){
   return `<button
    class="tc2TaxFolder tc2OffspringFolder"
    onclick="${onclick(item)}"
   >
    <span>🥚</span>

    <b>${esc(item.label)}</b>

    <small>
     ${item.count}
     ${item.count===1?'Nachzucht':'Nachzuchten'}
    </small>
   </button>`;
  }).join('')}
 </div>`;
}

function animalIconGrid(rows){
 if(!rows.length){
  return emptyState(
   'Noch keine Nachzuchten',
   'In dieser Gattung ist noch keine aktive Nachzucht gespeichert.'
  );
 }

 return `<div class="tc2TaxAnimalGrid">
  ${rows.map(function(row){
   const animal=row.a;
   const photo=coverPhoto(animal);
   const source=photoSrc(photo,true);

   const image=source
    ?`<img
      src="${esc(source)}"
      alt="${esc(animal.name||'Nachzuchtfoto')}"
      loading="lazy"
     >`
    :'<span>🥚</span>';

   const taxonomy=[
    animal.genus,
    animal.species
   ].filter(Boolean).join(' ');

   const status=animal.status||'Nachzucht';

   return `<button
    class="tc2TaxAnimal tc2OffspringAnimal"
    onclick="NGT500.route('profile',{animalId:'${jsArg(NGTStore.animalId(animal))}'})"
   >
    <div>${image}</div>

    <b>
     ${esc(animal.publicId||animal.displayId||'')}
    </b>

    <strong>
     ${esc(animal.name||'Unbenannt')}
    </strong>

    <small>
     ${esc(taxonomy||animal.animalGroup||'')}
    </small>

    <em class="tc2OffspringStatus">
     ${esc(status)}
    </em>
   </button>`;
  }).join('')}
 </div>`;
}

function pageHeader(title,subtitle,back){
 return `<div class="tc2PageHead tc2OffspringPageHead">
  <div>
   ${back||''}

   <h2>${esc(title)}</h2>

   <p class="muted">
    ${esc(subtitle)}
   </p>
  </div>
 </div>`;
}

function render(args){
 args=args||{};

 const t=args.t||'';
 const group=args.group||'';
 const genus=args.genus||'';
 const edit=args.edit;
 const editId=args.editId;
 const create=!!args.create;

 if(create){
  return `<section class="tc2PageCard tc2AnimalsPage tc2OffspringPage">
   ${editor('',undefined)}
  </section>`;
 }

 if(edit!==undefined||editId){
  const editRow=editId
   ?NGTStore.resolveAnimal({animalId:editId})
   :NGTStore.resolveAnimal({t:t,i:edit});

  return `<section class="tc2PageCard tc2AnimalsPage tc2OffspringPage">
   ${
    editRow
     ?editor(editRow.t,editRow.i)
     :emptyState(
      'Nachzucht nicht gefunden',
      'Der Datensatz ist nicht mehr vorhanden.'
     )
   }
  </section>`;
 }

 const all=allOffspring();

 if(!group){
  const groups=countBy(
   all,
   function(row){
    return row.a.animalGroup||'Unsortiert';
   }
  );

  return `<section class="tc2PageCard tc2AnimalsPage tc2OffspringPage">
   <div class="tc2OffspringHero">
    <div>
     <span>🥚</span>

     <div>
      <h2>Nachzuchten</h2>
      <p>
       Eigener Bereich mit eigenem Nummernkreis und
       vollständiger Tierhistorie.
      </p>
     </div>
    </div>
   </div>

   ${summary(all)}

   ${pageHeader(
    'Tiergruppen',
    'Wähle eine Tiergruppe deiner Nachzuchten.'
   )}

   ${folderGrid(
    groups,
    function(item){
     return `NGT500.route('offspring',{group:'${jsArg(item.label)}'})`;
    }
   )}
  </section>`;
 }

 const groupRows=all.filter(function(row){
  return String(
   row.a.animalGroup||
   'Unsortiert'
  )===String(group);
 });

 if(group&&!genus){
  const genusRows=countBy(
   groupRows,
   function(row){
    return row.a.genus||'Ohne Gattung';
   }
  );

  return `<section class="tc2PageCard tc2AnimalsPage tc2OffspringPage">
   ${pageHeader(
    group,
    groupRows.length+' aktive Nachzucht'+
     (groupRows.length===1?'':'en'),
    backButton({
     group:group
    })
   )}

   ${folderGrid(
    genusRows,
    function(item){
     return `NGT500.route('offspring',{group:'${jsArg(group)}',genus:'${jsArg(item.label)}'})`;
    }
   )}
  </section>`;
 }

 const animalRows=groupRows.filter(function(row){
  return String(
   row.a.genus||
   'Ohne Gattung'
  )===String(genus);
 });

 return `<section class="tc2PageCard tc2AnimalsPage tc2OffspringPage">
  ${pageHeader(
   genus,
   group+' · '+
    animalRows.length+' '+
    (
     animalRows.length===1
      ?'Nachzucht'
      :'Nachzuchten'
    ),
   backButton({
    group:group,
    genus:genus
   })
  )}

  ${animalIconGrid(animalRows)}
 </section>`;
}

function editor(t,index){
 const animal=index!==undefined
  ?NGTStore.animal(t,index)
  :{};
 const animalId=index!==undefined
  ?NGTStore.animalId(animal)
  :'';

 const feedInterval=
  animal.feedIntervalDays||
  animal.feedingInterval||
  animal.feedInterval||
  7;

 const hasFood=
  normalizedFoodInventory().length>0;

 return `<section class="tc2AnimalEditor tc2OffspringEditor">
  <div class="tc2AnimalEditorHead">
   <div>
    <h3>
     ${
      index!==undefined
       ?'Nachzucht bearbeiten'
       :'Nachzucht anlegen'
     }
    </h3>

    <p>
     Nachzuchten bekommen eigene IDs wie KP-NZ001,
     VS-NZ001 oder LG-NZ001.
    </p>
   </div>
  </div>

  <div class="tc2AnimalEditorBlock">
   <h4>Taxonomie</h4>

   <div class="tc2AnimalFields">
    <label>
     <span>Tiergruppe</span>

     <input
      id="edAnimalGroup"
      placeholder="z. B. Pythons"
      value="${esc(animal.animalGroup||'')}"
     >
    </label>

    <label>
     <span>Gattung</span>

     <input
      id="edGenus"
      placeholder="z. B. Python"
      value="${esc(animal.genus||'')}"
     >
    </label>

    <label>
     <span>Art</span>

     <input
      id="edSpecies"
      placeholder="z. B. regius"
      value="${esc(animal.species||'')}"
     >
    </label>
   </div>
  </div>

  <div class="tc2AnimalEditorBlock">
   <h4>Stammdaten</h4>

   <div class="tc2AnimalFields">
    <label>
     <span>Name / Kennung</span>

     <input
      id="edName"
      placeholder="optional"
      value="${esc(animal.name||'')}"
     >
    </label>

    <label>
     <span>Morph</span>

     <input
      id="edMorph"
      value="${esc(animal.morph||'')}"
     >
    </label>

    <label>
     <span>Gewicht in g</span>

     <input
      id="edWeight"
      type="number"
      min="0"
      step="any"
      value="${esc(animal.weight||'')}"
     >
    </label>

    <label>
     <span>Geschlecht</span>

     <select id="edSex">
      <option ${animal.sex==='Unbestimmt'?'selected':''}>
       Unbestimmt
      </option>

      <option ${animal.sex==='Männlich'?'selected':''}>
       Männlich
      </option>

      <option ${animal.sex==='Weiblich'?'selected':''}>
       Weiblich
      </option>
     </select>
    </label>

    <label>
     <span>Status</span>

     <select id="edStatus">
      ${statusOptions(
       animal.status||
       'Nachzucht'
      )}
     </select>
    </label>
   </div>
  </div>

  <div class="tc2AnimalEditorBlock">
   <h4>Zucht und Herkunft</h4>

   <div class="tc2AnimalFields">
    <label>
     <span>Schlupf / Geburt</span>

     <input
      id="edBirth"
      type="date"
      value="${esc(animal.birth||animal.birthDate||'')}"
     >
    </label>

    <label>
     <span>Gelege / Wurf</span>

     <input
      id="edClutch"
      placeholder="z. B. CL-001"
      value="${esc(animal.clutchId||animal.clutch||'')}"
     >
    </label>

    <label>
     <span>Vatertier</span>

     <input
      id="edFather"
      placeholder="z. B. KP-001"
      value="${esc(animal.father||animal.vater||animal.sire||'')}"
     >
    </label>

    <label>
     <span>Muttertier</span>

     <input
      id="edMother"
      placeholder="z. B. KP-002"
      value="${esc(animal.mother||animal.mutter||animal.dam||'')}"
     >
    </label>

    <label>
     <span>Verkaufspreis</span>

     <input
      id="edBuy"
      type="number"
      min="0"
      step="any"
      value="${esc(animal.salePrice||animal.buyPrice||'')}"
     >
    </label>
   </div>
  </div>

  <div class="tc2AnimalEditorBlock">
   <h4>Standardfutter</h4>

   <div class="tc2AnimalFields">
    <label>
     <span>Intervall in Tagen</span>

     <input
      id="edFeedInterval"
      type="number"
      min="1"
      value="${esc(feedInterval)}"
     >
    </label>

    <label>
     <span>Futter aus Bestand</span>

     <select id="edFoodInventoryId">
      ${foodOptions(animal)}
     </select>
    </label>
   </div>

   ${
    hasFood
     ?`<p class="muted">
       Das Standardfutter wird direkt mit einer Position
       aus dem dynamischen Futterbestand verknüpft.
      </p>`
     :`<div class="tc2EmptyState tc2OffspringFoodEmpty">
       <div class="tc2EmptyStateIcon">🥩</div>

       <h3>Noch kein Futterbestand</h3>

       <p>
        Lege zuerst eine Position in der Futterverwaltung an.
       </p>

       <button
        type="button"
        onclick="NGT500.route('food')"
       >
        Futterbestand öffnen
       </button>
      </div>`
   }

   <p class="muted">
    Gewichtsintervall für Nachzuchten: 14 Tage.
   </p>
  </div>

  <div class="tc2AnimalEditorBlock">
   <h4>Notizen</h4>

   <textarea
    id="edNote"
    placeholder="Notizen"
   >${esc(animal.note||'')}</textarea>
  </div>

  <div class="tc2AnimalEditorActions">
   <button
    type="button"
    onclick="NGT500.route('offspring')"
   >
    Abbrechen
   </button>

   <button
    type="button"
    onclick="NGTOffspring.save('${jsArg(t)}',${index===undefined?'null':index},'${jsArg(animalId)}')"
   >
    Speichern
   </button>
  </div>
 </section>`;
}

function openEditor(t){
 const target=document.querySelector(
  '.tc2OffspringPage, .tc2AnimalsPage, .tc2PageCard'
 );

 if(!target)return;

 target.insertAdjacentHTML(
  'afterbegin',
  editor(t)
 );

 window.scrollTo({
  top:0,
  behavior:'smooth'
 });
}

function inputValue(id){
 const element=document.getElementById(id);

 return element
  ?text(element.value)
  :'';
}

function save(t,index,animalId){
 const existing=index===null
  ?{}
  :animalId
   ?NGTStore.getAnimalById(animalId)
   :NGTStore.animal(t,index);
 const old=existing||{};

 const interval=Math.max(
  1,
  Number(
   inputValue('edFeedInterval')||
   7
  )
 );

 const selectedId=inputValue(
  'edFoodInventoryId'
 );

 const selectedFood=foodById(
  selectedId
 );

 let feeder='';
 let feederId='';
 let feederCategory='';
 let feederCondition='';
 let feederType='';
 let feederSize='';
 let feederUnit='';

 if(selectedFood){
  feeder=foodLabel(selectedFood);
  feederId=selectedFood.id;
  feederCategory=selectedFood.category;
  feederCondition=selectedFood.condition;
  feederType=selectedFood.itemName;
  feederSize=selectedFood.variant;
  feederUnit=selectedFood.unit;

 }else if(
  selectedId.startsWith('legacy:')
 ){
  feeder=selectedId.slice(7);
  feederId=text(
   old.defaultFeederId||
   old.foodInventoryId
  );

  feederCategory=text(
   old.defaultFeederCategory
  );

  feederCondition=text(
   old.defaultFeederCondition||
   old.defaultFeederState
  );

  feederType=text(
   old.defaultFeederType
  );

  feederSize=text(
   old.defaultFeederSize
  );

  feederUnit=text(
   old.defaultFeederUnit
  );
 }

 const birth=inputValue('edBirth');
 const clutch=inputValue('edClutch');
 const father=inputValue('edFather');
 const mother=inputValue('edMother');
 const salePrice=inputValue('edBuy');

 const animal={
  ...old,

  animalGroup:
   inputValue('edAnimalGroup')||
   old.animalGroup||
   'Unsortiert',

  genus:
   inputValue('edGenus')||
   'Ohne Gattung',

  species:
   inputValue('edSpecies'),

  name:
   inputValue('edName'),

  morph:
   inputValue('edMorph'),

  weight:
   inputValue('edWeight'),

  origin:'Nachzucht',
  originType:'Nachzucht',

  birth:birth,
  birthDate:birth,

  clutchId:clutch,
  clutch:clutch,

  father:father,
  vater:father,
  sire:father,

  mother:mother,
  mutter:mother,
  dam:mother,

  feedIntervalDays:interval,
  feedingInterval:interval,
  feedInterval:interval,
  weightIntervalDays:14,

  buyPrice:salePrice,
  salePrice:salePrice,

  sex:
   inputValue('edSex')||
   'Unbestimmt',

  status:
   inputValue('edStatus')||
   'Nachzucht',

  collection:'offspring',

  defaultFeederId:feederId,
  foodInventoryId:feederId,
  defaultFeeder:feeder,
  defaultFeederCategory:feederCategory,
  defaultFeederCondition:feederCondition,
  defaultFeederState:feederCondition,
  defaultFeederType:feederType,
  defaultFeederSize:feederSize,
  defaultFeederUnit:feederUnit,

  futterStandard:feeder,
  standardFeed:feeder,

  note:
   inputValue('edNote')
 };

 animal.feeds=Array.isArray(animal.feeds)
  ?animal.feeds
  :[];

 animal.sheds=Array.isArray(animal.sheds)
  ?animal.sheds
  :[];

 animal.weights=Array.isArray(animal.weights)
  ?animal.weights
  :[];

 animal.photos=Array.isArray(animal.photos)
  ?animal.photos
  :[];

 animal.health=Array.isArray(animal.health)
  ?animal.health
  :[];

 if(index===null){
  NGTStore.addAnimal(
   t,
   animal
  );
 }else{
  if(animalId){
   NGTStore.updateAnimalById(
    animalId,
    animal
   );
  }else{
   NGTStore.updateAnimal(
    t,
    index,
    animal
   );
  }
 }

 NGT500.route('offspring',{
  group:animal.animalGroup,
  genus:animal.genus
 });
}

async function remove(t,index){
 if(!await NGT500.confirmAction(
  'Nachzucht wirklich löschen?',
  {
   title:'Nachzucht löschen',
   confirmText:'Nachzucht löschen',
   danger:true
  }
 )){
  return;
 }

 const animal=NGTStore.animal(t,index)||{};

 NGTStore.deleteAnimalById(
  NGTStore.animalId(animal)
 );

 NGT500.route('offspring',{
  group:
   animal.animalGroup||
   'Unsortiert',

  genus:
   animal.genus||
   'Ohne Gattung'
 });
}

window.NGTOffspring={
 openEditor:openEditor,
 save:save,
 remove:remove
};

NGT500.register('offspring',{
 render:render
});

})();
