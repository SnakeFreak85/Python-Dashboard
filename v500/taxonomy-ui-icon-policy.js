(function(){
'use strict';

const P=window.NGTTaxonomyUIInternal;
const illustrations=P&&P.illustrations;

if(!illustrations){
 throw new Error(
  'taxonomy-ui-icon-policy.js benoetigt die Tierillustrationen.'
 );
}

const original=illustrations.illustrationFor;
const classify=illustrations.classify;
const clean=illustrations.clean;

function emptyIcon(label){
 return (
  '<span '+
   'class="tc2TaxNoIcon" '+
   'role="img" '+
   'aria-label="Kein Tierbild für '+
    String(label||'diese Gruppe')+
   '"'+
  '></span>'
 );
}

illustrations.illustrationFor=function(value){
 const label=clean(value)||'Tier';
 const type=classify(label);

 /* Freie oder nicht erkennbare Gruppennamen wie „Test“ erhalten
    bewusst kein erfundenes Tierbild. */
 if(type==='generic'){
  return emptyIcon(label);
 }

 return original(label);
};

})();