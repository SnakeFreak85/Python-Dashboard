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

function folderGrid(items,onclick){
 if(!items.length){
  return `
   <div class="subcard tc2EmptyState">
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

function animalIconGrid(rows){
 if(!rows.length){
  return `
   <div class="subcard tc2EmptyState">
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

    return `
     <button
      class="tc2TaxAnimal"
      onclick="NGT500.route('profile',{t:'${P.jsArg(row.t)}',i:${row.i}})"
     >
      <div>${image}</div>
      <b>${P.esc(animal.publicId||animal.displayId||'')}</b>
      <strong>${P.esc(animal.name||'Unbenannt')}</strong>
      <small>${P.esc(taxonomy||animal.animalGroup||'')}</small>
     </button>
    `;
   }).join('')}
  </div>
 `;
}

function render(args){
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
   <div class="card tc2PageCard tc2AnimalsPage">
    <div class="tc2PageHead">
     <div>
      <h2>Bestand</h2>

      <p class="muted">
       Dynamische Tiergruppen aus deinem Bestand.
      </p>
     </div>
    </div>

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
   <div class="card tc2PageCard tc2AnimalsPage">
    <div class="tc2PageHead">
     <div>
      ${backButton({group:group})}
      <h2>${P.esc(group)}</h2>
      <p class="muted">Wähle eine Gattung.</p>
     </div>
    </div>

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
  <div class="card tc2PageCard tc2AnimalsPage">
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

   ${animalIconGrid(animalRows)}
  </div>
 `;
}

P.stock={
 render:render
};

})();
