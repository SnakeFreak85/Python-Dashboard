(function(){
'use strict';

const KEY='spd_v53';

const LEGACY_TYPES=['koenig','boas','geckos','spinnen'];

const LEGACY_LABELS={
  koenig:'🐍 Königspythons',
  boas:'🐍 Boas',
  geckos:'🦎 Leopardgeckos',
  spinnen:'🕷 Vogelspinnen'
};

const LEGACY_GROUPS={
  koenig:'Königspythons',
  boas:'Boas',
  geckos:'Leopardgeckos',
  spinnen:'Vogelspinnen'
};

const FEEDER_STATES=['Frost','Lebend'];

const FEEDER_SIZES={
  Ratte:['5-9 g','10 g','20 g','30 g','50 g','70 g','90 g','120 g','150 g','200 g','250 g','300 g','350 g','400 g'],
  Maus:['1-2 g','3-4 g','5-6 g','7-10 g','11-14 g','15-19 g','20-24 g','25-29 g','30 g','40 g','50 g'],
  VZM:['1-3 g','4-6 g','7-9 g','10 g','20 g','30 g','40 g','50 g','60 g','70 g','80 g','90 g','100 g']
};

const FEEDER_TYPES=Object.keys(FEEDER_SIZES);
const INSECT_PREY=['Heimchen klein','Heimchen mittel','Heimchen groß','Schabe klein','Schabe mittel','Schabe groß'];
const PREY=FEEDER_STATES.flatMap(state=>FEEDER_TYPES.flatMap(type=>FEEDER_SIZES[type].map(size=>`${state} ${type} ${size}`)));

function base(){
  const d={
    schemaVersion:3,
    animals:[],
    animalGroups:[],
    foodCatalog:[],
    foodInventory:[],
    clutches:[],
    sales:[],
    archive:[],
    settings:{}
  };

  LEGACY_TYPES.forEach(t=>d[t]=[]);
  return d;
}

function byDate(a,b){
  return String(a.date||'').localeCompare(String(b.date||''));
}

function cleanSize(s){
  return String(s||'').replace(/\s+/g,' ').trim().replace(/gramm/ig,'g');
}

function normalizeState(s){
  s=String(s||'').toLowerCase();
  return s.includes('lebend')?'Lebend':'Frost';
}

function normalizeType(s){
  s=String(s||'').toLowerCase();
  if(s.includes('vzm'))return 'VZM';
  if(s.includes('maus')||s.includes('mäus'))return 'Maus';
  if(s.includes('ratte'))return 'Ratte';
  return '';
}

function feederLabel(state,type,size){
  state=state||'Frost';
  type=type||'Ratte';
  size=cleanSize(size||'');
  return [state,type,size].filter(Boolean).join(' ');
}

function parseFeeder(s){
  s=String(s||'').trim();
  if(!s)return {state:'Frost',prey:'',size:'',amount:0,label:''};

  const state=normalizeState(s);
  const prey=normalizeType(s);
  let size='';
  const m=s.match(/(\d+\s*-\s*\d+|\d+)\s*g/i);

  if(m)size=cleanSize(m[1]+' g');

  if(!prey){
    return {state,prey:s,size:'',amount:0,label:s};
  }

  const amount=size&&/^\d+\s*g$/i.test(size)?Number(size.replace(/\D/g,'')):0;
  return {state,prey,size,amount,label:feederLabel(state,prey,size)};
}

function foodKey(s){
  const p=parseFeeder(s);
  if(!p.prey)return String(s||'').toLowerCase().replace(/\s+/g,'');
  return [p.state,p.prey,p.size||p.amount].join('_').toLowerCase().replace(/\s+/g,'');
}

function foodLabel(s){
  const p=parseFeeder(s);
  return p.label||String(s||'');
}

function normalizeFoodItem(f){
  f=f||{};
  f.name=f.name||f.label||'';
  f.key=f.key||foodKey(f.name);
  f.id=f.id||('food_'+f.key);
  f.label=f.label||foodLabel(f.name);
  f.qty=Number(f.qty||0);
  return f;
}

function inferLegacyTypeFromGroup(group){
  const g=String(group||'').toLowerCase();

  if(g.includes('boa'))return 'boas';
  if(g.includes('gecko'))return 'geckos';
  if(g.includes('spinne')||g.includes('tarantel'))return 'spinnen';
  if(g.includes('python')||g.includes('könig')||g.includes('koenig'))return 'koenig';

  return '';
}

function legacyGroupLabel(t){
  return LEGACY_GROUPS[t]||t||'Bestand';
}

function fallbackEnsureAnimalId(d,a){
  if(a.publicId){
    a.displayId=a.displayId||a.publicId;
    return a.publicId;
  }

  const group=String(a.animalGroup||'TC').trim();
  const code=group.replace(/[^a-zA-Z]/g,'').slice(0,2).toUpperCase()||'TC';
  const nz=String(a.status||'').toLowerCase()==='nachzucht';
  const prefix=nz?code+'-NZ':code+'-';
  let max=0;

  (d.animals||[]).forEach(function(x){
    const id=String(x.publicId||'').toUpperCase();
    if(id.startsWith(prefix)){
      const n=Number(id.replace(prefix,''));
      if(n>max)max=n;
    }
  });

  a.publicId=prefix+String(max+1).padStart(3,'0');
  a.displayId=a.publicId;
  return a.publicId;
}

function ensureAnimalPublicId(d,a){
  if(window.NGTIdManager&&NGTIdManager.ensureAnimalId){
    return NGTIdManager.ensureAnimalId(d,a);
  }

  return fallbackEnsureAnimalId(d,a);
}

function repairPublicIds(d){
  if(window.NGTIdManager&&NGTIdManager.repairAnimalIds){
    NGTIdManager.repairAnimalIds(d);
    return;
  }

  (d.animals||[]).forEach(function(a){
    fallbackEnsureAnimalId(d,a);
  });
}

function normalizeAnimal(a,t,i){
  a=a||{};

  const legacyType=a.legacyType||a.type||t||inferLegacyTypeFromGroup(a.animalGroup)||'';
  const group=a.animalGroup||a.group||legacyGroupLabel(legacyType)||'Unsortiert';

  a.uuid=a.uuid||a.uid||NGT500.uid();
  a.uid=a.uid||a.uuid;

  a.legacyType=legacyType;
  a.type=legacyType;
  a.animalGroup=group;

  a.genus=a.genus||a.gattung||a.breed||a.art||'';
  a.species=a.species||a.spezies||a.subspecies||a.unterart||'';

  a.name=a.name||'';
  a.status=a.status||'Bestand';

  a.feeds=Array.isArray(a.feeds)?a.feeds:[];
  a.sheds=Array.isArray(a.sheds)?a.sheds:[];
  a.weights=Array.isArray(a.weights)?a.weights:[];
  a.photos=Array.isArray(a.photos)?a.photos:[];

  a.feeds.sort(byDate);
  a.sheds.sort(byDate);
  a.weights.sort(byDate);

  a.defaultFeeder=a.defaultFeeder||a.futterStandard||a.standardFeed||'';

  const p=parseFeeder(a.defaultFeeder);

  a.defaultFeederState=a.defaultFeederState||p.state||'Frost';
  a.defaultFeederType=a.defaultFeederType||p.prey||'Ratte';
  a.defaultFeederSize=a.defaultFeederSize||p.size||'';

  if(a.defaultFeederType&&a.defaultFeederSize&&!a.defaultFeeder){
    a.defaultFeeder=feederLabel(a.defaultFeederState,a.defaultFeederType,a.defaultFeederSize);
  }

  a.defaultFeederKey=foodKey(a.defaultFeeder);

  a.publicId=a.publicId||a.displayId||'';
  a.displayId=a.displayId||a.publicId||'';

  return a;
}

function animalIndexKey(a){
  return String(a.uuid||a.uid||'').trim();
}

function rebuildLegacyArrays(d){
  LEGACY_TYPES.forEach(t=>d[t]=[]);

  (d.animals||[]).forEach(a=>{
    const t=a.legacyType||a.type||inferLegacyTypeFromGroup(a.animalGroup);
    if(t&&d[t])d[t].push(a);
  });
}

function rebuildGroups(d){
  const map={};

  (d.animals||[]).forEach(a=>{
    const group=a.animalGroup||'Unsortiert';
    const genus=a.genus||'';
    const species=a.species||'';

    if(!map[group]){
      map[group]={id:'group_'+group.toLowerCase().replace(/\s+/g,'_'),label:group,genus:{}};
    }

    if(genus){
      if(!map[group].genus[genus]){
        map[group].genus[genus]={label:genus,species:{}};
      }

      if(species){
        if(!map[group].genus[genus].species[species]){
          map[group].genus[genus].species[species]={label:species,count:0};
        }
        map[group].genus[genus].species[species].count++;
      }
    }
  });

  d.animalGroups=Object.keys(map).map(group=>{
    const g=map[group];
    return {
      id:g.id,
      label:g.label,
      genus:Object.keys(g.genus).map(genus=>({
        label:genus,
        species:Object.keys(g.genus[genus].species).map(species=>g.genus[genus].species[species])
      }))
    };
  });
}

function migrateLegacyAnimals(d){
  const existing={};

  if(Array.isArray(d.animals)){
    d.animals=d.animals.map((a,i)=>{
      const n=normalizeAnimal(a,a.legacyType||a.type,i);
      existing[animalIndexKey(n)]=true;
      return n;
    });
  }else{
    d.animals=[];
  }

  LEGACY_TYPES.forEach(t=>{
    if(!Array.isArray(d[t]))d[t]=[];

    d[t].forEach((a,i)=>{
      const n=normalizeAnimal(a,t,i);
      const key=animalIndexKey(n);

      if(!existing[key]){
        d.animals.push(n);
        existing[key]=true;
      }
    });
  });
}

function normalize(d){
  d=d||base();

  if(!Array.isArray(d.animals))d.animals=[];
  if(!Array.isArray(d.animalGroups))d.animalGroups=[];
  if(!Array.isArray(d.foodCatalog))d.foodCatalog=[];

  LEGACY_TYPES.forEach(t=>{
    if(!Array.isArray(d[t]))d[t]=[];
  });

  ['clutches','sales','archive','foodInventory'].forEach(k=>{
    if(!Array.isArray(d[k]))d[k]=[];
  });

  d.settings=d.settings||{};
  d.schemaVersion=3;

  migrateLegacyAnimals(d);

  d.animals=d.animals.map((a,i)=>normalizeAnimal(a,a.legacyType||a.type,i));
  d.foodInventory=d.foodInventory.map(normalizeFoodItem);

  repairPublicIds(d);

  rebuildLegacyArrays(d);
  rebuildGroups(d);

  return d;
}

function readJson(k){
  try{
    const v=localStorage.getItem(k);
    return v?JSON.parse(v):null;
  }catch(e){
    return null;
  }
}

function load(){
  const d=readJson(KEY);
  if(d)return normalize(d);

  return base();
}

let db=load();

function save(){
  normalize(db);

  const txt=JSON.stringify(db);
  localStorage.setItem(KEY,txt);

  try{
    localStorage.setItem('terracontrol_last_local_save_v1',JSON.stringify({
      at:new Date().toISOString(),
      animals:allAnimals().length
    }));
  }catch(e){}

  NGT500.emit('store:changed',db);
}

function clearLocal(){
  db=base();

  localStorage.removeItem(KEY);
  localStorage.removeItem('ngt_v500_data');
  localStorage.removeItem('terracontrol_data_v1');
  localStorage.removeItem('terracontrol_data_shadow_v1');
  localStorage.removeItem('terracontrol_last_migration_v1');

  save();
}

function data(){
  return db;
}

function allAnimals(){
  return (db.animals||[]).map((a,i)=>({
    t:a.legacyType||a.type||inferLegacyTypeFromGroup(a.animalGroup)||'',
    i,
    a
  }));
}

function animalsByGroup(){
  const map={};

  allAnimals().forEach(x=>{
    const a=x.a;
    const group=a.animalGroup||'Unsortiert';
    const genus=a.genus||'Ohne Gattung';
    const species=a.species||'Ohne Art';

    map[group]=map[group]||{};
    map[group][genus]=map[group][genus]||{};
    map[group][genus][species]=map[group][genus][species]||[];
    map[group][genus][species].push(x);
  });

  return map;
}

function findAnimal(q){
  q=String(q||'').toLowerCase().trim();

  return allAnimals().find(x=>
    String(x.a.publicId||'').toLowerCase()===q ||
    String(x.a.displayId||'').toLowerCase()===q ||
    String(x.a.uuid||'').toLowerCase()===q ||
    String(x.a.uid||'').toLowerCase()===q ||
    String(x.a.name||'').toLowerCase()===q ||
    String(x.a.genus||'').toLowerCase()===q ||
    String(x.a.species||'').toLowerCase()===q
  );
}

function animal(t,i){
  return (db.animals||[])[Number(i)];
}

function addAnimal(t,a){
  a=a||{};
  a.legacyType=t||a.legacyType||a.type||inferLegacyTypeFromGroup(a.animalGroup)||'';
  a.animalGroup=a.animalGroup||legacyGroupLabel(a.legacyType)||'Unsortiert';

  const n=normalizeAnimal(a,a.legacyType,(db.animals||[]).length);

  ensureAnimalPublicId(db,n);

  db.animals.push(n);
  save();

  return n;
}

function updateAnimal(t,i,a){
  const old=(db.animals||[])[Number(i)]||{};
  a={...old,...(a||{})};

  a.legacyType=a.legacyType||t||old.legacyType||old.type||inferLegacyTypeFromGroup(a.animalGroup)||'';
  a.animalGroup=a.animalGroup||old.animalGroup||legacyGroupLabel(a.legacyType)||'Unsortiert';
  a.publicId=a.publicId||old.publicId||old.displayId||'';
  a.displayId=a.displayId||a.publicId||'';
  a.defaultFeederKey=foodKey(a.defaultFeeder||a.futterStandard||a.standardFeed||'');

  db.animals[Number(i)]=normalizeAnimal(a,a.legacyType,Number(i));

  ensureAnimalPublicId(db,db.animals[Number(i)]);

  save();

  return db.animals[Number(i)];
}

function deleteAnimal(t,i){
  db.animals.splice(Number(i),1);
  save();
}

function addFood(name,qty){
  const key=foodKey(name);
  const item=db.foodInventory.find(x=>foodKey(x.name)===key||x.key===key);

  if(item){
    item.name=name;
    item.label=foodLabel(name);
    item.key=key;
    item.id=item.id||('food_'+key);
    item.qty=Number(qty||0);
  }else{
    db.foodInventory.push(normalizeFoodItem({name,qty:Number(qty||0)}));
  }

  save();
}

function reduceFood(name,n){
  const key=foodKey(name);
  const item=db.foodInventory.find(x=>foodKey(x.name)===key||x.key===key);

  if(item)item.qty=Math.max(0,Number(item.qty||0)-Number(n||1));

  save();
}

function market(a){
  const buy=Number(a.buyPrice||0);
  const txt=String(a.morph||'').toLowerCase();

  let v=buy||80;

  if(txt.includes('ultramel'))v+=260;
  if(txt.includes('clown'))v+=300;
  if(txt.includes('pied'))v+=250;
  if(txt.includes('desert ghost'))v+=350;
  if(txt.includes('leopard'))v+=60;
  if(txt.includes('pastel'))v+=40;
  if(a.sex==='Weiblich')v*=1.15;

  return Math.round(v);
}

function feederOptions(t){
  if(t==='geckos'||t==='spinnen')return INSECT_PREY.slice();
  return PREY.slice();
}

function exportJson(){
  return JSON.stringify(db,null,2);
}

function importJson(txt){
  db=normalize(JSON.parse(txt));
  save();
}

window.NGTStore={
  TYPES:LEGACY_TYPES,
  LABELS:LEGACY_LABELS,
  PREY,
  FEEDER_STATES,
  FEEDER_TYPES,
  FEEDER_SIZES,
  INSECT_PREY,

  data,
  save,
  clearLocal,

  allAnimals,
  animalsByGroup,
  findAnimal,
  animal,
  addAnimal,
  updateAnimal,
  deleteAnimal,

  addFood,
  reduceFood,

  market,
  parseFeeder,
  foodKey,
  foodLabel,
  feederLabel,
  feederOptions,

  exportJson,
  importJson
};

})();