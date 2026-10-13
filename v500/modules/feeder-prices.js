(function(){
'use strict';
const esc=value=>NGT500.esc(String(value==null?'':value));
const money=value=>Number(value).toLocaleString('de-DE',{style:'currency',currency:'EUR',minimumFractionDigits:2,maximumFractionDigits:3});
let busy=false;
let lastResult=null;
let lastSelection=null;
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
 </div>
 <p class="muted">Alle ermittelten Größen und Packungen werden verglichen. Ähnliche Größen und abweichende Packungsmengen werden gekennzeichnet; Stück und Gramm bleiben getrennt.</p>
 <p class="muted">Keine Bestellmenge nötig für den Warenpreisvergleich. Versand und Frostzuschläge sind nicht im Vergleichspreis enthalten; bei Lieferung bitte die Versandbedingungen im Shop prüfen.</p>
 <button class="btn primary" id="feederCompareButton" type="submit" ${busy?'disabled':''}>${busy?'Preise werden abgerufen …':'Alle Größen vergleichen'}</button>
 <p id="feederPriceStatus" role="status" aria-live="polite"></p>
 </form></section>`;
}
function read(){
 const f=document.getElementById('feederPriceForm');
 if(!f)return settings();
 const data=Object.fromEntries(new FormData(f));
 return Object.assign(settings(),data,{allSizes:true});
}
function change(){
 const s=read();
 if(!NGTFeederPriceService.suppliers.some(p=>p.id===s.preferred&&p.kinds.includes(s.kind)))s.preferred=s.kind==='frozen'?'xclusive':'tropic';
 s.species=s.kind==='frozen'?'rat':'cricket';s.size=s.kind==='frozen'?'120g+':'groß';
 NGTStore.saveFeederPricePreferences(s);NGT500.route('feederPrices');
}
function safeLink(url,label){
 try{const u=new URL(url);if(u.protocol!=='https:')return '';return '<a class="btn tc2FeederOfferLink" target="_blank" rel="noopener noreferrer" href="'+esc(u.href)+'">'+esc(label)+'</a>';}catch(error){return '';}
}
function renderResults(){
 if(!lastResult)return `<section class="tc2PageCard"><h2>Vergleichsergebnisse</h2><p>Noch kein Vergleich vorhanden. Starte einen neuen Preisvergleich.</p><button class="btn" onclick="NGT500.route('feederPrices')">Zum Preisvergleich</button></section>`;
 const data=lastResult,s=lastSelection;
 const suppliers=data.suppliers||[],name=id=>(suppliers.find(p=>p.id===id)||{}).name||id;
 const offer=(o,reference)=>`<article class="subcard"><h3>${esc(name(o.supplier))}${reference?' · Stammlieferant':''}</h3><p>${esc(o.title)}</p>${o.sizeNote?'<p class="muted">Abweichende Gewichtsangabe in der Händlerbeschreibung: '+esc(o.sizeNote)+'</p>':''}<p><strong>${money(o.unitPrice)} / ${o.unit==='grams'?'g':'Tier'}</strong> · ${money(o.price)} pro Packung (${esc(o.amount)} ${o.unit==='grams'?'g':'Stück'})</p>${reference?'':`<p><strong>${o.match==='identical'?'Identische Größe':'Ähnliche Größe'}</strong>${o.packChanged?' · Abweichende Packungsmenge':''}</p><p>Preisvorteil pro Einheit: ${money(o.saving)} (${Number(o.savingPercent).toFixed(1)} %)</p>`}<p class="muted">Abgerufen: ${esc(new Date(o.checkedAt).toLocaleString('de-DE'))}</p><div class="tc2FeederOfferActions">${safeLink(o.url,'Angebot öffnen')}${(()=>{const p=suppliers.find(p=>p.id===o.supplier);return p&&p.shipping?safeLink('https://'+p.host+p.shipping,'Versandbedingungen'):'';})()}</div></article>`;
 const labels={unreadable:'Preisdaten konnten nicht eindeutig gelesen werden',ok:'Passende Preise abgerufen',partial:'Teilweise abgerufen – einzelne Seiten fehlen', 'no-match':'Kein eindeutig passendes verfügbares Angebot gefunden',error:'Shop derzeit nicht abrufbar',unsupported:'Diese Kategorie wird hier nicht unterstützt'};
 const rows=data.rows||[];
 return `<section class="tc2PageCard"><h2>Vergleichsergebnisse</h2><p>${esc(name(s.preferred))} · ${s.fulfilment==='pickup'?'Abholung':'Lieferung'} · ${rows.length} Größen / Packungen</p><button class="btn" onclick="NGT500.route('feederPrices')">Neuen Vergleich starten</button><p class="muted">Ähnliche Größen sind Alternativen mit abweichenden Händlerangaben. Prüfe, ob sie für deine Tiere passen. Der Preisvorteil bezieht sich auf den Warenpreis pro Tier oder Gramm.</p>${rows.length?rows.map(row=>`<section class="tc2PageCard"><h2>${esc(row.reference.size)}${s.kind==='live'?' · '+esc(row.reference.amount)+' '+(row.reference.unit==='grams'?'g':'Stück'):''}</h2>${offer(row.reference,true)}${row.cheaper.length?row.cheaper.map(o=>offer(o,false)).join(''):'<p>Keine günstigere passende Alternative gefunden.</p>'}</section>`).join(''):'<p>Beim Stammlieferanten konnten keine verfügbaren Größen mit verlässlichen Preisen ermittelt werden. Ein Vergleich ist deshalb nicht möglich.</p>'}<p class="muted">Warenpreise ohne Versandkosten oder Frostzuschläge. Packungsgröße und Shopbedingungen beachten. Preise können sich nach dem Abruf ändern.</p><details><summary>Geprüfte Lieferanten</summary>${(data.sources||[]).filter(p=>p.status!=='unsupported').map(p=>'<p>'+esc(name(p.supplier))+': '+esc(labels[p.status]||'Unbekannt')+'</p>').join('')}</details></section>`;
}

async function compare(event){
 event.preventDefault();if(busy)return;
 const s=read();NGTStore.saveFeederPricePreferences(s);busy=true;
 const button=document.getElementById('feederCompareButton'),status=document.getElementById('feederPriceStatus');
 button.disabled=true;button.textContent='Preise werden abgerufen …';status.textContent='Die verfügbaren Lieferanten werden geprüft.';
 try{const data=await NGTFeederPriceService.compare(s);lastResult=data;lastSelection=s;if(status.isConnected)NGT500.route('feederPriceResults');}catch(error){status.textContent=error.message;}finally{busy=false;const currentButton=document.getElementById('feederCompareButton');if(currentButton){currentButton.disabled=false;currentButton.textContent='Alle Größen vergleichen';}}
}
window.NGTFeederPrices={compare,change};
NGT500.register('feederPrices',{render});
NGT500.register('feederPriceResults',{render:renderResults});
})();
