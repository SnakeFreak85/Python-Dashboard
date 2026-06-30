(function(){
'use strict';
let currentId='';
function render(args){currentId=args.id||'';return `<div class="card"><h2>📷 QR-System</h2><input id="qrInput" placeholder="Tiername oder QR-ID" value="${NGT500.esc(currentId)}"><button onclick="NGTQR.find()">Tier suchen</button><div id="qrResult"></div></div>`}
function find(){const v=document.getElementById('qrInput').value.trim();const hit=NGTStore.findAnimal(v);const box=document.getElementById('qrResult');if(!hit){box.innerHTML='<p class="muted">Tier nicht gefunden.</p>';return;}box.innerHTML=`${NGTUI.animalCard(hit)}<div class="qrBox"><div id="qrCode"></div><div>${NGT500.esc(hit.a.uuid)}</div></div>`;if(window.QRCode)new QRCode(document.getElementById('qrCode'),{text:hit.a.uuid,width:220,height:220});}
function afterRender(args){if(args.id){setTimeout(find,50)}}
window.NGTQR={find};NGT500.register('qr',{render,afterRender});
})();
