(function(){
'use strict';

const P=window.NGTProfileInternal;

if(!P){
 throw new Error(
  'NGTProfileInternal fehlt. profile-core.js muss vor profile-food.js geladen werden.'
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
  const selected=
   String(item.id)===String(selectedId);

  return `
   <option
    value="${P.esc(item.id)}"
    ${selected?'selected':''}
   >
    ${P.esc(foodLabel(item))}
    ·
    ${P.esc(foodMeta(item))}
   </option>
  `;
 }).join('');
}

function feedForm(a){
 const items=normalizedFoodInventory();

 if(!items.length){
  return `
   <div class="tc2SubCard warn">
    <h3>Fütterung eintragen</h3>

    <p class="muted">
     Es ist noch kein dynamischer Futterbestand vorhanden.
     Lege zuerst unter „Futterbestand“ eine Position an.
    </p>

    <button onclick="NGT500.route('food')">
     Futterbestand öffnen
    </button>
   </div>
  `;
 }

 return `
  <div class="tc2SubCard">
   <h3>Fütterung eintragen</h3>

   <label>
    <span>Datum</span>

    <input
     id="feedDate"
     type="date"
     value="${NGT500.today()}"
    >
   </label>

   <label>
    <span>Futterposition</span>

    <select
     id="feedInventoryId"
     onchange="NGTProfile.updateFeedStockStatus()"
    >
     ${foodOptions(a)}
    </select>
   </label>

   <label>
    <span>Anzahl Futtertiere</span>

    <input
     id="feedQuantity"
     type="number"
     inputmode="numeric"
     min="1"
     step="1"
     value="1"
     oninput="NGTProfile.updateFeedStockStatus()"
     onchange="NGTProfile.updateFeedStockStatus()"
    >
   </label>

   <label>
    <span>Status</span>

    <select
     id="feedStatus"
     onchange="NGTProfile.updateFeedStockStatus()"
    >
     <option value="ok">
      Gefressen
     </option>

     <option value="no">
      Verweigert
     </option>
    </select>
   </label>

   <div
    id="feedStockStatus"
    class="tc2SubCard"
   ></div>

   <button onclick="NGTProfile.addFeed()">
    Fütterung speichern
   </button>
  </div>
 `;
}

function row(d,txt,del){
 return `
  <div class="tc2ListRowFull">
   <div>
    <b>${P.esc(d||'-')}</b>
    <small>${P.esc(txt||'')}</small>
   </div>

   <button
    class="danger"
    onclick="${del}"
   >
    Löschen
   </button>
  </div>
 `;
}

function feedList(a){
 return `
  <div class="tc2SubCard">
   <h3>Fütterungen</h3>

   ${
    AnimalEngine
     .indexedHistory(
      a.feeds,
      'desc'
     )
     .map(function(item){
      return row(
       item.entry.date,
       AnimalEngine.formatFeedEvent(
        item.entry
       ),
       `NGTProfile.deleteEntry('feeds',${item.index})`
      );
     })
     .join('')||
    '<p class="muted">Keine Fütterungen.</p>'
   }
  </div>
 `;
}

function requestedQuantity(){
 const field=
  document.getElementById(
   'feedQuantity'
  );

 if(!field){
  return null;
 }

 const raw=
  String(field.value||'').trim();

 if(!/^\d+$/.test(raw)){
  return null;
 }

 const quantity=Number(raw);

 if(
  !Number.isSafeInteger(quantity)||
  quantity<1
 ){
  return null;
 }

 return quantity;
}

function updateFeedStockStatus(){
 const select=
  document.getElementById(
   'feedInventoryId'
  );

 const statusField=
  document.getElementById(
   'feedStatus'
  );

 const box=
  document.getElementById(
   'feedStockStatus'
  );

 if(!select||!box){
  return;
 }

 const item=foodById(
  select.value
 );

 if(!item){
  box.className=
   'tc2SubCard danger';

  box.innerHTML=
   '<b>Keine Futterposition ausgewählt.</b>';

  return;
 }

 const quantity=requestedQuantity();

 if(quantity===null){
  box.className=
   'tc2SubCard danger';

  box.innerHTML=`
   <b>Ungültige Anzahl</b>
   <br>
   Bitte eine ganze Zahl ab 1 eingeben.
  `;

  return;
 }

 const accepted=
  !statusField||
  statusField.value!=='no';

 const stock=
  FoodInventoryEngine.quantity(
   item
  );

 const minimum=
  FoodInventoryEngine.minimum(
   item
  );

 const unit=
  item.unit||
  'Stück';

 if(!accepted){
  const currentStatus=
   FoodInventoryEngine.status(
    item
   );

  box.className=
   'tc2SubCard '+
   currentStatus.cls;

  box.innerHTML=`
   <b>Bestand bleibt unverändert</b>
   <br>
   ${P.esc(foodLabel(item))}
   ·
   ${stock}
   ${P.esc(unit)}
   vorhanden
   <br>
   Bei „Verweigert“ wird kein Bestand abgezogen.
  `;

  return;
 }

 if(quantity>stock){
  box.className=
   'tc2SubCard danger';

  box.innerHTML=`
   <b>Bestand nicht ausreichend</b>
   <br>
   Gewählt:
   ${quantity}
   ${P.esc(unit)}
   ·
   vorhanden:
   ${stock}
   ${P.esc(unit)}
  `;

  return;
 }

 const remaining=
  stock-quantity;

 let cls='ok';
 let title='Bestand danach ausreichend';

 if(remaining<=0){
  cls='danger';
  title='Bestand danach leer';
 }else if(remaining<=minimum){
  cls='warn';
  title='Mindestbestand wird erreicht';
 }

 box.className=
  'tc2SubCard '+cls;

 box.innerHTML=`
  <b>${P.esc(title)}</b>
  <br>
  ${P.esc(foodLabel(item))}
  ·
  ${stock}
  ${P.esc(unit)}
  vorhanden
  <br>
  ${quantity}
  ${P.esc(unit)}
  werden abgezogen
  ·
  danach
  ${remaining}
  ${P.esc(unit)}
  ${
   minimum>0
    ?'<br>Mindestbestand: '+
     minimum+
     ' '+
     P.esc(unit)
    :''
  }
 `;
}

async function addFeed(){
 const animal=P.current();

 const select=
  document.getElementById(
   'feedInventoryId'
  );

 if(!select||!select.value){
  NGT500.toast(
   'Bitte eine Futterposition auswählen.',
   'warn'
  );

  return;
 }

 const item=foodById(
  select.value
 );

 if(!item){
  NGT500.toast(
   'Die ausgewählte Futterposition wurde nicht gefunden.',
   'danger'
  );

  return;
 }

 const quantity=requestedQuantity();

 if(quantity===null){
  NGT500.toast(
   'Bitte eine gültige ganze Anzahl ab 1 eingeben.',
   'warn'
  );

  return;
 }

 const statusField=
  document.getElementById(
   'feedStatus'
  );

 const accepted=
  !statusField||
  statusField.value!=='no';

 const stock=
  FoodInventoryEngine.quantity(
   item
  );

 if(
  accepted&&
  stock<=0
 ){
  NGT500.toast(
   'Dieser Futterbestand ist leer. Die Fütterung kann nicht als gefressen gespeichert werden.',
   'danger'
  );

  return;
 }

 if(
  accepted&&
  quantity>stock
 ){
  NGT500.toast(
   'Der Futterbestand reicht für diese Anzahl nicht aus. Vorhanden sind nur '+
   stock+
   ' '+
   (item.unit||'Stück')+
   '.',
   'danger'
  );

  return;
 }

 if(
  accepted&&
  quantity===stock&&
  !await NGT500.confirmAction(
   'Mit dieser Fütterung wird der vollständige Bestand dieser Position verbraucht. Trotzdem speichern?',
   {
    title:'Futterbestand wird leer',
    confirmText:'Fütterung speichern'
   }
  )
 ){
  return;
 }

 const result=NGTStore.recordFeed(
  {
   animalId:
    NGTStore.animalId(
     animal
    )
  },
  {
   date:
    document
     .getElementById('feedDate')
     .value||
    NGT500.today(),

   foodInventoryId:
    item.id,

   category:
    item.category,

   condition:
    item.condition,

   prey:
    item.itemName,

   variantLabel:
    item.variant,

   unit:
    item.unit,

   quantity:
    quantity,

   displayLabel:
    foodLabel(item),

   accepted:
    accepted,

   source:
    'profile',

   deductStock:
    accepted
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
 requestedQuantity,
 updateFeedStockStatus,
 addFeed
};

})();
