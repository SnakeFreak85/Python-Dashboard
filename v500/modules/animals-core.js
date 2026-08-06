(function(){
'use strict';

const P=window.NGTAnimalsInternal||{};

function esc(value){
 return NGT500.esc(value||'');
}

function jsArg(value){
 return String(value||'')
  .replace(/\\/g,'\\\\')
  .replace(/'/g,"\\'");
}

function text(value){
 return String(value==null?'':value).trim();
}

function positiveInteger(value){
 const number=Number(value);

 if(
  Number.isFinite(number)&&
  number>=1
 ){
  return Math.round(number);
 }

 return null;
}

function isOffspringAnimal(animal){
 return AnimalEngine.isOffspringAnimal(
  animal
 );
}

function statusOptions(current){
 return [
  'Bestand',
  'Reserviert',
  'Verkauft',
  'Abgegeben',
  'Verstorben',
  'Archiv'
 ].map(function(status){
  return `<option ${current===status?'selected':''}>${status}</option>`;
 }).join('');
}

function photoSrc(photo,preferThumb){
 return AnimalEngine.photoSource(
  photo,
  preferThumb
 );
}

function isUsablePhoto(photo){
 return !!photoSrc(photo,true);
}

function coverPhoto(animal){
 return AnimalEngine.coverPhoto(
  animal
 );
}

function allActive(){
 const all=
  NGTStore.allAnimals
   ?NGTStore.allAnimals()
   :[];

 return all.filter(function(row){
  return (
   AnimalEngine.isActiveAnimal(row.a)&&
   !isOffspringAnimal(row.a)
  );
 });
}

function allArchived(){
 const all=
  NGTStore.allAnimals
   ?NGTStore.allAnimals()
   :[];

 return all.filter(function(row){
  return !AnimalEngine.isActiveAnimal(row.a);
 });
}

function archiveStatus(animal){
 const status=AnimalEngine.canonicalStatus(
  animal&&animal.status
 );

 return status||'Archiv';
}

function archiveStatuses(rows){
 const preferred=[
  'Reserviert',
  'Verkauft',
  'Abgegeben',
  'Verstorben',
  'Archiv'
 ];
 const counts={};

 (rows||[]).forEach(function(row){
  const status=archiveStatus(row.a);
  counts[status]=(counts[status]||0)+1;
 });

 return Object.keys(counts)
  .sort(function(a,b){
   const aIndex=preferred.indexOf(a);
   const bIndex=preferred.indexOf(b);

   if(aIndex>=0||bIndex>=0){
    return (
     (aIndex>=0?aIndex:preferred.length)-
     (bIndex>=0?bIndex:preferred.length)
    );
   }

   return a.localeCompare(b,'de');
  })
  .map(function(status){
   return {
    label:status,
    count:counts[status]
   };
  });
}

function activeStatusFor(animal){
 return isOffspringAnimal(animal)
  ?'Nachzucht'
  :'Bestand';
}

function countBy(rows,keyFunction){
 const map={};

 rows.forEach(function(row){
  const key=
   keyFunction(row)||
   'Unsortiert';

  map[key]=(map[key]||0)+1;
 });

 return Object.keys(map)
  .sort()
  .map(function(key){
   return {
    label:key,
    count:map[key]
   };
  });
}

P.esc=esc;
P.jsArg=jsArg;
P.text=text;
P.positiveInteger=positiveInteger;
P.isOffspringAnimal=isOffspringAnimal;
P.statusOptions=statusOptions;
P.photoSrc=photoSrc;
P.coverPhoto=coverPhoto;
P.allActive=allActive;
P.allArchived=allArchived;
P.archiveStatus=archiveStatus;
P.archiveStatuses=archiveStatuses;
P.activeStatusFor=activeStatusFor;
P.countBy=countBy;

window.NGTAnimalsInternal=P;

})();
