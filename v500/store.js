(function(){
'use strict';
const KEY='spd_v53';
const TYPES=['koenig','boas','geckos','spinnen'];
const LABELS={koenig:'🐍 Königspythons',boas:'🐍 Boas',geckos:'🦎 Leopardgeckos',spinnen:'🕷 Vogelspinnen'};
const PREY=['Ratte 10g','Ratte 20g','Ratte 30g','Ratte 50g','Ratte 70g','Ratte 90g','Ratte 120g','Ratte 150g','Ratte 200g','Ratte 250g','Maus 10g','Maus 20g','Maus 30g','Maus 50g','ASF 20g','ASF 30g','ASF 50g','Küken','Heimchen klein','Heimchen mittel','Heimchen groß','Schabe klein','Schabe mittel','Schabe groß'];
function base(){return {koenig:[],boas:[],geckos:[],spinnen:[],clutches:[],sales:[],archive:[],foodInventory:[],settings:{}}}
function byDate(a,b){return String(a.date||'').localeCompare(String(b.date||''))}
function normalize(d){d=d||base();TYPES.forEach(t=>{if(!Array.isArray(d[t]))d[t]=[];d[t].forEach((a,i)=>{a.uuid=a.uuid||a.uid||NGT500.uid();a.uid=a.uid||a.uuid;a.type=a.type||t;a.name=a.name||a.displayId||`${t}-${i+1}`;a.status=a.status||'Bestand';a.feeds=Array.isArray(a.feeds)?a.feeds:[];a.sheds=Array.isArray(a.sheds)?a.sheds:[];a.weights=Array.isArray(a.weights)?a.weights:[];a.photos=Array.isArray(a.photos)?a.photos:[];a.feeds.sort(byDate);a.sheds.sort(byDate);a.weights.sort(byDate);a.defaultFeeder=a.defaultFeeder||a.futterStandard||a.standardFeed||'';});});['clutches','sales','archive','foodInventory'].forEach(k=>{if(!Array.isArray(d[k]))d[k]=[]});return d}
function load(){try{return normalize(JSON.parse(localStorage.getItem(KEY)||'null')||base())}catch(e){return base()}}
let db=load();
function save(){normalize(db);localStorage.setItem(KEY,JSON.stringify(db));NGT500.emit('store:changed',db)}
function data(){return db}
function allAnimals(){return TYPES.flatMap(t=>(db[t]||[]).map((a,i)=>({t,i,a})))}
function findAnimal(q){q=String(q||'').toLowerCase().trim();return allAnimals().find(x=>x.a.uuid===q||x.a.uid===q||String(x.a.name||'').toLowerCase()===q||String(x.a.displayId||'').toLowerCase()===q)}
function animal(t,i){return (db[t]||[])[Number(i)]}
function addAnimal(t,a){a=a||{};a.uuid=a.uuid||NGT500.uid();a.uid=a.uid||a.uuid;a.type=t;a.feeds=a.feeds||[];a.sheds=a.sheds||[];a.weights=a.weights||[];a.photos=a.photos||[];db[t].push(a);save();return a}
function updateAnimal(t,i,a){db[t][Number(i)]=a;save();return a}
function deleteAnimal(t,i){db[t].splice(Number(i),1);save()}
function addFood(name,qty){const item=db.foodInventory.find(x=>x.name===name);if(item)item.qty=Number(qty||0);else db.foodInventory.push({name,qty:Number(qty||0)});save()}
function reduceFood(name,n){const item=db.foodInventory.find(x=>x.name===name);if(item)item.qty=Math.max(0,Number(item.qty||0)-Number(n||1));save()}
function market(a){const buy=Number(a.buyPrice||0);const txt=String(a.morph||'').toLowerCase();let v=buy||80;if(txt.includes('ultramel'))v+=260;if(txt.includes('clown'))v+=300;if(txt.includes('pied'))v+=250;if(txt.includes('desert ghost'))v+=350;if(txt.includes('leopard'))v+=60;if(txt.includes('pastel'))v+=40;if(a.sex==='Weiblich')v*=1.15;return Math.round(v)}
function parseFeeder(s){const m=String(s||'').match(/(Ratte|Maus|ASF|Küken|Heimchen|Schabe)\s*(\d+)?g?/i)||String(s||'').match(/(\d+)\s*g\s*(Ratte|Maus|ASF|Küken|Heimchen|Schabe)/i);if(!m)return {prey:'Ratte',amount:0,label:''};if(isNaN(Number(m[1]))){return {prey:m[1],amount:Number(m[2]||0),label:`${Number(m[2]||0)}g ${m[1]}`}}return {prey:m[2],amount:Number(m[1]||0),label:`${Number(m[1]||0)}g ${m[2]}`}}
function exportJson(){return JSON.stringify(db,null,2)}
function importJson(txt){db=normalize(JSON.parse(txt));save()}
window.NGTStore={TYPES,LABELS,PREY,data,save,allAnimals,findAnimal,animal,addAnimal,updateAnimal,deleteAnimal,addFood,reduceFood,market,parseFeeder,exportJson,importJson};
})();
