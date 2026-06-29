(function(){
  'use strict';

  const TYPES=['koenig','boas','geckos','spinnen'];

  function store(){return window.NGTStore||null;}
  function getDb(){const s=store(); if(s&&typeof s.getDb==='function')return s.getDb(); try{if(typeof db!=='undefined'&&db)return db;}catch(e){} return window.db||{};}
  function saveDb(){const s=store(); const data=getDb(); if(s&&typeof s.save==='function')s.save(data); else {try{localStorage.setItem('spd_v53',JSON.stringify(data));}catch(e){}}}
  function makeUuid(){return (window.crypto&&crypto.randomUUID)?crypto.randomUUID():('ngt-'+Date.now().toString(36)+'-'+Math.random().toString(36).slice(2,10));}
  function normalizeAnimal(a,type,index){if(!a)return;const p={koenig:'KP',boas:'BOA',geckos:'LG',spinnen:'VS'}[type]||'ID';a.uuid=a.uuid||a.uid||makeUuid();a.uid=a.uid||a.uuid;a.displayId=a.displayId||(p+'-'+String(index+1).padStart(3,'0'));a.type=a.type||type;a.feeds=Array.isArray(a.feeds)?a.feeds:[];a.sheds=Array.isArray(a.sheds)?a.sheds:[];a.weights=Array.isArray(a.weights)?a.weights:[];a.updatedAt=new Date().toISOString();}
  function normalizeAll(){const data=getDb();TYPES.forEach(t=>{if(!Array.isArray(data[t]))data[t]=[];data[t].forEach((a,i)=>normalizeAnimal(a,t,i));});saveDb();return data;}
  function afterAction(){normalizeAll(); if(typeof window.render==='function'){try{window.render();}catch(e){}}}
  function wrap(name){
    if(typeof window[name]!=='function'||window[name].__ngtActionGuarded)return;
    const original=window[name];
    window[name]=function(){const result=original.apply(this,arguments);afterAction();return result;};
    window[name].__ngtActionGuarded=true;
  }
  function wrapAsyncAware(name){
    if(typeof window[name]!=='function'||window[name].__ngtActionGuarded)return;
    const original=window[name];
    window[name]=function(){const result=original.apply(this,arguments);if(result&&typeof result.then==='function'){return result.then(value=>{afterAction();return value;});}afterAction();return result;};
    window[name].__ngtActionGuarded=true;
  }
  function patch(){
    ['saveWeight','saveFeed','saveShed','saveClutch','saveClutchEditor','createOffspring','moveOffspringToSale','returnToStock','markSold','editSale','restoreArchived','deleteArchived','deleteClutch','archiveAnimal','deleteAnimal'].forEach(wrapAsyncAware);
  }
  function init(){normalizeAll();patch();let n=0;const timer=setInterval(()=>{patch();if(++n>20)clearInterval(timer);},500);}
  document.readyState==='loading'?document.addEventListener('DOMContentLoaded',init):init();
})();
