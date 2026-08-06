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

function animalIconGrid(rows){
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

   return `<button
    class="tc2TaxAnimal tc2OffspringAnimal"
    onclick="NGT500.route('profile',{animalId:'${P.jsArg(NGTStore.animalId(animal))}'})"
   >
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
   </button>`;
  }).join('')}
 </div>`;
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

 if(create){
  return `<section class="tc2PageCard tc2AnimalsPage tc2OffspringPage">
   ${P.editor.render('',undefined)}
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

  ${animalIconGrid(animalRows)}
 </section>`;
}

window.NGTOffspring={
 save:P.editor.save
};

NGT500.register('offspring',{
 render:render
});

})();
