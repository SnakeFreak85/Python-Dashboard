(function(){
  'use strict';
  function byId(id){ return document.getElementById(id); }
  function load(src,attr){ if(document.querySelector('script['+attr+']')) return; const s=document.createElement('script'); s.src=src; s.defer=true; s.setAttribute(attr,'true'); document.head.appendChild(s); }
  function patchAssistantLink(){
    const link = byId('menuKiAssistent');
    if(!link) return;
    link.href = './ki-assistent.html?v=1.0.30';
    link.onclick = null;
    link.addEventListener('click', function(event){ event.preventDefault(); window.location.href = './ki-assistent.html?v=1.0.30'; }, {once:true});
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
    load('./v1-data-manager.js?v=1.0.30','data-ngt-data-manager-v30');
    load('./v1-default-feeder-ui.js?v=1.0.30','data-ngt-default-feeder-ui');
    patchAssistantLink();
    ensureInputStyles();
    setInterval(patchAssistantLink, 500);
  }
  document.readyState === 'loading' ? document.addEventListener('DOMContentLoaded', init) : init();
})();
