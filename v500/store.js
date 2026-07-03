(function(){
'use strict';
const KEY='spd_v53';
const LEGACY_KEYS=['ngt_v500_data','terracontrol_data_v1','terracontrol_data_shadow_v1'];
const TYPES=['koenig','boas','geckos','spinnen'];
const LABELS={koenig:'🐍 Königspythons',boas:'🐍 Boas',geckos:'🦎 Leopardgeckos',spinnen:'🕷 Vogelspinnen'};
const FEEDER_STATES=['Frost','Lebend'];
const FEEDER_SIZES={
 Ratte:['5-9 g','10 g','20 g','30 g','50 g','70 g','90 g','120 g','150 g','200 g','250 g','300 g','350 g','400 g'],
 Maus:['1-2 g','3-4 g','5-6 g','7-10 g','11-14 g','15-19 g','20-24 g','25-29 g','30 g','40 g','50 g'],
 VZM:['1-3 g','4-6 g','7-9 g','10 g','20 g','30 g','40 g','50 g','60 g','70 g','80 g','90 g','100 g']
};
const FEEDER_TYPES=Object.keys(FEEDER_SIZES);
const INSECT_PREY=['Heimchen klein','Heimchen mittel','Heimchen groß','Schabe klein','Schabe mittel','Schabe groß'];
const PREY=FEEDER_STATES.flatMap(state=>FEEDER_TYPES.flatMap(type=>FEEDER_SIZES[type].map(size=>`${state} ${type} ${size}`)));
function base(){return {koenig:[],boas:[],geckos:[],spinnen:[],clutches:[],sales:[],archive:[],foodInventory:[],settings:{}}}
function byDate(a,b){return String(a.date||'').localeCompare(String(b.date||''))}
function cleanSize(s){return String(s||'').replace(/\s+/g,' ').trim().replace(/gramm/ig,'g')}
function normalizeState(s){s=String(s||'').toLowerCase();return s.includes('lebend')?'Lebend':'Frost'}
function normalizeType(s){s=String(s||'').toLowerCase();if(s.includes('vzm'))return 'VZM';if(s.includes('maus')||s.includes('mäus'))return 'Maus';if(s.includes('ratte'))return 'Ratte';return ''}
function feederLabel(state,type,size){state=state||'Frost';type=type||'Ratte';size=cleanSize(size||'');return [state,type,size].filter(Boolean).join(' ')}
function feederOptions(t){if(t==='geckos'||t==='spinnen')return INSECT_PREY.slice();return PREY.slice()}
function foodKey(s){const p=parseFeeder(s);if(!p.prey)return String(s||'').toLowerCase().replace(/\s+/g,'');return [p.state,p.prey,p.size||p.amount].join('_').toLowerCase().replace(/\s+/g,'')}
function foodLabel(s){const p=parseFeeder(s);return p.label||String(s||'')}
function normalizeFoodItem(f){f=f||{};f.name=f.name||f.label||'';f.key=foodKey(f.name);f.id=f.id||('food_'+f.key);f.label=foodLabel(f.name);f.qty=Number(f.qty||0);return f}
function normalize(d){d=d||base();TYPES.forEach(t=>{if(!Array.isArray(d[t]))d[t]=[];d[t].forEach((a,i)=>{a.uuid=a.uuid||a.uid||NGT500.uid();a.uid=a.uid||a.uuid;a.type=a.type||t;a.name=a.name||a.displayId||`${t}-${i+1}`;a.status=a.status||'Bestand';a.feeds=Array.isArray(a.feeds)?a.feeds:[];a.sheds=Array.isArray(a.sheds)?a.sheds:[];a.weights=Array.isArray(a.weights)?a.weights:[];a.photos=Array.isArray(a.photos)?a.photos:[];a.feeds.sort(byDate);a.sheds.sort(byDate);a.weights.sort(byDate);a.defaultFeeder=a.defaultFeeder||a.futterStandard||a.standardFeed||'';const p=parseFeeder(a.defaultFeeder);a.defaultFeederState=a.defaultFeederState||p.state||'Frost';a.defaultFeederType=a.defaultFeederType||p.prey||'Ratte';a.defaultFeederSize=a.defaultFeederSize||p.size||'';if(a.defaultFeederType&&a.defaultFeederSize&&!a.defaultFeeder)a.defaultFeeder=feederLabel(a.defaultFeederState,a.defaultFeederType,a.defaultFeederSize);a.defaultFeederKey=foodKey(a.defaultFeeder);});});['clutches','sales','archive','foodInventory'].forEach(k=>{if(!Array.isArray(d[k]))d[k]=[]});d.foodInventory=d.foodInventory.map(normalizeFoodItem);return d}
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
function parseFeeder(s){s=String(s||'').trim();if(!s)return {state:'Frost',prey:'',size:'',amount:0,label:''};const state=normalizeState(s);const prey=normalizeType(s);let size='';let m=s.match(/(\d+\s*-\s*\d+|\d+)\s*g/i);if(m)size=cleanSize(m[1]+' g');if(!prey){return {state,prey:s,size:'',amount:0,label:s}}const amount=size&&/^\d+\s*g$/i.test(size)?Number(size.replace(/\D/g,'')):0;return {state,prey,size,amount,label:feederLabel(state,prey,size)}}
function exportJson(){return JSON.stringify(db,null,2)}
function importJson(txt){db=normalize(JSON.parse(txt));save()}
window.NGTStore={TYPES,LABELS,PREY,FEEDER_STATES,FEEDER_TYPES,FEEDER_SIZES,INSECT_PREY,data,save,allAnimals,findAnimal,animal,addAnimal,updateAnimal,deleteAnimal,addFood,reduceFood,market,parseFeeder,foodKey,foodLabel,feederLabel,feederOptions,exportJson,importJson};
})();