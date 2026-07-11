(function(){
'use strict';

const STORAGE_KEY='terracontrol_taxonomy_cache_v1';
const COLLECTION_NAME='taxonomy';

const LEVELS={
 GROUP:'group',
 GENUS:'genus',
 SPECIES:'species'
};

const EMPTY_IMAGE={
 url:'',
 storagePath:'',
 sourceUrl:'',
 source:'',
 author:'',
 license:'',
 licenseUrl:'',
 width:0,
 height:0
};

const GENUS_ALIASES={
 poeci:'Poecilotheria',
 poec:'Poecilotheria',

 brachy:'Brachypelma',
 brachypelma:'Brachypelma',

 caribena:'Caribena',
 avicularia:'Avicularia',

 theraphosa:'Theraphosa',
 theraposa:'Theraphosa',

 python:'Python',
 testudo:'Testudo'
};

let cloudSyncPromise=null;
let cloudSyncRunning=false;
let lastCloudSyncAt='';

function clone(value){
 try{
  return JSON.parse(
   JSON.stringify(value)
  );
 }catch(error){
  return value;
 }
}

function now(){
 return new Date().toISOString();
}

function cleanText(value){
 return String(value||'')
  .replace(/\s+/g,' ')
  .trim();
}

function fold(value){
 return cleanText(value)
  .toLocaleLowerCase('de-DE')
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g,'')
  .replace(/ß/g,'ss');
}

function capitalize(value){
 const text=cleanText(value);

 if(!text){
  return '';
 }

 return (
  text.charAt(0).toUpperCase()+
  text.slice(1).toLowerCase()
 );
}

function normalizeGroup(value){
 return cleanText(value);
}

function normalizeGenus(value){
 const text=cleanText(value);

 if(!text){
  return '';
 }

 const folded=fold(text);

 if(GENUS_ALIASES[folded]){
  return GENUS_ALIASES[folded];
 }

 if(/^[a-z]\.$/i.test(text)){
  return text.toUpperCase();
 }

 return capitalize(text);
}

function normalizeSpecies(value){
 const text=cleanText(value);

 if(!text){
  return '';
 }

 return text
  .toLowerCase()
  .replace(/^\.+|\.+$/g,'')
  .replace(/\s+/g,' ');
}

function slug(value){
 return fold(value)
  .replace(/[^a-z0-9]+/g,'-')
  .replace(/^-+|-+$/g,'');
}

function groupKey(group){
 const value=normalizeGroup(group);

 if(!value){
  return '';
 }

 return 'group-'+slug(value);
}

function genusKey(genus){
 const value=normalizeGenus(genus);

 if(!value){
  return '';
 }

 return 'genus-'+slug(value);
}

function speciesKey(genus,species){
 const normalizedGenus=normalizeGenus(genus);
 const normalizedSpecies=normalizeSpecies(species);

 if(
  !normalizedGenus||
  !normalizedSpecies
 ){
  return '';
 }

 return slug(
  normalizedGenus+' '+normalizedSpecies
 );
}

function normalizeInput(input){
 const source=input||{};

 const group=normalizeGroup(
  source.group||
  source.animalGroup||
  source.tiergruppe||
  ''
 );

 let genus=normalizeGenus(
  source.genus||
  source.gattung||
  ''
 );

 let species=normalizeSpecies(
  source.species||
  source.spezies||
  source.art||
  source.subspecies||
  source.unterart||
  ''
 );

 if(
  genus&&
  genus.includes(' ')&&
  !species
 ){
  const parts=cleanText(genus).split(' ');

  genus=normalizeGenus(
   parts.shift()
  );

  species=normalizeSpecies(
   parts.join(' ')
  );
 }

 if(
  species&&
  species.includes(' ')
 ){
  const parts=cleanText(species).split(' ');

  if(
   genus&&
   fold(parts[0])===fold(genus)
  ){
   parts.shift();

   species=normalizeSpecies(
    parts.join(' ')
   );
  }
 }

 const name=[
  genus,
  species
 ].filter(Boolean).join(' ');

 return {
  group:group,
  genus:genus,
  species:species,
  scientificName:name,
  groupKey:groupKey(group),
  genusKey:genusKey(genus),
  speciesKey:speciesKey(
   genus,
   species
  )
 };
}

function scientificName(input){
 return normalizeInput(input)
  .scientificName;
}

function emptyDatabase(){
 return {
  schemaVersion:1,
  records:{},
  aliases:{},
  updatedAt:''
 };
}

function loadDatabase(){
 try{
  const parsed=JSON.parse(
   localStorage.getItem(
    STORAGE_KEY
   )||'null'
  );

  if(
   !parsed||
   typeof parsed!=='object'
  ){
   return emptyDatabase();
  }

  parsed.records=
   parsed.records&&
   typeof parsed.records==='object'
    ?parsed.records
    :{};

  parsed.aliases=
   parsed.aliases&&
   typeof parsed.aliases==='object'
    ?parsed.aliases
    :{};

  parsed.schemaVersion=1;

  return parsed;

 }catch(error){
  console.warn(
   'Taxonomie-Cache konnte nicht gelesen werden.',
   error
  );

  return emptyDatabase();
 }
}

function emitChanged(payload){
 if(
  window.NGT500&&
  NGT500.emit
 ){
  NGT500.emit(
   'taxonomy:changed',
   payload||{}
  );
 }
}

function saveDatabase(database,options){
 const db=database||emptyDatabase();
 const opts=options||{};

 db.schemaVersion=1;
 db.updatedAt=now();

 try{
  localStorage.setItem(
   STORAGE_KEY,
   JSON.stringify(db)
  );

  if(!opts.silent){
   emitChanged({
    updatedAt:db.updatedAt
   });
  }

  return true;

 }catch(error){
  console.error(
   'Taxonomie-Cache konnte nicht gespeichert werden.',
   error
  );

  return false;
 }
}

function normalizeImage(image){
 const source=image||{};

 return {
  url:cleanText(
   source.url||
   source.imageUrl||
   ''
  ),

  storagePath:cleanText(
   source.storagePath||
   source.imageStoragePath||
   ''
  ),

  sourceUrl:cleanText(
   source.sourceUrl||
   ''
  ),

  source:cleanText(
   source.source||
   ''
  ),

  author:cleanText(
   source.author||
   source.artist||
   ''
  ),

  license:cleanText(
   source.license||
   ''
  ),

  licenseUrl:cleanText(
   source.licenseUrl||
   ''
  ),

  width:Number(
   source.width||0
  ),

  height:Number(
   source.height||0
  )
 };
}

function recordKey(input){
 const normalized=normalizeInput(input);

 return (
  normalized.speciesKey||
  normalized.genusKey||
  normalized.groupKey||
  ''
 );
}

function recordLevel(input){
 const normalized=normalizeInput(input);

 if(normalized.speciesKey){
  return LEVELS.SPECIES;
 }

 if(normalized.genusKey){
  return LEVELS.GENUS;
 }

 if(normalized.groupKey){
  return LEVELS.GROUP;
 }

 return '';
}

function uniqueStrings(values){
 return Array.from(
  new Set(
   (values||[])
    .map(cleanText)
    .filter(Boolean)
  )
 );
}

function createRecord(input,existing){
 const normalized=normalizeInput(input);
 const old=existing||{};
 const timestamp=now();

 const key=recordKey(normalized);
 const level=recordLevel(normalized);

 if(
  !key||
  !level
 ){
  return null;
 }

 return {
  id:key,
  key:key,
  level:level,

  group:normalized.group,
  genus:normalized.genus,
  species:normalized.species,
  scientificName:
   normalized.scientificName,

  germanName:cleanText(
   input&&(
    input.germanName||
    input.commonName||
    input.deutscherName||
    old.germanName
   )
  ),

  image:normalizeImage(
   input&&input.image
    ?input.image
    :old.image||EMPTY_IMAGE
  ),

  imageStatus:cleanText(
   input&&input.imageStatus
    ?input.imageStatus
    :old.imageStatus||'empty'
  ),

  aliases:uniqueStrings(
   []
    .concat(old.aliases||[])
    .concat(
     input&&Array.isArray(input.aliases)
      ?input.aliases
      :[]
    )
  ),

  sourceData:Object.assign(
   {},
   old.sourceData||{},
   input&&input.sourceData
    ?clone(input.sourceData)
    :{}
  ),

  createdBy:cleanText(
   input&&input.createdBy||
   old.createdBy||
   ''
  ),

  updatedBy:cleanText(
   input&&input.updatedBy||
   old.updatedBy||
   ''
  ),

  createdAt:
   old.createdAt||
   cleanText(
    input&&input.createdAt
   )||
   timestamp,

  updatedAt:
   cleanText(
    input&&input.updatedAt
   )||
   timestamp
 };
}

function registerAliases(database,record){
 if(!record){
  return;
 }

 const values=[
  record.key,
  record.group,
  record.genus,
  record.species,
  record.scientificName,
  record.germanName
 ]
  .concat(record.aliases||[])
  .map(cleanText)
  .filter(Boolean);

 values.forEach(function(value){
  database.aliases[
   fold(value)
  ]=record.key;
 });
}

function rebuildAliases(database){
 database.aliases={};

 Object.keys(
  database.records||{}
 ).forEach(function(key){
  registerAliases(
   database,
   database.records[key]
  );
 });

 return database;
}

function upsertLocal(input,options){
 const opts=options||{};
 const db=loadDatabase();
 const key=recordKey(input);

 if(!key){
  return null;
 }

 const existing=
  db.records[key]||
  null;

 const record=createRecord(
  input,
  existing
 );

 if(!record){
  return null;
 }

 db.records[key]=record;
 registerAliases(db,record);

 saveDatabase(
  db,
  {
   silent:!!opts.silent
  }
 );

 return clone(record);
}

function resolveAliasKey(value,database){
 const search=fold(value);

 if(!search){
  return '';
 }

 return (
  database.aliases[search]||
  ''
 );
}

function find(input){
 const db=loadDatabase();

 if(typeof input==='string'){
  const direct=cleanText(input);

  if(db.records[direct]){
   return clone(
    db.records[direct]
   );
  }

  const slugged=slug(direct);

  if(db.records[slugged]){
   return clone(
    db.records[slugged]
   );
  }

  const aliasKey=resolveAliasKey(
   direct,
   db
  );

  if(
   aliasKey&&
   db.records[aliasKey]
  ){
   return clone(
    db.records[aliasKey]
   );
  }

  const parts=cleanText(
   direct
  ).split(' ');

  if(parts.length>=2){
   const key=speciesKey(
    parts.shift(),
    parts.join(' ')
   );

   if(
    key&&
    db.records[key]
   ){
    return clone(
     db.records[key]
    );
   }
  }

  return null;
 }

 const key=recordKey(input);

 if(
  key&&
  db.records[key]
 ){
  return clone(
   db.records[key]
  );
 }

 const normalized=normalizeInput(input);

 const candidates=[
  normalized.scientificName,
  normalized.genus,
  normalized.group
 ];

 for(const candidate of candidates){
  const aliasKey=resolveAliasKey(
   candidate,
   db
  );

  if(
   aliasKey&&
   db.records[aliasKey]
  ){
   return clone(
    db.records[aliasKey]
   );
  }
 }

 return null;
}

function all(){
 const db=loadDatabase();

 return Object.keys(
  db.records
 ).map(function(key){
  return clone(
   db.records[key]
  );
 }).sort(function(a,b){
  const left=String(
   a.scientificName||
   a.germanName||
   a.group||
   ''
  );

  const right=String(
   b.scientificName||
   b.germanName||
   b.group||
   ''
  );

  return left.localeCompare(
   right,
   'de'
  );
 });
}

function findGroup(input){
 const normalized=normalizeInput(input);

 if(!normalized.group){
  return null;
 }

 return find({
  group:normalized.group
 });
}

function findGenus(input){
 const normalized=normalizeInput(input);

 if(!normalized.genus){
  return null;
 }

 return find({
  group:normalized.group,
  genus:normalized.genus
 });
}

function findSpecies(input){
 const normalized=normalizeInput(input);

 if(
  !normalized.genus||
  !normalized.species
 ){
  return null;
 }

 return find({
  group:normalized.group,
  genus:normalized.genus,
  species:normalized.species
 });
}

function imageUrl(record){
 if(
  !record||
  !record.image
 ){
  return '';
 }

 return cleanText(
  record.image.url||
  ''
 );
}

function imageFor(input){
 const normalized=normalizeInput(input);

 const speciesRecord=
  findSpecies(normalized);

 if(imageUrl(speciesRecord)){
  return {
   level:LEVELS.SPECIES,
   record:speciesRecord,
   url:imageUrl(
    speciesRecord
   )
  };
 }

 const genusRecord=
  findGenus(normalized);

 if(imageUrl(genusRecord)){
  return {
   level:LEVELS.GENUS,
   record:genusRecord,
   url:imageUrl(
    genusRecord
   )
  };
 }

 const groupRecord=
  findGroup(normalized);

 if(imageUrl(groupRecord)){
  return {
   level:LEVELS.GROUP,
   record:groupRecord,
   url:imageUrl(
    groupRecord
   )
  };
 }

 return {
  level:'',
  record:null,
  url:''
 };
}

function timestampValue(value){
 const timestamp=Date.parse(
  value||''
 );

 return Number.isFinite(timestamp)
  ?timestamp
  :0;
}

function recordScore(record){
 if(!record){
  return 0;
 }

 let score=0;

 if(record.image){
  if(record.image.url){
   score+=100;
  }

  if(record.image.storagePath){
   score+=100;
  }

  if(record.image.license){
   score+=10;
  }

  if(record.image.author){
   score+=5;
  }
 }

 if(record.scientificName){
  score+=20;
 }

 if(record.germanName){
  score+=10;
 }

 score+=(
  record.aliases||[]
 ).length;

 return score;
}

function chooseRecord(localRecord,cloudRecord){
 if(!localRecord){
  return cloudRecord
   ?clone(cloudRecord)
   :null;
 }

 if(!cloudRecord){
  return clone(localRecord);
 }

 const localTime=timestampValue(
  localRecord.updatedAt
 );

 const cloudTime=timestampValue(
  cloudRecord.updatedAt
 );

 if(cloudTime>localTime){
  return clone(cloudRecord);
 }

 if(localTime>cloudTime){
  return clone(localRecord);
 }

 return recordScore(cloudRecord)>
  recordScore(localRecord)
   ?clone(cloudRecord)
   :clone(localRecord);
}

function mergeRecord(localRecord,cloudRecord){
 const selected=chooseRecord(
  localRecord,
  cloudRecord
 );

 if(!selected){
  return null;
 }

 const secondary=
  selected===localRecord
   ?cloudRecord
   :localRecord;

 return createRecord(
  Object.assign(
   {},
   secondary||{},
   selected,
   {
    aliases:uniqueStrings(
     []
      .concat(
       localRecord&&localRecord.aliases||[]
      )
      .concat(
       cloudRecord&&cloudRecord.aliases||[]
      )
    ),

    sourceData:Object.assign(
     {},
     localRecord&&localRecord.sourceData||{},
     cloudRecord&&cloudRecord.sourceData||{},
     selected.sourceData||{}
    )
   }
  ),
  selected
 );
}

async function firebaseContext(){
 if(
  !window.NGTFirebaseSync||
  !NGTFirebaseSync.getContext
 ){
  return null;
 }

 try{
  return await NGTFirebaseSync.getContext();
 }catch(error){
  console.warn(
   'Firebase-Kontext für Taxonomie nicht verfügbar.',
   error
  );

  return null;
 }
}

function cloudAvailable(context){
 return !!(
  context&&
  context.db&&
  context.user&&
  context.fsMod
 );
}

function cloudDocumentData(record,context){
 const user=context&&context.user;

 return {
  id:record.id,
  key:record.key,
  level:record.level,

  group:record.group,
  genus:record.genus,
  species:record.species,
  scientificName:
   record.scientificName,

  germanName:
   record.germanName||'',

  image:normalizeImage(
   record.image
  ),

  imageStatus:
   record.imageStatus||'empty',

  aliases:uniqueStrings(
   record.aliases||[]
  ),

  sourceData:clone(
   record.sourceData||{}
  ),

  createdBy:
   record.createdBy||
   (
    user&&user.uid
     ?user.uid
     :''
   ),

  updatedBy:
   user&&user.uid
    ?user.uid
    :record.updatedBy||'',

  createdAt:
   record.createdAt||now(),

  updatedAt:now(),

  updatedAtMs:Date.now()
 };
}

async function getCloudRecord(input){
 const context=await firebaseContext();

 if(!cloudAvailable(context)){
  return null;
 }

 const key=recordKey(input);

 if(!key){
  return null;
 }

 try{
  const reference=
   context.fsMod.doc(
    context.db,
    COLLECTION_NAME,
    key
   );

  const snapshot=
   await context.fsMod.getDoc(
    reference
   );

  if(!snapshot.exists()){
   return null;
  }

  return createRecord(
   Object.assign(
    {},
    snapshot.data()||{},
    {
     key:key,
     id:key
    }
   ),
   snapshot.data()||{}
  );

 }catch(error){
  console.error(
   'Taxonomie-Eintrag konnte nicht aus Firestore geladen werden.',
   key,
   error
  );

  return null;
 }
}

async function saveCloudRecord(record){
 const context=await firebaseContext();

 if(
  !cloudAvailable(context)||
  !record
 ){
  return false;
 }

 try{
  const reference=
   context.fsMod.doc(
    context.db,
    COLLECTION_NAME,
    record.key
   );

  const data=cloudDocumentData(
   record,
   context
  );

  await context.fsMod.setDoc(
   reference,
   data,
   {
    merge:true
   }
  );

  upsertLocal(
   data,
   {
    silent:true
   }
  );

  return true;

 }catch(error){
  console.error(
   'Taxonomie-Eintrag konnte nicht in Firestore gespeichert werden.',
   record.key,
   error
  );

  return false;
 }
}

async function upsert(input,options){
 const opts=options||{};
 const localRecord=upsertLocal(
  input
 );

 if(
  !localRecord||
  opts.localOnly
 ){
  return localRecord;
 }

 await saveCloudRecord(
  localRecord
 );

 return find(
  localRecord.key
 );
}

async function ensureLocal(input){
 const existing=find(input);

 if(existing){
  return existing;
 }

 return upsertLocal(
  Object.assign(
   {},
   input||{},
   {
    imageStatus:'empty'
   }
  )
 );
}

async function ensure(input){
 const normalized=normalizeInput(input);
 const key=recordKey(normalized);

 if(!key){
  return null;
 }

 const localRecord=find(normalized);
 const cloudRecord=await getCloudRecord(
  normalized
 );

 const merged=mergeRecord(
  localRecord,
  cloudRecord
 );

 if(merged){
  const stored=upsertLocal(
   merged,
   {
    silent:true
   }
  );

  if(
   !cloudRecord||
   timestampValue(
    stored.updatedAt
   )>
   timestampValue(
    cloudRecord.updatedAt
   )||
   recordScore(stored)>
   recordScore(cloudRecord)
  ){
   await saveCloudRecord(
    stored
   );
  }

  emitChanged({
   key:key,
   source:
    cloudRecord
     ?'merged'
     :'local'
  });

  return find(key);
 }

 const created=await ensureLocal(
  normalized
 );

 if(created){
  await saveCloudRecord(
   created
  );
 }

 return find(key);
}

async function remove(input,options){
 const opts=options||{};
 const db=loadDatabase();
 const record=find(input);

 if(!record){
  return false;
 }

 delete db.records[
  record.key
 ];

 rebuildAliases(db);
 saveDatabase(db);

 if(opts.cloud!==true){
  return true;
 }

 const context=await firebaseContext();

 if(!cloudAvailable(context)){
  return true;
 }

 try{
  await context.fsMod.deleteDoc(
   context.fsMod.doc(
    context.db,
    COLLECTION_NAME,
    record.key
   )
  );

  return true;

 }catch(error){
  console.error(
   'Taxonomie-Eintrag konnte nicht aus Firestore gelöscht werden.',
   record.key,
   error
  );

  return false;
 }
}

async function syncCloud(){
 if(cloudSyncRunning){
  return cloudSyncPromise;
 }

 cloudSyncRunning=true;

 cloudSyncPromise=(async function(){
  const context=await firebaseContext();

  if(!cloudAvailable(context)){
   return {
    ok:false,
    reason:'not-authenticated',
    loaded:0,
    uploaded:0
   };
  }

  let loaded=0;
  let uploaded=0;

  try{
   const collectionReference=
    context.fsMod.collection(
     context.db,
     COLLECTION_NAME
    );

   const snapshot=
    await context.fsMod.getDocs(
     collectionReference
    );

   const localDb=loadDatabase();
   const cloudMap={};

   snapshot.forEach(function(documentSnapshot){
    const data=documentSnapshot.data()||{};
    const key=documentSnapshot.id;

    const record=createRecord(
     Object.assign(
      {},
      data,
      {
       key:key,
       id:key
      }
     ),
     data
    );

    if(record){
     cloudMap[key]=record;
    }
   });

   const allKeys=new Set(
    []
     .concat(
      Object.keys(
       localDb.records||{}
      )
     )
     .concat(
      Object.keys(cloudMap)
     )
   );

   const recordsToUpload=[];

   allKeys.forEach(function(key){
    const localRecord=
     localDb.records[key]||
     null;

    const cloudRecord=
     cloudMap[key]||
     null;

    const merged=mergeRecord(
     localRecord,
     cloudRecord
    );

    if(!merged){
     return;
    }

    localDb.records[key]=merged;

    if(cloudRecord){
     loaded++;
    }

    if(
     !cloudRecord||
     timestampValue(
      merged.updatedAt
     )>
     timestampValue(
      cloudRecord.updatedAt
     )||
     recordScore(merged)>
     recordScore(cloudRecord)
    ){
     recordsToUpload.push(
      merged
     );
    }
   });

   rebuildAliases(localDb);

   saveDatabase(
    localDb,
    {
     silent:true
    }
   );

   for(const record of recordsToUpload){
    const saved=await saveCloudRecord(
     record
    );

    if(saved){
     uploaded++;
    }
   }

   lastCloudSyncAt=now();

   emitChanged({
    source:'cloud-sync',
    loaded:loaded,
    uploaded:uploaded,
    syncedAt:
     lastCloudSyncAt
   });

   return {
    ok:true,
    loaded:loaded,
    uploaded:uploaded,
    syncedAt:
     lastCloudSyncAt
   };

  }catch(error){
   console.error(
    'Taxonomie-Cloud-Synchronisierung fehlgeschlagen.',
    error
   );

   return {
    ok:false,
    error:
     error&&error.message
      ?error.message
      :String(error),
    loaded:loaded,
    uploaded:uploaded
   };

  }finally{
   cloudSyncRunning=false;
  }
 })();

 return cloudSyncPromise;
}

async function setImage(input,image){
 const existing=
  find(input)||
  {};

 return upsert(
  Object.assign(
   {},
   existing,
   normalizeInput(input),
   {
    image:normalizeImage(image),

    imageStatus:
     image&&(
      image.url||
      image.storagePath
     )
      ?'ready'
      :'empty'
   }
  )
 );
}

async function markImageSearching(input){
 return upsert(
  Object.assign(
   {},
   find(input)||{},
   normalizeInput(input),
   {
    imageStatus:'searching'
   }
  )
 );
}

async function markImageFailed(input,error){
 const existing=
  find(input)||
  {};

 return upsert(
  Object.assign(
   {},
   existing,
   normalizeInput(input),
   {
    imageStatus:'failed',

    sourceData:Object.assign(
     {},
     existing.sourceData||{},
     {
      imageError:cleanText(
       error&&error.message
        ?error.message
        :error
      ),

      imageErrorAt:now()
     }
    )
   }
  )
 );
}

function clear(){
 try{
  localStorage.removeItem(
   STORAGE_KEY
  );

  emitChanged({
   cleared:true
  });

  return true;

 }catch(error){
  return false;
 }
}

function exportJson(){
 return JSON.stringify(
  loadDatabase(),
  null,
  2
 );
}

function importJson(text){
 let parsed=null;

 try{
  parsed=JSON.parse(
   String(text||'{}')
  );

 }catch(error){
  throw new Error(
   'Taxonomie-Datei enthält kein gültiges JSON.'
  );
 }

 if(
  !parsed||
  typeof parsed!=='object'
 ){
  throw new Error(
   'Taxonomie-Datei ist ungültig.'
  );
 }

 const db=emptyDatabase();

 const records=
  parsed.records&&
  typeof parsed.records==='object'
   ?parsed.records
   :{};

 Object.keys(records).forEach(function(key){
  const record=createRecord(
   Object.assign(
    {},
    records[key],
    {
     key:key,
     id:key
    }
   ),
   records[key]
  );

  if(!record){
   return;
  }

  db.records[record.key]=record;
 });

 rebuildAliases(db);
 saveDatabase(db);

 return all();
}

function cloudState(){
 return {
  syncing:cloudSyncRunning,
  lastSyncAt:lastCloudSyncAt
 };
}

if(
 window.NGT500&&
 NGT500.on
){
 NGT500.on(
  'firebase:auth',
  function(event){
   if(
    event&&
    event.signedIn
   ){
    syncCloud();
   }
  }
 );
}

window.NGTTaxonomy={
 LEVELS:LEVELS,

 normalizeInput:normalizeInput,
 normalizeGroup:normalizeGroup,
 normalizeGenus:normalizeGenus,
 normalizeSpecies:normalizeSpecies,

 scientificName:scientificName,
 slug:slug,
 groupKey:groupKey,
 genusKey:genusKey,
 speciesKey:speciesKey,
 recordKey:recordKey,

 find:find,
 findGroup:findGroup,
 findGenus:findGenus,
 findSpecies:findSpecies,
 all:all,

 upsert:upsert,
 upsertLocal:upsertLocal,
 ensure:ensure,
 ensureLocal:ensureLocal,
 remove:remove,
 clear:clear,

 getCloudRecord:getCloudRecord,
 saveCloudRecord:saveCloudRecord,
 syncCloud:syncCloud,
 cloudState:cloudState,

 imageFor:imageFor,
 setImage:setImage,
 markImageSearching:markImageSearching,
 markImageFailed:markImageFailed,

 exportJson:exportJson,
 importJson:importJson
};

})();