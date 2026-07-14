(function(){
'use strict';

let currentId='',stream=null,scanTimer=null,detector=null;

function render(args){
  currentId=args.id||'';
  return `
    <section class="tc2QR">
      <div class="tc2QRHero">
        <div>
          <h2>🏷️ QR / Tierpass</h2>
          <p>Scannen, suchen oder TerraControl-Tierpass importieren.</p>
        </div>
      </div>

      <section class="tc2QRCard">
        <div class="tc2QRHead">
          <h3>Scanner</h3>
        </div>
        <p>Kamera starten oder QR-/Tierpass-Code manuell einfügen.</p>
        <div class="tc2QRActions">
          <button onclick="NGTQR.startScan()">📷 Scannen</button>
          <button onclick="NGTQR.stopScan()">Stoppen</button>
        </div>
        <div id="scanBox"></div>
      </section>

      <section class="tc2QRCard">
        <div class="tc2QRHead">
          <h3>Tierpass prüfen</h3>
        </div>
        <textarea id="qrInput" placeholder="Tiername, QR-ID oder TerraControl-Code">${NGT500.esc(currentId)}</textarea>
        <button class="tc2QRPrimary" onclick="NGTQR.find()">Prüfen</button>
      </section>

      <div id="qrResult"></div>
    </section>
  `;
}

function parseTC(v){
  v=String(v||'').trim();

  if(v.startsWith('{')){
    try{
      const o=JSON.parse(v);
      if(o&&o.type==='animal-passport'){
        const a=o.animal||{};
        return {
          format:'TC2',
          doc:'',
          id:a.id||'',
          name:a.name||'',
          morph:a.morph||'',
          sex:a.sex||'',
          birth:a.birth||'',
          origin:a.origin||'',
          father:a.father||'',
          mother:a.mother||'',
          defaultFeeder:a.food||a.defaultFeeder||''
        };
      }
    }catch(e){}
  }

  if(v.startsWith('TC2|')){
    const p=v.split('|');
    return {
      format:p[0],
      doc:'',
      id:p[1]||'',
      name:p[2]||'',
      morph:p[3]||'',
      sex:p[4]||'',
      birth:p[5]||'',
      origin:'',
      father:'',
      mother:'',
      defaultFeeder:''
    };
  }

  if(!v.startsWith('TC1|'))return null;

  const p=v.split('|');
  return {
    format:p[0],
    doc:p[1]||'',
    id:p[2]||'',
    name:p[3]||'',
    morph:p[4]||'',
    sex:p[5]||'',
    birth:p[6]||'',
    origin:p[7]||'',
    father:p[8]||'',
    mother:p[9]||'',
    defaultFeeder:p[10]||''
  };
}

function groupFor(data){
  const txt=(data.morph+' '+data.name).toLowerCase();
  if(txt.includes('boa'))return 'boas';
  if(txt.includes('gecko'))return 'geckos';
  if(txt.includes('spinne')||txt.includes('tarantel')||txt.includes('vogelspinne'))return 'spinnen';
  return 'koenig';
}

function passportCard(data,exists){
  return `
    <section class="tc2QRResult">
      <h3>Digitaler Tierpass erkannt</h3>
      <div class="tc2QRPassport">
        <b>${NGT500.esc(data.name||'Unbenannt')}</b>
        <span>${NGT500.esc(data.morph||'-')} · ${NGT500.esc(data.sex||'-')}</span>
        <div>
          <small>Schlupf</small><strong>${NGT500.esc(data.birth||'-')}</strong>
          <small>ID</small><strong>${NGT500.esc(data.id||'-')}</strong>
          <small>Dokument</small><strong>${NGT500.esc(data.doc||'-')}</strong>
        </div>
      </div>
      ${
        exists
          ? '<p>Dieses Tier existiert bereits im Bestand.</p>'
          : '<button class="tc2QRPrimary" onclick="NGTQR.importTC()">Tier übernehmen</button>'
      }
    </section>
  `;
}

function previewImport(data){
  const exists=NGTStore.findAnimal(data.id);
  const box=document.getElementById('qrResult');
  box.innerHTML=passportCard(data,exists);
}

function importTC(){
  const data=parseTC(document.getElementById('qrInput').value);
  if(!data)return;

  if(data.id&&NGTStore.findAnimal(data.id)){
    document.getElementById('qrResult').innerHTML='<div class="tc2QREmpty"><h3>Bereits vorhanden</h3><p>Dieses Tier ist bereits im Bestand.</p></div>';
    return;
  }

  const t=groupFor(data);
  const a={
    uuid:data.id||NGT500.uid(),
    uid:data.id||'',
    name:data.name||'Importiertes Tier',
    morph:data.morph||'',
    sex:data.sex||'',
    birth:data.birth||'',
    origin:data.origin||'',
    father:data.father||'',
    mother:data.mother||'',
    defaultFeeder:data.defaultFeeder||'',
    status:'Bestand',
    note:'Importiert per TerraControl-Tierpass',
    feeds:[],
    sheds:[],
    weights:[],
    photos:[]
  };

  NGTStore.addAnimal(t,a);

  document.getElementById('qrResult').innerHTML=`
    <div class="tc2QREmpty">
      <h3>✅ Tier übernommen</h3>
      <p>Der Tierpass wurde erfolgreich in den Bestand importiert.</p>
    </div>
    ${NGTUI.animalCard(NGTStore.findAnimal(a.uuid))}
  `;
}

function find(){
  const v=document.getElementById('qrInput').value.trim();
  const tc=parseTC(v);

  if(tc){
    previewImport(tc);
    return;
  }

  const hit=NGTStore.findAnimal(v);
  const box=document.getElementById('qrResult');

  if(!hit){
    box.innerHTML=`
      <div class="tc2QREmpty">
        <h3>Tier nicht gefunden</h3>
        <p>Prüfe Name, UUID oder TerraControl-Code und versuche es erneut.</p>
      </div>
    `;
    return;
  }

  box.innerHTML=`
    ${NGTUI.animalCard(hit)}
    <section class="tc2QRResult">
      <h3>QR-Code</h3>
      <div class="tc2QRBox">
        <div id="qrCode"></div>
        <span>${NGT500.esc(hit.a.uuid)}</span>
      </div>
    </section>
  `;

  if(window.QRCode){
    new QRCode(document.getElementById('qrCode'),{
      text:hit.a.uuid,
      width:220,
      height:220
    });
  }
}

async function startScan(){
  const box=document.getElementById('scanBox');

  box.innerHTML=`
   <div class="tc2QREmpty tc2QRScannerState">
    <video id="qrVideo" class="tc2QRScannerVideo" autoplay playsinline></video>
      <p>Kamera wird gestartet...</p>
    </div>
  `;

  if(!('BarcodeDetector' in window)){
    box.innerHTML=`
      <div class="tc2QREmpty">
        <h3>Scanner nicht verfügbar</h3>
        <p>Dieser Browser unterstützt den Kamera-QR-Scanner nicht. Bitte QR-Code kopieren/einfügen oder Chrome auf Android verwenden.</p>
      </div>
    `;
    return;
  }

  try{
    detector=new BarcodeDetector({formats:['qr_code']});
    stream=await navigator.mediaDevices.getUserMedia({video:{facingMode:'environment'}});

    const video=document.getElementById('qrVideo');
    video.srcObject=stream;

    scanTimer=setInterval(async()=>{
      try{
        if(!video.videoWidth)return;
        const codes=await detector.detect(video);
        if(codes&&codes.length){
          const value=codes[0].rawValue||'';
          document.getElementById('qrInput').value=value;
          stopScan();
          find();
        }
      }catch(e){}
    },500);

    box.querySelector('p').textContent='QR-Code in die Kamera halten.';
  }catch(e){
    box.innerHTML=`
      <div class="tc2QREmpty">
        <h3>Kamera nicht gestartet</h3>
        <p>Bitte Kameraberechtigung prüfen oder QR-Code manuell einfügen.</p>
      </div>
    `;
  }
}

function stopScan(){
  if(scanTimer){
    clearInterval(scanTimer);
    scanTimer=null;
  }

  if(stream){
    stream.getTracks().forEach(t=>t.stop());
    stream=null;
  }

  const box=document.getElementById('scanBox');
  if(box)box.innerHTML='';
}

function afterRender(args){
  if(args.id){
    setTimeout(find,50);
  }
}

window.NGTQR={find,importTC,startScan,stopScan};
NGT500.register('qr',{render,afterRender});

})();
