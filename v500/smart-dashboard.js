(function(){
'use strict';
function days(date){return window.NGTAIManager?NGTAIManager.daysSince(date):9999}
function latest(list){return window.NGTAIManager?NGTAIManager.latest(list):(list||[]).slice(-1)[0]||null}
function animals(){return NGTStore.allAnimals().filter(x=>x.a.status!=='Archiv')}
function foodDays(){
 const all=animals();const inv=NGTStore.data().foodInventory||[];let min=9999,rows=[];
 inv.forEach(f=>{const name=NGTAIEngine.norm(f.name);const users=all.filter(x=>NGTAIEngine.norm(x.a.defaultFeeder||x.a.futterStandard||'')===name);const avgDays=users.length?Math.round(users.reduce((s,x)=>{const feeds=(x.a.feeds||[]).map(y=>y.date).filter(Boolean).sort();if(feeds.length<2)return s+14;let sum=0,c=0;for(let i=1;i<feeds.length;i++){const a=Date.parse(feeds[i-1]),b=Date.parse(feeds[i]);if(a&&b){sum+=(b-a)/86400000;c++}}return s+(c?sum/c:14)},0)/users.length):14;const qty=Number(f.qty||0);const usePerDay=users.length/Math.max(avgDays,1);const rem=usePerDay?Math.floor(qty/usePerDay):9999;if(rem<min)min=rem;rows.push({name:f.name,qty,users:users.length,days:rem===9999?'-':rem});});
 return {min:min===9999?'-':min,rows};
}
function trend(){const all=animals();let up=0,down=0,stable=0;all.forEach(x=>{const w=(x.a.weights||[]).slice().sort((a,b)=>String(a.date||'').localeCompare(String(b.date||'')));if(w.length<2)return stable++;const diff=Number(w[w.length-1].weight||0)-Number(w[w.length-2].weight||0);if(diff>0)up++;else if(diff<0)down++;else stable++;});return {up,down,stable}}
function priorityRows(){
 const rows=[];animals().forEach(x=>{const a=x.a;const lf=latest(a.feeds),lw=latest(a.weights),lh=latest(a.health);const fd=days(lf&&lf.date),wd=days(lw&&lw.date);const recent=(a.feeds||[]).slice().sort((p,q)=>String(q.date||'').localeCompare(String(p.date||''))).slice(0,3);
 if(recent.length>=2&&recent.slice(0,2).every(f=>f.accepted===false))rows.push({level:3,txt:a.name+' hat wiederholt verweigert'});
 if(lw){const w=(a.weights||[]).slice().sort((p,q)=>String(p.date||'').localeCompare(String(q.date||'')));if(w.length>=2&&Number(w[w.length-1].weight)<Number(w[w.length-2].weight))rows.push({level:3,txt:a.name+' hat Gewicht verloren'});}
 if(!lf||fd>=21)rows.push({level:2,txt:a.name+' Fütterung überfällig/prüfen'});else if(fd>=14)rows.push({level:1,txt:a.name+' bald füttern'});
 if(!lw||wd>=60)rows.push({level:2,txt:a.name+' Gewicht aktualisieren'});
 if(lh&&String(lh.status||'').toLowerCase()!=='abgeschlossen')rows.push({level:2,txt:a.name+' offene Gesundheit: '+(lh.title||lh.type||'Eintrag')});
 });
 (NGTStore.data().foodInventory||[]).forEach(f=>{if(Number(f.qty||0)<=0)rows.push({level:3,txt:f.name+' ist leer'});else if(Number(f.qty||0)<=3)rows.push({level:2,txt:f.name+' niedriger Bestand'});});
 return rows.sort((a,b)=>b.level-a.level).slice(0,12);
}
function render(){
 const all=animals();const fd=foodDays();const tr=trend();const rows=priorityRows();const due=window.NGTAIManager?NGTAIManager.today():{feed:[],weight:[]};
 return `<div class="card"><h2>Smart Dashboard</h2><div class="grid"><div class="stat">Heute füttern<b>${due.feed.length}</b></div><div class="stat">Wiegen<b>${due.weight.length}</b></div><div class="stat">Warnungen<b>${rows.filter(r=>r.level>=2).length}</b></div><div class="stat">Futter reicht<b>${fd.min}</b><span class="muted"> Tage</span></div></div><div class="btnRow"><button onclick="NGT500.route('chat')">KI-Chat</button><button onclick="NGT500.route('assistant')">Schnelleingabe</button></div></div><div class="card"><h2>Prioritäten</h2>${rows.length?rows.map(r=>`<div class="subcard ${r.level>=3?'danger':r.level>=2?'ok':''}">${NGT500.esc(r.txt)}</div>`).join(''):'<p class="muted">Keine dringenden Prioritäten.</p>'}</div><div class="card"><h2>Trends</h2><div class="grid"><div class="stat">Gewicht steigend<b>${tr.up}</b></div><div class="stat">Gewicht fallend<b>${tr.down}</b></div><div class="stat">Stabil/unklar<b>${tr.stable}</b></div><div class="stat">Tiere gesamt<b>${all.length}</b></div></div></div><div class="card"><h2>Futterprognose</h2>${fd.rows.length?fd.rows.map(x=>`<div class="subcard"><b>${NGT500.esc(x.name)}</b><br>Bestand: ${x.qty}<br>Tiere mit Standardfutter: ${x.users}<br>Prognose: ${x.days} Tage</div>`).join(''):'<p class="muted">Kein Futterbestand vorhanden.</p>'}</div>`;
}
window.NGTSmartDashboard={render,foodDays,trend,priorityRows};
})();
