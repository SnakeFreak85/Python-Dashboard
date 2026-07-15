(function(){
'use strict';

const P=window.NGTTaxonomyUIInternal;
const illustrations=P&&P.illustrations;

if(!illustrations){
 throw new Error('taxonomy spider final requires illustrations');
}

const previous=illustrations.illustrationFor;
const classify=illustrations.classify;
const clean=illustrations.clean;

function esc(value){
 return String(value||'')
  .replace(/&/g,'&amp;')
  .replace(/</g,'&lt;')
  .replace(/>/g,'&gt;')
  .replace(/"/g,'&quot;')
  .replace(/'/g,'&#39;');
}

function spiderIcon(label){
 const src=new URL(
  'v500/assets/taxonomy/spider.png?v=spider-3',
  document.baseURI
 ).href;

 return (
  '<img '+
   'class="tc2TaxReferenceIcon" '+
   'src="'+esc(src)+'" '+
   'alt="'+esc(label)+'" '+
   'loading="eager" '+
   'decoding="async"'+
  '>'
 );
}

illustrations.illustrationFor=function(value){
 const label=clean(value)||'Tier';

 if(classify(label)==='spider'){
  return spiderIcon(label);
 }

 return previous(label);
};

})();