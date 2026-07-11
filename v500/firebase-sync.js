(function(){
'use strict';

const CONFIG={
 apiKey:"AIzaSyBebc9V-JIDQ7NVx3KkPItFeEjKVOmdxoo",
 authDomain:"terracontrol-4c211.firebaseapp.com",
 projectId:"terracontrol-4c211",
 storageBucket:"terracontrol-4c211.firebasestorage.app",
 messagingSenderId:"641374151767",
 appId:"1:641374151767:web:d4c9546e349aeb4d142f12"
};

const STATE_KEY=
 "terracontrol_firebase_sync_state_v1";

const PROFILE_KEY=
 "tc_user_profile";

let app=null;
let auth=null;
let db=null;
let storage=null;
let user=null;
let mods=null;

let started=false;
let loading=false;
let saving=false;
let timer=null;
let autoSaveReady=false;

function read(key){
 try{
  return JSON.parse(
   localStorage.getItem(key)||"{}"
  )||{};

 }catch(error){
  return {};
 }
}

function write(key,value){
 localStorage.setItem(
  key,
  JSON.stringify(value||{})
 );
}

function state(value){
 if(value){
  write(
   STATE_KEY,
   Object.assign(
    read(STATE_KEY),
    value
   )
  );
 }

 return read(STATE_KEY);
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

function refresh(){
 try{
  if(
   window.NGTDashboard&&
   NGTDashboard.updateCloudStatus
  ){
   NGTDashboard.updateCloudStatus();
  }
 }catch(error){}
}

function setStatus(status,message){
 state({
  status:status,
  message:message||"",
  at:new Date().toISOString()
 });

 refresh();

 emit(
  'firebase:status',
  {
   status:status,
   message:message||''
  }
 );
}

function emptyStoreObject(){
 return {
  koenig:[],
  boas:[],
  geckos:[],
  spinnen:[],
  clutches:[],
  sales:[],
  archive:[],
  foodInventory:[],
  settings:{}
 };
}

function stripLegacyPhotoData(value){
 const clone=JSON.parse(
  JSON.stringify(value||{})
 );

 function cleanAnimal(animal){
  if(
   !animal||
   !Array.isArray(animal.photos)
  ){
   return;
  }

  animal.photos=
   animal.photos.map(function(photo){
    if(!photo){
     return photo;
    }

    const result=
     Object.assign(
      {},
      photo
     );

    if(
     result.storagePath||
     result.url||
     result.thumbPath||
     result.thumbUrl
    ){
     delete result.data;
    }

    return result;
   });
 }

 if(Array.isArray(clone.animals)){
  clone.animals.forEach(
   cleanAnimal
  );
 }

 [
  'koenig',
  'boas',
  'geckos',
  'spinnen'
 ].forEach(function(key){
  if(Array.isArray(clone[key])){
   clone[key].forEach(
    cleanAnimal
   );
  }
 });

 return clone;
}

async function loadSdk(){
 if(mods){
  return mods;
 }

 const appMod=
  await import(
   "https://www.gstatic.com/firebasejs/12.15.0/firebase-app.js"
  );

 const authMod=
  await import(
   "https://www.gstatic.com/firebasejs/12.15.0/firebase-auth.js"
  );

 const fsMod=
  await import(
   "https://www.gstatic.com/firebasejs/12.15.0/firebase-firestore.js"
  );

 const storageMod=
  await import(
   "https://www.gstatic.com/firebasejs/12.15.0/firebase-storage.js"
  );

 mods={
  appMod:appMod,
  authMod:authMod,
  fsMod:fsMod,
  storageMod:storageMod
 };

 return mods;
}

async function init(){
 if(app){
  return;
 }

 const modules=
  await loadSdk();

 if(
  modules.appMod.getApps&&
  modules.appMod.getApps().length
 ){
  app=modules.appMod.getApp();
 }else{
  app=modules.appMod.initializeApp(
   CONFIG
  );
 }

 auth=
  modules.authMod.getAuth(app);

 db=
  modules.fsMod.getFirestore(app);

 storage=
  modules.storageMod.getStorage(app);
}

async function getContext(){
 await init();

 return {
  app:app,
  auth:auth,
  db:db,
  storage:storage,
  user:user,
  mods:mods,

  appMod:mods.appMod,
  authMod:mods.authMod,
  fsMod:mods.fsMod,
  storageMod:mods.storageMod,

  config:Object.assign(
   {},
   CONFIG
  )
 };
}

function currentUser(){
 return user;
}

function isSignedIn(){
 return !!user;
}

function saveProfile(firebaseUser){
 const profile={
  name:
   firebaseUser.displayName||"",

  displayName:
   firebaseUser.displayName||"",

  given_name:
   (
    firebaseUser.displayName||""
   ).split(" ")[0]||"",

  email:
   firebaseUser.email||"",

  picture:
   firebaseUser.photoURL||"",

  sub:
   firebaseUser.uid||"",

  provider:
   "firebase-google",

  updatedAt:
   new Date().toISOString()
 };

 localStorage.setItem(
  PROFILE_KEY,
  JSON.stringify(profile)
 );

 localStorage.setItem(
  "ngt_google_user",
  JSON.stringify(profile)
 );
}

function docRef(){
 return mods.fsMod.doc(
  db,
  "users",
  user.uid,
  "terraControl",
  "main"
 );
}

function hasCloudData(cloud){
 if(
  !cloud||
  !cloud.data
 ){
  return false;
 }

 const data=cloud.data;

 const animalTotal=[
  "koenig",
  "boas",
  "geckos",
  "spinnen"
 ].reduce(function(total,key){
  return total+(
   Array.isArray(data[key])
    ?data[key].length
    :0
  );
 },0);

 const dynamicTotal=
  Array.isArray(data.animals)
   ?data.animals.length
   :0;

 const foodTotal=
  Array.isArray(data.foodInventory)
   ?data.foodInventory.length
   :0;

 const hasSettings=
  data.settings&&
  Object.keys(
   data.settings||{}
  ).length>0;

 return (
  animalTotal>0||
  dynamicTotal>0||
  foodTotal>0||
  hasSettings
 );
}

async function loadCloud(){
 if(!user){
  return false;
 }

 loading=true;
 autoSaveReady=false;

 setStatus(
  "loading",
  "Firestore lädt..."
 );

 try{
  const snapshot=
   await mods.fsMod.getDoc(
    docRef()
   );

  if(snapshot.exists()){
   const cloud=
    snapshot.data()||{};

   if(hasCloudData(cloud)){
    NGTStore.importJson(
     JSON.stringify(
      cloud.data
     )
    );

    setStatus(
     "ok",
     "Firestore geladen"
    );

    return true;
   }

   NGTStore.importJson(
    JSON.stringify(
     emptyStoreObject()
    )
   );

   setStatus(
    "ok",
    "Leerer Cloud-Bestand geladen"
   );

   return false;
  }

  NGTStore.importJson(
   JSON.stringify(
    emptyStoreObject()
   )
  );

  setStatus(
   "ok",
   "Neuer leerer Cloud-Bestand"
  );

  return false;

 }catch(error){
  setStatus(
   "error",
   "Firestore Laden fehlgeschlagen"
  );

  console.error(error);

  return false;

 }finally{
  loading=false;
  autoSaveReady=true;
 }
}

async function saveCloud(){
 if(
  !user||
  loading||
  saving||
  !autoSaveReady
 ){
  return false;
 }

 saving=true;

 setStatus(
  "saving",
  "Firestore speichert..."
 );

 try{
  await mods.fsMod.setDoc(
   docRef(),
   {
    data:
     stripLegacyPhotoData(
      NGTStore.data()
     ),

    updatedAt:
     mods.fsMod.serverTimestamp(),

    updatedAtMs:
     Date.now(),

    version:"1.0.4-rc9"
   },
   {
    merge:true
   }
  );

  setStatus(
   "ok",
   "Firestore synchronisiert"
  );

  return true;

 }catch(error){
  setStatus(
   "error",
   "Firestore Speichern fehlgeschlagen"
  );

  console.error(error);

  return false;

 }finally{
  saving=false;
 }
}

function scheduleSave(){
 if(
  !user||
  loading||
  !autoSaveReady
 ){
  return;
 }

 clearTimeout(timer);

 setStatus(
  "pending",
  "Änderungen werden gespeichert..."
 );

 timer=setTimeout(
  saveCloud,
  1200
 );
}

async function syncTaxonomy(){
 if(
  window.NGTTaxonomy&&
  NGTTaxonomy.syncCloud
 ){
  try{
   return await NGTTaxonomy
    .syncCloud();

  }catch(error){
   console.error(
    'Taxonomie-Synchronisierung fehlgeschlagen.',
    error
   );
  }
 }

 return null;
}

async function signIn(){
 await init();

 autoSaveReady=false;

 const provider=
  new mods.authMod
   .GoogleAuthProvider();

 provider.setCustomParameters({
  prompt:"select_account"
 });

 const result=
  await mods.authMod
   .signInWithPopup(
    auth,
    provider
   );

 user=result.user;

 saveProfile(user);

 emit(
  'firebase:auth',
  {
   signedIn:true,

   user:{
    uid:user.uid||'',
    email:user.email||'',
    displayName:
     user.displayName||''
   }
  }
 );

 await loadCloud();
 await syncTaxonomy();

 if(window.NGT500){
  NGT500.route(
   "dashboard"
  );
 }
}

async function signOut(){
 await init();

 autoSaveReady=false;

 await mods.authMod.signOut(
  auth
 );

 user=null;

 emit(
  'firebase:auth',
  {
   signedIn:false,
   user:null
  }
 );

 setStatus(
  "signed-out",
  "Nicht angemeldet"
 );
}

async function start(){
 if(started){
  return;
 }

 started=true;

 setStatus(
  "starting",
  "Firestore startet..."
 );

 await init();

 mods.authMod.onAuthStateChanged(
  auth,
  async function(firebaseUser){
   user=
    firebaseUser||
    null;

   if(user){
    saveProfile(user);

    setStatus(
     "signed-in",
     "Firebase verbunden"
    );

    emit(
     'firebase:auth',
     {
      signedIn:true,

      user:{
       uid:user.uid||'',
       email:user.email||'',
       displayName:
        user.displayName||''
      }
     }
    );

    await loadCloud();
    await syncTaxonomy();

   }else{
    autoSaveReady=false;

    emit(
     'firebase:auth',
     {
      signedIn:false,
      user:null
     }
    );

    setStatus(
     "signed-out",
     "Firebase-Anmeldung nötig"
    );
   }
  }
 );

 if(
  window.NGT500&&
  NGT500.on
 ){
  NGT500.on(
   "store:changed",
   scheduleSave
  );
 }
}

function label(){
 const currentState=state();

 if(
  currentState.status==="ok"
 ){
  return (
   currentState.message||
   "Firestore synchronisiert"
  );
 }

 if(
  currentState.status==="saving"
 ){
  return "Firestore speichert...";
 }

 if(
  currentState.status==="loading"
 ){
  return "Firestore lädt...";
 }

 if(
  currentState.status==="pending"
 ){
  return "Änderungen werden gespeichert...";
 }

 if(
  currentState.status==="signed-out"
 ){
  return "Firebase-Anmeldung nötig";
 }

 if(
  currentState.status==="error"
 ){
  return "Firestore Fehler";
 }

 return (
  currentState.message||
  "Firestore bereit"
 );
}

window.NGTFirebaseSync={
 start:start,
 signIn:signIn,
 signOut:signOut,

 loadCloud:loadCloud,
 saveCloud:saveCloud,

 getContext:getContext,
 currentUser:currentUser,
 isSignedIn:isSignedIn,

 syncTaxonomy:syncTaxonomy,

 label:label,
 state:state
};

document.readyState==="loading"
 ?document.addEventListener(
   "DOMContentLoaded",
   start
  )
 :start();

})();