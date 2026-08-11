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

const TEST_MODE=
 new URLSearchParams(window.location.search)
  .get('tcTest')==='1';

const STATE_KEY=TEST_MODE
 ?"terracontrol_test_firebase_sync_state_v1"
 :"terracontrol_firebase_sync_state_v1";

const PROFILE_KEY=TEST_MODE
 ?"terracontrol_test_user_profile"
 :"tc_user_profile";

const SCOPE_KEY=TEST_MODE
 ?"terracontrol_test_cloud_scope_v1"
 :"terracontrol_cloud_scope_v1";

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
let cloudRevision=0;
let activeScope=null;
let remoteUnsubscribe=null;
let activationPromise=null;
let activatedUid='';

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

function householdState(){
 return activeScope
  ?Object.assign({},activeScope)
  :NGTHouseholdEngine.personalScope(user);
}

function householdOwner(){
 return NGTHouseholdEngine.isOwner(activeScope,user);
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

function docRef(scope){
 const target=scope||activeScope||NGTHouseholdEngine.personalScope(user);

 if(target.type==='household'){
  return mods.fsMod.doc(
   db,
   'households',
   target.id,
   'terraControl',
   'main'
  );
 }

 return mods.fsMod.doc(db,'users',user.uid,'terraControl','main');
}

function householdRef(id){
 return mods.fsMod.doc(db,'households',id);
}

function memberRef(householdId,userId){
 return mods.fsMod.doc(db,'households',householdId,'members',userId);
}

function userHouseholdRef(userId){
 return mods.fsMod.doc(db,'users',userId,'household','profile');
}

function inviteRef(id){
 return mods.fsMod.doc(db,'householdInvites',id);
}

function emitHousehold(){
 emit('firebase:household',{
  scope:householdState(),
  owner:householdOwner()
 });
}

async function resolveActiveScope(){
 const personal=NGTHouseholdEngine.personalScope(user);
 const previousKey=NGTHouseholdEngine.scopeKey(activeScope||personal);
 let next=personal;

 try{
  const profileSnapshot=await mods.fsMod.getDoc(userHouseholdRef(user.uid));
  const profile=profileSnapshot.exists()?profileSnapshot.data()||{}:{};
  const householdId=String(profile.activeHouseholdId||'').trim();

  if(householdId){
   const snapshots=await Promise.all([
    mods.fsMod.getDoc(householdRef(householdId)),
    mods.fsMod.getDoc(memberRef(householdId,user.uid))
   ]);

   if(snapshots[0].exists()&&snapshots[1].exists()){
    next=NGTHouseholdEngine.householdScope(
     Object.assign({id:householdId},snapshots[0].data()||{}),
     snapshots[1].data()||{}
    );
   }
  }
 }catch(error){
  console.warn('Gemeinsamer Bestand konnte nicht aufgelöst werden.',error);
 }

 activeScope=next;
 const nextKey=NGTHouseholdEngine.scopeKey(next);
 const storedKey=localStorage.getItem(SCOPE_KEY)||'';
 localStorage.setItem(SCOPE_KEY,nextKey);
 emitHousehold();

 return previousKey!==nextKey||storedKey!==nextKey;
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
  localData:NGTStore.snapshot(),
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
  cloudRevision=Number(cloud.revision||0);
  const decision=syncDecision(
   cloud,
   exists,
   Object.assign(
    {},
    options,
    {
     force:
      options.force===true||
      options.forceScope===true
    }
   )
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

  const expectedRevision=cloudRevision;
  let savedRevision=expectedRevision+1;

  await mods.fsMod.runTransaction(
   db,
   async function(transaction){
    const reference=docRef();
    const currentSnapshot=await transaction.get(reference);
    const current=currentSnapshot.exists()?currentSnapshot.data()||{}:{};
    const currentRevision=Number(current.revision||0);

    if(currentRevision!==expectedRevision){
     const conflict=new Error('Der gemeinsame Bestand wurde zwischenzeitlich auf einem anderen Gerät geändert.');
     conflict.code='terracontrol/cloud-conflict';
     throw conflict;
    }

    savedRevision=currentRevision+1;
    transaction.set(
     reference,
     {
      data:storeSnapshot,
      updatedAt:mods.fsMod.serverTimestamp(),
      updatedAtMs:updatedAtMs,
      version:NGTStore.APP_VERSION,
      revision:savedRevision,
      updatedByUid:user.uid,
      updatedByEmail:user.email||''
     },
     {merge:true}
    );
   }
  );

  cloudRevision=savedRevision;

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
  const conflict=String(error&&error.code||'')==='terracontrol/cloud-conflict';

  setStatus(
   conflict?'conflict':'error',
   conflict
    ?'Der gemeinsame Bestand wurde auf einem anderen Gerät geändert. Bitte zuerst Cloud laden.'
    :'Firestore Speichern fehlgeschlagen'
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

function stopRemoteListener(){
 if(typeof remoteUnsubscribe==='function'){
  remoteUnsubscribe();
 }

 remoteUnsubscribe=null;
}

function startRemoteListener(){
 stopRemoteListener();

 if(!user||!activeScope||TEST_MODE)return;

 remoteUnsubscribe=mods.fsMod.onSnapshot(
  docRef(),
  function(snapshot){
   if(!snapshot.exists()||snapshot.metadata.hasPendingWrites)return;

   const cloud=snapshot.data()||{};
   const incomingRevision=Number(cloud.revision||0);

   if(incomingRevision<=cloudRevision)return;

   const currentStatus=state().status;
   if(
    saving||
    currentStatus==='pending'||
    currentStatus==='conflict'
   ){
    setStatus(
     'conflict',
     'Der gemeinsame Bestand wurde auf einem anderen Gerät geändert. Bitte Cloud laden.'
    );
    return;
   }

   if(!cloud.data)return;

   loading=true;
   autoSaveReady=false;

   try{
    NGTStore.importJson(JSON.stringify(cloud.data));
    cloudRevision=incomingRevision;
    setStatus('ok','Gemeinsamer Bestand aktualisiert');
   }catch(error){
    console.error('Echtzeit-Aktualisierung fehlgeschlagen.',error);
    setStatus('error','Gemeinsamer Bestand konnte nicht aktualisiert werden');
   }finally{
    loading=false;
    autoSaveReady=true;
   }
  },
  async function(error){
   console.error('Echtzeit-Synchronisierung fehlgeschlagen.',error);

   if(
    String(error&&error.code||'').includes('permission-denied')&&
    activeScope&&
    activeScope.type==='household'
   ){
    const changed=await resolveActiveScope();
    if(changed){
     cloudRevision=0;
     await loadCloud({force:true,forceScope:true});
     startRemoteListener();
     if(window.NGT500){
      NGT500.toast('Dein Zugriff auf den gemeinsamen Bestand wurde beendet.','warn');
      NGT500.route('dashboard',{}, {replace:true,noHistory:true});
     }
     return;
    }
   }

   setStatus('error','Echtzeit-Synchronisierung unterbrochen');
  }
 );
}

async function activateUser(firebaseUser){
 if(
  activatedUid===firebaseUser.uid&&
  user&&
  activeScope&&
  autoSaveReady
 )return;

 if(activationPromise)return activationPromise;

 activationPromise=(async function(){
  user=firebaseUser;
  saveProfile(user);

  emit('firebase:auth',{
   signedIn:true,
   user:{
    uid:user.uid||'',
    email:user.email||'',
    displayName:user.displayName||''
   }
  });

  const scopeChanged=await resolveActiveScope();
  await loadCloud({automatic:true,forceScope:scopeChanged});
  startRemoteListener();
  await syncTaxonomy();
  activatedUid=user.uid;
 })();

 try{
  await activationPromise;
 }finally{
  activationPromise=null;
 }
}

async function createHousehold(name){
 await init();
 if(!user)throw new Error('Bitte zuerst mit Google anmelden.');
 if(activeScope&&activeScope.type==='household'){
  throw new Error('Du verwendest bereits einen gemeinsamen Bestand.');
 }
 if(saving||loading){
  throw new Error('Die Cloud-Synchronisierung läuft noch. Bitte in einem Moment erneut versuchen.');
 }

 const personalBackupSaved=await saveCloud();
 if(!personalBackupSaved){
  throw new Error('Der persönliche Bestand konnte vor dem Erstellen nicht gesichert werden.');
 }

 clearTimeout(timer);
 timer=null;
 saveRequested=false;

 const householdDocument=mods.fsMod.doc(mods.fsMod.collection(db,'households'));
 const householdId=householdDocument.id;
 const householdName=NGTHouseholdEngine.normalizeName(name,'Gemeinsamer Bestand');
 const now=Date.now();
 const member=NGTHouseholdEngine.memberRecord(user,'owner','');
 const batch=mods.fsMod.writeBatch(db);

 batch.set(householdDocument,{
  id:householdId,
  name:householdName,
  ownerUid:user.uid,
  ownerEmail:NGTHouseholdEngine.normalizeEmail(user.email),
  createdAt:mods.fsMod.serverTimestamp(),
  createdAtMs:now
 });
 batch.set(memberRef(householdId,user.uid),member);
 batch.set(userHouseholdRef(user.uid),{
  activeHouseholdId:householdId,
  updatedAt:mods.fsMod.serverTimestamp(),
  updatedAtMs:now
 });
 batch.set(docRef({type:'household',id:householdId}),{
  data:NGTStore.snapshot(),
  updatedAt:mods.fsMod.serverTimestamp(),
  updatedAtMs:now,
  version:NGTStore.APP_VERSION,
  revision:1,
  updatedByUid:user.uid,
  updatedByEmail:user.email||''
 });

 await batch.commit();

 activeScope=NGTHouseholdEngine.householdScope(
  {id:householdId,name:householdName,ownerUid:user.uid},
  member
 );
 cloudRevision=1;
 localStorage.setItem(SCOPE_KEY,NGTHouseholdEngine.scopeKey(activeScope));
 emitHousehold();
 startRemoteListener();
 setStatus('ok','Gemeinsamer Bestand erstellt');

 return householdState();
}

async function inviteMember(email){
 await init();
 if(!user||!householdOwner()){
  throw new Error('Nur der Eigentümer kann Mitglieder einladen.');
 }

 const normalized=NGTHouseholdEngine.normalizeEmail(email);
 if(!normalized||!normalized.includes('@')){
  throw new Error('Bitte eine gültige E-Mail-Adresse eingeben.');
 }
 if(normalized===NGTHouseholdEngine.normalizeEmail(user.email)){
  throw new Error('Du bist bereits Eigentümer dieses Bestands.');
 }

 const reference=mods.fsMod.doc(mods.fsMod.collection(db,'householdInvites'));
 const invitation=NGTHouseholdEngine.invitationRecord(
  {email:normalized},
  user,
  activeScope
 );

 await mods.fsMod.setDoc(reference,Object.assign({},invitation,{
  createdAt:mods.fsMod.serverTimestamp()
 }));

 return Object.assign({id:reference.id},invitation);
}

async function pendingInvitations(){
 await init();
 if(!user||!user.email)return [];

 const query=mods.fsMod.query(
  mods.fsMod.collection(db,'householdInvites'),
  mods.fsMod.where('email','==',NGTHouseholdEngine.normalizeEmail(user.email))
 );
 const snapshot=await mods.fsMod.getDocs(query);

 return snapshot.docs.map(function(row){
  return Object.assign({id:row.id},row.data()||{});
 }).filter(function(row){
  return row.status==='pending';
 });
}

async function acceptInvitation(id){
 await init();
 if(!user)throw new Error('Bitte zuerst mit Google anmelden.');

 const reference=inviteRef(id);
 const snapshot=await mods.fsMod.getDoc(reference);
 if(!snapshot.exists())throw new Error('Diese Einladung ist nicht mehr verfügbar.');

 const invitation=snapshot.data()||{};
 const email=NGTHouseholdEngine.normalizeEmail(user.email);
 if(invitation.status!=='pending'||invitation.email!==email){
  throw new Error('Diese Einladung gehört nicht zum angemeldeten Konto.');
 }
 if(
  activeScope&&
  activeScope.type==='household'&&
  activeScope.id!==invitation.householdId
 ){
  throw new Error('Bitte den aktuellen gemeinsamen Bestand zuerst verlassen.');
 }

 if(!activeScope||activeScope.type==='personal'){
  const personalBackupSaved=await saveCloud();
  if(!personalBackupSaved){
   throw new Error('Der persönliche Bestand konnte vor dem Wechsel nicht gesichert werden.');
  }
 }

 const member=NGTHouseholdEngine.memberRecord(user,'member',id);
 const batch=mods.fsMod.writeBatch(db);

 batch.set(memberRef(invitation.householdId,user.uid),member);
 batch.set(userHouseholdRef(user.uid),{
  activeHouseholdId:invitation.householdId,
  updatedAt:mods.fsMod.serverTimestamp(),
  updatedAtMs:Date.now()
 });
 batch.update(reference,{
  status:'accepted',
  acceptedUid:user.uid,
  acceptedAt:mods.fsMod.serverTimestamp(),
  acceptedAtMs:Date.now()
 });

 await batch.commit();
 stopRemoteListener();
 await resolveActiveScope();
 await loadCloud({force:true,forceScope:true});
 startRemoteListener();

 return householdState();
}

async function householdMembers(){
 await init();
 if(!user||!activeScope||activeScope.type!=='household')return [];

 const snapshot=await mods.fsMod.getDocs(
  mods.fsMod.collection(db,'households',activeScope.id,'members')
 );

 return snapshot.docs.map(function(row){
  return Object.assign({id:row.id},row.data()||{});
 }).sort(function(a,b){
  if(a.role==='owner')return -1;
  if(b.role==='owner')return 1;
  return String(a.displayName||a.email||'').localeCompare(String(b.displayName||b.email||''),'de');
 });
}

async function removeHouseholdMember(userId){
 await init();
 if(!householdOwner())throw new Error('Nur der Eigentümer kann Mitglieder entfernen.');
 if(userId===user.uid)throw new Error('Der Eigentümer kann sich nicht selbst entfernen.');

 await mods.fsMod.deleteDoc(memberRef(activeScope.id,userId));
 return true;
}

async function leaveHousehold(){
 await init();
 if(!user||!activeScope||activeScope.type!=='household')return false;
 if(householdOwner()){
  throw new Error('Der Eigentümer kann den gemeinsamen Bestand nicht verlassen.');
 }

 const batch=mods.fsMod.writeBatch(db);
 batch.delete(memberRef(activeScope.id,user.uid));
 batch.delete(userHouseholdRef(user.uid));
 await batch.commit();

 stopRemoteListener();
 activeScope=NGTHouseholdEngine.personalScope(user);
 cloudRevision=0;
 localStorage.setItem(SCOPE_KEY,NGTHouseholdEngine.scopeKey(activeScope));
 emitHousehold();
 await loadCloud({force:true,forceScope:true});
 startRemoteListener();

 return true;
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

 await activateUser(result.user);

 if(window.NGT500){
  NGT500.route(
   "dashboard"
  );
 }
}

async function signOut(){
 await init();

 autoSaveReady=false;
 stopRemoteListener();

 await mods.authMod.signOut(
  auth
 );

 user=null;
 activeScope=null;
 cloudRevision=0;
 activatedUid='';

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

 if(TEST_MODE){
  autoSaveReady=false;
  setStatus(
   "test",
   "Cloud-Synchronisierung im Testmodus deaktiviert"
  );
  return;
 }

 setStatus(
  "starting",
  "Firestore startet..."
 );

 await init();

 mods.authMod.onAuthStateChanged(
  auth,
  async function(firebaseUser){
   if(firebaseUser){
    setStatus(
     "signed-in",
     "Firebase verbunden"
    );
    await activateUser(firebaseUser);

   }else{
    stopRemoteListener();
    user=null;
    activeScope=null;
    cloudRevision=0;
    activatedUid='';
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

 householdState:householdState,
 householdOwner:householdOwner,
 createHousehold:createHousehold,
 inviteMember:inviteMember,
 pendingInvitations:pendingInvitations,
 acceptInvitation:acceptInvitation,
 householdMembers:householdMembers,
 removeHouseholdMember:removeHouseholdMember,
 leaveHousehold:leaveHousehold,

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
