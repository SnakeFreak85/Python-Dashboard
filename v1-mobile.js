(function(){
  'use strict';

  function ready(fn){
    document.readyState === 'loading' ? document.addEventListener('DOMContentLoaded', fn) : fn();
  }

  function openInitialPage(){
    try{
      const params = new URLSearchParams(window.location.search || '');
      const page = params.get('page');
      const map = {
        bestand: 'home',
        backup: 'backup',
        termine: 'termine',
        nachzucht: 'nachzucht'
      };
      if(page && map[page] && typeof window.showPage === 'function'){
        window.showPage(map[page]);
      }
    }catch(error){}
  }

  function markStandalone(){
    const isStandalone = window.matchMedia && window.matchMedia('(display-mode: standalone)').matches;
    const isIosStandalone = window.navigator && window.navigator.standalone;
    if(isStandalone || isIosStandalone){
      document.body.classList.add('ngt-standalone');
    }
  }

  function registerServiceWorker(){
    if(!('serviceWorker' in navigator)) return;
    navigator.serviceWorker.register('./service-worker.js').then(registration => {
      if(registration.waiting){
        registration.waiting.postMessage({type:'SKIP_WAITING'});
      }
      registration.addEventListener('updatefound', () => {
        const worker = registration.installing;
        if(!worker) return;
        worker.addEventListener('statechange', () => {
          if(worker.state === 'installed' && navigator.serviceWorker.controller){
            worker.postMessage({type:'SKIP_WAITING'});
          }
        });
      });
    }).catch(() => undefined);

    let refreshed = false;
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if(refreshed) return;
      refreshed = true;
      window.location.reload();
    });
  }

  ready(function(){
    markStandalone();
    openInitialPage();
    registerServiceWorker();
  });
})();
