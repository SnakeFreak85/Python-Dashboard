(function(){
'use strict';

const P=window.NGTProfileInternal;

if(!P){
 throw new Error(
  'NGTProfileInternal fehlt. profile-core.js muss vor profile-photos.js geladen werden.'
 );
}

function photoSrc(photo,thumb){
 if(!photo)return '';

 if(
  window.NGTPhotoStorage&&
  NGTPhotoStorage.src
 ){
  return NGTPhotoStorage.src(
   photo,
   thumb
  );
 }

 if(
  thumb&&
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

function isUsablePhoto(photo){
 return !!photoSrc(
  photo,
  true
 );
}

function usablePhotos(animal){
 return (
  animal&&
  Array.isArray(animal.photos)
   ?animal.photos
   :[]
 )
  .filter(
   isUsablePhoto
  );
}

function profilePhoto(animal){
 const photos=
  usablePhotos(animal);

 return (
  photos.find(function(photo){
   return photo.cover;
  })||
  photos[0]||
  null
 );
}

function hasLegacyPhotos(animal){
 if(
  window.NGTPhotoStorage&&
  NGTPhotoStorage.hasLegacyPhotos
 ){
  return NGTPhotoStorage
   .hasLegacyPhotos(animal);
 }

 return !!(
  animal&&
  Array.isArray(animal.photos)&&
  animal.photos.some(function(photo){
   return (
    photo&&
    photo.data&&
    String(photo.data)
     .startsWith('data:image')&&
    !photo.storagePath&&
    !photo.url
   );
  })
 );
}

function photos(animal){
 const legacy=
  hasLegacyPhotos(animal);

 return `${
  legacy
   ?`<div class="subcard tc2SubCard warn">
    <h3>Alte Fotos migrieren</h3>

    <p class="muted">
     Dieses Tier enthält noch eingebettete Base64-Fotos.
     Migriere sie in den dauerhaften Foto-Speicher.
    </p>

    <button onclick="NGTProfile.migratePhotos()">
     Fotos jetzt migrieren
    </button>

    <div
     id="photoMigrationStatus"
     class="muted"
    ></div>
   </div>`
   :''
 }

 <div class="subcard tc2SubCard">
  <h3>Foto hinzufügen</h3>

  <input
   id="photoFileInput"
   type="file"
   accept="image/*"
   onchange="NGTProfile.addPhoto(this.files[0])"
  >

  <select id="photoType">
   <option>Portrait</option>
   <option>Terrarium</option>
   <option>Häutung</option>
   <option>Fütterung</option>
   <option>Nachwuchs</option>
   <option>Gesundheit</option>
   <option>Sonstige</option>
  </select>

  <input
   id="photoNote"
   placeholder="Notiz zum Foto"
  >

  <p
   id="photoUploadStatus"
   class="muted"
  >
   Fotos werden dauerhaft in Firebase Storage gespeichert.
  </p>
 </div>`+

 (animal.photos||[])
  .map(function(photo,index){
   const image=
    photoSrc(
     photo,
     true
    );

   return `<div class="subcard tc2SubCard">
    ${
     image
      ?`<img
        class="photo"
        src="${P.esc(image)}"
        alt="Tierfoto"
        loading="lazy"
        onclick="NGTProfile.openPhoto(${index})"
       >`
      :'<div class="tc2ProfileHeroEmpty">📷</div>'
    }

    <b>${P.esc(photo.date||'')}</b>
    · ${P.esc(photo.type||'Sonstige')}
    ${photo.cover?'· Titelbild':''}

    <br>

    ${P.esc(photo.note||'')}

    <div class="btnRow">
     ${
      image
       ?`<button onclick="NGTProfile.openPhoto(${index})">
         Vollbild
        </button>`
       :''
     }

     <button onclick="NGTProfile.setCover(${index})">
      Als Titelbild
     </button>

     <button
      class="danger"
      onclick="NGTProfile.deletePhoto(${index})"
     >
      Foto löschen
     </button>
    </div>
   </div>`;
  })
  .join('');
}

function setPhotoUploadStatus(
 message,
 isError
){
 const status=
  document.getElementById(
   'photoUploadStatus'
  );

 if(!status)return;

 status.textContent=message;

 status.classList.toggle(
  'danger',
  !!isError
 );
}

async function addPhoto(file){
 if(!file)return;

 if(
  !window.NGTPhotoStorage||
  !NGTPhotoStorage.upload
 ){
  alert(
   'Foto-Speicher ist noch nicht geladen.'
  );

  return;
 }

 const input=
  document.getElementById(
   'photoFileInput'
  );

 if(input){
  input.disabled=true;
 }

 setPhotoUploadStatus(
  'Foto wird verarbeitet und hochgeladen …',
  false
 );

 try{
  const animal=P.current();

  if(!animal){
   throw new Error(
    'Das Tier wurde nicht gefunden.'
   );
  }

  P.ensure(animal);

  const typeElement=
   document.getElementById(
    'photoType'
   );

  const noteElement=
   document.getElementById(
    'photoNote'
   );

  const meta={
   date:NGT500.today(),

   type:
    (
     typeElement&&
     typeElement.value
    )||
    'Sonstige',

   note:
    (
     noteElement&&
     noteElement.value
    )||
    '',

   cover:
    !profilePhoto(animal)
  };

  const saved=
   await NGTPhotoStorage.upload(
    file,
    animal,
    meta
   );

  animal.photos.push(saved);

  if(
   !animal.photos.some(function(photo){
    return (
     photo&&
     photo.cover&&
     isUsablePhoto(photo)
    );
   })
  ){
   saved.cover=true;
  }

  NGTStore.save();
  P.setTab('photos');

 }catch(error){
  console.error(error);

  setPhotoUploadStatus(
   error&&error.message
    ?error.message
    :'Foto konnte nicht gespeichert werden.',
   true
  );

  alert(
   error&&error.message
    ?error.message
    :'Foto konnte nicht dauerhaft gespeichert werden.'
  );

 }finally{
  if(input){
   input.disabled=false;
   input.value='';
  }
 }
}

async function migratePhotos(){
 if(
  !window.NGTPhotoStorage||
  !NGTPhotoStorage.migrateAnimal
 ){
  alert(
   'Foto-Migration ist noch nicht geladen.'
  );

  return;
 }

 const animal=P.current();

 if(!animal){
  alert(
   'Das Tier wurde nicht gefunden.'
  );

  return;
 }

 P.ensure(animal);

 if(!hasLegacyPhotos(animal)){
  alert(
   'Keine alten Fotos zum Migrieren gefunden.'
  );

  return;
 }

 const status=
  document.getElementById(
   'photoMigrationStatus'
  );

 if(status){
  status.textContent=
   'Migration läuft …';
 }

 try{
  const result=
   await NGTPhotoStorage
    .migrateAnimal(
     animal,
     function(info){
      const element=
       document.getElementById(
        'photoMigrationStatus'
       );

      if(element){
       element.textContent=
        'Migriert: '+
        info.count+
        ' / '+
        (
         info.total||
         info.count
        );
      }
     }
    );

  if(result.changed){
   const selected=
    profilePhoto(animal);

   if(
    selected&&
    !animal.photos.some(
     function(photo){
      return (
       photo&&
       photo.cover&&
       isUsablePhoto(photo)
      );
     }
    )
   ){
    selected.cover=true;
   }

   NGTStore.save();
  }

  alert(
   (result.count||0)+
   ' Foto(s) migriert.'
  );

  P.setTab('photos');

 }catch(error){
  console.error(error);

  alert(
   error&&error.message
    ?error.message
    :'Fotos konnten nicht migriert werden.'
  );
 }
}

function setCover(index){
 const animal=P.current();

 if(!animal){
  alert(
   'Das Tier wurde nicht gefunden.'
  );

  return;
 }

 const selected=
  (animal.photos||[])[index];

 if(
  !selected||
  !isUsablePhoto(selected)
 ){
  alert(
   'Dieses Foto kann nicht als Titelbild verwendet werden.'
  );

  return;
 }

 (animal.photos||[])
  .forEach(function(photo,itemIndex){
   if(photo){
    photo.cover=
     itemIndex===index;
   }
  });

 NGTStore.save();
 P.setTab('photos');
}

async function deletePhoto(index){
 if(!confirm('Foto löschen?')){
  return;
 }

 const animal=P.current();

 if(!animal){
  alert(
   'Das Tier wurde nicht gefunden.'
  );

  return;
 }

 const photo=
  (animal.photos||[])[index];

 try{
  if(
   window.NGTPhotoStorage&&
   NGTPhotoStorage.remove&&
   photo
  ){
   await NGTPhotoStorage.remove(
    photo
   );
  }

  animal.photos.splice(
   index,
   1
  );

  if(
   animal.photos.length&&
   !animal.photos.some(
    function(entry){
     return (
      entry&&
      entry.cover&&
      isUsablePhoto(entry)
     );
    }
   )
  ){
   const next=
    profilePhoto(animal);

   if(next){
    next.cover=true;
   }
  }

  NGTStore.save();
  closePhotoViewer();
  P.setTab('photos');

 }catch(error){
  console.error(error);

  alert(
   error&&error.message
    ?error.message
    :'Foto konnte nicht gelöscht werden.'
  );
 }
}

function openCoverPhoto(){
 const animal=P.current();

 if(!animal)return;

 const photo=
  profilePhoto(animal);

 if(!photo)return;

 const index=
  (animal.photos||[])
   .indexOf(photo);

 if(index>=0){
  openPhoto(index);
 }
}

function openPhoto(index){
 const animal=P.current();

 if(!animal){
  alert(
   'Das Tier wurde nicht gefunden.'
  );

  return;
 }

 P.ensure(animal);

 const photo=
  (animal.photos||[])[index];

 if(
  !photo||
  !isUsablePhoto(photo)
 ){
  alert(
   'Dieses Foto kann nicht geöffnet werden.'
  );

  return;
 }

 P.state.viewerIndex=index;

 renderPhotoViewer();
}

function usablePhotoIndexes(animal){
 return (animal.photos||[])
  .map(function(photo,index){
   return isUsablePhoto(photo)
    ?index
    :-1;
  })
  .filter(function(index){
   return index>=0;
  });
}

function renderPhotoViewer(){
 const animal=P.current();

 if(!animal)return;

 const indexes=
  usablePhotoIndexes(animal);

 const photo=
  (animal.photos||[])
   [P.state.viewerIndex];

 if(
  !photo||
  !isUsablePhoto(photo)
 ){
  closePhotoViewer();

  return;
 }

 const source=
  photoSrc(
   photo,
   false
  )||
  photoSrc(
   photo,
   true
  );

 const position=
  indexes.indexOf(
   P.state.viewerIndex
  );

 const multiple=
  indexes.length>1;

 const root=
  document.getElementById(
   'modalRoot'
  );

 if(!root)return;

 root.innerHTML=`<div
  id="tc2PhotoViewer"
  style="
   position:fixed;
   inset:0;
   z-index:99999;
   background:rgba(0,0,0,.94);
   display:flex;
   flex-direction:column;
   align-items:center;
   justify-content:center;
   padding:16px;
   box-sizing:border-box;
  "
  onclick="if(event.target===this)NGTProfile.closePhotoViewer()"
 >
  <button
   onclick="NGTProfile.closePhotoViewer()"
   aria-label="Schließen"
   style="
    position:absolute;
    top:max(16px,env(safe-area-inset-top));
    right:16px;
    width:46px;
    height:46px;
    border-radius:50%;
    border:0;
    font-size:28px;
    background:rgba(255,255,255,.14);
    color:white;
    z-index:3;
   "
  >
   ×
  </button>

  ${
   multiple
    ?`<button
      onclick="NGTProfile.previousPhoto()"
      aria-label="Vorheriges Foto"
      style="
       position:absolute;
       left:12px;
       top:50%;
       transform:translateY(-50%);
       width:48px;
       height:64px;
       border-radius:16px;
       border:0;
       font-size:32px;
       background:rgba(255,255,255,.14);
       color:white;
       z-index:3;
      "
     >
      ‹
     </button>`
    :''
  }

  <img
   src="${P.esc(source)}"
   alt="Tierfoto"
   style="
    display:block;
    max-width:100%;
    max-height:78vh;
    object-fit:contain;
    border-radius:14px;
    box-shadow:0 16px 48px rgba(0,0,0,.5);
   "
  >

  ${
   multiple
    ?`<button
      onclick="NGTProfile.nextPhoto()"
      aria-label="Nächstes Foto"
      style="
       position:absolute;
       right:12px;
       top:50%;
       transform:translateY(-50%);
       width:48px;
       height:64px;
       border-radius:16px;
       border:0;
       font-size:32px;
       background:rgba(255,255,255,.14);
       color:white;
       z-index:3;
      "
     >
      ›
     </button>`
    :''
  }

  <div
   style="
    margin-top:14px;
    max-width:680px;
    text-align:center;
    color:white;
   "
  >
   <b>${P.esc(photo.type||'Foto')}</b>
   ${photo.cover?' · Titelbild':''}

   <div style="opacity:.72;margin-top:4px;">
    ${P.esc(photo.date||'')}
    ${
     multiple
      ?' · '+
       (position+1)+
       ' / '+
       indexes.length
      :''
    }
   </div>

   ${
    photo.note
     ?`<div style="margin-top:8px;">
       ${P.esc(photo.note)}
      </div>`
     :''
   }
  </div>
 </div>`;

 document.body.style.overflow=
  'hidden';

 if(P.state.viewerKeyHandler){
  document.removeEventListener(
   'keydown',
   P.state.viewerKeyHandler
  );
 }

 P.state.viewerKeyHandler=
  function(event){
   if(event.key==='Escape'){
    closePhotoViewer();
   }

   if(event.key==='ArrowLeft'){
    previousPhoto();
   }

   if(event.key==='ArrowRight'){
    nextPhoto();
   }
  };

 document.addEventListener(
  'keydown',
  P.state.viewerKeyHandler
 );
}

function adjacentPhoto(direction){
 const animal=P.current();

 if(!animal)return;

 const indexes=
  usablePhotoIndexes(animal);

 if(!indexes.length)return;

 let position=
  indexes.indexOf(
   P.state.viewerIndex
  );

 if(position<0){
  position=0;
 }

 position=(
  position+
  direction+
  indexes.length
 )%indexes.length;

 P.state.viewerIndex=
  indexes[position];

 renderPhotoViewer();
}

function previousPhoto(){
 adjacentPhoto(-1);
}

function nextPhoto(){
 adjacentPhoto(1);
}

function closePhotoViewer(){
 const root=
  document.getElementById(
   'modalRoot'
  );

 if(root){
  root.innerHTML='';
 }

 document.body.style.overflow='';

 P.state.viewerIndex=-1;

 if(P.state.viewerKeyHandler){
  document.removeEventListener(
   'keydown',
   P.state.viewerKeyHandler
  );

  P.state.viewerKeyHandler=null;
 }
}

P.photos={
 photoSrc:photoSrc,
 isUsablePhoto:isUsablePhoto,
 usablePhotos:usablePhotos,
 profilePhoto:profilePhoto,
 hasLegacyPhotos:hasLegacyPhotos,
 photos:photos,
 setPhotoUploadStatus:
  setPhotoUploadStatus,
 addPhoto:addPhoto,
 migratePhotos:migratePhotos,
 setCover:setCover,
 deletePhoto:deletePhoto,
 openCoverPhoto:openCoverPhoto,
 openPhoto:openPhoto,
 usablePhotoIndexes:
  usablePhotoIndexes,
 renderPhotoViewer:
  renderPhotoViewer,
 previousPhoto:previousPhoto,
 nextPhoto:nextPhoto,
 closePhotoViewer:
  closePhotoViewer
};

})();