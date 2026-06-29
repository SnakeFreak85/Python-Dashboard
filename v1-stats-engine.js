(function(){
  'use strict';

  const TYPES=['koenig','boas','geckos','spinnen'];
  const TYPE_LABELS={koenig:'Königspythons',boas:'Boas',geckos:'Leopardgeckos',spinnen:'Vogelspinnen'};
  const TYPE_BASE={koenig:120,boas:180,geckos:60,spinnen:35};
  const TYPE_MIN={koenig:50,boas:70,geckos:20,spinnen:10};
  const TYPE_MAX={koenig:10000,boas:12000,geckos:2500,spinnen:800};
  const MORPH_RULES=[
    ['normal',0.65],['classic',0.65],['wild',0.65],['wildfarben',0.65],
    ['pastel',1.15],['fire',1.2],['yellow belly',1.2],['enchi',1.25],['banana',1.45],['pinstripe',1.25],
    ['mojave',1.35],['lesser',1.35],['butter',1.3],['phantom',1.4],['spotnose',1.6],['leopard',1.55],
    ['clown',3.2],['pied',2.8],['piebald',2.8],['ultramel',3.0],['monsoon',8.0],['desert ghost',3.6],['dg',3.6],
    ['hypo',1.8],['ghost',1.8],['axanthic',2.4],['lavender',3.2],['albino',1.7],['black pastel',1.7],['cinnamon',1.4],
    ['het',1.25],['poss',1.1],['super',1.6],['combo',2.0]
  ];

  function store(){return window.NGTStore||null;}
  function getDb(){const s=store();if(s&&typeof s.getDb==='function')return s.getDb();try{if(typeof db!=='undefined'&&db)return db;}catch(e){}return window.db||{};}
  function money(n){return Number(n||0).toLocaleString('de-DE',{minimumFractionDigits:2,maximumFractionDigits:2})+' €';}
  function num(v){
    if(v==null||v==='')return 0;
    if(typeof v==='number')return Number.isFinite(v)?v:0;
    const raw=String(v).trim().replace(/\s/g,'').replace(/€/g,'');
    let normalized=raw;
    if(raw.includes(',')&&raw.includes('.')) normalized=raw.replace(/\./g,'').replace(',','.');
    else if(raw.includes(',')) normalized=raw.replace(',','.');
    const parsed=Number(normalized.replace(/[^0-9.-]/g,''));
    return Number.isFinite(parsed)?parsed:0;
  }
  function clamp(v,min,max){return Math.max(min,Math.min(max,v));}
  function allAnimals(){const data=getDb();const out=[];TYPES.forEach(type=>(data[type]||[]).forEach((animal,index)=>out.push({type,index,animal})));return out;}
  function purchaseValue(animal){return num(animal.buyPrice||animal.purchasePrice||animal.einkaufspreis||animal.cost||animal.kaufpreis);}
  function speciesBase(type,animal){
    const art=String(animal.species||animal.art||animal.type||type||'').toLowerCase();
    if(art.includes('boa'))return 180;
    if(art.includes('gecko'))return 60;
    if(art.includes('spinne')||art.includes('tarantel'))return 35;
    if(art.includes('python')||art.includes('könig')||art.includes('koenig')||type==='koenig')return 120;
    return TYPE_BASE[type]||80;
  }
  function morphFactor(animal){
    const morph=String(animal.morph||animal.Morph||'').toLowerCase();
    if(!morph)return 1;
    let factor=1;
    MORPH_RULES.forEach(([key,val])=>{if(morph.includes(key))factor*=val;});
    const separators=(morph.match(/[+,/]/g)||[]).length;
    if(separators)factor*=1+Math.min(separators,4)*0.18;
    return clamp(factor,0.45,12);
  }
  function sexFactor(animal){const sex=String(animal.sex||animal.gender||animal.geschlecht||'').toLowerCase();if(sex.includes('0.1')||sex.includes('weib')||sex==='f')return 1.15;if(sex.includes('1.0')||sex.includes('män')||sex.includes('maen')||sex==='m')return 1.0;return 0.95;}
  function statusFactor(animal){const status=String(animal.status||'').toLowerCase();if(status.includes('verkauft')||status.includes('tot')||status.includes('archiv'))return 0;if(status.includes('zucht')||status.includes('adult'))return 1.18;if(status.includes('juvenil')||status.includes('nz'))return 0.9;return 1;}
  function estimatedMarketValue(type,animal){
    const explicit=num(animal.marketValue||animal.estimatedValue||animal.schätzwert||animal.schaetzwert);
    if(explicit>0)return clamp(explicit,TYPE_MIN[type]||0,TYPE_MAX[type]||10000);
    const base=speciesBase(type,animal);
    const estimated=base*morphFactor(animal)*sexFactor(animal)*statusFactor(animal);
    return Math.round(clamp(estimated,TYPE_MIN[type]||0,TYPE_MAX[type]||10000));
  }
  function stats(){
    const data=getDb();const animals=allAnimals();let purchase=0,market=0;const byType={};
    TYPES.forEach(t=>byType[t]=0);
    animals.forEach(({type,animal})=>{byType[type]++;purchase+=purchaseValue(animal);market+=estimatedMarketValue(type,animal);});
    return {total:animals.length,purchase,market,profit:market-purchase,archive:(data.archive||[]).length,clutches:(data.clutches||[]).length,sales:(data.sales||[]).length,byType};
  }
  function removeDuplicateCards(home){
    Array.from(home.querySelectorAll('.card')).forEach(card=>{
      if(card.id==='ngtUnifiedStats')return;
      const text=(card.textContent||'').replace(/\s+/g,' ').trim();
      if(text.includes('V329 Bestandsübersicht')||text.includes('Bestandswert:')||text.includes('Einkaufswert:')||text.includes('Marktwert:')||text.includes('Potenzial:')||text.includes('Gesamtbestand:')){
        if(text.includes('Übersicht')||text.includes('Bestandsübersicht'))card.remove();
      }
    });
  }
  function renderStats(){
    const home=document.getElementById('home');if(!home)return;
    removeDuplicateCards(home);
    let box=document.getElementById('ngtUnifiedStats');
    if(!box){box=document.createElement('div');box.id='ngtUnifiedStats';box.className='card';home.insertBefore(box,home.firstChild);}
    const s=stats();
    box.innerHTML='<h2>📊 Bestandsübersicht</h2>'+
      '<p>Gesamtbestand: <b>'+s.total+'</b></p>'+
      '<p>💵 Kaufwert: <b>'+money(s.purchase)+'</b><br>💰 geschätzter Marktwert: <b>'+money(s.market)+'</b><br>📈 Differenz: <b>'+money(s.profit)+'</b></p>'+
      '<p>📁 Archiv: '+s.archive+'<br>🐣 Nachzuchten: '+s.clutches+'<br>🤝 Verkäufe: '+s.sales+'</p>'+
      '<p class="ngt-muted">Marktwert = Schätzung aus Art, Morph, Geschlecht und Status mit Sicherheitsgrenzen.</p>';
  }
  function patchLegacyCalculators(){
    window.calculateAdvancedMarketValue=function(animal){return estimatedMarketValue(animal&&animal.type||'koenig',animal||{});};
    window.estimateMarketValue=function(animal){return estimatedMarketValue(animal&&animal.type||'koenig',animal||{});};
    window.dashboardInfo=function(){renderStats();return '';};
  }
  function patchRender(){if(window.__ngtStatsRenderPatched||typeof window.render!=='function')return;window.__ngtStatsRenderPatched=true;const original=window.render;window.render=function(){const result=original.apply(this,arguments);renderStats();return result;};}
  function init(){patchLegacyCalculators();patchRender();renderStats();setTimeout(renderStats,300);setTimeout(renderStats,1000);window.NGTStats={stats,estimatedMarketValue,purchaseValue,renderStats};}
  document.readyState==='loading'?document.addEventListener('DOMContentLoaded',init):init();
})();
