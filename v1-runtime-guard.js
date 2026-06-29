(function(){
  'use strict';

  const TYPES=['koenig','boas','geckos','spinnen'];
  let lastAutosave=0;

  function store(){return window.NGTStore||null;}
  function getDb(){const s=store(); if(s&&typeof s.getDb==='function')return s.getDb(); try{if(typeof db!=='undefined'&&db)return db;}catch(e){} return window.db||null;}
  function countAnimals(data){data=data||getDb()||{};return TYPES.reduce((sum,t)=>sum+(Array.isArray(data[t])?data[t].length:0),0);}
  function saveNow(reason){
    const data=getDb(); if(!data)return;
    try{
      const s=store();
      if(s&&typeof s.save==='function')s.save(data);
      else localStorage.setItem('spd_v53',JSON.stringify(data));
      lastAutosave=Date.now();
      window.__ngtLastAutosave={reason,at:new Date().toISOString(),animals:countAnimals(data)};
    }catch(e){console.warn('NGT Autosave fehlgeschlagen',e);}
  }
  function throttledSave(reason){if(Date.now()-lastAutosave>1000)saveNow(reason);}
  function patchMutatingFunctions(){
    ['save','addAnimal','saveWeight','saveFeed','saveShed','saveClutch','createOffspring','moveOffspringToSale','markSold','restoreArchived','deleteArchived','deleteAnimal','archiveAnimal'].forEach(name=>{
      if(typeof window[name]!=='function'||window[name].__ngtRuntimeGuarded)return;
      const original=window[name];
      window[name]=function(){
        try{const result=original.apply(this,arguments); if(result&&typeof result.then==='function')return result.then(v=>{saveNow(name);return v;}); saveNow(name); return result;}
        catch(error){saveNow(name+'-error'); throw error;}
      };
      window[name].__ngtRuntimeGuarded=true;
    });
  }
  function showSoftError(message){
    let box=document.getElementById('ngtRuntimeStatus');
    if(!box){box=document.createElement('div');box.id='ngtRuntimeStatus';box.style.cssText='position:fixed;left:10px;right:10px;bottom:10px;z-index:999999;background:#3b1f1f;color:#fff;border:1px solid #9b4d4d;border-radius:12px;padding:10px;font:14px Arial,sans-serif';document.body.appendChild(box);}
    box.textContent=message;
    setTimeout(()=>{if(box)box.remove();},6000);
  }
  window.addEventListener('error',event=>{saveNow('window-error');console.error(event.error||event.message);showSoftError('Ein App-Fehler wurde abgefangen. Deine Daten wurden lokal gesichert.');});
  window.addEventListener('unhandledrejection',event=>{saveNow('promise-error');console.error(event.reason);showSoftError('Ein Hintergrundfehler wurde abgefangen. Deine Daten wurden lokal gesichert.');});
  window.addEventListener('beforeunload',()=>saveNow('beforeunload'));
  document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='hidden')saveNow('hidden');});
  function init(){patchMutatingFunctions();saveNow('startup');let n=0;const timer=setInterval(()=>{patchMutatingFunctions();throttledSave('interval');if(++n>120)clearInterval(timer);},5000);}
  document.readyState==='loading'?document.addEventListener('DOMContentLoaded',init):init();
})();
