(function(){
  'use strict';
  function ready(fn){document.readyState==='loading'?document.addEventListener('DOMContentLoaded',fn):fn();}

  function removeDashboard(){
    const box=document.getElementById('ngtDashboard');
    if(box) box.remove();
  }

  function patchRender(){
    if(window.__ngtDashboardRemovedPatched||typeof window.render!=='function') return;
    window.__ngtDashboardRemovedPatched=true;
    const original=window.render;
    window.render=function(){
      if(window.NGT) window.NGT.normalizeDb();
      const result=original.apply(this,arguments);
      removeDashboard();
      if(window.NGT&&window.NGT.enhanceAnimalCards) window.NGT.enhanceAnimalCards();
      return result;
    };
  }

  ready(function(){
    patchRender();
    removeDashboard();
    window.NGT=window.NGT||{};
    window.NGT.renderV1Dashboard=removeDashboard;
  });
})();
