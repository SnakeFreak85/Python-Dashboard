(function(){
'use strict';

const P=window.NGTOffspringInternal;

if(!P){
 throw new Error('NGTOffspringInternal fehlt');
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
  P.normalizedFoodInventory().length>0;

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
      value="${P.esc(animal.animalGroup||'')}"
     >
    </label>

    <label>
     <span>Gattung</span>

     <input
      id="edGenus"
      placeholder="z. B. Python"
      value="${P.esc(animal.genus||'')}"
     >
    </label>

    <label>
     <span>Art</span>

     <input
      id="edSpecies"
      placeholder="z. B. regius"
      value="${P.esc(animal.species||'')}"
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
      value="${P.esc(animal.name||'')}"
     >
    </label>

    <label>
     <span>Morph</span>

     <input
      id="edMorph"
      value="${P.esc(animal.morph||'')}"
     >
    </label>

    <label>
     <span>Gewicht in g</span>

     <input
      id="edWeight"
      type="number"
      min="0"
      step="any"
      value="${P.esc(animal.weight||'')}"
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
      ${P.statusOptions(
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
      value="${P.esc(animal.birth||animal.birthDate||'')}"
     >
    </label>

    <label>
     <span>Gelege / Wurf</span>

     <input
      id="edClutch"
      placeholder="z. B. CL-001"
      value="${P.esc(animal.clutchId||animal.clutch||'')}"
     >
    </label>

    <label>
     <span>Vatertier aus eigenem Bestand</span>

     <select id="edFatherId">
      ${P.parentOptions(animal,'father',animalId)}
     </select>
    </label>

    <label>
     <span>Muttertier aus eigenem Bestand</span>

     <select id="edMotherId">
      ${P.parentOptions(animal,'mother',animalId)}
     </select>
    </label>

    <label>
      <span>Vatertier außerhalb des Bestands</span>

     <input
      id="edFather"
      placeholder="optional, z. B. KP-001"
      value="${
       P.parentId(animal,'father')
        ?''
        :P.esc(animal.father||animal.vater||animal.sire||'')
      }"
     >
    </label>

    <label>
      <span>Muttertier außerhalb des Bestands</span>

     <input
      id="edMother"
      placeholder="optional, z. B. KP-002"
      value="${
       P.parentId(animal,'mother')
        ?''
        :P.esc(animal.mother||animal.mutter||animal.dam||'')
      }"
     >
    </label>

    <label>
     <span>Verkaufspreis</span>

     <input
      id="edBuy"
      type="number"
      min="0"
      step="any"
      value="${P.esc(animal.salePrice||animal.buyPrice||'')}"
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
      value="${P.esc(feedInterval)}"
     >
    </label>

    <label>
     <span>Futter aus Bestand</span>

     <select id="edFoodInventoryId">
      ${P.foodOptions(animal)}
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
   >${P.esc(animal.note||'')}</textarea>
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
    onclick="NGTOffspring.save('${P.jsArg(t)}',${index===undefined?'null':index},'${P.jsArg(animalId)}')"
   >
    Speichern
   </button>
  </div>
 </section>`;
}

function inputValue(id){
 const element=document.getElementById(id);

 return element
  ?P.text(element.value)
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

 const selectedFood=P.foodById(
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
  feeder=P.foodLabel(selectedFood);
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
  feederId=P.text(
   old.defaultFeederId||
   old.foodInventoryId
  );

  feederCategory=P.text(
   old.defaultFeederCategory
  );

  feederCondition=P.text(
   old.defaultFeederCondition||
   old.defaultFeederState
  );

  feederType=P.text(
   old.defaultFeederType
  );

  feederSize=P.text(
   old.defaultFeederSize
  );

  feederUnit=P.text(
   old.defaultFeederUnit
  );
 }

 const birth=inputValue('edBirth');
 const clutch=inputValue('edClutch');
 const fatherId=inputValue('edFatherId');
 const motherId=inputValue('edMotherId');
 const fatherAnimal=P.parentById(fatherId);
 const motherAnimal=P.parentById(motherId);
 const father=fatherAnimal
  ?P.parentStoredLabel(fatherAnimal)
  :inputValue('edFather')||
   (
    fatherId
     ?P.text(old.father||old.vater||old.sire)
     :''
   );
 const mother=motherAnimal
  ?P.parentStoredLabel(motherAnimal)
  :inputValue('edMother')||
   (
    motherId
     ?P.text(old.mother||old.mutter||old.dam)
     :''
   );
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
  fatherId:fatherId,
  vaterId:fatherId,
  sireId:fatherId,

  mother:mother,
  mutter:mother,
  dam:mother,
  motherId:motherId,
  mutterId:motherId,
  damId:motherId,

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

P.editor={
 render:editor,
 save:save
};

})();
