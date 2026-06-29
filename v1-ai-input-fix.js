(function(){
  'use strict';

  function byId(id){ return document.getElementById(id); }

  function patchAssistantLink(){
    const link = byId('menuKiAssistent');
    if(!link) return;
    link.href = './ki-assistent.html?v=1.0.24';
    link.onclick = null;
    link.addEventListener('click', function(event){
      event.preventDefault();
      window.location.href = './ki-assistent.html?v=1.0.24';
    }, {once:true});
  }

  function ensureInputStyles(){
    const input = byId('aiAssistantInput');
    if(!input) return;
    input.removeAttribute('readonly');
    input.disabled = false;
    input.setAttribute('inputmode','text');
    input.setAttribute('autocomplete','off');
    input.style.pointerEvents = 'auto';
    input.style.touchAction = 'manipulation';
    input.style.webkitUserSelect = 'text';
    input.style.userSelect = 'text';
    input.style.position = 'relative';
    input.style.zIndex = '999';
    input.style.fontSize = '16px';
    input.style.minHeight = '220px';
    input.style.display = 'block';
  }

  function init(){
    patchAssistantLink();
    ensureInputStyles();
    setInterval(patchAssistantLink, 500);
  }

  document.readyState === 'loading' ? document.addEventListener('DOMContentLoaded', init) : init();
})();
