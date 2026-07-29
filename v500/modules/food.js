(function(){
'use strict';

let editingId='';

function esc(value){
 return NGT500.esc(value||'');
}

function uid(){
 return 'food_'+Date.now()+'_'+Math.random().toString(36).slice(2,8);
}

function text(value){
 return FoodInventoryEngine.text(value);
}

function number(value,fallback){
 return FoodInventoryEngine.number(
  value,
  fallback
 );
}

function slug(value){
 return FoodInventoryEngine.slug(value);
}

function inventory(){
 return NGTStore.foodInventory();
}

function normalizeItem(item){
 return FoodInventoryEngine.normalizeItem(
  item
 );
}

function normalizeInventory(){
 return FoodInventoryEngine.sortInventory(
  inventory()
 );
}

function itemLabel(item){
 return FoodInventoryEngine.itemLabel(
  item
 );
}

function itemMeta(item){
 return FoodInventoryEngine.meta(
  item,
  false
 );
}

function status(item){
 return FoodInventoryEngine.status(
  item
 );
}

function uniqueValues(field){
 return Array.from(
  new Set(
   normalizeInventory()
    .map(function(item){
     return text(item[field]);
    })
    .filter(Boolean)
  )
 ).sort(function(a,b){
  return a.localeCompare(b,'de');
 });
}

function dataList(id,values){
 return `<datalist id="${id}">
  ${values.map(function(value){
   return `<option value="${esc(value)}"></option>`;
  }).join('')}
 </datalist>`;
}

function summaryCards(items){
 const totalKinds=items.length;

 const totalUnits=items.reduce(function(sum,item){
  return sum+number(item.qty,0);
 },0);

 const lowItems=items.filter(function(item){
  const state=status(item);
  return state.cls==='warn'||state.cls==='danger';
 }).length;

 const categories=new Set(
  items.map(function(item){
   return text(item.category)||'Unsortiert';
  })
 ).size;

 return `<div class="tc2ProfileOverviewGrid tc2FoodSummary">
  <div>
   <small>Positionen</small>
   <b>${totalKinds}</b>
  </div>

  <div>
   <small>Gesamtbestand</small>
   <b>${totalUnits}</b>
  </div>

  <div>
   <small>Niedrig / leer</small>
   <b>${lowItems}</b>
  </div>

  <div>
   <small>Kategorien</small>
   <b>${categories}</b>
  </div>
 </div>`;
}

function editor(){
 const categories=uniqueValues('category');
 const names=uniqueValues('itemName');
 const variants=uniqueValues('variant');
 const conditions=uniqueValues('condition');
 const units=uniqueValues('unit');

 return `<section class="tc2FoodAdd">
  <div class="tc2FoodAddHead">
   <div>
    <h3 id="foodEditorTitle">Futterbestand hinzufügen</h3>
    <p>
     Kategorie, Bezeichnung, Variante und Einheit sind frei definierbar.
    </p>
   </div>

   <button
    id="foodCancelEdit"
    type="button"
    class="hidden"
    onclick="NGTFood.cancelEdit()"
   >
    Abbrechen
   </button>
  </div>

  <input id="foodEditId" type="hidden" value="">

  <div class="tc2FoodFields">
   <label>
    <span>Kategorie</span>
    <input
     id="foodCategory"
     list="foodCategoryList"
     placeholder="z. B. Nagetiere, Insekten, Pflanzen"
     value="Futtertiere"
    >
   </label>

   <label>
    <span>Bezeichnung</span>
    <input
     id="foodName"
     list="foodNameList"
     placeholder="z. B. Ratte, Maus, Heimchen"
    >
   </label>

   <label>
    <span>Variante / Größe</span>
    <input
     id="foodVariant"
     list="foodVariantList"
     placeholder="z. B. 50 g, adult, mittel"
    >
   </label>

   <label>
    <span>Zustand</span>
    <input
     id="foodCondition"
     list="foodConditionList"
     placeholder="z. B. Frost, Lebend, frisch"
    >
   </label>

   <label>
    <span>Einheit</span>
    <input
     id="foodUnit"
     list="foodUnitList"
     placeholder="z. B. Stück, Dose, Gramm"
     value="Stück"
    >
   </label>

   <label>
    <span>Bestand</span>
    <input
     id="foodQty"
     type="number"
     min="0"
     step="any"
     placeholder="0"
    >
   </label>

   <label>
    <span>Mindestbestand</span>
    <input
     id="foodMinimum"
     type="number"
     min="0"
     step="any"
     value="5"
    >
   </label>
  </div>

  ${dataList('foodCategoryList',categories)}
  ${dataList('foodNameList',names)}
  ${dataList('foodVariantList',variants)}
  ${dataList('foodConditionList',conditions)}
  ${dataList('foodUnitList',units)}

  <button class="tc2FoodSave" onclick="NGTFood.save()">
   Futterbestand speichern
  </button>
 </section>`;
}

function card(item){
 const state=status(item);
 const label=itemLabel(item);
 const meta=itemMeta(item);

 return `<article class="tc2FoodManageCard ${state.cls}">
  <div class="tc2FoodManageTop">
   <div>
    <h3>${esc(label)}</h3>
    <p>
     ${esc(meta)}
    </p>
   </div>

   <span>🥩</span>
  </div>

  <div class="tc2FoodManageAmount">
   <button
    type="button"
    onclick="NGTFood.change('${esc(item.id)}',-1)"
    aria-label="Bestand verringern"
   >
    −
   </button>

   <strong>
    ${number(item.qty,0)} ${esc(item.unit||'Stück')}
   </strong>

   <button
    type="button"
    onclick="NGTFood.change('${esc(item.id)}',1)"
    aria-label="Bestand erhöhen"
   >
    +
   </button>
  </div>

  <div class="tc2FoodProgress">
   <i style="width:${state.percent}%"></i>
  </div>

  <div class="tc2FoodManageStatus ${state.cls}">
   ${esc(state.text)}
   · Mindestbestand ${number(item.minimum,0)} ${esc(item.unit||'Stück')}
  </div>

  <div class="tc2FoodManageActions">
   <button onclick="NGTFood.edit('${esc(item.id)}')">
    Bearbeiten
   </button>

   <button
    class="danger"
    onclick="NGTFood.del('${esc(item.id)}')"
   >
    Löschen
   </button>
  </div>
 </article>`;
}

function categorySection(category,items){
 return `<section class="tc2FoodCategory">
  <div class="tc2PageHead">
   <div>
    <h3>${esc(category)}</h3>
    <p class="muted">
     ${items.length} ${items.length===1?'Position':'Positionen'}
    </p>
   </div>
  </div>

  <div class="tc2FoodManageGrid">
   ${items.map(card).join('')}
  </div>
 </section>`;
}

function inventoryList(items){
 if(!items.length){
  return `<div class="tc2FoodEmpty">
   <h3>Noch kein Futterbestand</h3>
   <p>
    Lege eine frei definierte Futterposition an. Kategorien,
    Größen und Einheiten werden nicht mehr fest vorgegeben.
   </p>
  </div>`;
 }

 const grouped={};

 items.forEach(function(item){
  const category=text(item.category)||'Unsortiert';

  if(!grouped[category]){
   grouped[category]=[];
  }

  grouped[category].push(item);
 });

 return Object.keys(grouped)
  .sort(function(a,b){
   return a.localeCompare(b,'de');
  })
  .map(function(category){
   const rows=grouped[category].slice().sort(function(a,b){
    return itemLabel(a).localeCompare(itemLabel(b),'de');
   });

   return categorySection(category,rows);
  })
  .join('');
}

function render(){
 editingId='';

 const items=normalizeInventory();

 return `<section class="tc2FoodPage">
  <div class="tc2FoodHero">
   <div>
    <h2>🥩 Futterverwaltung</h2>
    <p>
     Dynamischer Futterbestand ohne fest vorgegebene Arten,
     Größen oder Einheiten.
    </p>
   </div>
  </div>

  ${summaryCards(items)}
  ${editor()}
  ${inventoryList(items)}
 </section>`;
}

function formValue(id){
 const element=document.getElementById(id);
 return element?text(element.value):'';
}

function findById(id){
 return FoodInventoryEngine.findById(
  inventory(),
  id
 );
}

function duplicateFor(data,ignoreId){
 const category=slug(data.category);
 const condition=slug(data.condition);
 const name=slug(data.itemName);
 const variant=slug(data.variant);
 const unit=slug(data.unit);

 return normalizeInventory().find(function(item){
  if(ignoreId&&String(item.id)===String(ignoreId)){
   return false;
  }

  return slug(item.category)===category&&
   slug(item.condition)===condition&&
   slug(item.itemName)===name&&
   slug(item.variant)===variant&&
   slug(item.unit)===unit;
 })||null;
}

async function save(){
 const id=formValue('foodEditId')||editingId;

 const data={
  category:formValue('foodCategory')||'Futtertiere',
  itemName:formValue('foodName'),
  variant:formValue('foodVariant'),
  condition:formValue('foodCondition'),
  unit:formValue('foodUnit')||'Stück',
  qty:number(formValue('foodQty'),0),
  minimum:number(formValue('foodMinimum'),0)
 };

 if(!data.itemName){
  NGT500.toast(
   'Bitte eine Bezeichnung für das Futter eingeben.',
   'warn'
  );
  return;
 }

 const duplicate=duplicateFor(data,id);

 if(duplicate){
  if(!await NGT500.confirmAction(
   'Diese Futterposition existiert bereits. Soll der eingegebene Bestand zum vorhandenen Bestand addiert werden?',
   {
    title:'Futterposition zusammenführen',
    confirmText:'Bestand addieren'
   }
  )){
   return;
  }

  if(
   !NGTStore.saveFoodInventoryItem({
    ...duplicate,
    qty:
     number(duplicate.qty,0)+
     data.qty,
    minimum:data.minimum,
    label:itemLabel(data),
    name:itemLabel(data)
   })
  ){
   NGT500.toast(
    'Die vorhandene Futterposition wurde nicht gefunden.',
    'danger'
   );
   return;
  }

  NGT500.route('food');
  return;
 }

 if(id){
  const existing=findById(id);

  if(!existing){
   NGT500.toast(
    'Die Futterposition wurde nicht gefunden.',
    'danger'
   );
   return;
  }

  NGTStore.saveFoodInventoryItem({
    ...existing,
    ...data,
    id:id,
    label:itemLabel(data),
    name:itemLabel(data),
    key:slug([
     data.category,
     data.condition,
     data.itemName,
     data.variant,
     data.unit
    ].join('_'))
   });

 }else{
  NGTStore.saveFoodInventoryItem({
   id:uid(),
   category:data.category,
   itemName:data.itemName,
   variant:data.variant,
   condition:data.condition,
   unit:data.unit,
   qty:data.qty,
   minimum:data.minimum,
   label:itemLabel(data)
  });
 }

 NGT500.route('food');
}

function setInput(id,value){
 const element=document.getElementById(id);

 if(element){
  element.value=value==null?'':value;
 }
}

function edit(id){
 const item=findById(id);

 if(!item){
  NGT500.toast(
   'Die Futterposition wurde nicht gefunden.',
   'danger'
  );
  return;
 }

 editingId=item.id;

 setInput('foodEditId',item.id);
 setInput('foodCategory',item.category);
 setInput('foodName',item.itemName);
 setInput('foodVariant',item.variant);
 setInput('foodCondition',item.condition);
 setInput('foodUnit',item.unit);
 setInput('foodQty',item.qty);
 setInput('foodMinimum',item.minimum);

 const title=document.getElementById('foodEditorTitle');
 const cancel=document.getElementById('foodCancelEdit');

 if(title){
  title.textContent='Futterbestand bearbeiten';
 }

 if(cancel){
  cancel.classList.remove('hidden');
 }

 const editorElement=document.querySelector('.tc2FoodAdd');

 if(editorElement){
  editorElement.scrollIntoView({
   behavior:'smooth',
   block:'start'
  });
 }
}

function cancelEdit(){
 editingId='';

 setInput('foodEditId','');
 setInput('foodCategory','Futtertiere');
 setInput('foodName','');
 setInput('foodVariant','');
 setInput('foodCondition','');
 setInput('foodUnit','Stück');
 setInput('foodQty','');
 setInput('foodMinimum','5');

 const title=document.getElementById('foodEditorTitle');
 const cancel=document.getElementById('foodCancelEdit');

 if(title){
  title.textContent='Futterbestand hinzufügen';
 }

 if(cancel){
  cancel.classList.add('hidden');
 }
}

function rerenderAtScrollPosition(left,top){
 NGT500.route(
  'food',
  {},
  {
   replace:true,
   noHistory:true
  }
 );

 const afterRender=
  window.requestAnimationFrame||
  function(callback){
   callback();
 };

 afterRender(function(){
  if(typeof window.scrollTo!=='function'){
   return;
  }

  window.scrollTo({
   left:left,
   top:top,
   behavior:'auto'
  });
 });
}

function change(id,amount){
 const scrollLeft=window.scrollX||0;
 const scrollTop=window.scrollY||0;

 if(
  !NGTStore.adjustFoodInventoryItem(
   id,
   number(amount,0)
  )
 ){
  return;
 }

 rerenderAtScrollPosition(
  scrollLeft,
  scrollTop
 );
}

async function del(id){
 const items=inventory();

 const index=items.findIndex(function(item){
  return String(item.id)===String(id);
 });

 if(index<0)return;

 const item=normalizeItem(items[index]);

 if(!await NGT500.confirmAction(
  'Futterbestand „'+itemLabel(item)+'“ wirklich löschen?',
  {
   title:'Futterposition löschen',
   confirmText:'Futter löschen',
   danger:true
  }
 )){
  return;
 }

 if(!NGTStore.deleteFoodInventoryItem(id)){
  NGT500.toast(
   'Die Futterposition wurde nicht gefunden.',
   'danger'
  );
  return;
 }

 NGT500.route('food');
}

window.NGTFood={
 save:save,
 edit:edit,
 cancelEdit:cancelEdit,
 change:change,
 del:del
};

NGT500.register('food',{
 render:render
});

})();
