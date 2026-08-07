'use strict';

const assert=require('assert');

global.window=global;
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
assert.strictEqual(probability(gecko,'Tremper Albino · Eclipse'),12.5);

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

console.log('genetics.node.test.js: all checks passed');
