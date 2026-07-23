(function(){
'use strict';

const P=window.NGTAnimalsInternal;

if(
 !P||
 !P.stock||
 !P.editor
){
 throw new Error(
  'Animals-Module fehlen. '+
  'Core, Futter, Bestand und Editor müssen vor animals.js geladen werden.'
 );
}

function editorView(t,i,fromHkn){
 const html=P.editor.render(t,i,fromHkn);

 if(i===undefined){
  return html;
 }

 const index=Number(i);
 const animal=NGTStore.animal(t,index);

 if(!animal){
  return html;
 }

 const deleteButton=`
    <button
     class="danger"
     style="grid-column:1/-1"
     onclick="NGTAnimals.remove('${P.jsArg(t)}',${index})"
    >
     🗑️ Tier löschen
    </button>
 `;

 if(/<\/section>\s*$/.test(html)){
  return html.replace(
   /<\/section>\s*$/,
   deleteButton+'   </section>'
  );
 }

 return (
  html+
  '<div class="tc2AnimalEditorActions">'+
   deleteButton+
  '</div>'
 );
}

function sameAnimal(candidate,animal){
 if(!candidate||!animal){
  return false;
 }

 if(candidate===animal){
  return true;
 }

 const candidateUuid=String(
  candidate.uuid||candidate.uid||''
 ).trim();
 const animalUuid=String(
  animal.uuid||animal.uid||''
 ).trim();

 if(
  candidateUuid&&
  animalUuid&&
  candidateUuid===animalUuid
 ){
  return true;
 }

 const candidateId=String(
  candidate.publicId||candidate.displayId||''
 ).trim();
 const animalId=String(
  animal.publicId||animal.displayId||''
 ).trim();

 return !!(
  candidateId&&
  animalId&&
  candidateId===animalId
 );
}

async function remove(t,i){
 if(!await NGT500.confirmAction(
  'Tier wirklich löschen?',
  {
   title:'Tier löschen',
   confirmText:'Tier löschen',
   danger:true
  }
 )){
  return;
 }

 const db=NGTStore.data();
 const index=Number(i);
 const animal=(db.animals||[])[index];

 if(!animal){
  if(NGT500.toast){
   NGT500.toast(
    'Das Tier wurde nicht gefunden.',
    'danger'
   );
  }
  return;
 }

 const group=animal.animalGroup||'Unsortiert';
 const genus=animal.genus||'Ohne Gattung';

 db.animals.splice(index,1);

 (NGTStore.TYPES||[]).forEach(function(type){
  if(!Array.isArray(db[type])){
   return;
  }

  db[type]=db[type].filter(function(candidate){
   return !sameAnimal(candidate,animal);
  });
 });

 NGTStore.save();

 if(NGT500.toast){
  NGT500.toast('Tier wurde gelöscht.','success');
 }

 NGT500.route(
  'animals',
  {
   group:group,
   genus:genus
  }
 );
}

function render(args){
 args=args||{};

 const t=args.t||'';
 const edit=args.edit;
 const hkn=!!args.hkn;
 const create=!!args.create;

 if(
  hkn||
  create||
  edit!==undefined
 ){
  return `
   <div class="tc2PageCard tc2AnimalsPage">
    ${create?editorView('',undefined,false):''}
    ${hkn?P.editor.hknInfo()+editorView(t,undefined,true):''}
    ${edit!==undefined?editorView(t,Number(edit),false):''}
   </div>
  `;
 }

 return P.stock.render(args);
}

window.NGTAnimals={
 openEditor:P.editor.openEditor,
 save:P.editor.save,
 remove:remove,
 updateIntervalFields:
  P.editor.updateIntervalFields
};

NGT500.register(
 'animals',
 {
  render:render
 }
);

})();