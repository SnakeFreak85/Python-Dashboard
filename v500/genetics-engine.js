(function(){
'use strict';

/*
 * The genetics engine deliberately calculates only well-known, independent
 * Mendelian traits. It never writes a predicted morph into an animal record.
 * Predictions are guidance for a breeding project; every hatchling still has
 * to be identified and confirmed by the keeper.
 */
const TRAITS=[
 {name:'Albino',aliases:['albino'],inheritance:'recessive',scope:'snake'},
 {name:'Pied',aliases:['piebald','pied'],inheritance:'recessive',scope:'snake'},
 {name:'Clown',aliases:['clown'],inheritance:'recessive',scope:'snake'},
 {name:'Axanthic',aliases:['axanthic'],inheritance:'recessive',scope:'snake'},
 {name:'Genetic Stripe',aliases:['genetic stripe'],inheritance:'recessive',scope:'snake'},
 {name:'Ultramel',aliases:['ultramel'],inheritance:'recessive',scope:'snake'},
 {name:'Hypo / Ghost',aliases:['orange ghost','hypo','ghost'],inheritance:'recessive',scope:'snake'},
 {name:'Pastel',aliases:['pastel'],inheritance:'incomplete',scope:'snake'},
 {name:'Mojave',aliases:['mojave'],inheritance:'incomplete',scope:'snake',complex:'BEL'},
 {name:'Lesser',aliases:['lesser','butter'],inheritance:'incomplete',scope:'snake',complex:'BEL'},
 {name:'Fire',aliases:['fire'],inheritance:'incomplete',scope:'snake'},
 {name:'Enchi',aliases:['enchi'],inheritance:'incomplete',scope:'snake'},
 {name:'Cinnamon',aliases:['cinnamon'],inheritance:'incomplete',scope:'snake'},
 {name:'Black Pastel',aliases:['black pastel'],inheritance:'incomplete',scope:'snake'},
 {name:'Yellow Belly',aliases:['yellow belly'],inheritance:'incomplete',scope:'snake'},
 {name:'Orange Dream',aliases:['orange dream'],inheritance:'incomplete',scope:'snake'},
 {name:'Spotnose',aliases:['spotnose'],inheritance:'incomplete',scope:'snake'},
 {name:'Banana / Coral Glow',aliases:['coral glow','banana'],inheritance:'incomplete',scope:'snake'},
 {name:'Pinstripe',aliases:['pinstripe'],inheritance:'dominant',scope:'snake'},
 {name:'Spider',aliases:['spider'],inheritance:'dominant',scope:'snake'},

 {name:'Tremper Albino',aliases:['tremper albino','tremper'],inheritance:'recessive',scope:'gecko'},
 {name:'Bell Albino',aliases:['bell albino'],inheritance:'recessive',scope:'gecko'},
 {name:'Rainwater Albino',aliases:['rainwater albino','las vegas albino'],inheritance:'recessive',scope:'gecko'},
 {name:'Eclipse',aliases:['eclipse'],inheritance:'recessive',scope:'gecko'},
 {name:'Blizzard',aliases:['blizzard'],inheritance:'recessive',scope:'gecko'},
 {name:'Murphy Patternless',aliases:['murphy patternless','patternless'],inheritance:'recessive',scope:'gecko'},
 {name:'Mack Snow',aliases:['mack snow'],inheritance:'incomplete',scope:'gecko'},
 {name:'Lemon Frost',aliases:['lemon frost'],inheritance:'dominant',scope:'gecko'}
];

function text(value){
 return String(value==null?'':value).trim();
}

function normalized(value){
 return text(value).toLowerCase()
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g,'')
  .replace(/[^a-z0-9%]+/g,' ')
  .replace(/\s+/g,' ')
  .trim();
}

function animalScope(animal){
 const haystack=normalized([
  animal&&animal.animalGroup,
  animal&&animal.genus,
  animal&&animal.species
 ].filter(Boolean).join(' '));
 if(/gecko|eublepharis|correlophus|phelsuma/.test(haystack))return 'gecko';
 if(/python|boa|snake|schlange|natter|viper|kobra/.test(haystack))return 'snake';
 return '';
}

function stateFor(source,trait){
 const aliases=trait.aliases.slice().sort(function(a,b){return b.length-a.length;});
 let found=-1;
 let alias='';
 aliases.some(function(candidate){
  const index=source.indexOf(normalized(candidate));
  if(index<0)return false;
  found=index;
  alias=normalized(candidate);
  return true;
 });
 if(found<0)return null;

 const prefix=source.slice(Math.max(0,found-24),found);
 if(/(poss|possible|moglich|moeglich|50|66)\s*%?\s*het/.test(prefix)){
  return {uncertain:true,label:'möglicherweise het'};
 }
 if(/\bhet\s*$/.test(prefix)||/\bhet\b/.test(prefix.slice(-12))){
  return {alleles:1,label:'het'};
 }
 if(trait.inheritance==='incomplete'&&/\bsuper\s*$/.test(prefix)){
  return {alleles:2,label:'super'};
 }
 return {
  alleles:trait.inheritance==='recessive'?2:1,
  label:'visual',
  alias:alias
 };
}

function detect(animal){
 const morph=normalized(animal&&animal.morph);
 const scope=animalScope(animal||{});
 const entries=[];
 const warnings=[];
 if(!morph)return {scope:scope,entries:entries,warnings:warnings};

 TRAITS.forEach(function(trait){
  if(scope&&trait.scope!==scope)return;
  const state=stateFor(morph,trait);
  if(!state)return;
  if(state.uncertain){
   warnings.push(trait.name+' ist nur als mögliches het angegeben und wird nicht fest berechnet.');
   return;
  }
  entries.push({
   name:trait.name,
   inheritance:trait.inheritance,
   alleles:state.alleles,
   complex:trait.complex||''
  });
  if(trait.inheritance==='dominant'){
   warnings.push(trait.name+' wird als einfaktorig angenommen; ohne Gentest kann die Quote abweichen.');
  }
 });

 return {scope:scope,entries:entries,warnings:warnings};
}

function gametes(alleles){
 if(alleles>=2)return [{allele:1,p:1}];
 if(alleles===1)return [{allele:0,p:.5},{allele:1,p:.5}];
 return [{allele:0,p:1}];
}

function locusOutcomes(trait,fatherAlleles,motherAlleles){
 const map={};
 gametes(fatherAlleles).forEach(function(f){
  gametes(motherAlleles).forEach(function(m){
   const alleles=f.allele+m.allele;
   map[alleles]=(map[alleles]||0)+(f.p*m.p);
  });
 });
 return Object.keys(map).map(function(key){
  const alleles=Number(key);
  let visual='';
  let carrier='';
  if(trait.inheritance==='recessive'){
   if(alleles===2)visual=trait.name;
   if(alleles===1)carrier='het '+trait.name;
  }else if(trait.inheritance==='incomplete'){
   if(alleles===2)visual='Super '+trait.name;
   if(alleles===1)visual=trait.name;
  }else if(alleles>0){
   visual=trait.name;
  }
  return {p:map[key],visual:visual,carrier:carrier};
 });
}

function predictionLabel(row){
 const parts=row.visuals.concat(row.carriers);
 return parts.length?parts.join(' · '):'ohne berechnete Merkmale';
}

function predict(father,mother){
 const fd=detect(father||{});
 const md=detect(mother||{});
 const warnings=fd.warnings.concat(md.warnings);
 const byName={};

 fd.entries.concat(md.entries).forEach(function(entry){
  byName[entry.name]=entry;
 });
 let traits=Object.keys(byName).map(function(name){return byName[name];});

 const complexes={};
 const blockedComplexes=new Set();
 traits.forEach(function(trait){
  if(!trait.complex)return;
  complexes[trait.complex]=(complexes[trait.complex]||[]).concat(trait.name);
 });
 Object.keys(complexes).forEach(function(key){
  if(new Set(complexes[key]).size>1){
   warnings.push('Der '+key+'-Komplex enthält unterschiedliche Allele und muss fachlich geprüft werden.');
   blockedComplexes.add(key);
  }
 });
 if(blockedComplexes.size){
  traits=traits.filter(function(trait){return !blockedComplexes.has(trait.complex);});
 }

 if(!traits.length){
  return {
   available:false,
   outcomes:[],
   warnings:warnings,
   message:'Aus den gespeicherten Morph-Angaben konnten keine sicher berechenbaren Merkmale erkannt werden.'
  };
 }

 let combined=[{p:1,visuals:[],carriers:[]}];
 traits.forEach(function(trait){
  const f=fd.entries.find(function(entry){return entry.name===trait.name;});
  const m=md.entries.find(function(entry){return entry.name===trait.name;});
  const outcomes=locusOutcomes(trait,f?f.alleles:0,m?m.alleles:0);
  const next=[];
  combined.forEach(function(base){
   outcomes.forEach(function(outcome){
    next.push({
     p:base.p*outcome.p,
     visuals:base.visuals.concat(outcome.visual?[outcome.visual]:[]),
     carriers:base.carriers.concat(outcome.carrier?[outcome.carrier]:[])
    });
   });
  });
  combined=next;
 });

 const merged={};
 combined.forEach(function(row){
  const label=predictionLabel(row);
  merged[label]=(merged[label]||0)+row.p;
 });
 const outcomes=Object.keys(merged).map(function(label){
  return {label:label,probability:Math.round(merged[label]*10000)/100};
 }).sort(function(a,b){return b.probability-a.probability||a.label.localeCompare(b.label,'de');});

 return {
  available:true,
  outcomes:outcomes,
  warnings:warnings,
  traits:traits.map(function(trait){return trait.name;})
 };
}

window.GeneticsEngine={
 detect:detect,
 predict:predict
};

})();
