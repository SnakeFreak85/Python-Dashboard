#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';

const target=path.resolve(process.cwd(),'v500/modules/profile.js');
const checkOnly=process.argv.includes('--check');

if(!fs.existsSync(target)){
  console.error('profile.js nicht gefunden: '+target);
  process.exit(1);
}

let source=fs.readFileSync(target,'utf8');

const replacements=[
  {
    name:'ensure helper',
    from:`function ensure(a){
 a.health=Array.isArray(a.health)?a.health:[];
 a.photos=Array.isArray(a.photos)?a.photos:[];
 a.feeds=Array.isArray(a.feeds)?a.feeds:[];
 a.sheds=Array.isArray(a.sheds)?a.sheds:[];
 a.weights=Array.isArray(a.weights)?a.weights:[];
}`,
    to:`function ensure(a){
 return AnimalEngine.ensureHistories(a);
}`
  },
  {
    name:'latest helper',
    from:`function latest(list){
 return (list||[])
  .slice()
  .sort((a,b)=>String(b.date||'').localeCompare(String(a.date||'')))[0]||null;
}`,
    to:`function latest(list){
 return AnimalEngine.latest(list);
}`
  },
  {
    name:'daysSince helper',
    from:`function daysSince(d){
 const t=Date.parse(d||'');
 return t?Math.floor((Date.now()-t)/86400000):9999;
}`,
    to:`function daysSince(d){
 return AnimalEngine.daysSinceOr(d,9999);
}`
  },
  {
    name:'age helper',
    from:`function age(birth){
 const t=Date.parse(birth||'');

 if(!t)return '-';

 const y=Math.floor((Date.now()-t)/31557600000);

 return y>0?y+' Jahre':'< 1 Jahr';
}`,
    to:`function age(birth){
 return AnimalEngine.getAgeYearsText({birth:birth});
}`
  },
  {
    name:'scientificName helper',
    from:`function scientificName(a){
 return [a.genus,a.species]
  .filter(Boolean)
  .join(' ')||
  a.animalGroup||
  '-';
}`,
    to:`function scientificName(a){
 return AnimalEngine.getScientificName(a)||'-';
}`
  }
];

let changed=0;

for(const replacement of replacements){
  const occurrences=source.split(replacement.from).length-1;

  if(occurrences!==1){
    console.error(
      replacement.name+': erwartet genau 1 Treffer, gefunden '+occurrences
    );
    process.exit(1);
  }

  source=source.replace(replacement.from,replacement.to);
  changed+=1;
}

if(checkOnly){
  console.log(changed+' sichere Ersetzungen würden angewendet.');
  process.exit(0);
}

fs.writeFileSync(target,source,'utf8');
console.log(changed+' sichere Ersetzungen in profile.js angewendet.');
