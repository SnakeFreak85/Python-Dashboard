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

const STATE_KEY="terracontrol_firebase_sync_state_v1";
const PROFILE_KEY="tc_user_profile";

let app=null;
let auth=null;
let db=null;
let user=null;
let mods=null;

let started=false;
let loading=false;
let saving=false;
let timer=null;
let autoSaveReady=false;

function read(k){
 try{return JSON.parse(localStorage.getItem(k)||"{}")||{}}
 catch(e){return {}}
}

function write(k,v){
 localStorage.setItem(k,JSON.stringify(v||{}));
}

function state(v){
 if(v)write(STATE_KEY,Object.assign(read(STATE_KEY),v));
 return read(STATE_KEY);
}

function refresh(){
 try{
  if(window.NGTDashboard&&NGTDashboard.updateCloudStatus)NGTDashboard.updateCloudStatus();
 }catch(e){}
}

function setStatus(status,msg){
 state({status:status,message:msg||"",at:new Date().toISOString()});
 refresh();
}

function animalCount(){
 try{return NGTStore.allAnimals().length}
 catch(e){return 0}
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

async function loadSdk(){
 if(mods)return mods;
 const appMod=await import("https://www.gstatic.com/firebasejs/12.15.0/firebase-app.js");
 const authMod=await import("https://www.gstatic.com/firebasejs/12.15.0/firebase-auth.js");
 const fsMod=await import("https://www.gstatic.com/firebasejs/12.15.0/firebase-firestore.js");
 mods={appMod,authMod,fsMod};
 return mods;
}

async function init(){
 if(app)return;
 const m=await loadSdk();
 app=m.appMod.initializeApp(CONFIG);
 auth=m.authMod.getAuth(app);
 db=m.fsMod.getFirestore(app);
}

function saveProfile(u){
 const p={
  name:u.displayName||"",
  displayName:u.displayName||"",
  given_name:(u.displayName||"").split(" ")[0]||"",
  email:u.email||"",
  picture:u.photoURL||"",
  sub:u.uid||"",
  provider:"firebase-google",
  updatedAt:new Date().toISOString()
 };
 localStorage.setItem(PROFILE_KEY,JSON.stringify(p));
 localStorage.setItem("ngt_google_user",JSON.stringify(p));
}

function docRef(){
 return mods.fsMod.doc(db,"users",user.uid,"terraControl","main");
}

function hasCloudData(cloud){
 if(!cloud||!cloud.data)return false;
 const d=cloud.data;
 const animalTotal=["koenig","boas","geckos","spinnen"].reduce(function(n,k){
  return n+((Array.isArray(d[k])?d[k]:[]).length);
 },0);
 const foodTotal=Array.isArray(d.foodInventory)?d.foodInventory.length:0;
 const hasSettings=d.settings&&Object.keys(d.settings||{}).length>0;
 return animalTotal>0||foodTotal>0||hasSettings;
}

async function loadCloud(){
 if(!user)return false;

 loading=true;
 autoSaveReady=false;
 setStatus("loading","Firestore lädt...");

 try{
  const snap=await mods.fsMod.getDoc(docRef());

  if(snap.exists()){
   const cloud=snap.data()||{};

   if(hasCloudData(cloud)){
    NGTStore.importJson(JSON.stringify(cloud.data));
    setStatus("ok","Firestore geladen");
    return true;
   }

   NGTStore.importJson(JSON.stringify(emptyStoreObject()));
   setStatus("ok","Leerer Cloud-Bestand geladen");
   return false;
  }

  NGTStore.importJson(JSON.stringify(emptyStoreObject()));
  setStatus("ok","Neuer leerer Cloud-Bestand");
  return false;

 }catch(e){
  setStatus("error","Firestore Laden fehlgeschlagen");
  console.error(e);
  return false;

 }finally{
  loading=false;
  autoSaveReady=true;
 }
}

async function saveCloud(){
 if(!user||loading||saving||!autoSaveReady)return false;

 saving=true;
 setStatus("saving","Firestore speichert...");

 try{
  await mods.fsMod.setDoc(docRef(),{
   data:NGTStore.data(),
   updatedAt:mods.fsMod.serverTimestamp(),
   updatedAtMs:Date.now(),
   version:"1.0.4-rc9"
  },{merge:true});

  setStatus("ok","Firestore synchronisiert");
  return true;

 }catch(e){
  setStatus("error","Firestore Speichern fehlgeschlagen");
  console.error(e);
  return false;

 }finally{
  saving=false;
 }
}

function scheduleSave(){
 if(!user||loading||!autoSaveReady)return;
 clearTimeout(timer);
 setStatus("pending","Änderungen werden gespeichert...");
 timer=setTimeout(saveCloud,1200);
}

async function signIn(){
 await init();

 autoSaveReady=false;

 const provider=new mods.authMod.GoogleAuthProvider();
 provider.setCustomParameters({prompt:"select_account"});

 const res=await mods.authMod.signInWithPopup(auth,provider);
 user=res.user;

 saveProfile(user);
 await loadCloud();

 if(window.NGT500)NGT500.route("dashboard");
}

async function signOut(){
 await init();
 autoSaveReady=false;
 await mods.authMod.signOut(auth);
 user=null;
 setStatus("signed-out","Nicht angemeldet");
}

async function start(){
 if(started)return;
 started=true;

 setStatus("starting","Firestore startet...");
 await init();

 mods.authMod.onAuthStateChanged(auth,async function(u){
  user=u||null;

  if(user){
   saveProfile(user);
   setStatus("signed-in","Firebase verbunden");
   await loadCloud();
  }else{
   autoSaveReady=false;
   setStatus("signed-out","Firebase-Anmeldung nötig");
  }
 });

 if(window.NGT500&&NGT500.on){
  NGT500.on("store:changed",scheduleSave);
 }
}

function label(){
 const s=state();
 if(s.status==="ok")return s.message||"Firestore synchronisiert";
 if(s.status==="saving")return "Firestore speichert...";
 if(s.status==="loading")return "Firestore lädt...";
 if(s.status==="pending")return "Änderungen werden gespeichert...";
 if(s.status==="signed-out")return "Firebase-Anmeldung nötig";
 if(s.status==="error")return "Firestore Fehler";
 return s.message||"Firestore bereit";
}

window.NGTFirebaseSync={
 start:start,
 signIn:signIn,
 signOut:signOut,
 loadCloud:loadCloud,
 saveCloud:saveCloud,
 label:label,
 state:state
};

document.readyState==="loading"
 ? document.addEventListener("DOMContentLoaded",start)
 : start();

})();
