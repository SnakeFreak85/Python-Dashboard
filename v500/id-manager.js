(function(){
'use strict';

const GROUP_CODES={
  'Königspython':'KP',
  'Königspythons':'KP',
  'Koenigspython':'KP',
  'Koenigspythons':'KP',
  'Python regius':'KP',
  'Ball Python':'KP',

  'Felsenpython':'FP',
  'Felsenpythons':'FP',
  'Python sebae':'FP',

  'Netzpython':'NP',
  'Netzpythons':'NP',
  'Malayopython reticulatus':'NP',

  'Tigerpython':'TP',
  'Tigerpythons':'TP',
  'Python bivittatus':'TP',
  'Python molurus':'TP',

  'Blutpython':'BP',
  'Blutpythons':'BP',
  'Python brongersmai':'BP',

  'Vogelspinne':'VS',
  'Vogelspinnen':'VS',
  'Tarantel':'VS',
  'Taranteln':'VS',

  'Leopardgecko':'LG',
  'Leopardgeckos':'LG',

  'Boa':'BO',
  'Boas':'BO',
  'Boa constrictor':'BO',
  'Boa imperator':'BI',

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
  'Tausendfuesser':'TF'
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

function groupCode(value){
  const raw=String(value||'').trim();

  if(GROUP_CODES[raw])return GROUP_CODES[raw];

  const cleaned=clean(raw).toUpperCase();
  if(!cleaned)return 'TC';

  if(cleaned.includes('KOENIGSPYTHON')||cleaned.includes('KONIGSPYTHON')||cleaned.includes('PYTHON REGIUS')||cleaned.includes('BALL PYTHON'))return 'KP';
  if(cleaned.includes('FELSENPYTHON')||cleaned.includes('PYTHON SEBAE'))return 'FP';
  if(cleaned.includes('NETZPYTHON')||cleaned.includes('RETICULATUS'))return 'NP';
  if(cleaned.includes('TIGERPYTHON')||cleaned.includes('BIVITTATUS')||cleaned.includes('MOLURUS'))return 'TP';
  if(cleaned.includes('BLUTPYTHON')||cleaned.includes('BRONGERSMAI'))return 'BP';

  if(cleaned.includes('VOGELSPINNE')||cleaned.includes('TARANTEL'))return 'VS';
  if(cleaned.includes('LEOPARDGECKO'))return 'LG';
  if(cleaned.includes('SPRINGSPINNE'))return 'SS';
  if(cleaned.includes('SKORPION'))return 'SK';
  if(cleaned.includes('MANTIDE')||cleaned.includes('GOTTESANBETER'))return 'MA';

  if(cleaned.includes('BOA IMPERATOR'))return 'BI';
  if(cleaned.includes('BOA'))return 'BO';

  const words=cleaned.split(/\s+/).filter(Boolean);

  if(words.length>=2){
    return (words[0][0]+words[1][0]).replace(/[^A-Z0-9]/g,'')||'TC';
  }

  return cleaned.replace(/[^A-Z0-9]/g,'').slice(0,2)||'TC';
}

function animalCode(a){
  a=a||{};

  const combined=[
    a.animalGroup,
    a.genus,
    a.species,
    a.commonName
  ].filter(Boolean).join(' ');

  return groupCode(combined);
}

function isOffspring(a){
  if(
    window.AnimalEngine&&
    AnimalEngine.isOffspringAnimal
  ){
    return AnimalEngine.isOffspringAnimal(a);
  }

  const status=String((a&&a.status)||'').toLowerCase();
  const collection=String((a&&a.collection)||'').toLowerCase();

  return status==='nachzucht' ||
    collection==='offspring' ||
    collection==='nachzuchten';
}

function prefixForAnimal(a){
  const code=animalCode(a);
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

function publicIdMatchesAnimal(a){
  if(!a||!a.publicId)return false;
  return String(a.publicId).toUpperCase().startsWith(prefixForAnimal(a).toUpperCase());
}

function ensureAnimalId(data,animal){
  animal=animal||{};

  if(animal.publicId&&publicIdMatchesAnimal(animal)){
    animal.displayId=animal.publicId;
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

    if(a.publicId&&publicIdMatchesAnimal(a)){
      const key=String(a.publicId).toUpperCase();

      if(!used[key]){
        used[key]=true;
        a.displayId=a.publicId;
        return;
      }
    }

    a.publicId='';
    a.displayId='';

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
  animalCode,
  isOffspring,
  prefixForAnimal,
  nextAnimalId,
  ensureAnimalId,
  repairAnimalIds,
  collectPublicIds,
  matchAnimalId
};

})();
