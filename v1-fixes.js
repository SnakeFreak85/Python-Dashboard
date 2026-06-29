(function(){
  'use strict';

  const TYPES = ['koenig','boas','geckos','spinnen'];

  function byId(id){ return document.getElementById(id); }

  function ensureDb(){
    window.db = window.db || {koenig:[],boas:[],geckos:[],spinnen:[],clutches:[],sales:[],archive:[]};
    TYPES.forEach(type => { if(!Array.isArray(window.db[type])) window.db[type] = []; });
    ['clutches','sales','archive'].forEach(key => { if(!Array.isArray(window.db[key])) window.db[key] = []; });
    return window.db;
  }

  function saveDb(){
    try{ localStorage.setItem('spd_v53', JSON.stringify(ensureDb())); }catch(error){}
  }

  function euro(value){
    const number = Number(value || 0);
    return number.toLocaleString('de-DE',{minimumFractionDigits:2,maximumFractionDigits:2}) + ' €';
  }

  function toNumber(value){
    if(value == null || value === '') return 0;
    if(typeof value === 'number') return Number.isFinite(value) ? value : 0;
    const normalized = String(value).replace(/[^0-9,.-]/g,'').replace(',', '.');
    const parsed = Number(normalized);
    return Number.isFinite(parsed) ? parsed : 0;
  }

  function animalMarketValue(animal){
    const explicit = toNumber(animal.salePrice || animal.price || animal.marketValue || animal.value);
    if(explicit > 0) return explicit;
    if(typeof window.calculateAdvancedMarketValue === 'function'){
      try{
        const calculated = toNumber(window.calculateAdvancedMarketValue(animal));
        if(calculated > 0) return calculated;
      }catch(error){}
    }
    if(typeof window.estimateMarketValue === 'function'){
      try{
        const estimated = toNumber(window.estimateMarketValue(animal));
        if(estimated > 0) return estimated;
      }catch(error){}
    }
    return toNumber(animal.buyPrice || animal.purchasePrice || animal.einkaufspreis);
  }

  function closeMenu(){
    const drawer = byId('drawer');
    const overlay = byId('overlay');
    if(drawer) drawer.classList.remove('open');
    if(overlay) overlay.classList.remove('show');
  }

  function openMenu(){
    const drawer = byId('drawer');
    const overlay = byId('overlay');
    if(drawer) drawer.classList.add('open');
    if(overlay) overlay.classList.add('show');
  }

  function showPage(id){
    const target = byId(id);
    if(!target) return;
    document.querySelectorAll('.section').forEach(section => section.classList.remove('active'));
    target.classList.add('active');
    if(id === 'projekte' && typeof window.renderProjectPlanner === 'function'){
      try{ window.renderProjectPlanner(); }catch(error){}
    }
    closeMenu();
    window.scrollTo({top:0,behavior:'smooth'});
  }

  function getDisplayId(animal,index,type){
    const prefix = {koenig:'KP',boas:'BOA',geckos:'LG',spinnen:'VS'}[type] || 'ID';
    if(!animal.displayId || !String(animal.displayId).startsWith(prefix+'-')){
      animal.displayId = prefix + '-' + String(index + 1).padStart(3,'0');
      saveDb();
    }
    return animal.displayId;
  }

  function allAnimals(){
    const db = ensureDb();
    const out = [];
    TYPES.forEach(type => {
      (db[type] || []).forEach((animal,index) => out.push({type,index,animal}));
    });
    return out;
  }

  function dashboardInfo(){
    const db = ensureDb();
    const animals = allAnimals();
    const total = animals.length;
    let inventoryValue = 0;
    let purchaseValue = 0;
    animals.forEach(({animal}) => {
      inventoryValue += animalMarketValue(animal);
      purchaseValue += toNumber(animal.buyPrice || animal.purchasePrice || animal.einkaufspreis);
    });
    return '<div class="card"><h3>📊 Übersicht</h3>'+
      'Gesamtbestand: '+total+'<br>'+
      '💰 Bestandswert: '+euro(inventoryValue)+'<br>'+
      '💵 Kaufwert: '+euro(purchaseValue)+'<br>'+
      '📁 Archiv: '+(db.archive||[]).length+'<br>'+
      '🐣 Nachzuchten: '+(db.clutches||[]).length+'</div>';
  }

  function refreshOverview(){
    const dash = byId('dashInfo');
    if(dash){ dash.innerHTML = dashboardInfo(); }
  }

  function findAnimalByQr(){
    const input = byId('qrSearchId');
    const result = byId('qrSearchResult');
    const raw = (input && input.value || '').trim();
    const id = raw.split('|')[0].trim().toUpperCase();
    if(!id){ if(result) result.innerHTML = 'Bitte QR-ID eingeben oder scannen.'; return; }

    const hit = allAnimals().find(item => getDisplayId(item.animal,item.index,item.type).toUpperCase() === id);
    if(!hit){ if(result) result.innerHTML = '❌ Kein Tier gefunden'; return; }

    if(result) result.innerHTML = '✅ Gefunden: <b>' + (hit.animal.name || 'Tier') + '</b> (' + id + ')';
    showPage(hit.type);
    setTimeout(() => {
      const cards = document.querySelectorAll('#' + hit.type + ' .animal');
      const card = cards[hit.index];
      if(card){
        card.scrollIntoView({behavior:'smooth',block:'center'});
        card.style.outline = '3px solid #69d2c4';
        setTimeout(() => { card.style.outline = ''; }, 3000);
      }
    }, 250);
  }

  function showQrData(type,index){
    const db = ensureDb();
    const animal = db[type] && db[type][index];
    if(!animal) return;
    const id = getDisplayId(animal,index,type);
    const birth = animal.birth || animal.hatchDate || '-';
    const morph = animal.morph || animal.species || '-';
    const qrText = id + '|' + (animal.name || '') + '|' + morph + '|' + birth;

    const modal = byId('qrModal');
    const title = byId('qrTitle');
    const box = byId('qrCodeBox');
    const input = byId('qrSearchId');
    if(input) input.value = id;
    if(!modal || !title || !box){ alert(qrText); return; }

    modal.style.display = 'block';
    title.innerHTML = '🏷️ ' + id + '<br>🐍 ' + (animal.name || 'Tier') + '<br>🧬 ' + morph + '<br>🐣 ' + birth;
    box.innerHTML = '';

    if(typeof window.QRCode === 'function'){
      new window.QRCode(box,{text:qrText,width:220,height:220});
    }else{
      box.innerHTML = '<p>QR-Bibliothek nicht geladen.</p><code>' + qrText + '</code>';
    }
  }

  function closeQr(){
    const modal = byId('qrModal');
    if(modal) modal.style.display = 'none';
  }

  function toggleQrScanner(){
    const el = byId('qrScanner');
    if(!el) return;
    if(el.style.display === 'block'){
      el.style.display = 'none';
      if(window.qrScannerInstance){ try{ window.qrScannerInstance.stop(); }catch(error){} }
      return;
    }
    el.style.display = 'block';
    el.innerHTML = '';
    if(typeof window.Html5Qrcode === 'undefined'){
      el.innerHTML = 'Scanner-Bibliothek nicht geladen. Du kannst die ID manuell eingeben.';
      return;
    }
    try{
      window.qrScannerInstance = new window.Html5Qrcode('qrScanner');
      window.qrScannerInstance.start(
        {facingMode:'environment'},
        {fps:10, qrbox:{width:250,height:250}},
        decodedText => {
          const input = byId('qrSearchId');
          if(input) input.value = decodedText;
          findAnimalByQr();
          try{ window.qrScannerInstance.stop(); }catch(error){}
          el.style.display = 'none';
        }
      ).catch(error => {
        el.innerHTML = 'Kamera konnte nicht gestartet werden. Bitte Berechtigung prüfen oder ID manuell eingeben.';
      });
    }catch(error){
      el.innerHTML = 'QR-Scanner konnte nicht gestartet werden.';
    }
  }

  function wireMenuLinks(){
    document.querySelectorAll('#drawer a[onclick]').forEach(link => {
      const match = String(link.getAttribute('onclick') || '').match(/showPage\('([^']+)'\)/);
      if(!match) return;
      link.removeAttribute('onclick');
      link.addEventListener('click', event => {
        event.preventDefault();
        showPage(match[1]);
      });
    });
  }

  function wireQuickLinks(){
    document.querySelectorAll('[data-page],[data-ngt-page]').forEach(button => {
      const page = button.getAttribute('data-page') || button.getAttribute('data-ngt-page');
      button.addEventListener('click', event => {
        event.preventDefault();
        showPage(page);
      });
    });
  }

  function patchRender(){
    if(window.__ngtValueRenderPatched || typeof window.render !== 'function') return;
    window.__ngtValueRenderPatched = true;
    const original = window.render;
    window.render = function(){
      const result = original.apply(this, arguments);
      refreshOverview();
      return result;
    };
  }

  function init(){
    ensureDb();
    window.openMenu = openMenu;
    window.closeMenu = closeMenu;
    window.showPage = showPage;
    window.getDisplayId = getDisplayId;
    window.dashboardInfo = dashboardInfo;
    window.findAnimalByQr = findAnimalByQr;
    window.showQrData = showQrData;
    window.closeQr = closeQr;
    window.toggleQrScanner = toggleQrScanner;
    wireMenuLinks();
    wireQuickLinks();
    patchRender();
    refreshOverview();
  }

  document.readyState === 'loading' ? document.addEventListener('DOMContentLoaded', init) : init();
})();
