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
const APPROVED_IMAGE_TYPES={
 chameleon:true,
 gecko:true,
 snake:true
};

function emptyIcon(label){
 return (
  '<span '+
   'class="tc2TaxNoIcon" '+
   'aria-hidden="true" '+
   'data-label="'+String(label||'')+'"'+
  '></span>'
 );
}

illustrations.illustrationFor=function(value){
 const label=clean(value)||'Tier';
 const type=classify(label);

 /* Nur Tiergruppen mit einem abgestimmten Referenzbild bekommen ein Bild.
    Freie Namen wie „Test“ und noch nicht freigegebene Kategorien zeigen
    bewusst keinen erfundenen oder stilfremden Platzhalter. */
 if(!APPROVED_IMAGE_TYPES[type]){
  return emptyIcon(label);
 }

 return original(label);
};

})();