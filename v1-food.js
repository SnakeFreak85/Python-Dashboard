(function(){
  'use strict';

  const DEFAULT_ITEMS = [
    'Ratte 10g','Ratte 20g','Ratte 30g','Ratte 50g','Ratte 70g','Ratte 90g','Ratte 120g','Ratte 150g','Ratte 200g','Ratte 250g',
    'Maus 10g','Maus 20g','Maus 30g','Maus 50g',
    'ASF 20g','ASF 30g','ASF 50g','ASF 70g','ASF 90g',
    'Küken',
    'Heimchen klein','Heimchen mittel','Heimchen groß',
    'Schabe klein','Schabe mittel','Schabe groß'
  ];

  function byId(id){ return document.getElementById(id); }

  function getDb(){
    window.db = window.db || {};
    if(!Array.isArray(window.db.foodInventory)){
      window.db.foodInventory = DEFAULT_ITEMS.map(name => ({name, qty:0}));
    }
    DEFAULT_ITEMS.forEach(name => {
      if(!window.db.foodInventory.some(item => item.name === name)) window.db.foodInventory.push({name, qty:0});
    });
    return window.db;
  }

  function saveDb(){
    try{ localStorage.setItem('spd_v53', JSON.stringify(getDb())); }catch(error){}
  }

  function normalizeAmount(prey, amount){
    const preyText = String(prey || '').trim();
    const amountText = String(amount || '').trim();
    if(['Heimchen klein','Heimchen mittel','Heimchen groß','Schabe klein','Schabe mittel','Schabe groß','Küken'].includes(preyText)){
      return {name: preyText, qty: Math.max(1, Number(amountText || 1) || 1)};
    }
    if(preyText && amountText) return {name: preyText + ' ' + amountText + 'g', qty:1};
    return {name: preyText || amountText || 'Unbekannt', qty:1};
  }

  function findFood(name){
    const db = getDb();
    return db.foodInventory.find(item => item.name === name);
  }

  function reduceFood(prey, amount, accepted){
    if(!accepted) return;
    const entry = normalizeAmount(prey, amount);
    const item = findFood(entry.name);
    if(!item) getDb().foodInventory.push({name: entry.name, qty:0});
    const target = findFood(entry.name);
    target.qty = Math.max(0, Number(target.qty || 0) - entry.qty);
    saveDb();
  }

  function lowFoodItems(){
    return getDb().foodInventory.filter(item => Number(item.qty || 0) <= 3);
  }

  function renderFoodPage(){
    const content = document.querySelector('.content');
    if(!content) return;
    let section = byId('futter');
    if(!section){
      section = document.createElement('div');
      section.id = 'futter';
      section.className = 'section';
      content.appendChild(section);
    }
    const items = getDb().foodInventory;
    section.innerHTML = '<div class="card"><h2>🥩 Futterbestand</h2><p class="ngt-muted">Hier kannst du alle Futtertiergrößen pflegen. Bei gespeicherter, angenommener Fütterung wird der Bestand automatisch reduziert.</p>'+
      '<div class="ngt-form-grid"><input id="foodName" placeholder="Futtertiergröße, z. B. Ratte 120g"><input id="foodQty" type="number" min="0" placeholder="Bestand"><button id="addFoodBtn">Hinzufügen / aktualisieren</button></div>'+
      '<div id="foodList"></div></div>';
    byId('addFoodBtn').onclick = addOrUpdateFood;
    renderFoodList();
  }

  function renderFoodList(){
    const list = byId('foodList');
    if(!list) return;
    const rows = getDb().foodInventory.slice().sort((a,b)=>a.name.localeCompare(b.name,'de')).map((item,index) => {
      const warn = Number(item.qty || 0) <= 3 ? ' ngt-warn' : '';
      return '<div class="feedPanel'+warn+'"><b>'+escapeHtml(item.name)+'</b><br>Bestand: <input data-food-index="'+index+'" type="number" min="0" value="'+Number(item.qty||0)+'"><button data-food-save="'+index+'">Speichern</button></div>';
    }).join('');
    list.innerHTML = rows || 'Noch kein Futterbestand angelegt.';
    list.querySelectorAll('[data-food-save]').forEach(btn => btn.onclick = function(){
      const index = Number(this.getAttribute('data-food-save'));
      const input = list.querySelector('[data-food-index="'+index+'"]');
      getDb().foodInventory.slice().sort((a,b)=>a.name.localeCompare(b.name,'de'))[index].qty = Number(input.value || 0);
      saveDb();
      renderFoodList();
      renderFoodWarning();
    });
  }

  function addOrUpdateFood(){
    const name = (byId('foodName') && byId('foodName').value || '').trim();
    const qty = Number((byId('foodQty') && byId('foodQty').value) || 0);
    if(!name) return;
    const item = findFood(name);
    if(item) item.qty = qty;
    else getDb().foodInventory.push({name, qty});
    saveDb();
    renderFoodList();
    renderFoodWarning();
  }

  function renderFoodWarning(){
    const home = byId('home');
    if(!home) return;
    let box = byId('foodWarning');
    const lows = lowFoodItems();
    if(!lows.length){ if(box) box.remove(); return; }
    if(!box){
      box = document.createElement('div');
      box.id = 'foodWarning';
      box.className = 'card';
      const firstCard = home.querySelector('.card');
      home.insertBefore(box, firstCard ? firstCard.nextSibling : home.firstChild);
    }
    box.innerHTML = '<h2>⚠️ Futterbestand niedrig</h2><p>Folgende Futtertiergrößen sind bei 3 oder weniger:</p>'+
      lows.map(item => '<div class="feedPanel ngt-warn"><b>'+escapeHtml(item.name)+'</b><br>Bestand: '+Number(item.qty||0)+'</div>').join('');
  }

  function escapeHtml(value){
    return String(value == null ? '' : value).replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
  }

  function addMenuItem(){
    const drawer = byId('drawer');
    if(!drawer || byId('menuFutter')) return;
    const link = document.createElement('a');
    link.href = '#';
    link.id = 'menuFutter';
    link.textContent = '🥩 Futter';
    link.onclick = function(event){ event.preventDefault(); if(typeof window.showPage === 'function') window.showPage('futter'); };
    drawer.appendChild(link);
  }

  function patchSaveFeed(){
    if(window.__foodSaveFeedPatched || typeof window.saveFeed !== 'function') return;
    window.__foodSaveFeedPatched = true;
    const original = window.saveFeed;
    window.saveFeed = function(t,i){
      const preyEl = byId('prey_'+t+'_'+i);
      const amountEl = byId('amt_'+t+'_'+i);
      const acceptedEl = byId('acc_'+t+'_'+i);
      const prey = preyEl ? preyEl.value : '';
      const amount = amountEl ? amountEl.value : '';
      const accepted = acceptedEl ? acceptedEl.value === 'true' : true;
      const result = original.apply(this, arguments);
      reduceFood(prey, amount, accepted);
      renderFoodWarning();
      renderFoodList();
      return result;
    };
  }

  function patchRender(){
    if(window.__foodRenderPatched || typeof window.render !== 'function') return;
    window.__foodRenderPatched = true;
    const original = window.render;
    window.render = function(){
      const result = original.apply(this, arguments);
      addMenuItem();
      renderFoodPage();
      renderFoodWarning();
      patchSaveFeed();
      return result;
    };
  }

  function init(){
    getDb();
    addMenuItem();
    renderFoodPage();
    renderFoodWarning();
    patchSaveFeed();
    patchRender();
    window.NGTFood = {renderFoodPage, renderFoodWarning, reduceFood};
  }

  document.readyState === 'loading' ? document.addEventListener('DOMContentLoaded', init) : init();
})();
