(function(){
'use strict';

function esc(v){return NGT500.esc(v||'')}

function opt(list,cur){
 return (list||[])
  .map(v=>`<option value="${esc(v)}" ${String(cur||'')===String(v)?'selected':''}>${esc(v)}</option>`)
  .join('');
}

function status(qty){
 qty=Number(qty||0);
 if(qty<=0)return {txt:'Leer',cls:'danger',pct:4};
 if(qty<=5)return {txt:'Niedrig',cls:'warn',pct:28};
 if(qty<=15)return {txt:'Okay',cls:'ok',pct:55};
 return {txt:'Ausreichend',cls:'ok',pct:82};
}

function render(){
 const items=NGTStore.data().foodInventory||[];
 const firstType=NGTStore.FEEDER_TYPES[0];

 const list=items.length
  ? `<div class="tc2FoodManageGrid">${items.map(card).join('')}</div>`
  : `<div class="tc2FoodEmpty">
      <h3>Noch kein Futterbestand</h3>
      <p>Füge deinen ersten Futterbestand hinzu. Danach kann TerraControl Bestände automatisch reduzieren.</p>
     </div>`;

 return `<section class="tc2FoodPage">
  <div class="tc2FoodHero">
   <div>
    <h2>🥩 Futterverwaltung</h2>
    <p>Dein echter gespeicherter Futterbestand.</p>
   </div>
  </div>

  <section class="tc2FoodAdd">
   <div class="tc2FoodAddHead">
    <h3>Futterbestand hinzufügen</h3>
    <p>Art, Größe und aktuellen Bestand erfassen.</p>
   </div>

   <div class="tc2FoodFields">
    <label><span>Zustand</span><select id="foodState">
     <option>Frost</option>
     <option>Lebend</option>
    </select></label>

    <label><span>Futtertier</span><select id="foodType" onchange="NGTFood.refreshSizes()">
     ${opt(NGTStore.FEEDER_TYPES,firstType)}
    </select></label>

    <label><span>Größe</span><select id="foodSize">
     ${opt(NGTStore.FEEDER_SIZES[firstType]||[],(NGTStore.FEEDER_SIZES[firstType]||[])[0])}
    </select></label>

    <label><span>Bestand</span><input id="foodQty" type="number" min="0" placeholder="0"></label>
   </div>

   <button class="tc2FoodSave" onclick="NGTFood.save()">Futterbestand speichern</button>
  </section>

  ${list}
 </section>`;
}

function card(x,i){
 const st=status(x.qty);
 return `<article class="tc2FoodManageCard ${st.cls}">
  <div class="tc2FoodManageTop">
   <div>
    <h3>${esc(x.label||x.name)}</h3>
    <p>${Number(x.qty||0)} Stück</p>
   </div>
   <span>🥩</span>
  </div>

  <div class="tc2FoodProgress">
   <i style="width:${st.pct}%"></i>
  </div>

  <div class="tc2FoodManageStatus ${st.cls}">${st.txt}</div>

  <div class="tc2FoodManageActions">
   <button onclick="NGTFood.edit(${i})">Bearbeiten</button>
   <button class="danger" onclick="NGTFood.del(${i})">Löschen</button>
  </div>
 </article>`;
}

function refreshSizes(){
 const type=document.getElementById('foodType').value;
 const size=document.getElementById('foodSize');
 size.innerHTML=(NGTStore.FEEDER_SIZES[type]||[])
  .map(v=>`<option value="${esc(v)}">${esc(v)}</option>`)
  .join('');
}

function save(){
 const state=document.getElementById('foodState').value||'Frost';
 const type=document.getElementById('foodType').value||'Ratte';
 const size=document.getElementById('foodSize').value||'';
 const q=Number(document.getElementById('foodQty').value||0);
 NGTStore.addFood(NGTStore.feederLabel(state,type,size),q);
 NGT500.route('food');
}

function edit(i){
 const x=NGTStore.data().foodInventory[i];
 const q=prompt('Bestand',x.qty);
 if(q!==null){
  x.qty=Number(q||0);
  NGTStore.save();
  NGT500.route('food');
 }
}

function del(i){
 if(confirm('Futterbestand löschen?')){
  NGTStore.data().foodInventory.splice(i,1);
  NGTStore.save();
  NGT500.route('food');
 }
}

window.NGTFood={save,edit,del,refreshSizes};
NGT500.register('food',{render});

})();