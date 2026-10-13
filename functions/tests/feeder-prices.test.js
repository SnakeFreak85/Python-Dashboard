'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const p=require('../feeder-prices');
const supplier=p.SUPPLIERS[0];
const q={preferred:'xclusive',kind:'frozen',species:'rat',size:'120g+'};
const html=stock=>`<h1>Frostratten</h1><select name="group[20]"><option selected>mittel 120g+ 5er Pack</option></select><div itemprop="offers"><meta itemprop="price" content="9.45"><meta itemprop="priceCurrency" content="EUR"><link itemprop="availability" href="https://schema.org/${stock}"></div>`;
test('Packungspreis wird pro Tier berechnet; Packungsmenge bleibt sichtbar',()=>{
 const [o]=p.parseProduct(html('InStock'),'https://www.xclusive-snakes.de/frostfutter/ratten/2260/frostratten',supplier,q,123);
 assert.equal(o.amount,5);assert.equal(o.unitPrice,1.89);assert.equal(o.size,'120g+');assert.equal(o.checkedAt,123);
});
test('Nicht lieferbare Angebote, Zubehör und andere Arten werden ausgeschlossen',()=>{
 assert.deepEqual(p.parseProduct(html('OutOfStock'),'https://www.xclusive-snakes.de/frostfutter/ratten',supplier,q,123),[]);
 assert.deepEqual(p.parseProduct(html('InStock').replace('Frostratten','Rattenpellets'),'https://www.xclusive-snakes.de/frostfutter/ratten',supplier,q,123),[]);
 assert.deepEqual(p.parseProduct(html('InStock').replace('Frostratten','Frostmäuse'),'https://www.xclusive-snakes.de/frostfutter/ratten',supplier,q,123),[]);
});
test('Unterschiedliche Gewichtsklassen bleiben getrennt',()=>{
 assert.equal(p.sizeKey('ca. 120g bis 150g'),'120-150g');
 assert.equal(p.sizeKey('120–150 g'),'120-150g');
 assert.notEqual(p.sizeKey('120g+'),p.sizeKey('120–150 g'));
});
test('Grammangebote verlieren die Insektengröße nicht',()=>{
 assert.deepEqual(p.quantity('Heimchen mittel 100 g','live'),{amount:100,unit:'grams'});
 assert.equal(p.comparisonSize('Heimchen mittel 100 g','live'),'mittel');
 assert.deepEqual(p.quantity('Heimchen mittel 500 Stück','live'),{amount:500,unit:'pieces'});
});
test('JSON-LD Varianten benutzen ihren eigenen Preis und ihre eigene Menge',()=>{
 const data={'@type':'Product',name:'Frostratten 120-150g',model:[{'@type':'ProductModel',name:'Frostratten 120-150g',url:'https://www.xclusive-snakes.de/variant',offers:{price:'25',priceCurrency:'EUR',availability:'InStock',priceSpecification:{referenceQuantity:{value:10,unitText:'Stück'}}}}]};
 const source='<h1>Frostratten</h1><script type="application/ld+json">'+JSON.stringify(data)+'</script>';
 const [o]=p.parseProduct(source,'https://www.xclusive-snakes.de/frostfutter/ratten',supplier,q,1);
 assert.equal(o.price,25);assert.equal(o.amount,10);assert.equal(o.unitPrice,2.5);
});
test('WooCommerce Varianten schließen unklare Dosen und ausverkaufte Mengen aus',()=>{
 const variants=[{attributes:{size:'mittel',quantity:'500-stk'},is_in_stock:true,is_purchasable:true,display_price:10},{attributes:{size:'mittel',quantity:'dose'},is_in_stock:true,is_purchasable:true,display_price:2},{attributes:{size:'mittel',quantity:'1000-stk'},is_in_stock:false,is_purchasable:true,display_price:5}];
 const source='<h1>Heimchen</h1><form data-product_variations="'+JSON.stringify(variants).replace(/"/g,'&quot;')+'"></form>';
 const rows=p.parseProduct(source,'https://www.xclusive-snakes.de/heimchen',supplier,{kind:'live',species:'cricket'},1);
 assert.equal(rows.length,1);assert.equal(rows[0].amount,500);assert.equal(rows[0].unitPrice,0.02);
});
test('Ohne Stammpreis wird keine Ersparnis erfunden; gleiche Preise sind nicht günstiger',()=>{
 const o={unitPrice:2,amount:5,price:10,supplier:'xclusive'};
 const sources=[{supplier:'xclusive',status:'ok',offers:[o]},{supplier:'tropic',status:'ok',offers:[{...o,supplier:'tropic'},{...o,supplier:'tropic',unitPrice:1.5}]}];
 assert.equal(p.compare(sources,q).cheaper.length,1);
 assert.equal(p.compare(sources,q).cheaper[0].savingPercent,25);
 assert.deepEqual(p.compare(sources.map(s=>({...s,offers:s.supplier==='xclusive'?[]:s.offers})),q).cheaper,[]);
});
test('Eingaben erlauben nur unterstützte Kategorien, Lieferanten und gültige Mengen',()=>{
 assert.throws(()=>p.validateQuery({...q,preferred:'https://localhost/'}));
 assert.throws(()=>p.validateQuery({...q,species:'cricket'}));
 assert.throws(()=>p.validateQuery({...q,size:'mittel'}));
 assert.throws(()=>p.validateQuery({preferred:'tropic',kind:'live',species:'cricket',size:'mittel',unit:'pieces',amount:0}));
});
test('Client kann Shopzugriff nicht auf andere Hosts umleiten',()=>{
 const data={'@type':'Product',name:'Frostratten 120-150g 10 Stück',url:'https://localhost/private',offers:{price:1,priceCurrency:'EUR',availability:'InStock'}};
 const source='<h1>Frostratten</h1><script type="application/ld+json">'+JSON.stringify(data)+'</script>';
 assert.deepEqual(p.parseProduct(source,'https://www.xclusive-snakes.de/frostfutter/ratten',supplier,q,1),[]);
});
test('Alle Größen benötigen keine manuelle Größe oder Menge',()=>{
 assert.equal(p.validateQuery({preferred:'xclusive',kind:'frozen',species:'rat',allSizes:true}).allSizes,true);
 assert.equal(p.validateQuery({preferred:'tropic',kind:'live',species:'cricket',allSizes:true}).allSizes,true);
});
test('Ähnliche Gewichtsbereiche sind markiert; entfernte Klassen werden ausgeschlossen',()=>{
 const a={size:'120g+',unit:'pieces'};
 assert.equal(p.matchType(a,{size:'120-150g',unit:'pieces'},'frozen'),'similar');
 assert.equal(p.matchType(a,{size:'20-30g',unit:'pieces'},'frozen'),null);
 assert.equal(p.matchType(a,{size:'120g+',unit:'pieces'},'frozen'),'identical');
 assert.equal(p.matchType({size:'mittel',unit:'pieces'},{size:'mittel',unit:'grams'},'live'),null);
});
test('Alle Stammlieferantengrößen bleiben sichtbar und Packungsunterschiede werden markiert',()=>{
 const offer=(size,amount,price)=>({size,amount,price,unit:'pieces',unitPrice:price/amount});
 const result=p.compare([{supplier:'xclusive',offers:[offer('120g+',5,10),offer('120g+',10,25),offer('200g+',5,15)]},{supplier:'tropic',offers:[offer('120-150g',10,15)]}],{preferred:'xclusive',kind:'frozen',allSizes:true});
 assert.equal(result.rows.length,2);assert.equal(result.rows[0].reference.unitPrice,2);
 assert.equal(result.rows[0].cheaper[0].match,'similar');assert.equal(result.rows[0].cheaper[0].packChanged,true);
 assert.equal(result.rows[1].cheaper.length,0);
});
test('Tropic Varianten werden als JSON gelesen, ohne Shop-JavaScript auszuführen',()=>{
 const html='<script>var $json = {"249":[{"value":"5 Stück"}]}; $.get("/ajax/price/" + response.id + "?t=abc123");</script>';
 assert.deepEqual(p.tropicVariants(html),{variants:['249'],token:'abc123'});
});
test('Tropic verwendet den regulären Preis und die tatsächliche Packungsgröße',()=>{
 const data={name:'Ratte gross ca 96-150g - 5 Stück - Frostfutter für Reptilien',og_price_amount:'11.49',price:'<div class="myn-price-tab">Unser Preis 11,49 €</div><div class="myn-price-tab">Abo-Preis 10,92 €</div>',shipping_time:'2 bis 3 Arbeitstage',og_url:'https://www.tropic-shop.de/ratten?vari=123'};
 const supplier=p.SUPPLIERS.find(s=>s.id==='tropic');
 const [offer]=p.parseTropicPrice(data,'https://www.tropic-shop.de/ratten',supplier,{kind:'frozen',species:'rat'},1);
 assert.equal(offer.price,11.49);assert.equal(offer.amount,5);assert.equal(offer.unitPrice,2.298);
 assert.deepEqual(p.parseTropicPrice({...data,shipping_time:'Nicht lieferbar'},'https://www.tropic-shop.de/ratten',supplier,{kind:'frozen',species:'rat'},1),[]);
});
test('Vorgeschaltete Shopüberschriften und WooCommerce priceSpecification verhindern keine Preise',()=>{
 const product={'@type':'Product',name:'Ratte mittel gefroren 5 Stk. 120-150g',url:'https://frostfuttertiere.de/ratte',offers:[{priceSpecification:[{price:'10.99',priceCurrency:'EUR'}],availability:'https://schema.org/InStock'}]};
 const html='<h1>Shopname</h1><h1>'+product.name+'</h1><script type="application/ld+json">'+JSON.stringify(product)+'</script>';
 const [offer]=p.parseProduct(html,'https://frostfuttertiere.de/ratte',p.SUPPLIERS.find(s=>s.id==='frosttiere'),{kind:'frozen',species:'rat'},1);
 assert.equal(offer.amount,5);assert.equal(offer.price,10.99);
});
test('Stck-Packungen des Terraristikladens werden gelesen',()=>{
 assert.deepEqual(p.quantity('Heimchen Mittel, ca. 500 Stck','live'),{amount:500,unit:'pieces'});
});
