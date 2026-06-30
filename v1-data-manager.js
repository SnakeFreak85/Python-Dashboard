(function(){
'use strict';
const KEY='spd_v53',BACKUP='spd_v53_backup',SNAP='spd_v53_last_good';
const TYPES=['koenig','boas','geckos','spinnen'];
function empty(){return {koenig:[],boas:[],geckos:[],spinnen:[],clutches:[],sales:[],archive:[],foodInventory:[]};}
function parse(v){try{return v?JSON.parse(v):null;}catch(e){return null;}}
function now(){return new Date().toISOString();}
function uid(){return crypto&&crypto.randomUUID?crypto.randomUUID():'ngt-'+Date.now().toString(36)+'-'+Math.random().toString(36).slice(2,10);}
function live(){try{if(typeof db!=='undefined'&&db)return db;}catch(e){}return window.db||empty();}
function setLive(data){data=normalize(data);try{if(typeof db!=='undefined')db=data;}catch(e){}window.db=data;return data;}
function norm(s){return String(s||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').trim();}
function normalizeAnimal(a,t,i){if(!a||typeof a!=='object')return a;const p={koenig:'KP',boas:'BOA',geckos:'LG',spinnen:'VS'}[t]||'ID';a.uuid=a.uuid||a.uid||uid();a.uid=a.uid||a.uuid;a.displayId=a.displayId||(p+'-'+String(i+1).padStart(3,'0'));a.type=a.type||t;a.feeds=Array.isArray(a.feeds)?a.feeds:[];a.feeds.forEach(f=>{if(f&&typeof f==='object'&&(f.accepted===undefined||f.accepted===null))f.accepted=true;});a.weights=Array.isArray(a.weights)?a.weights:[];a.sheds=Array.isArray(a.sheds)?a.sheds:[];a.updatedAt=a.updatedAt||now();return a;}
function normalize(data){data=data&&typeof data==='object'?data:empty();TYPES.forEach(t=>{if(!Array.isArray(data[t]))data[t]=[];});['clutches','sales','archive','foodInventory'].forEach(k=>{if(!Array.isArray(data[k]))data[k]=[];});TYPES.forEach(t=>data[t].forEach((a,i)=>normalizeAnimal(a,t,i)));data.__ngtSchema=data.__ngtSchema||3;data.__updatedAt=data.__updatedAt||now();return data;}
function animalCount(data){data=data||live();return TYPES.reduce((s,t)=>s+(Array.isArray(data[t])?data[t].length:0),0);}
function historyCount(data){data=data||live();return TYPES.reduce((s,t)=>s+(Array.isArray(data[t])?data[t].reduce((n,a)=>n+(Array.isArray(a.feeds)?a.feeds.length:0)+(Array.isArray(a.weights)?a.weights.length:0)+(Array.isArray(a.sheds)?a.sheds.length:0),0):0),0);}
function score(data){data=data||live();const updated=Date.parse(data.__assistantUpdatedAt||data.__updatedAt||'')||0;return animalCount(data)*1000000+historyCount(data)*10000+(data.clutches||[]).length*1000+(data.sales||[]).length*500+(data.archive||[]).length*250+(data.foodInventory||[]).filter(x=>Number(x.qty||0)>0).length*50+Math.floor(updated/1000000000);}
function load(){const list=[live(),parse(localStorage.getItem(KEY)),parse(localStorage.getItem(BACKUP)),parse(localStorage.getItem(SNAP))].filter(Boolean).map(normalize);return setLive(list.length?list.sort((a,b)=>score(b)-score(a))[0]:empty());}
function save(data,source){data=normalize(data||live());data.__updatedAt=now();if(source)data.__lastSource=source;const text=JSON.stringify(data);localStorage.setItem(KEY,text);localStorage.setItem(BACKUP,text);localStorage.setItem(SNAP,text);return setLive(data);}
function allAnimals(){const data=load();const out=[];TYPES.forEach(t=>data[t].forEach((a,i)=>out.push({type:t,index:i,animal:a})));return out;}
function findAnimal(idOrName){const key=norm(idOrName);if(!key)return null;return allAnimals().find(x=>[x.animal.uuid,x.animal.uid,x.animal.displayId,x.animal.name,x.animal.nickname,x.animal.rufname].some(v=>norm(v)===key))||allAnimals().find(x=>[x.animal.name,x.animal.nickname,x.animal.rufname].some(v=>norm(v)&&key.includes(norm(v))));}
function mutateAnimal(idOrName,fn,source){const data=load();const hit=findAnimal(idOrName);if(!hit)return null;const animal=data[hit.type][hit.index];normalizeAnimal(animal,hit.type,hit.index);fn(animal,data,hit);animal.updatedAt=now();save(data,source||'mutation');return {type:hit.type,index:hit.index,animal};}
function addFeed(idOrName,entry){return mutateAnimal(idOrName,a=>{a.feeds.push(Object.assign({date:'',prey:'',amount:'',accepted:true,note:'',createdAt:now()},entry,{accepted:entry.accepted!==false}));},'feed');}
function addWeight(idOrName,entry){return mutateAnimal(idOrName,a=>{a.weights.push(Object.assign({date:'',weight:0,note:'',createdAt:now()},entry));},'weight');}
function addShed(idOrName,entry){return mutateAnimal(idOrName,a=>{a.sheds.push(Object.assign({date:'',complete:true,quality:'ok',note:'',createdAt:now()},entry));},'shed');}
function setFood(name,qty){const data=load();let item=data.foodInventory.find(x=>norm(x.name)===norm(name));if(item)item.qty=Number(qty)||0;else data.foodInventory.push({name,qty:Number(qty)||0});save(data,'food');return item||data.foodInventory[data.foodInventory.length-1];}
function refresh(){load();if(typeof window.render==='function')setTimeout(()=>window.render(),0);}
window.NGTData={load,save,normalize,score,animalCount,historyCount,allAnimals,findAnimal,mutateAnimal,addFeed,addWeight,addShed,setFood,refresh};
load();
})();
