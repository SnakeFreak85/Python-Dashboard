(function(){
'use strict';

const P=window.NGTOffspringInternal;

if(!P||!P.editor){
 throw new Error('Nachzuchtenmodule fehlen');
}

function backButton(args){
 if(args&&args.genus){
  return `<button
   class="tc2ProfileTopBack"
   onclick="NGT500.route('offspring',{group:'${P.jsArg(args.group)}'})"
  >
   ‹ ${P.esc(args.group)}
  </button>`;
 }

 return `<button
  class="tc2ProfileTopBack"
  onclick="NGT500.route('dashboard')"
 >
  ‹ Start
 </button>`;
}

function summary(all,archived){
 const groups=new Set(
  all.map(function(row){
   return row.a.animalGroup||'Unsortiert';
  })
 ).size;

 const photos=all.reduce(function(total,row){
  return total+(
   Array.isArray(row.a.photos)
    ?row.a.photos.filter(P.isUsablePhoto).length
    :0
  );
 },0);

 return `<div class="tc2ProfileOverviewGrid tc2OffspringSummary">
  <div>
   <small>Aktive Nachzuchten</small>
   <b>${all.length}</b>
  </div>

  <div>
   <small>Im Archiv</small>
   <b>${archived.length}</b>
  </div>

  <div>
   <small>Tiergruppen</small>
   <b>${groups}</b>
  </div>

  <div>
   <small>Fotos</small>
   <b>${photos}</b>
  </div>
 </div>`;
}

function emptyState(title,message){
 return `<div class="tc2EmptyState">
  <div class="tc2EmptyStateIcon">🥚</div>
  <h3>${P.esc(title)}</h3>
  <p>${P.esc(message)}</p>
 </div>`;
}

function folderGrid(items,onclick){
 if(!items.length){
  return emptyState(
   'Noch keine Nachzuchten',
   'Lege deine erste Nachzucht über die Startseite an.'
  );
 }

 return `<div class="tc2TaxGrid">
  ${items.map(function(item){
   return `<button
    class="tc2TaxFolder tc2OffspringFolder"
    onclick="${onclick(item)}"
   >
    <span>🥚</span>

    <b>${P.esc(item.label)}</b>

    <small>
     ${item.count}
     ${item.count===1?'Nachzucht':'Nachzuchten'}
    </small>
   </button>`;
  }).join('')}
 </div>`;
}

function animalIconGrid(rows,selecting){
 if(!rows.length){
  return emptyState(
   'Noch keine Nachzuchten',
   'In dieser Gattung ist noch keine aktive Nachzucht gespeichert.'
  );
 }

 return `<div class="tc2TaxAnimalGrid">
  ${rows.map(function(row){
   const animal=row.a;
   const photo=P.coverPhoto(animal);
   const source=P.photoSrc(photo,true);

   const image=source
    ?`<img
      src="${P.esc(source)}"
      alt="${P.esc(animal.name||'Nachzuchtfoto')}"
      loading="lazy"
     >`
    :'<span>🥚</span>';

   const taxonomy=[
    animal.genus,
    animal.species
   ].filter(Boolean).join(' ');

   const status=animal.status||'Nachzucht';

   const animalId=NGTStore.animalId(animal);
   const body=`
    <div>${image}</div>

    <b>
     ${P.esc(animal.publicId||animal.displayId||'')}
    </b>

    <strong>
     ${P.esc(animal.name||'Unbenannt')}
    </strong>

    <small>
     ${P.esc(taxonomy||animal.animalGroup||'')}
    </small>

    <em class="tc2OffspringStatus">
     ${P.esc(status)}
    </em>
   `;

   return selecting
    ?`<label class="tc2TaxAnimal tc2OffspringAnimal tc2OffspringSelectable">
      <input type="checkbox" class="tc2OffspringBulkCheck" value="${P.esc(animalId)}" onchange="NGTOffspring.updateSelection()">
      ${body}
     </label>`
    :`<button class="tc2TaxAnimal tc2OffspringAnimal" onclick="NGT500.route('profile',{animalId:'${P.jsArg(animalId)}'})">${body}</button>`;
  }).join('')}
 </div>`;
}

function selectionToolbar(group,genus,selecting){
 if(!selecting){
  return `<div class="tc2OffspringSelectionStart"><button type="button" onclick="NGT500.route('offspring',{group:'${P.jsArg(group)}',genus:'${P.jsArg(genus)}',select:1})">Auswählen</button></div>`;
 }

 return `<div class="tc2OffspringSelectionBar">
  <b id="offspringSelectionCount">0 ausgewählt</b>
  <button type="button" onclick="NGT500.route('offspring',{group:'${P.jsArg(group)}',genus:'${P.jsArg(genus)}'},{replace:true,noHistory:true})">Abbrechen</button>
  <button type="button" id="offspringBulkMoveStock" class="tc2OffspringMoveStock" disabled onclick="NGTOffspring.moveSelectedToStock('${P.jsArg(group)}','${P.jsArg(genus)}')">In Bestand</button>
  <button type="button" id="offspringBulkDelete" class="danger" disabled onclick="NGTOffspring.deleteSelected('${P.jsArg(group)}','${P.jsArg(genus)}')">Auswahl löschen</button>
 </div>`;
}

function selectedIds(){
 return Array.from(document.querySelectorAll('.tc2OffspringBulkCheck:checked')).map(function(input){return input.value;});
}

function updateSelection(){
 const count=selectedIds().length;
 const label=document.getElementById('offspringSelectionCount');
 const move=document.getElementById('offspringBulkMoveStock');
 const remove=document.getElementById('offspringBulkDelete');

 if(label)label.textContent=count+' ausgewählt';
 if(move)move.disabled=count===0;
 if(remove)remove.disabled=count===0;
}

async function moveSelectedToStock(group,genus){
 const ids=selectedIds();
 if(!ids.length)return;

 const message=ids.length===1
  ?'Diese Nachzucht in den normalen Bestand übernehmen? Alle Daten und Historien bleiben erhalten.'
  :ids.length+' Nachzuchten in den normalen Bestand übernehmen? Alle Daten und Historien bleiben erhalten.';

 if(!await NGT500.confirmAction(
  message,
  {title:'Nachzuchten in Bestand',confirmText:'In Bestand'}
 ))return;

 const moved=NGTStore.moveOffspringToStock(ids);
 if(NGT500.toast){
  NGT500.toast(moved.length+' Nachzucht'+(moved.length===1?' wurde':'en wurden')+' in den Bestand übernommen.','success');
 }

 NGT500.route('offspring',{group:group,genus:genus},{replace:true,noHistory:true});
}

async function deleteSelected(group,genus){
 const ids=selectedIds();
 if(!ids.length)return;

 if(!await NGT500.confirmAction(
  ids.length+' Nachzucht'+(ids.length===1?'':'en')+' wirklich endgültig löschen?',
  {title:'Nachzuchten löschen',confirmText:ids.length+' löschen',danger:true}
 ))return;

 const removed=NGTStore.deleteAnimalsByIds(ids);
 if(NGT500.toast){
  NGT500.toast(removed.length+' Nachzucht'+(removed.length===1?' wurde':'en wurden')+' gelöscht.','success');
 }

 NGT500.route('offspring',{group:group,genus:genus},{replace:true,noHistory:true});
}

function pageHeader(title,subtitle,back){
 return `<div class="tc2PageHead tc2OffspringPageHead">
  <div>
   ${back||''}

   <h2>${P.esc(title)}</h2>

   <p class="muted">
    ${P.esc(subtitle)}
   </p>
  </div>
 </div>`;
}

function render(args){
 args=args||{};

 const t=args.t||'';
 const group=args.group||'';
 const genus=args.genus||'';
 const edit=args.edit;
 const editId=args.editId;
 const create=!!args.create;
 const selecting=String(args.select||'')==='1';

 if(create){
  const preset=
   args.breedingPlanId&&
   window.NGTBreeding&&
   NGTBreeding.offspringPreset
    ?NGTBreeding.offspringPreset(
      args.breedingPlanId
     )
    :{};

  return `<section class="tc2PageCard tc2AnimalsPage tc2OffspringPage">
   ${P.editor.render('',undefined,preset)}
  </section>`;
 }

 if(edit!==undefined||editId){
  const editRow=editId
   ?NGTStore.resolveAnimal({animalId:editId})
   :NGTStore.resolveAnimal({t:t,i:edit});

  return `<section class="tc2PageCard tc2AnimalsPage tc2OffspringPage">
   ${
    editRow
     ?P.editor.render(editRow.t,editRow.i)
     :emptyState(
      'Nachzucht nicht gefunden',
      'Der Datensatz ist nicht mehr vorhanden.'
     )
   }
  </section>`;
 }

 const all=P.allOffspring();
 const archived=P.allArchivedOffspring();

 if(!group){
  const groups=P.countBy(
   all,
   function(row){
    return row.a.animalGroup||'Unsortiert';
   }
  );

  return `<section class="tc2PageCard tc2AnimalsPage tc2OffspringPage">
   <div class="tc2OffspringHero">
    <div>
     <span>🥚</span>

     <div>
      <h2>Nachzuchten</h2>
      <p>
       Eigener Bereich mit eigenem Nummernkreis und
       vollständiger Tierhistorie.
      </p>
     </div>
    </div>
   </div>

   ${summary(all,archived)}

   ${pageHeader(
    'Tiergruppen',
    'Wähle eine Tiergruppe deiner Nachzuchten.'
   )}

   ${folderGrid(
    groups,
    function(item){
     return `NGT500.route('offspring',{group:'${P.jsArg(item.label)}'})`;
    }
   )}
  </section>`;
 }

 const groupRows=all.filter(function(row){
  return String(
   row.a.animalGroup||
   'Unsortiert'
  )===String(group);
 });

 if(group&&!genus){
  const genusRows=P.countBy(
   groupRows,
   function(row){
    return row.a.genus||'Ohne Gattung';
   }
  );

  return `<section class="tc2PageCard tc2AnimalsPage tc2OffspringPage">
   ${pageHeader(
    group,
    groupRows.length+' aktive Nachzucht'+
     (groupRows.length===1?'':'en'),
    backButton({
     group:group
    })
   )}

   ${folderGrid(
    genusRows,
    function(item){
     return `NGT500.route('offspring',{group:'${P.jsArg(group)}',genus:'${P.jsArg(item.label)}'})`;
    }
   )}
  </section>`;
 }

 const animalRows=groupRows.filter(function(row){
  return String(
   row.a.genus||
   'Ohne Gattung'
  )===String(genus);
 });

 return `<section class="tc2PageCard tc2AnimalsPage tc2OffspringPage">
  ${pageHeader(
   genus,
   group+' · '+
    animalRows.length+' '+
    (
     animalRows.length===1
      ?'Nachzucht'
      :'Nachzuchten'
    ),
   backButton({
    group:group,
    genus:genus
   })
  )}

  ${selectionToolbar(group,genus,selecting)}
  ${animalIconGrid(animalRows,selecting)}
 </section>`;
}

window.NGTOffspring={
 save:P.editor.save,
 updateSelection:updateSelection,
 moveSelectedToStock:moveSelectedToStock,
 deleteSelected:deleteSelected
};

NGT500.register('offspring',{
 render:render
});

})();
