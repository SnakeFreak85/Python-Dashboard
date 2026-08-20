'use strict';

const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');

const values=new Map();

global.window=global;
Object.defineProperty(global,'navigator',{
 configurable:true,
 value:{languages:['fr-FR'],language:'fr-FR'}
});
global.localStorage={
 getItem:function(key){return values.has(key)?values.get(key):null;},
 setItem:function(key,value){values.set(key,String(value));}
};
global.document={
 readyState:'loading',
 documentElement:{lang:'de'},
 body:null,
 addEventListener:function(){},
 getElementById:function(){return null;}
};
global.location={reload:function(){}};
global.CustomEvent=function(type,options){this.type=type;this.detail=options&&options.detail;};
global.dispatchEvent=function(){};

function load(relative){
 const file=path.join(__dirname,'..',relative);
 vm.runInThisContext(fs.readFileSync(file,'utf8'),{filename:file});
}

load('locales/de.js');
load('locales/en.js');
load('i18n.js');

assert.equal(TCI18n.current(),'en','Unsupported device languages fall back to English.');
assert.equal(TCI18n.hasSelection(),false,'Suggested language is not persisted before confirmation.');
assert.equal(TCI18n.t('Bestand'),'Animals');
assert.equal(TCI18n.t('Fütterung speichern'),'Save feeding');
assert.equal(TCI18n.t('35 Tiere'),'35 animals');
assert.equal(TCI18n.t('Luna'),'Luna','User content without a catalogue entry remains unchanged.');
assert.equal(TCI18n.locale(),'en-GB');

TCI18n.set('de',{reload:false});

assert.equal(TCI18n.current(),'de');
assert.equal(TCI18n.hasSelection(),true);
assert.equal(values.get('terracontrol_language_v1'),'de');
assert.equal(TCI18n.t('Bestand'),'Bestand');
assert.equal(TCI18n.locale(),'de-DE');

console.log('i18n.node.test.js: all assertions passed');
