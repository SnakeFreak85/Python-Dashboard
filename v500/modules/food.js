(function(){
'use strict';
function render(){const items=NGTStore.data().foodInventory||[];return `<div class="card"><h2>🥩 Futterverwaltung</h2><input id="foodName" placeholder="z. B. 200g Ratte"><input id="foodQty" type="number" placeholder="Bestand"><button onclick="NGTFood.save()">💾 Futterbestand speichern</button>${items.map((x,i)=>`<div class="subcard"><b>${NGT500.esc(x.name)}</b><br>Bestand: ${Number(x.qty||0)}<div class="btnRow"><button onclick="NGTFood.edit(${i})">Bearbeiten</button><button class="danger" onclick="NGTFood.del(${i})">Löschen</button></div></div>`).join('')||'<p class="muted">Kein Futterbestand.</p>'}</div>`}
function save(){const n=document.getElementById('foodName').value.trim();const q=Number(document.getElementById('foodQty').value||0);if(!n)return;NGTStore.addFood(n,q);NGT500.route('food')}
function edit(i){const x=NGTStore.data().foodInventory[i];const q=prompt('Bestand',x.qty);if(q!==null){x.qty=Number(q||0);NGTStore.save();NGT500.route('food')}}
function del(i){if(confirm('Futterbestand löschen?')){NGTStore.data().foodInventory.splice(i,1);NGTStore.save();NGT500.route('food')}}
window.NGTFood={save,edit,del};NGT500.register('food',{render});
})();
