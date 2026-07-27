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
 'v500/animal-engine.js',
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
