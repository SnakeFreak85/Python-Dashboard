(function(){
  'use strict';

  const BLOCKED_TEXTS = [
    'V300 Struktur-Update',
    'Vorbereitung für Formulare, QR-System, Scanner und Android-App.',
    'NG Terrarium 1.0',
    'Schneller Zugriff auf Bestand, Pflege, Nachzucht, Termine und Backup.',
    'Verwaltung für Bestand, Pflege, Nachzucht, Termine und Verkauf.'
  ];

  function cleanHome(){
    const home = document.getElementById('home');
    if(!home) return;

    const ngt = document.getElementById('ngtDashboard');
    if(ngt) ngt.remove();

    Array.from(home.children).forEach(child => {
      const text = (child.textContent || '').replace(/\s+/g, ' ').trim();
      if(BLOCKED_TEXTS.some(blocked => text.includes(blocked))){
        child.remove();
      }
    });

    Array.from(home.querySelectorAll('.card')).forEach(card => {
      const text = (card.textContent || '').replace(/\s+/g, ' ').trim();
      if(BLOCKED_TEXTS.some(blocked => text.includes(blocked))){
        card.remove();
      }
    });
  }

  function patchRender(){
    if(window.__cleanHomeRenderPatched || typeof window.render !== 'function') return;
    window.__cleanHomeRenderPatched = true;
    const original = window.render;
    window.render = function(){
      const result = original.apply(this, arguments);
      cleanHome();
      setTimeout(cleanHome, 100);
      return result;
    };
  }

  function startObserver(){
    const home = document.getElementById('home');
    if(!home || window.__cleanHomeObserver) return;
    window.__cleanHomeObserver = new MutationObserver(cleanHome);
    window.__cleanHomeObserver.observe(home, {childList:true, subtree:true});
  }

  function init(){
    patchRender();
    cleanHome();
    startObserver();
    setTimeout(cleanHome, 100);
    setTimeout(cleanHome, 500);
    setTimeout(cleanHome, 1200);
  }

  document.readyState === 'loading' ? document.addEventListener('DOMContentLoaded', init) : init();
})();
