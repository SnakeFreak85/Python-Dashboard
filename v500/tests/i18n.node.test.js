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
load('locales/it.js');
load('locales/hu.js');
load('i18n.js');

assert.equal(TCI18n.current(),'en','Unsupported device languages fall back to English.');
assert.equal(TCI18n.hasSelection(),false,'Suggested language is not persisted before confirmation.');
assert.equal(TCI18n.t('Bestand'),'Animals');
assert.equal(TCI18n.t('Fütterung speichern'),'Save feeding');
assert.equal(TCI18n.t('35 Tiere'),'35 animals');
assert.equal(TCI18n.t('⚙️ Einstellungen'),'⚙️ Settings');
assert.equal(TCI18n.t('Hallo Sascha 👋'),'Hello Sascha 👋');
assert.equal(TCI18n.t('Hallo 👋'),'Hello 👋');
assert.equal(TCI18n.t('32 Tiere · 0 Aufgaben fällig'),'32 animals · 0 tasks due');
assert.equal(TCI18n.t('3 fällige Aufgaben'),'3 tasks due');
assert.equal(TCI18n.t('Bestand: 2 Stück'),'Stock: 2 items');
assert.equal(TCI18n.t('3 Jahre'),'3 years');
assert.equal(TCI18n.t('alle 14–21 Tage'),'every 14–21 days');
assert.equal(TCI18n.t('1 Futtertier mit etwa 90 g'),'1 feeder weighing about 90 g');
assert.equal(TCI18n.t('7 Tage'),'7 days');
assert.equal(TCI18n.t('Pythons · 1 Tier'),'Pythons · 1 animal');
assert.equal(TCI18n.t('Archiv ist leer'),'The archive is empty');
assert.equal(TCI18n.t('Fütterung prüfen: letzte Fütterung vor 8 Tagen.'),'Check feeding: last feeding 8 days ago.');
assert.equal(TCI18n.t('Luna: Gewicht aktualisieren'),'Luna: Update weight');
assert.equal(TCI18n.t('seit 1 Tag fällig'),'1 day overdue');
assert.equal(TCI18n.t('Boa · 650 g · Alter 24 Monate'),'Boa · 650 g · age 24 months');
assert.equal(TCI18n.t('Luna'),'Luna','User content without a catalogue entry remains unchanged.');
assert.equal(TCI18n.locale(),'en-GB');
assert.deepEqual(TCI18n.supported,['de','en','it','hu']);

TCI18n.set('it',{reload:false});

assert.equal(TCI18n.current(),'it');
assert.equal(TCI18n.t('Einstellungen'),'Impostazioni');
assert.equal(TCI18n.t('35 Tiere'),'35 animali');
assert.equal(TCI18n.t('Hallo Sascha 👋'),'Ciao Sascha 👋');
assert.equal(TCI18n.t('Archiv ist leer'),'L’archivio è vuoto');
assert.equal(TCI18n.t('Luna: Gewicht aktualisieren'),'Luna: Aggiorna peso');
assert.equal(TCI18n.t('seit 1 Tag fällig'),'in ritardo di 1 giorno');
assert.equal(TCI18n.locale(),'it-IT');

TCI18n.set('hu',{reload:false});

assert.equal(TCI18n.current(),'hu');
assert.equal(TCI18n.t('Einstellungen'),'Beállítások');
assert.equal(TCI18n.t('35 Tiere'),'35 állat');
assert.equal(TCI18n.t('Hallo Sascha 👋'),'Szia Sascha 👋');
assert.equal(TCI18n.t('Archiv ist leer'),'Az archívum üres');
assert.equal(TCI18n.t('Luna: Gewicht aktualisieren'),'Luna: Súly frissítése');
assert.equal(TCI18n.t('seit 1 Tag fällig'),'1 napja esedékes');
assert.equal(TCI18n.locale(),'hu-HU');

const englishKeys=Object.keys(NGTLocales.en.phrases).sort();
['it','hu'].forEach(function(language){
 assert.deepEqual(
  Object.keys(NGTLocales[language].phrases).sort(),
  englishKeys,
  language+' catalogue must cover every English source phrase.'
 );
});
['en','it','hu'].forEach(function(language){
 assert.equal(
  Object.values(NGTLocales[language].phrases).some(function(value){return !String(value).trim();}),
  false,
  language+' catalogue must not contain empty translations.'
 );
});

TCI18n.set('de',{reload:false});

assert.equal(TCI18n.current(),'de');
assert.equal(TCI18n.hasSelection(),true);
assert.equal(values.get('terracontrol_language_v1'),'de');
assert.equal(TCI18n.t('Bestand'),'Bestand');
assert.equal(TCI18n.locale(),'de-DE');

console.log('i18n.node.test.js: all assertions passed');
