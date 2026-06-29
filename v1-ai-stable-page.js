(function(){
  'use strict';

  const SECTION_ID = 'kiassistent';
  const INPUT_ID = 'aiAssistantInput';
  const OUT_ID = 'aiAssistantOutput';
  const PLACEHOLDER = 'Füge bei Medusa folgende Fütterungen hinzu:\n19.06.2026 - 200 gramm Ratte\n21.06.2026 - 200 gramm Ratte\n30.06.2026 - 200 gramm Ratte';

  function byId(id){ return document.getElementById(id); }

  function ensureSection(){
    const content = document.querySelector('.content');
    if(!content) return null;
    let section = byId(SECTION_ID);
    if(!section){
      section = document.createElement('div');
      section.id = SECTION_ID;
      section.className = 'section';
      content.appendChild(section);
    }
    return section;
  }

  function buildStablePage(){
    const section = ensureSection();
    if(!section) return;
    if(byId(INPUT_ID)) return;
    section.innerHTML = '';

    const card = document.createElement('div');
    card.className = 'card';

    const title = document.createElement('h2');
    title.textContent = '🤖 KI Assistent';

    const hint = document.createElement('p');
    hint.className = 'ngt-muted';
    hint.textContent = 'Schreibe natürliche Befehle. Beim Tippen wird diese Seite nicht neu aufgebaut.';

    const input = document.createElement('textarea');
    input.id = INPUT_ID;
    input.rows = 10;
    input.placeholder = PLACEHOLDER;
    input.autocomplete = 'off';
    input.spellcheck = true;
    input.style.cssText = 'display:block;width:100%;min-height:240px;box-sizing:border-box;border-radius:12px;padding:14px;background:#0f1a25;color:#f5f7fb;border:1px solid #69d2c4;font-size:16px;line-height:1.45;position:relative;z-index:1000;pointer-events:auto;touch-action:auto;-webkit-user-select:text;user-select:text;';

    const run = document.createElement('button');
    run.type = 'button';
    run.id = 'aiAssistantRun';
    run.textContent = 'Befehl ausführen';
    run.addEventListener('click', function(){
      if(window.NGTAIAssistant && typeof window.NGTAIAssistant.executeAssistantCommand === 'function'){
        window.NGTAIAssistant.executeAssistantCommand();
      }
    });

    const out = document.createElement('div');
    out.id = OUT_ID;

    card.appendChild(title);
    card.appendChild(hint);
    card.appendChild(input);
    card.appendChild(run);
    card.appendChild(out);
    section.appendChild(card);
  }

  function showAssistant(){
    buildStablePage();
    document.querySelectorAll('.section').forEach(function(section){ section.classList.remove('active'); });
    const section = byId(SECTION_ID);
    if(section) section.classList.add('active');
    const drawer = byId('drawer');
    const overlay = byId('overlay');
    if(drawer) drawer.classList.remove('open');
    if(overlay) overlay.classList.remove('show');
    setTimeout(function(){
      const input = byId(INPUT_ID);
      if(input){ input.focus(); }
    }, 120);
  }

  function patchMenu(){
    let link = byId('menuKiAssistent');
    const drawer = byId('drawer');
    if(!link && drawer){
      link = document.createElement('a');
      link.href = '#';
      link.id = 'menuKiAssistent';
      link.textContent = '🤖 KI Assistent';
      drawer.appendChild(link);
    }
    if(link && !link.__ngtStableAi){
      link.__ngtStableAi = true;
      link.onclick = function(event){ event.preventDefault(); showAssistant(); };
    }
  }

  function patchRender(){
    if(window.__ngtStableAiRenderPatched || typeof window.render !== 'function') return;
    window.__ngtStableAiRenderPatched = true;
    const original = window.render;
    window.render = function(){
      const active = document.activeElement && document.activeElement.id === INPUT_ID;
      const value = byId(INPUT_ID) ? byId(INPUT_ID).value : '';
      if(active){ return; }
      const result = original.apply(this, arguments);
      buildStablePage();
      const input = byId(INPUT_ID);
      if(input && value && !input.value) input.value = value;
      patchMenu();
      return result;
    };
  }

  function protectInput(){
    ['touchstart','pointerdown','mousedown','click','keydown','input'].forEach(function(type){
      document.addEventListener(type, function(event){
        if(event.target && event.target.id === INPUT_ID){
          event.stopPropagation();
        }
      }, true);
    });
  }

  function init(){
    buildStablePage();
    patchMenu();
    protectInput();
    patchRender();
    window.NGTShowAIAssistant = showAssistant;
  }

  document.readyState === 'loading' ? document.addEventListener('DOMContentLoaded', init) : init();
})();
