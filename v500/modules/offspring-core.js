(function(){
'use strict';

const P=window.NGTOffspringInternal=
 window.NGTOffspringInternal||{};

P.esc=function(value){
 return NGT500.esc(value||'');
};

P.text=function(value){
 return String(value==null?'':value).trim();
};

P.jsArg=function(value){
 return String(value||'')
  .replace(/\\/g,'\\\\')
  .replace(/'/g,"\\'");
};

P.statusOptions=function(current){
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
};

P.isInactiveStatus=function(status){
 return AnimalEngine.isInactiveStatus(
  status
 );
};

P.isOffspringAnimal=function(animal){
 return AnimalEngine.isOffspringAnimal(
  animal
 );
};

P.allOffspring=function(){
 if(NGTStore.allOffspring){
  return NGTStore.allOffspring().filter(function(row){
   return !P.isInactiveStatus(row.a.status);
  });
 }

 const all=NGTStore.allAnimals
  ?NGTStore.allAnimals()
  :[];

 return all.filter(function(row){
  return !P.isInactiveStatus(row.a.status)&&
   P.isOffspringAnimal(row.a);
 });
};

P.parentStoredLabel=function(animal){
 animal=animal||{};

 const publicId=P.text(
  animal.publicId||
  animal.displayId
 );
 const name=P.text(
  AnimalEngine.getDisplayName(animal)
 );

 if(publicId&&name&&publicId!==name){
 return publicId+' · '+name;
 }

 return publicId||name||'Unbenanntes Tier';
};

P.parentOptionLabel=function(animal){
 animal=animal||{};

 const label=P.parentStoredLabel(animal);
 const sex=P.text(animal.sex);

 return sex
   ?label+' · '+sex
  :label;
};

P.parentCandidates=function(currentAnimalId){
 const currentId=P.text(currentAnimalId);
 const rows=NGTStore.allAnimals
  ?NGTStore.allAnimals()
  :[];

 return rows
  .filter(function(row){
   const animal=row.a||{};
   const id=NGTStore.animalId(animal);

   return (
    (!currentId||id!==currentId)&&
    !P.isOffspringAnimal(animal)&&
    AnimalEngine.isActiveAnimal(animal)
   );
  })
  .sort(function(a,b){
   return P.parentOptionLabel(a.a)
    .localeCompare(
     P.parentOptionLabel(b.a),
     'de'
    );
  });
};

P.parentId=function(animal,role){
 animal=animal||{};

 if(role==='father'){
  return P.text(
   animal.fatherId||
   animal.vaterId||
   animal.sireId
  );
 }

 return P.text(
  animal.motherId||
  animal.mutterId||
  animal.damId
 );
};

P.parentOptions=function(animal,role,currentAnimalId){
 const selectedId=P.parentId(animal,role);
 const candidates=P.parentCandidates(currentAnimalId);
 const emptyLabel=role==='father'
  ?'Kein Vatertier ausgewählt'
  :'Kein Muttertier ausgewählt';
 let selectedFound=false;
 let options=`<option value="">${emptyLabel}</option>`;

 candidates.forEach(function(row){
  const id=NGTStore.animalId(row.a);
  const selected=id===selectedId;

  if(selected){
   selectedFound=true;
  }

  options+=`<option
   value="${P.esc(id)}"
   ${selected?'selected':''}
  >
   ${P.esc(P.parentOptionLabel(row.a))}
  </option>`;
 });

 if(selectedId&&!selectedFound){
  const selectedRow=NGTStore.findAnimalById
   ?NGTStore.findAnimalById(selectedId)
   :null;
  const legacyLabel=role==='father'
   ?animal.father||animal.vater||animal.sire
   :animal.mother||animal.mutter||animal.dam;

  options+=`<option
   value="${P.esc(selectedId)}"
   selected
  >
   ${P.esc(
    selectedRow
     ?P.parentOptionLabel(selectedRow.a)
     :legacyLabel||'Bisheriges Elterntier'
      )} · bisher zugeordnet
  </option>`;
 }

 return options;
};

P.parentById=function(id){
 const row=NGTStore.findAnimalById
  ?NGTStore.findAnimalById(P.text(id))
  :null;

 return row
  ?row.a
  :null;
};

P.photoSrc=function(photo,preferThumbnail){
 return AnimalEngine.photoSource(
  photo,
  preferThumbnail
 );
};

P.isUsablePhoto=function(photo){
 return !!P.photoSrc(photo,true);
};

P.coverPhoto=function(animal){
 return AnimalEngine.coverPhoto(
  animal
 );
};

P.foodInventory=function(){
 return NGTStore.foodInventory();
};

P.normalizedFoodInventory=function(){
 return FoodInventoryEngine.sortInventory(
  P.foodInventory()
 );
};

P.foodLabel=function(item){
 return item
  ?FoodInventoryEngine.itemLabel(item)
  :'';
};

P.foodMeta=function(item){
 return item
  ?FoodInventoryEngine.meta(item)
  :'';
};

P.foodById=function(id){
 return FoodInventoryEngine.findById(
  P.foodInventory(),
  id
 );
};

P.defaultFoodId=function(animal){
 const stored=P.text(
  animal.defaultFeederId||
  animal.foodInventoryId||
  ''
 );

 if(stored&&P.foodById(stored)){
  return stored;
 }

 const legacy=P.text(
  animal.defaultFeeder||
  animal.futterStandard||
  animal.standardFeed||
  ''
 );

 if(!legacy)return '';

 const match=P.normalizedFoodInventory().find(function(item){
  return P.foodLabel(item)===legacy||
   P.text(item.label)===legacy||
   P.text(item.name)===legacy;
 });

 return match?match.id:'';
};

P.foodOptions=function(animal){
 const items=P.normalizedFoodInventory();
 const selectedId=P.defaultFoodId(animal);

 let options='<option value="">Kein Standardfutter</option>';
 let selectedFound=false;

 items.forEach(function(item){
  const selected=
   String(item.id)===String(selectedId);

  if(selected){
   selectedFound=true;
  }

  options+=`<option
   value="${P.esc(item.id)}"
   ${selected?'selected':''}
  >
   ${P.esc(P.foodLabel(item))} · ${P.esc(P.foodMeta(item))}
  </option>`;
 });

 const legacy=P.text(
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
   value="legacy:${P.esc(legacy)}"
   selected
  >
   ${P.esc(legacy)} · bisherige Auswahl
  </option>`;
 }

 return options;
};

P.countBy=function(rows,keyFunction){
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
};

})();
