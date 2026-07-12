(function(){
'use strict';

function esc(value){
 return NGT500.esc(value||'');
}

function jsArg(value){
 return String(value||'')
  .replace(/\\/g,'\\\\')
  .replace(/'/g,"\\'");
}

function text(value){
 return String(value==null?'':value).trim();
}

function positiveInteger(value){
 const number=Number(value);

 if(
  Number.isFinite(number)&&
  number>=1
 ){
  return Math.round(number);
 }

 return null;
}

function isOffspringAnimal(animal){
 if(
  window.NGTIdManager&&
  NGTIdManager.isOffspring
 ){
  return NGTIdManager.isOffspring(animal);
 }

 return (
  String((animal&&animal.status)||'').toLowerCase()==='nachzucht'||
  String((animal&&animal.collection)||'').toLowerCase()==='offspring'||
  String((animal&&animal.collection)||'').toLowerCase()==='nachzuchten'
 );
}

function statusOptions(current){
 return [
  'Bestand',
  'Verkauft',
  'Abgegeben',
  'Verstorben',
  'Archiv'
 ].map(function(status){
  return `<option ${current===status?'selected':''}>${status}</option>`;
 }).join('');
}

function photoSrc(photo,preferThumb){
 if(!photo){
  return '';
 }

 if(
  window.NGTPhotoStorage&&
  NGTPhotoStorage.src
 ){
  return NGTPhotoStorage.src(
   photo,
   preferThumb
  );
 }

 if(
  preferThumb&&
  (
   photo.thumbUrl||
   photo.thumbnailUrl
  )
 ){
  return (
   photo.thumbUrl||
   photo.thumbnailUrl
  );
 }

 return (
  photo.url||
  photo.thumbUrl||
  photo.thumbnailUrl||
  photo.data||
  ''
 );
}

function isUsablePhoto(photo){
 return !!photoSrc(photo,true);
}

function coverPhoto(animal){
 const photos=(
  animal&&
  Array.isArray(animal.photos)
   ?animal.photos
   :[]
 ).filter(isUsablePhoto);

 return (
  photos.find(function(photo){
   return photo.cover;
  })||
  photos[0]||
  null
 );
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

 item.id=
  item.id||
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

 item.label=
  text(item.label)||
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

   return foodLabel(a).localeCompare(
    foodLabel(b),
    'de'
   );
  });
}

function foodLabel(item){
 return (
  [
   item.condition,
   item.itemName,
   item.variant
  ].filter(Boolean).join(' ')||
  item.label||
  item.name||
  'Unbenannt'
 );
}

function foodMeta(item){
 return [
  item.category,
  Number(item.qty||0)+' '+(item.unit||'Stück')
 ].filter(Boolean).join(' · ');
}

function foodSelectOptions(animal){
 const items=normalizedFoodInventory();

 const selectedId=text(
  animal.defaultFeederId||
  animal.foodInventoryId||
  ''
 );

 const legacyLabel=text(
  animal.defaultFeeder||
  animal.futterStandard||
  animal.standardFeed||
  ''
 );

 let options=
  '<option value="">Kein Standardfutter</option>';

 let selectedFound=false;

 items.forEach(function(item){
  const selected=
   (
    selectedId&&
    String(item.id)===String(selectedId)
   )||
   (
    !selectedId&&
    legacyLabel&&
    foodLabel(item)===legacyLabel
   );

  if(selected){
   selectedFound=true;
  }

  options+=`
   <option
    value="${esc(item.id)}"
    ${selected?'selected':''}
   >
    ${esc(foodLabel(item))} · ${esc(foodMeta(item))}
   </option>
  `;
 });

 if(
  legacyLabel&&
  !selectedFound
 ){
  options+=`
   <option
    value="legacy:${esc(legacyLabel)}"
    selected
   >
    ${esc(legacyLabel)} · bisherige Auswahl
   </option>
  `;
 }

 return options;
}

function selectedFoodItem(id){
 if(
  !id||
  String(id).startsWith('legacy:')
 ){
  return null;
 }

 return normalizedFoodInventory().find(function(item){
  return String(item.id)===String(id);
 })||null;
}

function hknDraft(){
 try{
  return JSON.parse(
   sessionStorage.getItem(
    'terracontrol_hkn_import_v1'
   )||'null'
  );
 }catch(error){
  return null;
 }
}

function hknInfo(){
 const hkn=hknDraft();

 if(!hkn){
  return '';
 }

 return `
  <div class="subcard ok tc2FormCard">
   <h3>📄 Herkunftsnachweis übernommen</h3>

   <p class="muted">
    Das Foto wurde übernommen und beim Speichern
    dem Tier zugeordnet.
   </p>

   ${
    hkn.data&&
    String(hkn.data).startsWith('data:image')
     ?`<img class="photo" src="${hkn.data}">`
     :''
   }

   <p>
    <b>Datei:</b><br>
    ${esc(hkn.name||'Herkunftsnachweis')}
   </p>
  </div>
 `;
}

function allActive(){
 const all=
  NGTStore.allAnimals
   ?NGTStore.allAnimals()
   :[];

 return all.filter(function(row){
  return (
   ![
    'Archiv',
    'Verkauft',
    'Abgegeben',
    'Verstorben'
   ].includes(row.a.status)&&
   !isOffspringAnimal(row.a)
  );
 });
}

function countBy(rows,keyFunction){
 const map={};

 rows.forEach(function(row){
  const key=
   keyFunction(row)||
   'Unsortiert';

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
  return `
   <button
    onclick="NGT500.route('animals',{group:'${jsArg(args.group)}'})"
   >
    ‹ ${esc(args.group)}
   </button>
  `;
 }

 return `
  <button onclick="NGT500.route('dashboard')">
   ‹ Start
  </button>
 `;
}

function folderGrid(items,onclick){
 if(!items.length){
  return `
   <div class="subcard tc2EmptyState">
    <h3>Noch keine Einträge</h3>

    <p class="muted">
     Lege dein erstes Tier über die Startseite an.
    </p>
   </div>
  `;
 }

 return `
  <div class="tc2TaxGrid">
   ${items.map(function(item){
    return `
     <button
      class="tc2TaxFolder"
      onclick="${onclick(item)}"
     >
      <span>●●●</span>
      <b>${esc(item.label)}</b>

      <small>
       ${item.count}
       ${item.count===1?'Tier':'Tiere'}
      </small>
     </button>
    `;
   }).join('')}
  </div>
 `;
}

function animalIconGrid(rows){
 if(!rows.length){
  return `
   <div class="subcard tc2EmptyState">
    <h3>Noch keine Tiere</h3>

    <p class="muted">
     In dieser Gattung ist noch kein Tier gespeichert.
    </p>
   </div>
  `;
 }

 return `
  <div class="tc2TaxAnimalGrid">
   ${rows.map(function(row){
    const animal=row.a;
    const photo=coverPhoto(animal);
    const source=photoSrc(photo,true);

    const image=source
     ?`
      <img
       src="${esc(source)}"
       alt="${esc(animal.name||'Tierfoto')}"
       loading="lazy"
      >
     `
     :'<span>📷</span>';

    const taxonomy=[
     animal.genus,
     animal.species
    ].filter(Boolean).join(' ');

    return `
     <button
      class="tc2TaxAnimal"
      onclick="NGT500.route('profile',{t:'${jsArg(row.t)}',i:${row.i}})"
     >
      <div>${image}</div>
      <b>${esc(animal.publicId||animal.displayId||'')}</b>
      <strong>${esc(animal.name||'Unbenannt')}</strong>
      <small>${esc(taxonomy||animal.animalGroup||'')}</small>
     </button>
    `;
   }).join('')}
  </div>
 `;
}

function render(args){
 args=args||{};

 const t=args.t||'';
 const group=args.group||'';
 const genus=args.genus||'';
 const edit=args.edit;
 const hkn=!!args.hkn;

 if(
  hkn||
  edit!==undefined
 ){
  return `
   <div class="card tc2PageCard tc2AnimalsPage">
    <div class="tc2PageHead">
     <div>
      <h2>
       ${edit!==undefined?'Tier bearbeiten':'Tier anlegen'}
      </h2>

      <p class="muted">
       Tierdaten und individuelle Pflegeintervalle.
      </p>
     </div>
    </div>

    ${hkn?hknInfo()+editor(t,undefined,true):''}
    ${edit!==undefined?editor(t,Number(edit)):''}
   </div>
  `;
 }

 const all=allActive();

 if(!group){
  const groups=countBy(
   all,
   function(row){
    return row.a.animalGroup||'Unsortiert';
   }
  );

  return `
   <div class="card tc2PageCard tc2AnimalsPage">
    <div class="tc2PageHead">
     <div>
      <h2>Bestand</h2>

      <p class="muted">
       Dynamische Tiergruppen aus deinem Bestand.
      </p>
     </div>
    </div>

    ${folderGrid(
     groups,
     function(item){
      return (
       "NGT500.route('animals',{group:'"+
       jsArg(item.label)+
       "'})"
      );
     }
    )}
   </div>
  `;
 }

 const groupRows=all.filter(function(row){
  return (
   String(row.a.animalGroup||'Unsortiert')===
   String(group)
  );
 });

 if(
  group&&
  !genus
 ){
  const genusRows=countBy(
   groupRows,
   function(row){
    return row.a.genus||'Ohne Gattung';
   }
  );

  return `
   <div class="card tc2PageCard tc2AnimalsPage">
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
      return (
       "NGT500.route('animals',{group:'"+
       jsArg(group)+
       "',genus:'"+
       jsArg(item.label)+
       "'})"
      );
     }
    )}
   </div>
  `;
 }

 const animalRows=groupRows.filter(function(row){
  return (
   String(row.a.genus||'Ohne Gattung')===
   String(genus)
  );
 });

 return `
  <div class="card tc2PageCard tc2AnimalsPage">
   <div class="tc2PageHead">
    <div>
     ${backButton({
      group:group,
      genus:genus
     })}

     <h2>${esc(genus)}</h2>

     <p class="muted">
      ${esc(group)} · ${animalRows.length}
      ${animalRows.length===1?'Tier':'Tiere'}
     </p>
    </div>
   </div>

   ${animalIconGrid(animalRows)}
  </div>
 `;
}

function existingEnabled(
 animal,
 explicitKey,
 intervalKeys,
 legacyFallback
){
 if(animal[explicitKey]===false){
  return false;
 }

 if(animal[explicitKey]===true){
  return true;
 }

 for(const key of intervalKeys){
  if(
   animal[key]!==undefined&&
   animal[key]!==null&&
   animal[key]!==''
  ){
   return Number(animal[key])>0;
  }
 }

 return legacyFallback;
}

function existingInterval(
 animal,
 keys,
 fallback
){
 for(const key of keys){
  const value=positiveInteger(animal[key]);

  if(value!==null){
   return value;
  }
 }

 return fallback;
}

function intervalToggle(
 id,
 title,
 description,
 enabled,
 value
){
 return `
  <div class="tc2AnimalInterval">
   <label class="tc2AnimalIntervalToggle">
    <input
     id="${id}Enabled"
     type="checkbox"
     ${enabled?'checked':''}
     onchange="NGTAnimals.updateIntervalFields()"
    >

    <span>
     <b>${esc(title)}</b>
     <small>${esc(description)}</small>
    </span>
   </label>

   <label
    id="${id}Wrap"
    class="tc2AnimalIntervalDays"
   >
    <span>Intervall in Tagen</span>

    <input
     id="${id}"
     type="number"
     min="1"
     step="1"
     inputmode="numeric"
     value="${esc(value||'')}"
     ${enabled?'':'disabled'}
    >
   </label>
  </div>
 `;
}

function editor(t,i,fromHkn){
 const animal=
  i!==undefined
   ?NGTStore.animal(t,i)
   :{};

 const feedEnabled=existingEnabled(
  animal,
  'feedIntervalEnabled',
  [
   'feedIntervalDays',
   'feedingInterval',
   'feedInterval'
  ],
  false
 );

 const feedInterval=existingInterval(
  animal,
  [
   'feedIntervalDays',
   'feedingInterval',
   'feedInterval'
  ],
  null
 );

 const weightEnabled=existingEnabled(
  animal,
  'weightIntervalEnabled',
  [
   'weightIntervalDays',
   'weightInterval'
  ],
  false
 );

 const weightInterval=existingInterval(
  animal,
  [
   'weightIntervalDays',
   'weightInterval'
  ],
  null
 );

 const hasFood=
  normalizedFoodInventory().length>0;

 setTimeout(
  updateIntervalFields,
  0
 );

 return `
  <section class="tc2AnimalEditor">
   <div class="tc2AnimalEditorHead">
    <div>
     <h3>
      ${
       i!==undefined
        ?'Tier bearbeiten'
        :(fromHkn?'Tier aus HKN anlegen':'Tier anlegen')
      }
     </h3>

     <p>
      Jedes Tier erhält eigene, jederzeit änderbare
      Pflegeintervalle.
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
      <span>Name</span>
      <input id="edName" value="${esc(animal.name||'')}">
     </label>

     <label>
      <span>Morph</span>
      <input id="edMorph" value="${esc(animal.morph||'')}">
     </label>

     <label>
      <span>Aktuelles Gewicht in g</span>

      <input
       id="edWeight"
       type="number"
       min="0"
       step="0.1"
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

      <input
       id="edOrigin"
       value="${esc(animal.origin||animal.originType||'')}"
      >
     </label>

     <label>
      <span>Schlupfdatum</span>

      <input
       id="edBirth"
       type="date"
       value="${esc(animal.birth||animal.birthDate||'')}"
      >
     </label>

     <label>
      <span>Vatertier</span>

      <input
       id="edFather"
       value="${esc(animal.father||animal.vater||animal.sire||'')}"
      >
     </label>

     <label>
      <span>Muttertier</span>

      <input
       id="edMother"
       value="${esc(animal.mother||animal.mutter||animal.dam||'')}"
      >
     </label>

     <label>
      <span>Kaufpreis</span>

      <input
       id="edBuy"
       type="number"
       min="0"
       step="0.01"
       value="${esc(animal.buyPrice||'')}"
      >
     </label>
    </div>
   </div>

   <div class="tc2AnimalEditorBlock">
    <h4>Fütterung</h4>

    ${intervalToggle(
     'edFeedInterval',
     'Fütterungsintervall verwenden',
     'Deaktivieren, wenn für dieses Tier keine Fütterungserinnerung gewünscht ist.',
     feedEnabled,
     feedInterval
    )}

    <div class="tc2AnimalFields">
     <label>
      <span>Standardfutter aus Bestand</span>

      <select id="edFoodInventoryId">
       ${foodSelectOptions(animal)}
      </select>
     </label>
    </div>

    ${
     hasFood
      ?`
       <p>
        Das Standardfutter wird direkt mit einer Position
        aus dem dynamischen Futterbestand verknüpft.
       </p>
      `
      :`
       <p class="muted">
        Noch kein Futterbestand vorhanden.
        Lege zuerst unter „Futterbestand“ eine Position an.
       </p>
      `
    }
   </div>

   <div class="tc2AnimalEditorBlock">
    <h4>Gewicht</h4>

    ${intervalToggle(
     'edWeightInterval',
     'Gewichtsintervall verwenden',
     'Deaktivieren, wenn für dieses Tier keine Gewichtserinnerung gewünscht ist.',
     weightEnabled,
     weightInterval
    )}
   </div>

   <div class="tc2AnimalEditorBlock">
    <h4>Notizen</h4>

    <textarea
     id="edNote"
     placeholder="Notizen"
    >${esc(animal.note||'')}</textarea>
   </div>

   <div class="tc2AnimalEditorActions">
    <button onclick="NGT500.route('dashboard')">
     Abbrechen
    </button>

    <button
     onclick="NGTAnimals.save('${jsArg(t)}',${i===undefined?'null':i})"
    >
     Speichern
    </button>
   </div>
  </section>
 `;
}

function setIntervalFieldState(
 checkboxId,
 inputId,
 wrapId
){
 const checkbox=
  document.getElementById(checkboxId);

 const input=
  document.getElementById(inputId);

 const wrap=
  document.getElementById(wrapId);

 if(
  !checkbox||
  !input
 ){
  return;
 }

 input.disabled=!checkbox.checked;

 if(wrap){
  wrap.classList.toggle(
   'is-disabled',
   !checkbox.checked
  );
 }
}

function updateIntervalFields(){
 setIntervalFieldState(
  'edFeedIntervalEnabled',
  'edFeedInterval',
  'edFeedIntervalWrap'
 );

 setIntervalFieldState(
  'edWeightIntervalEnabled',
  'edWeightInterval',
  'edWeightIntervalWrap'
 );
}

function readInterval(
 checkboxId,
 inputId,
 label
){
 const checkbox=
  document.getElementById(checkboxId);

 const input=
  document.getElementById(inputId);

 const enabled=
  !!(
   checkbox&&
   checkbox.checked
  );

 if(!enabled){
  return {
   enabled:false,
   days:null
  };
 }

 const days=positiveInteger(
  input&&input.value
 );

 if(days===null){
  throw new Error(
   label+
   ' muss mindestens 1 Tag betragen.'
  );
 }

 return {
  enabled:true,
  days:days
 };
}

function openEditor(t){
 const target=document.querySelector(
  '.tc2AnimalsPage, .card'
 );

 if(!target){
  return;
 }

 target.insertAdjacentHTML(
  'afterbegin',
  editor(t)
 );

 updateIntervalFields();
}

function save(t,i){
 const old=
  i===null
   ?{}
   :NGTStore.animal(t,i);

 let feedCare;
 let weightCare;

 try{
  feedCare=readInterval(
   'edFeedIntervalEnabled',
   'edFeedInterval',
   'Das Fütterungsintervall'
  );

  weightCare=readInterval(
   'edWeightIntervalEnabled',
   'edWeightInterval',
   'Das Gewichtsintervall'
  );

 }catch(error){
  if(
   window.NGT500&&
   NGT500.toast
  ){
   NGT500.toast(
    error.message,
    'danger'
   );
  }else{
   alert(error.message);
  }

  return;
 }

 const selectedId=text(
  document.getElementById(
   'edFoodInventoryId'
  ).value
 );

 const selectedFood=
  selectedFoodItem(selectedId);

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

 const hkn=hknDraft();

 const noteBase=
  document.getElementById(
   'edNote'
  ).value.trim();

 const note=
  hkn&&
  i===null
   ?(
     noteBase
      ?noteBase+'\n\n'
      :''
    )+
    'HKN importiert: '+
    (hkn.name||'Herkunftsnachweis')
   :noteBase;

 const animal={
  ...old,

  animalGroup:
   document.getElementById(
    'edAnimalGroup'
   ).value.trim()||
   old.animalGroup||
   'Unsortiert',

  genus:
   document.getElementById(
    'edGenus'
   ).value.trim()||
   'Ohne Gattung',

  species:
   document.getElementById(
    'edSpecies'
   ).value.trim(),

  name:
   document.getElementById(
    'edName'
   ).value.trim(),

  morph:
   document.getElementById(
    'edMorph'
   ).value.trim(),

  weight:
   document.getElementById(
    'edWeight'
   ).value,

  origin:
   document.getElementById(
    'edOrigin'
   ).value.trim(),

  originType:
   document.getElementById(
    'edOrigin'
   ).value.trim(),

  birth:
   document.getElementById(
    'edBirth'
   ).value,

  father:
   document.getElementById(
    'edFather'
   ).value.trim(),

  vater:
   document.getElementById(
    'edFather'
   ).value.trim(),

  sire:
   document.getElementById(
    'edFather'
   ).value.trim(),

  mother:
   document.getElementById(
    'edMother'
   ).value.trim(),

  mutter:
   document.getElementById(
    'edMother'
   ).value.trim(),

  dam:
   document.getElementById(
    'edMother'
   ).value.trim(),

  feedIntervalEnabled:
   feedCare.enabled,

  feedIntervalDays:
   feedCare.enabled
    ?feedCare.days
    :null,

  feedingInterval:
   feedCare.enabled
    ?feedCare.days
    :null,

  feedInterval:
   feedCare.enabled
    ?feedCare.days
    :null,

  weightIntervalEnabled:
   weightCare.enabled,

  weightIntervalDays:
   weightCare.enabled
    ?weightCare.days
    :null,

  weightInterval:
   weightCare.enabled
    ?weightCare.days
    :null,

  buyPrice:
   document.getElementById(
    'edBuy'
   ).value,

  sex:
   document.getElementById(
    'edSex'
   ).value,

  status:
   document.getElementById(
    'edStatus'
   ).value,

  collection:'stock',

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

  note:note
 };

 animal.feeds=
  animal.feeds||[];

 animal.sheds=
  animal.sheds||[];

 animal.weights=
  animal.weights||[];

 animal.photos=
  animal.photos||[];

 if(
  hkn&&
  hkn.data&&
  String(hkn.data).startsWith('data:image')&&
  i===null
 ){
  animal.photos.unshift({
   date:NGT500.today(),
   type:'Herkunftsnachweis',
   note:hkn.name||'Herkunftsnachweis',
   data:hkn.data,
   cover:false
  });
 }

 if(i===null){
  NGTStore.addAnimal(
   t,
   animal
  );

  try{
   sessionStorage.removeItem(
    'terracontrol_hkn_import_v1'
   );
  }catch(error){
   console.warn(
    'HKN-Zwischenspeicher konnte nicht entfernt werden.',
    error
   );
  }

 }else{
  NGTStore.updateAnimal(
   t,
   i,
   animal
  );
 }

 NGT500.route(
  'animals',
  {
   group:animal.animalGroup,
   genus:animal.genus
  }
 );
}

function remove(t,i){
 if(
  !confirm(
   'Tier wirklich löschen?'
  )
 ){
  return;
 }

 const animal=
  NGTStore.animal(t,i)||
  {};

 NGTStore.deleteAnimal(
  t,
  i
 );

 NGT500.route(
  'animals',
  {
   group:
    animal.animalGroup||
    'Unsortiert',

   genus:
    animal.genus||
    'Ohne Gattung'
  }
 );
}

window.NGTAnimals={
 openEditor:openEditor,
 save:save,
 remove:remove,
 updateIntervalFields:
  updateIntervalFields
};

NGT500.register(
 'animals',
 {
  render:render
 }
);

})();