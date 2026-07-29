(function(){
'use strict';

function result(text,animal){
 if(!text){
  return null;
 }

 return {
  text:text,
  animal:animal||null
 };
}

function applyStock(parsed){
 const feeder=parsed.feeder;
 const stock=
  parsed.stock||
  NGTAIEngine.stockQty(
   parsed.raw
  );

 if(
  !feeder||
  !stock.qty
 ){
  return null;
 }

 const item=NGTStore.updateFoodStock(
  feeder,
  stock
 );

 return item
  ?result(
   'Bestand '+feeder+': '+item.qty,
   null
  )
  :null;
}

function afterSave(parsed,animal){
 return window.NGTAIManager
  ?NGTAIManager.afterSave(
   parsed,
   animal
  )
  :'';
}

function applyParsed(parsed,options){
 parsed=parsed||{};
 options=options||{};

 const source=
  options.source||
  'assistant';

 if(parsed.intent==='context'){
  return parsed.animal
   ?result(
    (
     options.contextText||
     'Kontext: '
    )+
    parsed.animal.a.name,
    parsed.animal.a
   )
   :null;
 }

 if(parsed.intent==='stock'){
  return applyStock(parsed);
 }

 if(!parsed.animal){
  return null;
 }

 const animal=parsed.animal.a;
 const animalId=
  NGTStore.animalId(animal);
 let text='';

 if(parsed.intent==='defaultFeeder'){
  if(
   !parsed.feeder||
   !NGTStore.setAnimalDefaultFeeder(
    {animalId:animalId},
    parsed.feeder
   )
  ){
   return null;
  }

  text=
   animal.name+
   ': Standardfutter '+
   parsed.feeder;

 }else if(parsed.intent==='shed'){
  const saved=NGTStore.recordShed(
   {animalId:animalId},
   {
    date:parsed.date,
    complete:true,
    source:source,
    note:'TerraControl KI'
   }
  );

  if(!saved){
   return null;
  }

  text=
   animal.name+
   ': Häutung '+
   parsed.date;

 }else if(parsed.intent==='weight'){
  if(!parsed.grams){
   return null;
  }

  const saved=NGTStore.recordWeight(
   {animalId:animalId},
   {
    date:parsed.date,
    weight:parsed.grams,
    source:source,
    note:'TerraControl KI'
   }
  );

  if(!saved){
   return null;
  }

  text=
   animal.name+
   ': Gewicht '+
   parsed.date+
   ' '+
   parsed.grams+
   'g';

 }else if(
  parsed.intent==='feed'||
  parsed.intent==='feed_refused'
 ){
  const feeder=
   parsed.feeder||
   animal.defaultFeeder||
   animal.futterStandard||
   '';
  const food=
   NGTStore.parseFeeder(feeder);
  const saved=NGTStore.recordFeed(
   {animalId:animalId},
   {
    date:parsed.date,
    condition:food.state,
    prey:food.prey,
    variantLabel:food.size,
    preyWeightGrams:food.amount,
    quantity:1,
    unit:'Stück',
    displayLabel:food.label,
    inventoryLabel:food.label,
    accepted:
     parsed.intent!==
     'feed_refused',
    source:source,
    note:'TerraControl KI',
    deductStock:true
   }
  );

  if(!saved){
   return null;
  }

  text=
   animal.name+
   ': '+
   parsed.date+
   ' '+
   AnimalEngine.formatFeedEvent(
    saved.event
   );

 }else{
  return null;
 }

 return result(
  text+
  afterSave(
   parsed,
   animal
  ),
  animal
 );
}

window.NGTAIActions={
 applyParsed:applyParsed
};

})();
