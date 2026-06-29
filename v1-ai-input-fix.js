(function(){
  'use strict';

  function byId(id){ return document.getElementById(id); }

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

  function focusInput(){
    const input = byId('aiAssistantInput');
    if(!input) return;
    ensureInputStyles();
    try{ input.focus({preventScroll:false}); }catch(error){ input.focus(); }
  }

  function protectTextInputEvents(){
    document.addEventListener('touchstart', function(event){
      if(event.target && event.target.id === 'aiAssistantInput'){
        event.stopPropagation();
        setTimeout(focusInput, 0);
      }
    }, true);
    document.addEventListener('pointerdown', function(event){
      if(event.target && event.target.id === 'aiAssistantInput'){
        event.stopPropagation();
        setTimeout(focusInput, 0);
      }
    }, true);
    document.addEventListener('click', function(event){
      if(event.target && event.target.id === 'aiAssistantInput'){
        event.stopPropagation();
        setTimeout(focusInput, 0);
      }
    }, true);
  }

  function patchMenuOpen(){
    const link = byId('menuKiAssistent');
    if(!link || link.__ngtInputFix) return;
    link.__ngtInputFix = true;
    link.addEventListener('click', function(){
      setTimeout(function(){
        ensureInputStyles();
        focusInput();
      }, 400);
    });
  }

  function patchRender(){
    if(window.__ngtAiInputFixRenderPatched || typeof window.render !== 'function') return;
    window.__ngtAiInputFixRenderPatched = true;
    const original = window.render;
    window.render = function(){
      const result = original.apply(this, arguments);
      setTimeout(function(){ ensureInputStyles(); patchMenuOpen(); }, 50);
      return result;
    };
  }

  function init(){
    ensureInputStyles();
    protectTextInputEvents();
    patchMenuOpen();
    patchRender();
    setTimeout(ensureInputStyles, 300);
    setTimeout(ensureInputStyles, 1000);
    window.NGTAIFocusInput = focusInput;
  }

  document.readyState === 'loading' ? document.addEventListener('DOMContentLoaded', init) : init();
})();
