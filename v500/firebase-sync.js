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
let changeRevision=0;
let saveRequested=false;

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

function localUpdatedAt(){
 const localState=read(
  'terracontrol_last_local_save_v1'
 );

 return localState.at||0;
}

function cloudUpdatedAt(cloud){
 if(!cloud){
  return 0;
 }

 return (
  cloud.updatedAt||
  cloud.updatedAtMs||
  0
 );
}

function syncDecision(
 cloud,
 cloudExists,
 options
){
 return NGTSyncPolicyEngine.decide({
  localData:NGTStore.data(),
  cloudData:
   cloud&&cloud.data
    ?cloud.data
    :{},
  cloudExists:cloudExists,
  localUpdatedAt:localUpdatedAt(),
  cloudUpdatedAt:
   cloudUpdatedAt(cloud),
  forceCloud:
   options&&
   options.force===true
 });
}

async function loadCloud(options){
 if(!user){
  return false;
 }

 options=options||{};

 clearTimeout(timer);
 timer=null;

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

  const exists=snapshot.exists();
  const cloud=
   exists
    ?snapshot.data()||{}
    :{};
  const decision=syncDecision(
   cloud,
   exists,
   options
  );

  if(decision.loadCloud){
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

  if(decision.conflict){
   setStatus(
    "conflict",
    "Lokale und Cloud-Daten unterscheiden sich"
   );

   return false;
  }

  if(decision.uploadLocal){
   setStatus(
    "pending",
    "Lokale Daten bleiben erhalten"
   );

   return false;
  }

  setStatus(
   "ok",
   decision.action==="unchanged"
    ?"Lokale Daten und Firestore sind aktuell"
    :"Keine Cloud-Daten vorhanden"
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

  const currentState=state();

  if(
   currentState.status==="pending"&&
   currentState.message===
    "Lokale Daten bleiben erhalten"
  ){
   scheduleSave(
    "Lokale Daten sind neuer als Firestore"
   );
  }
 }
}

async function saveCloud(){
 if(saving){
  saveRequested=true;
  return false;
 }

 if(
  !user||
  loading||
  !autoSaveReady
 ){
  return false;
 }

 saving=true;
 const revisionAtStart=
  changeRevision;

 setStatus(
  "saving",
  "Firestore speichert..."
 );

 try{
  const storeSnapshot=
   NGTStore.snapshot();
  const updatedAtMs=
   Date.now();
  const budget=
   NGTSyncPolicyEngine
    .firestoreDocumentBudget({
     data:storeSnapshot,
     updatedAtMs:updatedAtMs,
     version:NGTStore.APP_VERSION
    });

  emit(
   'firebase:size',
   budget
  );

  if(budget.blocked){
   setStatus(
    "error",
    "Cloud-Speicherung gestoppt: Der Datenbestand ist zu groß. Bitte eingebettete Fotos migrieren oder entfernen."
   );

   return false;
  }

  await mods.fsMod.setDoc(
   docRef(),
   {
    data:
     storeSnapshot,

    updatedAt:
     mods.fsMod.serverTimestamp(),

    updatedAtMs:
     updatedAtMs,

    version:
     NGTStore.APP_VERSION
   },
   {
    merge:true
   }
  );

  setStatus(
   budget.warning
    ?"warning"
    :"ok",
   budget.warning
    ?"Firestore synchronisiert – der Cloud-Datensatz nähert sich dem Größenlimit"
    :"Firestore synchronisiert"
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

  if(NGTSyncPolicyEngine.needsFollowupSave({
   requested:saveRequested,
   currentRevision:changeRevision,
   startedRevision:revisionAtStart
  })){
   saveRequested=false;

   setStatus(
    "pending",
    "Weitere Änderungen werden gespeichert..."
   );

   armSave();
  }
 }
}

function armSave(){
 clearTimeout(timer);

 timer=setTimeout(
  saveCloud,
  1200
 );
}

function scheduleSave(reason){
 if(
  !user||
  loading||
  !autoSaveReady
 ){
  return;
 }

 changeRevision++;

 if(saving){
  saveRequested=true;
  return;
 }

 setStatus(
  "pending",
  typeof reason==="string"
   ?reason
   :"Änderungen werden gespeichert..."
 );

 armSave();
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

 await loadCloud({
  automatic:true
 });
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

    await loadCloud({
     automatic:true
    });
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
  return (
   currentState.message||
   "Firestore Fehler"
  );
 }

 if(
  currentState.status==="conflict"
 ){
  return "Datenkonflikt: Speichern oder Laden wählen";
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
