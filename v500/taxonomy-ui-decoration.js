(function(){
'use strict';

const P=window.NGTTaxonomyUIInternal;
const I=P&&P.illustrations;

if(!I){
 throw new Error(
  'taxonomy-ui-decoration.js benoetigt taxonomy-ui-illustrations.js.'
 );
}

const STYLE_ID='tc2TaxonomySilhouetteStyles';

let observer=null;
let timer=null;

const clean=I.clean;
const illustrationFor=I.illustrationFor;

function installStyles(){
 if(
  document.getElementById(
   STYLE_ID
  )
 ){
  return;
 }

 const style=document.createElement(
  'style'
 );

 style.id=STYLE_ID;

 style.textContent=`
  .tc2TaxFolder{
   display:grid!important;

   grid-template-columns:
    96px
    minmax(0,1fr)
    24px!important;

   grid-template-rows:
    auto
    auto!important;

   align-items:center!important;

   column-gap:15px!important;
   row-gap:4px!important;

   width:100%!important;
   min-height:122px!important;

   padding:13px!important;

   text-align:left!important;
  }

  .tc2TaxFolder>
  .tc2TaxSilhouetteHost{
   grid-column:1!important;
   grid-row:1 / 3!important;

   display:grid!important;
   place-items:center!important;

   width:96px!important;
   min-width:96px!important;
   max-width:96px!important;

   height:96px!important;
   min-height:96px!important;
   max-height:96px!important;

   margin:0!important;
   padding:3px!important;

   overflow:hidden!important;

   border:
    1px solid
    rgba(112,164,182,.28)!important;

   border-radius:23px!important;

   background:
    linear-gradient(
     145deg,
     rgba(19,47,60,.96),
     rgba(4,17,27,.98)
    )!important;

   box-shadow:
    inset 0 1px 0
    rgba(255,255,255,.04),
    0 12px 25px
    rgba(0,0,0,.19)!important;

   font-size:0!important;
  }

  .tc2TaxFolder>b{
   grid-column:2!important;
   grid-row:1!important;

   align-self:end!important;

   max-width:100%!important;
   overflow:hidden!important;

   color:#f0f5f7!important;

   font-size:18px!important;
   font-weight:850!important;
   line-height:1.2!important;

   text-align:left!important;
   text-overflow:ellipsis!important;
   white-space:nowrap!important;
  }

  .tc2TaxFolder>small{
   grid-column:2!important;
   grid-row:2!important;

   align-self:start!important;

   color:#9baeb6!important;

   font-size:12px!important;
   font-weight:700!important;
   line-height:1.3!important;

   text-align:left!important;
  }

  .tc2TaxFolder::after{
   grid-column:3!important;
   grid-row:1 / 3!important;

   align-self:center!important;
  }

  .tc2TaxSilhouetteSvg{
   display:block!important;

   width:100%!important;
   height:100%!important;
  }

  .tc2TaxSilhouetteCreature{
   transform-origin:80px 63px;

   animation:
    tc2TaxSilhouetteBreath
    5.5s
    ease-in-out
    infinite;
  }

  @keyframes tc2TaxSilhouetteBreath{
   0%,
   100%{
    transform:
     translateY(1px)
     scale(1);
   }

   50%{
    transform:
     translateY(-2px)
     scale(1.015);
   }
  }

  .tc2TaxAnimal>
  .tc2TaxSilhouetteHost{
   display:grid!important;
   place-items:center!important;

   width:100%!important;
   height:100%!important;

   overflow:hidden!important;

   background:
    linear-gradient(
     145deg,
     rgba(19,47,60,.96),
     rgba(4,17,27,.98)
    )!important;

   font-size:0!important;
  }

  @media(
   prefers-reduced-motion:
   reduce
  ){
   .tc2TaxSilhouetteCreature{
    animation:none!important;
   }
  }

  @media(max-width:440px){
   .tc2TaxFolder{
    grid-template-columns:
     82px
     minmax(0,1fr)
     22px!important;

    min-height:106px!important;

    column-gap:12px!important;

    padding:11px!important;
   }

   .tc2TaxFolder>
   .tc2TaxSilhouetteHost{
    width:82px!important;
    min-width:82px!important;
    max-width:82px!important;

    height:82px!important;
    min-height:82px!important;
    max-height:82px!important;

    border-radius:20px!important;
   }

   .tc2TaxFolder>b{
    font-size:16px!important;
   }

   .tc2TaxFolder>small{
    font-size:11px!important;
   }
  }
 `;

 document.head.appendChild(
  style
 );
}

function directChild(
 element,
 selector
){
 if(!element){
  return null;
 }

 return Array.from(
  element.children
 ).find(function(child){
  return child.matches(
   selector
  );
 })||null;
}

function folderLabel(button){
 const title=directChild(
  button,
  'b'
 );

 return clean(
  title&&title.textContent
 );
}

function decorateFolder(button){
 if(
  !button||
  button.dataset.tc2Silhouette==='1'
 ){
  return;
 }

 const title=folderLabel(
  button
 );

 const target=directChild(
  button,
  'span'
 );

 if(
  !title||
  !target
 ){
  return;
 }

 target.className=
  'tc2TaxSilhouetteHost';

 target.innerHTML=
  illustrationFor(title);

 button.dataset.tc2Silhouette='1';
}

function animalImageTarget(card){
 return directChild(
  card,
  'div'
 );
}

function hasRealPhoto(target){
 if(!target){
  return false;
 }

 const image=target.querySelector(
  'img'
 );

 if(!image){
  return false;
 }

 return !!clean(
  image.getAttribute('src')
 );
}

function animalLabel(card){
 const scientific=directChild(
  card,
  'small'
 );

 if(
  scientific&&
  clean(scientific.textContent)
 ){
  return clean(
   scientific.textContent
  );
 }

 const name=directChild(
  card,
  'strong'
 );

 if(
  name&&
  clean(name.textContent)
 ){
  return clean(
   name.textContent
  );
 }

 const title=directChild(
  card,
  'b'
 );

 return clean(
  title&&title.textContent
 )||'Tier';
}

function decorateAnimal(card){
 if(
  !card||
  card.dataset.tc2Silhouette==='1'
 ){
  return;
 }

 const target=animalImageTarget(
  card
 );

 if(!target){
  return;
 }

 /*
  * Ein echtes, vom Benutzer gespeichertes Tierfoto
  * bleibt auf der jeweiligen Tierkarte erhalten.
  */
 if(hasRealPhoto(target)){
  card.dataset.tc2Silhouette='1';
  return;
 }

 target.className=
  'tc2TaxSilhouetteHost';

 target.innerHTML=
  illustrationFor(
   animalLabel(card)
  );

 card.dataset.tc2Silhouette='1';
}

function decorate(){
 installStyles();

 document
  .querySelectorAll(
   '.tc2TaxFolder'
  )
  .forEach(
   decorateFolder
  );

 document
  .querySelectorAll(
   '.tc2TaxAnimal'
  )
  .forEach(
   decorateAnimal
  );
}

function schedule(){
 clearTimeout(timer);

 timer=setTimeout(
  decorate,
  50
 );
}

function observe(){
 if(observer){
  return;
 }

 const app=document.getElementById(
  'app'
 );

 if(!app){
  setTimeout(
   observe,
   100
  );

  return;
 }

 observer=new MutationObserver(
  schedule
 );

 observer.observe(
  app,
  {
   childList:true,
   subtree:true
  }
 );
}

function init(){
 installStyles();
 observe();

 if(
  window.NGT500&&
  typeof NGT500.on==='function'
 ){
  NGT500.on(
   'route',
   schedule
  );

  NGT500.on(
   'store:changed',
   schedule
  );
 }

 window.addEventListener(
  'load',
  schedule
 );

 schedule();
}

P.decoration={
 decorate:decorate,
 schedule:schedule,
 observe:observe,
 init:init
};

})();

