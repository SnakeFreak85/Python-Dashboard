(function(){
'use strict';

const P=window.NGTAnimalsInternal;

if(!P){
 throw new Error(
  'NGTAnimalsInternal fehlt. '+
  'animals-core.js muss vor animals-stock.js geladen werden.'
 );
}

function backButton(args){
 if(args&&args.view==='archive'){
  if(args.status){
   return `
    <button onclick="NGT500.route('animals',{view:'archive'})">
     ‹ Archiv
    </button>
   `;
  }

  return `
   <button onclick="NGT500.route('animals')">
    ‹ Bestand
   </button>
  `;
 }

 if(args&&args.genus){
  return `
   <button
    onclick="NGT500.route('animals',{group:'${P.jsArg(args.group)}'})"
   >
    ‹ ${P.esc(args.group)}
   </button>
  `;
 }

 return `
  <button onclick="NGT500.route('dashboard')">
   ‹ Start
  </button>
 `;
}

function viewSwitch(view){
 const archive=view==='archive';

 return `
  <div
   class="tc2AnimalsViewSwitch"
   role="group"
   aria-label="Bestandsansicht"
  >
   <button
    class="${archive?'':'active'}"
    aria-pressed="${archive?'false':'true'}"
    onclick="NGT500.route('animals')"
   >
    Aktiv
   </button>

   <button
    class="${archive?'active':''}"
    aria-pressed="${archive?'true':'false'}"
    onclick="NGT500.route('animals',{view:'archive'})"
   >
    Archiv
   </button>
  </div>
 `;
}

function folderGrid(items,onclick){
 if(!items.length){
  return `
   <div class="tc2EmptyState">
    <h3>Noch keine Einträge</h3>

    <p class="muted">
     Lege dein erstes Tier über die Startseite an.
    </p>
   </div>
  `;
 }

 return `
  <div class="tc2TaxGrid">
   ${items.map(function(item){
    return `
     <button
      class="tc2TaxFolder"
      onclick="${onclick(item)}"
     >
      <span>●●●</span>
      <b>${P.esc(item.label)}</b>

      <small>
       ${item.count}
       ${item.count===1?'Tier':'Tiere'}
      </small>
     </button>
    `;
   }).join('')}
  </div>
 `;
}

function animalIconGrid(rows,options){
 options=options||{};

 if(!rows.length){
  return `
   <div class="tc2EmptyState">
    <h3>Noch keine Tiere</h3>

    <p class="muted">
     In dieser Gattung ist noch kein Tier gespeichert.
    </p>
   </div>
  `;
 }

 return `
  <div class="tc2TaxAnimalGrid">
   ${rows.map(function(row){
    const animal=row.a;
    const photo=P.coverPhoto(animal);
    const source=P.photoSrc(photo,true);

    const image=source
     ?`
      <img
       src="${P.esc(source)}"
       alt="${P.esc(animal.name||'Tierfoto')}"
       loading="lazy"
      >
     `
     :'<span>📷</span>';

    const taxonomy=[
     animal.genus,
     animal.species
    ].filter(Boolean).join(' ');
    const status=options.showStatus
     ?P.archiveStatus(animal)
     :'';

    return `
     <button
      class="tc2TaxAnimal"
      ${status?`data-status="${P.esc(status)}"`:''}
      onclick="NGT500.route('profile',{animalId:'${P.jsArg(NGTStore.animalId(animal))}'})"
     >
      <div>${image}</div>
      <b>${P.esc(animal.publicId||animal.displayId||'')}</b>
      <strong>${P.esc(animal.name||'Unbenannt')}</strong>
      <small>${P.esc(taxonomy||animal.animalGroup||'')}</small>
      ${status?`<span class="tc2TaxAnimalStatus" data-status="${P.esc(status)}">${P.esc(status)}</span>`:''}
     </button>
    `;
   }).join('')}
  </div>
 `;
}

function archiveIcon(status){
 const icons={
  Reserviert:'🔒',
  Verkauft:'✓',
  Abgegeben:'↗',
  Verstorben:'🕯',
  Archiv:'▣'
 };

 return icons[status]||'▣';
}

function archiveFolderGrid(items){
 if(!items.length){
  return `
   <div class="tc2EmptyState">
    <h3>Archiv ist leer</h3>

    <p class="muted">
     Sobald ein Tier einen inaktiven Status erhält,
     wird hier automatisch ein passender Ordner angelegt.
    </p>
   </div>
  `;
 }

 return `
  <div class="tc2TaxGrid tc2ArchiveFolderGrid">
   ${items.map(function(item){
    return `
     <button
      class="tc2TaxFolder tc2ArchiveFolder"
      data-status="${P.esc(item.label)}"
      onclick="NGT500.route('animals',{view:'archive',status:'${P.jsArg(item.label)}'})"
     >
      <span>${archiveIcon(item.label)}</span>
      <b>${P.esc(item.label)}</b>

      <small>
       ${item.count}
       ${item.count===1?'Tier':'Tiere'}
      </small>
     </button>
    `;
   }).join('')}
  </div>
 `;
}

function archiveView(args){
 const all=P.allArchived();
 const requested=AnimalEngine.canonicalStatus(
  args.status||''
 );
 const folders=P.archiveStatuses(all);
 const status=folders.some(function(item){
  return item.label===requested;
 })
  ?requested
  :'';
 const rows=status
  ?all.filter(function(row){
   return P.archiveStatus(row.a)===status;
  })
  :all;

 return `
  <div class="tc2PageCard tc2AnimalsPage tc2AnimalsArchive">
   <div class="tc2PageHead">
    <div>
     ${backButton({view:'archive',status:status})}
     <h2>${status?P.esc(status):'Tierarchiv'}</h2>

     <p class="muted">
      ${
       status
        ?rows.length+' '+(rows.length===1?'Tier':'Tiere')+' mit diesem Status.'
        :'Statusordner entstehen automatisch. Alle Profile und Historien bleiben vollständig erhalten.'
      }
     </p>
    </div>
   </div>

   ${viewSwitch('archive')}

   ${
    status
     ?(
      rows.length
       ?animalIconGrid(rows,{showStatus:true})
       :`
      <div class="tc2EmptyState">
       <h3>Keine Tiere mit diesem Status</h3>

       <p class="muted">
        Für „${P.esc(status)}“ sind keine Tiere gespeichert.
       </p>
      </div>
       `
     )
     :archiveFolderGrid(folders)
   }
  </div>
 `;
}

function render(args){
 args=args||{};

 if(args.view==='archive'){
  return archiveView(args);
 }

 const group=args.group||'';
 const genus=args.genus||'';
 const all=P.allActive();

 if(!group){
  const groups=P.countBy(
   all,
   function(row){
    return row.a.animalGroup||'Unsortiert';
   }
  );

  return `
   <div class="tc2PageCard tc2AnimalsPage">
    <div class="tc2PageHead">
     <div>
      <h2>Bestand</h2>

      <p class="muted">
       Dynamische Tiergruppen aus deinem Bestand.
      </p>
     </div>
    </div>

    ${viewSwitch('active')}

    ${folderGrid(
     groups,
     function(item){
      return (
       "NGT500.route('animals',{group:'"+
       P.jsArg(item.label)+
       "'})"
      );
     }
    )}
   </div>
  `;
 }

 const groupRows=all.filter(function(row){
  return (
   String(row.a.animalGroup||'Unsortiert')===
   String(group)
  );
 });

 if(
  group&&
  !genus
 ){
  const genusRows=P.countBy(
   groupRows,
   function(row){
    return row.a.genus||'Ohne Gattung';
   }
  );

  return `
   <div class="tc2PageCard tc2AnimalsPage">
    <div class="tc2PageHead">
     <div>
      ${backButton({group:group})}
      <h2>${P.esc(group)}</h2>
      <p class="muted">Wähle eine Gattung.</p>
     </div>
    </div>

    ${viewSwitch('active')}

    ${folderGrid(
     genusRows,
     function(item){
      return (
       "NGT500.route('animals',{group:'"+
       P.jsArg(group)+
       "',genus:'"+
       P.jsArg(item.label)+
       "'})"
      );
     }
    )}
   </div>
  `;
 }

 const animalRows=groupRows.filter(function(row){
  return (
   String(row.a.genus||'Ohne Gattung')===
   String(genus)
  );
 });

 return `
  <div class="tc2PageCard tc2AnimalsPage">
   <div class="tc2PageHead">
    <div>
     ${backButton({
      group:group,
      genus:genus
     })}

     <h2>${P.esc(genus)}</h2>

     <p class="muted">
      ${P.esc(group)} · ${animalRows.length}
      ${animalRows.length===1?'Tier':'Tiere'}
     </p>
    </div>
   </div>

   ${viewSwitch('active')}

   ${animalIconGrid(animalRows)}
  </div>
 `;
}

P.stock={
 render:render,
 archiveView:archiveView
};

})();
