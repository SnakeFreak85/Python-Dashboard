(function(){
  'use strict';

  const KEY='spd_v53';
  const BACKUP='spd_v53_backup';
  const SNAPSHOT='spd_v53_last_good';
  const TYPES=['koenig','boas','geckos','spinnen'];

  function emptyDb(){return {koenig:[],boas:[],geckos:[],spinnen:[],clutches:[],sales:[],archive:[],foodInventory:[]};}
  function parse(v){try{return v?JSON.parse(v):null;}catch(e){return null;}}
  function live(){try{if(typeof db!=='undefined'&&db)return db;}catch(e){} return window.db||emptyDb();}
  function setLive(data){data=normalize(data);try{if(typeof db!=='undefined')db=data;}catch(e){} window.db=data;return data;}
  function uid(){return (window.crypto&&crypto.randomUUID)?crypto.randomUUID():('ngt-'+Date.now().toString(36)+'-'+Math.random().toString(36).slice(2,10));}

  function normalizeAnimal(a,type,index){
    if(!a||typeof a!=='object')return a;
    const p={koenig:'KP',boas:'BOA',geckos:'LG',spinnen:'VS'}[type]||'ID';
    a.uuid=a.uuid||a.uid||uid();
    a.uid=a.uid||a.uuid;
    a.displayId=a.displayId||(p+'-'+String(index+1).padStart(3,'0'));
    a.type=a.type||type;
    a.feeds=Array.isArray(a.feeds)?a.feeds:[];
    a.sheds=Array.isArray(a.sheds)?a.sheds:[];
    a.weights=Array.isArray(a.weights)?a.weights:[];
    a.updatedAt=a.updatedAt||new Date().toISOString();
    return a;
  }

  function normalize(data){
    data=(data&&typeof data==='object')?data:emptyDb();
    TYPES.forEach(t=>{if(!Array.isArray(data[t]))data[t]=[];});
    ['clutches','sales','archive','foodInventory'].forEach(k=>{if(!Array.isArray(data[k]))data[k]=[];});
    TYPES.forEach(t=>data[t].forEach((a,i)=>normalizeAnimal(a,t,i)));
    data.__ngtSchema=data.__ngtSchema||2;
    data.__updatedAt=data.__updatedAt||new Date().toISOString();
    return data;
  }

  function count(data){data=data||live();return TYPES.reduce((s,t)=>s+(Array.isArray(data[t])?data[t].length:0),0);}
  function score(data){data=data||live();return count(data)*1000+(data.clutches||[]).length*100+(data.sales||[]).length*50+(data.archive||[]).length*25+(data.foodInventory||[]).filter(x=>Number(x.qty||0)>0).length;}

  function best(){
    const list=[live(),parse(localStorage.getItem(KEY)),parse(localStorage.getItem(BACKUP)),parse(localStorage.getItem(SNAPSHOT))].filter(Boolean).map(normalize);
    return list.length?list.sort((a,b)=>score(b)-score(a))[0]:emptyDb();
  }

  function persist(data){
    data=normalize(data||live());
    data.__updatedAt=new Date().toISOString();
    const text=JSON.stringify(data);
    localStorage.setItem(KEY,text);
    localStorage.setItem(BACKUP,text);
    if(score(data)>0)localStorage.setItem(SNAPSHOT,text);
    setLive(data);
    return data;
  }

  function restore(){
    const current=normalize(live());
    const candidate=best();
    return persist(score(candidate)>=score(current)?candidate:current);
  }

  function getAnimalById(id){
    const key=String(id||'').split('|')[0].trim().toLowerCase();
    if(!key)return null;
    const data=normalize(live());
    for(const t of TYPES){
      const arr=data[t]||[];
      for(let i=0;i<arr.length;i++){
        const a=normalizeAnimal(arr[i],t,i);
        const ids=[a.uuid,a.uid,a.displayId].map(x=>String(x||'').toLowerCase());
        if(ids.includes(key))return {type:t,index:i,animal:a};
      }
    }
    return null;
  }

  function patchSave(){
    if(window.__ngtStoreSavePatched||typeof window.save!=='function')return;
    window.__ngtStoreSavePatched=true;
    const old=window.save;
    window.save=function(){persist(live());const r=old.apply(this,arguments);persist(live());return r;};
  }

  function patchAddAnimal(){
    if(window.__ngtStoreAddPatched||typeof window.addAnimal!=='function')return;
    window.__ngtStoreAddPatched=true;
    const old=window.addAnimal;
    window.addAnimal=function(type){restore();const r=old.apply(this,arguments);const data=normalize(live());const arr=data[type]||[];if(arr.length)normalizeAnimal(arr[arr.length-1],type,arr.length-1);persist(data);if(typeof window.render==='function')window.render();return r;};
  }

  function expose(){window.NGTStore={getDb:live,setDb:setLive,save:persist,restore,normalize,count,score,getAnimalById};}
  function init(){restore();expose();patchSave();patchAddAnimal();}
  document.readyState==='loading'?document.addEventListener('DOMContentLoaded',init):init();
})();
