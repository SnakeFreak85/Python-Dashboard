(function(){
'use strict';

const ADMIN_EMAIL='saschad1711@gmail.com';
const COLLECTION='supportThreads';
const MAX_MESSAGE_LENGTH=2000;
const MAX_THREADS=100;
const MAX_MESSAGES=200;

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

function displayName(user){
 return clean(
  user&&(
   user.displayName||
   user.email
  )
 )||'TerraControl Nutzer';
}

function errorMessage(error){
 const code=String(
  error&&error.code||''
 ).toLowerCase();

 if(code.includes('permission-denied')){
  return 'Der Supportchat ist noch nicht freigeschaltet oder du hast keinen Zugriff.';
 }

 if(code.includes('unavailable')){
  return 'Der Supportchat ist momentan nicht erreichbar. Prüfe deine Internetverbindung.';
 }

 if(code.includes('unauthenticated')){
  return 'Bitte melde dich zuerst mit deinem Google-Konto an.';
 }

 return clean(
  error&&error.message
 )||'Der Supportchat konnte nicht geladen werden.';
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

function targetThreadId(firebase,threadId){
 if(isAdminUser(firebase.user)){
  const selected=clean(threadId);

  if(!selected){
   throw new Error(
    'Bitte wähle zuerst eine Supportanfrage aus.'
   );
  }

  return selected;
 }

 return clean(firebase.user.uid);
}

function threadReference(firebase,threadId){
 return firebase.fsMod.doc(
  firebase.db,
  COLLECTION,
  targetThreadId(
   firebase,
   threadId
  )
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

function normalizeThread(snapshot){
 const data=snapshot.data()||{};

 return Object.assign(
  {},
  data,
  {
   id:snapshot.id,
   createdAtMs:timestampMs(
    data.createdAt,
    data.createdAtMs
   ),
   updatedAtMs:timestampMs(
    data.updatedAt,
    data.updatedAtMs
   )
  }
 );
}

function normalizeMessage(snapshot){
 const data=snapshot.data()||{};

 return Object.assign(
  {},
  data,
  {
   id:snapshot.id,
   createdAtMs:timestampMs(
    data.createdAt,
    data.clientCreatedAt
   )
  }
 );
}

async function listenThreads(onRows,onError){
 const firebase=await context();

 if(!isAdminUser(firebase.user)){
  throw new Error(
   'Nur der TerraControl-Support kann alle Anfragen öffnen.'
  );
 }

 const query=firebase.fsMod.query(
  firebase.fsMod.collection(
   firebase.db,
   COLLECTION
  ),
  firebase.fsMod.orderBy(
   'updatedAtMs',
   'desc'
  ),
  firebase.fsMod.limit(
   MAX_THREADS
  )
 );

 return firebase.fsMod.onSnapshot(
  query,
  function(snapshot){
   onRows(
    snapshot.docs.map(
     normalizeThread
    )
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

async function listenThread(threadId,onThread,onError){
 const firebase=await context();
 const reference=threadReference(
  firebase,
  threadId
 );

 return firebase.fsMod.onSnapshot(
  reference,
  function(snapshot){
   onThread(
    snapshot.exists()
     ?normalizeThread(snapshot)
     :null
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

async function listenMessages(threadId,onRows,onError){
 const firebase=await context();
 const reference=threadReference(
  firebase,
  threadId
 );
 const query=firebase.fsMod.query(
  firebase.fsMod.collection(
   reference,
   'messages'
  ),
  firebase.fsMod.orderBy(
   'clientCreatedAt',
   'asc'
  ),
  firebase.fsMod.limit(
   MAX_MESSAGES
  )
 );

 return firebase.fsMod.onSnapshot(
  query,
  function(snapshot){
   onRows(
    snapshot.docs.map(
     normalizeMessage
    )
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

async function sendMessage(threadId,text){
 const message=clean(text);

 if(!message){
  throw new Error(
   'Bitte gib zuerst eine Nachricht ein.'
  );
 }

 if(message.length>MAX_MESSAGE_LENGTH){
  throw new Error(
   'Eine Nachricht darf höchstens '+
   MAX_MESSAGE_LENGTH+
   ' Zeichen enthalten.'
  );
 }

 const firebase=await context();
 const admin=isAdminUser(
  firebase.user
 );
 const targetId=targetThreadId(
  firebase,
  threadId
 );
 const threadRef=firebase.fsMod.doc(
  firebase.db,
  COLLECTION,
  targetId
 );

 const threadSnapshot=
  await firebase.fsMod.getDoc(
   threadRef
  );
 const threadExists=
  threadSnapshot.exists();
 const threadData=
  threadExists
   ?threadSnapshot.data()||{}
   :null;

 if(admin&&!threadExists){
   throw new Error(
    'Diese Supportanfrage existiert nicht mehr.'
   );
 }

 const now=Date.now();
 const senderRole=admin
  ?'admin'
  :'user';
 const senderName=admin
  ?'TerraControl Support'
  :displayName(firebase.user);
 const messageRef=firebase.fsMod.doc(
  firebase.fsMod.collection(
   threadRef,
   'messages'
  )
 );
 const batch=firebase.fsMod.writeBatch(
  firebase.db
 );

 batch.set(
  messageRef,
  {
   threadId:targetId,
   senderUid:clean(firebase.user.uid),
   senderEmail:normalizedEmail(
    firebase.user.email
   ),
   senderName:senderName,
   senderRole:senderRole,
   text:message,
   createdAt:
    firebase.fsMod.serverTimestamp(),
   clientCreatedAt:now
  }
 );

 const update={
  status:'open',
  updatedAt:
   firebase.fsMod.serverTimestamp(),
  updatedAtMs:now,
  lastMessage:
   message.slice(0,160),
  lastSenderRole:senderRole,
  lastSenderName:senderName
 };

 if(!admin){
  Object.assign(
   update,
   {
    ownerUid:clean(
     firebase.user.uid
    ),
    ownerEmail:normalizedEmail(
     firebase.user.email
    ),
    ownerName:displayName(
     firebase.user
    )
   }
  );

  if(!threadExists){
   update.createdAt=
    firebase.fsMod.serverTimestamp();
   update.createdAtMs=now;
  }
 }else if(threadData){
  update.ownerUid=clean(
   threadData.ownerUid||targetId
  );
  update.ownerEmail=normalizedEmail(
   threadData.ownerEmail
  );
  update.ownerName=clean(
   threadData.ownerName
  );
 }

 batch.set(
  threadRef,
  update,
  {
   merge:true
  }
 );

 await batch.commit();

 return {
  id:messageRef.id,
  threadId:targetId
 };
}

window.NGTSupportService={
 ADMIN_EMAIL:ADMIN_EMAIL,
 MAX_MESSAGE_LENGTH:
  MAX_MESSAGE_LENGTH,
 isAdminUser:isAdminUser,
 errorMessage:errorMessage,
 listenThreads:listenThreads,
 listenThread:listenThread,
 listenMessages:listenMessages,
 sendMessage:sendMessage
};

})();
