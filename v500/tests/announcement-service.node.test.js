'use strict';

const assert=require('node:assert/strict');
const path=require('node:path');

global.window=global;

let user={
 uid:'admin',
 email:'saschad1711@gmail.com'
};
let writes=[];

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
 serverTimestamp:function(){
  return {
   serverTimestamp:true
  };
 }
};

global.NGTFirebaseSync={
 getContext:async function(){
  return {
   db:{},
   user:user,
   fsMod:fsMod
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
  writes[0].reference.path,
  'appAnnouncements/current'
 );
 assert.equal(
  writes[0].data.active,
  true
 );
 assert.equal(
  writes[0].data.important,
  true
 );

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
  'announcement-service: 12 assertions passed'
 );
}

run().catch(function(error){
 console.error(error);
 process.exitCode=1;
});
