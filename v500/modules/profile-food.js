(function(){
'use strict';

const P=window.NGTProfileInternal;

if(!P){
 throw new Error(
  'NGTProfileInternal fehlt. profile-core.js muss vor profile-food.js geladen werden.'
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

 const parsed=window.NGTStore&&NGTStore.parseFeeder
  ?NGTStore.parseFeeder(item.label||item.name||'')
  :{};

 item.id=item.id||
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

 item.unit=P.text(item.unit||'Stück');
 item.qty=Number(item.qty||0);
 item.minimum=Number(
  item.minimum!==undefined
   ?item.minimum
   :(item.minQty||0)
 );

 item.label=P.text(item.label)||
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
   const categoryCompare=String(a.category||'')
    .localeCompare(String(b.category||''),'de');

   if(categoryCompare!==0)return categoryCompare;

   return foodLabel(a).localeCompare(foodLabel(b),'de');
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

function defaultFoodId(a){
 const stored=P.text(
  a.defaultFeederId||
  a.foodInventoryId||
  ''
 );

 if(stored&&foodById(stored)){
  return stored;
 }

 const legacy=P.text(
  a.defaultFeeder||
  a.futterStandard||
  a.standardFeed||
  ''
 );

 if(!legacy)return '';

 const match=normalizedFoodInventory().find(function(item){
  return foodLabel(item)===legacy||
   P.text(item.label)===legacy||
   P.text(item.name)===legacy;
 });

 return match?match.id:'';
}

function foodOptions(a){
 const items=normalizedFoodInventory();
 const selectedId=defaultFoodId(a);

 if(!items.length){
  return '<option value="">Kein Futterbestand vorhanden</option>';
 }

 return items.map(function(item){
  const selected=String(item.id)===String(selectedId);

  return `<option value="${P.esc(item.id)}" ${selected?'selected':''}>
   ${P.esc(foodLabel(item))} · ${P.esc(foodMeta(item))}
  </option>`;
 }).join('');
}

function feedForm(a){
 const items=normalizedFoodInventory();

 if(!items.length){
  return `<div class="tc2SubCard warn">
   <h3>Fütterung eintragen</h3>

   <p class="muted">
    Es ist noch kein dynamischer Futterbestand vorhanden.
    Lege zuerst unter „Futterbestand“ eine Position an.
   </p>

   <button onclick="NGT500.route('food')">
    Futterbestand öffnen
   </button>
  </div>`;
 }

 return `<div class="tc2SubCard">
  <h3>Fütterung eintragen</h3>

  <input
   id="feedDate"
   type="date"
   value="${NGT500.today()}"
  >

  <label>
   <span>Futterposition</span>

   <select
    id="feedInventoryId"
    onchange="NGTProfile.updateFeedStockStatus()"
   >
    ${foodOptions(a)}
   </select>
  </label>

  <select id="feedStatus">
   <option value="ok">Gefressen</option>
   <option value="no">Verweigert</option>
  </select>

  <div
   id="feedStockStatus"
   class="tc2SubCard"
  ></div>

  <button onclick="NGTProfile.addFeed()">
   Fütterung speichern
  </button>
 </div>`;
}

function row(d,txt,del){
 return `<div class="tc2ListRowFull">
  <div>
   <b>${P.esc(d||'-')}</b>
   <small>${P.esc(txt||'')}</small>
  </div>

  <button class="danger" onclick="${del}">
   Löschen
  </button>
 </div>`;
}

function feedList(a){
 return `<div class="tc2SubCard">
  <h3>Fütterungen</h3>

  ${
   (a.feeds||[])
    .map((f,i)=>({f,i}))
    .reverse()
    .map(x=>row(
     x.f.date,
     `${
      x.f.accepted===false
       ?'Verweigert'
       :'Gefressen'
     } ${
      x.f.label||
      [
       x.f.state,
       x.f.prey,
       x.f.size
      ].filter(Boolean).join(' ')
     }`,
     `NGTProfile.deleteEntry('feeds',${x.i})`
    ))
    .join('')||
   '<p class="muted">Keine Fütterungen.</p>'
  }
 </div>`;
}

function updateFeedStockStatus(){
 const select=document.getElementById('feedInventoryId');
 const box=document.getElementById('feedStockStatus');

 if(!select||!box)return;

 const item=foodById(select.value);

 if(!item){
  box.className='tc2SubCard danger';
  box.innerHTML='<b>Keine Futterposition ausgewählt.</b>';
  return;
 }

 const qty=Number(item.qty||0);
 const minimum=Number(item.minimum||0);
 const unit=item.unit||'Stück';

 let cls='ok';
 let title='Bestand ausreichend';

 if(qty<=0){
  cls='danger';
  title='Bestand leer';
 }else if(minimum>0&&qty<=minimum){
  cls='warn';
  title='Mindestbestand erreicht';
 }

 box.className='tc2SubCard '+cls;

 box.innerHTML=`
  <b>${P.esc(title)}</b>
  <br>
  ${P.esc(foodLabel(item))}
  · ${qty} ${P.esc(unit)} vorhanden
  ${
   minimum>0
    ?'· Mindestbestand '+minimum+' '+P.esc(unit)
    :''
  }
 `;
}

async function addFeed(){
 const a=P.current();
 const select=document.getElementById('feedInventoryId');

 if(!select||!select.value){
  NGT500.toast(
   'Bitte eine Futterposition auswählen.',
   'warn'
  );
  return;
 }

 const item=foodById(select.value);

 if(!item){
  NGT500.toast(
   'Die ausgewählte Futterposition wurde nicht gefunden.',
   'danger'
  );
  return;
 }

 const accepted=
  document.getElementById('feedStatus').value!=='no';

 const qty=Number(item.qty||0);

 if(accepted&&qty<=0){
  NGT500.toast(
   'Dieser Futterbestand ist leer. Die Fütterung kann nicht als gefressen gespeichert werden.',
   'danger'
  );
  return;
 }

 if(
  accepted&&
  qty===1&&
  !await NGT500.confirmAction(
   'Dies ist das letzte verfügbare Futtertier dieser Position. Fütterung trotzdem speichern?',
   {
    title:'Letztes Futtertier verwenden',
    confirmText:'Fütterung speichern'
   }
  )
 ){
  return;
 }

 a.feeds=a.feeds||[];

 a.feeds.push({
  id:NGT500.uid(),
  date:
   document.getElementById('feedDate').value||
   NGT500.today(),
  foodInventoryId:item.id,
  category:item.category,
  state:item.condition,
  condition:item.condition,
  prey:item.itemName,
  size:item.variant,
  variant:item.variant,
  unit:item.unit,
  amount:1,
  label:foodLabel(item),
  accepted:accepted
 });

 if(accepted){
  item.qty=Math.max(
   0,
   Number(item.qty||0)-1
  );
 }

 NGTStore.save();
 P.setTab('feeds');
}

P.food={
 foodInventory,
 normalizeFoodItem,
 normalizedFoodInventory,
 foodLabel,
 foodMeta,
 foodById,
 defaultFoodId,
 foodOptions,
 feedForm,
 feedList,
 updateFeedStockStatus,
 addFeed
};

})();
