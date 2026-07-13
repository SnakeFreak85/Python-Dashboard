(function(){
'use strict';

const P=window.NGTAnimalsInternal;

if(!P){
 throw new Error(
  'NGTAnimalsInternal fehlt. '+
  'animals-core.js muss vor animals-food.js geladen werden.'
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

 item.category=P.text(
  item.category||
  item.group||
  item.foodCategory||
  'Futtertiere'
 );

 item.condition=P.text(
  item.condition||
  item.state||
  parsed.state||
  ''
 );

 item.itemName=P.text(
  item.itemName||
  item.prey||
  item.type||
  parsed.prey||
  item.label||
  item.name||
  'Unbenannt'
 );

 item.variant=P.text(
  item.variant||
  item.size||
  parsed.size||
  ''
 );

 item.unit=P.text(
  item.unit||
  'Stück'
 );

 item.qty=Number(item.qty||0);

 item.label=
  P.text(item.label)||
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

 const selectedId=P.text(
  animal.defaultFeederId||
  animal.foodInventoryId||
  ''
 );

 const legacyLabel=P.text(
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
    value="${P.esc(item.id)}"
    ${selected?'selected':''}
   >
    ${P.esc(foodLabel(item))} · ${P.esc(foodMeta(item))}
   </option>
  `;
 });

 if(
  legacyLabel&&
  !selectedFound
 ){
  options+=`
   <option
    value="legacy:${P.esc(legacyLabel)}"
    selected
   >
    ${P.esc(legacyLabel)} · bisherige Auswahl
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

P.food={
 normalizedFoodInventory:normalizedFoodInventory,
 foodLabel:foodLabel,
 foodSelectOptions:foodSelectOptions,
 selectedFoodItem:selectedFoodItem
};

})();
