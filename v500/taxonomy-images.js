(function(){
'use strict';

const COMMONS_API=
 'https://commons.wikimedia.org/w/api.php';

const DEFAULT_LIMIT=8;
const MAX_LIMIT=16;
const MAX_SOURCE_SIZE=12*1024*1024;

const ALLOWED_MIME_TYPES=[
 'image/jpeg',
 'image/png',
 'image/webp'
];

const ALLOWED_LICENSE_PATTERNS=[
 /^cc0(?:\s|$)/i,
 /^public domain$/i,
 /^pd(?:\s|$|-)/i,
 /^cc by(?:\s|$|-)/i,
 /^cc-by(?:\s|$|-)/i,
 /^cc by-sa(?:\s|$|-)/i,
 /^cc-by-sa(?:\s|$|-)/i
];

const BLOCKED_LICENSE_PATTERNS=[
 /\bnc\b/i,
 /noncommercial/i,
 /\bnd\b/i,
 /no derivatives/i,
 /all rights reserved/i,
 /copyrighted free use/i
];

let activeSearches={};
let activeUploads={};

function cleanText(value){
 return String(value||'')
  .replace(/<[^>]*>/g,' ')
  .replace(/&nbsp;/gi,' ')
  .replace(/&amp;/gi,'&')
  .replace(/&quot;/gi,'"')
  .replace(/&#039;/gi,"'")
  .replace(/&lt;/gi,'<')
  .replace(/&gt;/gi,'>')
  .replace(/\s+/g,' ')
  .trim();
}

function clone(value){
 try{
  return JSON.parse(
   JSON.stringify(value)
  );
 }catch(error){
  return value;
 }
}

function clamp(value,min,max){
 return Math.min(
  max,
  Math.max(
   min,
   Number(value)||0
  )
 );
}

function now(){
 return new Date().toISOString();
}

function emit(type,payload){
 if(
  window.NGT500&&
  NGT500.emit
 ){
  NGT500.emit(
   type,
   payload||{}
  );
 }
}

function taxonomyAvailable(){
 return !!(
  window.NGTTaxonomy&&
  NGTTaxonomy.normalizeInput&&
  NGTTaxonomy.recordKey
 );
}

function normalizedTaxon(input){
 if(!taxonomyAvailable()){
  throw new Error(
   'Das Taxonomie-Modul ist nicht geladen.'
  );
 }

 const normalized=
  NGTTaxonomy.normalizeInput(
   input||{}
  );

 if(
  !normalized.speciesKey&&
  !normalized.genusKey&&
  !normalized.groupKey
 ){
  throw new Error(
   'Für die Bildsuche fehlen Tiergruppe, Gattung oder Art.'
  );
 }

 return normalized;
}

function searchLabel(input){
 const taxon=normalizedTaxon(input);

 return (
  taxon.scientificName||
  taxon.genus||
  taxon.group
 );
}

function searchQueries(input){
 const taxon=normalizedTaxon(input);
 const queries=[];

 if(taxon.scientificName){
  queries.push(
   taxon.scientificName
  );
 }

 if(
  taxon.genus&&
  taxon.species
 ){
  queries.push(
   '"'+
   taxon.genus+
   ' '+
   taxon.species+
   '"'
  );
 }

 if(taxon.genus){
  queries.push(
   taxon.genus
  );
 }

 if(taxon.group){
  queries.push(
   taxon.group
  );
 }

 return Array.from(
  new Set(
   queries
    .map(cleanText)
    .filter(Boolean)
  )
 );
}

function extValue(metadata,key){
 if(
  !metadata||
  !metadata[key]
 ){
  return '';
 }

 const value=
  metadata[key].value!==undefined
   ?metadata[key].value
   :metadata[key];

 return cleanText(value);
}

function licenseAllowed(license){
 const value=cleanText(license);

 if(!value){
  return false;
 }

 if(
  BLOCKED_LICENSE_PATTERNS.some(
   function(pattern){
    return pattern.test(value);
   }
  )
 ){
  return false;
 }

 return ALLOWED_LICENSE_PATTERNS.some(
  function(pattern){
   return pattern.test(value);
  }
 );
}

function normalizeLicense(metadata){
 return {
  license:
   extValue(
    metadata,
    'LicenseShortName'
   )||
   extValue(
    metadata,
    'UsageTerms'
   ),

  licenseUrl:
   extValue(
    metadata,
    'LicenseUrl'
   )
 };
}

function fileExtension(
 mimeType,
 sourceUrl
){
 const mime=cleanText(
  mimeType
 ).toLowerCase();

 if(mime==='image/png'){
  return 'png';
 }

 if(mime==='image/webp'){
  return 'webp';
 }

 if(mime==='image/jpeg'){
  return 'jpg';
 }

 const match=String(
  sourceUrl||''
 ).match(
  /\.([a-z0-9]{2,5})(?:\?|$)/i
 );

 const extension=
  match
   ?match[1].toLowerCase()
   :'jpg';

 if(extension==='jpeg'){
  return 'jpg';
 }

 if(
  ['jpg','png','webp'].includes(
   extension
  )
 ){
  return extension;
 }

 return 'jpg';
}

function candidateFromPage(page){
 const info=
  page&&
  Array.isArray(page.imageinfo)
   ?page.imageinfo[0]
   :null;

 if(!info){
  return null;
 }

 const metadata=
  info.extmetadata||{};

 const licenseInfo=
  normalizeLicense(metadata);

 const mimeType=
  cleanText(
   info.mime||''
  ).toLowerCase();

 if(
  !ALLOWED_MIME_TYPES.includes(
   mimeType
  )
 ){
  return null;
 }

 if(
  !licenseAllowed(
   licenseInfo.license
  )
 ){
  return null;
 }

 const originalUrl=
  cleanText(info.url);

 const previewUrl=
  cleanText(
   info.thumburl||
   info.url
  );

 if(
  !originalUrl||
  !previewUrl
 ){
  return null;
 }

 return {
  id:String(
   page.pageid||
   page.title||
   originalUrl
  ),

  title:cleanText(
   page.title||''
  ).replace(
   /^File:/i,
   ''
  ),

  pageTitle:cleanText(
   page.title||''
  ),

  previewUrl:previewUrl,
  originalUrl:originalUrl,

  descriptionUrl:cleanText(
   info.descriptionurl||
   info.descriptionshorturl||
   ''
  ),

  mimeType:mimeType,

  width:Number(
   info.width||0
  ),

  height:Number(
   info.height||0
  ),

  size:Number(
   info.size||0
  ),

  author:
   extValue(metadata,'Artist')||
   extValue(metadata,'Credit')||
   cleanText(info.user||''),

  credit:
   extValue(metadata,'Credit'),

  description:
   extValue(
    metadata,
    'ImageDescription'
   )||
   extValue(
    metadata,
    'ObjectName'
   ),

  license:licenseInfo.license,
  licenseUrl:
   licenseInfo.licenseUrl,

  source:'Wikimedia Commons',

  sourceUrl:
   cleanText(
    info.descriptionurl||
    info.descriptionshorturl||
    ''
   ),

  repository:
   cleanText(
    page.imagerepository||
    'local'
   ),

  fetchedAt:now()
 };
}

function buildSearchUrl(
 query,
 limit
){
 const params=
  new URLSearchParams({
   origin:'*',
   action:'query',
   format:'json',
   formatversion:'2',

   generator:'search',
   gsrsearch:query,
   gsrnamespace:'6',
   gsrlimit:String(limit),

   prop:'imageinfo',

   iiprop:[
    'url',
    'size',
    'mime',
    'user',
    'extmetadata'
   ].join('|'),

   iiurlwidth:'900',

   iiextmetadatalanguage:'de',

   iiextmetadatafilter:[
    'Artist',
    'Credit',
    'LicenseShortName',
    'LicenseUrl',
    'UsageTerms',
    'ImageDescription',
    'ObjectName'
   ].join('|')
  });

 return (
  COMMONS_API+
  '?'+
  params.toString()
 );
}

async function fetchJson(url){
 const response=await fetch(
  url,
  {
   method:'GET',
   mode:'cors',
   credentials:'omit',
   cache:'no-store',
   headers:{
    Accept:'application/json'
   }
  }
 );

 if(!response.ok){
  throw new Error(
   'Bildsuche fehlgeschlagen: HTTP '+
   response.status
  );
 }

 return response.json();
}

function candidateScore(
 candidate,
 taxon
){
 const title=cleanText(
  candidate.title
 ).toLowerCase();

 const description=cleanText(
  candidate.description
 ).toLowerCase();

 const scientificName=
  cleanText(
   taxon.scientificName
  ).toLowerCase();

 const genus=
  cleanText(
   taxon.genus
  ).toLowerCase();

 const species=
  cleanText(
   taxon.species
  ).toLowerCase();

 const group=
  cleanText(
   taxon.group
  ).toLowerCase();

 let score=0;

 if(
  scientificName&&
  title.includes(scientificName)
 ){
  score+=200;
 }

 if(
  scientificName&&
  description.includes(
   scientificName
  )
 ){
  score+=120;
 }

 if(
  genus&&
  title.includes(genus)
 ){
  score+=65;
 }

 if(
  species&&
  title.includes(species)
 ){
  score+=75;
 }

 if(
  genus&&
  description.includes(genus)
 ){
  score+=35;
 }

 if(
  species&&
  description.includes(species)
 ){
  score+=45;
 }

 if(
  group&&
  title.includes(group)
 ){
  score+=20;
 }

 if(
  candidate.width>=600&&
  candidate.height>=400
 ){
  score+=20;
 }

 if(
  candidate.width>=1000&&
  candidate.height>=700
 ){
  score+=15;
 }

 if(
  candidate.size>0&&
  candidate.size<=MAX_SOURCE_SIZE
 ){
  score+=10;
 }

 const ratio=
  candidate.height
   ?candidate.width/
    candidate.height
   :0;

 if(
  ratio>=0.65&&
  ratio<=1.8
 ){
  score+=12;
 }

 if(
  /museum|drawing|illustration|diagram|map|distribution/i.test(
   candidate.title+
   ' '+
   candidate.description
  )
 ){
  score-=35;
 }

 return score;
}

function deduplicateCandidates(
 candidates
){
 const seen={};

 return candidates.filter(
  function(candidate){
   const key=
    candidate.originalUrl||
    candidate.pageTitle||
    candidate.id;

   if(
    !key||
    seen[key]
   ){
    return false;
   }

   seen[key]=true;

   return true;
  }
 );
}

async function searchCommons(
 input,
 options
){
 const opts=options||{};
 const taxon=normalizedTaxon(input);

 const limit=clamp(
  opts.limit||DEFAULT_LIMIT,
  1,
  MAX_LIMIT
 );

 const cacheKey=
  NGTTaxonomy.recordKey(taxon)+
  ':'+
  limit;

 if(activeSearches[cacheKey]){
  return activeSearches[cacheKey];
 }

 activeSearches[cacheKey]=
  (async function(){
   if(
    NGTTaxonomy.markImageSearching
   ){
    await NGTTaxonomy
     .markImageSearching(
      taxon
     );
   }

   emit(
    'taxonomy:image-search-start',
    {
     taxon:clone(taxon)
    }
   );

   try{
    const queries=
     searchQueries(taxon);

    let candidates=[];

    for(const query of queries){
     const data=await fetchJson(
      buildSearchUrl(
       query,
       Math.min(
        12,
        Math.max(
         limit,
         6
        )
       )
      )
     );

     const pages=
      data&&
      data.query&&
      Array.isArray(
       data.query.pages
      )
       ?data.query.pages
       :[];

     candidates=candidates.concat(
      pages
       .map(candidateFromPage)
       .filter(Boolean)
     );

     candidates=
      deduplicateCandidates(
       candidates
      );

     if(
      candidates.length>=limit
     ){
      break;
     }
    }

    candidates=
     deduplicateCandidates(
      candidates
     )
      .map(function(candidate){
       const result=clone(candidate);

       result.score=
        candidateScore(
         result,
         taxon
        );

       return result;
      })
      .sort(function(a,b){
       return b.score-a.score;
      })
      .slice(0,limit);

    if(!candidates.length){
     if(
      NGTTaxonomy.markImageFailed
     ){
      await NGTTaxonomy
       .markImageFailed(
        taxon,
        'Kein frei nutzbares Bild gefunden.'
       );
     }
    }else{
     const existing=
      NGTTaxonomy.find(
       taxon
      )||{};

     await NGTTaxonomy.upsert(
      Object.assign(
       {},
       existing,
       taxon,
       {
        imageStatus:'candidates',

        sourceData:Object.assign(
         {},
         existing.sourceData||{},
         {
          imageSearch:{
           provider:
            'Wikimedia Commons',

           query:
            searchLabel(
             taxon
            ),

           candidateCount:
            candidates.length,

           searchedAt:now()
          }
         }
        )
       }
      )
     );
    }

    emit(
     'taxonomy:image-search-complete',
     {
      taxon:clone(taxon),
      candidates:clone(
       candidates
      )
     }
    );

    return candidates;

   }catch(error){
    if(
     NGTTaxonomy.markImageFailed
    ){
     await NGTTaxonomy
      .markImageFailed(
       taxon,
       error
      );
    }

    emit(
     'taxonomy:image-search-error',
     {
      taxon:clone(taxon),
      error:
       error&&error.message
        ?error.message
        :String(error)
     }
    );

    throw error;

   }finally{
    delete activeSearches[
     cacheKey
    ];
   }
  })();

 return activeSearches[cacheKey];
}

async function firebaseStorageContext(){
 if(
  !window.NGTFirebaseSync||
  !NGTFirebaseSync.getContext
 ){
  throw new Error(
   'Firebase ist nicht geladen.'
  );
 }

 const context=
  await NGTFirebaseSync.getContext();

 if(
  !context||
  !context.user
 ){
  throw new Error(
   'Für das Speichern eines Artenbildes ist eine Firebase-Anmeldung erforderlich.'
  );
 }

 if(
  !context.storage||
  !context.storageMod
 ){
  throw new Error(
   'Firebase Storage ist nicht verfügbar.'
  );
 }

 return context;
}

async function downloadCandidateBlob(
 candidate
){
 if(
  !candidate||
  !candidate.originalUrl
 ){
  throw new Error(
   'Der ausgewählte Bildtreffer ist ungültig.'
  );
 }

 if(
  candidate.size>
  MAX_SOURCE_SIZE
 ){
  throw new Error(
   'Das ausgewählte Bild ist zu groß.'
  );
 }

 const response=await fetch(
  candidate.originalUrl,
  {
   method:'GET',
   mode:'cors',
   credentials:'omit',
   cache:'no-store'
  }
 );

 if(!response.ok){
  throw new Error(
   'Bilddownload fehlgeschlagen: HTTP '+
   response.status
  );
 }

 const blob=await response.blob();

 if(
  !ALLOWED_MIME_TYPES.includes(
   blob.type
  )
 ){
  throw new Error(
   'Das Bildformat wird nicht unterstützt: '+
   (
    blob.type||
    'unbekannt'
   )
  );
 }

 if(
  blob.size>
  MAX_SOURCE_SIZE
 ){
  throw new Error(
   'Das heruntergeladene Bild ist größer als 12 MB.'
  );
 }

 return blob;
}

function storagePathFor(
 taxon,
 candidate,
 blob
){
 const key=
  NGTTaxonomy.recordKey(
   taxon
  );

 const extension=
  fileExtension(
   blob&&blob.type||
   candidate.mimeType,
   candidate.originalUrl
  );

 return (
  'taxonomy/'+
  key+
  '/cover.'+
  extension
 );
}

async function storeCandidate(
 input,
 candidate
){
 const taxon=normalizedTaxon(input);
 const key=
  NGTTaxonomy.recordKey(
   taxon
  );

 if(!key){
  throw new Error(
   'Der Taxonomie-Schlüssel fehlt.'
  );
 }

 if(
  !candidate||
  !licenseAllowed(
   candidate.license
  )
 ){
  throw new Error(
   'Der Bildtreffer besitzt keine freigegebene Lizenz.'
  );
 }

 if(activeUploads[key]){
  return activeUploads[key];
 }

 activeUploads[key]=
  (async function(){
   const context=
    await firebaseStorageContext();

   emit(
    'taxonomy:image-upload-start',
    {
     taxon:clone(taxon),
     candidate:clone(candidate)
    }
   );

   try{
    const blob=
     await downloadCandidateBlob(
      candidate
     );

    const storagePath=
     storagePathFor(
      taxon,
      candidate,
      blob
     );

    const reference=
     context.storageMod.ref(
      context.storage,
      storagePath
     );

    await context.storageMod.uploadBytes(
     reference,
     blob,
     {
      contentType:blob.type,

      customMetadata:{
       taxonKey:key,
       scientificName:
        taxon.scientificName||'',

       group:
        taxon.group||'',

       genus:
        taxon.genus||'',

       species:
        taxon.species||'',

       source:
        'Wikimedia Commons',

       sourceUrl:
        candidate.sourceUrl||'',

       author:
        candidate.author||'',

       license:
        candidate.license||'',

       licenseUrl:
        candidate.licenseUrl||''
      }
     }
    );

    const downloadUrl=
     await context.storageMod
      .getDownloadURL(
       reference
      );

    const saved=
     await NGTTaxonomy.setImage(
      taxon,
      {
       url:downloadUrl,
       storagePath:storagePath,

       source:
        'Wikimedia Commons',

       sourceUrl:
        candidate.sourceUrl||
        candidate.descriptionUrl||
        '',

       author:
        candidate.author||'',

       license:
        candidate.license||'',

       licenseUrl:
        candidate.licenseUrl||'',

       width:Number(
        candidate.width||0
       ),

       height:Number(
        candidate.height||0
       )
      }
     );

    await NGTTaxonomy.upsert(
     Object.assign(
      {},
      saved||{},
      taxon,
      {
       imageStatus:'ready',

       sourceData:Object.assign(
        {},
        saved&&
        saved.sourceData||
        {},

        {
         selectedImage:{
          commonsTitle:
           candidate.pageTitle||'',

          originalUrl:
           candidate.originalUrl||'',

          previewUrl:
           candidate.previewUrl||'',

          selectedAt:now(),

          selectedBy:
           context.user.uid||''
         }
        }
       )
      }
     )
    );

    emit(
     'taxonomy:image-upload-complete',
     {
      taxon:clone(taxon),
      record:clone(
       NGTTaxonomy.find(
        taxon
       )
      )
     }
    );

    return NGTTaxonomy.find(
     taxon
    );

   }catch(error){
    if(
     NGTTaxonomy.markImageFailed
    ){
     await NGTTaxonomy
      .markImageFailed(
       taxon,
       error
      );
    }

    emit(
     'taxonomy:image-upload-error',
     {
      taxon:clone(taxon),
      error:
       error&&error.message
        ?error.message
        :String(error)
     }
    );

    throw error;

   }finally{
    delete activeUploads[key];
   }
  })();

 return activeUploads[key];
}

async function ensureCandidates(
 input,
 options
){
 const taxon=normalizedTaxon(input);

 const existingImage=
  NGTTaxonomy.imageFor(
   taxon
  );

 if(
  existingImage&&
  existingImage.url
 ){
  return {
   existing:true,
   image:existingImage,
   candidates:[]
  };
 }

 const candidates=
  await searchCommons(
   taxon,
   options
  );

 return {
  existing:false,
  image:null,
  candidates:candidates
 };
}

/*
 * Diese Funktion ist absichtlich optional.
 *
 * Sie speichert automatisch nur dann den bestbewerteten
 * Treffer, wenn der Aufrufer ausdrücklich autoSelect:true
 * übergibt. In der Oberfläche verwenden wir später
 * standardmäßig die manuelle Auswahl.
 */
async function ensureImage(
 input,
 options
){
 const opts=options||{};
 const result=
  await ensureCandidates(
   input,
   opts
  );

 if(result.existing){
  return result.image;
 }

 if(
  !opts.autoSelect||
  !result.candidates.length
 ){
  return result;
 }

 return storeCandidate(
  input,
  result.candidates[0]
 );
}

function state(){
 return {
  searches:Object.keys(
   activeSearches
  ),

  uploads:Object.keys(
   activeUploads
  )
 };
}

window.NGTTaxonomyImages={
 searchCommons:searchCommons,
 ensureCandidates:
  ensureCandidates,

 ensureImage:ensureImage,
 storeCandidate:storeCandidate,

 licenseAllowed:
  licenseAllowed,

 searchQueries:
  searchQueries,

 state:state
};

})();