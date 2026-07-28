import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const storage=new Map();
let uidCounter=0;
let lastRoute=null;

const localStorage={
 getItem(key){
  return storage.has(String(key))
   ?storage.get(String(key))
   :null;
 },
 setItem(key,value){
  storage.set(String(key),String(value));
 },
 removeItem(key){
  storage.delete(String(key));
 }
};

localStorage.setItem('spd_v53',JSON.stringify({
 schemaVersion:2,
 animals:[],
 koenig:[{
  uuid:'legacy-1',
  uid:'legacy-1',
  name:'Legacy-Tier',
  animalGroup:'Königspythons',
  genus:'Python',
  species:'regius',
  status:'Bestand'
 }],
 boas:[],
 geckos:[],
 spinnen:[],
 foodInventory:[],
 clutches:[],
 sales:[],
 archive:[],
 settings:{}
}));

const context={
 console,
 localStorage,
 NGT500:{
  uid(){
   uidCounter++;
   return 'test-uid-'+uidCounter;
  },
  emit(){},
  register(){},
  toast(){},
  confirmAction(){
   return Promise.resolve(true);
  },
  esc(value){
   return String(value||'');
  },
  today(){
   return '2026-07-27';
  },
  route(name,args,options){
   lastRoute={name,args,options};
  }
 }
};

context.window=context;
vm.createContext(context);

[
 'v500/id-manager.js',
 'v500/food-inventory-engine.js',
 'v500/animal-engine.js',
 'v500/care-rules-engine.js',
 'v500/store.js'
].forEach(function(file){
 vm.runInContext(
  fs.readFileSync(file,'utf8'),
  context,
  {filename:file}
 );
});

const store=context.NGTStore;
const engine=context.AnimalEngine;
const foodEngine=context.FoodInventoryEngine;
const careEngine=context.CareRulesEngine;

assert.equal(
 careEngine.isFeedDue({
  feedIntervalEnabled:false,
  feedIntervalDays:14,
  feeds:[{date:'2026-01-01'}]
 },{now:'2026-07-28'}),
 false,
 'Ein deaktiviertes Fütterungsintervall darf nirgends eine Aufgabe erzeugen.'
);

const missingFeedState=
 careEngine.feedDueState({
  feedIntervalDays:14,
  feeds:[]
 },{now:'2026-07-28'});

assert.equal(
 missingFeedState.due,
 true,
 'Ein Tier mit aktivem Intervall und ohne Fütterung muss als fällig gelten.'
);

assert.equal(
 missingFeedState.missing,
 true,
 'Fehlende Historie muss als eigener Fälligkeitsgrund erkennbar sein.'
);

assert.equal(
 careEngine.isFeedDue({
  feedIntervalDays:14,
  feeds:[{date:'2026-07-14'}]
 },{now:'2026-07-28'}),
 true,
 'Ein erreichtes Fütterungsintervall muss als fällig gelten.'
);

assert.equal(
 careEngine.isFeedDue({
  feedIntervalDays:14,
  feeds:[{date:'2026-07-15'}]
 },{now:'2026-07-28'}),
 false,
 'Ein noch nicht erreichtes Fütterungsintervall darf nicht fällig sein.'
);

assert.equal(
 careEngine.isWeightDue({
  weightIntervalEnabled:false,
  weightIntervalDays:30,
  weights:[]
 },{now:'2026-07-28'}),
 false,
 'Ein deaktiviertes Gewichtsintervall darf keine Aufgabe erzeugen.'
);

assert.equal(
 careEngine.healthStatus({
  feedIntervalEnabled:false,
  feeds:[{date:'2026-01-01',accepted:true}],
  weightIntervalEnabled:false,
  weights:[],
  health:[]
 },{now:'2026-07-28'}).score,
 0,
 'Deaktivierte Intervalle dürfen den Gesundheitsstatus nicht verschlechtern.'
);

const refusalHealthStatus=
 careEngine.healthStatus({
  feedIntervalEnabled:false,
  feeds:[
   {date:'2026-07-20',accepted:false},
   {date:'2026-07-27',accepted:false}
  ],
  weightIntervalEnabled:false,
  weights:[],
  health:[]
 },{now:'2026-07-28'});

assert.equal(
 refusalHealthStatus.score,
 2,
 'Zwei aufeinanderfolgende Verweigerungen müssen einheitlich als Beobachtung gelten.'
);

assert.equal(
 refusalHealthStatus.txt,
 'Beobachten',
 'Der einheitliche Statustext für zwei Verweigerungen muss Beobachten sein.'
);

assert.equal(
 refusalHealthStatus.reasons[0],
 'wiederholte Futterverweigerung',
 'Der Grund für die Beobachtung muss erhalten bleiben.'
);

assert.equal(
 careEngine.healthStatus({
  feedIntervalEnabled:false,
  feeds:[
   {date:'2026-07-20',accepted:false},
   {date:'2026-07-27',accepted:false}
  ],
  weightIntervalEnabled:false,
  weights:[
   {date:'2026-07-01',weight:150},
   {date:'2026-07-28',weight:140}
  ],
  health:[]
 },{now:'2026-07-28'}).txt,
 'Handlungsbedarf',
 'Verweigerungen und Gewichtsverlust müssen einheitlich Handlungsbedarf auslösen.'
);

const foodSource={
 label:'Frost Ratte 150 g',
 qty:5
};
const normalizedFood=
 foodEngine.normalizeItem(foodSource);

assert.equal(
 normalizedFood.minimum,
 5,
 'Fehlender Mindestbestand muss zentral auf 5 normalisiert werden.'
);

assert.equal(
 Object.hasOwn(foodSource,'minimum'),
 false,
 'Lesende Futter-Normalisierung darf den Quelldatensatz nicht verändern.'
);

assert.equal(
 foodEngine.needsRestock({
  label:'Heimchen',
  qty:0,
  minimum:0
 }),
 true,
 'Ein leerer Bestand muss auch bei Mindestbestand 0 nachgekauft werden.'
);

assert.equal(
 foodEngine.needsRestock({
  label:'Heimchen',
  qty:1,
  minimum:0
 }),
 false,
 'Ein positiver Bestand darf bei Mindestbestand 0 nicht als niedrig gelten.'
);

assert.equal(
 foodEngine.needsRestock({
  label:'Frost Maus 20 g',
  qty:7,
  minimum:7
 }),
 true,
 'Ein benutzerdefinierter Mindestbestand muss verbindlich gelten.'
);

assert.equal(
 foodEngine.needsRestock({
  label:'Frost Maus 20 g',
  qty:8,
  minimum:7
 }),
 false,
 'Bestand oberhalb des benutzerdefinierten Minimums muss ausreichend sein.'
);

const legacyProfileFeed=engine.normalizeFeedEvent({
 accepted:true,
 prey:'Ratte',
 amount:1,
 size:'150 g',
 unit:'Stück'
});

assert.equal(
 legacyProfileFeed.preyWeightGrams,
 150,
 'Legacy-Profilfütterungen müssen ihr Variantengewicht behalten.'
);

assert.equal(
 legacyProfileFeed.quantity,
 1,
 'Legacy-Profilfütterungen müssen die Stückzahl getrennt normalisieren.'
);

assert.equal(
 engine.formatFeedEvent(legacyProfileFeed),
 'Gefressen Ratte 150 g',
 'Legacy-Profilfütterungen dürfen nicht als 1 g angezeigt werden.'
);

assert.equal(
 store.allAnimals().length,
 1,
 'Legacy-only Bestand muss beim Laden übernommen werden.'
);

assert.equal(
 store.allAnimals()[0].a.uuid,
 'legacy-1',
 'Die Legacy-UUID muss erhalten bleiben.'
);

store.deleteAnimal('',0);

assert.equal(
 store.allAnimals().length,
 0,
 'Zentrale Löschung muss das Tier entfernen.'
);

assert.equal(
 store.data().koenig.length,
 0,
 'Legacy-Liste muss nach Löschung neu aufgebaut werden.'
);

assert.equal(
 JSON.parse(localStorage.getItem('spd_v53')).animals.length,
 0,
 'Die Löschung muss auch im persistierten kanonischen Bestand stehen.'
);

store.save();

assert.equal(
 store.allAnimals().length,
 0,
 'Weiteres Speichern darf das Tier nicht wiederherstellen.'
);

store.addAnimal('',{
 uuid:'offspring-1',
 uid:'offspring-1',
 name:'Nachzucht',
 animalGroup:'Königspythons',
 genus:'Python',
 species:'regius',
 status:'Nachzucht',
 collection:'offspring'
});

assert.equal(
 store.allOffspring().length,
 1,
 'Nachzucht muss angelegt werden.'
);

store.deleteAnimal('',0);

assert.equal(
 store.allOffspring().length,
 0,
 'Nachzucht muss über die zentrale Löschung entfernt bleiben.'
);

store.importJson(JSON.stringify({
 schemaVersion:2,
 animals:[{
  uuid:'mixed-1',
  uid:'mixed-1',
  name:'Kanonisch',
  animalGroup:'Boas',
  status:'Bestand'
 }],
 boas:[{
  uuid:'mixed-1',
  uid:'mixed-1',
  name:'Legacy-Duplikat',
  animalGroup:'Boas',
  status:'Bestand'
 }],
 koenig:[],
 geckos:[],
 spinnen:[]
}));

assert.equal(
 store.allAnimals().length,
 1,
 'Gemischter Import darf gleiche UUID nicht duplizieren.'
);

assert.equal(
 store.allAnimals()[0].a.name,
 'Kanonisch',
 'Der kanonische Datensatz muss Vorrang haben.'
);

assert.equal(
 store.data().boas.length,
 1,
 'Legacy-Kompatibilitätsliste muss aus animals[] erzeugt werden.'
);

store.addAnimal('',{
 uuid:'mixed-2',
 uid:'mixed-2',
 name:'Zweites Tier',
 animalGroup:'Boas',
 status:'Bestand'
});

store.data().animals.reverse();
store.save();

assert.equal(
 store.getAnimalById('mixed-1').name,
 'Kanonisch',
 'UUID-Auflösung muss unabhängig von der Array-Position sein.'
);

assert.equal(
 store.resolveAnimal({animalId:'mixed-1'}).a.name,
 'Kanonisch',
 'Eine UUID-Route muss zum richtigen Tier aufgelöst werden.'
);

assert.equal(
 store.resolveAnimal({i:0}).a.name,
 'Zweites Tier',
 'Alte Index-Referenzen müssen während der Migration weiter funktionieren.'
);

assert.equal(
 store.updateAnimalById('mixed-1',{name:'Über UUID aktualisiert'}).name,
 'Über UUID aktualisiert',
 'Aktualisieren über UUID muss unterstützt werden.'
);

assert.equal(
 store.deleteAnimalById('mixed-1'),
 true,
 'Löschen über UUID muss erfolgreich sein.'
);

assert.equal(
 store.getAnimalById('mixed-1'),
 null,
 'Über UUID gelöschtes Tier darf nicht mehr auflösbar sein.'
);

assert.equal(
 store.getAnimalById('mixed-2').name,
 'Zweites Tier',
 'Das Tier an einer anderen Array-Position muss erhalten bleiben.'
);

store.data().foodInventory.push({
 id:'food-150',
 category:'Nagetiere',
 condition:'Frost',
 itemName:'Ratte',
 variant:'150 g',
 unit:'Stück',
 qty:2,
 label:'Frost Ratte 150 g'
});
store.save();

const recordedFeed=store.recordFeed(
 {animalId:'mixed-2'},
 {
  date:'2026-07-27',
  accepted:true,
  foodInventoryId:'food-150',
  condition:'Frost',
  prey:'Ratte',
  variantLabel:'150 g',
  preyWeightGrams:150,
  quantity:1,
  source:'test',
  deductStock:true
 }
);

assert.equal(
 recordedFeed.event.preyWeightGrams,
 150,
 'Der zentrale Fütterungspfad muss das Futtergewicht speichern.'
);

assert.equal(
 recordedFeed.event.amount,
 150,
 'Das Legacy-Feld amount muss ebenfalls das Gewicht enthalten.'
);

assert.equal(
 recordedFeed.event.quantity,
 1,
 'Die Stückzahl muss getrennt vom Gewicht gespeichert werden.'
);

assert.equal(
 context.AnimalEngine.formatFeedEvent(recordedFeed.event),
 'Gefressen Frost Ratte 150 g',
 'Die zentrale Anzeige darf aus 150 g nicht 1 g machen.'
);

assert.equal(
 store.data().foodInventory[0].qty,
 1,
 'Eine gefressene Portion muss den Futterbestand reduzieren.'
);

store.recordFeed(
 {animalId:'mixed-2'},
 {
  date:'2026-07-27',
  accepted:false,
  foodInventoryId:'food-150',
  condition:'Frost',
  prey:'Ratte',
  variantLabel:'150 g',
  preyWeightGrams:150,
  quantity:1,
  source:'test',
  deductStock:true
 }
);

assert.equal(
 store.data().foodInventory[0].qty,
 1,
 'Verweigertes Futter darf den Bestand nicht reduzieren.'
);

vm.runInContext(
 fs.readFileSync('v500/smart-dashboard.js','utf8'),
 context,
 {filename:'v500/smart-dashboard.js'}
);

const restockDashboard=
 context.NGTSmartDashboard.render();

assert.match(
 restockDashboard,
 /Futter nachkaufen/,
 'Das Smart Dashboard muss den Nachkaufbedarf statt des Gesamtbestands zeigen.'
);

assert.match(
 restockDashboard,
 /Frost Ratte 150 g/,
 'Eine Position am Mindestbestand muss im Smart Dashboard erscheinen.'
);

store.data().foodInventory[0].qty=10;
store.save();

assert.match(
 context.NGTSmartDashboard.render(),
 /Alle Futterbestände sind ausreichend\./,
 'Ohne Nachkaufbedarf muss das Smart Dashboard einen eindeutigen Leerzustand zeigen.'
);

vm.runInContext(
 fs.readFileSync('v500/modules/food.js','utf8'),
 context,
 {filename:'v500/modules/food.js'}
);

context.NGTFood.change(
 'food-150',
 -3
);

assert.equal(
 store.data().foodInventory[0].qty,
 7,
 'Eine bewusste Bestandsänderung muss trotz reiner View-Modelle gespeichert werden.'
);

const foodForm={
 foodEditId:{value:'food-150'},
 foodCategory:{value:'Nagetiere'},
 foodName:{value:'Ratte'},
 foodVariant:{value:'150 g'},
 foodCondition:{value:'Frost'},
 foodUnit:{value:'Stück'},
 foodQty:{value:'12'},
 foodMinimum:{value:'9'}
};

context.document={
 getElementById(id){
  return foodForm[id]||null;
 },
 querySelector(){
  return null;
 }
};

await context.NGTFood.save();

assert.equal(
 store.data().foodInventory[0].qty,
 12,
 'Bearbeiten muss den kanonischen Futterbestand aktualisieren.'
);

assert.equal(
 store.data().foodInventory[0].minimum,
 9,
 'Ein benutzerdefinierter Mindestbestand muss beim Bearbeiten erhalten bleiben.'
);

vm.runInContext(
 fs.readFileSync('v500/modules/profile-core.js','utf8'),
 context,
 {filename:'v500/modules/profile-core.js'}
);

context.NGTProfileInternal.setContext({
 animalId:'mixed-2'
});

assert.equal(
 context.NGTProfileInternal.current().name,
 'Zweites Tier',
 'Das Profil muss ein Tier über seine UUID auflösen.'
);

context.NGTProfileInternal.setTab('feeds');

assert.deepEqual(
 JSON.parse(JSON.stringify(lastRoute)),
 {
  name:'profile',
  args:{
   animalId:'mixed-2',
   tab:'feeds'
  },
  options:{
   replace:true,
   noHistory:true
  }
 },
 'Ein Profil-Tabwechsel muss die UUID in der Route beibehalten.'
);

assert.equal(
 store.deleteAnimal('',-1),
 false,
 'Ein ungültiger Index darf keine Löschung auslösen.'
);

assert.equal(
 store.allAnimals().length,
 1,
 'Ein ungültiger Index darf den Bestand nicht verändern.'
);

console.log('Store tests passed.');
