(function(){
'use strict';

const ADMIN_EMAIL='saschad1711@gmail.com';
const COLLECTION='appAnnouncements';
const DOCUMENT='current';
const MAX_TITLE_LENGTH=80;
const MAX_MESSAGE_LENGTH=1000;

function clean(value){
 return String(value||'').trim();
}

function normalizedEmail(value){
 return clean(value).toLowerCase();
}

function isAdminUser(user){
 return !!(
  user&&
  normalizedEmail(user.email)===ADMIN_EMAIL
 );
}

function errorMessage(error){
 const code=String(
  error&&error.code||''
 ).toLowerCase();

 if(code.includes('permission-denied')){
  return 'Die Mitteilungen sind noch nicht in Firebase freigeschaltet.';
 }

 if(code.includes('unavailable')){
  return 'Mitteilungen sind momentan nicht erreichbar. Prüfe deine Internetverbindung.';
 }

 if(code.includes('unauthenticated')){
  return 'Bitte melde dich zuerst mit deinem Google-Konto an.';
 }

 return clean(
  error&&error.message
 )||'Die Mitteilung konnte nicht geladen werden.';
}

async function context(){
 if(
  !window.NGTFirebaseSync||
  !NGTFirebaseSync.getContext
 ){
  throw new Error(
   'Firebase ist noch nicht verfügbar.'
  );
 }

 const firebase=
  await NGTFirebaseSync.getContext();
 const currentUser=
  NGTFirebaseSync.currentUser
   ?NGTFirebaseSync.currentUser()
   :firebase.user;

 if(!currentUser){
  const error=new Error(
   'Bitte melde dich zuerst mit deinem Google-Konto an.'
  );
  error.code='unauthenticated';
  throw error;
 }

 return Object.assign(
  {},
  firebase,
  {
   user:currentUser
  }
 );
}

function reference(firebase){
 return firebase.fsMod.doc(
  firebase.db,
  COLLECTION,
  DOCUMENT
 );
}

function timestampMs(value,fallback){
 if(
  value&&
  typeof value.toMillis==='function'
 ){
  return value.toMillis();
 }

 return Number(fallback)||0;
}

function normalize(snapshot){
 if(
  !snapshot||
  !snapshot.exists()
 ){
  return null;
 }

 const data=snapshot.data()||{};
 const active=!!data.active;
 const publishedAtMs=timestampMs(
  data.publishedAt,
  data.publishedAtMs
 );

 if(
  !active||
  !clean(data.title)||
  !clean(data.message)
 ){
  return null;
 }

 return Object.assign(
  {},
  data,
  {
   id:snapshot.id,
   active:true,
   title:clean(data.title),
   message:clean(data.message),
   important:!!data.important,
   publishedAtMs:publishedAtMs
  }
 );
}

async function listenCurrent(onValue,onError){
 const firebase=await context();

 return firebase.fsMod.onSnapshot(
  reference(firebase),
  function(snapshot){
   onValue(
    normalize(snapshot)
   );
  },
  function(error){
   if(onError){
    onError(
     errorMessage(error),
     error
    );
   }
  }
 );
}

async function publish(values){
 const title=clean(
  values&&values.title
 );
 const message=clean(
  values&&values.message
 );

 if(!title){
  throw new Error(
   'Bitte gib eine Überschrift ein.'
  );
 }

 if(title.length>MAX_TITLE_LENGTH){
  throw new Error(
   'Die Überschrift darf höchstens '+
   MAX_TITLE_LENGTH+
   ' Zeichen enthalten.'
  );
 }

 if(!message){
  throw new Error(
   'Bitte gib eine Mitteilung ein.'
  );
 }

 if(message.length>MAX_MESSAGE_LENGTH){
  throw new Error(
   'Die Mitteilung darf höchstens '+
   MAX_MESSAGE_LENGTH+
   ' Zeichen enthalten.'
  );
 }

 const firebase=await context();

 if(!isAdminUser(firebase.user)){
  const error=new Error(
   'Nur der TerraControl-Administrator kann Mitteilungen veröffentlichen.'
  );
  error.code='permission-denied';
  throw error;
 }

 const now=Date.now();

 await firebase.fsMod.setDoc(
  reference(firebase),
  {
   title:title,
   message:message,
   important:!!(
    values&&values.important
   ),
   active:true,
   publishedAt:
    firebase.fsMod.serverTimestamp(),
   publishedAtMs:now
  }
 );

 return {
  id:DOCUMENT,
  publishedAtMs:now
 };
}

async function close(){
 const firebase=await context();

 if(!isAdminUser(firebase.user)){
  const error=new Error(
   'Nur der TerraControl-Administrator kann Mitteilungen beenden.'
  );
  error.code='permission-denied';
  throw error;
 }

 await firebase.fsMod.updateDoc(
  reference(firebase),
  {
   active:false
  }
 );
}

window.NGTAnnouncementService={
 ADMIN_EMAIL:ADMIN_EMAIL,
 MAX_TITLE_LENGTH:MAX_TITLE_LENGTH,
 MAX_MESSAGE_LENGTH:MAX_MESSAGE_LENGTH,
 isAdminUser:isAdminUser,
 errorMessage:errorMessage,
 listenCurrent:listenCurrent,
 publish:publish,
 close:close
};

})();
