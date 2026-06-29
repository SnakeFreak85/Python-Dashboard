(function(){
  'use strict';

  const TYPES=['koenig','boas','geckos','spinnen'];
  const state={rendering:false,pendingRender:false,lastRender:0};

  function store(){return window.NGTStore||null;}
  function getDb(){const s=store();if(s&&typeof s.getDb==='function')return s.getDb();try{if(typeof db!=='undefined'&&db)return db;}catch(e){}return window.db||null;}
  function saveDb(){const data=getDb();if(!data)return;const s=store();if(s&&typeof s.save==='function')s.save(data);else{try{localStorage.setItem('spd_v53',JSON.stringify(data));}catch(e){}}}
  function uuid(){return (window.crypto&&crypto.randomUUID)?crypto.randomUUID():('ngt-'+Date.now().toString(36)+'-'+Math.random().toString(36).slice(2,10));}
  function normalizeAnimal(a,type,index){if(!a)return;const p={koenig:'KP',boas:'BOA',geckos:'LG',spinnen:'VS'}[type]||'ID';a.uuid=a.uuid||a.uid||uuid();a.uid=a.uid||a.uuid;a.displayId=a.displayId||(p+'-'+String(index+1).padStart(3,'0'));a.type=a.type||type;a.feeds=Array.isArray(a.feeds)?a.feeds:[];a.sheds=Array.isArray(a.sheds)?a.sheds:[];a.weights=Array.isArray(a.weights)?a.weights:[];}
  function normalizeDb(){const data=getDb();if(!data)return;TYPES.forEach(t=>{if(!Array.isArray(data[t]))data[t]=[];data[t].forEach((a,i)=>normalizeAnimal(a,t,i));});['clutches','sales','archive','foodInventory'].forEach(k=>{if(data[k]&&!Array.isArray(data[k]))data[k]=[];});saveDb();}
  function patchRender(){
    if(typeof window.render!=='function'||window.render.__ngtLegacyStable)return;
    const original=window.render;
    window.render=function(){
      if(state.rendering){state.pendingRender=true;return;}
      const now=Date.now();
      if(now-state.lastRender<50){state.pendingRender=true;setTimeout(()=>{if(state.pendingRender&&typeof window.render==='function')window.render();},75);return;}
      state.rendering=true;state.pendingRender=false;state.lastRender=now;
      try{normalizeDb();return original.apply(this,arguments);}catch(error){console.error('Render-Fehler abgefangen',error);saveDb();}
      finally{state.rendering=false;if(state.pendingRender){state.pendingRender=false;setTimeout(()=>{if(typeof window.render==='function')window.render();},75);}}
    };
    window.render.__ngtLegacyStable=true;
  }
  function patchShowPage(){
    if(typeof window.showPage!=='function'||window.showPage.__ngtLegacyStable)return;
    const original=window.showPage;
    window.showPage=function(id){try{return original.apply(this,arguments);}catch(error){console.error('Navigation-Fehler abgefangen',error);const target=document.getElementById(id);if(target){document.querySelectorAll('.section').forEach(s=>s.classList.remove('active'));target.classList.add('active');}}};
    window.showPage.__ngtLegacyStable=true;
  }
  function patchDuplicateSubmitProtection(){
    document.addEventListener('click',event=>{
      const btn=event.target&&event.target.closest&&event.target.closest('button');
      if(!btn)return;
      const key=(btn.textContent||'')+'|'+(btn.getAttribute('onclick')||'');
      const now=Date.now();
      if(btn.__ngtLastClickKey===key&&now-(btn.__ngtLastClickAt||0)<400){event.preventDefault();event.stopPropagation();return false;}
      btn.__ngtLastClickKey=key;btn.__ngtLastClickAt=now;
    },true);
  }
  function exposeDiagnostics(){window.NGTDiagnostics=window.NGTDiagnostics||{};window.NGTDiagnostics.legacy={state,getDb,normalizeDb,saveDb};}
  function patch(){patchRender();patchShowPage();exposeDiagnostics();}
  function init(){normalizeDb();patch();patchDuplicateSubmitProtection();let n=0;const timer=setInterval(()=>{patch();if(++n>40)clearInterval(timer);},500);}
  document.readyState==='loading'?document.addEventListener('DOMContentLoaded',init):init();
})();
