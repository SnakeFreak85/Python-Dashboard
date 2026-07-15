(function(){
'use strict';

const P=window.NGTTaxonomyUIInternal;
const base=P&&P.illustrations;

if(!base){
 throw new Error(
  'taxonomy-ui-animal-icons.js benoetigt taxonomy-ui-illustrations.js.'
 );
}

const clean=base.clean;
const classify=base.classify;
const fallback=base.illustrationFor;

function esc(value){
 return String(value||'')
  .replace(/&/g,'&amp;')
  .replace(/</g,'&lt;')
  .replace(/>/g,'&gt;')
  .replace(/"/g,'&quot;')
  .replace(/'/g,'&#39;');
}

function image(path,label){
 return (
  '<img '+
   'class="tc2TaxReferenceIcon" '+
   'src="'+path+'" '+
   'alt="'+esc(label)+'" '+
   'loading="lazy" '+
   'decoding="async"'+
  '>'
 );
}

function illustrationFor(value){
 const label=clean(value)||'Tier';

 switch(classify(label)){
  case 'chameleon':
   return image(
    './v500/assets/taxonomy/chameleon.png',
    label
   );

  case 'gecko':
   return image(
    './v500/assets/taxonomy/gecko.png',
    label
   );

  case 'snake':
   return image(
    './v500/assets/taxonomy/python.png',
    label
   );

  case 'generic':
   return image(
    './v500/assets/taxonomy/generic.png',
    label
   );

  default:
   return fallback(label);
 }
}

P.illustrations={
 clean:clean,
 classify:classify,
 illustrationFor:illustrationFor
};

})();