(function(){
'use strict';

const P=window.NGTTaxonomyInternal;
const C=P&&P.core;

if(!C){
 throw new Error(
  'taxonomy-store.js benoetigt taxonomy-core.js.'
 );
}

const STORAGE_KEY=
 'terracontrol_taxonomy_cache_v1';

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
 db.updatedAt=C.now();

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
  .map(C.cleanText)
  .filter(Boolean);

 values.forEach(function(value){
  database.aliases[
   C.fold(value)
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
 const key=C.recordKey(input);

 if(!key){
  return null;
 }

 const existing=
  db.records[key]||
  null;

 const record=C.createRecord(
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

 return C.clone(record);
}

function resolveAliasKey(value,database){
 const search=C.fold(value);

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
  const direct=C.cleanText(input);

  if(db.records[direct]){
   return C.clone(
    db.records[direct]
   );
  }

  const slugged=C.slug(direct);

  if(db.records[slugged]){
   return C.clone(
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
   return C.clone(
    db.records[aliasKey]
   );
  }

  const parts=C.cleanText(
   direct
  ).split(' ');

  if(parts.length>=2){
   const key=C.speciesKey(
    parts.shift(),
    parts.join(' ')
   );

   if(
    key&&
    db.records[key]
   ){
    return C.clone(
     db.records[key]
    );
   }
  }

  return null;
 }

 const key=C.recordKey(input);

 if(
  key&&
  db.records[key]
 ){
  return C.clone(
   db.records[key]
  );
 }

 const normalized=C.normalizeInput(input);

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
   return C.clone(
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
  return C.clone(
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
 const normalized=C.normalizeInput(input);

 if(!normalized.group){
  return null;
 }

 return find({
  group:normalized.group
 });
}

function findGenus(input){
 const normalized=C.normalizeInput(input);

 if(!normalized.genus){
  return null;
 }

 return find({
  group:normalized.group,
  genus:normalized.genus
 });
}

function findSpecies(input){
 const normalized=C.normalizeInput(input);

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

 return C.cleanText(
  record.image.url||
  ''
 );
}

function imageFor(input){
 const normalized=C.normalizeInput(input);

 const speciesRecord=
  findSpecies(normalized);

 if(imageUrl(speciesRecord)){
  return {
   level:C.LEVELS.SPECIES,
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
   level:C.LEVELS.GENUS,
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
   level:C.LEVELS.GROUP,
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

function removeLocal(input){
 const record=find(input);

 if(!record){
  return false;
 }

 const db=loadDatabase();
 delete db.records[record.key];
 rebuildAliases(db);
 saveDatabase(db);

 return true;
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
  const record=C.createRecord(
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

P.store={
 STORAGE_KEY:STORAGE_KEY,
 emptyDatabase:emptyDatabase,
 loadDatabase:loadDatabase,
 saveDatabase:saveDatabase,
 emitChanged:emitChanged,
 registerAliases:registerAliases,
 rebuildAliases:rebuildAliases,
 resolveAliasKey:resolveAliasKey,
 upsertLocal:upsertLocal,
 ensureLocal:ensureLocal,
 removeLocal:removeLocal,
 find:find,
 findGroup:findGroup,
 findGenus:findGenus,
 findSpecies:findSpecies,
 all:all,
 imageUrl:imageUrl,
 imageFor:imageFor,
 clear:clear,
 exportJson:exportJson,
 importJson:importJson
};

})();
