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
let migrating=false;

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

async function requireUser(){
  await init();

  const now=user();
  if(now)return now;

  return new Promise(function(resolve,reject){
    let done=false;

    const timer=setTimeout(function(){
      if(done)return;
      done=true;
      try{unsub()}catch(e){}
      reject(new Error('Firebase-Anmeldung erforderlich. Bitte auf der Startseite anmelden und danach erneut versuchen.'));
    },8000);

    const unsub=mods.authMod.onAuthStateChanged(auth,function(u){
      if(done)return;

      if(u){
        done=true;
        clearTimeout(timer);
        try{unsub()}catch(e){}
        resolve(u);
      }
    });
  });
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
  return new Promise(function(resolve,reject){
    canvas.toBlob(function(blob){
      if(blob)resolve(blob);
      else reject(new Error('Foto konnte nicht verarbeitet werden.'));
    },'image/jpeg',quality);
  });
}

function loadImageFromFile(file){
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

function loadImageFromDataUrl(dataUrl){
  return new Promise(function(resolve,reject){
    const img=new Image();
    img.onerror=reject;
    img.onload=function(){resolve(img)};
    img.src=dataUrl;
  });
}

async function resizeImage(img,max,quality){
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

async function resize(file,max,quality){
  const img=await loadImageFromFile(file);
  return resizeImage(img,max,quality);
}

async function resizeDataUrl(dataUrl,max,quality){
  const img=await loadImageFromDataUrl(dataUrl);
  return resizeImage(img,max,quality);
}

function basePath(animal,id,u){
  const animalKey=safe(
    animal.uuid||
    animal.uid||
    animal.publicId||
    animal.displayId||
    'animal'
  );

  return 'users/'+u.uid+'/animals/'+animalKey+'/photos/'+safe(id);
}

async function uploadBlobs(animal,id,fullBlob,thumbBlob,meta){
  const u=await requireUser();

  const root=basePath(animal||{},id,u);
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

async function upload(file,animal,meta){
  await requireUser();

  const id=(meta&&meta.id)||photoId();
  const fullBlob=await resize(file,1400,0.82);
  const thumbBlob=await resize(file,360,0.72);

  return uploadBlobs(animal,id,fullBlob,thumbBlob,meta);
}

async function uploadDataUrl(dataUrl,animal,meta){
  await requireUser();

  if(!String(dataUrl||'').startsWith('data:image')){
    throw new Error('Ungültiges Legacy-Foto.');
  }

  const id=(meta&&meta.id)||photoId();
  const fullBlob=await resizeDataUrl(dataUrl,1400,0.82);
  const thumbBlob=await resizeDataUrl(dataUrl,360,0.72);

  return uploadBlobs(animal,id,fullBlob,thumbBlob,meta);
}

async function remove(photo){
  const u=await requireUser();
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

function hasLegacyPhotos(animal){
  return !!(animal&&Array.isArray(animal.photos)&&animal.photos.some(function(p){
    return p&&p.data&&String(p.data).startsWith('data:image')&&!p.storagePath&&!p.url;
  }));
}

async function migrateAnimal(animal,onProgress){
  await requireUser();

  if(!animal||!Array.isArray(animal.photos))return {changed:false,count:0};

  let changed=false;
  let count=0;

  for(let i=0;i<animal.photos.length;i++){
    const old=animal.photos[i];

    if(!old||!old.data||!String(old.data).startsWith('data:image')||old.storagePath||old.url){
      continue;
    }

    const migrated=await uploadDataUrl(old.data,animal,{
      id:old.id||photoId(),
      date:old.date||NGT500.today(),
      type:old.type||'Sonstige',
      note:old.note||'',
      cover:!!old.cover
    });

    animal.photos[i]=migrated;
    changed=true;
    count++;

    if(onProgress){
      try{onProgress({animal:animal,index:i,count:count})}catch(e){}
    }
  }

  return {changed:changed,count:count};
}

async function migrateAll(onProgress){
  if(migrating)return {changed:false,count:0,running:true};
  migrating=true;

  try{
    if(!window.NGTStore||!NGTStore.allAnimals)return {changed:false,count:0};

    const rows=NGTStore.allAnimals();
    let changed=false;
    let count=0;

    for(const row of rows){
      const a=row.a;
      if(!hasLegacyPhotos(a))continue;

      const res=await migrateAnimal(a,function(info){
        if(onProgress){
          try{onProgress(Object.assign({row:row},info))}catch(e){}
        }
      });

      if(res.changed){
        changed=true;
        count+=res.count;
        NGTStore.save();
      }
    }

    return {changed:changed,count:count};

  }finally{
    migrating=false;
  }
}

window.NGTPhotoStorage={
  init,
  upload,
  uploadDataUrl,
  remove,
  src,
  hasLegacyPhotos,
  migrateAnimal,
  migrateAll
};

})();