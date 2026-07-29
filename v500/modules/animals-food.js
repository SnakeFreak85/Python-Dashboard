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
 return NGTStore.foodInventory();
}

function normalizeFoodItem(item){
 return FoodInventoryEngine.normalizeItem(
  item
 );
}

function normalizedFoodInventory(){
 return FoodInventoryEngine.sortInventory(
  foodInventory()
 );
}

function foodLabel(item){
 return FoodInventoryEngine.itemLabel(
  item
 );
}

function foodMeta(item){
 return FoodInventoryEngine.meta(
  item
 );
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

 return FoodInventoryEngine.findById(
  foodInventory(),
  id
 );
}

P.food={
 normalizedFoodInventory:normalizedFoodInventory,
 foodLabel:foodLabel,
 foodSelectOptions:foodSelectOptions,
 selectedFoodItem:selectedFoodItem
};

})();
