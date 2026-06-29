(function(){
  'use strict';
  function ready(fn){document.readyState==='loading'?document.addEventListener('DOMContentLoaded',fn):fn();}
  function parseDate(value){
    if(!value) return null;
    const text=String(value).trim();
    let match=text.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if(match) return new Date(Number(match[1]),Number(match[2])-1,Number(match[3]));
    match=text.match(/^(\d{1,2})\.(\d{1,2})\.(\d{4})/);
    if(match) return new Date(Number(match[3]),Number(match[2])-1,Number(match[1]));
    const parsed=new Date(text);
    return Number.isNaN(parsed.getTime())?null:parsed;
  }
  function sameDay(a,b){return a&&b&&a.getFullYear()===b.getFullYear()&&a.getMonth()===b.getMonth()&&a.getDate()===b.getDate();}
  function daysSince(dateText){
    const date=parseDate(dateText);
    if(!date) return Infinity;
    const today=new Date();
    const start=new Date(today.getFullYear(),today.getMonth(),today.getDate());
    const other=new Date(date.getFullYear(),date.getMonth(),date.getDate());
    return Math.floor((start-other)/86400000);
  }
  function lastDate(list){
    if(!Array.isArray(list)||!list.length) return '';
    const last=list[list.length-1];
    return typeof last==='object'?(last.date||''):String(last||'');
  }
  function groupText(obj){
    const keys=Object.keys(obj);
    return keys.length?keys.map(k=>k+': '+obj[k]).join('<br>'):'Keine Daten';
  }
  function metrics(){
    const ngt=window.NGT;
    const db=ngt.getDb();
    const animals=ngt.allAnimals();
    const byType={}, bySex={}, reminders=[], hatch=[];
    let overdue=0, today=0, weightWarnings=0, losses=0;
    const now=new Date();
    animals.forEach(({type,animal})=>{
      const label=ngt.TYPE_LABELS[type]||type;
      byType[label]=(byType[label]||0)+1;
      bySex[animal.sex||'Unbestimmt']=(bySex[animal.sex||'Unbestimmt']||0)+1;
      const lf=lastDate(animal.feeds);
      if(sameDay(parseDate(lf),now)) today++;
      if(daysSince(lf)>14){overdue++; reminders.push('Fütterung prüfen: '+(animal.name||animal.displayId));}
      if(!animal.weight&&!animal.weights.length){weightWarnings++; reminders.push('Gewicht fehlt: '+(animal.name||animal.displayId));}
    });
    (db.archive||[]).forEach(item=>{
      const text=[item.status,item.archiveReason,item.reason,item.notes].join(' ').toLowerCase();
      if(text.includes('verstorben')||text.includes('verlust')) losses++;
    });
    (db.clutches||[]).forEach(c=>{if(c.hatchDate) hatch.push((c.name||'Gelege')+' - '+c.hatchDate);});
    return {total:animals.length,byType,bySex,clutches:(db.clutches||[]).length,sales:(db.sales||[]).length,losses,overdue,today,weightWarnings,reminders:reminders.slice(0,8),hatch:hatch.slice(0,8)};
  }
  function go(id){if(typeof window.showPage==='function') window.showPage(id);}
  function renderDashboard(){
    if(!window.NGT) return;
    const home=document.getElementById('home');
    if(!home) return;
    const m=metrics();
    let box=document.getElementById('ngtDashboard');
    if(!box){box=document.createElement('div'); box.id='ngtDashboard'; box.className='card'; home.insertBefore(box,home.firstChild);}
    box.innerHTML='<h2>NG Terrarium 1.0</h2><p class="ngt-muted">Verwaltung für Bestand, Pflege, Nachzucht, Termine und Verkauf.</p>'+
      '<div class="ngt-grid">'+
      '<div class="ngt-stat">Gesamtbestand<strong>'+m.total+'</strong></div>'+
      '<div class="ngt-stat">Nachzuchten<strong>'+m.clutches+'</strong></div>'+
      '<div class="ngt-stat">Verkäufe<strong>'+m.sales+'</strong></div>'+
      '<div class="ngt-stat">Verluste<strong>'+m.losses+'</strong></div>'+
      '<div class="ngt-stat">Heute gefüttert<strong>'+m.today+'</strong></div>'+
      '<div class="ngt-stat">Überfällige Fütterungen<strong class="'+(m.overdue?'ngt-warn':'')+'">'+m.overdue+'</strong></div>'+
      '<div class="ngt-stat">Gewichtswarnungen<strong class="'+(m.weightWarnings?'ngt-warn':'')+'">'+m.weightWarnings+'</strong></div>'+
      '</div><div class="ngt-grid" style="margin-top:12px">'+
      '<div class="feedPanel"><b>Tiere nach Art</b><br>'+groupText(m.byType)+'</div>'+
      '<div class="feedPanel"><b>Tiere nach Geschlecht</b><br>'+groupText(m.bySex)+'</div>'+
      '<div class="feedPanel"><b>Erinnerungen</b><br>'+(m.reminders.length?m.reminders.join('<br>'):'Keine offenen Erinnerungen')+'</div>'+
      '<div class="feedPanel"><b>Schlupftermine</b><br>'+(m.hatch.length?m.hatch.join('<br>'):'Keine Termine')+'</div>'+
      '</div><h3>Schnellzugriffe</h3><div class="ngt-actions">'+
      '<button data-page="koenig">Königspythons</button><button data-page="boas">Boas</button><button data-page="geckos">Leopardgeckos</button><button data-page="spinnen">Vogelspinnen</button><button data-page="nachzucht">Nachzucht</button><button data-page="termine">Kalender</button><button data-page="backup">Backup</button></div>';
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
