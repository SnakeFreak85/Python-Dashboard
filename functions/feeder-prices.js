'use strict';
const cheerio=require('cheerio');
const SUPPLIERS=[
 {id:'xclusive',name:'Xclusive Snakes',host:'www.xclusive-snakes.de',pickup:'Reilingen',shipping:'/versandinfo'},
 {id:'tropic',name:'Tropic Shop',host:'www.tropic-shop.de',shipping:'/cms/versandkosten'},
 {id:'frost24',name:'Frostfutterversand24',host:'www.frostfutterversand24.de',shipping:'/info/versand-und-zahlungsbedingungen.html'},
 {id:'kreuch',name:'Kreuch & Fleuch',host:'kreuchundfleuch.de',shipping:'/versandinformationen/'},
 {id:'qb',name:'QB Insects',host:'www.qb-insects.de'}
];
const cache=new Map();
const stock=value=>/(?:^|\/)InStock$/.test(String(value||''));
const norm=s=>String(s||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/ß/g,'ss').replace(/\s+/g,' ').trim();
function sizeKey(s){
 s=norm(s).replace(/,/g,'.').replace(/[–—]/g,'-');
 const range=s.match(/(\d+(?:\.\d+)?)\s*g?\s*(?:-|bis)\s*(\d+(?:\.\d+)?)\s*g\b/);
 if(range)return range[1]+'-'+range[2]+'g';
 const plus=s.match(/(\d+(?:\.\d+)?)\s*g\s*\+/);
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
 const text=norm(s);
 const m=kind==='frozen'?(text.match(/(\d+)\s*(?:er\s*pack|st(?:uck|k)\.?|tiere)/)||text.match(/\b(\d+)\s+(?:baby)?(?:ratten|mause)\b/)):text.match(/(\d+)\s*(?:st(?:uck|k)\.?|tiere)/);
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
 return !!re&&re.test(s)&&!(/vielzitzen|mastomys|pellet|futter fur|futterkonzentrat|zuchtkonzentrat|falle|sparpaket|getrocknet|gerostet/.test(s));
}
function validUrl(value,supplier){
 const url=new URL(value,'https://'+supplier.host);
 if(url.protocol!=='https:'||url.hostname!==supplier.host||url.username||url.password||url.port)throw new Error('Nicht unterstützte Shopadresse.');
 return url.href;
}
async function download(url,supplier){
 url=validUrl(url,supplier);
 const hit=cache.get(url);
 if(hit&&Date.now()-hit.time<10*60*1000)return hit;
 const response=await fetch(url,{redirect:'manual',signal:AbortSignal.timeout(10000),headers:{'User-Agent':'TerraControl-PriceComparison/1.0'}});
 if(response.status>=300&&response.status<400){const next=validUrl(response.headers.get('location'),supplier);if(next!==url)return downloadNoRedirect(next,supplier);}
 return readResponse(response,url);
}
async function downloadNoRedirect(url,supplier){return readResponse(await fetch(validUrl(url,supplier),{redirect:'error',signal:AbortSignal.timeout(10000)}),url);}
async function readResponse(response,url){
 if(!response.ok)throw new Error('Shop nicht erreichbar ('+response.status+').');
 const reader=response.body.getReader();let bytes=0;const chunks=[];
 try{while(true){const r=await reader.read();if(r.done)break;bytes+=r.value.length;if(bytes>2500000)throw new Error('Shopseite zu groß.');chunks.push(Buffer.from(r.value));}}finally{await reader.cancel();}
 const entry={html:Buffer.concat(chunks).toString('utf8'),time:Date.now()};
 if(cache.size>=32)cache.clear();cache.set(url,entry);return entry;
}
function parseProduct(html,url,supplier,query,time){
 const $=cheerio.load(html);
 const selected=$('select[name^="group"] option:selected').map((i,e)=>$(e).text()).get().join(' ');
 const title=$('h1').first().text().trim();
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
    if(!size||!qty)return [];
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
   const price=Number(offer.price);
   if(!qty||!(qty.amount>0)||!size||!Number.isFinite(price)||!(price>0)||offer.priceCurrency!=='EUR'||!stock(offer.availability))return;
   found.push({supplier:supplier.id,title:name,size,amount:qty.amount,unit:qty.unit,price,unitPrice:price/qty.amount,url:link,checkedAt:time});
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
 if(s.id==='tropic')return 'https://'+s.host+'/search/'+encodeURIComponent(term+' '+q.size);
 if(s.id==='frost24')return 'https://'+s.host+(q.species==='rat'?'/ratte/':'/maus/');
 return 'https://'+s.host+'/suche?qs='+term;
}
async function supplierOffers(s,q){
 if((s.id==='xclusive'||s.id==='frost24')&&q.kind!=='frozen')return {supplier:s.id,status:'unsupported',offers:[]};
 if((s.id==='qb'||s.id==='kreuch')&&q.kind!=='live')return {supplier:s.id,status:'unsupported',offers:[]};
 try{
  const url=entryUrl(s,q),entry=await download(url,s),$=cheerio.load(entry.html);
  if(/anfrage wurde.*blockiert|access denied|captcha|just a moment|please enable javascript to continue|wartungsarbeiten/i.test($('title, h1').text()+' '+$('body').text().trim().slice(0,500)))throw new Error('Shop blockiert automatischen Abruf.');
  let offers=parseProduct(entry.html,url,s,q,entry.time);
  const urls=[];
  if(s.id==='xclusive'){
   const select=$('select[name^="group"]').filter((i,e)=>$(e).find('option').toArray().some(o=>sizeKey($(o).text())===q.size)).first();
   select.find('option').each((i,e)=>{if(sizeKey($(e).text())===q.size){const v=new URL(url);$('select[name^="group"]').each((j,group)=>v.searchParams.set($(group).attr('name'),$(group).val()));v.searchParams.set(select.attr('name'),$(e).val());urls.push(v.href);}});
  }else{
   $('a[href]').each((i,e)=>{const text=$(e).text().trim();if(speciesMatch(text,q.species)&&comparisonSize(text,q.kind)===q.size){try{const u=validUrl($(e).attr('href'),s);if(!urls.includes(u))urls.push(u);}catch(error){}}});
  }
  const pages=await Promise.allSettled(urls.slice(0,8).map(async u=>{const p=await download(u,s);return parseProduct(p.html,u,s,q,p.time);}));
  pages.forEach(p=>{if(p.status==='fulfilled')offers.push(...p.value);});
  offers=offers.filter(o=>o.size===q.size&& (q.kind==='frozen'||(o.unit===q.unit&&o.amount===q.amount)));
  offers=[...new Map(offers.map(o=>[o.url,o])).values()];
  return {supplier:s.id,status:offers.length?'ok':pages.some(p=>p.status==='rejected')?'error':'no-match',offers};
 }catch(error){console.warn('Feeder price source unavailable',s.id,error.message);return {supplier:s.id,status:'error',offers:[]};}
}
function validateQuery(data){
 const q={preferred:String(data.preferred||''),kind:String(data.kind||''),species:String(data.species||''),size:comparisonSize(data.size,data.kind),unit:data.unit,amount:Number(data.amount)};
 if(!SUPPLIERS.some(s=>s.id===q.preferred)||!['frozen','live'].includes(q.kind)||!(q.kind==='frozen'?['rat','mouse']:['cricket','roach']).includes(q.species)||!q.size||(q.kind==='frozen'&&!/g/.test(q.size)))throw new Error('Bitte Futterart und eindeutige Größe wählen.');
 if(q.kind==='live'&&(!['pieces','grams'].includes(q.unit)||!Number.isInteger(q.amount)||q.amount<1||q.amount>10000))throw new Error('Bitte eine gültige Packungsmenge wählen.');
 return q;
}
function compare(results,q){
 const baseline=results.find(r=>r.supplier===q.preferred);
 const reference=baseline&&baseline.offers.slice().sort((a,b)=>a.unitPrice-b.unitPrice)[0]||null;
 const cheaper=reference?results.flatMap(r=>r.supplier===q.preferred?[]:r.offers).filter(o=>o.unitPrice<reference.unitPrice-0.000001).map(o=>({...o,saving:reference.unitPrice-o.unitPrice,savingPercent:100*(1-o.unitPrice/reference.unitPrice)})).sort((a,b)=>a.unitPrice-b.unitPrice):[];
 return {reference,cheaper,sources:results.map(r=>({supplier:r.supplier,status:r.status})),suppliers:SUPPLIERS};
}
module.exports={SUPPLIERS,sizeKey,comparisonSize,quantity,parseProduct,validateQuery,supplierOffers,compare};
