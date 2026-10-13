'use strict';
const cheerio=require('cheerio');
const SUPPLIERS=[
 {id:'xclusive',name:'Xclusive Snakes',host:'www.xclusive-snakes.de',pickup:'Reilingen',shipping:'/versandinfo'},
 {id:'tropic',name:'Tropic Shop',host:'www.tropic-shop.de',shipping:'/cms/versandkosten'},
 {id:'frost24',name:'Frostfutterversand24',host:'www.frostfutterversand24.de',shipping:'/info/versand-und-zahlungsbedingungen.html'},
 {id:'kreuch',name:'Kreuch & Fleuch',host:'kreuchundfleuch.de',shipping:'/versandinformationen/'},
 {id:'frosttiere',name:'Frostfuttertiere.de',host:'frostfuttertiere.de',shipping:'/versandinfos'},
 {id:'frostonline',name:'Frostfutter-Online',host:'www.frostfutter-online.de',shipping:'/info/versand-und-zahlungsbedingungen.html'},
 {id:'terraladen',name:'Terraristikladen',host:'www.terraristikladen.de',shipping:'/allgemein/zahlung-versand'},
 {id:'qb',name:'QB Insects',host:'www.qb-insects.de'}
];
const cache=new Map();
const stock=value=>/(?:^|\/)InStock$/.test(String(value||''));
const norm=s=>String(s||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/ß/g,'ss').replace(/\s+/g,' ').trim();
function sizeKey(s){
 s=norm(s).replace(/,/g,'.').replace(/[–—]/g,'-');
 const range=s.match(/(\d+(?:\.\d+)?)\s*g?\s*(?:-|bis)\s*(\d+(?:\.\d+)?)\s*g\b/);
 if(range)return range[1]+'-'+range[2]+'g';
 const plus=s.match(/(\d+(?:\.\d+)?)\s*g\s*\+/)||s.match(/(?:uber|ab)\s*(\d+(?:\.\d+)?)\s*g\b/);
 if(plus)return plus[1]+'g+';
 const weight=s.match(/\b(\d+(?:\.\d+)?)\s*g\b/);
 if(weight)return weight[1]+'g';
 for(const [key,re] of [['micro',/\b(micro|mikro|xs)\b/],['klein',/\b(klein|small)\b/],['mittel',/\b(mittel|medium)\b/],['gross',/\b(gross|large)\b/]])if(re.test(s))return key;
 return '';
}
function comparisonSize(text,kind){
 if(kind==='frozen')return sizeKey(text);
 text=norm(text);
 for(const key of ['micro','mikro','subadult','adult','klein','mittel','gross']){
  if(new RegExp('\\b'+key+'\\b').test(text))return key==='mikro'?'micro':key;
 }
 return '';
}

function quantity(s,kind){
 const text=norm(s).replace(/(\d)\.(?=\d{3}(?:\D|$))/g,'$1');
 const m=kind==='frozen'?(text.match(/(\d+)\s*(?:er\s*pack|st(?:uck|k|ck)\.?|tiere)/)||text.match(/\b(\d+)\s+(?:baby)?(?:ratten|mause)\b/)):text.match(/(\d+)\s*(?:st(?:uck|k|ck)\.?|tiere)/);
 if(m)return {amount:Number(m[1]),unit:'pieces'};
 if(kind==='live'){
  const g=text.match(/(\d+)\s*(kg|g|gramm)\b/);
  if(g)return {amount:Number(g[1])*(g[2]==='kg'?1000:1),unit:'grams'};
 }
 return null;
}
function speciesMatch(s,species){
 s=norm(s);
 const re={rat:/ratte|ratten/,mouse:/maus|mause/,cricket:/heimchen/,roach:/(?:argentinische.*(?:schabe|waldschabe)|blaptica\s+dubia)/}[species];
 return !!re&&re.test(s)&&!(/vielzitzen|mastomys|pellet|\bfutter fur|futterkonzentrat|zuchtkonzentrat|falle|sparpaket|getrocknet|gerostet/.test(s));
}
function validUrl(value,supplier){
 const url=new URL(value,'https://'+supplier.host);
 if(url.protocol!=='https:'||url.hostname!==supplier.host||url.username||url.password||url.port)throw new Error('Nicht unterstützte Shopadresse.');
 return url.href;
}
async function download(url,supplier,headers){
 url=validUrl(url,supplier);
 const hit=cache.get(url);
 if(hit&&Date.now()-hit.time<10*60*1000)return hit;
 const response=await fetch(url,{redirect:'manual',signal:AbortSignal.timeout(20000),headers:Object.assign({'User-Agent':'TerraControl-PriceComparison/1.0'},headers||{})});
 if(response.status>=300&&response.status<400){const next=validUrl(response.headers.get('location'),supplier);if(next!==url)return downloadNoRedirect(next,supplier);}
 return readResponse(response,url);
}
async function downloadNoRedirect(url,supplier){return readResponse(await fetch(validUrl(url,supplier),{redirect:'error',signal:AbortSignal.timeout(20000)}),url);}
async function readResponse(response,url){
 if(!response.ok)throw new Error('Shop nicht erreichbar ('+response.status+').');
 const reader=response.body.getReader();let bytes=0;const chunks=[];
 try{while(true){const r=await reader.read();if(r.done)break;bytes+=r.value.length;if(bytes>2500000)throw new Error('Shopseite zu groß.');chunks.push(Buffer.from(r.value));}}finally{await reader.cancel();}
 const entry={html:Buffer.concat(chunks).toString('utf8'),time:Date.now(),cookie:(response.headers.getSetCookie?response.headers.getSetCookie():[]).map(c=>c.split(';')[0]).join('; ')};
 if(cache.size>=32)cache.clear();cache.set(url,entry);return entry;
}
function parseProduct(html,url,supplier,query,time){
 const $=cheerio.load(html);
 const selected=$('select[name^="group"] option:selected').map((i,e)=>$(e).text()).get().join(' ');
 const title=$('h1').filter((i,e)=>speciesMatch($(e).text(),query.species)).first().text().trim();
 const details=title+' '+selected;
 if(!speciesMatch(details,query.species))return [];
 if(query.kind==='live'&&/frost|gefroren|frozen/.test(norm(details)))return [];

 const variations=$('[data-product_variations]').first().attr('data-product_variations');
 if(variations&&query.kind==='live'){
  try{
   return JSON.parse(variations).filter(v=>v.is_in_stock&&v.is_purchasable&&Number(v.display_price)>0).flatMap(v=>{
    const attributes=v.attributes||{};
    const label=Object.values(attributes).join(' ').replace(/-/g,' ');
    const size=comparisonSize(label,'live'),qty=quantity(label,'live');
    if(!size||!qty||qty.amount<=0)return [];
    const link=new URL(url);Object.entries(attributes).forEach(([key,value])=>link.searchParams.set(key,value));
    return [{supplier:supplier.id,title:title+' · '+label,size,amount:qty.amount,unit:qty.unit,price:Number(v.display_price),unitPrice:Number(v.display_price)/qty.amount,url:link.href,checkedAt:time}];
   });
  }catch(error){return [];}
 }
 const products=[];
 const visit=value=>{
  if(!value||typeof value!=='object')return;
  if(['Product','ProductModel'].includes(value['@type']))products.push(value);
  for(const v of Object.values(value)){if(Array.isArray(v))v.forEach(visit);else if(v&&typeof v==='object')visit(v);}
 };
 $('script[type="application/ld+json"]').each((i,e)=>{try{visit(JSON.parse($(e).text()));}catch(error){/* Invalid markup is not a price. */}});
 const found=[];
 products.forEach(product=>{
  const name=product.name||details;
  if(!speciesMatch(name,query.species))return;
  const size=comparisonSize(name,query.kind);
  const productUrl=product.url||url;
  let link;try{link=validUrl(productUrl,supplier);}catch(error){return;}
  if(query.kind==='frozen'&&!/frost|gefroren|frozen/.test(norm(name+' '+product.description+' '+url)))return;
  if(query.kind==='live'&&/frost|gefroren|frozen|getrocknet/.test(norm(name)))return;
  const offers=Array.isArray(product.offers)?product.offers:[product.offers];
  offers.filter(Boolean).forEach(offer=>{
   const reference=offer.priceSpecification&&offer.priceSpecification.referenceQuantity;
   const qty=quantity(name,query.kind)||(reference&&/stück|stuck/i.test(reference.unitText)?{amount:Number(reference.value),unit:'pieces'}:null);
   const specs=Array.isArray(offer.priceSpecification)?offer.priceSpecification:[offer.priceSpecification];
   const spec=specs.filter(Boolean).find(p=>p.price!=null)||{};
   const price=Number(offer.price==null?spec.price:offer.price);
   const currency=offer.priceCurrency||spec.priceCurrency;
   if(!qty||!(qty.amount>0)||!size||!Number.isFinite(price)||!(price>0)||currency!=='EUR'||!stock(offer.availability))return;
   const descriptionSize=query.kind==='frozen'&&String(product.description||'').length<=80?sizeKey(product.description):'';
   found.push({supplier:supplier.id,title:name,size,sizeNote:descriptionSize&&descriptionSize!==size?descriptionSize:'',amount:qty.amount,unit:qty.unit,price,unitPrice:price/qty.amount,url:link,checkedAt:time});
  });
 });
 if(found.length)return found;
 if(query.kind==='frozen'&&!/frost|gefroren|frozen/.test(norm(details+' '+url)))return [];
 const qty=quantity(details,query.kind);
 const size=comparisonSize(details,query.kind);
 if(!qty||!(qty.amount>0)||!size)return [];
 const price=Number($('[itemprop="offers"] [itemprop="price"]').first().attr('content')||$('[itemprop="price"]').first().attr('content'));
 const availability=$('[itemprop="availability"]').first().attr('href')||'';
 const currency=$('[itemprop="priceCurrency"]').first().attr('content')||'';
 if(!Number.isFinite(price)||!(price>0)||currency!=='EUR'||!stock(availability))return [];
 return [{supplier:supplier.id,title:details.trim(),size,amount:qty.amount,unit:qty.unit,price,unitPrice:price/qty.amount,url,checkedAt:time}];
}
function entryUrl(s,q){
 const term={rat:'frostratten',mouse:'frostmaeuse',cricket:'heimchen',roach:'argentinische schaben'}[q.species];
 if(s.id==='xclusive')return 'https://'+s.host+(q.species==='rat'?'/frostfutter/ratten/2260/frostratten':'/frostfutter/maeuse/900/frostmaeuse');
 if(s.id==='kreuch')return 'https://'+s.host+(q.species==='cricket'?'/heimchen/':'/?s=argentinische+waldschaben&post_type=product');
 if(s.id==='tropic')return 'https://'+s.host+(q.kind==='frozen'?'/terraristik/ernaehrung/frostfutter/'+(q.species==='rat'?'ratten':'maeuse'):q.species==='cricket'?'/heimchen-acheta-domesticus.html':'/argentinische-schaben-blaptica-dubia.html');
 if(s.id==='frosttiere')return 'https://'+s.host+'/produkt-kategorie/frostfutter/'+(q.species==='rat'?'ratten':'maeuse');
 if(s.id==='frostonline')return 'https://'+s.host+(q.species==='rat'?'/ratten/':'/maeuse/');
 if(s.id==='terraladen')return 'https://'+s.host+'/futtertiere-ernaehrung/futterinsekten';
 if(s.id==='frost24')return 'https://'+s.host+(q.species==='rat'?'/ratte/':'/maus/');
 return 'https://'+s.host+'/suche?qs='+term;
}
function tropicVariants(html){
 const $=cheerio.load(html);
 const script=$('script').map((i,e)=>$(e).text()).get().find(t=>/\$json\s*=/.test(t))||'';
 const json=script.match(/\$json\s*=\s*(\{[^\n]+\})\s*;/);
 const token=script.match(/\/ajax\/price\/[^\n]+?\?t=([a-f0-9]+)/i);
 if(!json||!token)return {variants:[],token:''};
 try{return {variants:Object.keys(JSON.parse(json[1])).filter(id=>/^\d+$/.test(id)),token:token[1]};}catch(error){return {variants:[],token:''};}
}
function parseTropicPrice(data,url,supplier,q,time){
 const title=String(data.name||'');
 const size=comparisonSize(title,q.kind),qty=quantity(title,q.kind);
 const price=Number(data.og_price_amount);
 const shipping=norm(data.shipping_time);
 // Use the ordinary one-time price, never the subscription or "from" price.
 const $=cheerio.load(String(data.price||''));
 const ordinary=$('.myn-price-tab').first().text();
 if(!speciesMatch(title,q.species)||!size||!qty||qty.amount<=0||!Number.isFinite(price)||price<=0||!ordinary.includes('€'))return [];
 if(/ausverkauft|nicht lieferbar|nicht verfugbar|nicht auf lager/.test(shipping)||!/arbeitstag|werktag|lieferbar|auf lager/.test(shipping))return [];
 if(q.kind==='frozen'&&!/frost|gefroren/.test(norm(title)))return [];
 if(q.kind==='live'&&/frost|gefroren|getrocknet/.test(norm(title)))return [];
 let link;try{link=validUrl(data.og_url||url,supplier);}catch(error){return [];}
 return [{supplier:supplier.id,title,size,amount:qty.amount,unit:qty.unit,price,unitPrice:price/qty.amount,url:link,checkedAt:time}];
}
async function tropicOffers(s,q){
 try{
  const url=entryUrl(s,q),root=await download(url,s),$=cheerio.load(root.html);
  let urls=[url];
  if(!tropicVariants(root.html).variants.length){
   urls=[];
   $('.item-prd a[href]').each((i,e)=>{
    const label=$(e).text().trim(),href=$(e).attr('href');
    if(!speciesMatch(label,q.species))return;
    try{const u=new URL(validUrl(href,s));u.searchParams.delete('cPath');if(!urls.includes(u.href))urls.push(u.href);}catch(error){}
   });
  }
  const pages=await Promise.allSettled(urls.slice(0,16).map(async u=>({url:u,entry:u===url?root:await download(u,s)})));
  const tasks=[];let failed=pages.some(p=>p.status==='rejected'),unreadable=false;
  for(const page of pages){
   if(page.status!=='fulfilled')continue;
   const {url:productUrl,entry}=page.value,config=tropicVariants(entry.html);
   if(!config.variants.length){unreadable=true;continue;}
   for(const id of config.variants)tasks.push({productUrl,entry,id,token:config.token});
  }
  const prices=await Promise.allSettled(tasks.slice(0,64).map(async t=>{
   const endpoint='https://'+s.host+'/ajax/price/'+t.id+'?t='+t.token;
   const entry=await download(endpoint,s,{'X-Requested-With':'XMLHttpRequest',Referer:t.productUrl,...(t.entry.cookie?{Cookie:t.entry.cookie}:{})});
   return parseTropicPrice(JSON.parse(entry.html),t.productUrl,s,q,entry.time);
  }));
  failed=failed||prices.some(p=>p.status==='rejected');
  let offers=prices.flatMap(p=>p.status==='fulfilled'?p.value:[]);
  offers=offers.filter(o=>q.allSizes||(o.size===q.size&&(q.kind==='frozen'||o.unit===q.unit&&o.amount===q.amount)));
  offers=[...new Map(offers.map(o=>[o.url,o])).values()];
  const partial=failed||unreadable||urls.length>16||tasks.length>64;
  return {supplier:s.id,status:offers.length?(partial?'partial':'ok'):failed?'error':tasks.length||unreadable?'unreadable':'no-match',offers};
 }catch(error){console.warn('Tropic price lookup failed',error.message);return {supplier:s.id,status:'error',offers:[]};}
}

async function shopwareOffers(entry,url,s,q){
 const initial=parseProduct(entry.html,url,s,q,entry.time),$=cheerio.load(entry.html);
 const form=$('[data-variant-switch-options]').first();
 if(!form.length)return {offers:initial,partial:false};
 try{
  const config=JSON.parse(form.attr('data-variant-switch-options'));
  const endpoint=validUrl(config.url,s),selected={};
  form.find('input[type="radio"]:checked').each((i,e)=>{selected[$(e).attr('name')]=$(e).val();});
  const inputs=form.find('input[type="radio"].is-combinable').toArray();
  const variants=await Promise.allSettled(inputs.slice(0,16).map(async e=>{
   const group=$(e).attr('name'),option=$(e).val();
   if(!/^[a-f0-9]{32}$/.test(group)||!/^[a-f0-9]{32}$/.test(option))return [];
   const lookup=new URL(endpoint);lookup.searchParams.set('switched',option);
   lookup.searchParams.set('options',JSON.stringify({...selected,[group]:option}));
   const result=await download(lookup.href,s,{'X-Requested-With':'XMLHttpRequest',Referer:url});
   const target=validUrl(JSON.parse(result.html).url,s),page=await download(target,s);
   return parseProduct(page.html,target,s,q,page.time);
  }));
  return {offers:initial.concat(variants.flatMap(r=>r.status==='fulfilled'?r.value:[])),partial:inputs.length>16||variants.some(r=>r.status==='rejected')};
 }catch(error){return {offers:initial,partial:true};}
}

async function supplierOffers(s,q){
 if((['xclusive','frost24','frosttiere','frostonline'].includes(s.id))&&q.kind!=='frozen')return {supplier:s.id,status:'unsupported',offers:[]};
 if((['qb','kreuch','terraladen'].includes(s.id))&&q.kind!=='live')return {supplier:s.id,status:'unsupported',offers:[]};
 if(s.id==='tropic')return tropicOffers(s,q);
 try{
  const url=entryUrl(s,q),entry=await download(url,s),$=cheerio.load(entry.html);
  if(/anfrage wurde.*blockiert|access denied|captcha|just a moment|please enable javascript to continue|wartungsarbeiten/i.test($('title, h1').text()+' '+$('body').text().trim().slice(0,500)))throw new Error('Shop blockiert automatischen Abruf.');
  let offers=parseProduct(entry.html,url,s,q,entry.time);
  const urls=[];
  if(s.id==='xclusive'){
   const select=$('select[name^="group"]').filter((i,e)=>$(e).find('option').toArray().some(o=>(q.allSizes?!!sizeKey($(o).text()):sizeKey($(o).text())===q.size))).first();
   select.find('option').each((i,e)=>{if(q.allSizes?!!sizeKey($(e).text()):sizeKey($(e).text())===q.size){const v=new URL(url);$('select[name^="group"]').each((j,group)=>v.searchParams.set($(group).attr('name'),$(group).val()));v.searchParams.set(select.attr('name'),$(e).val());urls.push(v.href);}});
  }else{
   $('a[href]').each((i,e)=>{const text=$(e).text().trim();if(speciesMatch(text,q.species)&&(q.allSizes?true:comparisonSize(text,q.kind)===q.size)){try{const u=validUrl($(e).attr('href'),s);if(!urls.includes(u))urls.push(u);}catch(error){}}});
  }
  const pages=await Promise.allSettled(urls.slice(0,q.allSizes?32:8).map(async u=>{const p=await download(u,s);return s.id==='terraladen'?shopwareOffers(p,u,s,q):{offers:parseProduct(p.html,u,s,q,p.time),partial:false};}));
  pages.forEach(p=>{if(p.status==='fulfilled')offers.push(...p.value.offers);});
  offers=offers.filter(o=>q.allSizes||(o.size===q.size&& (q.kind==='frozen'||(o.unit===q.unit&&o.amount===q.amount))));
  offers=[...new Map(offers.map(o=>[o.url,o])).values()];
  return {supplier:s.id,status:offers.length?(urls.length>(q.allSizes?32:8)||pages.some(p=>p.status==='rejected'||p.value&&p.value.partial)?'partial':'ok'):pages.some(p=>p.status==='rejected')?'error':pages.length?'unreadable':'no-match',offers};
 }catch(error){console.warn('Feeder price source unavailable',s.id,error.message);return {supplier:s.id,status:'error',offers:[]};}
}
function validateQuery(data){
 const q={allSizes:data.allSizes===true,preferred:String(data.preferred||''),kind:String(data.kind||''),species:String(data.species||''),size:comparisonSize(data.size,data.kind),unit:data.unit,amount:Number(data.amount)};
 if(!SUPPLIERS.some(s=>s.id===q.preferred)||!['frozen','live'].includes(q.kind)||!(q.kind==='frozen'?['rat','mouse']:['cricket','roach']).includes(q.species)||(!q.allSizes&&(!q.size||(q.kind==='frozen'&&!/g/.test(q.size)))))throw new Error('Bitte Futterart und eindeutige Größe wählen.');
 if(!q.allSizes&&q.kind==='live'&&(!['pieces','grams'].includes(q.unit)||!Number.isInteger(q.amount)||q.amount<1||q.amount>10000))throw new Error('Bitte eine gültige Packungsmenge wählen.');
 return q;
}
function weightRange(size){
 const match=String(size).match(/^(\d+(?:\.\d+)?)(?:-(\d+(?:\.\d+)?))?g(\+)?$/);
 if(!match)return null;
 const min=Number(match[1]);
 // A plus class has no documented upper bound. Use only a nearby lower-bound
 // test for similarity, never pretend it has a known maximum weight.
 return {min,max:match[3]?null:Number(match[2]||match[1])};
}
function matchType(reference,offer,kind){
 if(reference.unit!==offer.unit)return null;
 if(reference.size===offer.size)return 'identical';
 if(kind==='live'){
  const aliases={adult:'gross',gross:'gross',micro:'micro',klein:'klein',mittel:'mittel',subadult:'subadult'};
  return aliases[reference.size]&&aliases[reference.size]===aliases[offer.size]?'similar':null;
 }
 const a=weightRange(reference.size),b=weightRange(offer.size);
 if(!a||!b)return null;
 if(a.max!=null&&b.max!=null){
  if(a.min===a.max)return a.min>=b.min&&a.min<=b.max?'similar':null;
  if(b.min===b.max)return b.min>=a.min&&b.min<=a.max?'similar':null;
  const overlap=Math.min(a.max,b.max)-Math.max(a.min,b.min);
  const width=Math.min(a.max-a.min,b.max-b.min);
  return overlap>0&&(width===0||overlap>=width*0.5)?'similar':null;
 }
 const distance=Math.abs(a.min-b.min);
 return distance<=Math.max(1,Math.min(a.min,b.min)*0.2)?'similar':null;
}
function compareAll(results,q){
 const baseline=results.find(r=>r.supplier===q.preferred);
 // Keep the cheapest offer for each size/pack, rather than the last Map value.
 const groups=new Map();
 (baseline?baseline.offers:[]).forEach(o=>{const key=o.size+'|'+o.unit+'|'+(q.kind==='live'?o.amount:'');const previous=groups.get(key);if(!previous||o.unitPrice<previous.unitPrice)groups.set(key,o);});
 const rows=[...groups.values()].sort((a,b)=>q.kind==='frozen'?(weightRange(a.size)?.min||0)-(weightRange(b.size)?.min||0):a.size.localeCompare(b.size)||a.unit.localeCompare(b.unit)||a.amount-b.amount).map(reference=>({
  reference,
  cheaper:results.flatMap(r=>r.supplier===q.preferred?[]:r.offers).flatMap(o=>{
   const match=matchType(reference,o,q.kind);
   if(!match||o.unitPrice>=reference.unitPrice-0.000001)return [];
   return [{...o,match,packChanged:o.amount!==reference.amount,saving:reference.unitPrice-o.unitPrice,savingPercent:100*(1-o.unitPrice/reference.unitPrice)}];
  }).sort((a,b)=>a.unitPrice-b.unitPrice)
 }));
 return {allSizes:true,rows,sources:results.map(r=>({supplier:r.supplier,status:r.status})),suppliers:SUPPLIERS};
}
function compare(results,q){
 if(q.allSizes)return compareAll(results,q);
 const baseline=results.find(r=>r.supplier===q.preferred);
 const reference=baseline&&baseline.offers.slice().sort((a,b)=>a.unitPrice-b.unitPrice)[0]||null;
 const cheaper=reference?results.flatMap(r=>r.supplier===q.preferred?[]:r.offers).filter(o=>o.unitPrice<reference.unitPrice-0.000001).map(o=>({...o,saving:reference.unitPrice-o.unitPrice,savingPercent:100*(1-o.unitPrice/reference.unitPrice)})).sort((a,b)=>a.unitPrice-b.unitPrice):[];
 return {reference,cheaper,sources:results.map(r=>({supplier:r.supplier,status:r.status})),suppliers:SUPPLIERS};
}
module.exports={SUPPLIERS,sizeKey,comparisonSize,quantity,parseProduct,validateQuery,supplierOffers,compare,matchType,compareAll,tropicVariants,parseTropicPrice,shopwareOffers};
