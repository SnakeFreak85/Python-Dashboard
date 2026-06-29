(function(){
  'use strict';

  const TYPES=['koenig','boas','geckos','spinnen'];
  const MAX_SIZE=900;
  const JPEG_QUALITY=0.72;

  function store(){return window.NGTStore||null;}
  function getDb(){const s=store(); const data=s&&typeof s.getDb==='function'?s.getDb():(window.db||{koenig:[],boas:[],geckos:[],spinnen:[],clutches:[],sales:[],archive:[]}); TYPES.forEach(t=>{if(!Array.isArray(data[t]))data[t]=[];}); return data;}
  function saveDb(data){
    try{
      const s=store();
      if(s&&typeof s.save==='function') s.save(data||getDb());
      else localStorage.setItem('spd_v53',JSON.stringify(data||getDb()));
      return true;
    }catch(error){
      alert('Foto konnte nicht gespeichert werden. Der Handyspeicher/Browser-Speicher ist voll. Bitte ein kleineres Foto wählen oder alte Fotos entfernen.');
      return false;
    }
  }
  function makeUuid(){return (window.crypto&&crypto.randomUUID)?crypto.randomUUID():('ngt-'+Date.now().toString(36)+'-'+Math.random().toString(36).slice(2,10));}
  function ensureAnimalId(animal,type,index){if(!animal)return; animal.uuid=animal.uuid||animal.uid||makeUuid(); animal.uid=animal.uid||animal.uuid; animal.displayId=animal.displayId||(({koenig:'KP',boas:'BOA',geckos:'LG',spinnen:'VS'}[type]||'ID')+'-'+String(index+1).padStart(3,'0')); animal.type=animal.type||type;}
  function loadImage(file){return new Promise((resolve,reject)=>{const reader=new FileReader();reader.onload=event=>{const img=new Image();img.onload=()=>resolve(img);img.onerror=reject;img.src=event.target.result;};reader.onerror=reject;reader.readAsDataURL(file);});}
  function resizeImage(img){const scale=Math.min(1,MAX_SIZE/Math.max(img.width,img.height));const width=Math.max(1,Math.round(img.width*scale));const height=Math.max(1,Math.round(img.height*scale));const canvas=document.createElement('canvas');canvas.width=width;canvas.height=height;const ctx=canvas.getContext('2d');ctx.drawImage(img,0,0,width,height);return canvas.toDataURL('image/jpeg',JPEG_QUALITY);}
  async function uploadPhoto(type,index,input){
    try{
      const file=input&&input.files&&input.files[0]; if(!file)return;
      if(!file.type||!file.type.startsWith('image/')){alert('Bitte eine Bilddatei auswählen.');return;}
      const data=getDb(); const animal=data[type]&&data[type][index];
      if(!animal){alert('Tier wurde nicht gefunden. Bitte Seite neu laden.');return;}
      ensureAnimalId(animal,type,index);
      const image=await loadImage(file); const dataUrl=resizeImage(image);
      animal.photo=dataUrl; animal.photos=Array.isArray(animal.photos)?animal.photos:[]; animal.photos[0]=dataUrl; animal.photoUpdatedAt=new Date().toISOString(); animal.updatedAt=new Date().toISOString();
      if(saveDb(data)&&typeof window.render==='function')window.render();
    }catch(error){alert('Foto konnte nicht verarbeitet werden. Bitte ein anderes oder kleineres Foto wählen.');}
    finally{if(input)input.value='';}
  }
  function addPhotoButtons(){TYPES.forEach(type=>{const section=document.getElementById(type);if(!section)return;section.querySelectorAll('.animal').forEach((card,index)=>{if(card.querySelector('[data-ngt-photo]'))return;const input=document.createElement('input');input.type='file';input.accept='image/*';input.setAttribute('data-ngt-photo','true');input.onchange=function(){uploadPhoto(type,index,this);};card.appendChild(input);});});}
  function patchRender(){if(window.__ngtPhotoRenderPatched||typeof window.render!=='function')return;window.__ngtPhotoRenderPatched=true;const original=window.render;window.render=function(){const result=original.apply(this,arguments);addPhotoButtons();return result;};}
  function init(){window.uploadPhoto=uploadPhoto;patchRender();addPhotoButtons();setTimeout(addPhotoButtons,300);}
  document.readyState==='loading'?document.addEventListener('DOMContentLoaded',init):init();
})();
