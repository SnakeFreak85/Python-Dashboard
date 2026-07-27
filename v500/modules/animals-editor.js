(function(){
'use strict';

const P=window.NGTAnimalsInternal;

if(!P||!P.food){
 throw new Error(
  'Animals-Abhängigkeit fehlt. '+
  'animals-core.js und animals-food.js müssen vor animals-editor.js geladen werden.'
 );
}

const esc=P.esc;
const jsArg=P.jsArg;
const text=P.text;
const positiveInteger=P.positiveInteger;
const statusOptions=P.statusOptions;
const normalizedFoodInventory=P.food.normalizedFoodInventory;
const foodLabel=P.food.foodLabel;
const foodSelectOptions=P.food.foodSelectOptions;
const selectedFoodItem=P.food.selectedFoodItem;

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
  <div class="tc2FormCard ok">
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
 const animalId=
  i!==undefined
   ?NGTStore.animalId(animal)
   :'';

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
     <label><span>Tiergruppe</span><input id="edAnimalGroup" placeholder="z. B. Pythons" value="${esc(animal.animalGroup||'')}"></label>
     <label><span>Gattung</span><input id="edGenus" placeholder="z. B. Python" value="${esc(animal.genus||'')}"></label>
     <label><span>Art</span><input id="edSpecies" placeholder="z. B. regius" value="${esc(animal.species||'')}"></label>
    </div>
   </div>

   <div class="tc2AnimalEditorBlock">
    <h4>Stammdaten</h4>

    <div class="tc2AnimalFields">
     <label><span>Name</span><input id="edName" value="${esc(animal.name||'')}"></label>
     <label><span>Morph</span><input id="edMorph" value="${esc(animal.morph||'')}"></label>
     <label><span>Aktuelles Gewicht in g</span><input id="edWeight" type="number" min="0" step="0.1" value="${esc(animal.weight||'')}"></label>
     <label>
      <span>Geschlecht</span>
      <select id="edSex">
       <option ${animal.sex==='Unbestimmt'?'selected':''}>Unbestimmt</option>
       <option ${animal.sex==='Männlich'?'selected':''}>Männlich</option>
       <option ${animal.sex==='Weiblich'?'selected':''}>Weiblich</option>
      </select>
     </label>
     <label><span>Status</span><select id="edStatus">${statusOptions(animal.status||'Bestand')}</select></label>
    </div>
   </div>

   <div class="tc2AnimalEditorBlock">
    <h4>Herkunft</h4>

    <div class="tc2AnimalFields">
     <label><span>Herkunft / ENZ / FNZ</span><input id="edOrigin" value="${esc(animal.origin||animal.originType||'')}"></label>
     <label><span>Schlupfdatum</span><input id="edBirth" type="date" value="${esc(animal.birth||animal.birthDate||'')}"></label>
     <label><span>Vatertier</span><input id="edFather" value="${esc(animal.father||animal.vater||animal.sire||'')}"></label>
     <label><span>Muttertier</span><input id="edMother" value="${esc(animal.mother||animal.mutter||animal.dam||'')}"></label>
     <label><span>Kaufpreis</span><input id="edBuy" type="number" min="0" step="0.01" value="${esc(animal.buyPrice||'')}"></label>
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
     <label><span>Standardfutter aus Bestand</span><select id="edFoodInventoryId">${foodSelectOptions(animal)}</select></label>
    </div>

    ${
     hasFood
      ?`<p>Das Standardfutter wird direkt mit einer Position aus dem dynamischen Futterbestand verknüpft.</p>`
      :`<p class="muted">Noch kein Futterbestand vorhanden. Lege zuerst unter „Futterbestand“ eine Position an.</p>`
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
    <textarea id="edNote" placeholder="Notizen">${esc(animal.note||'')}</textarea>
   </div>

   <div class="tc2AnimalEditorActions">
    <button onclick="NGT500.route('dashboard')">Abbrechen</button>
    <button onclick="NGTAnimals.save('${jsArg(t)}',${i===undefined?'null':i},'${jsArg(animalId)}')">Speichern</button>
   </div>
  </section>
 `;
}

function setIntervalFieldState(
 checkboxId,
 inputId,
 wrapId
){
 const checkbox=document.getElementById(checkboxId);
 const input=document.getElementById(inputId);
 const wrap=document.getElementById(wrapId);

 if(!checkbox||!input){
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
 const checkbox=document.getElementById(checkboxId);
 const input=document.getElementById(inputId);
 const enabled=!!(checkbox&&checkbox.checked);

 if(!enabled){
  return {enabled:false,days:null};
 }

 const days=positiveInteger(input&&input.value);

 if(days===null){
  throw new Error(
   label+
   ' muss mindestens 1 Tag betragen.'
  );
 }

 return {enabled:true,days:days};
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

function save(t,i,animalId){
 const existing=i===null
  ?{}
  :animalId
   ?NGTStore.getAnimalById(animalId)
   :NGTStore.animal(t,i);
 const old=existing||{};

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
  if(window.NGT500&&NGT500.toast){
   NGT500.toast(error.message,'danger');
  }else{
   console.error(error.message);
  }

  return;
 }

 const selectedId=text(
  document.getElementById('edFoodInventoryId').value
 );

 const selectedFood=selectedFoodItem(selectedId);

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
 }else if(selectedId.startsWith('legacy:')){
  feeder=selectedId.slice(7);
  feederId=text(old.defaultFeederId||old.foodInventoryId);
  feederCategory=text(old.defaultFeederCategory);
  feederCondition=text(old.defaultFeederCondition||old.defaultFeederState);
  feederType=text(old.defaultFeederType);
  feederSize=text(old.defaultFeederSize);
  feederUnit=text(old.defaultFeederUnit);
 }

 const hkn=hknDraft();
 const noteBase=document.getElementById('edNote').value.trim();

 const note=
  hkn&&i===null
   ?(noteBase?noteBase+'\n\n':'')+
    'HKN importiert: '+
    (hkn.name||'Herkunftsnachweis')
   :noteBase;

 const animal={
  ...old,
  animalGroup:document.getElementById('edAnimalGroup').value.trim()||old.animalGroup||'Unsortiert',
  genus:document.getElementById('edGenus').value.trim()||'Ohne Gattung',
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
  feedIntervalEnabled:feedCare.enabled,
  feedIntervalDays:feedCare.enabled?feedCare.days:null,
  feedingInterval:feedCare.enabled?feedCare.days:null,
  feedInterval:feedCare.enabled?feedCare.days:null,
  weightIntervalEnabled:weightCare.enabled,
  weightIntervalDays:weightCare.enabled?weightCare.days:null,
  weightInterval:weightCare.enabled?weightCare.days:null,
  buyPrice:document.getElementById('edBuy').value,
  sex:document.getElementById('edSex').value,
  status:document.getElementById('edStatus').value,
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

 animal.feeds=animal.feeds||[];
 animal.sheds=animal.sheds||[];
 animal.weights=animal.weights||[];
 animal.photos=animal.photos||[];

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
  NGTStore.addAnimal(t,animal);

  try{
   sessionStorage.removeItem('terracontrol_hkn_import_v1');
  }catch(error){
   console.warn(
    'HKN-Zwischenspeicher konnte nicht entfernt werden.',
    error
   );
  }
 }else{
  if(animalId){
   NGTStore.updateAnimalById(
    animalId,
    animal
   );
  }else{
   NGTStore.updateAnimal(t,i,animal);
  }
 }

 NGT500.route(
  'animals',
  {group:animal.animalGroup,genus:animal.genus}
 );
}

async function remove(t,i){
 if(!await NGT500.confirmAction(
  'Tier wirklich löschen?',
  {
   title:'Tier löschen',
   confirmText:'Tier löschen',
   danger:true
  }
 )){
  return;
 }

 const animal=NGTStore.animal(t,i)||{};

 NGTStore.deleteAnimalById(
  NGTStore.animalId(animal)
 );

 NGT500.route(
  'animals',
  {
   group:animal.animalGroup||'Unsortiert',
   genus:animal.genus||'Ohne Gattung'
  }
 );
}

P.editor={
 hknInfo:hknInfo,
 render:editor,
 openEditor:openEditor,
 save:save,
 remove:remove,
 updateIntervalFields:updateIntervalFields
};

})();
