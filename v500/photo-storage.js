(function(){
'use strict';

const CONFIG={
  apiKey:"AIzaSyBebc9V-JIDQ7NVx3KkPItFeEjKVOmdxoo",
  authDomain:"terracontrol-4c211.firebaseapp.com",
  projectId:"terracontrol-4c211",
  storageBucket:"terracontrol-4c211.firebasestorage.app",
  messagingSenderId:"641374151767",
  appId:"1:641374151767:web:d4c9546e349aeb4d142f12"
};

const AUTH_TIMEOUT_MS=12000;
const IMAGE_TIMEOUT_MS=20000;
const UPLOAD_TIMEOUT_MS=60000;
const DOWNLOAD_URL_TIMEOUT_MS=20000;

let app=null;
let auth=null;
let storage=null;
let mods=null;
let migrating=false;

function withTimeout(promise,ms,message){
  let timer=null;

  return Promise.race([
    promise,
    new Promise(function(_,reject){
      timer=setTimeout(function(){
        reject(new Error(message||'Zeitüberschreitung.'));
      },ms);
    })
  ]).finally(function(){
    if(timer)clearTimeout(timer);
  });
}

function errorMessage(error){
  const code=String(error&&error.code||'');
  const message=String(error&&error.message||'');

  if(code.includes('storage/unauthorized')){
    return 'Firebase Storage verweigert den Zugriff. Bitte die Storage-Sicherheitsregeln prüfen.';
  }

  if(code.includes('storage/object-not-found')){
    return 'Das Foto wurde in Firebase Storage nicht gefunden.';
  }

  if(code.includes('storage/quota-exceeded')){
    return 'Das Speicherlimit von Firebase Storage wurde erreicht.';
  }

  if(code.includes('storage/unauthenticated')){
    return 'Die Firebase-Anmeldung ist abgelaufen. Bitte erneut anmelden.';
  }

  if(code.includes('storage/retry-limit-exceeded')){
    return 'Der Foto-Upload wurde nach mehreren Versuchen abgebrochen. Bitte Netzwerkverbindung prüfen.';
  }

  if(code.includes('storage/invalid-checksum')){
    return 'Das Foto wurde beim Upload beschädigt. Bitte erneut versuchen.';
  }

  if(code.includes('storage/canceled')){
    return 'Der Foto-Upload wurde abgebrochen.';
  }

  if(code.includes('auth/')){
    return 'Firebase-Anmeldung fehlgeschlagen. Bitte erneut anmelden.';
  }

  if(message)return message;

  return 'Unbekannter Fehler beim Foto-Speicher.';
}

async function loadSdk(){
  if(mods)return mods;

  try{
    const loaded=await withTimeout(
      Promise.all([
        import("https://www.gstatic.com/firebasejs/12.15.0/firebase-app.js"),
        import("https://www.gstatic.com/firebasejs/12.15.0/firebase-auth.js"),
        import("https://www.gstatic.com/firebasejs/12.15.0/firebase-storage.js")
      ]),
      20000,
      'Firebase-Module konnten nicht geladen werden. Bitte Internetverbindung prüfen.'
    );

    mods={
      appMod:loaded[0],
      authMod:loaded[1],
      storageMod:loaded[2]
    };

    return mods;

  }catch(error){
    mods=null;
    throw new Error(errorMessage(error));
  }
}

async function init(){
  if(app&&auth&&storage)return;

  const m=await loadSdk();

  app=m.appMod.getApps().length
    ? m.appMod.getApps()[0]
    : m.appMod.initializeApp(CONFIG);

  auth=m.authMod.getAuth(app);
  storage=m.storageMod.getStorage(app);
}

function currentUser(){
  return auth&&auth.currentUser?auth.currentUser:null;
}

async function requireUser(){
  await init();

  const existing=currentUser();
  if(existing)return existing;

  return withTimeout(
    new Promise(function(resolve,reject){
      let finished=false;
      let unsubscribe=function(){};

      try{
        unsubscribe=mods.authMod.onAuthStateChanged(
          auth,
          function(user){
            if(finished)return;

            if(user){
              finished=true;
              unsubscribe();
              resolve(user);
            }
          },
          function(error){
            if(finished)return;

            finished=true;
            unsubscribe();
            reject(error);
          }
        );
      }catch(error){
        finished=true;
        reject(error);
      }
    }),
    AUTH_TIMEOUT_MS,
    'Firebase-Anmeldung wurde nicht erkannt. Bitte auf der Startseite erneut anmelden.'
  );
}

function safe(value){
  return String(value||'x')
    .replace(/[^a-zA-Z0-9_-]/g,'_')
    .replace(/_+/g,'_')
    .slice(0,80)||'x';
}

function photoId(){
  return 'photo_'+Date.now()+'_'+Math.random().toString(36).slice(2,10);
}

function canvasBlob(canvas,quality){
  return new Promise(function(resolve,reject){
    canvas.toBlob(function(blob){
      if(blob){
        resolve(blob);
      }else{
        reject(new Error('Das Foto konnte nicht in JPEG umgewandelt werden.'));
      }
    },'image/jpeg',quality);
  });
}

function loadImageFromSource(source){
  return withTimeout(
    new Promise(function(resolve,reject){
      const img=new Image();

      img.onload=function(){
        resolve(img);
      };

      img.onerror=function(){
        reject(new Error('Das ausgewählte Foto konnte nicht gelesen werden.'));
      };

      img.src=source;
    }),
    IMAGE_TIMEOUT_MS,
    'Das Einlesen des Fotos hat zu lange gedauert.'
  );
}

function fileToDataUrl(file){
  return withTimeout(
    new Promise(function(resolve,reject){
      const reader=new FileReader();

      reader.onload=function(){
        resolve(reader.result);
      };

      reader.onerror=function(){
        reject(new Error('Die Fotodatei konnte nicht gelesen werden.'));
      };

      reader.onabort=function(){
        reject(new Error('Das Einlesen der Fotodatei wurde abgebrochen.'));
      };

      reader.readAsDataURL(file);
    }),
    IMAGE_TIMEOUT_MS,
    'Das Einlesen der Fotodatei hat zu lange gedauert.'
  );
}

async function loadImageFromFile(file){
  if(!file){
    throw new Error('Keine Fotodatei ausgewählt.');
  }

  if(file.type&& !String(file.type).startsWith('image/')){
    throw new Error('Die ausgewählte Datei ist kein unterstütztes Bild.');
  }

  const source=await fileToDataUrl(file);
  return loadImageFromSource(source);
}

async function loadImageFromDataUrl(dataUrl){
  if(!String(dataUrl||'').startsWith('data:image')){
    throw new Error('Ungültiges eingebettetes Foto.');
  }

  return loadImageFromSource(dataUrl);
}

async function resizeImage(img,maxSize,quality){
  let width=Number(img.naturalWidth||img.width||0);
  let height=Number(img.naturalHeight||img.height||0);

  if(!width||!height){
    throw new Error('Das Foto besitzt keine gültigen Bildabmessungen.');
  }

  if(width>height&&width>maxSize){
    height=Math.round(height*maxSize/width);
    width=maxSize;
  }else if(height>=width&&height>maxSize){
    width=Math.round(width*maxSize/height);
    height=maxSize;
  }

  const canvas=document.createElement('canvas');
  canvas.width=width;
  canvas.height=height;

  const context=canvas.getContext('2d');

  if(!context){
    throw new Error('Die Bildverarbeitung wird von diesem Browser nicht unterstützt.');
  }

  context.drawImage(img,0,0,width,height);

  return withTimeout(
    canvasBlob(canvas,quality),
    IMAGE_TIMEOUT_MS,
    'Die Verarbeitung des Fotos hat zu lange gedauert.'
  );
}

async function createPhotoBlobsFromFile(file){
  const image=await loadImageFromFile(file);

  const fullBlob=await resizeImage(image,1400,0.82);
  const thumbBlob=await resizeImage(image,360,0.72);

  return {fullBlob,thumbBlob};
}

async function createPhotoBlobsFromDataUrl(dataUrl){
  const image=await loadImageFromDataUrl(dataUrl);

  const fullBlob=await resizeImage(image,1400,0.82);
  const thumbBlob=await resizeImage(image,360,0.72);

  return {fullBlob,thumbBlob};
}

function basePath(animal,id,user){
  const animalKey=safe(
    animal&&(
      animal.uuid||
      animal.uid||
      animal.publicId||
      animal.displayId
    )||'animal'
  );

  return [
    'users',
    safe(user.uid),
    'animals',
    animalKey,
    'photos',
    safe(id)
  ].join('/');
}

async function uploadBlob(reference,blob){
  return withTimeout(
    mods.storageMod.uploadBytes(reference,blob,{
      contentType:'image/jpeg',
      cacheControl:'public,max-age=31536000'
    }),
    UPLOAD_TIMEOUT_MS,
    'Der Upload zu Firebase Storage hat zu lange gedauert. Bitte Storage-Konfiguration und Netzwerk prüfen.'
  );
}

async function downloadUrl(reference){
  return withTimeout(
    mods.storageMod.getDownloadURL(reference),
    DOWNLOAD_URL_TIMEOUT_MS,
    'Die Foto-URL konnte nicht von Firebase Storage geladen werden.'
  );
}

async function deleteUploadedPath(path){
  if(!path)return;

  try{
    await withTimeout(
      mods.storageMod.deleteObject(mods.storageMod.ref(storage,path)),
      20000,
      'Temporäre Fotodatei konnte nicht entfernt werden.'
    );
  }catch(error){
    console.warn('Temporäre Fotodatei konnte nicht entfernt werden:',path,error);
  }
}

async function uploadBlobs(animal,id,fullBlob,thumbBlob,meta){
  const user=await requireUser();
  const root=basePath(animal||{},id,user);

  const fullPath=root+'/full.jpg';
  const thumbPath=root+'/thumb.jpg';

  const fullRef=mods.storageMod.ref(storage,fullPath);
  const thumbRef=mods.storageMod.ref(storage,thumbPath);

  let fullUploaded=false;
  let thumbUploaded=false;

  try{
    await uploadBlob(fullRef,fullBlob);
    fullUploaded=true;

    await uploadBlob(thumbRef,thumbBlob);
    thumbUploaded=true;

    const urls=await Promise.all([
      downloadUrl(fullRef),
      downloadUrl(thumbRef)
    ]);

    return {
      id:id,
      date:meta&&meta.date||NGT500.today(),
      type:meta&&meta.type||'Sonstige',
      note:meta&&meta.note||'',
      cover:!!(meta&&meta.cover),
      storagePath:fullPath,
      thumbPath:thumbPath,
      url:urls[0],
      thumbUrl:urls[1]
    };

  }catch(error){
    if(fullUploaded)await deleteUploadedPath(fullPath);
    if(thumbUploaded)await deleteUploadedPath(thumbPath);

    throw new Error(errorMessage(error));
  }
}

async function upload(file,animal,meta){
  try{
    await requireUser();

    const id=meta&&meta.id||photoId();
    const blobs=await createPhotoBlobsFromFile(file);

    return await uploadBlobs(
      animal,
      id,
      blobs.fullBlob,
      blobs.thumbBlob,
      meta
    );

  }catch(error){
    throw new Error(errorMessage(error));
  }
}

async function uploadDataUrl(dataUrl,animal,meta){
  try{
    await requireUser();

    const id=meta&&meta.id||photoId();
    const blobs=await createPhotoBlobsFromDataUrl(dataUrl);

    return await uploadBlobs(
      animal,
      id,
      blobs.fullBlob,
      blobs.thumbBlob,
      meta
    );

  }catch(error){
    throw new Error(errorMessage(error));
  }
}

async function remove(photo){
  if(!photo)return false;

  try{
    await requireUser();

    const paths=[
      photo.storagePath,
      photo.thumbPath
    ].filter(Boolean);

    for(const path of paths){
      try{
        await withTimeout(
          mods.storageMod.deleteObject(
            mods.storageMod.ref(storage,path)
          ),
          20000,
          'Das Löschen des Fotos hat zu lange gedauert.'
        );
      }catch(error){
        const code=String(error&&error.code||'');

        if(!code.includes('storage/object-not-found')){
          throw error;
        }
      }
    }

    return true;

  }catch(error){
    throw new Error(errorMessage(error));
  }
}

function src(photo,preferThumb){
  return AnimalEngine.photoSource(
    photo,
    preferThumb
  );
}

function isLegacyPhoto(photo){
  return !!(
    photo&&
    photo.data&&
    String(photo.data).startsWith('data:image')&&
    !photo.storagePath&&
    !photo.url
  );
}

function hasLegacyPhotos(animal){
  return !!(
    animal&&
    Array.isArray(animal.photos)&&
    animal.photos.some(isLegacyPhoto)
  );
}

function countLegacyPhotos(animal){
  if(!animal||!Array.isArray(animal.photos))return 0;
  return animal.photos.filter(isLegacyPhoto).length;
}

async function migrateAnimal(animal,onProgress){
  await requireUser();

  if(!animal||!Array.isArray(animal.photos)){
    return {changed:false,count:0,total:0};
  }

  const total=countLegacyPhotos(animal);

  if(!total){
    return {changed:false,count:0,total:0};
  }

  let changed=false;
  let count=0;
  const photos=animal.photos.map(function(photo){
    return (
      photo&&
      typeof photo==='object'
        ?{...photo}
        :photo
    );
  });

  for(let index=0;index<photos.length;index++){
    const oldPhoto=photos[index];

    if(!isLegacyPhoto(oldPhoto))continue;

    const migrated=await uploadDataUrl(oldPhoto.data,animal,{
      id:oldPhoto.id||photoId(),
      date:oldPhoto.date||NGT500.today(),
      type:oldPhoto.type||'Sonstige',
      note:oldPhoto.note||'',
      cover:!!oldPhoto.cover
    });

    photos[index]=migrated;
    changed=true;
    count++;

    if(onProgress){
      onProgress({
        animal:animal,
        index:index,
        count:count,
        total:total
      });
    }
  }

  return {
    changed:changed,
    count:count,
    total:total,
    photos:photos
  };
}

async function migrateAll(onProgress){
  if(migrating){
    throw new Error('Eine Foto-Migration läuft bereits. Bitte warten, bis sie beendet ist.');
  }

  migrating=true;

  try{
    await requireUser();

    if(!window.NGTStore||!NGTStore.allAnimals){
      throw new Error('Tierbestand konnte für die Foto-Migration nicht geladen werden.');
    }

    const rows=NGTStore.allAnimals();
    const total=rows.reduce(function(sum,row){
      return sum+countLegacyPhotos(row.a);
    },0);

    if(!total){
      return {changed:false,count:0,total:0};
    }

    let changed=false;
    let count=0;

    for(const row of rows){
      const animal=row.a;

      if(!hasLegacyPhotos(animal))continue;

      const result=await migrateAnimal(animal,function(info){
        const globalCount=count+info.count;

        if(onProgress){
          onProgress({
            row:row,
            animal:animal,
            index:info.index,
            count:globalCount,
            total:total
          });
        }
      });

      if(result.changed){
        const ref=NGTStore.animalId(animal)
          ?{animalId:NGTStore.animalId(animal)}
          :{t:row.t,i:row.i};

        if(
          !NGTStore.replaceAnimalPhotos(
            ref,
            result.photos
          )
        ){
          throw new Error(
            'Migrierte Fotos konnten dem Tier nicht zugeordnet werden.'
          );
        }

        changed=true;
        count+=result.count;
      }
    }

    return {
      changed:changed,
      count:count,
      total:total
    };

  }catch(error){
    throw new Error(errorMessage(error));

  }finally{
    migrating=false;
  }
}

function isMigrating(){
  return migrating;
}

window.NGTPhotoStorage={
  init:init,
  upload:upload,
  uploadDataUrl:uploadDataUrl,
  remove:remove,
  src:src,
  hasLegacyPhotos:hasLegacyPhotos,
  countLegacyPhotos:countLegacyPhotos,
  migrateAnimal:migrateAnimal,
  migrateAll:migrateAll,
  isMigrating:isMigrating
};

})();
