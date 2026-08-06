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

 const animalId=NGTStore.animalId(animal);

 const deleteButton=`
    <button
     class="danger"
     style="grid-column:1/-1"
     onclick="NGTAnimals.removeById('${P.jsArg(animalId)}')"
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

async function removeResolved(row){
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

 const animal=row&&row.a;

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
 const archived=!AnimalEngine.isActiveAnimal(animal);
 const status=P.archiveStatus(animal);

 if(!NGTStore.deleteAnimalById(NGTStore.animalId(animal))){
  if(NGT500.toast){
   NGT500.toast(
    'Das Tier konnte nicht gelöscht werden.',
    'danger'
   );
  }
  return;
 }

 if(NGT500.toast){
  NGT500.toast('Tier wurde gelöscht.','success');
 }

 NGT500.route(
  'animals',
  archived
   ?{
    view:'archive',
    status:status
   }
   :{
    group:group,
    genus:genus
   }
 );
}

function remove(t,i){
 return removeResolved(
  NGTStore.resolveAnimal({
   t:t,
   i:i
  })
 );
}

function removeById(animalId){
 return removeResolved(
  NGTStore.resolveAnimal({
   animalId:animalId
  })
 );
}

function restoreById(animalId){
 const animal=NGTStore.getAnimalById(animalId);

 if(!animal){
  if(NGT500.toast){
   NGT500.toast(
    'Das Tier wurde nicht gefunden.',
    'danger'
   );
  }
  return false;
 }

 const targetStatus=P.activeStatusFor(animal);
 const restored=NGTStore.updateAnimalById(
  animalId,
  {status:targetStatus}
 );

 if(!restored){
  return false;
 }

 if(NGT500.toast){
  NGT500.toast(
   targetStatus==='Nachzucht'
    ?'Tier ist wieder im Nachzuchtenbestand.'
    :'Tier ist wieder im aktiven Bestand.',
   'success'
  );
 }

 NGT500.route(
  'profile',
  {animalId:animalId}
 );

 return true;
}

function render(args){
 args=args||{};

 const t=args.t||'';
 const edit=args.edit;
 const editId=args.editId;
 const hkn=!!args.hkn;
 const create=!!args.create;
 const editRow=editId
  ?NGTStore.resolveAnimal({animalId:editId})
  :edit!==undefined
   ?NGTStore.resolveAnimal({t:t,i:edit})
   :null;

 if(
  hkn||
  create||
  edit!==undefined||
  editId
 ){
  return `
   <div class="tc2PageCard tc2AnimalsPage">
    ${create?editorView('',undefined,false):''}
    ${hkn?P.editor.hknInfo()+editorView(t,undefined,true):''}
    ${editRow?editorView(editRow.t,editRow.i,false):''}
    ${(edit!==undefined||editId)&&!editRow?'<div class="tc2EmptyState">Tier nicht gefunden.</div>':''}
   </div>
  `;
 }

 return P.stock.render(args);
}

window.NGTAnimals={
 openEditor:P.editor.openEditor,
 save:P.editor.save,
 remove:remove,
 removeById:removeById,
 restoreById:restoreById,
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
