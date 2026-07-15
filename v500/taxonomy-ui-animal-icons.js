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
const ICON_VERSION='ref-2';

function esc(value){
 return String(value||'')
  .replace(/&/g,'&amp;')
  .replace(/</g,'&lt;')
  .replace(/>/g,'&gt;')
  .replace(/"/g,'&quot;')
  .replace(/'/g,'&#39;');
}

function iconUrl(name){
 return (
  new URL(
   'v500/assets/taxonomy/'+name+'.png',
   document.baseURI
  ).href+
  '?v='+ICON_VERSION
 );
}

function image(name,label){
 return (
  '<img '+
   'class="tc2TaxReferenceIcon" '+
   'src="'+esc(iconUrl(name))+'" '+
   'alt="'+esc(label)+'" '+
   'loading="eager" '+
   'decoding="sync" '+
   'onerror="this.hidden=true"'+
  '>'
 );
}

function illustrationFor(value){
 const label=clean(value)||'Tier';

 switch(classify(label)){
  case 'chameleon':
   return image('chameleon',label);

  case 'gecko':
   return image('gecko',label);

  case 'snake':
   return image('python',label);

  case 'generic':
   return image('generic',label);

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