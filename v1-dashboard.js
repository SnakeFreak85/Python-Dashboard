(function(){
  'use strict';
  function ready(fn){document.readyState==='loading'?document.addEventListener('DOMContentLoaded',fn):fn();}
  function go(id){if(typeof window.showPage==='function') window.showPage(id);}

  function renderDashboard(){
    if(!window.NGT) return;
    const home=document.getElementById('home');
    if(!home) return;
    let box=document.getElementById('ngtDashboard');
    if(!box){box=document.createElement('div'); box.id='ngtDashboard'; box.className='card'; home.insertBefore(box,home.firstChild);}
    box.innerHTML='<h2>NG Terrarium 1.0</h2>'+
      '<p class="ngt-muted">Schneller Zugriff auf Bestand, Pflege, Nachzucht, Termine und Backup.</p>'+
      '<div class="ngt-actions">'+
      '<button data-page="koenig">🐍 Königspythons</button>'+
      '<button data-page="boas">🐍 Boas</button>'+
      '<button data-page="geckos">🦎 Leopardgeckos</button>'+
      '<button data-page="spinnen">🕷 Vogelspinnen</button>'+
      '<button data-page="nachzucht">🐣 Nachzucht</button>'+
      '<button data-page="termine">📅 Termine</button>'+
      '<button data-page="backup">💾 Backup</button>'+
      '</div>';
    box.querySelectorAll('[data-page]').forEach(btn=>btn.onclick=()=>go(btn.getAttribute('data-page')));
  }

  function patchRender(){
    if(window.__ngtDashboardPatched||typeof window.render!=='function') return;
    window.__ngtDashboardPatched=true;
    const original=window.render;
    window.render=function(){
      if(window.NGT) window.NGT.normalizeDb();
      original.apply(this,arguments);
      renderDashboard();
      if(window.NGT&&window.NGT.enhanceAnimalCards) window.NGT.enhanceAnimalCards();
    };
  }

  ready(function(){
    patchRender();
    if(typeof window.render==='function') window.render();
    renderDashboard();
    window.NGT=window.NGT||{};
    window.NGT.renderV1Dashboard=renderDashboard;
  });
})();
