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

function render(args){
 args=args||{};

 const t=args.t||'';
 const edit=args.edit;
 const hkn=!!args.hkn;

 if(
  hkn||
  edit!==undefined
 ){
  return `
   <div class="card tc2PageCard tc2AnimalsPage">
    <div class="tc2PageHead">
     <div>
      <h2>
       ${edit!==undefined?'Tier bearbeiten':'Tier anlegen'}
      </h2>

      <p class="muted">
       Tierdaten und individuelle Pflegeintervalle.
      </p>
     </div>
    </div>

    ${hkn?P.editor.hknInfo()+P.editor.render(t,undefined,true):''}
    ${edit!==undefined?P.editor.render(t,Number(edit)):''}
   </div>
  `;
 }

 return P.stock.render(args);
}

window.NGTAnimals={
 openEditor:P.editor.openEditor,
 save:P.editor.save,
 remove:P.editor.remove,
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
