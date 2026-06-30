(function(){
'use strict';
function item(date,type,title,text,img){return {date:date||'',type,title,text:text||'',img:img||''}}
function build(a){
 const rows=[];
 if(a.birth)rows.push(item(a.birth,'birth','Geburt','Geburtsdatum'));
 if(a.purchaseDate)rows.push(item(a.purchaseDate,'purchase','Kauf','Kaufwert: '+(a.buyPrice||0)+' EUR'));
 (a.feeds||[]).forEach(f=>rows.push(item(f.date,'feed',f.accepted===false?'Fütterung verweigert':'Fütterung',((f.amount||'')+'g '+(f.prey||'')).trim())));
 (a.sheds||[]).forEach(s=>rows.push(item(s.date,'shed','Häutung',s.complete===false?'unvollständig':'vollständig')));
 (a.weights||[]).forEach(w=>rows.push(item(w.date,'weight','Gewicht',w.weight+'g')));
 (a.health||[]).forEach(h=>rows.push(item(h.date,'health',h.type||'Gesundheit',(h.title||'')+' '+(h.status||'')+' '+(h.note||''))));
 (a.photos||[]).forEach(p=>rows.push(item(p.date,'photo','Foto',((p.type||'Sonstige')+' '+(p.note||'')).trim(),p.data)));
 rows.sort((x,y)=>String(y.date||'').localeCompare(String(x.date||''))||String(y.type).localeCompare(String(x.type)));
 return rows;
}
function icon(t){return {birth:'🎂',purchase:'🛒',feed:'🍽',shed:'🧤',weight:'⚖️',health:'🩺',photo:'📷'}[t]||'•'}
function summary(a){const r=build(a);const feeds=(a.feeds||[]).length,ref=(a.feeds||[]).filter(f=>f.accepted===false).length,weights=(a.weights||[]),sheds=(a.sheds||[]).length,health=(a.health||[]).length,photos=(a.photos||[]).length;let diff='-';if(weights.length>=2){const w=weights.slice().sort((x,y)=>String(x.date||'').localeCompare(String(y.date||'')));diff=(Number(w[w.length-1].weight||0)-Number(w[0].weight||0))+'g';}return {total:r.length,feeds,ref,weights:weights.length,sheds,health,photos,diff};}
function render(a){const s=summary(a);const rows=build(a);return `<div class="subcard"><b>Timeline-Zusammenfassung</b><br>Einträge: ${s.total}<br>Fütterungen: ${s.feeds} · Verweigert: ${s.ref}<br>Gewichte: ${s.weights} · Entwicklung: ${s.diff}<br>Häutungen: ${s.sheds}<br>Gesundheit: ${s.health}<br>Fotos: ${s.photos}</div><div class="timeline2">${rows.length?rows.map(r=>`<div class="tlItem"><div class="tlDate">${NGT500.esc(r.date||'-')}</div><div class="tlDot">${icon(r.type)}</div><div class="tlBody"><b>${NGT500.esc(r.title)}</b><br>${NGT500.esc(r.text||'')}${r.img?`<img class="photo" src="${r.img}">`:''}</div></div>`).join(''):'<p class="muted">Keine Timeline-Einträge.</p>'}</div>`}
window.NGTTimeline={build,summary,render};
})();
