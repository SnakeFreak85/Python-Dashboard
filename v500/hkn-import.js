(function(){
'use strict';

function getDraft(){
 try{return JSON.parse(sessionStorage.getItem('terracontrol_hkn_import_v1')||'null')}catch(e){return null}
}

function clean(v){return String(v||'').replace(/\s+/g,' ').trim()}
function set(id,v){const el=document.getElementById(id);if(el&&clean(v))el.value=clean(v)}
function norm(v){return clean(v).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/ß/g,'ss')}

function isoDate(text){
 const m=String(text||'').match(/(\d{1,2})[.\-/](\d{1,2})[.\-/](\d{2,4})/);
 if(!m)return '';
 let y=m[3];
 if(y.length===2)y='20'+y;
 return y+'-'+m[2].padStart(2,'0')+'-'+m[1].padStart(2,'0');
}

function findAfter(text,labels){
 const lines=String(text||'').split(/\n/).map(clean).filter(Boolean);
 for(let i=0;i<lines.length;i++){
  const l=norm(lines[i]);
  for(const key of labels){
   if(l.includes(key)){
    const parts=lines[i].split(/[:=]/);
    if(parts.length>1&&clean(parts.slice(1).join(':')))return clean(parts.slice(1).join(':'));
    if(lines[i+1])return clean(lines[i+1]);
   }
  }
 }
 return '';
}

function sex(text){
 const s=norm(text);
 if(/\b0[,.]1\b/.test(text)||s.includes('weiblich')||s.includes('female'))return 'Weiblich';
 if(/\b1[,.]0\b/.test(text)||s.includes('mannlich')||s.includes('maennlich')||s.includes('male'))return 'Männlich';
 return 'Unbestimmt';
}

function morph(text){
 const direct=findAfter(text,['morph','farbschlag','mutation','genetik','farbe']);
 if(direct)return direct;

 const known=[
  'Ultramel','Clown','Pied','Piebald','Pastel','Leopard','Desert Ghost','Albino',
  'Toffee','Lavender','Mojave','Lesser','GHI','Phantom','Spider','Enchi','Fire',
  'Yellow Belly','Cinnamon','Banana','Pinstripe','Spotnose','Gravel','Asphalt'
 ];

 const s=norm(text);
 return known.filter(x=>s.includes(norm(x))).join(' ');
}

function origin(text){
 const s=norm(text);
 if(s.includes('enz'))return 'ENZ';
 if(s.includes('fnz'))return 'FNZ';
 if(s.includes('dnz'))return 'DNZ';
 if(s.includes('nachzucht')||/\bnz\b/i.test(text))return 'Nachzucht';
 if(s.includes('wildfang')||/\bwf\b/i.test(text))return 'Wildfang';
 return findAfter(text,['herkunft','ursprung','origin']);
}

function parse(text){
 const father=findAfter(text,['vater','vatertier','sire','father']);
 const mother=findAfter(text,['mutter','muttertier','dam','mother']);
 const birth=findAfter(text,['schlupfdatum','geburtsdatum','geboren','schlupf','birth','dob']);
 const name=findAfter(text,['name','tiername','rufname']);
 const weight=(String(text).match(/(\d{2,5})\s*(g|gramm)\b/i)||[])[1]||'';

 return {
  name:/python|boa|natter|geschlecht|morph|art/i.test(name)?'':name,
  morph:morph(text),
  weight:weight,
  origin:origin(text),
  birth:isoDate(birth)||isoDate(text),
  father:father,
  mother:mother,
  sex:sex(text),
  status:'Bestand',
  note:'Aus Herkunftsnachweis erkannt. Bitte prüfen.'
 };
}

function apply(data){
 set('edName',data.name);
 set('edMorph',data.morph);
 set('edWeight',data.weight);
 set('edOrigin',data.origin);
 set('edBirth',data.birth);
 set('edFather',data.father);
 set('edMother',data.mother);
 set('edSex',data.sex);
 set('edStatus',data.status);

 const note=document.getElementById('edNote');
 if(note&&!note.value)note.value=data.note;
}

function fileInput(){
 let el=document.getElementById('hknRuntimeFileInput');
 if(el)return el;
 el=document.createElement('input');
 el.id='hknRuntimeFileInput';
 el.type='file';
 el.accept='image/*';
 el.setAttribute('capture','environment');
 el.style.display='none';
 document.body.appendChild(el);
 return el;
}

async function run(){
 const input=fileInput();
 input.value='';
 input.onchange=function(){
  const file=input.files&&input.files[0];
  if(!file)return;
  const reader=new FileReader();
  reader.onload=function(){
   try{
    sessionStorage.setItem('terracontrol_hkn_import_v1',JSON.stringify({
     name:file.name||'Herkunftsnachweis',
     type:file.type||'',
     data:String(reader.result||''),
     at:new Date().toISOString()
    }));
   }catch(e){
    NGT500.toast(
     'HKN konnte nicht zwischengespeichert werden: '+(e.message||e),
     'danger'
    );
    return;
   }
   NGT500.route('animals',{hkn:1});
  };
  reader.onerror=function(){
   NGT500.toast(
    'HKN-Datei konnte nicht gelesen werden.',
    'danger'
   );
  };
  reader.readAsDataURL(file);
 };
 input.click();
}

function applyManual(){
 const box=document.getElementById('hknOcrText');
 const text=box?box.value:'';
 if(!text.trim()){
  NGT500.toast('Bitte erkannten Text einfügen.','warn');
  return;
 }
 apply(parse(text));
 NGT500.toast(
  'HKN-Text wurde ausgewertet. Bitte Felder prüfen.',
  'ok'
 );
}

window.NGTHknImport={run,parse,apply,applyManual};
})();
