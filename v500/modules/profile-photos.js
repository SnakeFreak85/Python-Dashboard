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
   ?`<div class="tc2SubCard warn">
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

 <div class="tc2SubCard">
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

   return `<div class="tc2SubCard">
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
  NGT500.toast(
   'Foto-Speicher ist noch nicht geladen.',
   'warn'
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

  if(
   !NGTStore.addAnimalPhoto(
    P.getContext(),
    saved
   )
  ){
   throw new Error(
    'Foto konnte dem Tier nicht zugeordnet werden.'
   );
  }

  P.setTab('photos');

 }catch(error){
  console.error(error);

  setPhotoUploadStatus(
   error&&error.message
    ?error.message
    :'Foto konnte nicht gespeichert werden.',
   true
  );

  NGT500.toast(
   error&&error.message
    ?error.message
    :'Foto konnte nicht dauerhaft gespeichert werden.',
   'danger'
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
  NGT500.toast(
   'Foto-Migration ist noch nicht geladen.',
   'warn'
  );

  return;
 }

 const animal=P.current();

 if(!animal){
  NGT500.toast(
   'Das Tier wurde nicht gefunden.',
   'danger'
  );

  return;
 }

 P.ensure(animal);

 if(!hasLegacyPhotos(animal)){
  NGT500.toast(
   'Keine alten Fotos zum Migrieren gefunden.',
   'ok'
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
   const migratedPhotos=
    result.photos||[];
   const selected=
    profilePhoto({
     photos:migratedPhotos
    });

   if(
    selected&&
    !migratedPhotos.some(
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

   if(
    !NGTStore.replaceAnimalPhotos(
     P.getContext(),
     migratedPhotos
    )
   ){
    throw new Error(
     'Migrierte Fotos konnten dem Tier nicht zugeordnet werden.'
    );
   }
  }

  NGT500.toast(
   (result.count||0)+
   ' Foto(s) migriert.',
   'ok'
  );

  P.setTab('photos');

 }catch(error){
  console.error(error);

  NGT500.toast(
   error&&error.message
    ?error.message
    :'Fotos konnten nicht migriert werden.',
   'danger'
  );
 }
}

function setCover(index){
 const animal=P.current();

 if(!animal){
  NGT500.toast(
   'Das Tier wurde nicht gefunden.',
   'danger'
  );

  return;
 }

 const selected=
  (animal.photos||[])[index];

 if(
  !selected||
  !isUsablePhoto(selected)
 ){
  NGT500.toast(
   'Dieses Foto kann nicht als Titelbild verwendet werden.',
   'warn'
  );

  return;
 }

 if(
  !NGTStore.setAnimalCoverPhoto(
   P.getContext(),
   index
  )
 ){
  NGT500.toast(
   'Titelbild konnte nicht gespeichert werden.',
   'danger'
  );

  return;
 }

 P.setTab('photos');
}

async function deletePhoto(index){
 if(!await NGT500.confirmAction(
  'Foto löschen?',
  {
   title:'Foto löschen',
   confirmText:'Foto löschen',
   danger:true
  }
 )){
  return;
 }

 const animal=P.current();

 if(!animal){
  NGT500.toast(
   'Das Tier wurde nicht gefunden.',
   'danger'
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

  if(
   !NGTStore.deleteAnimalPhoto(
    P.getContext(),
    index
   )
  ){
   throw new Error(
    'Foto konnte nicht aus dem Tierprofil entfernt werden.'
   );
  }

  closePhotoViewer();
  P.setTab('photos');

 }catch(error){
  console.error(error);

  NGT500.toast(
   error&&error.message
    ?error.message
    :'Foto konnte nicht gelöscht werden.',
   'danger'
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
  NGT500.toast(
   'Das Tier wurde nicht gefunden.',
   'danger'
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
  NGT500.toast(
   'Dieses Foto kann nicht geöffnet werden.',
   'warn'
  );

  return;
 }

 if(P.state.viewerIndex<0){
  P.state.viewerPreviousFocus=document.activeElement;
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
  class="tc2PhotoViewer"
  role="dialog"
  aria-modal="true"
  aria-label="Fotoansicht"
  tabindex="-1"
  onclick="if(event.target===this)NGTProfile.closePhotoViewer()"
 >
  <button
   class="tc2PhotoViewerClose"
   onclick="NGTProfile.closePhotoViewer()"
   aria-label="Schließen"
  >
   ×
  </button>

  ${
   multiple
    ?`<button
      class="tc2PhotoViewerNav previous"
      onclick="NGTProfile.previousPhoto()"
      aria-label="Vorheriges Foto"
     >
      ‹
     </button>`
    :''
  }

  <img
   class="tc2PhotoViewerImage"
   src="${P.esc(source)}"
   alt="Tierfoto"
  >

  ${
   multiple
    ?`<button
      class="tc2PhotoViewerNav next"
      onclick="NGTProfile.nextPhoto()"
      aria-label="Nächstes Foto"
     >
      ›
     </button>`
    :''
  }

  <div
   class="tc2PhotoViewerCaption"
  >
   <b>${P.esc(photo.type||'Foto')}</b>
   ${photo.cover?' · Titelbild':''}

   <div class="tc2PhotoViewerMeta">
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
     ?`<div class="tc2PhotoViewerNote">
       ${P.esc(photo.note)}
      </div>`
     :''
   }
  </div>
 </div>`;

 document.body.classList.add('tc2ModalOpen');

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

   if(event.key==='Tab'){
    const controls=Array.from(
     root.querySelectorAll('button')
    ).filter(function(button){
     return button.offsetParent!==null;
    });

    if(!controls.length){
     event.preventDefault();
     root.firstElementChild?.focus();
     return;
    }

    const first=controls[0];
    const last=controls[controls.length-1];

    if(event.shiftKey&&document.activeElement===first){
     event.preventDefault();
     last.focus();
    }else if(!event.shiftKey&&document.activeElement===last){
     event.preventDefault();
     first.focus();
    }
   }
  };

 document.addEventListener(
  'keydown',
  P.state.viewerKeyHandler
 );

 requestAnimationFrame(function(){
  const close=root.querySelector(
   '.tc2PhotoViewerClose'
  );

  (close||root.firstElementChild)?.focus();
 });
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

 document.body.classList.remove('tc2ModalOpen');

 P.state.viewerIndex=-1;

 if(P.state.viewerKeyHandler){
  document.removeEventListener(
   'keydown',
   P.state.viewerKeyHandler
  );

  P.state.viewerKeyHandler=null;
 }

 const previous=P.state.viewerPreviousFocus;
 P.state.viewerPreviousFocus=null;

 if(previous&&typeof previous.focus==='function'){
  requestAnimationFrame(function(){
   if(document.contains(previous)){
    previous.focus();
   }
  });
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
