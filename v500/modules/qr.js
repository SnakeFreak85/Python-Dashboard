(function(){
'use strict';

let currentId='',stream=null,scanTimer=null,detector=null;

function render(args){
  currentId=args.id||'';
  return `
    <div class="tc2PageCard tc2Card">
      <div class="tc2PageHead">
        <div>
          <h2>📷 QR / Tierpass</h2>
          <p class="muted">Tier suchen, QR-Code scannen oder TerraControl-Tierpass importieren.</p>
        </div>
      </div>

      <div class="tc2FormCard tc2Card">
        <h3>Scanner</h3>
        <p class="muted">Nutze die Kamera oder füge einen QR-/Tierpass-Code manuell ein.</p>
        <div class="btnRow">
          <button onclick="NGTQR.startScan()">📷 Kamera scannen</button>
          <button onclick="NGTQR.stopScan()">Scan stoppen</button>
        </div>
        <div id="scanBox"></div>
      </div>

      <div class="tc2FormCard tc2Card">
        <h3>Tierpass prüfen</h3>
        <div class="tc2FormGrid">
          <textarea id="qrInput" placeholder="Tiername, QR-ID oder TerraControl-Code">${NGT500.esc(currentId)}</textarea>
        </div>
        <button onclick="NGTQR.find()">Prüfen</button>
      </div>

      <div id="qrResult"></div>
    </div>
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

function previewImport(data){
  const exists=NGTStore.findAnimal(data.id);
  const box=document.getElementById('qrResult');
  box.innerHTML=`
    <div class="tc2FormCard tc2Card">
      <h3>Digitaler Tierpass erkannt</h3>
      <div class="tc2EmptyState">
        <h3>${NGT500.esc(data.name||'Unbenannt')}</h3>
        <p>
          ${NGT500.esc(data.morph||'-')} · ${NGT500.esc(data.sex||'-')}<br>
          Schlupf: ${NGT500.esc(data.birth||'-')}<br>
          ID: ${NGT500.esc(data.id||'-')}<br>
          Dokument: ${NGT500.esc(data.doc||'-')}
        </p>
      </div>
      ${
        exists
          ? '<p class="muted">Dieses Tier existiert bereits im Bestand.</p>'
          : '<button onclick="NGTQR.importTC()">Tier übernehmen</button>'
      }
    </div>
  `;
}

function importTC(){
  const data=parseTC(document.getElementById('qrInput').value);
  if(!data)return;

  if(data.id&&NGTStore.findAnimal(data.id)){
    document.getElementById('qrResult').innerHTML='<div class="tc2EmptyState"><h3>Bereits vorhanden</h3><p>Dieses Tier ist bereits im Bestand.</p></div>';
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
    <div class="tc2EmptyState">
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
      <div class="tc2EmptyState">
        <h3>Tier nicht gefunden</h3>
        <p>Prüfe Name, UUID oder TerraControl-Code und versuche es erneut.</p>
      </div>
    `;
    return;
  }

  box.innerHTML=`
    ${NGTUI.animalCard(hit)}
    <div class="tc2FormCard tc2Card">
      <h3>QR-Code</h3>
      <div class="qrBox">
        <div id="qrCode"></div>
        <div>${NGT500.esc(hit.a.uuid)}</div>
      </div>
    </div>
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
    <div class="tc2EmptyState" style="margin-top:12px">
      <video id="qrVideo" autoplay playsinline style="width:100%;border-radius:16px;background:#000"></video>
      <p class="muted">Kamera wird gestartet...</p>
    </div>
  `;

  if(!('BarcodeDetector' in window)){
    box.innerHTML=`
      <div class="tc2EmptyState">
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

    box.querySelector('.muted').textContent='QR-Code in die Kamera halten.';
  }catch(e){
    box.innerHTML=`
      <div class="tc2EmptyState">
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