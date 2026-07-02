(function(){
'use strict';
const KEY='spd_v53';
const LEGACY_KEYS=['ngt_v500_data','terracontrol_data_v1','terracontrol_data_shadow_v1'];
const TYPES=['koenig','boas','geckos','spinnen'];
const LABELS={koenig:'🐍 Königspythons',boas:'🐍 Boas',geckos:'🦎 Leopardgeckos',spinnen:'🕷 Vogelspinnen'};
const PREY=['Ratte 10g','Ratte 20g','Ratte 30g','Ratte 50g','Ratte 70g','Ratte 90g','Ratte 120g','Ratte 150g','Ratte 200g','Ratte 250g','Maus 10g','Maus 20g','Maus 30g','Maus 50g','ASF 20g','ASF 30g','ASF 50g','Küken','Heimchen klein','Heimchen mittel','Heimchen groß','Schabe klein','Schabe mittel','Schabe groß'];
function base(){return {koenig:[],boas:[],geckos:[],spinnen:[],clutches:[],sales:[],archive:[],foodInventory:[],settings:{}}}
function byDate(a,b){return String(a.date||'').localeCompare(String(b.date||''))}
function foodKey(s){const p=parseFeeder(s);if(!p.prey)return String(s||'').toLowerCase().replace(/\s+/g,'');return String(p.prey||'').toLowerCase()+'_'+String(p.amount||0)}
function foodLabel(s){const p=parseFeeder(s);return p.amount?`${p.amount}g ${p.prey}`:(p.prey||String(s||''))}
function normalizeFoodItem(f){f=f||{};f.name=f.name||f.label||'';f.key=foodKey(f.name);f.id=f.id||('food_'+f.key);f.label=foodLabel(f.name);f.qty=Number(f.qty||0);return f}
function normalize(d){d=d||base();TYPES.forEach(t=>{if(!Array.isArray(d[t]))d[t]=[];d[t].forEach((a,i)=>{a.uuid=a.uuid||a.uid||NGT500.uid();a.uid=a.uid||a.uuid;a.type=a.type||t;a.name=a.name||a.displayId||`${t}-${i+1}`;a.status=a.status||'Bestand';a.feeds=Array.isArray(a.feeds)?a.feeds:[];a.sheds=Array.isArray(a.sheds)?a.sheds:[];a.weights=Array.isArray(a.weights)?a.weights:[];a.photos=Array.isArray(a.photos)?a.photos:[];a.feeds.sort(byDate);a.sheds.sort(byDate);a.weights.sort(byDate);a.defaultFeeder=a.defaultFeeder||a.futterStandard||a.standardFeed||'';a.defaultFeederKey=foodKey(a.defaultFeeder);});});['clutches','sales','archive','foodInventory'].forEach(k=>{if(!Array.isArray(d[k]))d[k]=[]});d.foodInventory=d.foodInventory.map(normalizeFoodItem);return d}
function readJson(k){try{const v=localStorage.getItem(k);return v?JSON.parse(v):null}catch(e){return null}}
function load(){let d=readJson(KEY);if(d)return normalize(d);for(const k of LEGACY_KEYS){d=readJson(k);if(d){const migrated=normalize(d);try{localStorage.setItem(KEY,JSON.stringify(migrated));localStorage.setItem('terracontrol_last_migration_v1',JSON.stringify({from:k,at:new Date().toISOString()}));if(k==='ngt_v500_data')localStorage.removeItem(k)}catch(e){}return migrated}}return base()}
let db=load();
function save(){normalize(db);const txt=JSON.stringify(db);localStorage.setItem(KEY,txt);try{localStorage.setItem('terracontrol_data_shadow_v1',txt);localStorage.setItem('terracontrol_last_local_save_v1',JSON.stringify({at:new Date().toISOString(),animals:allAnimals().length}))}catch(e){}NGT500.emit('store:changed',db)}
function data(){return db}
function allAnimals(){return TYPES.flatMap(t=>(db[t]||[]).map((a,i)=>({t,i,a})))}
function findAnimal(q){q=String(q||'').toLowerCase().trim();return allAnimals().find(x=>x.a.uuid===q||x.a.uid===q||String(x.a.name||'').toLowerCase()===q||String(x.a.displayId||'').toLowerCase()===q)}
function animal(t,i){return (db[t]||[])[Number(i)]}
function addAnimal(t,a){a=a||{};a.uuid=a.uuid||NGT500.uid();a.uid=a.uid||a.uuid;a.type=t;a.feeds=a.feeds||[];a.sheds=a.sheds||[];a.weights=a.weights||[];a.photos=a.photos||[];a.defaultFeederKey=foodKey(a.defaultFeeder||a.futterStandard||a.standardFeed||'');db[t].push(a);save();return a}
function updateAnimal(t,i,a){a.defaultFeederKey=foodKey(a.defaultFeeder||a.futterStandard||a.standardFeed||'');db[t][Number(i)]=a;save();return a}
function deleteAnimal(t,i){db[t].splice(Number(i),1);save()}
function addFood(name,qty){const key=foodKey(name);const item=db.foodInventory.find(x=>foodKey(x.name)===key||x.key===key);if(item){item.name=name;item.label=foodLabel(name);item.key=key;item.id=item.id||('food_'+key);item.qty=Number(qty||0)}else db.foodInventory.push(normalizeFoodItem({name,qty:Number(qty||0)}));save()}
function reduceFood(name,n){const key=foodKey(name);const item=db.foodInventory.find(x=>foodKey(x.name)===key||x.key===key);if(item)item.qty=Math.max(0,Number(item.qty||0)-Number(n||1));save()}
function market(a){const buy=Number(a.buyPrice||0);const txt=String(a.morph||'').toLowerCase();let v=buy||80;if(txt.includes('ultramel'))v+=260;if(txt.includes('clown'))v+=300;if(txt.includes('pied'))v+=250;if(txt.includes('desert ghost'))v+=350;if(txt.includes('leopard'))v+=60;if(txt.includes('pastel'))v+=40;if(a.sex==='Weiblich')v*=1.15;return Math.round(v)}
function parseFeeder(s){s=String(s||'').trim();let m=s.match(/(\d+)\s*g\s*(Ratte|Maus|ASF|Küken|Heimchen|Schabe)/i);if(m)return {prey:m[2],amount:Number(m[1]||0),label:`${Number(m[1]||0)}g ${m[2]}`};m=s.match(/(Ratte|Maus|ASF|Küken|Heimchen|Schabe)\s*(\d+)?\s*g?/i);if(m)return {prey:m[1],amount:Number(m[2]||0),label:m[2]?`${Number(m[2]||0)}g ${m[1]}`:m[1]};return {prey:s,amount:0,label:s}}
function exportJson(){return JSON.stringify(db,null,2)}
function importJson(txt){db=normalize(JSON.parse(txt));save()}
window.NGTStore={TYPES,LABELS,PREY,data,save,allAnimals,findAnimal,animal,addAnimal,updateAnimal,deleteAnimal,addFood,reduceFood,market,parseFeeder,foodKey,foodLabel,exportJson,importJson};
})();