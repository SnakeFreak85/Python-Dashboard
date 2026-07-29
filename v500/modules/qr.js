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

      <section class="tc2QRCard">
        <div class="tc2QRHead">
          <h3>Herkunftsnachweis importieren</h3>
        </div>
        <p>Bild eines Herkunftsnachweises auswählen und die erkannten Tierdaten vor dem Anlegen prüfen.</p>
        <button class="tc2QRPrimary" onclick="NGTHknImport.run()">Dokument auswählen</button>
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
          uuid:a.uuid||'',
          name:a.name||'',
          animalGroup:a.animalGroup||'',
          genus:a.genus||'',
          species:a.species||'',
          morph:a.morph||'',
          sex:a.sex||'',
          birth:a.birth||'',
          origin:a.origin||'',
          father:a.father||'',
          mother:a.mother||'',
          defaultFeeder:a.food||a.defaultFeeder||'',
          feedDays:Number(a.feedDays)||null,
          weightDays:Number(a.weightDays)||null
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
      uuid:p[7]||'',
      name:p[2]||'',
      animalGroup:p[8]||'',
      genus:p[3]||'',
      species:p[4]||'',
      morph:'',
      sex:p[5]||'',
      birth:p[6]||'',
      origin:'',
      father:'',
      mother:'',
      defaultFeeder:'',
      feedDays:null,
      weightDays:null
    };
  }

  if(!v.startsWith('TC1|'))return null;

  const p=v.split('|');
  return {
    format:p[0],
    doc:p[1]||'',
    id:p[2]||'',
    uuid:'',
    name:p[3]||'',
    animalGroup:'',
    genus:'',
    species:'',
    morph:p[4]||'',
    sex:p[5]||'',
    birth:p[6]||'',
    origin:p[7]||'',
    father:p[8]||'',
    mother:p[9]||'',
    defaultFeeder:p[10]||'',
    feedDays:null,
    weightDays:null
  };
}

function legacyTypeFor(data){
  const txt=[
    data.animalGroup,
    data.genus,
    data.species,
    data.morph,
    data.name
  ].join(' ').toLowerCase();

  if(txt.includes('boa'))return 'boas';
  if(txt.includes('gecko'))return 'geckos';
  if(txt.includes('spinne')||txt.includes('tarantel')||txt.includes('vogelspinne'))return 'spinnen';
  if(
    txt.includes('könig')||
    txt.includes('koenig')||
    txt.includes('ball python')||
    txt.includes('python regius')
  )return 'koenig';

  return '';
}

function animalGroupFor(data){
  if(data.animalGroup)return data.animalGroup;

  const type=legacyTypeFor(data);

  if(type==='boas')return 'Boas';
  if(type==='geckos')return 'Geckos';
  if(type==='spinnen')return 'Vogelspinnen';
  if(type==='koenig')return 'Königspythons';

  return 'Unsortiert';
}

function existingImport(data){
  if(data.uuid){
    return NGTStore.findAnimalById(data.uuid);
  }

  return data.id
    ?NGTStore.findAnimal(data.id)
    :null;
}

function importedAnimal(data){
  const uuid=data.uuid||NGT500.uid();
  const feedDays=Number(data.feedDays)||null;
  const weightDays=Number(data.weightDays)||null;

  return {
    uuid:uuid,
    uid:uuid,
    sourcePublicId:data.id||'',
    sourceDocumentId:data.doc||'',
    animalGroup:animalGroupFor(data),
    genus:data.genus||'',
    species:data.species||'',
    name:data.name||'Importiertes Tier',
    morph:data.morph||'',
    sex:data.sex||'',
    birth:data.birth||'',
    origin:data.origin||'',
    originType:data.origin||'',
    father:data.father||'',
    vater:data.father||'',
    sire:data.father||'',
    mother:data.mother||'',
    mutter:data.mother||'',
    dam:data.mother||'',
    defaultFeeder:data.defaultFeeder||'',
    futterStandard:data.defaultFeeder||'',
    standardFeed:data.defaultFeeder||'',
    feedIntervalEnabled:!!feedDays,
    feedIntervalDays:feedDays,
    feedingInterval:feedDays,
    feedInterval:feedDays,
    weightIntervalEnabled:!!weightDays,
    weightIntervalDays:weightDays,
    weightInterval:weightDays,
    status:'Bestand',
    collection:'stock',
    note:'Importiert per TerraControl-Tierpass',
    feeds:[],
    sheds:[],
    weights:[],
    health:[],
    photos:[]
  };
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
  const exists=existingImport(data);
  const box=document.getElementById('qrResult');
  box.innerHTML=passportCard(data,exists);
}

function importTC(){
  const data=parseTC(document.getElementById('qrInput').value);
  if(!data)return;

  if(existingImport(data)){
    document.getElementById('qrResult').innerHTML='<div class="tc2QREmpty"><h3>Bereits vorhanden</h3><p>Dieses Tier ist bereits im Bestand.</p></div>';
    return;
  }

  const t=legacyTypeFor(data);
  const a=importedAnimal(data);

  const imported=NGTStore.addAnimal(t,a);
  const importedRow=
    NGTStore.resolveAnimal({
      animalId:
        NGTStore.animalId(imported)
    });

  document.getElementById('qrResult').innerHTML=`
    <div class="tc2QREmpty">
      <h3>✅ Tier übernommen</h3>
      <p>Der Tierpass wurde erfolgreich in den Bestand importiert.</p>
    </div>
    ${NGTUI.animalCard({
      t:imported.legacyType||'',
      i:importedRow?importedRow.i:0,
      a:imported
    })}
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

window.NGTQR={
  find,
  importTC,
  startScan,
  stopScan,
  parseTC,
  legacyTypeFor,
  animalGroupFor,
  existingImport,
  importedAnimal
};
NGT500.register('qr',{render,afterRender});

})();
