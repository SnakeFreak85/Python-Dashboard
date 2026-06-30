(function(){
'use strict';
function load(src,attr){if(document.querySelector('script['+attr+']'))return;const s=document.createElement('script');s.src=src;s.defer=true;s.setAttribute(attr,'true');document.head.appendChild(s);}
function fallback(){return {koenig:[],boas:[],geckos:[],spinnen:[],clutches:[],sales:[],archive:[],foodInventory:[]};}
function getDb(){if(window.NGTData&&typeof window.NGTData.load==='function')return window.NGTData.load();try{if(typeof db!=='undefined'&&db)return db;}catch(e){}return window.db||fallback();}
function saveDb(data,source){if(window.NGTData&&typeof window.NGTData.save==='function')return window.NGTData.save(data||getDb(),source||'persistence');try{localStorage.setItem('spd_v53',JSON.stringify(data||getDb()));}catch(e){}return data||getDb();}
function patchSave(){if(window.__ngtPersistenceSavePatched||typeof window.save!=='function')return;window.__ngtPersistenceSavePatched=true;const old=window.save;window.save=function(){const before=getDb();const r=old.apply(this,arguments);saveDb(window.db||before,'legacy-save');if(window.NGTV2)window.NGTV2.emit('data:changed',{label:'legacy-save'});return r;};}
function patchAddAnimal(){if(window.__ngtAddAnimalPatched||typeof window.addAnimal!=='function')return;window.__ngtAddAnimalPatched=true;const old=window.addAnimal;window.addAnimal=function(type){getDb();const r=old.apply(this,arguments);saveDb(window.db||getDb(),'add-animal');if(window.NGTV2)window.NGTV2.emit('animal:created',{type:type});if(typeof window.render==='function')window.render();return r;};}
function patchRender(){if(window.__ngtPersistenceRenderPatched||typeof window.render!=='function')return;window.__ngtPersistenceRenderPatched=true;const old=window.render;window.render=function(){getDb();return old.apply(this,arguments);};}
function init(){
 load('./v2-core.js?v=2.0.1','data-ngt-v2-core');
 load('./v1-data-manager.js?v=1.0.30','data-ngt-data-manager');
 load('./v1-store-bridge.js?v=1.0.26','data-ngt-store-bridge');
 load('./v1-drive-guard.js?v=1.0.16','data-ngt-drive-guard');
 load('./v1-animal-actions.js?v=1.0.17','data-ngt-animal-actions');
 load('./v1-runtime-guard.js?v=1.0.18','data-ngt-runtime-guard');
 load('./v1-legacy-stabilizer.js?v=1.0.19','data-ngt-legacy-stabilizer');
 load('./v1-stats-engine.js?v=1.0.20','data-ngt-stats-engine');
 load('./v1-ai-assistant.js?v=1.0.21','data-ngt-ai-assistant');
 load('./v1-ai-input-fix.js?v=1.0.22','data-ngt-ai-input-fix');
 load('./v1-ai-stable-page.js?v=1.0.23','data-ngt-ai-stable-page');
 setTimeout(function(){getDb();patchSave();patchAddAnimal();patchRender();},250);
 setTimeout(function(){patchSave();patchAddAnimal();patchRender();},1000);
}
document.readyState==='loading'?document.addEventListener('DOMContentLoaded',init):init();
})();
