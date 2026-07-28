(function(){
'use strict';

const P=window.NGTProfileInternal;

if(!P){
 throw new Error(
  'NGTProfileInternal fehlt. profile-core.js muss vor profile-history.js geladen werden.'
 );
}

function shedForm(){
 return `
  <div class="subcard tc2SubCard">
   <h3>Häutung eintragen</h3>

   <input
    id="shedDate"
    type="date"
    value="${NGT500.today()}"
   >

   <button onclick="NGTProfile.addShed()">
    Häutung speichern
   </button>
  </div>
 `;
}

function weightForm(){
 return `
  <div class="subcard tc2SubCard">
   <h3>Gewicht eintragen</h3>

   <input
    id="weightDate"
    type="date"
    value="${NGT500.today()}"
   >

   <input
    id="weightValue"
    type="number"
    min="0"
    step="0.1"
    placeholder="Gewicht in g"
   >

   <button onclick="NGTProfile.addWeight()">
    Gewicht speichern
   </button>
  </div>
 `;
}

function shedList(animal){
 const rows=(animal.sheds||[])
  .map(function(entry,index){
   return {
    entry:entry,
    index:index
   };
  })
  .reverse()
  .map(function(item){
   return P.row(
    item.entry.date,
    'Häutung',
    "NGTProfile.deleteEntry('sheds',"+
     item.index+
     ")"
   );
  })
  .join('');

 return `
  <div class="subcard tc2SubCard">
   <h3>Häutungen</h3>
   ${
    rows||
    '<p class="muted">Keine Häutungen.</p>'
   }
  </div>
 `;
}

function weightList(animal){
 const rows=(animal.weights||[])
  .map(function(entry,index){
   return {
    entry:entry,
    index:index
   };
  })
  .reverse()
  .map(function(item){
   return P.row(
    item.entry.date,
    item.entry.weight+' g',
    "NGTProfile.deleteEntry('weights',"+
     item.index+
     ")"
   );
  })
  .join('');

 return `
  <div class="subcard tc2SubCard">
   <h3>Gewichte</h3>
   ${
    rows||
    '<p class="muted">Keine Gewichte.</p>'
   }
  </div>
 `;
}

function addShed(){
 const animal=P.current();
 const date=document.getElementById(
  'shedDate'
 );

 if(!animal){
  return;
 }

 const result=NGTStore.recordShed(
  P.getContext(),
  {
   date:
    date&&date.value||
    NGT500.today(),
   complete:true,
   source:'profile'
  }
 );

 if(result){
  P.setTab('sheds');
 }
}

function addWeight(){
 const animal=P.current();
 const value=document.getElementById(
  'weightValue'
 );
 const date=document.getElementById(
  'weightDate'
 );
 const weight=Number(
  value&&value.value
 );

 if(!animal){
  return;
 }

 if(
  !Number.isFinite(weight)||
  weight<=0
 ){
  window.alert(
   'Bitte ein gültiges Gewicht eingeben.'
  );
  return;
 }

 const result=NGTStore.recordWeight(
  P.getContext(),
  {
   date:
    date&&date.value||
    NGT500.today(),
   weight:weight,
   source:'profile'
  }
 );

 if(result){
  P.setTab('weights');
 }
}

function deleteEntry(kind,index){
 const removed=
  NGTStore.deleteHistoryEntry(
   P.getContext(),
   kind,
   index
  );

 if(removed){
  P.setTab(P.getTab());
 }
}

function charts(animal){
 return `
  <div class="subcard tc2SubCard">
   <h3>Gewicht</h3>
   <p class="muted">
    ${(animal.weights||[]).length}
    Einträge
   </p>
  </div>

  <div class="subcard tc2SubCard">
   <h3>Fütterungen</h3>
   <p class="muted">
    ${(animal.feeds||[]).length}
    Einträge
   </p>
  </div>
 `;
}

P.history={
 shedForm:shedForm,
 shedList:shedList,
 addShed:addShed,
 weightForm:weightForm,
 weightList:weightList,
 addWeight:addWeight,
 deleteEntry:deleteEntry,
 charts:charts
};

/*
 * Kompatible interne Namen für bestehende Erweiterungen.
 */
P.shedForm=shedForm;
P.shedList=shedList;
P.addShed=addShed;
P.weightForm=weightForm;
P.weightList=weightList;
P.addWeight=addWeight;
P.deleteEntry=deleteEntry;
P.charts=charts;

})();
