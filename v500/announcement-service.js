(function(){
'use strict';

const ADMIN_EMAIL='saschad1711@gmail.com';
const COLLECTION='appAnnouncements';
const DOCUMENT='current';
const MAX_TITLE_LENGTH=80;
const MAX_MESSAGE_LENGTH=1000;
const FUNCTIONS_REGION='europe-west3';
const PUBLISH_FUNCTION='translateAndPublishAnnouncement';

let functionsPromise=null;

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

 if(code.includes('not-found')){
  return 'Die automatische Übersetzungsfunktion ist noch nicht in Firebase bereitgestellt.';
 }

 if(code.includes('failed-precondition')){
  return 'Die automatische Übersetzung ist noch nicht vollständig eingerichtet.';
 }

 if(code.includes('unavailable')){
  return 'Die automatische Übersetzung ist momentan nicht verfügbar. Bitte versuche es gleich noch einmal.';
 }

 if(
  code.includes('deadline-exceeded')||
  code.includes('resource-exhausted')
 ){
  return 'Die Übersetzung dauert momentan zu lange. Bitte versuche es gleich noch einmal.';
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
 const sourceTitle=clean(data.title);
 const sourceMessage=clean(data.message);
 const active=!!data.active;
 const publishedAtMs=timestampMs(
  data.publishedAt,
  data.publishedAtMs
 );

 if(
  !active||
  !sourceTitle||
  !sourceMessage
 ){
  return null;
 }

 const language=
  window.TCI18n&&TCI18n.current
   ?TCI18n.current()
   :'de';
 const translated=
  data.translations&&
  data.translations[language]||{};
 const localizedTitle=
  clean(translated.title)||sourceTitle;
 const localizedMessage=
  clean(translated.message)||sourceMessage;

 return Object.assign(
  {},
  data,
  {
   id:snapshot.id,
   active:true,
   title:localizedTitle,
   message:localizedMessage,
   sourceTitle:sourceTitle,
   sourceMessage:sourceMessage,
   language:language,
   important:!!data.important,
   publishedAtMs:publishedAtMs
  }
 );
}

async function functionsApi(firebase){
 if(functionsPromise){
  return functionsPromise;
 }

 functionsPromise=(async function(){
  const mod=
   firebase.functionsMod||
   await import(
    'https://www.gstatic.com/firebasejs/12.15.0/firebase-functions.js'
   );
  const instance=
   firebase.functions||
   mod.getFunctions(
    firebase.app,
    FUNCTIONS_REGION
   );

  return {
   mod:mod,
   instance:instance
  };
 })();

 return functionsPromise;
}

async function publishTranslated(firebase,values){
 const api=await functionsApi(firebase);
 const callable=api.mod.httpsCallable(
  api.instance,
  PUBLISH_FUNCTION
 );
 const response=await callable({
  title:values.title,
  message:values.message,
  important:values.important
 });

 return response&&response.data||{};
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

 const result=await publishTranslated(
  firebase,
  {
   title:title,
   message:message,
   important:!!(
    values&&values.important
   )
  }
 );

 return {
  id:DOCUMENT,
  publishedAtMs:Number(
   result.publishedAtMs
  )||Date.now(),
  languages:Array.isArray(
   result.languages
  )?result.languages.slice():[]
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
