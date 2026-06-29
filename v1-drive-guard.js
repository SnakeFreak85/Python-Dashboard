(function(){
  'use strict';

  const TYPES=['koenig','boas','geckos','spinnen'];
  const STATUS_ID='gdriveStatus';

  function status(text){
    const el=document.getElementById(STATUS_ID);
    if(el) el.innerHTML=text;
  }

  function store(){return window.NGTStore||null;}
  function db(){
    const s=store();
    if(s&&typeof s.getDb==='function') return s.getDb();
    try{if(typeof window.db!=='undefined'&&window.db)return window.db;}catch(e){}
    try{if(typeof db!=='undefined'&&db)return db;}catch(e){}
    return {koenig:[],boas:[],geckos:[],spinnen:[],clutches:[],sales:[],archive:[],foodInventory:[]};
  }

  function count(data){
    data=data||db();
    return TYPES.reduce((sum,t)=>sum+(Array.isArray(data[t])?data[t].length:0),0);
  }

  function score(data){
    data=data||db();
    return count(data)*1000+
      (Array.isArray(data.clutches)?data.clutches.length:0)*100+
      (Array.isArray(data.sales)?data.sales.length:0)*50+
      (Array.isArray(data.archive)?data.archive.length:0)*25+
      (Array.isArray(data.foodInventory)?data.foodInventory.filter(x=>Number(x.qty||0)>0).length:0);
  }

  function clone(data){
    try{return JSON.parse(JSON.stringify(data||db()));}catch(e){return data||db();}
  }

  function saveLocal(data){
    const s=store();
    if(s&&typeof s.save==='function') return s.save(data||db());
    try{localStorage.setItem('spd_v53',JSON.stringify(data||db()));}catch(e){}
    return data||db();
  }

  function restoreLocal(data){
    const s=store();
    if(s&&typeof s.setDb==='function') s.setDb(data);
    else window.db=data;
    saveLocal(data);
    if(typeof window.render==='function'){
      try{window.render();}catch(e){}
    }
  }

  function guardLoad(fn){
    return async function(){
      const before=clone(db());
      const beforeScore=score(before);
      const result=await fn.apply(this,arguments);
      const after=clone(db());
      const afterScore=score(after);
      if(beforeScore>0 && afterScore<beforeScore){
        restoreLocal(before);
        status('⚠️ Cloud-Laden blockiert: lokaler Bestand wurde vor leerem/kleinerem Cloud-Stand geschützt.');
        alert('Cloud-Laden wurde blockiert, weil der Cloud-Stand weniger Daten enthält als dein lokaler Bestand. Dein Bestand wurde geschützt.');
      }else{
        saveLocal(after);
        status('✅ Cloud-Daten geprüft und übernommen');
      }
      return result;
    };
  }

  function guardSave(fn){
    return async function(){
      const current=clone(db());
      saveLocal(current);
      const result=await fn.apply(this,arguments);
      saveLocal(db());
      status('✅ Lokal gesichert und Cloud-Speichern ausgeführt');
      return result;
    };
  }

  function patch(){
    if(typeof window.googleDriveLoad==='function'&&!window.googleDriveLoad.__ngtGuarded){
      window.googleDriveLoad=guardLoad(window.googleDriveLoad);
      window.googleDriveLoad.__ngtGuarded=true;
    }
    if(typeof window.googleDriveSave==='function'&&!window.googleDriveSave.__ngtGuarded){
      window.googleDriveSave=guardSave(window.googleDriveSave);
      window.googleDriveSave.__ngtGuarded=true;
    }
  }

  function init(){
    patch();
    let n=0;
    const timer=setInterval(()=>{
      patch();
      if(++n>20) clearInterval(timer);
    },500);
  }

  document.readyState==='loading'?document.addEventListener('DOMContentLoaded',init):init();
})();
