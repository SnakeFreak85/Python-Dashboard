(function(){
'use strict';
let currentId='';
function render(args){currentId=args.id||'';return `<div class="card"><h2>📷 QR-System</h2><p class="muted">Tier suchen oder TerraControl-Tierpass-Code einfügen.</p><textarea id="qrInput" placeholder="Tiername, QR-ID oder TerraControl-Code">${NGT500.esc(currentId)}</textarea><button onclick="NGTQR.find()">Prüfen</button><div id="qrResult"></div></div>`}
function parseTC(v){
 v=String(v||'').trim();
 if(!v.startsWith('TC1|'))return null;
 const p=v.split('|');
 return {format:p[0],doc:p[1]||'',id:p[2]||'',name:p[3]||'',morph:p[4]||'',sex:p[5]||'',birth:p[6]||'',origin:p[7]||'',father:p[8]||'',mother:p[9]||'',defaultFeeder:p[10]||''};
}
function groupFor(data){
 const txt=(data.morph+' '+data.name).toLowerCase();
 if(txt.includes('boa'))return 'boas';
 if(txt.includes('gecko'))return 'geckos';
 if(txt.includes('spinne')||txt.includes('tarantel')||txt.includes('vogelspinne'))return 'spinnen';
 return 'koenig';
}
function previewImport(data){
 const exists=NGTStore.findAnimal(data.id);
 const box=document.getElementById('qrResult');
 box.innerHTML=`<div class="subcard"><h3>Digitaler Tierpass erkannt</h3><p><b>${NGT500.esc(data.name||'Unbenannt')}</b><br>${NGT500.esc(data.morph||'-')} · ${NGT500.esc(data.sex||'-')}<br>Schlupf: ${NGT500.esc(data.birth||'-')}<br>ID: ${NGT500.esc(data.id||'-')}<br>Dokument: ${NGT500.esc(data.doc||'-')}</p>${exists?'<p class="muted">Dieses Tier existiert bereits im Bestand.</p>':'<button onclick="NGTQR.importTC()">Tier übernehmen</button>'}</div>`;
}
function importTC(){
 const data=parseTC(document.getElementById('qrInput').value);
 if(!data)return;
 if(data.id&&NGTStore.findAnimal(data.id)){document.getElementById('qrResult').innerHTML='<div class="subcard ok">Tier ist bereits vorhanden.</div>';return;}
 const t=groupFor(data);
 const a={uuid:data.id||NGT500.uid(),uid:data.id||'',name:data.name||'Importiertes Tier',morph:data.morph||'',sex:data.sex||'',birth:data.birth||'',origin:data.origin||'',father:data.father||'',mother:data.mother||'',defaultFeeder:data.defaultFeeder||'',status:'Bestand',note:'Importiert per TerraControl-Tierpass',feeds:[],sheds:[],weights:[],photos:[]};
 NGTStore.addAnimal(t,a);
 document.getElementById('qrResult').innerHTML='<div class="subcard ok">✅ Tier wurde übernommen.</div>'+NGTUI.animalCard(NGTStore.findAnimal(a.uuid));
}
function find(){
 const v=document.getElementById('qrInput').value.trim();
 const tc=parseTC(v);
 if(tc){previewImport(tc);return;}
 const hit=NGTStore.findAnimal(v);
 const box=document.getElementById('qrResult');
 if(!hit){box.innerHTML='<p class="muted">Tier nicht gefunden.</p>';return;}
 box.innerHTML=`${NGTUI.animalCard(hit)}<div class="qrBox"><div id="qrCode"></div><div>${NGT500.esc(hit.a.uuid)}</div></div>`;
 if(window.QRCode)new QRCode(document.getElementById('qrCode'),{text:hit.a.uuid,width:220,height:220});
}
function afterRender(args){if(args.id){setTimeout(find,50)}}
window.NGTQR={find,importTC};NGT500.register('qr',{render,afterRender});
})();