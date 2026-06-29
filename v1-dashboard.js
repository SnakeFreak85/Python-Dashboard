(function(){
  'use strict';

  function removeIntro(){
    const box = document.getElementById('ngtDashboard');
    if(box) box.remove();
  }

  function patchRender(){
    if(window.__ngtIntroDisabled || typeof window.render !== 'function') return;
    window.__ngtIntroDisabled = true;
    const original = window.render;
    window.render = function(){
      const result = original.apply(this, arguments);
      removeIntro();
      return result;
    };
  }

  function init(){
    window.NGT = window.NGT || {};
    window.NGT.renderV1Dashboard = removeIntro;
    patchRender();
    removeIntro();
    setTimeout(removeIntro, 100);
    setTimeout(removeIntro, 500);
  }

  document.readyState === 'loading' ? document.addEventListener('DOMContentLoaded', init) : init();
})();
