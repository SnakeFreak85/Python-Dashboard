'use strict';

const assert=require('node:assert/strict');
const path=require('node:path');

global.window=global;

let user={
 uid:'admin',
 email:'saschad1711@gmail.com'
};
let writes=[];
let currentSnapshot=null;

const fsMod={
 doc:function(db,collection,documentId){
  return {
   path:collection+'/'+documentId
  };
 },
 setDoc:async function(reference,data){
  writes.push({
   type:'set',
   reference:reference,
   data:data
  });
 },
 updateDoc:async function(reference,data){
  writes.push({
   type:'update',
   reference:reference,
   data:data
  });
 },
 onSnapshot:function(reference,onValue){
  if(currentSnapshot){
   onValue(currentSnapshot);
  }
  return function(){};
 },
 serverTimestamp:function(){
  return {
   serverTimestamp:true
  };
 }
};

const functionsMod={
 getFunctions:function(){
  return {};
 },
 httpsCallable:function(instance,name){
  return async function(data){
   writes.push({
    type:'call',
    name:name,
    data:data
   });
   return {
    data:{
     publishedAtMs:123,
     languages:['de','en','it','hu']
    }
   };
  };
 }
};

global.NGTFirebaseSync={
 getContext:async function(){
  return {
   db:{},
   app:{},
   user:user,
   fsMod:fsMod,
   functions:{},
   functionsMod:functionsMod
  };
 },
 currentUser:function(){
  return user;
 }
};

require(
 path.resolve(
  __dirname,
  '..',
  'announcement-service.js'
 )
);

async function run(){
 assert.equal(
  NGTAnnouncementService.isAdminUser({
   email:'SaschaD1711@gmail.com'
  }),
  true
 );

 await NGTAnnouncementService.publish({
  title:'Neue Testversion',
  message:'Bitte weiter testen.',
  important:true
 });

 assert.equal(writes.length,1);
 assert.equal(
  writes[0].data.title,
  'Neue Testversion'
 );
 assert.equal(
  writes[0].type,
  'call'
 );
 assert.equal(
  writes[0].data.important,
  true
 );
 assert.equal(
  writes[0].name,
  'translateAndPublishAnnouncement'
 );

 global.TCI18n={
  current:function(){
   return 'hu';
  }
 };
 currentSnapshot={
  id:'current',
  exists:function(){return true;},
  data:function(){
   return {
    title:'Deutscher Titel',
    message:'Deutsche Nachricht',
    active:true,
    important:false,
    publishedAtMs:100,
    translations:{
     hu:{
      title:'Magyar cím',
      message:'Magyar üzenet'
     }
    }
   };
  }
 };
 let localized=null;
 await NGTAnnouncementService.listenCurrent(function(value){
  localized=value;
 });
 assert.equal(localized.title,'Magyar cím');
 assert.equal(localized.message,'Magyar üzenet');
 assert.equal(localized.sourceTitle,'Deutscher Titel');

 await NGTAnnouncementService.close();

 assert.equal(writes.length,2);
 assert.equal(
  writes[1].type,
  'update'
 );
 assert.equal(
  writes[1].data.active,
  false
 );

 user={
  uid:'tester',
  email:'tester@example.com'
 };

 await assert.rejects(
  NGTAnnouncementService.publish({
   title:'Nicht erlaubt',
   message:'Tester darf nicht schreiben.'
  })
 );

 await assert.rejects(
  NGTAnnouncementService.publish({
   title:'',
   message:'Ohne Überschrift'
  })
 );

 console.log(
  'announcement-service: 17 assertions passed'
 );
}

run().catch(function(error){
 console.error(error);
 process.exitCode=1;
});
