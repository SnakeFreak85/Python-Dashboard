(function(){
'use strict';
const KEY='ngt_ai_context_v1';
function get(){try{return JSON.parse(sessionStorage.getItem(KEY)||'{}')||{};}catch(e){return {};}}
function set(ctx){sessionStorage.setItem(KEY,JSON.stringify(ctx||{}));return ctx;}
function clear(){sessionStorage.removeItem(KEY);}
function isAnimalOnly(line){const hit=NGTAIEngine.findAnimal(line);if(!hit)return null;const p=NGTAIEngine.parseLine(line,null);return p.intent==='unknown'?hit:null;}
function splitMultiAnimal(line){
 const low=NGTAIEngine.norm(line);
 if(!/ und |,/.test(low))return null;
 const all=NGTStore.allAnimals();
 const hits=[];
 all.forEach(x=>{const n=NGTAIEngine.norm(x.a.name||'');if(n&&low.includes(n))hits.push(x);});
 return hits.length>1?hits:null;
}
function expandMultiAnimal(line){
 const hits=splitMultiAnimal(line);
 if(!hits)return null;
 let cleaned=line;
 hits.forEach(h=>{cleaned=cleaned.replace(new RegExp(h.a.name,'ig'),'')});
 cleaned=cleaned.replace(/\bund\b|,/gi,' ').replace(/\s+/g,' ').trim();
 return hits.map(h=>h.a.name+' '+cleaned);
}
function enhance(text){
 const ctx=get();
 let current=ctx.lastAnimal?NGTStore.findAnimal(ctx.lastAnimal):null;
 const input=String(text||'').split(/\n|;/).map(x=>x.trim()).filter(Boolean);
 const lines=[];
 input.forEach(line=>{
  const multi=expandMultiAnimal(line);
  if(multi){lines.push(...multi);return;}
  const animalOnly=isAnimalOnly(line);
  if(animalOnly){current=animalOnly;ctx.lastAnimal=animalOnly.a.name;lines.push(line);return;}
  const p=NGTAIEngine.parseLine(line,current);
  if(!p.animal&&current)lines.push(current.a.name+' '+line);
  else lines.push(line);
  if(p.animal){current=p.animal;ctx.lastAnimal=p.animal.a.name;}
 });
 set(ctx);
 return lines.join('\n');
}
function parse(text){return NGTAIEngine.parse(enhance(text));}
function rememberAnimal(name){const hit=NGTStore.findAnimal(name);if(hit){const ctx=get();ctx.lastAnimal=hit.a.name;set(ctx);return hit;}return null;}
window.NGTAIContext={get,set,clear,enhance,parse,rememberAnimal,splitMultiAnimal,expandMultiAnimal};
})();
