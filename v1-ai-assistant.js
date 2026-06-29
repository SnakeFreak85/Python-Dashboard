(function(){
  'use strict';

  const TYPES=['koenig','boas','geckos','spinnen'];
  const TYPE_PREFIX={koenig:'KP',boas:'BOA',geckos:'LG',spinnen:'VS'};

  function byId(id){return document.getElementById(id);}
  function store(){return window.NGTStore||null;}
  function getDb(){const s=store();if(s&&typeof s.getDb==='function')return s.getDb();try{if(typeof db!=='undefined'&&db)return db;}catch(e){}return window.db||{};}
  function saveDb(){const s=store();const data=getDb();if(s&&typeof s.save==='function')s.save(data);else{try{localStorage.setItem('spd_v53',JSON.stringify(data));}catch(e){}}}
  function escapeHtml(v){return String(v==null?'':v).replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));}
  function makeUuid(){return (window.crypto&&crypto.randomUUID)?crypto.randomUUID():('ngt-'+Date.now().toString(36)+'-'+Math.random().toString(36).slice(2,10));}
  function normalizeAnimal(a,type,index){if(!a)return;const p=TYPE_PREFIX[type]||'ID';a.uuid=a.uuid||a.uid||makeUuid();a.uid=a.uid||a.uuid;a.displayId=a.displayId||(p+'-'+String(index+1).padStart(3,'0'));a.type=a.type||type;a.feeds=Array.isArray(a.feeds)?a.feeds:[];a.sheds=Array.isArray(a.sheds)?a.sheds:[];a.weights=Array.isArray(a.weights)?a.weights:[];}
  function allAnimals(){const data=getDb();const out=[];TYPES.forEach(type=>{if(!Array.isArray(data[type]))data[type]=[];data[type].forEach((animal,index)=>{normalizeAnimal(animal,type,index);out.push({type,index,animal});});});return out;}
  function norm(s){return String(s||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').trim();}
  function findAnimal(name){const key=norm(name);if(!key)return null;let exact=allAnimals().find(x=>[x.animal.name,x.animal.nickname,x.animal.rufname,x.animal.displayId,x.animal.uuid].some(v=>norm(v)===key));if(exact)return exact;return allAnimals().find(x=>[x.animal.name,x.animal.nickname,x.animal.rufname].some(v=>norm(v).includes(key)||key.includes(norm(v))));}
  function parseDate(value){const m=String(value||'').match(/(\d{1,2})[.\-/](\d{1,2})[.\-/](\d{2,4})/);if(!m)return '';const d=m[1].padStart(2,'0');const mo=m[2].padStart(2,'0');const y=m[3].length===2?'20'+m[3]:m[3];return y+'-'+mo+'-'+d;}
  function prettyDate(iso){if(!iso)return '-';const p=iso.split('-');return p.length===3?p[2]+'.'+p[1]+'.'+p[0]:iso;}
  function splitLines(text){return String(text||'').split(/\n|;/).map(x=>x.trim()).filter(Boolean);}
  function extractAnimalName(text){
    const patterns=[/bei\s+([\wäöüÄÖÜß\- ]+?)\s+(?:folgende|futter|fütter|haeut|häut|gewicht|gewichte|hinzu|eintragen|anlegen)/i,/für\s+([\wäöüÄÖÜß\- ]+?)\s+(?:folgende|futter|fütter|haeut|häut|gewicht|gewichte|hinzu|eintragen|anlegen)/i,/tier\s+([\wäöüÄÖÜß\- ]+?)\s/i];
    for(const p of patterns){const m=String(text).match(p);if(m)return m[1].trim();}
    const first=String(text).split('\n')[0];const m=first.match(/(?:bei|für)\s+([\wäöüÄÖÜß\- ]+)/i);return m?m[1].replace(/folgende.*/i,'').trim():'';
  }
  function feedEntryFromLine(line){
    const date=parseDate(line);if(!date)return null;
    const lower=norm(line);
    let prey='Ratte';if(lower.includes('maus'))prey='Maus';else if(lower.includes('asf'))prey='ASF';else if(lower.includes('kuken')||lower.includes('kueken'))prey='Küken';else if(lower.includes('heimchen'))prey='Heimchen';else if(lower.includes('schabe'))prey='Schabe';
    const gram=(line.match(/(\d+(?:[,.]\d+)?)\s*(?:g|gramm|gr)/i)||[])[1]||'';
    const qty=(line.match(/(?:x|menge)\s*(\d+)/i)||[])[1]||'1';
    return {date,prey,amount:gram?String(gram).replace(',','.'):'',size:gram?String(gram).replace(',','.')+'g':'',qty:Number(qty)||1,accepted:true,note:'KI Assistent'};
  }
  function weightEntryFromLine(line){const date=parseDate(line);if(!date)return null;const g=(line.match(/(\d+(?:[,.]\d+)?)\s*(?:g|gramm|gr)/i)||[])[1];if(!g)return null;return {date,weight:Number(String(g).replace(',','.')),note:'KI Assistent'};}
  function shedEntryFromLine(line){const date=parseDate(line);if(!date)return null;let quality='ok';const l=norm(line);if(l.includes('problem'))quality='Problem';else if(l.includes('schlecht'))quality='schlecht';else if(l.includes('vollstandig')||l.includes('komplett')||l.includes('gut'))quality='gut';return {date,quality,note:'KI Assistent'};}
  function foodStockFromLine(line){const m=line.match(/(.+?)\s*(?:-|:)\s*(\d+)\s*$/);if(m)return {name:m[1].replace(/^bestand\s*/i,'').trim(),qty:Number(m[2])||0};const m2=line.match(/(?:setze|fuge|füge|bestand)\s+(.+?)\s+(?:auf|mit)?\s*(\d+)/i);if(m2)return {name:m2[1].trim(),qty:Number(m2[2])||0};return null;}
  function commandType(text){const l=norm(text);if(l.includes('futterbestand')||l.includes('futterbestand')||l.includes('bestand an futter')||l.includes('futtertiere bestand'))return 'foodStock';if(l.includes('gewicht'))return 'weight';if(l.includes('haut')||l.includes('haeut'))return 'shed';if(l.includes('futter')||l.includes('futterung')||l.includes('fütterung')||l.includes('ratte')||l.includes('maus'))return 'feed';return 'unknown';}
  function addFeed(animalHit,entries){entries.forEach(e=>animalHit.animal.feeds.push(e));animalHit.animal.updatedAt=new Date().toISOString();}
  function addWeights(animalHit,entries){entries.forEach(e=>animalHit.animal.weights.push(e));animalHit.animal.updatedAt=new Date().toISOString();}
  function addSheds(animalHit,entries){entries.forEach(e=>animalHit.animal.sheds.push(e));animalHit.animal.updatedAt=new Date().toISOString();}
  function setFoodStock(entries){const data=getDb();if(!Array.isArray(data.foodInventory))data.foodInventory=[];entries.forEach(e=>{let item=data.foodInventory.find(x=>norm(x.name)===norm(e.name));if(item)item.qty=e.qty;else data.foodInventory.push({name:e.name,qty:e.qty});});}
  function parseCommand(text){
    const type=commandType(text);const lines=splitLines(text).filter(line=>parseDate(line)||/\d+\s*$/.test(line));
    if(type==='foodStock'){const entries=lines.map(foodStockFromLine).filter(Boolean);return {type,entries};}
    const animalName=extractAnimalName(text);const animal=findAnimal(animalName);if(!animal)return {type,error:'Tier nicht gefunden: '+(animalName||'kein Name erkannt')};
    if(type==='feed')return {type,animal,entries:lines.map(feedEntryFromLine).filter(Boolean)};
    if(type==='weight')return {type,animal,entries:lines.map(weightEntryFromLine).filter(Boolean)};
    if(type==='shed')return {type,animal,entries:lines.map(shedEntryFromLine).filter(Boolean)};
    return {type,error:'Befehl nicht erkannt.'};
  }
  function executeAssistantCommand(){
    const input=byId('aiAssistantInput');const out=byId('aiAssistantOutput');const text=input&&input.value||'';const parsed=parseCommand(text);
    if(parsed.error){out.innerHTML='<div class="feedPanel ngt-warn">❌ '+escapeHtml(parsed.error)+'</div>';return;}
    if(!parsed.entries||!parsed.entries.length){out.innerHTML='<div class="feedPanel ngt-warn">❌ Keine passenden Einträge erkannt.</div>';return;}
    if(parsed.type==='feed')addFeed(parsed.animal,parsed.entries);
    if(parsed.type==='weight')addWeights(parsed.animal,parsed.entries);
    if(parsed.type==='shed')addSheds(parsed.animal,parsed.entries);
    if(parsed.type==='foodStock')setFoodStock(parsed.entries);
    saveDb();if(typeof window.render==='function')window.render();
    const target=parsed.animal?(' bei '+(parsed.animal.animal.name||parsed.animal.animal.displayId)) : '';
    out.innerHTML='<div class="feedPanel">✅ '+parsed.entries.length+' Einträge gespeichert'+escapeHtml(target)+'.</div>'+parsed.entries.map(e=>'<div class="feedPanel">'+escapeHtml(prettyDate(e.date||''))+' · '+escapeHtml(e.prey||e.name||'')+' '+escapeHtml(e.size||e.weight||e.qty||'')+'</div>').join('');
  }
  function renderAssistantPage(){
    const content=document.querySelector('.content');if(!content)return;let section=byId('kiassistent');if(!section){section=document.createElement('div');section.id='kiassistent';section.className='section';content.appendChild(section);}
    section.innerHTML='<div class="card"><h2>🤖 KI Assistent</h2><p class="ngt-muted">Schreibe natürliche Befehle. Der Assistent erkennt Fütterungen, Häutungen, Gewichte und Futterbestände lokal/offline.</p><textarea id="aiAssistantInput" rows="10" style="width:100%;box-sizing:border-box;border-radius:12px;padding:12px;background:#0f1a25;color:#f5f7fb;border:1px solid #304255" placeholder="Füge bei Medusa folgende Fütterungen hinzu:\n19.06.2026 - 200 gramm Ratte\n21.06.2026 - 200 gramm Ratte\n30.06.2026 - 200 gramm Ratte"></textarea><button id="aiAssistantRun">Befehl ausführen</button><div id="aiAssistantOutput"></div></div>';
    byId('aiAssistantRun').onclick=executeAssistantCommand;
  }
  function addMenuItem(){const drawer=byId('drawer');if(!drawer||byId('menuKiAssistent'))return;const link=document.createElement('a');link.href='#';link.id='menuKiAssistent';link.textContent='🤖 KI Assistent';link.onclick=function(e){e.preventDefault();if(typeof window.showPage==='function')window.showPage('kiassistent');};drawer.appendChild(link);}
  function patchRender(){if(window.__ngtAiAssistantPatched||typeof window.render!=='function')return;window.__ngtAiAssistantPatched=true;const original=window.render;window.render=function(){const result=original.apply(this,arguments);addMenuItem();renderAssistantPage();return result;};}
  function init(){addMenuItem();renderAssistantPage();patchRender();window.NGTAIAssistant={parseCommand,executeAssistantCommand};}
  document.readyState==='loading'?document.addEventListener('DOMContentLoaded',init):init();
})();
