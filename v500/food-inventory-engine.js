(function(){
'use strict';

const DEFAULT_MINIMUM=5;

function text(value){
 return String(value==null?'':value).trim();
}

function number(value,fallback){
 const parsed=Number(value);

 return Number.isFinite(parsed)
  ?parsed
  :Number(fallback||0);
}

function nonNegative(value,fallback){
 return Math.max(
  0,
  number(value,fallback)
 );
}

function slug(value){
 return text(value)
  .toLowerCase()
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g,'')
  .replace(/[^a-z0-9]+/g,'_')
  .replace(/^_+|_+$/g,'');
}

function cleanSize(value){
 return text(value)
  .replace(/\s+/g,' ')
  .replace(/gramm/ig,'g');
}

function parseLabel(value){
 const raw=text(value);

 if(!raw){
  return {
   condition:'',
   prey:'',
   variant:'',
   preyWeightGrams:0,
   label:''
  };
 }

 const lower=raw.toLowerCase();
 const condition=lower.includes('lebend')
  ?'Lebend'
  :'Frost';

 let prey='';

 if(lower.includes('vzm')){
  prey='VZM';
 }else if(
  lower.includes('maus')||
  lower.includes('mäus')
 ){
  prey='Maus';
 }else if(lower.includes('ratte')){
  prey='Ratte';
 }

 const match=raw.match(
  /(\d+\s*-\s*\d+|\d+)\s*g/i
 );

 const variant=match
  ?cleanSize(match[1]+' g')
  :'';

 const preyWeightGrams=
  variant&&/^\d+\s*g$/i.test(variant)
   ?Number(variant.replace(/\D/g,''))
   :0;

 if(!prey){
  return {
   condition:condition,
   prey:raw,
   variant:'',
   preyWeightGrams:0,
   label:raw
  };
 }

 return {
  condition:condition,
  prey:prey,
  variant:variant,
  preyWeightGrams:preyWeightGrams,
  label:[
   condition,
   prey,
   variant
  ].filter(Boolean).join(' ')
 };
}

function itemLabel(item){
 item=item||{};

 return [
  text(item.condition||item.state),
  text(
   item.itemName||
   item.prey||
   item.type
  ),
  text(
   item.variant||
   item.size
  )
 ].filter(Boolean).join(' ')||
 text(item.label||item.name)||
 'Unbenannt';
}

function itemKey(item){
 item=item||{};

 return slug([
  item.category,
  item.condition||item.state,
  item.itemName||item.prey||item.type,
  item.variant||item.size,
  item.unit
 ].join('_'));
}

function normalizeItem(item){
 const source=item||{};
 const parsed=parseLabel(
  source.label||
  source.name||
  ''
 );

 const category=text(
  source.category||
  source.group||
  source.foodCategory||
  'Futtertiere'
 );

 const condition=text(
  source.condition||
  source.state||
  parsed.condition||
  ''
 );

 const itemName=text(
  source.itemName||
  source.prey||
  source.type||
  parsed.prey||
  source.label||
  source.name||
  'Unbenannt'
 );

 const variant=text(
  source.variant||
  source.size||
  parsed.variant||
  ''
 );

 const unit=text(
  source.unit||
  'Stück'
 );

 const label=text(source.label)||
  [
   condition,
   itemName,
   variant
  ].filter(Boolean).join(' ')||
  itemName;

 const key=text(source.key)||
  itemKey({
   category:category,
   condition:condition,
   itemName:itemName,
   variant:variant,
   unit:unit
  });

 const minimumSource=
  source.minimum!==undefined
   ?source.minimum
   :source.minQty;

 return {
  ...source,
  id:text(source.id)||'food_'+key,
  key:key,
  category:category,
  condition:condition,
  state:condition,
  itemName:itemName,
  prey:itemName,
  variant:variant,
  size:variant,
  unit:unit,
  qty:number(source.qty,0),
  minimum:nonNegative(
   minimumSource,
   DEFAULT_MINIMUM
  ),
  label:label,
  name:label
 };
}

function sortInventory(items){
 return (
  Array.isArray(items)
   ?items
   :[]
 )
  .map(normalizeItem)
  .sort(function(a,b){
   const categoryCompare=
    a.category.localeCompare(
     b.category,
     'de'
    );

   return categoryCompare||
    itemLabel(a).localeCompare(
     itemLabel(b),
     'de'
    );
  });
}

function quantity(item){
 return number(
  item&&item.qty,
  0
 );
}

function minimum(item){
 const normalized=normalizeItem(item);

 return normalized.minimum;
}

function needsRestock(item){
 return quantity(item)<=minimum(item);
}

function status(item){
 const qty=quantity(item);
 const min=minimum(item);

 if(qty<=0){
  return {
   text:'Leer',
   cls:'danger',
   percent:0,
   needsRestock:true
  };
 }

 if(qty<=min){
  return {
   text:'Nachbestellen',
   cls:'warn',
   percent:
    min>0
     ?Math.max(
      8,
      Math.min(
       35,
       Math.round(qty/min*35)
      )
     )
     :0,
   needsRestock:true
  };
 }

 const target=Math.max(
  min*3,
  10
 );

 return {
  text:'Ausreichend',
  cls:'ok',
  percent:Math.max(
   40,
   Math.min(
    100,
    Math.round(qty/target*100)
   )
  ),
  needsRestock:false
 };
}

function meta(item,includeQuantity){
 const normalized=normalizeItem(item);
 const parts=[normalized.category];

 if(includeQuantity!==false){
  parts.push(
   normalized.qty+' '+normalized.unit
  );
 }else{
  parts.push(normalized.unit);
 }

 return parts.filter(Boolean).join(' · ');
}

function findById(items,id){
 return sortInventory(items)
  .find(function(item){
   return String(item.id)===String(id);
  })||null;
}

window.FoodInventoryEngine={
 DEFAULT_MINIMUM:DEFAULT_MINIMUM,
 text:text,
 number:number,
 slug:slug,
 parseLabel:parseLabel,
 normalizeItem:normalizeItem,
 sortInventory:sortInventory,
 itemLabel:itemLabel,
 itemKey:itemKey,
 quantity:quantity,
 minimum:minimum,
 needsRestock:needsRestock,
 status:status,
 meta:meta,
 findById:findById
};

})();
