(function(){
'use strict';

let tab='overview',ctx={t:'koenig',i:0};

function esc(v){return NGT500.esc(v||'')}
function current(){return NGTStore.animal(ctx.t,ctx.i)}
function ensure(a){a.health=Array.isArray(a.health)?a.health:[];a.photos=Array.isArray(a.photos)?a.photos:[];a.feeds=Array.isArray(a.feeds)?a.feeds:[];a.sheds=Array.isArray(a.sheds)?a.sheds:[];a.weights=Array.isArray(a.weights)?a.weights:[]}
function latest(list){return (list||[]).slice().sort((a,b)=>String(b.date||'').localeCompare(String(a.date||'')))[0]||null}
function daysSince(d){const t=Date.parse(d||'');return t?Math.floor((Date.now()-t)/86400000):9999}
function age(birth){const t=Date.parse(birth||'');if(!t)return '-';const y=Math.floor((Date.now()-t)/31557600000);return y>0?y+' Jahre':'< 1 Jahr'}
function s(v,n){return String(v==null?'':v).replace(/[\n\r|]/g,' ').slice(0,n||80)}
function opt(list,cur){return (list||[]).map(v=>`<option value="${esc(v)}" ${String(cur||'')===String(v)?'selected':''}>${esc(v)}</option>`).join('')}

function healthStatus(a){
 let score=0;
 const lf=latest(a.feeds),lw=latest(a.weights),lh=latest(a.health);
 const recent=(a.feeds||[]).slice().sort((p,q)=>String(q.date||'').localeCompare(String(p.date||''))).slice(0,3);
 if(recent.length>=2&&recent.slice(0,2).every(f=>f.accepted===false))score+=2;
 if(lw){
  const w=(a.weights||[]).slice().sort((p,q)=>String(p.date||'').localeCompare(String(q.date||'')));
  if(w.length>=2&&Number(w[w.length-1].weight)<Number(w[w.length-2].weight))score+=2;
 }
 if(lf&&daysSince(lf.date)>=(Number(a.feedIntervalDays||a.feedingInterval||14)+7))score+=1;
 if(lw&&daysSince(lw.date)>=45)score+=1;
 if(lh&&String(lh.status||'').toLowerCase()!=='abgeschlossen')score+=1;
 if(score>=3)return {txt:'Handlungsbedarf',icon:'🔴',cls:'danger'};
 if(score>=1)return {txt:'Beobachten',icon:'🟡',cls:'warn'};
 return {txt:'Alles in Ordnung',icon:'🟢',cls:'ok'};
}

function smallHistory(a){return {weights:(a.weights||[]).slice(-5).map(x=>({d:s(x.date,10),g:Number(x.weight||0)})),feeds:(a.feeds||[]).slice(-5).map(x=>({d:s(x.date,10),p:s(x.prey,24),g:Number(x.amount||0),ok:x.accepted!==false,state:s(x.state||'',10),size:s(x.size||'',12)})),sheds:(a.sheds||[]).slice(-5).map(x=>({d:s(x.date,10),ok:x.complete!==false}))}}
function passportObject(a,withHistory){return {app:'TerraControl',type:'animal-passport',v:2,animal:{id:s(a.uuid||a.uid,80),name:s(a.name,60),morph:s(a.morph,60),sex:s(a.sex,20),birth:s(a.birth,10),origin:s(a.origin||a.originType,40),father:s(a.father||a.vater||a.sire,60),mother:s(a.mother||a.mutter||a.dam,60),food:s(a.defaultFeeder,60),feedDays:Number(a.feedIntervalDays||a.feedingInterval||14),weightDays:30},history:withHistory?smallHistory(a):undefined}}
function passportPayload(a){try{let full=JSON.stringify(passportObject(a,true));if(full.length<1800)return full;let lite=JSON.stringify(passportObject(a,false));if(lite.length<1200)return lite;return ['TC2',s(a.uuid||a.uid,80),s(a.name,50),s(a.morph,50),s(a.sex,20),s(a.birth,10)].join('|')}catch(e){return ['TC2',s(a.uuid||a.uid,80),s(a.name,50)].join('|')}}

function render(args){
 ctx=args||ctx;
 tab=args.tab||tab;
 const a=current();
 if(!a)return '<div class="card tc2PageCard">Tier nicht gefunden.</div>';
 ensure(a);

 const p=(a.photos||[]).find(x=>x.cover)||(a.photos||[])[0];
 const hs=healthStatus(a);
 const lw=latest(a.weights);

 return `<div class="card tc2PageCard tc2ProfilePage">
  <div class="tc2ProfileHero">
   ${p?`<img src="${p.data}">`:`<div class="tc2ProfileHeroEmpty">📷</div>`}
   <div class="tc2ProfileHeroShade"></div>
   <button class="tc2BackBtn" onclick="NGT500.route('animals',{t:'${ctx.t}'})">‹ Bestand</button>
   <div class="tc2ProfileStatus">${hs.icon} ${esc(hs.txt)}</div>
   <div class="tc2ProfileTitle">
    <h2>${esc(a.name||'Unbenannt')}</h2>
    <p>${esc(a.morph||'-')} · ${esc(a.sex||'-')} · ${esc(age(a.birth))}</p>
   </div>
  </div>

  <div class="tc2ProfileStats">
   <div><small>Gewicht</small><b>${lw?esc(lw.weight)+' g':'-'}</b></div>
   <div><small>Schlupf</small><b>${esc(a.birth||'-')}</b></div>
   <div><small>Intervall</small><b>${esc(a.feedIntervalDays||a.feedingInterval||14)} Tage</b></div>
  </div>

  <div class="tc2ProfileSummary">
   <div><span>🐀</span><p><b>Standardfutter</b><small>${esc(a.defaultFeeder||'-')}</small></p></div>
   <div><span>🧬</span><p><b>Eltern</b><small>Vater: ${esc(a.father||a.vater||a.sire||'-')} · Mutter: ${esc(a.mother||a.mutter||a.dam||'-')}</small></p></div>
   <div><span>🆔</span><p><b>UUID</b><small>${esc(a.uuid||'-')}</small></p></div>
  </div>

  <div class="tc2Tabs">
   ${tabButton('overview','Übersicht')}
   ${tabButton('feeds','Fütterungen')}
   ${tabButton('sheds','Häutungen')}
   ${tabButton('weights','Gewichte')}
   ${tabButton('photos','Fotos')}
   ${tabButton('health','Gesundheit')}
   ${tabButton('life','Chronik')}
   ${tabButton('docs','Dokumente')}
   ${tabButton('charts','Diagramme')}
   ${tabButton('analysis','Analyse')}
   ${tabButton('qr','QR')}
  </div>

  <div class="tc2ProfileBody">${body(a)}</div>
 </div>`;
}

function tabButton(id,label){
 return `<button class="${tab===id?'on':''}" onclick="NGTProfile.setTab('${id}')">${label}</button>`;
}

function body(a){
 if(tab==='overview')return overview(a);
 if(tab==='life')return `<div class="subcard tc2SubCard"><h3>Chronik</h3>${NGTUI.list(NGTUI.timeline(a))}</div>`;
 if(tab==='docs')return docs(a);
 if(tab==='feeds')return feedForm(a)+feedList(a);
 if(tab==='sheds')return shedForm()+shedList(a);
 if(tab==='weights')return weightForm()+weightList(a);
 if(tab==='photos')return photos(a);
 if(tab==='health')return health(a);
 if(tab==='charts')return charts(a);
 if(tab==='analysis')return analysis(a);
 if(tab==='qr'){
  const p=passportPayload(a);
  return `<div class="subcard tc2SubCard"><h3>Digitaler Tierpass</h3><div class="qrBox"><div id="profileQr"></div></div><p class="muted">QR-Code enthält eine bereinigte TerraControl-Payload.</p><textarea readonly>${esc(p)}</textarea></div>`;
 }
 return '';
}

function overview(a){
 const lf=latest(a.feeds),lw=latest(a.weights),lh=latest(a.health);
 return `<div class="tc2ProfileOverviewGrid">
  <div><small>Fotos</small><b>${(a.photos||[]).length}</b></div>
  <div><small>Fütterungen</small><b>${(a.feeds||[]).length}</b></div>
  <div><small>Gewichte</small><b>${(a.weights||[]).length}</b></div>
  <div><small>Gesundheit</small><b>${(a.health||[]).length}</b></div>
 </div>
 <div class="subcard tc2SubCard">
  <h3>Zusammenfassung</h3>
  <div class="tc2InfoRows">
   <div><b>Kaufwert</b><span>${NGT500.money(a.buyPrice||0)}</span></div>
   <div><b>Marktwert</b><span>${NGT500.money(NGTStore.market(a))}</span></div>
   <div><b>Letzte Fütterung</b><span>${lf?esc(lf.date)+' '+(lf.accepted===false?'verweigert':'gefressen'):'-'}</span></div>
   <div><b>Gewicht</b><span>${lw?esc(lw.weight)+' g am '+esc(lw.date):'-'}</span></div>
   <div><b>Gesundheit</b><span>${lh?esc(lh.date)+' '+esc(lh.title||lh.type):'-'}</span></div>
   <div><b>Notizen</b><span>${esc(a.note||'-')}</span></div>
  </div>
 </div>`;
}

function docs(a){
 const uid=encodeURIComponent(a.uuid||a.uid||'');
 return `<div class="subcard tc2SubCard"><h3>Dokumentencenter</h3><div class="btnRow"><button onclick="location.href='./abgabe.html?id=${uid}'">Abgabenachweis / PDF</button><button onclick="NGTProfile.setTab('qr')">Digitaler Tierpass QR</button></div><p class="muted">Später kommen hier Herkunftsnachweise, CITES/Artenschutz-Dokumente und Verkaufsunterlagen hinzu.</p></div>`;
}

function feedForm(a){
 const p=NGTStore.parseFeeder(a.defaultFeeder||'');
 const state=a.defaultFeederState||p.state||'Frost';
 const type=a.defaultFeederType||p.prey||'Ratte';
 const size=a.defaultFeederSize||p.size||((NGTStore.FEEDER_SIZES[type]||[])[0]||'');
 return `<div class="subcard tc2SubCard"><h3>Fütterung eintragen</h3><input id="feedDate" type="date" value="${NGT500.today()}"><div class="btnRow"><button type="button" id="feedBtnFrost" onclick="NGTProfile.setFeedState('Frost')">Frost</button><button type="button" id="feedBtnLebend" onclick="NGTProfile.setFeedState('Lebend')">Lebend</button></div><input id="feedState" type="hidden" value="${esc(state)}"><select id="feedType" onchange="NGTProfile.refreshFeedSizes()">${opt(NGTStore.FEEDER_TYPES,type)}</select><select id="feedSize">${opt(NGTStore.FEEDER_SIZES[type]||[],size)}</select><select id="feedStatus"><option value="ok">Gefressen</option><option value="no">Verweigert</option></select><p class="muted">Standard: ${esc(a.defaultFeeder||'kein Standardfutter')}</p><button onclick="NGTProfile.addFeed()">Fütterung speichern</button></div>`;
}

function shedForm(){return `<div class="subcard tc2SubCard"><h3>Häutung eintragen</h3><input id="shedDate" type="date" value="${NGT500.today()}"><button onclick="NGTProfile.addShed()">Häutung speichern</button></div>`}
function weightForm(){return `<div class="subcard tc2SubCard"><h3>Gewicht eintragen</h3><input id="weightDate" type="date" value="${NGT500.today()}"><input id="weightValue" type="number" placeholder="Gewicht in g"><button onclick="NGTProfile.addWeight()">Gewicht speichern</button></div>`}
function row(d,txt,del){return `<div class="tc2ListRowFull"><div><b>${esc(d||'-')}</b><small>${esc(txt||'')}</small></div><button class="danger" onclick="${del}">Löschen</button></div>`}
function feedList(a){return `<div class="subcard tc2SubCard"><h3>Fütterungen</h3>${(a.feeds||[]).map((f,i)=>({f,i})).reverse().map(x=>row(x.f.date,`${x.f.accepted===false?'Verweigert':'Gefressen'} ${x.f.state?x.f.state+' ':''}${x.f.prey||''} ${x.f.size||((x.f.amount||'')?x.f.amount+' g':'')}`,`NGTProfile.deleteEntry('feeds',${x.i})`)).join('')||'<p class="muted">Keine Fütterungen.</p>'}</div>`}
function shedList(a){return `<div class="subcard tc2SubCard"><h3>Häutungen</h3>${(a.sheds||[]).map((s,i)=>({s,i})).reverse().map(x=>row(x.s.date,'Häutung',`NGTProfile.deleteEntry('sheds',${x.i})`)).join('')||'<p class="muted">Keine Häutungen.</p>'}</div>`}
function weightList(a){return `<div class="subcard tc2SubCard"><h3>Gewichte</h3>${(a.weights||[]).map((w,i)=>({w,i})).reverse().map(x=>row(x.w.date,x.w.weight+'g',`NGTProfile.deleteEntry('weights',${x.i})`)).join('')||'<p class="muted">Keine Gewichte.</p>'}</div>`}

function photos(a){
 return `<div class="subcard tc2SubCard"><h3>Foto hinzufügen</h3><input type="file" accept="image/*" onchange="NGTProfile.addPhoto(this.files[0])"><select id="photoType"><option>Portrait</option><option>Terrarium</option><option>Häutung</option><option>Fütterung</option><option>Nachwuchs</option><option>Gesundheit</option><option>Sonstige</option></select><input id="photoNote" placeholder="Notiz zum Foto"><p class="muted">Das erste Foto wird automatisch Titelbild.</p></div>`+
 (a.photos||[]).map((p,i)=>`<div class="subcard tc2SubCard"><img class="photo" src="${p.data}"><b>${esc(p.date||'')}</b> · ${esc(p.type||'Sonstige')} ${p.cover?'· Titelbild':''}<br>${esc(p.note||'')}<div class="btnRow"><button onclick="NGTProfile.setCover(${i})">Als Titelbild</button><button class="danger" onclick="NGTProfile.deletePhoto(${i})">Foto löschen</button></div></div>`).join('');
}

function health(a){return healthForm()+((a.health||[]).map((h,i)=>({h,i})).reverse().map(x=>`<div class="subcard tc2SubCard"><b>${esc(x.h.date||'-')} · ${esc(x.h.type||'Gesundheit')}</b><br>${esc(x.h.title||'')}<br>${esc(x.h.medication||'')} ${esc(x.h.dose||'')} ${esc(x.h.duration||'')}<br>Status: ${esc(x.h.status||'-')}<br>${esc(x.h.note||'')}<button class="danger" onclick="NGTProfile.deleteEntry('health',${x.i})">Eintrag löschen</button></div>`).join('')||'<p class="muted">Keine Gesundheitsdaten.</p>')}
function healthForm(){return `<div class="subcard tc2SubCard"><h3>Gesundheits-Eintrag</h3><input id="healthDate" type="date" value="${NGT500.today()}"><select id="healthType"><option>Tierarzt</option><option>Behandlung</option><option>Medikament</option><option>Diagnose</option><option>Kontrolle</option><option>Kotprobe</option><option>Parasitenbehandlung</option><option>OP</option><option>Verletzung</option><option>Quarantäne</option><option>Notiz</option></select><input id="healthTitle" placeholder="Titel / Diagnose"><input id="healthMedication" placeholder="Medikament"><input id="healthDose" placeholder="Dosierung"><input id="healthDuration" placeholder="Dauer"><select id="healthStatus"><option>offen</option><option>laufend</option><option>abgeschlossen</option></select><textarea id="healthNote" placeholder="Notizen"></textarea><button onclick="NGTProfile.addHealth()">Gesundheit speichern</button></div>`}

function barChart(rows){if(!rows.length)return '<p class="muted">Keine Daten.</p>';const max=Math.max(...rows.map(r=>Number(r.value||0)),1);return rows.map(r=>`<div class="tc2Bar"><small>${esc(r.label||'-')}</small><span><i style="width:${Math.max(4,Math.round((Number(r.value||0)/max)*100))}%"></i></span><b>${esc(r.value)}</b></div>`).join('')}
function charts(a){return `<div class="subcard tc2SubCard"><h3>Gewicht</h3>${barChart((a.weights||[]).map(w=>({label:w.date,value:Number(w.weight||0)})))}</div><div class="subcard tc2SubCard"><h3>Fütterungen</h3>${barChart((a.feeds||[]).map(f=>({label:f.date,value:f.accepted===false?0:1})))}</div>`}
function analysis(a){const refused=(a.feeds||[]).filter(f=>f.accepted===false).length,accepted=(a.feeds||[]).filter(f=>f.accepted!==false).length,first=(a.weights||[])[0],last=(a.weights||[]).slice(-1)[0];let diff='-';if(first&&last&&first!==last)diff=(Number(last.weight)-Number(first.weight))+'g';return `<div class="subcard tc2SubCard"><h3>Analyse</h3><div class="tc2InfoRows"><div><b>Gefressen</b><span>${accepted}</span></div><div><b>Verweigert</b><span>${refused}</span></div><div><b>Gewichtsveränderung</b><span>${esc(diff)}</span></div><div><b>Status</b><span>${esc(healthStatus(a).txt)}</span></div></div></div>`}

function setTab(x){tab=x;NGT500.route('profile',{t:ctx.t,i:ctx.i,tab:x})}
function setFeedState(state){const el=document.getElementById('feedState');if(el)el.value=state;['Frost','Lebend'].forEach(s=>{const b=document.getElementById('feedBtn'+s);if(b)b.classList.toggle('primary',s===state)})}
function refreshFeedSizes(){const type=document.getElementById('feedType').value;const size=document.getElementById('feedSize');size.innerHTML=(NGTStore.FEEDER_SIZES[type]||[]).map(v=>`<option value="${esc(v)}">${esc(v)}</option>`).join('')}
function addFeed(){const a=current();const state=document.getElementById('feedState')?.value||a.defaultFeederState||'Frost';const type=document.getElementById('feedType')?.value||a.defaultFeederType||'Ratte';const size=document.getElementById('feedSize')?.value||a.defaultFeederSize||'';const label=NGTStore.feederLabel(state,type,size);const p=NGTStore.parseFeeder(label);a.feeds=a.feeds||[];a.feeds.push({date:document.getElementById('feedDate').value||NGT500.today(),state:p.state,prey:p.prey,size:p.size,amount:p.amount,label:p.label,accepted:document.getElementById('feedStatus').value!=='no'});if(p.label)NGTStore.reduceFood(p.label,1);else NGTStore.save();setTab('feeds')}
function addShed(){const a=current();a.sheds=a.sheds||[];a.sheds.push({date:document.getElementById('shedDate').value||NGT500.today(),complete:true});NGTStore.save();setTab('sheds')}
function addWeight(){const a=current();const g=Number(document.getElementById('weightValue').value||0);if(!g)return alert('Gewicht fehlt');a.weights=a.weights||[];a.weights.push({date:document.getElementById('weightDate').value||NGT500.today(),weight:g});a.weight=g;NGTStore.save();setTab('weights')}
function addHealth(){const a=current();a.health=a.health||[];a.health.push({id:NGT500.uid(),date:healthDate.value||NGT500.today(),type:healthType.value,title:healthTitle.value,medication:healthMedication.value,dose:healthDose.value,duration:healthDuration.value,status:healthStatus.value,note:healthNote.value});NGTStore.save();setTab('health')}
function deleteEntry(kind,i){if(!confirm('Eintrag löschen?'))return;const a=current();a[kind].splice(i,1);if(kind==='weights'){const last=(a.weights||[]).slice(-1)[0];a.weight=last?last.weight:''}NGTStore.save();setTab(tab)}
function compressPhoto(file){return new Promise((resolve,reject)=>{const img=new Image();const r=new FileReader();r.onerror=reject;r.onload=()=>{img.onload=()=>{const max=900;let w=img.width,h=img.height;if(w>h&&w>max){h=Math.round(h*max/w);w=max}else if(h>=w&&h>max){w=Math.round(w*max/h);h=max}const c=document.createElement('canvas');c.width=w;c.height=h;const x=c.getContext('2d');x.drawImage(img,0,0,w,h);resolve(c.toDataURL('image/jpeg',0.72))};img.onerror=reject;img.src=r.result};r.readAsDataURL(file)})}
async function addPhoto(file){if(!file)return;try{const a=current();a.photos=a.photos||[];const data=await compressPhoto(file);a.photos.push({id:NGT500.uid(),date:NGT500.today(),type:document.getElementById('photoType')?.value||'Sonstige',note:document.getElementById('photoNote')?.value||'',cover:a.photos.length===0,data});NGTStore.save();setTab('photos')}catch(e){alert('Foto konnte nicht dauerhaft gespeichert werden. Bitte kleineres Foto wählen oder Backup/Drive-Speicher aktivieren.')}}
function setCover(i){const a=current();(a.photos||[]).forEach((p,n)=>p.cover=n===i);NGTStore.save();setTab('photos')}
function deletePhoto(i){if(confirm('Foto löschen?')){current().photos.splice(i,1);NGTStore.save();setTab('photos')}}
function afterRender(){const a=current();if(tab==='feeds')setFeedState(document.getElementById('feedState')?.value||'Frost');if(tab==='qr'&&a&&window.QRCode){const box=document.getElementById('profileQr');box.innerHTML='';const payload=passportPayload(a);try{new QRCode(box,{text:payload,width:220,height:220,correctLevel:QRCode.CorrectLevel.L})}catch(e){box.innerHTML='';new QRCode(box,{text:['TC2',s(a.uuid||a.uid,80),s(a.name,50)].join('|'),width:220,height:220,correctLevel:QRCode.CorrectLevel.L})}}}

window.NGTProfile={setTab,addPhoto,setCover,deletePhoto,addFeed,addShed,addWeight,addHealth,deleteEntry,setFeedState,refreshFeedSizes};
NGT500.register('profile',{render,afterRender});

})();