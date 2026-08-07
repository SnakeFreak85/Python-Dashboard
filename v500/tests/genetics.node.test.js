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

const inferredEditor=GeneticsEngine.renderEditor(
 {animalGroup:'Königspythons',morph:'Pastel het Clown'},
 {prefix:'testGenetics'}
);
assert.ok(inferredEditor.includes('bisherigen Morphtext'));
assert.ok(inferredEditor.includes('bp-pastel'));
assert.ok(inferredEditor.includes('bp-clown'));

const polygenicOnly=GeneticsEngine.predict(
 {animalGroup:'Leopardgeckos',genetics:[{traitId:'lg-tangerine',state:'visual',confirmed:true}]},
 {animalGroup:'Leopardgeckos',genetics:[]}
);
assert.strictEqual(polygenicOnly.available,false);
assert.ok(polygenicOnly.warnings.some(function(warning){return warning.includes('Linienmerkmal');}));

console.log('genetics.node.test.js: all checks passed');
