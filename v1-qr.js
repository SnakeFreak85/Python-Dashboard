(function(){
  'use strict';

  const TYPES = ['koenig','boas','geckos','spinnen'];

  function byId(id){ return document.getElementById(id); }

  function getDb(){
    window.db = window.db || {koenig:[],boas:[],geckos:[],spinnen:[],clutches:[],sales:[],archive:[]};
    TYPES.forEach(type => { if(!Array.isArray(window.db[type])) window.db[type] = []; });
    return window.db;
  }

  function escapeHtml(value){
    return String(value == null ? '' : value).replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
  }

  function getDisplayId(animal,index,type){
    if(typeof window.getDisplayId === 'function'){
      try{ return window.getDisplayId(animal,index,type); }catch(error){}
    }
    const prefix = {koenig:'KP',boas:'BOA',geckos:'LG',spinnen:'VS'}[type] || 'ID';
    animal.displayId = animal.displayId || animal.uid || (prefix + '-' + String(index + 1).padStart(3,'0'));
    animal.uid = animal.uid || animal.displayId;
    try{ localStorage.setItem('spd_v53', JSON.stringify(getDb())); }catch(error){}
    return animal.displayId;
  }

  function qrPayload(type,index){
    const db = getDb();
    const animal = db[type] && db[type][index];
    if(!animal) return null;
    const id = getDisplayId(animal,index,type);
    return {
      animal,
      id,
      text: id + '|' + (animal.name || '') + '|' + (animal.morph || animal.species || '') + '|' + (animal.birth || animal.hatchDate || '')
    };
  }

  function ensureQrModal(){
    let modal = byId('qrModal');
    if(modal) return modal;
    modal = document.createElement('div');
    modal.id = 'qrModal';
    modal.style.cssText = 'display:none;position:fixed;inset:0;background:rgba(0,0,0,.72);z-index:100000;overflow:auto;padding:16px';
    modal.innerHTML = '<div style="max-width:420px;margin:30px auto;background:#172331;color:#f5f7fb;border:1px solid #304255;border-radius:18px;padding:18px;text-align:center">'+
      '<h2 id="qrTitle">QR-Code</h2><div id="qrCodeBox" style="display:grid;place-items:center;background:#fff;border-radius:12px;padding:16px;margin:12px auto;min-height:260px"></div>'+
      '<p id="qrPlainText" style="word-break:break-word;color:#aab7c4"></p><button onclick="closeQr()">Schließen</button></div>';
    document.body.appendChild(modal);
    return modal;
  }

  function renderQrWithLibrary(box,text){
    if(typeof window.QRCode !== 'function') return false;
    try{
      box.innerHTML = '';
      new window.QRCode(box,{text,width:240,height:240,correctLevel:window.QRCode.CorrectLevel ? window.QRCode.CorrectLevel.M : undefined});
      return true;
    }catch(error){
      return false;
    }
  }

  function renderQrWithApi(box,text){
    const img = document.createElement('img');
    img.alt = 'QR-Code';
    img.width = 240;
    img.height = 240;
    img.style.maxWidth = '100%';
    img.src = 'https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=' + encodeURIComponent(text);
    box.innerHTML = '';
    box.appendChild(img);
  }

  function showQrData(type,index){
    const payload = qrPayload(type,index);
    if(!payload){ alert('Tier nicht gefunden. Bitte Seite neu laden.'); return; }
    const modal = ensureQrModal();
    const title = byId('qrTitle');
    const box = byId('qrCodeBox');
    const plain = byId('qrPlainText');
    modal.style.display = 'block';
    title.innerHTML = '📱 QR-Code<br><small>' + escapeHtml(payload.id) + ' · ' + escapeHtml(payload.animal.name || 'Tier') + '</small>';
    plain.textContent = payload.text;
    if(!renderQrWithLibrary(box,payload.text)) renderQrWithApi(box,payload.text);
  }

  function closeQr(){
    const modal = byId('qrModal');
    if(modal) modal.style.display = 'none';
  }

  function allAnimals(){
    const db = getDb();
    const list = [];
    TYPES.forEach(type => (db[type] || []).forEach((animal,index) => list.push({type,index,animal,id:getDisplayId(animal,index,type)})));
    return list;
  }

  function findAnimalByQr(){
    const input = byId('qrSearchId');
    const result = byId('qrSearchResult');
    const raw = (input && input.value || '').trim();
    const searchId = raw.split('|')[0].trim().toUpperCase();
    if(!searchId){ if(result) result.textContent = 'Bitte QR-ID eingeben oder scannen.'; return; }
    const hit = allAnimals().find(item => String(item.id || '').toUpperCase() === searchId);
    if(!hit){ if(result) result.textContent = 'Kein Tier gefunden.'; return; }
    if(result) result.innerHTML = 'Gefunden: <b>' + escapeHtml(hit.animal.name || 'Tier') + '</b> (' + escapeHtml(hit.id) + ')';
    if(typeof window.showPage === 'function') window.showPage(hit.type);
    setTimeout(() => {
      const card = document.querySelectorAll('#' + hit.type + ' .animal')[hit.index];
      if(card){
        card.scrollIntoView({behavior:'smooth',block:'center'});
        card.style.outline = '3px solid #69d2c4';
        setTimeout(() => { card.style.outline = ''; }, 2500);
      }
    }, 250);
  }

  function patchButtons(){
    TYPES.forEach(type => {
      const section = byId(type);
      if(!section) return;
      section.querySelectorAll('.animal').forEach((card,index) => {
        const buttons = Array.from(card.querySelectorAll('button'));
        buttons.forEach(button => {
          const attr = button.getAttribute('onclick') || '';
          if(attr.includes('showQrData')){
            button.onclick = function(event){ event.preventDefault(); showQrData(type,index); };
          }
        });
      });
    });
  }

  function patchRender(){
    if(window.__ngtQrRenderPatched || typeof window.render !== 'function') return;
    window.__ngtQrRenderPatched = true;
    const original = window.render;
    window.render = function(){
      const result = original.apply(this, arguments);
      patchButtons();
      return result;
    };
  }

  function init(){
    window.showQrData = showQrData;
    window.closeQr = closeQr;
    window.findAnimalByQr = findAnimalByQr;
    patchRender();
    patchButtons();
  }

  document.readyState === 'loading' ? document.addEventListener('DOMContentLoaded', init) : init();
})();
