(function(){
  'use strict';

  const STORAGE_KEY = 'spd_v53';
  const BACKUP_KEY = 'spd_v53_backup';
  const SNAPSHOT_KEY = 'spd_v53_last_good';
  const TYPES = ['koenig','boas','geckos','spinnen'];

  function loadStoreBridge(){
    if(document.querySelector('script[data-ngt-store-bridge]')) return;
    const script=document.createElement('script');
    script.src='./v1-store-bridge.js?v=1.0.15';
    script.defer=true;
    script.setAttribute('data-ngt-store-bridge','true');
    document.head.appendChild(script);
  }

  function fallbackDb(){
    return {koenig:[],boas:[],geckos:[],spinnen:[],clutches:[],sales:[],archive:[]};
  }

  function parseJson(value){
    try{ return value ? JSON.parse(value) : null; }catch(error){ return null; }
  }

  function countAnimals(data){
    if(!data) return 0;
    return TYPES.reduce((sum,type) => sum + (Array.isArray(data[type]) ? data[type].length : 0), 0);
  }

  function normalizeDb(data){
    data = data && typeof data === 'object' ? data : fallbackDb();
    TYPES.forEach(type => { if(!Array.isArray(data[type])) data[type] = []; });
    ['clutches','sales','archive'].forEach(key => { if(!Array.isArray(data[key])) data[key] = []; });
    TYPES.forEach(type => data[type].forEach((animal,index) => normalizeAnimal(animal,type,index)));
    return data;
  }

  function uuid(){
    if(window.crypto && typeof window.crypto.randomUUID === 'function') return window.crypto.randomUUID();
    return 'ngt-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2,10);
  }

  function normalizeAnimal(animal,type,index){
    if(!animal || typeof animal !== 'object') return animal;
    const prefix = {koenig:'KP',boas:'BOA',geckos:'LG',spinnen:'VS'}[type] || 'ID';
    animal.uuid = animal.uuid || animal.uid || uuid();
    animal.uid = animal.uid || animal.uuid;
    animal.displayId = animal.displayId || (prefix + '-' + String(index + 1).padStart(3,'0'));
    animal.type = animal.type || type;
    animal.feeds = Array.isArray(animal.feeds) ? animal.feeds : [];
    animal.sheds = Array.isArray(animal.sheds) ? animal.sheds : [];
    animal.weights = Array.isArray(animal.weights) ? animal.weights : [];
    return animal;
  }

  function bestAvailableDb(){
    const primary = parseJson(localStorage.getItem(STORAGE_KEY));
    const backup = parseJson(localStorage.getItem(BACKUP_KEY));
    const snapshot = parseJson(localStorage.getItem(SNAPSHOT_KEY));
    const options = [primary, backup, snapshot].filter(Boolean).map(normalizeDb);
    if(!options.length) return fallbackDb();
    return options.sort((a,b) => countAnimals(b) - countAnimals(a))[0];
  }

  function writeAll(data){
    const normalized = normalizeDb(data);
    const serialized = JSON.stringify(normalized);
    localStorage.setItem(STORAGE_KEY, serialized);
    localStorage.setItem(BACKUP_KEY, serialized);
    if(countAnimals(normalized) > 0) localStorage.setItem(SNAPSHOT_KEY, serialized);
    window.db = normalized;
    return normalized;
  }

  function restoreIfNeeded(){
    const current = normalizeDb(window.db || bestAvailableDb());
    const best = bestAvailableDb();
    if(countAnimals(best) > countAnimals(current)){
      writeAll(best);
    }else{
      writeAll(current);
    }
  }

  function patchSave(){
    if(window.__ngtPersistenceSavePatched || typeof window.save !== 'function') return;
    window.__ngtPersistenceSavePatched = true;
    const original = window.save;
    window.save = function(){
      writeAll(window.db || fallbackDb());
      const result = original.apply(this, arguments);
      writeAll(window.db || fallbackDb());
      return result;
    };
  }

  function patchAddAnimal(){
    if(window.__ngtAddAnimalPatched || typeof window.addAnimal !== 'function') return;
    window.__ngtAddAnimalPatched = true;
    const original = window.addAnimal;
    window.addAnimal = function(type){
      const before = countAnimals(window.db);
      const result = original.apply(this, arguments);
      normalizeDb(window.db);
      const list = window.db && window.db[type];
      if(Array.isArray(list) && list.length){
        normalizeAnimal(list[list.length - 1], type, list.length - 1);
      }
      writeAll(window.db);
      if(typeof window.render === 'function') window.render();
      if(countAnimals(window.db) <= before){
        console.warn('Tier wurde nicht hinzugefügt oder nicht erkannt.');
      }
      return result;
    };
  }

  function patchRender(){
    if(window.__ngtPersistenceRenderPatched || typeof window.render !== 'function') return;
    window.__ngtPersistenceRenderPatched = true;
    const original = window.render;
    window.render = function(){
      if(window.db) normalizeDb(window.db);
      return original.apply(this, arguments);
    };
  }

  function init(){
    loadStoreBridge();
    window.db = normalizeDb(bestAvailableDb());
    writeAll(window.db);
    patchSave();
    patchAddAnimal();
    patchRender();
  }

  document.readyState === 'loading' ? document.addEventListener('DOMContentLoaded', init) : init();
})();
