(function(){
'use strict';
const esc=value=>NGT500.esc(String(value==null?'':value));
const money=value=>Number(value).toLocaleString('de-DE',{style:'currency',currency:'EUR',minimumFractionDigits:2,maximumFractionDigits:3});
let busy=false;
function settings(){return Object.assign({preferred:'xclusive',fulfilment:'pickup',kind:'frozen',species:'rat',size:'120g+',unit:'pieces',amount:500},NGTStore.settings().feederPriceComparison||{});}
function options(values,current){return values.map(([id,label])=>'<option value="'+esc(id)+'"'+(String(current)===String(id)?' selected':'')+'>'+esc(label)+'</option>').join('');}
function render(){
 const s=settings(),frozen=s.kind==='frozen';
 return `<section class="tc2PageCard"><h2>Futterpreisvergleich</h2><p>Vergleiche aktuelle Shoppreise mit deinem Stammlieferanten.</p>
 <form id="feederPriceForm" onsubmit="NGTFeederPrices.compare(event)">
 <div class="tc2FormGrid">
 <label>Bevorzugter Lieferant<select name="preferred">${options(NGTFeederPriceService.suppliers.filter(p=>p.kinds.includes(s.kind)).map(p=>[p.id,p.name+(p.pickup?' · '+p.pickup:'')]),s.preferred)}</select></label>
 <label>Einkauf beim Stammlieferanten<select name="fulfilment">${options([['pickup','Abholung'],['delivery','Lieferung']],s.fulfilment)}</select></label>
 <label>Kategorie<select name="kind" onchange="NGTFeederPrices.change()">${options([['frozen','Frostfutter'],['live','Lebende Futtertiere']],s.kind)}</select></label>
 <label>Futtertier<select name="species">${options(frozen?[['rat','Ratten'],['mouse','Mäuse']]:[['cricket','Heimchen'],['roach','Argentinische Waldschaben']],s.species)}</select></label>
 <label>${frozen?'Gewichtsklasse pro Tier':'Größe'}<input name="size" value="${esc(s.size)}" maxlength="40" required list="feederSizes" placeholder="${frozen?'z. B. 120g+ oder 120–150g':'z. B. klein, mittel, groß'}"></label>
 <datalist id="feederSizes">${(frozen?['5-9g','10g+','20g+','30g+','50g+','70g+','90g+','120g+','150g+','200g+','250g+','300g+','350g+','400g+','90-120g','120-150g']:['micro','klein','mittel','groß','subadult','adult']).map(v=>'<option value="'+esc(v)+'">').join('')}</datalist>
 ${frozen?'':`<label>Packungseinheit<select name="unit">${options([['pieces','Stück'],['grams','Gramm']],s.unit)}</select></label><label>Packungsmenge<input name="amount" type="number" min="1" max="10000" step="1" value="${esc(s.amount)}" list="feederAmounts" required></label><datalist id="feederAmounts">${[50,100,250,500,1000].map(v=>'<option value="'+v+'">').join('')}</datalist>`}
 </div>
 <p class="muted">${frozen?'Frostfutter wird pro Tier verglichen. Die erforderliche Packungsgröße steht beim Angebot.':'Bei Insekten vergleichen wir dieselbe Größe und Packungsmenge. Stück- und Grammangebote bleiben getrennt.'} Gewichtsklassen müssen übereinstimmen; „120g+“ ist nicht dasselbe wie „120–150g“.</p>
 <p class="muted">Keine Bestellmenge nötig für den Warenpreisvergleich. Versand und Frostzuschläge sind nicht im Vergleichspreis enthalten; bei Lieferung bitte die Versandbedingungen im Shop prüfen.</p>
 <button class="btn primary" id="feederCompareButton" type="submit" ${busy?'disabled':''}>${busy?'Preise werden abgerufen …':'Preise vergleichen'}</button>
 <p id="feederPriceStatus" role="status" aria-live="polite"></p>
 </form></section>`;
}
function read(){
 const f=document.getElementById('feederPriceForm');
 if(!f)return settings();
 const data=Object.fromEntries(new FormData(f));
 return Object.assign(settings(),data,{amount:Number(data.amount||500)});
}
function change(){
 const s=read();
 if(!NGTFeederPriceService.suppliers.some(p=>p.id===s.preferred&&p.kinds.includes(s.kind)))s.preferred=s.kind==='frozen'?'xclusive':'tropic';
 s.species=s.kind==='frozen'?'rat':'cricket';s.size=s.kind==='frozen'?'120g+':'groß';
 NGTStore.saveFeederPricePreferences(s);NGT500.route('feederPrices');
}
function safeLink(url,label){
 try{const u=new URL(url);if(u.protocol!=='https:')return '';return '<a class="btn" target="_blank" rel="noopener noreferrer" href="'+esc(u.href)+'">'+esc(label)+'</a>';}catch(error){return '';}
}
function results(data,s){
 const suppliers=data.suppliers||[],name=id=>(suppliers.find(p=>p.id===id)||{}).name||id;
 const unit=s.kind==='frozen'?'Tier':s.unit==='grams'?'g':'Tier';
 const offer=(o,reference)=>`<article class="tc2PageCard"><h3>${esc(name(o.supplier))}${reference?' · Stammlieferant':''}</h3><p>${esc(o.title)}</p><p><strong>${money(o.unitPrice)} / ${unit}</strong> · ${money(o.price)} pro Packung (${esc(o.amount)} ${o.unit==='grams'?'g':'Stück'})</p>${reference?'':`<p>Ersparnis: ${money(o.saving)} / ${unit} (${Number(o.savingPercent).toFixed(1)} %)</p>`}<p class="muted">Abgerufen: ${esc(new Date(o.checkedAt).toLocaleString('de-DE'))}${reference?' · '+(s.fulfilment==='pickup'?'Abholung':'Lieferung'):''}</p>${safeLink(o.url,'Angebot öffnen')}${(()=>{const p=suppliers.find(p=>p.id===o.supplier);return p&&p.shipping?safeLink('https://'+p.host+p.shipping,'Versandbedingungen'):'';})()}</article>`;
 const labels={ok:'Passende Preise abgerufen','no-match':'Kein eindeutig passendes verfügbares Angebot gefunden',error:'Shop derzeit nicht abrufbar',unsupported:'Diese Kategorie wird hier nicht unterstützt'};
 const html=`<h2>Günstigere Lieferanten</h2>${data.reference?offer(data.reference,true):'<p>Der Preis deines Stammlieferanten konnte für diese Auswahl nicht ermittelt werden. Ein verlässlicher Vergleich ist deshalb nicht möglich.</p>'}${data.reference?(data.cheaper.length?data.cheaper.map(o=>offer(o,false)).join(''):'<p>Unter den erfolgreich geprüften passenden Angeboten wurde kein günstigerer Anbieter gefunden.</p>'):''}<p class="muted">Warenpreise ohne Versandkosten oder Frostzuschläge. Packungsgröße und Shopbedingungen beachten. Preise können sich nach dem Abruf ändern.</p><details><summary>Geprüfte Lieferanten</summary>${data.sources.map(p=>'<p>'+esc(name(p.supplier))+': '+esc(labels[p.status]||'Unbekannt')+'</p>').join('')}</details>`;
 NGT500.modal(html,{label:'Futterpreisvergleich'});
}
async function compare(event){
 event.preventDefault();if(busy)return;
 const s=read();NGTStore.saveFeederPricePreferences(s);busy=true;
 const button=document.getElementById('feederCompareButton'),status=document.getElementById('feederPriceStatus');
 button.disabled=true;button.textContent='Preise werden abgerufen …';status.textContent='Die verfügbaren Lieferanten werden geprüft.';
 try{const data=await NGTFeederPriceService.compare(s);if(status.isConnected){status.textContent='Vergleich abgeschlossen.';results(data,s);}}catch(error){status.textContent=error.message;}finally{busy=false;const currentButton=document.getElementById('feederCompareButton');if(currentButton){currentButton.disabled=false;currentButton.textContent='Preise vergleichen';}}
}
window.NGTFeederPrices={compare,change};
NGT500.register('feederPrices',{render});
})();
