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
 if(
  window.NGTIdManager&&
  NGTIdManager.isOffspring
 ){
  return NGTIdManager.isOffspring(animal);
 }

 return (
  String((animal&&animal.status)||'').toLowerCase()==='nachzucht'||
  String((animal&&animal.collection)||'').toLowerCase()==='offspring'||
  String((animal&&animal.collection)||'').toLowerCase()==='nachzuchten'
 );
}

function statusOptions(current){
 return [
  'Bestand',
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
   ![
    'Archiv',
    'Verkauft',
    'Abgegeben',
    'Verstorben'
   ].includes(row.a.status)&&
   !isOffspringAnimal(row.a)
  );
 });
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
P.countBy=countBy;

window.NGTAnimalsInternal=P;

})();
