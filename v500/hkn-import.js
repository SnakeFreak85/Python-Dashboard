(function(){
'use strict';

let lastText='';
let lastData=null;

function esc(v){return NGT500.esc(v||'')}
function today(){return NGT500.today?NGT500.today():new Date().toISOString().slice(0,10)}
function opt(list,cur){return (list||[]).map(v=>`<option value="${esc(v)}" ${String(cur||'')===String(v)?'selected':''}>${esc(v)}</option>`).join('')}
function modal(html){document.getElementById('modalRoot').innerHTML=`<div class="modal"><div class="modalBox">${html}</div></div>`}
function close(){document.getElementById('modalRoot').innerHTML=''}

function open(){
 modal(`<h2>📄 Tier aus Herkunftsnachweis anlegen</h2>
  <p class="muted">Foto aufnehmen oder aus der Galerie wählen. TerraControl liest den HKN aus und öffnet danach eine bearbeitbare Vorschau.</p>
  <input id="hknFile" type="file" accept="image/*" capture="environment" onchange="NGTHKNImport.readFile(this.files[0])">
  <div class="btnRow">
   <button onclick="document.getElementById('hknFile').click()">HKN-Foto auswählen</button>
   <button onclick="NGTHKNImport.manual()">Manuell aus Text</button>
   <button onclick="NGTHKNImport.close()">Abbrechen</button>
  </div>
  <div id="hknOut"></div>`);
}

function out(html){const el=document.getElementById('hknOut');if(el)el.innerHTML=html}

function loadTesseract(){
 return new Promise((resolve,reject)=>{
  if(window.Tesseract){resolve(window.Tesseract);return;}
  const s=document.createElement('script');
  s.src='https://cdn.jsdelivr.net/npm/tesseract.js@5/dist/tesseract.min.js';
  s.onload=()=>resolve(window.Tesseract);
  s.onerror=()=>reject(new Error('OCR-Modul konnte nicht geladen werden.'));
  document.head.appendChild(s);
 });
}

async function readFile(file){
 if(!file)return;
 out('<div class="subcard">📷 Foto wird gelesen...<br><span class="muted">Das kann je nach Gerät etwas dauern.</span></div>');
 try{
  const T=await loadTesseract();
  const res=await T.recognize(file,'deu+eng',{logger:function(m){if(m.status)out('<div class="subcard">KI/OCR: '+esc(m.status)+' '+(m.progress?Math.round(m.progress*100)+'%':'')+'</div>')}});
  lastText=(res&&res.data&&res.data.text)||'';
  lastData=parseHkn(lastText);
  renderPreview(lastData,lastText);
 }catch(e){
  out(`<div class="subcard danger">OCR fehlgeschlagen: ${esc(e.message||e)}</div><p class="muted">Du kannst den erkannten/abgetippten Text auch manuell einfügen.</p><button onclick="NGTHKNImport.manual()">Manuell aus Text</button>`);
 }
}

function manual(){
 modal(`<h2>📄 HKN-Text einfügen</h2>
  <p class="muted">Falls das Foto nicht erkannt wird, kannst du den Text hier einfügen oder kurz abtippen.</p>
  <textarea id="hknManualText" placeholder="Text vom Herkunftsnachweis..."></textarea>
  <div class="btnRow">
   <button onclick="NGTHKNImport.parseManual()">Daten erkennen</button>
   <button onclick="NGTHKNImport.close()">Abbrechen</button>
  </div>`);
}

function parseManual(){
 lastText=document.getElementById('hknManualText').value||'';
 lastData=parseHkn(lastText);
 renderPreview(lastData,lastText);
}

function norm(s){return String(s||'').replace(/\s+/g,' ').trim()}
function findLabel(text,patterns){
 for(const p of patterns){
  const m=text.match(p);
  if(m&&m[1])return norm(m[1]);
 }
 return '';
}
function findDate(text){
 const explicit=findLabel(text,[/(?:schlupf|geburt|geboren|birth|hatch|geschlüpft)\s*(?:am|datum)?\s*[:\-]?\s*(\d{1,2}[\.\/-]\d{1,2}[\.\/-]\d{2,4})/i]);
 const raw=explicit||(text.match(/\b(\d{1,2}[\.\/-]\d{1,2}[\.\/-]\d{2,4})\b/)||[])[1]||'';
 if(!raw)return '';
 const parts=raw.replace(/\//g,'.').replace(/-/g,'.').split('.');
 if(parts.length<3)return '';
 let d=parts[0].padStart(2,'0'),m=parts[1].padStart(2,'0'),y=parts[2];
 if(y.length===2)y='20'+y;
 return `${y}-${m}-${d}`;
}
function findSex(text){
 const t=text.toLowerCase();
 if(/\b0[\.,]1\b/.test(t)||/weiblich|female/.test(t))return 'Weiblich';
 if(/\b1[\.,]0\b/.test(t)||/männlich|maennlich|male/.test(t))return 'Männlich';
 return 'Unbestimmt';
}
function findOrigin(text){
 if(/\bfnz\b/i.test(text))return 'FNZ';
 if(/\benz\b/i.test(text))return 'ENZ';
 if(/nachzucht|\bnz\b/i.test(text))return 'Nachzucht';
 return findLabel(text,[/(?:herkunft|origin|zuchtform)\s*[:\-]?\s*([^\n]+)/i]);
}
function findType(text){
 const t=text.toLowerCase();
 if(/boa/.test(t))return 'boas';
 if(/gecko|leopardgecko/.test(t))return 'geckos';
 if(/spinne|vogelspinne|tarantula|brachypelma|caribena|poecilotheria/.test(t))return 'spinnen';
 return 'koenig';
}
function cleanName(v){
 v=norm(v);
 return /herkunft|nachweis|bescheinigung|python|boa|gecko|spinne/i.test(v)?'':v;
}
function parseHkn(text){
 text=String(text||'');
 const lines=text.split(/\n+/).map(norm).filter(Boolean);
 const name=cleanName(findLabel(text,[/(?:name|tiername)\s*[:\-]?\s*([^\n]+)/i]))||cleanName(lines[0]||'');
 const morph=findLabel(text,[/(?:morph|farbschlag|farbe|genetik)\s*[:\-]?\s*([^\n]+)/i]);
 const father=findLabel(text,[/(?:vater|vatertier|sire|father)\s*[:\-]?\s*([^\n]+)/i]);
 const mother=findLabel(text,[/(?:mutter|muttertier|dam|mother)\s*[:\-]?\s*([^\n]+)/i]);
 const weight=(text.match(/(?:gewicht|weight)\s*[:\-]?\s*(\d{2,5})\s*g/i)||text.match(/\b(\d{2,5})\s*g\b/i)||[])[1]||'';
 const price=(text.match(/(?:preis|kaufpreis)\s*[:\-]?\s*(\d+[\.,]?\d*)/i)||[])[1]||'';
 const note='Aus HKN importiert. Bitte Angaben prüfen.\n\nOCR-Text:\n'+text.slice(0,1200);
 return {type:findType(text),name,morph,weight,origin:findOrigin(text),birth:findDate(text),father,mother,feedIntervalDays:14,buyPrice:String(price).replace(',','.'),sex:findSex(text),status:'Bestand',defaultFeederState:'Frost',defaultFeederType:'Ratte',defaultFeederSize:'',note};
}

function renderPreview(d,text){
 d=d||{};
 const type=d.type||'koenig';
 const feederType=d.defaultFeederType||'Ratte';
 const feederSize=d.defaultFeederSize||((NGTStore.FEEDER_SIZES[feederType]||[])[0]||'');
 modal(`<h2>📄 HKN-Vorschau prüfen</h2>
  <p class="muted">Bitte kontrollieren und bei Bedarf ändern. Erst mit „Tier anlegen“ wird gespeichert.</p>
  <select id="hknType">${opt(NGTStore.TYPES,type)}</select>
  <input id="hknName" placeholder="Name" value="${esc(d.name||'')}">
  <input id="hknMorph" placeholder="Morph / Farbschlag" value="${esc(d.morph||'')}">
  <input id="hknWeight" type="number" placeholder="Gewicht" value="${esc(d.weight||'')}">
  <input id="hknOrigin" placeholder="Herkunft / ENZ / FNZ" value="${esc(d.origin||'')}">
  <input id="hknBirth" type="date" value="${esc(d.birth||'')}">
  <input id="hknFather" placeholder="Vatertier" value="${esc(d.father||'')}">
  <input id="hknMother" placeholder="Muttertier" value="${esc(d.mother||'')}">
  <input id="hknFeedInterval" type="number" min="1" placeholder="Fütterungsintervall in Tagen" value="${esc(d.feedIntervalDays||14)}">
  <input id="hknBuy" type="number" placeholder="Kaufpreis" value="${esc(d.buyPrice||'')}">
  <select id="hknSex"><option ${d.sex==='Unbestimmt'?'selected':''}>Unbestimmt</option><option ${d.sex==='Männlich'?'selected':''}>Männlich</option><option ${d.sex==='Weiblich'?'selected':''}>Weiblich</option></select>
  <select id="hknStatus"><option ${d.status==='Bestand'?'selected':''}>Bestand</option><option ${d.status==='Nachzucht'?'selected':''}>Nachzucht</option><option ${d.status==='Verkauft'?'selected':''}>Verkauft</option><option ${d.status==='Abgegeben'?'selected':''}>Abgegeben</option><option ${d.status==='Verstorben'?'selected':''}>Verstorben</option><option ${d.status==='Archiv'?'selected':''}>Archiv</option></select>
  <h3>Standardfutter</h3>
  <select id="hknFeederState"><option ${d.defaultFeederState==='Frost'?'selected':''}>Frost</option><option ${d.defaultFeederState==='Lebend'?'selected':''}>Lebend</option></select>
  <select id="hknFeederType" onchange="NGTHKNImport.refreshSize()">${opt(NGTStore.FEEDER_TYPES,feederType)}</select>
  <select id="hknFeederSize">${opt(NGTStore.FEEDER_SIZES[feederType]||[],feederSize)}</select>
  <textarea id="hknNote" placeholder="Notizen">${esc(d.note||'')}</textarea>
  <details><summary>Erkannter OCR-Text</summary><textarea readonly>${esc(text||'')}</textarea></details>
  <div class="btnRow">
   <button onclick="NGTHKNImport.saveAnimal()">Tier anlegen</button>
   <button onclick="NGTHKNImport.open()">Neues Foto</button>
   <button onclick="NGTHKNImport.close()">Abbrechen</button>
  </div>`);
}

function refreshSize(){
 const type=document.getElementById('hknFeederType').value;
 const size=document.getElementById('hknFeederSize');
 size.innerHTML=(NGTStore.FEEDER_SIZES[type]||[]).map(v=>`<option value="${esc(v)}">${esc(v)}</option>`).join('');
}

function saveAnimal(){
 const t=document.getElementById('hknType').value||'koenig';
 const state=document.getElementById('hknFeederState').value||'Frost';
 const ftype=document.getElementById('hknFeederType').value||'Ratte';
 const fsize=document.getElementById('hknFeederSize').value||'';
 const feeder=NGTStore.feederLabel(state,ftype,fsize);
 const interval=Math.max(1,Number(document.getElementById('hknFeedInterval').value||14));
 const a={
  name:document.getElementById('hknName').value.trim()||'Unbenannt',
  morph:document.getElementById('hknMorph').value.trim(),
  weight:document.getElementById('hknWeight').value,
  origin:document.getElementById('hknOrigin').value.trim(),
  originType:document.getElementById('hknOrigin').value.trim(),
  birth:document.getElementById('hknBirth').value,
  father:document.getElementById('hknFather').value.trim(),vater:document.getElementById('hknFather').value.trim(),sire:document.getElementById('hknFather').value.trim(),
  mother:document.getElementById('hknMother').value.trim(),mutter:document.getElementById('hknMother').value.trim(),dam:document.getElementById('hknMother').value.trim(),
  feedIntervalDays:interval,feedingInterval:interval,feedInterval:interval,weightIntervalDays:30,
  buyPrice:document.getElementById('hknBuy').value,
  sex:document.getElementById('hknSex').value,
  status:document.getElementById('hknStatus').value,
  defaultFeeder:feeder,defaultFeederState:state,defaultFeederType:ftype,defaultFeederSize:fsize,futterStandard:feeder,standardFeed:feeder,
  note:document.getElementById('hknNote').value.trim(),
  feeds:[],sheds:[],weights:[],photos:[]
 };
 NGTStore.addAnimal(t,a);
 close();
 alert('Tier aus HKN angelegt.');
 if(window.NGTFirebaseSync)NGTFirebaseSync.saveCloud().catch(function(){});
 NGT500.route('animals',{t});
}

window.NGTHKNImport={open,close,readFile,manual,parseManual,refreshSize,saveAnimal};

})();