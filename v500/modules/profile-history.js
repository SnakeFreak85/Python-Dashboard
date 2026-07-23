(function(){
'use strict';

const P=window.NGTProfileInternal;
if(!P)throw new Error('NGTProfileInternal fehlt.');

P.shedForm=function(){
 return '<div class="subcard tc2SubCard"><h3>Häutung eintragen</h3><input id="shedDate" type="date" value="'+NGT500.today()+'"><button onclick="NGTProfile.addShed()">Häutung speichern</button></div>';
};

P.weightForm=function(){
 return '<div class="subcard tc2SubCard"><h3>Gewicht eintragen</h3><input id="weightDate" type="date" value="'+NGT500.today()+'"><input id="weightValue" type="number" min="0" step="0.1" placeholder="Gewicht in g"><button onclick="NGTProfile.addWeight()">Gewicht speichern</button></div>';
};

P.shedList=function(animal){
 const rows=(animal.sheds||[]).map(function(entry,index){
  return {entry:entry,index:index};
 }).reverse().map(function(item){
  return P.row(
   item.entry.date,
   'Häutung',
   "NGTProfile.deleteEntry('sheds',"+item.index+")"
  );
 }).join('');
 return '<div class="subcard tc2SubCard"><h3>Häutungen</h3>'+(rows||'<p class="muted">Keine Häutungen.</p>')+'</div>';
};

P.weightList=function(animal){
 const rows=(animal.weights||[]).map(function(entry,index){
  return {entry:entry,index:index};
 }).reverse().map(function(item){
  return P.row(
   item.entry.date,
   item.entry.weight+' g',
   "NGTProfile.deleteEntry('weights',"+item.index+")"
  );
 }).join('');
 return '<div class="subcard tc2SubCard"><h3>Gewichte</h3>'+(rows||'<p class="muted">Keine Gewichte.</p>')+'</div>';
};

P.addShed=function(){
 const animal=P.current();
 const date=document.getElementById('shedDate');
 if(!animal)return;
 P.ensure(animal);
 animal.sheds.push({
  id:NGT500.uid(),
  date:(date&&date.value)||NGT500.today(),
  complete:true
 });
 NGTStore.save();
 P.setTab('sheds');
};

P.addWeight=function(){
 const animal=P.current();
 const value=document.getElementById('weightValue');
 const date=document.getElementById('weightDate');
 const weight=Number(value&&value.value);
 if(!animal)return;
 if(!Number.isFinite(weight)||weight<=0){
  alert('Bitte ein gültiges Gewicht eingeben.');
  return;
 }
 P.ensure(animal);
 animal.weights.push({
  id:NGT500.uid(),
  date:(date&&date.value)||NGT500.today(),
  weight:weight
 });
 animal.weight=weight;
 NGTStore.save();
 P.setTab('weights');
};

P.deleteEntry=function(kind,index){
 if(!confirm('Eintrag löschen?'))return;
 const animal=P.current();
 if(!animal||!Array.isArray(animal[kind]))return;
 if(index<0||index>=animal[kind].length)return;
 animal[kind].splice(index,1);
 if(kind==='weights'){
  const latest=P.latest(animal.weights);
  animal.weight=latest?latest.weight:'';
 }
 NGTStore.save();
 P.setTab(P.getTab());
};

P.barChart=function(rows){
 if(!rows.length)return '<p class="muted">Keine Daten.</p>';
 const max=Math.max.apply(null,rows.map(function(row){
  return Number(row.value||0);
 }).concat([1]));
 return rows.map(function(row){
  const width=Math.max(4,Math.round((Number(row.value||0)/max)*100));
  return '<div class="tc2Bar"><small>'+P.esc(row.label||'-')+'</small><span><i style="width:'+width+'%"></i></span><b>'+P.esc(row.value)+'</b></div>';
 }).join('');
};

P.charts=function(animal){
 return '<div class="subcard tc2SubCard"><h3>Gewicht</h3>'+P.barChart((animal.weights||[]).map(function(entry){
  return {label:entry.date,value:Number(entry.weight||0)};
 }))+'</div><div class="subcard tc2SubCard"><h3>Fütterungen</h3>'+P.barChart((animal.feeds||[]).map(function(entry){
  return {label:entry.date,value:entry.accepted===false?0:1};
 }))+'</div>';
};

})();