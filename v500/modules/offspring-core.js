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
 return [
  'Archiv',
  'Verkauft',
  'Abgegeben',
  'Verstorben'
 ].includes(status);
};

P.isOffspringAnimal=function(animal){
 if(window.NGTIdManager&&NGTIdManager.isOffspring){
  return NGTIdManager.isOffspring(animal);
 }

 return String((animal&&animal.status)||'').toLowerCase()==='nachzucht'||
  String((animal&&animal.collection)||'').toLowerCase()==='offspring'||
  String((animal&&animal.collection)||'').toLowerCase()==='nachzuchten';
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
 const data=NGTStore.data();

 return Array.isArray(data.foodInventory)
  ?data.foodInventory
  :[];
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
