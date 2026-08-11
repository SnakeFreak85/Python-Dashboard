(function(root,factory){
 'use strict';

 const api=factory();

 if(typeof module==='object'&&module.exports){
  module.exports=api;
 }

 root.NGTHouseholdEngine=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
 'use strict';

 function text(value){
  return String(value||'').trim();
 }

 function normalizeEmail(value){
  return text(value).toLowerCase();
 }

 function normalizeName(value,fallback){
  return text(value).slice(0,80)||text(fallback).slice(0,80)||'Gemeinsamer Bestand';
 }

 function personalScope(user){
  return {
   type:'personal',
   id:text(user&&user.uid),
   name:'Persönlicher Bestand',
   role:'owner',
   ownerUid:text(user&&user.uid)
  };
 }

 function householdScope(household,member){
  return {
   type:'household',
   id:text(household&&household.id),
   name:normalizeName(household&&household.name,'Gemeinsamer Bestand'),
   role:text(member&&member.role)||'member',
   ownerUid:text(household&&household.ownerUid)
  };
 }

 function scopeKey(scope){
  const type=scope&&scope.type==='household'?'household':'personal';
  return type+':'+text(scope&&scope.id);
 }

 function isOwner(scope,user){
  return !!(
   scope&&
   scope.type==='household'&&
   (
    scope.role==='owner'||
    text(scope.ownerUid)===text(user&&user.uid)
   )
  );
 }

 function memberRecord(user,role,inviteId){
  return {
   uid:text(user&&user.uid),
   email:normalizeEmail(user&&user.email),
   displayName:text(user&&user.displayName)||normalizeEmail(user&&user.email),
   role:role==='owner'?'owner':'member',
   inviteId:text(inviteId),
   joinedAtMs:Date.now()
  };
 }

 function invitationRecord(input,user,household){
  input=input||{};

  return {
   email:normalizeEmail(input.email),
   householdId:text(household&&household.id),
   householdName:normalizeName(household&&household.name,'Gemeinsamer Bestand'),
   invitedByUid:text(user&&user.uid),
   invitedByEmail:normalizeEmail(user&&user.email),
   invitedByName:text(user&&user.displayName)||normalizeEmail(user&&user.email),
   status:'pending',
   createdAtMs:Date.now()
  };
 }

 return {
  normalizeEmail:normalizeEmail,
  normalizeName:normalizeName,
  personalScope:personalScope,
  householdScope:householdScope,
  scopeKey:scopeKey,
  isOwner:isOwner,
  memberRecord:memberRecord,
  invitationRecord:invitationRecord
 };
});
