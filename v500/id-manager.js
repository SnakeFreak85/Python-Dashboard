(function(){
'use strict';

const GROUP_CODES={
  'Königspython':'KP',
  'Königspythons':'KP',
  'Python regius':'KP',
  'Ball Python':'KP',

  'Vogelspinne':'VS',
  'Vogelspinnen':'VS',
  'Tarantel':'VS',
  'Taranteln':'VS',

  'Leopardgecko':'LG',
  'Leopardgeckos':'LG',

  'Boa':'BO',
  'Boas':'BO',

  'Springspinne':'SS',
  'Springspinnen':'SS',

  'Skorpion':'SK',
  'Skorpione':'SK',

  'Mantide':'MA',
  'Mantiden':'MA',
  'Gottesanbeterin':'MA',
  'Gottesanbeterinnen':'MA',

  'Schabe':'SB',
  'Schaben':'SB',

  'Tausendfüßer':'TF',
  'Tausendfüßer':'TF'
};

function clean(v){
  return String(v||'')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g,'')
    .replace(/ß/g,'ss')
    .replace(/[^a-zA-Z0-9\s]/g,' ')
    .replace(/\s+/g,' ')
    .trim();
}

function groupCode(group){
  const raw=String(group||'').trim();

  if(GROUP_CODES[raw])return GROUP_CODES[raw];

  const cleaned=clean(raw).toUpperCase();
  if(!cleaned)return 'TC';

  const words=cleaned.split(/\s+/).filter(Boolean);

  if(words.length>=2){
    return (words[0][0]+words[1][0]).replace(/[^A-Z0-9]/g,'')||'TC';
  }

  return cleaned.replace(/[^A-Z0-9]/g,'').slice(0,2)||'TC';
}

function isOffspring(a){
  const status=String((a&&a.status)||'').toLowerCase();
  const collection=String((a&&a.collection)||'').toLowerCase();

  return status==='nachzucht' ||
    collection==='offspring' ||
    collection==='nachzuchten';
}

function prefixForAnimal(a){
  const code=groupCode(a&&a.animalGroup);
  return isOffspring(a)?code+'-NZ':code+'-';
}

function numberFromPublicId(id,prefix){
  id=String(id||'').toUpperCase();
  prefix=String(prefix||'').toUpperCase();

  if(!id.startsWith(prefix))return 0;

  const rest=id.slice(prefix.length);
  const m=rest.match(/^(\d+)$/);

  return m?Number(m[1]||0):0;
}

function collectPublicIds(data){
  const ids={};

  (data&&data.animals||[]).forEach(function(a){
    if(a&&a.publicId)ids[String(a.publicId).toUpperCase()]=true;
  });

  (data&&data.clutches||[]).forEach(function(x){
    if(x&&x.publicId)ids[String(x.publicId).toUpperCase()]=true;
  });

  (data&&data.sales||[]).forEach(function(x){
    if(x&&x.publicId)ids[String(x.publicId).toUpperCase()]=true;
  });

  (data&&data.foodInventory||[]).forEach(function(x){
    if(x&&x.publicId)ids[String(x.publicId).toUpperCase()]=true;
  });

  return ids;
}

function nextAnimalId(data,animal){
  const prefix=prefixForAnimal(animal);
  let max=0;

  (data&&data.animals||[]).forEach(function(a){
    const n=numberFromPublicId(a&&a.publicId,prefix);
    if(n>max)max=n;
  });

  return prefix+String(max+1).padStart(3,'0');
}

function ensureAnimalId(data,animal){
  animal=animal||{};

  if(animal.publicId){
    animal.displayId=animal.displayId||animal.publicId;
    return animal.publicId;
  }

  const id=nextAnimalId(data,animal);
  animal.publicId=id;
  animal.displayId=id;

  return id;
}

function repairAnimalIds(data){
  const used={};

  (data&&data.animals||[]).forEach(function(a){
    if(!a)return;

    if(a.publicId){
      const key=String(a.publicId).toUpperCase();

      if(!used[key]){
        used[key]=true;
        a.displayId=a.displayId||a.publicId;
        return;
      }

      a.publicId='';
      a.displayId='';
    }

    const id=nextAnimalId(data,a);
    a.publicId=id;
    a.displayId=id;
    used[String(id).toUpperCase()]=true;
  });

  return data;
}

function matchAnimalId(a,q){
  q=String(q||'').toLowerCase().trim();

  return String(a.publicId||'').toLowerCase()===q ||
    String(a.displayId||'').toLowerCase()===q ||
    String(a.uuid||'').toLowerCase()===q ||
    String(a.uid||'').toLowerCase()===q;
}

window.NGTIdManager={
  GROUP_CODES,
  groupCode,
  isOffspring,
  nextAnimalId,
  ensureAnimalId,
  repairAnimalIds,
  collectPublicIds,
  matchAnimalId
};

})();