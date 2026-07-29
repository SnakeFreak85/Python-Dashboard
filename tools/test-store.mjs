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
 'v500/sync-policy-engine.js',
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
const syncPolicy=context.NGTSyncPolicyEngine;

function fixture(name){
 return fs.readFileSync(
  'v500/tests/fixtures/store/'+name,
  'utf8'
 );
}

function plain(value){
 return JSON.parse(
  JSON.stringify(value)
 );
}

const localSyncData={
 animals:[{
  uuid:'local-animal',
  name:'Lokal'
 }]
};
const cloudSyncData={
 animals:[{
  uuid:'cloud-animal',
  name:'Cloud'
 }]
};

assert.equal(
 syncPolicy.decide({
  localData:localSyncData,
  cloudData:{},
  cloudExists:false
 }).action,
 'keep-local',
 'Fehlende Cloud-Daten dürfen einen lokalen Bestand nicht leeren.'
);

assert.equal(
 syncPolicy.decide({
  localData:localSyncData,
  cloudData:{},
  cloudExists:true,
  forceCloud:true
 }).action,
 'keep-local',
 'Auch manuelles Laden darf einen lokalen Bestand nicht durch leere Cloud-Daten ersetzen.'
);

assert.equal(
 syncPolicy.decide({
  localData:{},
  cloudData:cloudSyncData,
  cloudExists:true
 }).action,
 'load-cloud',
 'Ein leerer lokaler Bestand darf vorhandene Cloud-Daten laden.'
);

assert.equal(
 syncPolicy.decide({
  localData:localSyncData,
  cloudData:cloudSyncData,
  cloudExists:true,
  localUpdatedAt:'2026-07-28T12:00:00.000Z',
  cloudUpdatedAt:'2026-07-28T11:00:00.000Z'
 }).action,
 'keep-local',
 'Neuere lokale Daten müssen erhalten und wieder hochgeladen werden.'
);

assert.equal(
 syncPolicy.decide({
  localData:localSyncData,
  cloudData:cloudSyncData,
  cloudExists:true,
  localUpdatedAt:'2026-07-28T11:00:00.000Z',
  cloudUpdatedAt:'2026-07-28T12:00:00.000Z'
 }).action,
 'load-cloud',
 'Neuere Cloud-Daten dürfen den älteren lokalen Stand ersetzen.'
);

assert.equal(
 syncPolicy.decide({
  localData:localSyncData,
  cloudData:cloudSyncData,
  cloudExists:true
 }).action,
 'conflict',
 'Unterschiedliche Daten ohne verlässliche Zeitstempel müssen als Konflikt gelten.'
);

assert.equal(
 syncPolicy.decide({
  localData:localSyncData,
  cloudData:cloudSyncData,
  cloudExists:true,
  forceCloud:true
 }).action,
 'load-cloud',
 'Eine bestätigte manuelle Cloud-Wiederherstellung muss möglich bleiben.'
);

assert.equal(
 syncPolicy.decide({
  localData:localSyncData,
  cloudData:localSyncData,
  cloudExists:true
 }).action,
 'unchanged',
 'Identische lokale und Cloud-Daten dürfen keinen Konflikt erzeugen.'
);

assert.equal(
 syncPolicy.signature({
  settings:{theme:'dark'},
  animals:[]
 }),
 syncPolicy.signature({
  animals:[],
  settings:{theme:'dark'}
 }),
 'Die Inhaltsprüfung muss unabhängig von der Reihenfolge der Objektfelder sein.'
);

assert.equal(
 syncPolicy.needsFollowupSave({
  requested:false,
  startedRevision:4,
  currentRevision:5
 }),
 true,
 'Eine Änderung während des Speicherns muss einen weiteren Cloud-Lauf auslösen.'
);

assert.equal(
 syncPolicy.needsFollowupSave({
  requested:false,
  startedRevision:5,
  currentRevision:5
 }),
 false,
 'Ohne weitere Änderung darf kein unnötiger Cloud-Lauf entstehen.'
);

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

const firstWeight=store.recordWeight(
 {animalId:'mixed-2'},
 {date:'2026-07-20',weight:150,source:'profile'}
);
const latestWeight=store.recordWeight(
 {animalId:'mixed-2'},
 {date:'2026-07-25',weight:160,source:'chat'}
);

store.recordWeight(
 {animalId:'mixed-2'},
 {date:'2026-07-10',weight:140,source:'assistant'}
);

assert.equal(
 latestWeight.event.source,
 'chat',
 'Der zentrale Gewichtspfad muss die Herkunft speichern.'
);
assert.equal(
 store.getAnimalById('mixed-2').weight,
 160,
 'Das Kompatibilitätsgewicht muss dem zeitlich neuesten Eintrag entsprechen.'
);

const weightCount=store.getAnimalById('mixed-2').weights.length;

assert.equal(
 store.recordWeight({animalId:'mixed-2'},{weight:0}),
 null,
 'Ungültige Gewichte dürfen nicht gespeichert werden.'
);
assert.equal(
 store.getAnimalById('mixed-2').weights.length,
 weightCount,
 'Ein ungültiges Gewicht darf die Historie nicht verändern.'
);

const recordedShed=store.recordShed(
 {animalId:'mixed-2'},
 {
  date:'2026-07-21',
  note:'Vollständig',
  source:'profile'
 }
);

assert.equal(
 recordedShed.event.complete,
 true,
 'Eine neue Häutung muss standardmäßig als vollständig gespeichert werden.'
);
assert.equal(
 recordedShed.event.note,
 'Vollständig',
 'Häutungsnotizen müssen erhalten bleiben.'
);

const recordedHealth=store.recordHealth(
 {animalId:'mixed-2'},
 {
  date:'2026-07-22',
  type:'Kontrolle',
  title:'Nachkontrolle',
  status:'abgeschlossen',
  source:'profile'
 }
);

assert.equal(
 recordedHealth.event.title,
 'Nachkontrolle',
 'Gesundheitsfelder müssen über den zentralen Speicherpfad erhalten bleiben.'
);
assert.equal(
 Array.isArray(store.getAnimalById('mixed-2').health),
 true,
 'Die Gesundheitshistorie muss defensiv initialisiert werden.'
);
assert.equal(
 store.deleteHistoryEntry({animalId:'mixed-2'},'documents',0),
 false,
 'Unbekannte Historientypen dürfen nicht gelöscht werden.'
);
assert.equal(
 store.deleteHistoryEntry(
  {animalId:'mixed-2'},
  'weights',
  latestWeight.event.id
 ),
 true,
 'Historieneinträge müssen stabil über ihre ID gelöscht werden können.'
);
assert.equal(
 store.getAnimalById('mixed-2').weight,
 150,
 'Nach dem Löschen muss das Kompatibilitätsgewicht neu berechnet werden.'
);
assert.equal(
 store.deleteHistoryEntry(
  {animalId:'mixed-2'},
  'health',
  recordedHealth.event.id
 ),
 true,
 'Gesundheitseinträge müssen über den gemeinsamen Löschpfad entfernt werden.'
);
assert.ok(
 firstWeight.event.id,
 'Zentrale Historieneinträge müssen eine stabile ID erhalten.'
);

const firstPhoto=store.addAnimalPhoto(
 {animalId:'mixed-2'},
 {
  id:'photo-first',
  url:'https://example.test/first.jpg',
  type:'Profil',
  cover:false
 }
);

assert.equal(
 firstPhoto.photo.cover,
 true,
 'Das erste verwendbare Foto muss automatisch zum Titelbild werden.'
);

const secondPhoto=store.addAnimalPhoto(
 {animalId:'mixed-2'},
 {
  id:'photo-second',
  thumbUrl:'https://example.test/second-thumb.jpg',
  url:'https://example.test/second.jpg',
  type:'Sonstige',
  cover:false
 }
);

assert.equal(
 secondPhoto.photo.cover,
 false,
 'Ein weiteres Foto darf ein vorhandenes Titelbild nicht ungefragt ersetzen.'
);
assert.equal(
 store.setAnimalCoverPhoto(
  {animalId:'mixed-2'},
  'photo-second'
 ),
 true,
 'Das Titelbild muss stabil ueber die Foto-ID gesetzt werden koennen.'
);
assert.equal(
 store.getAnimalById('mixed-2').photos[0].cover,
 false,
 'Beim Titelbildwechsel muss das bisherige Titelbild abgewaehlt werden.'
);
assert.equal(
 store.getAnimalById('mixed-2').photos[1].cover,
 true,
 'Beim Titelbildwechsel muss das gewaehlte Foto markiert werden.'
);

const removedPhoto=store.deleteAnimalPhoto(
 {animalId:'mixed-2'},
 'photo-second'
);

assert.equal(
 removedPhoto.photo.id,
 'photo-second',
 'Fotos muessen stabil ueber ihre ID geloescht werden koennen.'
);
assert.equal(
 store.getAnimalById('mixed-2').photos[0].cover,
 true,
 'Nach dem Loeschen des Titelbilds muss ein verbleibendes Foto nachruecken.'
);
assert.equal(
 store.addAnimalPhoto(
  {animalId:'mixed-2'},
  {id:'photo-empty'}
 ),
 null,
 'Fotos ohne verwendbare Bildquelle duerfen nicht gespeichert werden.'
);
assert.equal(
 store.deleteAnimalPhoto(
  {animalId:'mixed-2'},
  'photo-missing'
 ),
 null,
 'Eine unbekannte Foto-ID darf die Galerie nicht veraendern.'
);

const migratedPhotoList=[{
 id:'photo-migrated',
 url:'https://example.test/migrated.jpg',
 type:'Migration',
 cover:true
}];
const replacedPhotos=
 store.replaceAnimalPhotos(
  {animalId:'mixed-2'},
  migratedPhotoList
 );

assert.equal(
 replacedPhotos.length,
 1,
 'Eine vollstaendige Foto-Migration muss die Galerie gemeinsam ersetzen.'
);
assert.equal(
 replacedPhotos[0].id,
 'photo-migrated',
 'Migrierte Fotometadaten muessen erhalten bleiben.'
);

migratedPhotoList[0].type='Nachtraeglich veraendert';

assert.equal(
 store.getAnimalById('mixed-2').photos[0].type,
 'Migration',
 'Der Store muss die uebergebene Migrationsliste defensiv kopieren.'
);
assert.equal(
 store.replaceAnimalPhotos(
  {animalId:'mixed-2'},
  null
 ),
 null,
 'Ungueltige Migrationsdaten duerfen die Galerie nicht ersetzen.'
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

const savedInventoryItem=
 store.saveFoodInventoryItem({
  id:'food-crud',
  category:'Insekten',
  condition:'Lebend',
  itemName:'Heimchen',
  variant:'mittel',
  unit:'Dose',
  qty:3,
  minimum:2,
  label:'Lebend Heimchen mittel'
 });

assert.equal(
 savedInventoryItem.id,
 'food-crud',
 'Eine neue Futterposition muss ihre vorgegebene ID behalten.'
);
assert.equal(
 savedInventoryItem.qty,
 3,
 'Eine neue Futterposition muss ihren Bestand speichern.'
);

const updatedInventoryItem=
 store.saveFoodInventoryItem({
  id:'food-crud',
  qty:6,
  minimum:4
 });

assert.equal(
 updatedInventoryItem.itemName,
 'Heimchen',
 'Beim Bearbeiten muessen nicht uebergebene Metadaten erhalten bleiben.'
);
assert.equal(
 updatedInventoryItem.qty,
 6,
 'Eine vorhandene Futterposition muss ueber ihre ID aktualisiert werden.'
);
assert.equal(
 store.adjustFoodInventoryItem(
  'food-crud',
  -2
 ).qty,
 4,
 'Bestandsaenderungen per ID muessen gespeichert werden.'
);
assert.equal(
 store.adjustFoodInventoryItem(
  'food-crud',
  -99
 ).qty,
 0,
 'Bestandsaenderungen per ID duerfen keinen negativen Bestand erzeugen.'
);
assert.equal(
 store.adjustFoodInventoryItem(
  'food-crud',
  'ungueltig'
 ),
 null,
 'Ungueltige Bestandsaenderungen duerfen nicht gespeichert werden.'
);
assert.equal(
 store.deleteFoodInventoryItem(
  'food-crud'
 ).id,
 'food-crud',
 'Futterpositionen muessen stabil ueber ihre ID geloescht werden koennen.'
);
assert.equal(
 store.deleteFoodInventoryItem(
  'food-crud'
 ),
 null,
 'Eine bereits entfernte Futterposition darf nicht erneut geloescht werden.'
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

const stockCountBefore=store.data().foodInventory.length;
const stockSet=store.updateFoodStock(
 'Frost Ratte 150 g',
 {mode:'set',qty:8}
);

assert.equal(
 stockSet.id,
 'food-150',
 'Eine Bestandskorrektur muss die vorhandene Position statt eines Duplikats verwenden.'
);
assert.equal(
 stockSet.qty,
 8,
 'Der Modus set muss den Bestand absolut setzen.'
);
assert.equal(
 stockSet.minimum,
 9,
 'Bestandskorrekturen duerfen Metadaten der Position nicht verlieren.'
);
assert.equal(
 store.data().foodInventory.length,
 stockCountBefore,
 'Eine bekannte Futterposition darf nicht doppelt angelegt werden.'
);

assert.equal(
 store.updateFoodStock(
  'Frost Ratte 150 g',
  {mode:'add',qty:-3}
 ).qty,
 5,
 'Der Modus add muss relative Bestandsaenderungen anwenden.'
);
assert.equal(
 store.updateFoodStock(
  'Frost Ratte 150 g',
  {mode:'add',qty:-99}
 ).qty,
 0,
 'Relative Bestandsaenderungen duerfen keinen negativen Bestand erzeugen.'
);

const createdStock=store.updateFoodStock(
 'Lebend Maus 20 g',
 {mode:'add',qty:4}
);

assert.equal(
 createdStock.qty,
 4,
 'Eine neue erkannte Futterposition muss mit dem angeforderten Bestand entstehen.'
);
assert.ok(
 createdStock.id&&createdStock.label&&createdStock.key,
 'Neue Futterpositionen muessen kanonisch normalisiert werden.'
);

const stockCountAfterCreate=store.data().foodInventory.length;

assert.equal(
 store.updateFoodStock('',{mode:'set',qty:3}),
 null,
 'Leere Futterbezeichnungen duerfen nicht gespeichert werden.'
);
assert.equal(
 store.updateFoodStock('Frost Ratte 150 g',{mode:'replace',qty:3}),
 null,
 'Unbekannte Bestandsmodi duerfen nicht gespeichert werden.'
);
assert.equal(
 store.updateFoodStock('Frost Ratte 150 g',{mode:'set',qty:'ungueltig'}),
 null,
 'Ungueltige Mengen duerfen nicht gespeichert werden.'
);
assert.equal(
 store.data().foodInventory.length,
 stockCountAfterCreate,
 'Ungueltige Bestandsaenderungen duerfen den Bestand nicht veraendern.'
);

const animalWithDefaultFeeder=
 store.setAnimalDefaultFeeder(
  {animalId:'mixed-2'},
  'Frost Ratte 150 g'
 );

assert.equal(
 animalWithDefaultFeeder.defaultFeeder,
 'Frost Ratte 150 g',
 'Das Standardfutter muss im kanonischen Feld gespeichert werden.'
);
assert.equal(
 animalWithDefaultFeeder.futterStandard,
 'Frost Ratte 150 g',
 'Das deutsche Legacy-Feld muss synchron gehalten werden.'
);
assert.equal(
 animalWithDefaultFeeder.standardFeed,
 'Frost Ratte 150 g',
 'Das englische Legacy-Feld muss synchron gehalten werden.'
);
assert.equal(
 animalWithDefaultFeeder.defaultFeederId,
 'food-150',
 'Eine passende Bestandsposition muss mit dem Tier verknuepft werden.'
);
assert.equal(
 animalWithDefaultFeeder.foodInventoryId,
 'food-150',
 'Die kompatible Bestands-ID muss synchron gehalten werden.'
);
assert.equal(
 animalWithDefaultFeeder.defaultFeederCondition,
 'Frost',
 'Der Futterzustand muss aus der Bezeichnung abgeleitet werden.'
);
assert.equal(
 animalWithDefaultFeeder.defaultFeederType,
 'Ratte',
 'Der Futtertyp muss aus der Bezeichnung abgeleitet werden.'
);
assert.equal(
 animalWithDefaultFeeder.defaultFeederSize,
 '150 g',
 'Die Futtergroesse muss aus der Bezeichnung abgeleitet werden.'
);
assert.equal(
 animalWithDefaultFeeder.defaultFeederKey,
 store.foodKey('Frost Ratte 150 g'),
 'Der kanonische Futterschluessel muss aktualisiert werden.'
);
assert.equal(
 store.setAnimalDefaultFeeder(
  {animalId:'mixed-2'},
  ''
 ),
 null,
 'Ein leeres Standardfutter darf nicht gespeichert werden.'
);

store.data().settings.theme='dark';
store.data().settings.defaults={
 feedIntervalDays:7
};

const sellerProfile=store.saveSellerProfile({
 name:'TerraControl Test',
 street:'Testweg 1',
 address:'Testweg 1',
 city:'12345 Teststadt',
 phone:'0123456789',
 email:'test@example.test',
 mail:'test@example.test'
});

assert.equal(
 sellerProfile.name,
 'TerraControl Test',
 'Verkaeuferdaten muessen zentral gespeichert werden.'
);
assert.equal(
 store.data().settings.seller.email,
 'test@example.test',
 'Kompatible Kontaktdaten muessen im Store erhalten bleiben.'
);
assert.equal(
 store.data().settings.theme,
 'dark',
 'Andere Einstellungen duerfen beim Speichern des Verkaeufers nicht verloren gehen.'
);
assert.equal(
 Object.hasOwn(
  store.data().settings,
  'defaults'
 ),
 false,
 'Veraltete globale Pflegeintervalle muessen beim Speichern entfernt werden.'
);
assert.equal(
 store.saveSellerProfile(null),
 null,
 'Ungueltige Verkaeuferdaten duerfen nicht gespeichert werden.'
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

const backupEnvelope=store.exportBackup();

assert.equal(
 backupEnvelope.app,
 'TerraControl',
 'Lokale Backups muessen als TerraControl-Datei gekennzeichnet werden.'
);
assert.equal(
 backupEnvelope.type,
 'local-backup',
 'Lokale Backups muessen einen eindeutigen Typ enthalten.'
);
assert.equal(
 backupEnvelope.version,
 '1.0.4-rc.11',
 'Backup-Metadaten muessen der freigegebenen App-Version entsprechen.'
);
assert.ok(
 backupEnvelope.createdAt,
 'Lokale Backups muessen einen Erstellungszeitpunkt enthalten.'
);

const originalBackupAnimalName=
 store.allAnimals()[0].a.name;

backupEnvelope.data.animals[0].name=
 'Nur in der Sicherung';

assert.equal(
 store.allAnimals()[0].a.name,
 originalBackupAnimalName,
 'Exportierte Backup-Daten duerfen keine Live-Referenz auf den Store enthalten.'
);

const importedBackup=
 store.importBackup(
  JSON.stringify(backupEnvelope)
 );

assert.equal(
 importedBackup.animals[0].name,
 'Nur in der Sicherung',
 'Das gemeinsame Importformat muss umhuellte Backup-Dateien laden.'
);
assert.throws(
 function(){
  store.importBackup(
   JSON.stringify({data:null})
  );
 },
 /Backup-Format/,
 'Ungueltige Backup-Huellen muessen vor dem Import abgelehnt werden.'
);

store.importJson(
 fixture('legacy-arrays-v1.json')
);

assert.equal(
 store.data().schemaVersion,
 3,
 'Ein Legacy-Datenbestand ohne Versionsfeld muss auf Schema 3 migriert werden.'
);
assert.equal(
 store.allAnimals().length,
 4,
 'Alle vier alten Bestandslisten muessen vollständig übernommen werden.'
);
assert.deepEqual(
 plain(
  store.allAnimals().map(function(row){
   return row.a.uuid;
  }).sort()
 ),
 [
  'fixture-boa-1',
  'fixture-gecko-1',
  'fixture-koenig-1',
  'fixture-spider-1'
 ],
 'Legacy-UIDs muessen als stabile UUIDs erhalten bleiben.'
);

const migratedLegacyPython=
 store.getAnimalById('fixture-koenig-1');

assert.equal(
 migratedLegacyPython.animalGroup,
 'Königspythons',
 'Die alte Königspython-Liste muss ihre Tiergruppe erhalten.'
);
assert.equal(
 migratedLegacyPython.genus,
 'Python',
 'Das deutsche Legacy-Feld gattung muss in genus übernommen werden.'
);
assert.equal(
 migratedLegacyPython.species,
 'regius',
 'Das deutsche Legacy-Feld spezies muss in species übernommen werden.'
);
assert.equal(
 migratedLegacyPython.defaultFeeder,
 'Frost Ratte 150 g',
 'Das alte Standardfutterfeld muss in das kanonische Feld übernommen werden.'
);
assert.deepEqual(
 plain(
  migratedLegacyPython.feeds.map(function(feed){
   return feed.date;
  })
 ),
 [
  '2026-03-01',
  '2026-03-02'
 ],
 'Legacy-Historien muessen beim Import chronologisch sortiert werden.'
);
assert.equal(
 Object.hasOwn(
  migratedLegacyPython.photos[0],
  'data'
 ),
 false,
 'Eingebettete Bilddaten muessen entfernt werden, wenn bereits ein Storage-Bild existiert.'
);
assert.equal(
 store.data().foodInventory[0].minimum,
 5,
 'Alte Futterpositionen müssen den zentralen Standard-Mindestbestand erhalten.'
);
assert.equal(
 store.data().clutches[0].id,
 'fixture-clutch-1',
 'Gelege dürfen bei einer Legacy-Migration nicht verloren gehen.'
);
assert.equal(
 store.data().sales[0].id,
 'fixture-sale-1',
 'Verkäufe dürfen bei einer Legacy-Migration nicht verloren gehen.'
);
assert.equal(
 store.data().archive[0].id,
 'fixture-archive-1',
 'Archiveinträge dürfen bei einer Legacy-Migration nicht verloren gehen.'
);
assert.equal(
 store.data().settings.seller.name,
 'Fixture Halter',
 'Einstellungen dürfen bei einer Legacy-Migration nicht verloren gehen.'
);

store.importJson(
 fixture('mixed-schema-v2.json')
);

assert.equal(
 store.allAnimals().length,
 2,
 'Ein gemischter Schema-2-Bestand darf UUID-Duplikate nicht doppelt importieren.'
);
assert.equal(
 store.getAnimalById('fixture-mixed-1').name,
 'Kanonischer Datensatz',
 'Bei UUID-Duplikaten muss animals[] Vorrang vor alten Bestandslisten haben.'
);
assert.equal(
 store.getAnimalById('fixture-mixed-2').name,
 'Nur in Legacy-Liste',
 'Ein nur in einer Legacy-Liste vorhandenes Tier muss ergänzt werden.'
);
assert.deepEqual(
 plain(
  store.getAnimalById('fixture-mixed-1').weights.map(function(weight){
   return weight.date;
  })
 ),
 [
  '2026-04-01',
  '2026-04-10'
 ],
 'Historien eines kanonischen Schema-2-Datensatzes müssen sortiert werden.'
);
assert.equal(
 store.data().boas.length,
 2,
 'Die Legacy-Kompatibilitätsliste muss nach der Migration aus animals[] neu aufgebaut werden.'
);

store.importJson(
 fixture('canonical-schema-v3.json')
);

assert.equal(
 store.allAnimals().length,
 1,
 'Ein aktueller Schema-3-Bestand darf beim Import keine zusätzlichen Tiere erzeugen.'
);
assert.equal(
 store.getAnimalById('fixture-current-1').publicId,
 'CC-007',
 'Eine vorhandene öffentliche Tier-ID muss unverändert bleiben.'
);
assert.equal(
 store.getAnimalById('fixture-current-1').photos[0].data,
 'data:image/jpeg;base64,NEU',
 'Ein rein lokal gespeichertes Bild muss seine eingebetteten Daten behalten.'
);
assert.equal(
 store.data().foodInventory[0].minimum,
 4,
 'Ein aktueller benutzerdefinierter Mindestbestand muss unverändert bleiben.'
);
assert.equal(
 store.data().settings.seller.name,
 'Aktueller Halter',
 'Aktuelle Einstellungen müssen unverändert erhalten bleiben.'
);

console.log('Store tests passed.');
