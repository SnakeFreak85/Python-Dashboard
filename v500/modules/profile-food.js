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

 return Array.isArray(data.foodInventory)
  ?data.foodInventory
  :[];
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
 return item
  ?FoodInventoryEngine.itemLabel(item)
  :'';
}

function foodMeta(item){
 return item
  ?FoodInventoryEngine.meta(item)
  :'';
}

function foodById(id){
 return FoodInventoryEngine.findById(
  foodInventory(),
  id
 );
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
   AnimalEngine
    .indexedHistory(
     a.feeds,
     'desc'
    )
    .map(x=>row(
     x.entry.date,
     AnimalEngine.formatFeedEvent(x.entry),
     `NGTProfile.deleteEntry('feeds',${x.index})`
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

 const qty=FoodInventoryEngine.quantity(item);
 const minimum=FoodInventoryEngine.minimum(item);
 const unit=item.unit||'Stück';

 const stockStatus=
  FoodInventoryEngine.status(item);
 const cls=stockStatus.cls;
 const title=
  stockStatus.text==='Leer'
   ?'Bestand leer'
   :stockStatus.needsRestock
    ?'Mindestbestand erreicht'
    :'Bestand ausreichend';

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

 const result=NGTStore.recordFeed(
  {
   animalId:NGTStore.animalId(a)
  },
  {
   date:
    document.getElementById('feedDate').value||
    NGT500.today(),
   foodInventoryId:item.id,
   category:item.category,
   condition:item.condition,
   prey:item.itemName,
   variantLabel:item.variant,
   unit:item.unit,
   quantity:1,
   displayLabel:foodLabel(item),
   accepted:accepted,
   source:'profile',
   deductStock:true
  }
 );

 if(!result){
  NGT500.toast(
   'Die Fütterung konnte nicht gespeichert werden.',
   'danger'
  );
  return;
 }

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
