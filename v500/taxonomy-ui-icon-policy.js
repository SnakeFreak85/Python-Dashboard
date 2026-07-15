(function(){
'use strict';

const P=window.NGTTaxonomyUIInternal;
const illustrations=P&&P.illustrations;

if(!illustrations){
 throw new Error('taxonomy icon policy requires illustrations');
}

const original=illustrations.illustrationFor;
const classify=illustrations.classify;
const clean=illustrations.clean;

function emptyIcon(label){
 return '<span class="tc2TaxNoIcon" aria-hidden="true" data-label="'+String(label||'')+'"></span>';
}

illustrations.illustrationFor=function(value){
 const label=clean(value)||'Tier';
 const type=classify(label);

 return type==='generic'
  ?emptyIcon(label)
  :original(label);
};

})();