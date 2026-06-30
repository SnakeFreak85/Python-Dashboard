(function(){
'use strict';
function last(list){return (list||[]).slice().sort((a,b)=>String(b.date||'').localeCompare(String(a.date||'')))[0]||null;}
function percent(a,b){return b?Math.round((a/b)*100):0;}
function render(){
 const animals=NGTStore.allAnimals().filter(x=>x.a.status!=='Archiv');
 let feeds=0,ok=0,no=0,sheds=0,weights=0,buy=0,val=0;
 const rows=[];
 animals.forEach(x=>{
  const a=x.a;
  feeds+=(a.feeds||[]).length;
  ok+=(a.feeds||[]).filter(f=>f.accepted!==false).length;
  no+=(a.feeds||[]).filter(f=>f.accepted===false).length;
  sheds+=(a.sheds||[]).length;
  weights+=(a.weights||[]).length;
  buy+=Number(a.buyPrice||0);
  val+=NGTStore.market(a);
  const w=(a.weights||[]).slice().sort((p,q)=>String(p.date||'').localeCompare(String(q.date||'')));
  if(w.length>=2){rows.push({d:w[w.length-1].date,txt:a.name+': '+(Number(w[w.length-1].weight)-Number(w[0].weight))+'g Entwicklung'});}
 });
 return `<div class="card"><h2>📊 Analyse</h2><div class="grid"><div class="stat">Fütterungsquote<b>${percent(ok,feeds)}%</b></div><div class="stat">Verweigerungen<b>${no}</b></div><div class="stat">Häutungen<b>${sheds}</b></div><div class="stat">Gewichte<b>${weights}</b></div></div></div><div class="card"><h2>💰 Wertanalyse</h2><div class="grid"><div class="stat">Kaufwert<b>${NGT500.money(buy)}</b></div><div class="stat">Schätzwert<b>${NGT500.money(val)}</b></div><div class="stat">Differenz<b>${NGT500.money(val-buy)}</b></div><div class="stat">Tiere<b>${animals.length}</b></div></div></div><div class="card"><h2>⚖️ Gewichtsentwicklung</h2>${rows.length?NGTUI.list(rows):'<p class="muted">Noch nicht genug Gewichtsdaten.</p>'}</div>`;
}
NGT500.register('analytics',{render});
})();
