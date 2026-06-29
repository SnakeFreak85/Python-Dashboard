(function(){
  'use strict';
  const VERSION='1.0.0';
  const TYPES=['koenig','boas','geckos','spinnen'];
  const TYPE_LABELS={koenig:'Königspython',boas:'Boas',geckos:'Leopardgeckos',spinnen:'Vogelspinnen'};

  function getDb(){
    window.db=window.db||{koenig:[],boas:[],geckos:[],spinnen:[],clutches:[],sales:[],archive:[]};
    TYPES.forEach(t=>{if(!Array.isArray(window.db[t])) window.db[t]=[];});
    ['clutches','sales','archive','health','documents','pairings'].forEach(k=>{if(!Array.isArray(window.db[k])) window.db[k]=[];});
    return window.db;
  }

  function uuid(){
    if(window.crypto&&typeof window.crypto.randomUUID==='function') return window.crypto.randomUUID();
    return 'ngt-'+Date.now().toString(36)+'-'+Math.random().toString(36).slice(2,10);
  }

  function asList(value){
    if(Array.isArray(value)) return value;
    if(typeof value==='string'&&value.trim()) return value.split(',').map(x=>x.trim()).filter(Boolean);
    return [];
  }

  function normalizeAnimal(a,type,index){
    if(!a||typeof a!=='object') return a;
    a.uuid=a.uuid||a.uid||uuid();
    a.uid=a.uid||a.uuid;
    a.nickname=a.nickname||a.rufname||'';
    a.species=a.species||a.art||TYPE_LABELS[type]||'';
    a.subspecies=a.subspecies||a.unterart||'';
    a.birthDate=a.birthDate||a.birth||'';
    a.hatchDate=a.hatchDate||a.birth||'';
    a.breeder=a.breeder||a.zuechter||'';
    a.purchaseDate=a.purchaseDate||a.kaufdatum||'';
    a.purchasePrice=a.purchasePrice||a.buyPrice||'';
    a.salePrice=a.salePrice||a.price||'';
    a.cites=a.cites||'';
    a.chipNumber=a.chipNumber||'';
    a.ringNumber=a.ringNumber||'';
    a.terrarium=a.terrarium||'';
    a.notes=a.notes||a.note||'';
    a.tags=asList(a.tags);
    a.photos=asList(a.photos);
    if(a.photo&&!a.photos.includes(a.photo)) a.photos.unshift(a.photo);
    a.documents=asList(a.documents);
    a.history=asList(a.history);
    a.health=Array.isArray(a.health)?a.health:[];
    a.feeds=Array.isArray(a.feeds)?a.feeds:[];
    a.sheds=Array.isArray(a.sheds)?a.sheds:[];
    a.weights=Array.isArray(a.weights)?a.weights:[];
    a.type=type;
    a.displayId=a.displayId||({koenig:'KP',boas:'BOA',geckos:'LG',spinnen:'VS'}[type]||'NGT')+'-'+String(index+1).padStart(3,'0');
    return a;
  }

  function normalizeDb(){
    const db=getDb();
    TYPES.forEach(t=>db[t].forEach((a,i)=>normalizeAnimal(a,t,i)));
    localStorage.setItem('spd_v53',JSON.stringify(db));
    localStorage.setItem('ngt_version',VERSION);
  }

  function allAnimals(){
    const db=getDb();
    const out=[];
    TYPES.forEach(type=>db[type].forEach((animal,index)=>out.push({type,index,animal:normalizeAnimal(animal,type,index)})));
    return out;
  }

  function escapeHtml(value){
    return String(value==null?'':value).replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
  }

  function patchSearch(){
    const original=window.searchAnimals;
    window.searchAnimals=function(){
      const input=document.getElementById('globalSearch');
      const box=document.getElementById('searchResults');
      const q=(input&&input.value||'').toLowerCase().trim();
      if(!q){if(box) box.style.display='none'; return;}
      const hits=allAnimals().filter(({animal})=>[
        animal.uuid,animal.uid,animal.displayId,animal.name,animal.nickname,animal.species,animal.subspecies,
        animal.morph,animal.sex,animal.status,animal.terrarium,animal.breeder,animal.origin,(animal.tags||[]).join(' '),animal.notes
      ].join(' ').toLowerCase().includes(q));
      if(!box&&typeof original==='function') return original();
      box.style.display='block';
      box.innerHTML='<h3>Globale Suche</h3>'+(hits.length?hits.map(hit=>
        '<div class="animal"><b>'+escapeHtml(hit.animal.name||hit.animal.displayId)+'</b><br>'+escapeHtml(hit.animal.species||hit.type)+' · '+escapeHtml(hit.animal.morph||'-')+'<br><button data-ngt-open="'+hit.type+':'+hit.index+'">Profil öffnen</button></div>'
      ).join(''):'Keine Treffer');
      box.querySelectorAll('[data-ngt-open]').forEach(btn=>btn.onclick=function(){
        const parts=this.getAttribute('data-ngt-open').split(':');
        if(window.NGT&&window.NGT.openAnimalProfile) window.NGT.openAnimalProfile(parts[0],Number(parts[1]));
      });
    };
  }

  window.NGT=window.NGT||{};
  Object.assign(window.NGT,{version:VERSION,TYPES,TYPE_LABELS,getDb,allAnimals,normalizeDb,normalizeAnimal,escapeHtml,asList});

  function init(){
    document.body.classList.add('ngt-v1');
    normalizeDb();
    patchSearch();
  }

  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',init);
  else init();
})();
