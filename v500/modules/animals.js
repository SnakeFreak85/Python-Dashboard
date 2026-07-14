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
 const create=!!args.create;

 if(
  hkn||
  create||
  edit!==undefined
  ){
   return `
    <div class="tc2PageCard tc2AnimalsPage">
     ${create?P.editor.render('',undefined,false):''}
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
