// v500/photo-storage.js
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

let app=null;
let auth=null;
let storage=null;
let mods=null;

async function loadSdk(){
  if(mods)return mods;

  const appMod=await import("https://www.gstatic.com/firebasejs/12.15.0/firebase-app.js");
  const authMod=await import("https://www.gstatic.com/firebasejs/12.15.0/firebase-auth.js");
  const storageMod=await import("https://www.gstatic.com/firebasejs/12.15.0/firebase-storage.js");

  mods={appMod,authMod,storageMod};
  return mods;
}

async function init(){
  if(app)return;

  const m=await loadSdk();
  app=m.appMod.getApps().length?m.appMod.getApps()[0]:m.appMod.initializeApp(CONFIG);
  auth=m.authMod.getAuth(app);
  storage=m.storageMod.getStorage(app);
}

function user(){
  return auth&&auth.currentUser?auth.currentUser:null;
}

function safe(v){
  return String(v||'x')
    .replace(/[^a-zA-Z0-9_-]/g,'_')
    .replace(/_+/g,'_')
    .slice(0,80)||'x';
}

function photoId(){
  return 'photo_'+Date.now()+'_'+Math.random().toString(36).slice(2,8);
}

function canvasBlob(canvas,quality){
  return new Promise(function(resolve){
    canvas.toBlob(function(blob){
      resolve(blob);
    },'image/jpeg',quality);
  });
}

function loadImage(file){
  return new Promise(function(resolve,reject){
    const reader=new FileReader();
    const img=new Image();

    reader.onerror=reject;
    img.onerror=reject;

    reader.onload=function(){
      img.onload=function(){resolve(img)};
      img.src=reader.result;
    };

    reader.readAsDataURL(file);
  });
}

async function resize(file,max,quality){
  const img=await loadImage(file);
  let w=img.width;
  let h=img.height;

  if(w>h&&w>max){
    h=Math.round(h*max/w);
    w=max;
  }else if(h>=w&&h>max){
    w=Math.round(w*max/h);
    h=max;
  }

  const canvas=document.createElement('canvas');
  canvas.width=w;
  canvas.height=h;

  const ctx=canvas.getContext('2d');
  ctx.drawImage(img,0,0,w,h);

  return canvasBlob(canvas,quality);
}

function basePath(animal,id){
  const u=user();
  const animalKey=safe(
    animal.uuid||
    animal.uid||
    animal.publicId||
    animal.displayId||
    'animal'
  );

  return 'users/'+u.uid+'/animals/'+animalKey+'/photos/'+safe(id);
}

async function upload(file,animal,meta){
  await init();

  const u=user();
  if(!u){
    throw new Error('Firebase-Anmeldung erforderlich, um Fotos dauerhaft zu speichern.');
  }

  const id=(meta&&meta.id)||photoId();
  const root=basePath(animal||{},id);

  const fullBlob=await resize(file,1400,0.82);
  const thumbBlob=await resize(file,360,0.72);

  const fullPath=root+'/full.jpg';
  const thumbPath=root+'/thumb.jpg';

  const fullRef=mods.storageMod.ref(storage,fullPath);
  const thumbRef=mods.storageMod.ref(storage,thumbPath);

  await mods.storageMod.uploadBytes(fullRef,fullBlob,{contentType:'image/jpeg'});
  await mods.storageMod.uploadBytes(thumbRef,thumbBlob,{contentType:'image/jpeg'});

  const url=await mods.storageMod.getDownloadURL(fullRef);
  const thumbUrl=await mods.storageMod.getDownloadURL(thumbRef);

  return {
    id:id,
    date:(meta&&meta.date)||NGT500.today(),
    type:(meta&&meta.type)||'Sonstige',
    note:(meta&&meta.note)||'',
    cover:!!(meta&&meta.cover),
    storagePath:fullPath,
    thumbPath:thumbPath,
    url:url,
    thumbUrl:thumbUrl
  };
}

async function remove(photo){
  await init();

  const u=user();
  if(!u||!photo)return false;

  const paths=[photo.storagePath,photo.thumbPath].filter(Boolean);

  for(const path of paths){
    try{
      await mods.storageMod.deleteObject(mods.storageMod.ref(storage,path));
    }catch(e){
      console.warn('Foto konnte nicht aus Storage gelöscht werden:',path,e);
    }
  }

  return true;
}

function src(photo,preferThumb){
  if(!photo)return '';
  if(preferThumb&&(photo.thumbUrl||photo.thumbnailUrl))return photo.thumbUrl||photo.thumbnailUrl;
  return photo.url||photo.thumbUrl||photo.thumbnailUrl||photo.data||'';
}

window.NGTPhotoStorage={
  init,
  upload,
  remove,
  src
};

})();