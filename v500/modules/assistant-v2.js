(function(){
'use strict';
function render(){
 return `<div class="card"><h2>🤖 KI Assistent</h2><p class="muted">Phase 3.3: Speichern und Fragen beantworten.</p><textarea id="aiText" placeholder="Welche Tiere müssen gefüttert werden?\nWelche Tiere haben dreimal verweigert?\nWie geht es Medusa?\nWie viele 200g Ratten habe ich noch?\n\nMedusa\n26.06. 200g Ratte\n27.06. verweigert"></textarea><button onclick="NGTAssistant.preview()">Analysieren</button><button onclick="NGTAssistant.run()">Ausführen</button><button onclick="NGTAssistant.clearContext()">Kontext löschen</button><div id="aiOut"></div></div>`;
}
function html(s){return NGT500.esc(s||'')}
function show(s){document.getElementById('aiOut').innerHTML=s}
function qtyFromText(raw){
 const words=String(raw||'').toLowerCase().split(/\s+/);
 for(let i=0;i<words.length;i++){
  if(words[i]==='plus'||words[i]==='um'||words[i]==='+') return Number(words[i+1]||0);
  if(words[i]==='minus'||words[i]==='-') return -Number(words[i+1]||0);
  if(words[i]==='bestand') return Number(words[i+1]||words[words.length-1]||0);
 }
 const m=String(raw||'').match(/([+\-])\s*(\d+)/);
 if(m)return (m[1]==='-'?-1:1)*Number(m[2]);
 const last=String(raw||'').match(/(\d+)\s*$/);
 return last?Number(last[1]):0;
}
function applyStock(p){const ft=p.feeder;const q=qtyFromText(p.raw);if(!ft||!q)return null;const data=NGTStore.data();let item=data.foodInventory.find(x=>NGTAIEngine.norm(x.name)===NGTAIEngine.norm(ft));if(!item){item={name:ft,qty:0};data.foodInventory.push(item)}const low=NGTAIEngine.norm(p.raw);if(low.includes('bestand'))item.qty=Math.abs(q);else item.qty=Math.max(0,Number(item.qty||0)+q);NGTStore.save();return 'Bestand '+ft+': '+item.qty;}
function applyParsed(p){if(p.intent==='context')return 'Kontext: '+p.animal.a.name;if(p.intent==='stock')return applyStock(p);if(!p.animal)return null;const a=p.animal.a;if(p.intent==='defaultFeeder'){if(!p.feeder)return null;a.defaultFeeder=p.feeder;a.futterStandard=p.feeder;a.standardFeed=p.feeder;NGTStore.save();return a.name+': Standardfutter '+p.feeder;}if(p.intent==='shed'){a.sheds=a.sheds||[];a.sheds.push({date:p.date,complete:true,note:'KI Phase 3.3'});NGTStore.save();return a.name+': Häutung '+p.date;}if(p.intent==='weight'){if(!p.grams)return null;a.weights=a.weights||[];a.weights.push({date:p.date,weight:p.grams,note:'KI Phase 3.3'});a.weight=p.grams;NGTStore.save();return a.name+': Gewicht '+p.date+' '+p.grams+'g';}if(p.intent==='feed'||p.intent==='feed_refused'){const ft=p.feeder||a.defaultFeeder||a.futterStandard||'';const f=NGTStore.parseFeeder(ft);a.feeds=a.feeds||[];a.feeds.push({date:p.date,prey:f.prey,amount:f.amount,accepted:p.intent!=='feed_refused',note:'KI Phase 3.3'});if(f.label)NGTStore.reduceFood(f.label,1);else NGTStore.save();return a.name+': '+p.date+' '+(p.intent==='feed_refused'?'verweigert':'gefressen')+' '+(f.label||'');}return null;}
function rawText(){return document.getElementById('aiText').value}
function parsed(){return (window.NGTAIContext?NGTAIContext.parse:NGTAIEngine.parse)(rawText())}
function answer(){return window.NGTAIQuery?NGTAIQuery.query(rawText()):null}
function preview(){const ans=answer();if(ans){show(NGTAIQuery.renderAnswer(ans));return;}const ps=parsed();const ctx=window.NGTAIContext?NGTAIContext.get():{};show(`<div class="subcard">Aktueller Kontext: ${html(ctx.lastAnimal||'-')}</div>`+ps.map(p=>`<div class="subcard"><b>${html(p.intent)}</b><br>Text: ${html(p.raw)}<br>Tier: ${p.animal?html(p.animal.a.name):'nicht erkannt'}<br>Datum: ${html(p.date||'-')}<br>Futter: ${html(p.feeder||'-')}<br>Gewicht: ${html(p.grams||'-')}</div>`).join(''));}
function run(){const ans=answer();if(ans){show(NGTAIQuery.renderAnswer(ans));return;}const ps=parsed();const ok=[];const err=[];ps.forEach(p=>{const r=applyParsed(p);if(r)ok.push(r);else err.push('Nicht gespeichert: '+p.raw)});show((ok.length?`<div class="subcard ok">✅ ${ok.length} Eintrag/Einträge gespeichert.</div>`:'')+ok.map(x=>`<div class="subcard">${html(x)}</div>`).join('')+err.map(x=>`<div class="subcard danger">❌ ${html(x)}</div>`).join(''));}
function clearContext(){if(window.NGTAIContext)NGTAIContext.clear();show('<div class="subcard ok">Kontext gelöscht.</div>')}
window.NGTAssistant={preview,run,clearContext};NGT500.register('assistant',{render});
})();
