(function(){
'use strict';

const COLLECTION_KEYS=[
 'animals',
 'koenig',
 'boas',
 'geckos',
 'spinnen',
 'foodInventory',
 'foodCatalog',
 'breedingPlans',
 'clutches',
 'sales',
 'archive',
 'documents'
];

const FIRESTORE_WARNING_BYTES=
 700*1024;

const FIRESTORE_SAFE_LIMIT_BYTES=
 900*1024;

function isObject(value){
 return (
  value!==null&&
  typeof value==='object'&&
  !Array.isArray(value)
 );
}

function utf8Bytes(value){
 const serialized=
  typeof value==='string'
   ?value
   :JSON.stringify(value||{});

 if(typeof TextEncoder!=='undefined'){
  return new TextEncoder()
   .encode(serialized)
   .length;
 }

 return unescape(
  encodeURIComponent(serialized)
 ).length;
}

function firestoreDocumentBudget(value){
 const bytes=utf8Bytes(value);

 return {
  bytes:bytes,
  warning:
   bytes>=FIRESTORE_WARNING_BYTES,
  blocked:
   bytes>=FIRESTORE_SAFE_LIMIT_BYTES,
  warningBytes:
   FIRESTORE_WARNING_BYTES,
  limitBytes:
   FIRESTORE_SAFE_LIMIT_BYTES,
  remainingBytes:Math.max(
   0,
   FIRESTORE_SAFE_LIMIT_BYTES-bytes
  )
 };
}

function hasData(data){
 if(!isObject(data)){
  return false;
 }

 const hasCollection=
  COLLECTION_KEYS.some(function(key){
   return (
    Array.isArray(data[key])&&
    data[key].length>0
   );
  });

 if(hasCollection){
  return true;
 }

 return (
  isObject(data.settings)&&
  Object.keys(data.settings).length>0
 );
}

function stableValue(value){
 if(Array.isArray(value)){
  return value.map(stableValue);
 }

 if(isObject(value)){
  const result={};

  Object.keys(value)
   .sort()
   .forEach(function(key){
    result[key]=stableValue(value[key]);
   });

  return result;
 }

 return value;
}

function signature(data){
 try{
  return JSON.stringify(
   stableValue(data||{})
  );
 }catch(error){
  return '';
 }
}

function timestamp(value){
 if(
  value&&
  typeof value.toMillis==='function'
 ){
  const millis=Number(value.toMillis());

  return Number.isFinite(millis)
   ?millis
   :0;
 }

 if(typeof value==='number'){
  return Number.isFinite(value)
   ?value
   :0;
 }

 const parsed=Date.parse(value||'');

 return Number.isFinite(parsed)
  ?parsed
  :0;
}

function needsFollowupSave(input){
 input=input||{};

 return (
  input.requested===true||
  Number(input.currentRevision||0)>
   Number(input.startedRevision||0)
 );
}

function result(
 action,
 reason,
 options
){
 return Object.assign(
  {
   action:action,
   reason:reason,
   loadCloud:false,
   uploadLocal:false,
   conflict:false
  },
  options||{}
 );
}

function decide(input){
 input=input||{};

 const localData=
  isObject(input.localData)
   ?input.localData
   :{};
 const cloudData=
  isObject(input.cloudData)
   ?input.cloudData
   :{};

 const localHasData=hasData(localData);
 const cloudHasData=
  input.cloudExists!==false&&
  hasData(cloudData);

 if(
  localHasData&&
  !cloudHasData
 ){
  return result(
   'keep-local',
   'cloud-empty',
   {
    uploadLocal:true
   }
  );
 }

 if(
  !localHasData&&
  cloudHasData
 ){
  return result(
   'load-cloud',
   'local-empty',
   {
    loadCloud:true
   }
  );
 }

 if(
  !localHasData&&
  !cloudHasData
 ){
  return result(
   'no-data',
   'both-empty'
  );
 }

 if(
  signature(localData)===
  signature(cloudData)
 ){
  return result(
   'unchanged',
   'same-data'
  );
 }

 if(input.forceCloud===true){
  return result(
   'load-cloud',
   'manual-cloud-load',
   {
    loadCloud:true
   }
  );
 }

 const localTime=timestamp(
  input.localUpdatedAt
 );
 const cloudTime=timestamp(
  input.cloudUpdatedAt
 );

 if(
  localTime>0&&
  cloudTime>0
 ){
  if(cloudTime>localTime){
   return result(
    'load-cloud',
    'cloud-newer',
    {
     loadCloud:true
    }
   );
  }

  if(localTime>cloudTime){
   return result(
    'keep-local',
    'local-newer',
    {
     uploadLocal:true
    }
   );
  }
 }

 return result(
  'conflict',
  'different-data-without-clear-order',
  {
   conflict:true
  }
 );
}

window.NGTSyncPolicyEngine={
 utf8Bytes:utf8Bytes,
 firestoreDocumentBudget:firestoreDocumentBudget,
 hasData:hasData,
 signature:signature,
 timestamp:timestamp,
 needsFollowupSave:needsFollowupSave,
 decide:decide
};

})();
