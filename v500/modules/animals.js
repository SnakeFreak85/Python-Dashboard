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

 const deleteButton=`
     <button
      class="danger"
      style="grid-column:1/-1"
      onclick="NGTAnimals.remove('${P.jsArg(t)}',${Number(i)})"
     >
      🗑️ Tier löschen
     </button>
`;

 return html.replace(
  '    </div>\n   </section>',
  deleteButton+
  '    </div>\n   </section>'
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