(function(){
'use strict';

const STYLE_ID='tc2TaxonomyUiStyles';

let candidatesByKey={};
let savePatched=false;
let routePatched=false;
let decorationTimer=null;
let observer=null;

function clean(value){
 return String(
  value==null
   ?''
   :value
 )
  .replace(/\s+/g,' ')
  .trim();
}

function esc(value){
 if(
  window.NGT500&&
  NGT500.esc
 ){
  return NGT500.esc(
   value||''
  );
 }

 return String(value||'')
  .replace(/&/g,'&amp;')
  .replace(/</g,'&lt;')
  .replace(/>/g,'&gt;')
  .replace(/"/g,'&quot;')
  .replace(/'/g,'&#39;');
}

function jsArg(value){
 return String(value||'')
  .replace(/\\/g,'\\\\')
  .replace(/'/g,"\\'");
}

function clone(value){
 try{
  return JSON.parse(
   JSON.stringify(value)
  );
 }catch(error){
  return value;
 }
}

function taxonomyReady(){
 return !!(
  window.NGTTaxonomy&&
  NGTTaxonomy.normalizeInput&&
  NGTTaxonomy.imageFor&&
  NGTTaxonomy.recordKey
 );
}

function imageSearchReady(){
 return !!(
  window.NGTTaxonomyImages&&
  NGTTaxonomyImages.searchCommons&&
  NGTTaxonomyImages.storeCandidate
 );
}

function currentRoute(){
 if(
  window.NGT500&&
  typeof NGT500.current==='function'
 ){
  return NGT500.current();
 }

 return null;
}

function isInactive(animal){
 return [
  'Archiv',
  'Verkauft',
  'Abgegeben',
  'Verstorben'
 ].includes(
  animal&&animal.status
 );
}

function isOffspring(animal){
 if(
  window.NGTIdManager&&
  NGTIdManager.isOffspring
 ){
  return NGTIdManager.isOffspring(
   animal
  );
 }

 return (
  clean(
   animal&&animal.status
  ).toLowerCase()==='nachzucht'||

  clean(
   animal&&animal.collection
  ).toLowerCase()==='offspring'||

  clean(
   animal&&animal.collection
  ).toLowerCase()==='nachzuchten'
 );
}

function allAnimalRows(){
 try{
  if(
   !window.NGTStore||
   !NGTStore.allAnimals
  ){
   return [];
  }

  return NGTStore
   .allAnimals()
   .filter(function(row){
    const animal=row.a||{};

    return (
     !isInactive(animal)&&
     !isOffspring(animal)
    );
   });

 }catch(error){
  console.error(
   'Tierbestand konnte nicht für Taxonomiebilder gelesen werden.',
   error
  );

  return [];
 }
}

function photoSource(
 photo,
 preferThumb
){
 if(!photo){
  return '';
 }

 if(
  window.NGTPhotoStorage&&
  NGTPhotoStorage.src
 ){
  return NGTPhotoStorage.src(
   photo,
   preferThumb
  );
 }

 if(
  preferThumb&&
  (
   photo.thumbUrl||
   photo.thumbnailUrl
  )
 ){
  return (
   photo.thumbUrl||
   photo.thumbnailUrl
  );
 }

 return (
  photo.url||
  photo.thumbUrl||
  photo.thumbnailUrl||
  photo.data||
  ''
 );
}

function ownAnimalPhoto(animal){
 const photos=(
  animal&&
  Array.isArray(animal.photos)
   ?animal.photos
   :[]
 ).filter(function(photo){
  return !!photoSource(
   photo,
   true
  );
 });

 const cover=
  photos.find(function(photo){
   return !!photo.cover;
  })||
  photos[0]||
  null;

 return photoSource(
  cover,
  true
 );
}

function taxonForAnimal(animal){
 return {
  group:clean(
   animal&&animal.animalGroup
  ),

  genus:clean(
   animal&&animal.genus
  ),

  species:clean(
   animal&&animal.species
  )
 };
}

function taxonomyResult(input){
 if(!taxonomyReady()){
  return null;
 }

 try{
  return NGTTaxonomy.imageFor(
   input||{}
  )||null;

 }catch(error){
  console.error(
   'Taxonomiebild konnte nicht ermittelt werden.',
   error
  );

  return null;
 }
}

function taxonomyImage(input){
 const result=taxonomyResult(
  input
 );

 return result&&result.url
  ?result.url
  :'';
}

function imageForAnimal(animal){
 return (
  ownAnimalPhoto(animal)||
  taxonomyImage(
   taxonForAnimal(animal)
  )||
  ''
 );
}

function rowsForGroup(group){
 const wanted=clean(group);

 return allAnimalRows().filter(
  function(row){
   return clean(
    row.a&&row.a.animalGroup
   )===wanted;
  }
 );
}

function rowsForGenus(
 group,
 genus
){
 const wantedGroup=clean(group);
 const wantedGenus=clean(genus);

 return allAnimalRows().filter(
  function(row){
   const animal=row.a||{};

   return (
    clean(animal.animalGroup)===
     wantedGroup&&

    clean(animal.genus)===
     wantedGenus
   );
  }
 );
}

function firstAnimalImage(rows){
 for(const row of rows||[]){
  const source=imageForAnimal(
   row.a||{}
  );

  if(source){
   return source;
  }
 }

 return '';
}

function groupImage(group){
 return (
  taxonomyImage({
   group:group
  })||
  firstAnimalImage(
   rowsForGroup(group)
  )||
  ''
 );
}

function genusImage(
 group,
 genus
){
 return (
  taxonomyImage({
   group:group,
   genus:genus
  })||
  firstAnimalImage(
   rowsForGenus(
    group,
    genus
   )
  )||
  ''
 );
}

function installStyles(){
 if(
  document.getElementById(
   STYLE_ID
  )
 ){
  return;
 }

 const style=
  document.createElement(
   'style'
  );

 style.id=STYLE_ID;

 style.textContent=`
  .tc2TaxFolder{
   display:grid!important;
   grid-template-columns:92px minmax(0,1fr) 24px!important;
   grid-template-rows:1fr!important;
   align-items:center!important;
   gap:14px!important;

   width:100%!important;
   min-height:118px!important;

   margin:0!important;
   padding:12px!important;

   overflow:hidden!important;
   text-align:left!important;
  }

  .tc2TaxFolder::after{
   display:none!important;
   content:none!important;
  }

  .tc2TaxFolder>
  .tc2TaxVisual{
   grid-column:1!important;
   grid-row:1!important;

   display:grid!important;
   place-items:center!important;

   width:92px!important;
   min-width:92px!important;
   max-width:92px!important;

   height:92px!important;
   min-height:92px!important;
   max-height:92px!important;

   margin:0!important;
   padding:0!important;

   overflow:hidden!important;

   border-radius:22px!important;

   color:#9bec58!important;

   background:
    radial-gradient(
     circle at 35% 30%,
     rgba(139,220,63,.15),
     transparent 58%
    ),
    rgba(5,17,27,.58)!important;

   border:
    1px solid
    rgba(125,170,210,.24)!important;

   font-size:27px!important;
   letter-spacing:0!important;
  }

  .tc2TaxFolder>
  .tc2TaxVisual.hasImage{
   background:#071521!important;
  }

  .tc2TaxFolder>
  .tc2TaxVisual img{
   display:block!important;

   width:100%!important;
   height:100%!important;

   object-fit:cover!important;
   object-position:center!important;
  }

  .tc2TaxFolder>
  .tc2TaxFolderText{
   grid-column:2!important;
   grid-row:1!important;

   display:flex!important;
   flex-direction:column!important;
   align-items:flex-start!important;
   justify-content:center!important;
   gap:7px!important;

   min-width:0!important;
   max-width:100%!important;
  }

  .tc2TaxFolderText>b{
   display:block!important;

   max-width:100%!important;
   overflow:hidden!important;

   color:#f4f7fb!important;

   font-size:17px!important;
   font-weight:900!important;
   line-height:1.2!important;

   text-overflow:ellipsis!important;
   white-space:nowrap!important;
  }

  .tc2TaxFolderText>small{
   display:block!important;

   color:#a7b3bd!important;

   font-size:10px!important;
   font-weight:750!important;
   line-height:1.3!important;
  }

  .tc2TaxFolder>
  .tc2TaxFolderArrow{
   grid-column:3!important;
   grid-row:1!important;

   display:block!important;

   color:#91a0ac!important;

   font-size:29px!important;
   font-weight:500!important;
   line-height:1!important;
  }

  .tc2TaxAnimal{
   display:grid!important;

   grid-template-columns:
    126px minmax(0,1fr) 20px!important;

   grid-template-rows:1fr!important;

   align-items:center!important;
   gap:13px!important;

   width:100%!important;
   min-height:158px!important;

   margin:0!important;
   padding:0 13px 0 0!important;

   overflow:hidden!important;
   text-align:left!important;
  }

  .tc2TaxAnimal>
  .tc2TaxAnimalVisual{
   grid-column:1!important;
   grid-row:1!important;

   display:grid!important;
   place-items:center!important;

   width:126px!important;
   min-width:126px!important;
   max-width:126px!important;

   height:158px!important;
   min-height:158px!important;
   max-height:158px!important;

   margin:0!important;
   padding:0!important;

   overflow:hidden!important;

   color:#9bec58!important;

   background:
    radial-gradient(
     circle at 35% 30%,
     rgba(139,220,63,.14),
     transparent 58%
    ),
    #071521!important;

   font-size:31px!important;
  }

  .tc2TaxAnimal>
  .tc2TaxAnimalVisual img{
   display:block!important;

   width:100%!important;
   height:100%!important;

   object-fit:cover!important;
   object-position:center!important;
  }

  .tc2TaxAnimal>
  .tc2TaxAnimalText{
   grid-column:2!important;
   grid-row:1!important;

   display:flex!important;
   flex-direction:column!important;
   align-items:flex-start!important;
   justify-content:center!important;
   gap:8px!important;

   min-width:0!important;
   max-width:100%!important;
  }

  .tc2TaxAnimalText>b{
   display:block!important;

   color:#9bec58!important;

   font-size:11px!important;
   font-weight:900!important;
   line-height:1.2!important;
  }

  .tc2TaxAnimalText>strong{
   display:block!important;

   max-width:100%!important;
   overflow:hidden!important;

   color:#f4f7fb!important;

   font-size:17px!important;
   font-weight:900!important;
   line-height:1.2!important;

   text-overflow:ellipsis!important;
   white-space:nowrap!important;
  }

  .tc2TaxAnimalText>small{
   display:block!important;

   max-width:100%!important;
   overflow:hidden!important;

   color:#a7b3bd!important;

   font-size:10px!important;
   font-style:italic!important;
   line-height:1.3!important;

   text-overflow:ellipsis!important;
   white-space:nowrap!important;
  }

  .tc2TaxAnimal>
  .tc2TaxAnimalArrow{
   grid-column:3!important;
   grid-row:1!important;

   display:block!important;

   color:#91a0ac!important;

   font-size:28px!important;
   line-height:1!important;
  }

  .tc2TaxImageModal{
   display:flex;
   flex-direction:column;
   gap:14px;

   width:min(920px,94vw);
   max-height:88vh;

   overflow:hidden;
  }

  .tc2TaxImageModalHead{
   display:flex;
   align-items:flex-start;
   justify-content:space-between;
   gap:14px;
  }

  .tc2TaxImageModalHead h2{
   margin:0 0 5px!important;
   font-size:23px!important;
  }

  .tc2TaxImageModalHead p{
   margin:0;
   color:#9eabb7;
   font-size:12px;
  }

  .tc2TaxImageModalHead>button{
   display:grid!important;
   place-items:center!important;

   width:40px!important;
   min-width:40px!important;
   height:40px!important;
   min-height:40px!important;

   margin:0!important;
   padding:0!important;

   border-radius:13px!important;

   font-size:22px!important;
  }

  .tc2TaxLicenseInfo{
   padding:11px 13px;

   border-radius:14px;

   color:#b9c6cf;

   background:
    rgba(105,210,196,.06);

   border:
    1px solid
    rgba(105,210,196,.2);

   font-size:10px;
   line-height:1.45;
  }

  .tc2TaxCandidateGrid{
   display:grid;

   grid-template-columns:
    repeat(2,minmax(0,1fr));

   gap:12px;

   overflow-y:auto;
   padding-right:3px;
  }

  .tc2TaxCandidate{
   display:flex;
   flex-direction:column;

   overflow:hidden;

   border-radius:19px;

   background:
    linear-gradient(
     180deg,
     rgba(24,45,62,.98),
     rgba(13,29,42,.99)
    );

   border:
    1px solid
    rgba(125,170,210,.24);

   box-shadow:
    0 12px 28px
    rgba(0,0,0,.17);
  }

  .tc2TaxCandidatePreview{
   display:block!important;

   width:100%!important;
   height:210px!important;

   margin:0!important;
   padding:0!important;

   overflow:hidden!important;

   border:0!important;
   border-radius:0!important;

   background:#06131d!important;
   box-shadow:none!important;
  }

  .tc2TaxCandidatePreview img{
   display:block;

   width:100%;
   height:100%;

   object-fit:cover;
   object-position:center;
  }

  .tc2TaxCandidateBody{
   display:flex;
   flex-direction:column;
   gap:6px;

   padding:12px;
  }

  .tc2TaxCandidateBody strong,
  .tc2TaxCandidateBody small{
   overflow:hidden;
   text-overflow:ellipsis;
   white-space:nowrap;
  }

  .tc2TaxCandidateBody strong{
   color:#f4f7fb;
   font-size:12px;
  }

  .tc2TaxCandidateBody small{
   color:#91a0ac!important;
   font-size:9px;
  }

  .tc2TaxCandidateBody button{
   width:100%!important;
   min-height:39px!important;

   margin:5px 0 0!important;
   padding:7px 10px!important;

   border-radius:12px!important;

   font-size:10px!important;
   font-weight:900!important;
  }

  .tc2TaxModalActions{
   display:flex;
   justify-content:flex-end;
  }

  @media(max-width:520px){
   .tc2TaxFolder{
    grid-template-columns:
     82px minmax(0,1fr) 20px!important;

    min-height:104px!important;
    gap:11px!important;
    padding:10px!important;
   }

   .tc2TaxFolder>
   .tc2TaxVisual{
    width:82px!important;
    min-width:82px!important;
    max-width:82px!important;

    height:82px!important;
    min-height:82px!important;
    max-height:82px!important;

    border-radius:19px!important;
   }

   .tc2TaxFolderText>b{
    font-size:15px!important;
   }

   .tc2TaxAnimal{
    grid-template-columns:
     106px minmax(0,1fr) 18px!important;

    min-height:142px!important;
    gap:11px!important;
   }

   .tc2TaxAnimal>
   .tc2TaxAnimalVisual{
    width:106px!important;
    min-width:106px!important;
    max-width:106px!important;

    height:142px!important;
    min-height:142px!important;
    max-height:142px!important;
   }

   .tc2TaxAnimalText>strong{
    font-size:15px!important;
   }

   .tc2TaxCandidateGrid{
    grid-template-columns:1fr;
   }

   .tc2TaxCandidatePreview{
    height:190px!important;
   }
  }
 `;

 document.head.appendChild(
  style
 );
}

function folderLabel(button){
 const labelElement=
  button.querySelector(
   ':scope > b'
  )||
  button.querySelector(
   '.tc2TaxFolderText > b'
  );

 return clean(
  labelElement&&
  labelElement.textContent
 );
}

function folderCount(button){
 const countElement=
  button.querySelector(
   ':scope > small'
  )||
  button.querySelector(
   '.tc2TaxFolderText > small'
  );

 return clean(
  countElement&&
  countElement.textContent
 );
}

function rebuildFolder(
 button,
 label,
 count,
 source
){
 button.innerHTML=`
  <span class="tc2TaxVisual ${source?'hasImage':''}">
   ${
    source
     ?`
      <img
       src="${esc(source)}"
       alt="${esc(label)}"
       loading="lazy"
      >
     `
     :'🐾'
   }
  </span>

  <span class="tc2TaxFolderText">
   <b>${esc(label)}</b>
   <small>${esc(count)}</small>
  </span>

  <span class="tc2TaxFolderArrow">
   ›
  </span>
 `;
}

function decorateFolders(){
 const route=currentRoute();

 if(
  !route||
  route.name!=='animals'
 ){
  return;
 }

 const args=route.args||{};
 const group=clean(args.group);
 const genus=clean(args.genus);

 if(genus){
  return;
 }

 const buttons=
  Array.from(
   document.querySelectorAll(
    '.tc2TaxFolder'
   )
  );

 buttons.forEach(function(button){
  const label=folderLabel(
   button
  );

  const count=folderCount(
   button
  );

  if(!label){
   return;
  }

  let source='';

  if(!group){
   source=groupImage(
    label
   );

  }else{
   source=genusImage(
    group,
    label
   );
  }

  rebuildFolder(
   button,
   label,
   count,
   source
  );
 });
}

function animalCardData(card){
 return {
  id:clean(
   (
    card.querySelector(
     ':scope > b'
    )||
    card.querySelector(
     '.tc2TaxAnimalText > b'
    )
   )?.textContent
  ),

  name:clean(
   (
    card.querySelector(
     ':scope > strong'
    )||
    card.querySelector(
     '.tc2TaxAnimalText > strong'
    )
   )?.textContent
  ),

  taxonomy:clean(
   (
    card.querySelector(
     ':scope > small'
    )||
    card.querySelector(
     '.tc2TaxAnimalText > small'
    )
   )?.textContent
  )
 };
}

function rebuildAnimalCard(
 card,
 data,
 animal,
 source
){
 card.innerHTML=`
  <div class="tc2TaxAnimalVisual">
   ${
    source
     ?`
      <img
       src="${esc(source)}"
       alt="${esc(
        animal.name||
        data.name||
        'Tierbild'
       )}"
       loading="lazy"
      >
     `
     :'🐾'
   }
  </div>

  <span class="tc2TaxAnimalText">
   <b>${esc(data.id)}</b>

   <strong>
    ${esc(
     data.name||
     animal.name||
     'Unbenannt'
    )}
   </strong>

   <small>
    ${esc(
     data.taxonomy||
     [
      animal.genus,
      animal.species
     ].filter(Boolean).join(' ')
    )}
   </small>
  </span>

  <span class="tc2TaxAnimalArrow">
   ›
  </span>
 `;
}

function decorateAnimals(){
 const route=currentRoute();

 if(
  !route||
  route.name!=='animals'
 ){
  return;
 }

 const args=route.args||{};
 const group=clean(args.group);
 const genus=clean(args.genus);

 if(
  !group||
  !genus
 ){
  return;
 }

 const rows=rowsForGenus(
  group,
  genus
 );

 const cards=
  Array.from(
   document.querySelectorAll(
    '.tc2TaxAnimal'
   )
  );

 cards.forEach(function(card,index){
  const data=animalCardData(
   card
  );

  let row=rows[index];

  if(data.id){
   row=rows.find(function(candidate){
    const animal=candidate.a||{};

    return clean(
     animal.publicId||
     animal.displayId
    )===data.id;
   })||row;
  }

  if(!row||!row.a){
   return;
  }

  const source=imageForAnimal(
   row.a
  );

  rebuildAnimalCard(
   card,
   data,
   row.a,
   source
  );
 });
}

function decorateNavigation(){
 installStyles();
 decorateFolders();
 decorateAnimals();
}

function scheduleDecoration(){
 clearTimeout(
  decorationTimer
 );

 decorationTimer=setTimeout(
  decorateNavigation,
  60
 );
}

function installObserver(){
 if(observer){
  return;
 }

 const app=
  document.getElementById(
   'app'
  );

 if(!app){
  setTimeout(
   installObserver,
   100
  );

  return;
 }

 observer=new MutationObserver(
  function(){
   scheduleDecoration();
  }
 );

 observer.observe(
  app,
  {
   childList:true,
   subtree:true
  }
 );
}

function patchRoute(){
 if(
  routePatched||
  !window.NGT500||
  typeof NGT500.route!=='function'
 ){
  return false;
 }

 const originalRoute=
  NGT500.route;

 NGT500.route=function(){
  const result=
   originalRoute.apply(
    NGT500,
    arguments
   );

  scheduleDecoration();

  return result;
 };

 routePatched=true;

 return true;
}

function editorTaxon(){
 const groupElement=
  document.getElementById(
   'edAnimalGroup'
  );

 const genusElement=
  document.getElementById(
   'edGenus'
  );

 const speciesElement=
  document.getElementById(
   'edSpecies'
  );

 if(
  !groupElement&&
  !genusElement&&
  !speciesElement
 ){
  return null;
 }

 return {
  group:clean(
   groupElement&&
   groupElement.value
  ),

  genus:clean(
   genusElement&&
   genusElement.value
  ),

  species:clean(
   speciesElement&&
   speciesElement.value
  )
 };
}

function validTaxon(taxon){
 return !!(
  taxon&&
  (
   taxon.group||
   taxon.genus||
   taxon.species
  )
 );
}

function taxonLabel(taxon){
 if(!taxonomyReady()){
  return [
   taxon&&taxon.genus,
   taxon&&taxon.species
  ].filter(Boolean).join(' ');
 }

 const normalized=
  NGTTaxonomy.normalizeInput(
   taxon||{}
  );

 return (
  normalized.scientificName||
  normalized.genus||
  normalized.group||
  'Taxonomie'
 );
}

function recordKey(taxon){
 if(!taxonomyReady()){
  return '';
 }

 return NGTTaxonomy.recordKey(
  taxon||{}
 );
}

function toast(
 message,
 type
){
 if(
  window.NGT500&&
  NGT500.toast
 ){
  NGT500.toast(
   message,
   type||'ok'
  );

  return;
 }

 console.log(message);
}

async function ensureTaxonomy(taxon){
 if(
  !taxonomyReady()||
  !validTaxon(taxon)
 ){
  return null;
 }

 try{
  return await NGTTaxonomy.ensure(
   taxon
  );

 }catch(error){
  console.error(
   'Taxonomie konnte nicht angelegt werden.',
   error
  );

  return null;
 }
}

function candidateCard(
 candidate,
 key,
 index
){
 const dimensions=
  candidate.width&&
  candidate.height
   ?candidate.width+
    ' × '+
    candidate.height
   :'';

 return `
  <article class="tc2TaxCandidate">
   <button
    type="button"
    class="tc2TaxCandidatePreview"
    onclick="NGTTaxonomyUI.previewCandidate('${jsArg(key)}',${index})"
   >
    <img
     src="${esc(candidate.previewUrl)}"
     alt="${esc(candidate.title||'Bildvorschlag')}"
     loading="lazy"
    >
   </button>

   <div class="tc2TaxCandidateBody">
    <strong>
     ${esc(candidate.title||'Bildvorschlag')}
    </strong>

    <small>
     ${esc(
      candidate.author||
      'Urheber nicht angegeben'
     )}
    </small>

    <small>
     ${esc(
      candidate.license||
      'Lizenz nicht angegeben'
     )}
     ${dimensions?' · '+esc(dimensions):''}
    </small>

    <button
     type="button"
     class="primary"
     onclick="NGTTaxonomyUI.selectCandidate('${jsArg(key)}',${index})"
    >
     Dieses Bild verwenden
    </button>
   </div>
  </article>
 `;
}

function showCandidateModal(
 taxon,
 candidates
){
 const key=recordKey(
  taxon
 );

 candidatesByKey[key]={
  taxon:clone(taxon),
  candidates:clone(candidates)
 };

 const html=`
  <div class="tc2TaxImageModal">
   <div class="tc2TaxImageModalHead">
    <div>
     <h2>Artenbild auswählen</h2>
     <p>${esc(taxonLabel(taxon))}</p>
    </div>

    <button
     type="button"
     onclick="NGT500.closeModal()"
    >
     ×
    </button>
   </div>

   <div class="tc2TaxLicenseInfo">
    Die Vorschläge stammen aus Wikimedia Commons.
    Quelle, Fotograf und Lizenz werden dauerhaft gespeichert.
   </div>

   <div class="tc2TaxCandidateGrid">
    ${candidates.map(function(candidate,index){
     return candidateCard(
      candidate,
      key,
      index
     );
    }).join('')}
   </div>

   <div class="tc2TaxModalActions">
    <button
     type="button"
     onclick="NGT500.closeModal()"
    >
     Später auswählen
    </button>
   </div>
  </div>
 `;

 if(
  window.NGT500&&
  NGT500.modal
 ){
  NGT500.modal(
   html
  );
 }
}

async function searchAndChoose(taxon){
 if(
  !imageSearchReady()||
  !validTaxon(taxon)
 ){
  return;
 }

 if(taxonomyImage(taxon)){
  scheduleDecoration();
  return;
 }

 try{
  toast(
   'Passendes Artenbild wird gesucht …',
   'ok'
  );

  const candidates=
   await NGTTaxonomyImages
    .searchCommons(
     taxon,
     {
      limit:8
     }
    );

  if(!candidates.length){
   toast(
    'Kein frei nutzbares Artenbild gefunden.',
    'warn'
   );

   return;
  }

  showCandidateModal(
   taxon,
   candidates
  );

 }catch(error){
  console.error(
   'Artenbildsuche fehlgeschlagen.',
   error
  );

  toast(
   error&&error.message
    ?error.message
    :'Artenbildsuche fehlgeschlagen.',
   'danger'
  );
 }
}

async function selectCandidate(
 key,
 index
){
 const entry=
  candidatesByKey[key];

 if(
  !entry||
  !entry.candidates||
  !entry.candidates[index]
 ){
  toast(
   'Bildvorschlag nicht mehr verfügbar.',
   'danger'
  );

  return;
 }

 if(
  !window.NGTFirebaseSync||
  !NGTFirebaseSync.isSignedIn||
  !NGTFirebaseSync.isSignedIn()
 ){
  toast(
   'Bitte zuerst bei Firebase anmelden.',
   'warn'
  );

  return;
 }

 try{
  toast(
   'Artenbild wird gespeichert …',
   'ok'
  );

  await NGTTaxonomyImages
   .storeCandidate(
    entry.taxon,
    entry.candidates[index]
   );

  if(
   window.NGT500&&
   NGT500.closeModal
  ){
   NGT500.closeModal();
  }

  toast(
   'Artenbild wurde gespeichert.',
   'ok'
  );

  scheduleDecoration();

 }catch(error){
  console.error(
   'Artenbild konnte nicht gespeichert werden.',
   error
  );

  toast(
   error&&error.message
    ?error.message
    :'Artenbild konnte nicht gespeichert werden.',
   'danger'
  );
 }
}

function previewCandidate(
 key,
 index
){
 const entry=
  candidatesByKey[key];

 if(
  !entry||
  !entry.candidates||
  !entry.candidates[index]
 ){
  return;
 }

 const candidate=
  entry.candidates[index];

 window.open(
  candidate.previewUrl||
  candidate.originalUrl||
  candidate.sourceUrl,
  '_blank',
  'noopener,noreferrer'
 );
}

async function afterAnimalSave(taxon){
 if(!validTaxon(taxon)){
  return;
 }

 await ensureTaxonomy(
  taxon
 );

 if(taxonomyImage(taxon)){
  scheduleDecoration();
  return;
 }

 await searchAndChoose(
  taxon
 );
}

function patchAnimalSave(){
 if(
  savePatched||
  !window.NGTAnimals||
  typeof NGTAnimals.save!=='function'
 ){
  return false;
 }

 const originalSave=
  NGTAnimals.save;

 NGTAnimals.save=function(t,i){
  const taxon=
   editorTaxon();

  const result=
   originalSave.call(
    NGTAnimals,
    t,
    i
   );

  Promise.resolve()
   .then(function(){
    return afterAnimalSave(
     taxon
    );
   })
   .catch(function(error){
    console.error(
     'Taxonomie-Nachbearbeitung fehlgeschlagen.',
     error
    );
   });

  return result;
 };

 savePatched=true;

 return true;
}

function waitForModules(){
 let attempts=0;

 const timer=setInterval(
  function(){
   attempts++;

   patchRoute();
   patchAnimalSave();

   if(
    (
     routePatched&&
     savePatched
    )||
    attempts>=150
   ){
    clearInterval(timer);
   }
  },
  100
 );
}

function init(){
 installStyles();
 installObserver();
 waitForModules();

 if(
  window.NGT500&&
  NGT500.on
 ){
  NGT500.on(
   'route',
   scheduleDecoration
  );

  NGT500.on(
   'taxonomy:changed',
   scheduleDecoration
  );

  NGT500.on(
   'taxonomy:image-upload-complete',
   scheduleDecoration
  );
 }

 window.addEventListener(
  'load',
  scheduleDecoration
 );

 scheduleDecoration();
}

window.NGTTaxonomyUI={
 decorateNavigation:
  decorateNavigation,

 searchAndChoose:
  searchAndChoose,

 selectCandidate:
  selectCandidate,

 previewCandidate:
  previewCandidate,

 imageForAnimal:
  imageForAnimal,

 groupImage:
  groupImage,

 genusImage:
  genusImage
};

document.readyState==='loading'
 ?document.addEventListener(
   'DOMContentLoaded',
   init
  )
 :init();

})();