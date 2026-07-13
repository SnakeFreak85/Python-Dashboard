(function(){
'use strict';

const P=window.NGTTaxonomyInternal;
const C=P&&P.core;
const S=P&&P.store;
const D=P&&P.cloud;

if(!C||!S||!D){
 throw new Error(
  'taxonomy.js benoetigt taxonomy-core.js, taxonomy-store.js und taxonomy-cloud.js.'
 );
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
    D.syncCloud();
   }
  }
 );
}

window.NGTTaxonomy={
 LEVELS:C.LEVELS,

 normalizeInput:C.normalizeInput,
 normalizeGroup:C.normalizeGroup,
 normalizeGenus:C.normalizeGenus,
 normalizeSpecies:C.normalizeSpecies,

 scientificName:C.scientificName,
 slug:C.slug,
 groupKey:C.groupKey,
 genusKey:C.genusKey,
 speciesKey:C.speciesKey,
 recordKey:C.recordKey,

 find:S.find,
 findGroup:S.findGroup,
 findGenus:S.findGenus,
 findSpecies:S.findSpecies,
 all:S.all,

 upsert:D.upsert,
 upsertLocal:S.upsertLocal,
 ensure:D.ensure,
 ensureLocal:S.ensureLocal,
 remove:D.remove,
 clear:S.clear,

 getCloudRecord:D.getCloudRecord,
 saveCloudRecord:D.saveCloudRecord,
 syncCloud:D.syncCloud,
 cloudState:D.cloudState,

 imageFor:S.imageFor,
 setImage:D.setImage,
 markImageSearching:D.markImageSearching,
 markImageFailed:D.markImageFailed,

 exportJson:S.exportJson,
 importJson:S.importJson
};

})();
