(function(){
'use strict';

const P=window.NGTTaxonomyInternal=
 window.NGTTaxonomyInternal||{};

const LEVELS={
 GROUP:'group',
 GENUS:'genus',
 SPECIES:'species'
};

const EMPTY_IMAGE={
 url:'',storagePath:'',sourceUrl:'',source:'',author:'',
 license:'',licenseUrl:'',width:0,height:0
};

const GENUS_ALIASES={
 poeci:'Poecilotheria',poec:'Poecilotheria',
 brachy:'Brachypelma',brachypelma:'Brachypelma',
 caribena:'Caribena',avicularia:'Avicularia',
 theraphosa:'Theraphosa',theraposa:'Theraphosa',
 python:'Python',testudo:'Testudo'
};

function clone(value){
 try{return JSON.parse(JSON.stringify(value));}
 catch(error){return value;}
}

function now(){return new Date().toISOString();}

function cleanText(value){
 return String(value||'').replace(/\s+/g,' ').trim();
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
 if(!text)return '';
 return text.charAt(0).toUpperCase()+text.slice(1).toLowerCase();
}

function normalizeGroup(value){return cleanText(value);}

function normalizeGenus(value){
 const text=cleanText(value);
 if(!text)return '';
 const folded=fold(text);
 if(GENUS_ALIASES[folded])return GENUS_ALIASES[folded];
 if(/^[a-z]\.$/i.test(text))return text.toUpperCase();
 return capitalize(text);
}

function normalizeSpecies(value){
 const text=cleanText(value);
 if(!text)return '';
 return text.toLowerCase().replace(/^\.+|\.+$/g,'').replace(/\s+/g,' ');
}

function slug(value){
 return fold(value).replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'');
}

function groupKey(group){
 const value=normalizeGroup(group);
 return value?'group-'+slug(value):'';
}

function genusKey(genus){
 const value=normalizeGenus(genus);
 return value?'genus-'+slug(value):'';
}

function speciesKey(genus,species){
 const normalizedGenus=normalizeGenus(genus);
 const normalizedSpecies=normalizeSpecies(species);
 if(!normalizedGenus||!normalizedSpecies)return '';
 return slug(normalizedGenus+' '+normalizedSpecies);
}

function normalizeInput(input){
 const source=input||{};
 const group=normalizeGroup(source.group||source.animalGroup||source.tiergruppe||'');
 let genus=normalizeGenus(source.genus||source.gattung||'');
 let species=normalizeSpecies(
  source.species||source.spezies||source.art||source.subspecies||source.unterart||''
 );

 if(genus&&genus.includes(' ')&&!species){
  const parts=cleanText(genus).split(' ');
  genus=normalizeGenus(parts.shift());
  species=normalizeSpecies(parts.join(' '));
 }

 if(species&&species.includes(' ')){
  const parts=cleanText(species).split(' ');
  if(genus&&fold(parts[0])===fold(genus)){
   parts.shift();
   species=normalizeSpecies(parts.join(' '));
  }
 }

 const name=[genus,species].filter(Boolean).join(' ');
 return {
  group:group,genus:genus,species:species,scientificName:name,
  groupKey:groupKey(group),genusKey:genusKey(genus),
  speciesKey:speciesKey(genus,species)
 };
}

function scientificName(input){return normalizeInput(input).scientificName;}

function normalizeImage(image){
 const source=image||{};
 return {
  url:cleanText(source.url||source.imageUrl||''),
  storagePath:cleanText(source.storagePath||source.imageStoragePath||''),
  sourceUrl:cleanText(source.sourceUrl||''),source:cleanText(source.source||''),
  author:cleanText(source.author||source.artist||''),
  license:cleanText(source.license||''),licenseUrl:cleanText(source.licenseUrl||''),
  width:Number(source.width||0),height:Number(source.height||0)
 };
}

function recordKey(input){
 const normalized=normalizeInput(input);
 return normalized.speciesKey||normalized.genusKey||normalized.groupKey||'';
}

function recordLevel(input){
 const normalized=normalizeInput(input);
 if(normalized.speciesKey)return LEVELS.SPECIES;
 if(normalized.genusKey)return LEVELS.GENUS;
 if(normalized.groupKey)return LEVELS.GROUP;
 return '';
}

function uniqueStrings(values){
 return Array.from(new Set((values||[]).map(cleanText).filter(Boolean)));
}

function createRecord(input,existing){
 const normalized=normalizeInput(input);
 const old=existing||{};
 const timestamp=now();
 const key=recordKey(normalized);
 const level=recordLevel(normalized);
 if(!key||!level)return null;

 return {
  id:key,key:key,level:level,
  group:normalized.group,genus:normalized.genus,species:normalized.species,
  scientificName:normalized.scientificName,
  germanName:cleanText(input&&(input.germanName||input.commonName||input.deutscherName||old.germanName)),
  image:normalizeImage(input&&input.image?input.image:old.image||EMPTY_IMAGE),
  imageStatus:cleanText(input&&input.imageStatus?input.imageStatus:old.imageStatus||'empty'),
  aliases:uniqueStrings([].concat(old.aliases||[]).concat(input&&Array.isArray(input.aliases)?input.aliases:[])),
  sourceData:Object.assign({},old.sourceData||{},input&&input.sourceData?clone(input.sourceData):{}),
  createdBy:cleanText(input&&input.createdBy||old.createdBy||''),
  updatedBy:cleanText(input&&input.updatedBy||old.updatedBy||''),
  createdAt:old.createdAt||cleanText(input&&input.createdAt)||timestamp,
  updatedAt:cleanText(input&&input.updatedAt)||timestamp
 };
}

function timestampValue(value){
 const timestamp=Date.parse(value||'');
 return Number.isFinite(timestamp)?timestamp:0;
}

function recordScore(record){
 if(!record)return 0;
 let score=0;
 if(record.image){
  if(record.image.url)score+=100;
  if(record.image.storagePath)score+=100;
  if(record.image.license)score+=10;
  if(record.image.author)score+=5;
 }
 if(record.scientificName)score+=20;
 if(record.germanName)score+=10;
 score+=(record.aliases||[]).length;
 return score;
}

function chooseRecord(localRecord,cloudRecord){
 if(!localRecord)return cloudRecord?clone(cloudRecord):null;
 if(!cloudRecord)return clone(localRecord);
 const localTime=timestampValue(localRecord.updatedAt);
 const cloudTime=timestampValue(cloudRecord.updatedAt);
 if(cloudTime>localTime)return clone(cloudRecord);
 if(localTime>cloudTime)return clone(localRecord);
 return recordScore(cloudRecord)>recordScore(localRecord)
  ?clone(cloudRecord):clone(localRecord);
}

function mergeRecord(localRecord,cloudRecord){
 const selected=chooseRecord(localRecord,cloudRecord);
 if(!selected)return null;
 const secondary=selected===localRecord?cloudRecord:localRecord;
 return createRecord(Object.assign({},secondary||{},selected,{
  aliases:uniqueStrings([].concat(localRecord&&localRecord.aliases||[]).concat(cloudRecord&&cloudRecord.aliases||[])),
  sourceData:Object.assign({},localRecord&&localRecord.sourceData||{},cloudRecord&&cloudRecord.sourceData||{},selected.sourceData||{})
 }),selected);
}

P.core={
 LEVELS:LEVELS,EMPTY_IMAGE:EMPTY_IMAGE,
 clone:clone,now:now,cleanText:cleanText,fold:fold,
 normalizeGroup:normalizeGroup,normalizeGenus:normalizeGenus,
 normalizeSpecies:normalizeSpecies,normalizeInput:normalizeInput,
 scientificName:scientificName,slug:slug,groupKey:groupKey,
 genusKey:genusKey,speciesKey:speciesKey,normalizeImage:normalizeImage,
 recordKey:recordKey,recordLevel:recordLevel,uniqueStrings:uniqueStrings,
 createRecord:createRecord,timestampValue:timestampValue,
 recordScore:recordScore,chooseRecord:chooseRecord,mergeRecord:mergeRecord
};

})();
