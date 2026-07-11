(function(){
'use strict';

const STORAGE_KEY='terracontrol_taxonomy_cache_v1';

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

/*
 * Bekannte Kurz- und Schreibweisen.
 *
 * Diese Liste ersetzt später keine echte Taxonomiequelle.
 * Sie hilft lediglich dabei, typische Nutzereingaben
 * auf einen einheitlichen Namen abzubilden.
 */
const GENUS_ALIASES={
 poeci:'Poecilotheria',
 poec:'Poecilotheria',
 p:'Poecilotheria',

 brachy:'Brachypelma',
 brachypelma:'Brachypelma',

 caribena:'Caribena',
 avicularia:'Avicularia',

 theraphosa:'Theraphosa',
 theraposa:'Theraphosa',

 python:'Python',
 testudo:'Testudo'
};

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

 /*
  * Kurzform wie "P." bleibt ohne bekannte Zuordnung
  * absichtlich unverändert, da sie mehrdeutig sein kann.
  */
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

function scientificName(input){
 const normalized=normalizeInput(input);

 return [
  normalized.genus,
  normalized.species
 ].filter(Boolean).join(' ');
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

 if(!normalizedGenus||!normalizedSpecies){
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

 /*
  * Unterstützt Eingaben wie:
  * "Poecilotheria metallica"
  * im Gattungs- oder Artenfeld.
  */
 if(genus&&genus.includes(' ')&&!species){
  const parts=cleanText(genus).split(' ');

  genus=normalizeGenus(parts.shift());
  species=normalizeSpecies(parts.join(' '));
 }

 if(species&&species.includes(' ')){
  const parts=cleanText(species).split(' ');

  /*
   * Falls das erste Wort bereits der Gattung entspricht,
   * wird es aus dem Artfeld entfernt.
   */
  if(
   genus&&
   fold(parts[0])===fold(genus)
  ){
   parts.shift();
   species=normalizeSpecies(parts.join(' '));
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
  speciesKey:speciesKey(genus,species)
 };
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
   localStorage.getItem(STORAGE_KEY)||'null'
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

function saveDatabase(database){
 const db=database||emptyDatabase();

 db.schemaVersion=1;
 db.updatedAt=now();

 try{
  localStorage.setItem(
   STORAGE_KEY,
   JSON.stringify(db)
  );

  if(
   window.NGT500&&
   NGT500.emit
  ){
   NGT500.emit(
    'taxonomy:changed',
    {
     updatedAt:db.updatedAt
    }
   );
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

  width:Number(source.width||0),
  height:Number(source.height||0)
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

function createRecord(input,existing){
 const normalized=normalizeInput(input);
 const old=existing||{};
 const timestamp=now();

 const key=recordKey(normalized);
 const level=recordLevel(normalized);

 if(!key||!level){
  return null;
 }

 return {
  id:key,
  key:key,
  level:level,

  group:normalized.group,
  genus:normalized.genus,
  species:normalized.species,
  scientificName:normalized.scientificName,

  germanName:cleanText(
   input&&(
    input.germanName||
    input.commonName||
    input.deutscherName
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

  aliases:Array.from(
   new Set(
    []
     .concat(old.aliases||[])
     .concat(
      input&&Array.isArray(input.aliases)
       ?input.aliases
       :[]
     )
     .map(cleanText)
     .filter(Boolean)
   )
  ),

  sourceData:Object.assign(
   {},
   old.sourceData||{},
   input&&input.sourceData
    ?clone(input.sourceData)
    :{}
  ),

  createdAt:old.createdAt||timestamp,
  updatedAt:timestamp
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
  database.aliases[fold(value)]=record.key;
 });
}

function upsert(input){
 const db=loadDatabase();
 const key=recordKey(input);

 if(!key){
  return null;
 }

 const existing=db.records[key]||null;
 const record=createRecord(input,existing);

 if(!record){
  return null;
 }

 db.records[key]=record;

 registerAliases(db,record);
 saveDatabase(db);

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
  const directKey=slug(input);

  if(db.records[directKey]){
   return clone(db.records[directKey]);
  }

  const aliasKey=resolveAliasKey(
   input,
   db
  );

  if(aliasKey&&db.records[aliasKey]){
   return clone(db.records[aliasKey]);
  }

  /*
   * Versucht einen wissenschaftlichen Namen
   * aus einer freien Texteingabe zu bilden.
   */
  const parts=cleanText(input).split(' ');

  if(parts.length>=2){
   const key=speciesKey(
    parts.shift(),
    parts.join(' ')
   );

   if(key&&db.records[key]){
    return clone(db.records[key]);
   }
  }

  return null;
 }

 const key=recordKey(input);

 if(key&&db.records[key]){
  return clone(db.records[key]);
 }

 const normalized=normalizeInput(input);

 const aliasCandidates=[
  normalized.scientificName,
  normalized.genus,
  normalized.group
 ];

 for(const candidate of aliasCandidates){
  const aliasKey=resolveAliasKey(
   candidate,
   db
  );

  if(aliasKey&&db.records[aliasKey]){
   return clone(db.records[aliasKey]);
  }
 }

 return null;
}

function remove(input){
 const db=loadDatabase();
 const record=find(input);

 if(!record){
  return false;
 }

 delete db.records[record.key];

 Object.keys(db.aliases).forEach(function(alias){
  if(db.aliases[alias]===record.key){
   delete db.aliases[alias];
  }
 });

 return saveDatabase(db);
}

function all(){
 const db=loadDatabase();

 return Object.keys(db.records)
  .map(function(key){
   return clone(db.records[key]);
  })
  .sort(function(a,b){
   return String(
    a.scientificName||
    a.germanName||
    a.group||
    ''
   ).localeCompare(
    String(
     b.scientificName||
     b.germanName||
     b.group||
     ''
    ),
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
 if(!record||!record.image){
  return '';
 }

 return cleanText(
  record.image.url||
  ''
 );
}

function imageFor(input){
 const normalized=normalizeInput(input);

 /*
  * Fallback-Reihenfolge:
  *
  * 1. Artenbild
  * 2. Gattungsbild
  * 3. Gruppenbild
  */
 const speciesRecord=findSpecies(normalized);

 if(imageUrl(speciesRecord)){
  return {
   level:LEVELS.SPECIES,
   record:speciesRecord,
   url:imageUrl(speciesRecord)
  };
 }

 const genusRecord=findGenus(normalized);

 if(imageUrl(genusRecord)){
  return {
   level:LEVELS.GENUS,
   record:genusRecord,
   url:imageUrl(genusRecord)
  };
 }

 const groupRecord=findGroup(normalized);

 if(imageUrl(groupRecord)){
  return {
   level:LEVELS.GROUP,
   record:groupRecord,
   url:imageUrl(groupRecord)
  };
 }

 return {
  level:'',
  record:null,
  url:''
 };
}

function ensureLocal(input){
 const existing=find(input);

 if(existing){
  return existing;
 }

 return upsert(
  Object.assign(
   {},
   input||{},
   {
    imageStatus:'empty'
   }
  )
 );
}

/*
 * Öffentliche Ensure-Funktion.
 *
 * In diesem ersten Commit arbeitet sie ausschließlich
 * mit dem lokalen Cache.
 *
 * Im nächsten Commit wird hier Firestore ergänzt.
 * Danach folgt die externe Bildsuche.
 */
async function ensure(input){
 return ensureLocal(input);
}

function setImage(input,image){
 const existing=find(input);

 const payload=Object.assign(
  {},
  existing||{},
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
 );

 return upsert(payload);
}

function markImageSearching(input){
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

function markImageFailed(input,error){
 return upsert(
  Object.assign(
   {},
   find(input)||{},
   normalizeInput(input),
   {
    imageStatus:'failed',

    sourceData:Object.assign(
     {},
     find(input)&&find(input).sourceData
      ?find(input).sourceData
      :{},
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
  localStorage.removeItem(STORAGE_KEY);

  if(
   window.NGT500&&
   NGT500.emit
  ){
   NGT500.emit(
    'taxonomy:changed',
    {
     cleared:true
    }
   );
  }

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
   records[key],
   records[key]
  );

  if(!record){
   return;
  }

  db.records[record.key]=record;
  registerAliases(db,record);
 });

 saveDatabase(db);

 return all();
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
 ensure:ensure,
 ensureLocal:ensureLocal,
 remove:remove,
 clear:clear,

 imageFor:imageFor,
 setImage:setImage,
 markImageSearching:markImageSearching,
 markImageFailed:markImageFailed,

 exportJson:exportJson,
 importJson:importJson
};

})();