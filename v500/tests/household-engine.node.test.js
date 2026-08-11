'use strict';

const assert=require('node:assert/strict');
const engine=require('../household-engine.js');

const owner={uid:'owner-1',email:' Owner@Example.de ',displayName:'Sascha'};
const personal=engine.personalScope(owner);

assert.equal(engine.normalizeEmail(owner.email),'owner@example.de');
assert.equal(engine.scopeKey(personal),'personal:owner-1');

const household=engine.householdScope(
 {id:'household-1',name:'Familie',ownerUid:'owner-1'},
 {role:'member'}
);

assert.equal(engine.scopeKey(household),'household:household-1');
assert.equal(engine.isOwner(household,owner),true);

const invitation=engine.invitationRecord(
 {email:' Frau@Example.de '},
 owner,
 {id:'household-1',name:'Familie'}
);

assert.equal(invitation.email,'frau@example.de');
assert.equal(invitation.status,'pending');
assert.equal(invitation.householdId,'household-1');

const member=engine.memberRecord(
 {uid:'member-1',email:'frau@example.de',displayName:'Frau'},
 'member',
 'invite-1'
);

assert.equal(member.role,'member');
assert.equal(member.inviteId,'invite-1');

console.log('household-engine: all checks passed');
