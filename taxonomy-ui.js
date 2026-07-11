(function(){
'use strict';

const PLACEHOLDER='🐾';

let candidatesByKey={};
let patched=false;
let refreshTimer=null;

function clean(value){
 return String(value==null?'':value)
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
  NGTTaxonomy.imageFor
 );
}

function imageSearchReady(){
 return !!(
  window.NGTTaxonomyImages&&
  NGTTaxonomyImages.searchCommons&&
  NGTTaxonomyImages.storeCandidate
 );
}

function allAnimals(){
 try{
  return NGTStore.allAnimals
   ?NGTStore.allAnimals()
   :[];
 }catch(error){
  return [];
 }
}

function activeAnimals(){
 return allAnimals().filter(function(row){
  const animal=row.a||{};

  return ![
   'Archiv',
   'Verkauft',
   'Abgegeben',
   'Verstorben'
  ].includes(animal.status);
 });
}

function photoSource(photo,preferThumb){
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

function animalCover(animal){
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

 return (
  photos.find(function(photo){
   return !!photo.cover;
  })||
  photos[0]||
  null
 );
}

function animalOwnImage(animal){
 return photoSource(
  animalCover(animal),
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

function taxonomyImage(input){
 if(!taxonomyReady()){
  return '';
 }

 try{
  const result=
   NGTTaxonomy.imageFor(
    input||{}
   );

  return result&&result.url
   ?result.url
   :'';

 }catch(error){
  return '';
 }
}

function imageForAnimal(animal){
 return (
  animalOwnImage(animal)||
  taxonomyImage(
   taxonForAnimal(animal)
  )||
  ''
 );
}

function rowsForGroup(group){
 return activeAnimals().filter(
  function(row){
   return clean(
    row.a&&row.a.animalGroup
   )===clean(group);
  }
 );
}

function rowsForGenus(group,genus){
 return rowsForGroup(group).filter(
  function(row){
   return clean(
    row.a&&row.a.genus
   )===clean(genus);
  }
 );
}

function firstUsefulImage(rows){
 for(const row of rows||[]){
  const animal=row.a||{};
  const source=imageForAnimal(animal);

  if(source){
   return source;
  }
 }

 return '';
}

function groupImage(group){
 const direct=taxonomyImage({
  group:group
 });

 if(direct){
  return direct;
 }

 return firstUsefulImage(
  rowsForGroup(group)
 );
}

function genusImage(group,genus){
 const direct=taxonomyImage({
  group:group,
  genus:genus
 });

 if(direct){
  return direct;
 }

 return firstUsefulImage(
  rowsForGenus(
   group,
   genus
  )
 );
}

function currentRoute(){
 if(
  window.NGT500&&
  NGT500.current
 ){
  return NGT500.current();
 }

 return null;
}

function imageMarkup(
 source,
 alt,
 className
){
 if(!source){
  return `
   <span class="${className||''}">
    ${PLACEHOLDER}
   </span>
  `;
 }

 return `
  <img
   class="${className||''}"
   src="${esc(source)}"
   alt="${esc(alt||'Tierbild')}"
   loading="lazy"
   referrerpolicy="no-referrer"
  >
 `;
}

function applyFolderImage(
 button,
 source,
 label
){
 if(!button){
  return;
 }

 const oldIcon=
  button.querySelector(
   ':scope > span'
  );

 if(!oldIcon){
  return;
 }

 oldIcon.classList.add(
  'tc2TaxVisual'
 );

 if(source){
  oldIcon.innerHTML=imageMarkup(
   source,
   label,
   'tc2TaxVisualImage'
  );

  oldIcon.classList.add(
   'hasImage'
  );

 }else{
  oldIcon.textContent=PLACEHOLDER;

  oldIcon.classList.remove(
   'hasImage'
  );
 }
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

 const buttons=
  Array.from(
   document.querySelectorAll(
    '.tc2TaxFolder'
   )
  );

 buttons.forEach(function(button){
  const labelElement=
   button.querySelector(
    ':scope > b'
   );

  const label=clean(
   labelElement&&
   labelElement.textContent
  );

  if(!label){
   return;
  }

  let source='';

  if(!group){
   source=groupImage(label);

  }else if(group&&!genus){
   source=genusImage(
    group,
    label
   );
  }

  applyFolderImage(
   button,
   source,
   label
  );
 });
}

function decorateAnimalCards(){
 const cards=
  Array.from(
   document.querySelectorAll(
    '.tc2TaxAnimal'
   )
  );

 if(!cards.length){
  return;
 }

 const route=currentRoute();
 const args=route&&route.args||{};

 const rows=rowsForGenus(
  args.group,
  args.genus
 );

 cards.forEach(function(card,index){
  const row=rows[index];

  if(!row||!row.a){
   return;
  }

  const animal=row.a;
  const source=imageForAnimal(animal);
  const holder=card.querySelector(
   ':scope > div'
  );

  if(!holder){
   return;
  }

  holder.classList.add(
   'tc2TaxAnimalVisual'
  );

  holder.innerHTML=imageMarkup(
   source,
   animal.name||
   animal.publicId||
   'Tier',
   'tc2TaxAnimalVisualImage'
  );

  holder.classList.toggle(
   'hasImage',
   !!source
  );
 });
}

function decorateNavigation(){
 decorateFolders();
 decorateAnimalCards();
}

function scheduleDecoration(){
 clearTimeout(refreshTimer);

 refreshTimer=setTimeout(
  decorateNavigation,
  40
 );
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

function scientificLabel(taxon){
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

function toast(message,type){
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
 const ratio=
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
     referrerpolicy="no-referrer"
    >
   </button>

   <div class="tc2TaxCandidateBody">
    <strong>
     ${esc(candidate.title||'Bildvorschlag')}
    </strong>

    <small>
     ${esc(candidate.author||'Urheber nicht angegeben')}
    </small>

    <small>
     ${esc(candidate.license||'Lizenz nicht angegeben')}
     ${ratio?' · '+esc(ratio):''}
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

function candidateModal(
 taxon,
 candidates
){
 const key=recordKey(taxon);

 candidatesByKey[key]={
  taxon:clone(taxon),
  candidates:clone(candidates)
 };

 const html=`
  <div class="tc2TaxImageModal">
   <div class="tc2TaxImageModalHead">
    <div>
     <h2>Artenbild auswählen</h2>

     <p>
      ${esc(scientificLabel(taxon))}
     </p>
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
    Quelle, Fotograf und Lizenz werden dauerhaft mitgespeichert.
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
  NGT500.modal(html);
 }
}

async function searchAndChoose(taxon){
 if(
  !imageSearchReady()||
  !validTaxon(taxon)
 ){
  return;
 }

 const current=
  taxonomyImage(taxon);

 if(current){
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

  candidateModal(
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

 const candidate=
  entry.candidates[index];

 try{
  toast(
   'Artenbild wird gespeichert …',
   'ok'
  );

  await NGTTaxonomyImages
   .storeCandidate(
    entry.taxon,
    candidate
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

 await ensureTaxonomy(taxon);

 if(taxonomyImage(taxon)){
  scheduleDecoration();
  return;
 }

 await searchAndChoose(taxon);
}

function patchAnimalSave(){
 if(
  patched||
  !window.NGTAnimals||
  !NGTAnimals.save
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

 patched=true;

 return true;
}

function patchWhenReady(){
 if(patchAnimalSave()){
  return;
 }

 let attempts=0;

 const timer=setInterval(
  function(){
   attempts++;

   if(
    patchAnimalSave()||
    attempts>=100
   ){
    clearInterval(timer);
   }
  },
  100
 );
}

function routeChanged(){
 scheduleDecoration();
}

function taxonomyChanged(){
 scheduleDecoration();
}

function init(){
 patchWhenReady();

 if(
  window.NGT500&&
  NGT500.on
 ){
  NGT500.on(
   'route',
   routeChanged
  );

  NGT500.on(
   'taxonomy:changed',
   taxonomyChanged
  );

  NGT500.on(
   'taxonomy:image-upload-complete',
   taxonomyChanged
  );
 }

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