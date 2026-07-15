(function(){
'use strict';
const P=window.NGTTaxonomyUIInternal;
const illustrations=P&&P.illustrations;
if(!illustrations){throw new Error('taxonomy icon policy requires illustrations');}
const original=illustrations.illustrationFor;
const classify=illustrations.classify;
const clean=illustrations.clean;
const approved={chameleon:true,gecko:true,snake:true,spider:true};
function emptyIcon(label){
 return '<span class="tc2TaxNoIcon" aria-hidden="true" data-label="'+String(label||'')+'"></span>';
}
illustrations.illustrationFor=function(value){
 const label=clean(value)||'Tier';
 const type=classify(label);
 return approved[type]?original(label):emptyIcon(label);
};
})();