(function(){
'use strict';

const P=window.NGTTaxonomyInternal;
const C=P&&P.core;
const S=P&&P.store;

if(!C||!S){
 throw new Error(
  'taxonomy-cloud.js benoetigt taxonomy-core.js und taxonomy-store.js.'
 );
}

const COLLECTION_NAME='taxonomy';

let cloudSyncPromise=null;
let cloudSyncRunning=false;
let lastCloudSyncAt='';

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

  image:C.normalizeImage(
   record.image
  ),

  imageStatus:
   record.imageStatus||'empty',

  aliases:C.uniqueStrings(
   record.aliases||[]
  ),

  sourceData:C.clone(
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
   record.createdAt||C.now(),

  updatedAt:C.now(),

  updatedAtMs:Date.now()
 };
}

async function getCloudRecord(input){
 const context=await firebaseContext();

 if(!cloudAvailable(context)){
  return null;
 }

 const key=C.recordKey(input);

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

  return C.createRecord(
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

  S.upsertLocal(
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
 const localRecord=S.upsertLocal(
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

 return S.find(
  localRecord.key
 );
}

async function ensure(input){
 const normalized=C.normalizeInput(input);
 const key=C.recordKey(normalized);

 if(!key){
  return null;
 }

 const localRecord=S.find(normalized);
 const cloudRecord=await getCloudRecord(
  normalized
 );

 const merged=C.mergeRecord(
  localRecord,
  cloudRecord
 );

 if(merged){
  const stored=S.upsertLocal(
   merged,
   {
    silent:true
   }
  );

  if(
   !cloudRecord||
   C.timestampValue(
    stored.updatedAt
   )>
   C.timestampValue(
    cloudRecord.updatedAt
   )||
   C.recordScore(stored)>
   C.recordScore(cloudRecord)
  ){
   await saveCloudRecord(
    stored
   );
  }

  S.emitChanged({
   key:key,
   source:
    cloudRecord
     ?'merged'
     :'local'
  });

  return S.find(key);
 }

 const created=await S.ensureLocal(
  normalized
 );

 if(created){
  await saveCloudRecord(
   created
  );
 }

 return S.find(key);
}

async function remove(input,options){
 const opts=options||{};
 const db=S.loadDatabase();
 const record=S.find(input);

 if(!record){
  return false;
 }

 delete db.records[
  record.key
 ];

 S.rebuildAliases(db);
 S.saveDatabase(db);

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

   const localDb=S.loadDatabase();
   const cloudMap={};

   snapshot.forEach(function(documentSnapshot){
    const data=documentSnapshot.data()||{};
    const key=documentSnapshot.id;

    const record=C.createRecord(
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

    const merged=C.mergeRecord(
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
     C.timestampValue(
      merged.updatedAt
     )>
     C.timestampValue(
      cloudRecord.updatedAt
     )||
     C.recordScore(merged)>
     C.recordScore(cloudRecord)
    ){
     recordsToUpload.push(
      merged
     );
    }
   });

   S.rebuildAliases(localDb);

   S.saveDatabase(
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

   lastCloudSyncAt=C.now();

   S.emitChanged({
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
  S.find(input)||
  {};

 return upsert(
  Object.assign(
   {},
   existing,
   C.normalizeInput(input),
   {
    image:C.normalizeImage(image),

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
   S.find(input)||{},
   C.normalizeInput(input),
   {
    imageStatus:'searching'
   }
  )
 );
}

async function markImageFailed(input,error){
 const existing=
  S.find(input)||
  {};

 return upsert(
  Object.assign(
   {},
   existing,
   C.normalizeInput(input),
   {
    imageStatus:'failed',

    sourceData:Object.assign(
     {},
     existing.sourceData||{},
     {
      imageError:C.cleanText(
       error&&error.message
        ?error.message
        :error
      ),

      imageErrorAt:C.now()
     }
    )
   }
  )
 );
}

function cloudState(){
 return {
  syncing:cloudSyncRunning,
  lastSyncAt:lastCloudSyncAt
 };
}

P.cloud={
 COLLECTION_NAME:COLLECTION_NAME,
 firebaseContext:firebaseContext,
 cloudAvailable:cloudAvailable,
 cloudDocumentData:cloudDocumentData,
 getCloudRecord:getCloudRecord,
 saveCloudRecord:saveCloudRecord,
 upsert:upsert,
 ensure:ensure,
 remove:remove,
 syncCloud:syncCloud,
 setImage:setImage,
 markImageSearching:markImageSearching,
 markImageFailed:markImageFailed,
 cloudState:cloudState
};

})();
