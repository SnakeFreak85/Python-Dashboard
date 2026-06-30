(function(){
'use strict';
function daysSince(date){const t=Date.parse(date||'');return t?Math.floor((Date.now()-t)/86400000):9999;}
function latest(list){return (list||[]).slice().sort((a,b)=>String(b.date||'').localeCompare(String(a.date||'')))[0]||null;}
function buildInsights(animals){
 const feeding=[];const weights=[];const refusals=[];const food=[];
 animals.forEach(item=>{const a=item.a;const lastFeed=latest(a.feeds);const lastWeight=latest(a.weights);const feedDays=daysSince(lastFeed&&lastFeed.date);const weightDays=daysSince(lastWeight&&lastWeight.date);if(!lastFeed||feedDays>=14)feeding.push({d:lastFeed?lastFeed.date:'-',txt:a.name+': Fütterung prüfen'});if(!lastWeight||weightDays>=42)weights.push({d:lastWeight?lastWeight.date:'-',txt:a.name+': Gewicht aktualisieren'});const recent=(a.feeds||[]).slice().sort((x,y)=>String(y.date||'').localeCompare(String(x.date||''))).slice(0,3);if(recent.length>=3&&recent.every(f=>f.accepted===false))refusals.push({d:recent[0].date,txt:a.name+': 3 Verweigerungen in Folge'});});
 (NGTStore.data().foodInventory||[]).forEach(f=>{if(Number(f.qty||0)<=3)food.push({d:'',txt:f.name+': niedriger Bestand ('+Number(f.qty||0)+')'});});
 return {feeding,weights,refusals,food};
}
function render(){
 const all=NGTStore.allAnimals().filter(x=>x.a.status!=='Archiv');
 const buy=all.reduce((s,x)=>s+Number(x.a.buyPrice||0),0);
 const mv=all.reduce((s,x)=>s+NGTStore.market(x.a),0);
 const foodItems=(NGTStore.data().foodInventory||[]).filter(x=>Number(x.qty)>0);
 let recent=[];all.forEach(x=>{recent.push(...NGTUI.timeline(x.a).map(r=>({d:r.d,txt:x.a.name+': '+r.txt})));});recent.sort((a,b)=>String(b.d).localeCompare(String(a.d)));
 const ins=buildInsights(all);const notes=[...ins.feeding.slice(0,5),...ins.weights.slice(0,5),...ins.refusals,...ins.food];
 const recs=window.NGTAIRecommendations?NGTAIRecommendations.build():[];
 return `<div class="card"><h2>Willkommen</h2><input placeholder="🔎 Tier suchen..." oninput="NGTDashboard.search(this.value)"><div id="searchBox"></div><p class="muted">V500 Modular: stabile Basis für Bestand, Pflege, Futter, QR und KI.</p></div>
 <div class="card"><h2>🤖 KI Assistent</h2><p class="muted">Schnelle Eingabe und intelligente Fragen.</p><button onclick="NGT500.route('assistant')">KI Assistent öffnen</button></div>
 <div class="card"><h2>KI Empfehlungen</h2><div class="grid"><div class="stat">Kritisch/Warnung<b>${recs.length}</b></div><div class="stat">Bestand<b>${all.length}</b></div></div>${window.NGTAIRecommendations?NGTAIRecommendations.render(recs.slice(0,8)):'<p class="muted">Empfehlungsmodul nicht geladen.</p>'}</div>
 <div class="card"><h2>Heute / Hinweise</h2><div class="grid"><div class="stat">Fütterung prüfen<b>${ins.feeding.length}</b></div><div class="stat">Gewichte fehlen<b>${ins.weights.length}</b></div><div class="stat">Verweigerungen<b>${ins.refusals.length}</b></div><div class="stat">Futter niedrig<b>${ins.food.length}</b></div></div>${notes.length?NGTUI.list(notes):'<p class="muted">Keine aktuellen Hinweise.</p>'}</div>
 <div class="card"><h2>📊 Bestandsübersicht</h2><div class="grid"><div class="stat">Gesamtbestand<b>${all.length}</b></div><div class="stat">Kaufwert<b>${NGT500.money(buy)}</b></div><div class="stat">Marktwert<b>${NGT500.money(mv)}</b></div><div class="stat">Differenz<b>${NGT500.money(mv-buy)}</b></div></div></div>
 <div class="card"><h2>🥩 Futterbestand</h2>${foodItems.length?foodItems.map(x=>`<div class="subcard"><b>${NGT500.esc(x.name)}</b><br>Bestand: ${Number(x.qty||0)}</div>`).join(''):'<p class="muted">Kein Futterbestand.</p>'}</div>
 <div class="card"><h2>🕘 Letzte Aktivitäten</h2>${NGTUI.list(recent.slice(0,12))}</div>`;
}
function search(q){q=String(q||'').toLowerCase();const rows=NGTStore.allAnimals().filter(x=>JSON.stringify(x.a).toLowerCase().includes(q));document.getElementById('searchBox').innerHTML=q?rows.map(NGTUI.animalCard).join('')||'<p class="muted">Keine Treffer.</p>':'';}
window.NGTDashboard={search};NGT500.register('dashboard',{render});
})();
