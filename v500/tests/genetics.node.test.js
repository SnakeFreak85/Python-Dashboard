'use strict';

const assert=require('assert');

global.window=global;
require('../genetics-catalog.js');
require('../genetics-engine.js');

function probability(result,label){
 const row=result.outcomes.find(function(outcome){return outcome.label===label;});
 return row?row.probability:0;
}

const recessive=GeneticsEngine.predict(
 {animalGroup:'Pythons',morph:'het Albino'},
 {animalGroup:'Pythons',morph:'Albino'}
);
assert.strictEqual(recessive.available,true);
assert.strictEqual(probability(recessive,'Albino'),50);
assert.strictEqual(probability(recessive,'het Albino'),50);

const combined=GeneticsEngine.predict(
 {animalGroup:'Pythons',morph:'Pastel het Albino'},
 {animalGroup:'Pythons',morph:'Albino'}
);
assert.strictEqual(probability(combined,'Albino · Pastel'),25);
assert.strictEqual(probability(combined,'Pastel · het Albino'),25);

const gecko=GeneticsEngine.predict(
 {animalGroup:'Leopardgeckos',morph:'Tremper Albino het Eclipse'},
 {animalGroup:'Leopardgeckos',morph:'het Tremper Albino het Eclipse'}
);
assert.strictEqual(gecko.available,true);
assert.strictEqual(probability(gecko,'Eclipse · Tremper Albino'),12.5);

const unknown=GeneticsEngine.predict(
 {animalGroup:'Test',morph:'Unbekannt A'},
 {animalGroup:'Test',morph:'Unbekannt B'}
);
assert.strictEqual(unknown.available,false);

const uncertain=GeneticsEngine.predict(
 {animalGroup:'Pythons',morph:'66% het Clown'},
 {animalGroup:'Pythons',morph:'Clown'}
);
assert.strictEqual(uncertain.available,true);
assert.ok(uncertain.warnings.some(function(warning){return warning.includes('mögliches het');}));
assert.strictEqual(probability(uncertain,'Clown'),33);

const structured=GeneticsEngine.predict(
 {
  animalGroup:'Königspythons',
  genetics:[
   {traitId:'bp-pastel',state:'visual',confirmed:true},
   {traitId:'bp-albino',state:'het',confirmed:true}
  ]
 },
 {
  animalGroup:'Königspythons',
  genetics:[{traitId:'bp-albino',state:'visual',confirmed:true}]
 }
);
assert.strictEqual(structured.provisional,false);
assert.strictEqual(probability(structured,'Albino · Pastel'),25);

const unconfirmed=GeneticsEngine.predict(
 {animalGroup:'Königspythons',genetics:[{traitId:'bp-pastel',state:'visual',confirmed:false}]},
 {animalGroup:'Königspythons',genetics:[]}
);
assert.strictEqual(unconfirmed.available,false);
assert.ok(unconfirmed.warnings.some(function(warning){return warning.includes('nicht bestätigte');}));

const complexResult=GeneticsEngine.predict(
 {animalGroup:'Königspythons',genetics:[{traitId:'bp-mojave',state:'visual',confirmed:true}]},
 {animalGroup:'Königspythons',genetics:[{traitId:'bp-lesser',state:'visual',confirmed:true}]}
);
assert.strictEqual(complexResult.available,true);
assert.strictEqual(probability(complexResult,'Lesser + Mojave (Blue-Eyed-Leucistic-Komplex)'),25);
assert.strictEqual(probability(complexResult,'Mojave'),25);
assert.strictEqual(probability(complexResult,'Lesser'),25);

const automaticallyDetected=GeneticsEngine.geneticsForAnimal(
 {animalGroup:'Königspythons',morph:'Pastel het Clown'}
);
assert.strictEqual(automaticallyDetected.provisional,false);
assert.deepStrictEqual(
 automaticallyDetected.entries.map(function(entry){return [entry.name,entry.state];}).sort(),
 [['Clown','het'],['Pastel','visual']]
);

const automaticCryptic=GeneticsEngine.detect({
 animalGroup:'Königspythons',
 morph:'Pastel Ultramel het Cryptic'
});
assert.deepStrictEqual(
 automaticCryptic.entries.map(function(entry){return [entry.name,entry.state,entry.confirmed];}).sort(),
 [
  ['Cryptic','het',true],
  ['Pastel','visual',true],
  ['Ultramel','visual',true]
 ]
);

const crypton=GeneticsEngine.predict(
 {animalGroup:'Königspythons',morph:'Clown'},
 {animalGroup:'Königspythons',morph:'het Cryptic'}
);
assert.strictEqual(crypton.available,true);
assert.strictEqual(probability(crypton,'Crypton (Clown + Cryptic)'),50);
assert.strictEqual(probability(crypton,'het Clown'),50);

const unknownAlongsideKnown=GeneticsEngine.predict(
 {animalGroup:'Königspythons',morph:'Pastel NeuesGen'},
 {animalGroup:'Königspythons',morph:'Pastel'}
);
assert.strictEqual(unknownAlongsideKnown.available,true);
assert.ok(unknownAlongsideKnown.warnings.some(function(warning){return warning.toLowerCase().includes('nicht automatisch erkannt');}));

const possibleDoubleHet=GeneticsEngine.detect({
 animalGroup:'Königspythons',
 morph:'Leopard Clown pdh DG Pied'
});
assert.deepStrictEqual(
 possibleDoubleHet.entries.map(function(entry){return [entry.name,entry.state,entry.probability];}),
 [
  ['Leopard','visual',100],
  ['Clown','visual',100],
  ['Desert Ghost','possible_het',66],
  ['Pied','possible_het',66]
 ]
);
assert.ok(possibleDoubleHet.warnings.some(function(warning){return warning.includes('66 % je Gen');}));

const explicitPossibleDoubleHet=GeneticsEngine.detect({
 animalGroup:'Königspythons',
 morph:'Leopard Clown 50% possible double het Desert Ghost Pied'
});
assert.deepStrictEqual(
 explicitPossibleDoubleHet.entries.slice(-2).map(function(entry){return [entry.name,entry.state,entry.probability];}),
 [['Desert Ghost','possible_het',50],['Pied','possible_het',50]]
);

const polygenicOnly=GeneticsEngine.predict(
 {animalGroup:'Leopardgeckos',genetics:[{traitId:'lg-tangerine',state:'visual',confirmed:true}]},
 {animalGroup:'Leopardgeckos',genetics:[]}
);
assert.strictEqual(polygenicOnly.available,false);
assert.ok(polygenicOnly.warnings.some(function(warning){return warning.includes('Linienmerkmal');}));

console.log('genetics.node.test.js: all checks passed');
