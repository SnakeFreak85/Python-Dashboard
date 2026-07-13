(function(){
'use strict';

const P=window.NGTTaxonomyUIInternal;
const I=P&&P.illustrations;
const D=P&&P.decoration;

if(!I||!D){
 throw new Error(
  'taxonomy-ui.js benoetigt taxonomy-ui-illustrations.js und taxonomy-ui-decoration.js.'
 );
}

window.NGTTaxonomyUI={
 decorate:D.decorate,
 illustrationFor:I.illustrationFor,
 classify:I.classify
};

if(
 document.readyState==='loading'
){
 document.addEventListener(
  'DOMContentLoaded',
  D.init
 );
}else{
 D.init();
}

})();
