(function(){
'use strict';

let tab='overview';
let ctx={t:'',i:0};
let viewerIndex=-1;
let viewerKeyHandler=null;

function esc(v){return NGT500.esc(v||'')}
function current(){return NGTStore.animal(ctx.t,ctx.i)}

function ensure(a){
 a.health=Array.isArray(a.health)?a.health:[];
 a.photos=Array.isArray(a.photos)?a.photos:[];
 a.feeds=Array.isArray(a.feeds)?a.feeds:[];
 a.sheds=Array.isArray(a.sheds)?a.sheds:[];
 a.weights=Array.isArray(a.weights)?a.weights:[];
}

function latest(list){
 return (list||[])
  .slice()
  .sort((a,b)=>String(b.date||'').localeCompare(String(a.date||'')))[0]||null;
}

function daysSince(d){
 const t=Date.parse(d||'');
 return t?Math.floor((Date.now()-t)/86400000):9999;
}

function age(birth){
 const t=Date.parse(birth||'');

 if(!t)return '-';

 const y=Math.floor((Date.now()-t)/31557600000);

 return y>0?y+' Jahre':'< 1 Jahr';
}

function s(v,n){
 return String(v==null?'':v)
  .replace(/[\n\r|]/g,' ')
  .slice(0,n||80);
}

function opt(list,cur){
 return (list||[])
  .map(v=>`<option value="${esc(v)}" ${String(cur||'')===String(v)?'selected':''}>${esc(v)}</option>`)
  .join('');
}

function jsArg(v){
 return String(v||'')
  .replace(/\\/g,'\\\\')
  .replace(/'/g,"\\'");
}

function text(v){
 return String(v==null?'':v).trim();
}

function sexCode(v){
 v=String(v||'').toLowerCase();

 if(v.includes('weib'))return '0.1';
 if(v.includes('männ')||v.includes('maenn'))return '1.0';

 return '0.0';
}

function scientificName(a){
 return [a.genus,a.species]
  .filter(Boolean)
  .join(' ')||
  a.animalGroup||
  '-';
}

function photoSrc(photo,thumb){
 if(!photo)return '';

 if(window.NGTPhotoStorage&&NGTPhotoStorage.src){
  return NGTPhotoStorage.src(photo,thumb);
 }

 if(thumb&&(photo.thumbUrl||photo.thumbnailUrl)){
  return photo.thumbUrl||photo.thumbnailUrl;
 }

 return photo.url||
  photo.thumbUrl||
  photo.thumbnailUrl||
  photo.data||
  '';
}

function isUsablePhoto(photo){
 return !!photoSrc(photo,true);
}

function usablePhotos(a){
 return (a&&Array.isArray(a.photos)?a.photos:[])
  .filter(isUsablePhoto);
}

function profilePhoto(a){
 const photos=usablePhotos(a);

 return photos.find(function(photo){
  return photo.cover;
 })||photos[0]||null;
}

function hasLegacyPhotos(a){
 if(window.NGTPhotoStorage&&NGTPhotoStorage.hasLegacyPhotos){
  return NGTPhotoStorage.hasLegacyPhotos(a);
 }

 return !!(
  a&&
  Array.isArray(a.photos)&&
  a.photos.some(function(p){
   return p&&
    p.data&&
    String(p.data).startsWith('data:image')&&
    !p.storagePath&&
    !p.url;
  })
 );
}

function foodInventory(){
 const data=NGTStore.data();

 if(!Array.isArray(data.foodInventory)){
  data.foodInventory=[];
 }

 return data.foodInventory;
}

function normalizeFoodItem(item){
 item=item||{};

 const parsed=window.NGTStore&&NGTStore.parseFeeder
  ?NGTStore.parseFeeder(item.label||item.name||'')
  :{};

 item.id=item.id||
  item.key||
  'food_'+Math.random().toString(36).slice(2,10);

 item.category=text(
  item.category||
  item.group||
  item.foodCategory||
  'Futtertiere'
 );

 item.condition=text(
  item.condition||
  item.state||
  parsed.state||
  ''
 );

 item.itemName=text(
  item.itemName||
  item.prey||
  item.type||
  parsed.prey||
  item.label||
  item.name||
  'Unbenannt'
 );

 item.variant=text(
  item.variant||
  item.size||
  parsed.size||
  ''
 );

 item.unit=text(item.unit||'Stück');
 item.qty=Number(item.qty||0);
 item.minimum=Number(
  item.minimum!==undefined
   ?item.minimum
   :(item.minQty||0)
 );

 item.label=text(item.label)||
  [
   item.condition,
   item.itemName,
   item.variant
  ].filter(Boolean).join(' ');

 item.name=item.label;

 return item;
}

function normalizedFoodInventory(){
 return foodInventory()
  .map(normalizeFoodItem)
  .sort(function(a,b){
   const categoryCompare=String(a.category||'')
    .localeCompare(String(b.category||''),'de');

   if(categoryCompare!==0)return categoryCompare;

   return foodLabel(a).localeCompare(foodLabel(b),'de');
  });
}

function foodLabel(item){
 if(!item)return '';

 return [
  item.condition,
  item.itemName,
  item.variant
 ].filter(Boolean).join(' ')||
 item.label||
 item.name||
 'Unbenannt';
}

function foodMeta(item){
 if(!item)return '';

 return [
  item.category,
  Number(item.qty||0)+' '+(item.unit||'Stück')
 ].filter(Boolean).join(' · ');
}

function foodById(id){
 return normalizedFoodInventory().find(function(item){
  return String(item.id)===String(id);
 })||null;
}

function defaultFoodId(a){
 const stored=text(
  a.defaultFeederId||
  a.foodInventoryId||
  ''
 );

 if(stored&&foodById(stored)){
  return stored;
 }

 const legacy=text(
  a.defaultFeeder||
  a.futterStandard||
  a.standardFeed||
  ''
 );

 if(!legacy)return '';

 const match=normalizedFoodInventory().find(function(item){
  return foodLabel(item)===legacy||
   text(item.label)===legacy||
   text(item.name)===legacy;
 });

 return match?match.id:'';
}

function foodOptions(a){
 const items=normalizedFoodInventory();
 const selectedId=defaultFoodId(a);

 if(!items.length){
  return '<option value="">Kein Futterbestand vorhanden</option>';
 }

 return items.map(function(item){
  const selected=String(item.id)===String(selectedId);

  return `<option value="${esc(item.id)}" ${selected?'selected':''}>
   ${esc(foodLabel(item))} · ${esc(foodMeta(item))}
  </option>`;
 }).join('');
}

function healthStatus(a){
 let score=0;

 const lf=latest(a.feeds);
 const lw=latest(a.weights);
 const lh=latest(a.health);

 const recent=(a.feeds||[])
  .slice()
  .sort((p,q)=>String(q.date||'').localeCompare(String(p.date||'')))
  .slice(0,3);

 if(
  recent.length>=2&&
  recent.slice(0,2).every(f=>f.accepted===false)
 ){
  score+=2;
 }

 if(lw){
  const weights=(a.weights||[])
   .slice()
   .sort((p,q)=>String(p.date||'').localeCompare(String(q.date||'')));

  if(
   weights.length>=2&&
   Number(weights[weights.length-1].weight)<
   Number(weights[weights.length-2].weight)
  ){
   score+=2;
  }
 }

 if(
  lf&&
  daysSince(lf.date)>=
  (
   Number(
    a.feedIntervalDays||
    a.feedingInterval||
    14
   )+7
  )
 ){
  score+=1;
 }

 if(lw&&daysSince(lw.date)>=45){
  score+=1;
 }

 if(
  lh&&
  String(lh.status||'').toLowerCase()!=='abgeschlossen'
 ){
  score+=1;
 }

 if(score>=3){
  return {
   txt:'Handlungsbedarf',
   icon:'🔴',
   cls:'danger'
  };
 }

 if(score>=1){
  return {
   txt:'Beobachten',
   icon:'🟡',
   cls:'warn'
  };
 }

 return {
  txt:'Alles in Ordnung',
  icon:'🟢',
  cls:'ok'
 };
}

function smallHistory(a){
 return {
  weights:(a.weights||[]).slice(-5).map(x=>({
   d:s(x.date,10),
   g:Number(x.weight||0)
  })),

  feeds:(a.feeds||[]).slice(-5).map(x=>({
   d:s(x.date,10),
   p:s(x.prey,24),
   g:Number(x.amount||0),
   ok:x.accepted!==false,
   state:s(x.state||'',10),
   size:s(x.size||'',12)
  })),

  sheds:(a.sheds||[]).slice(-5).map(x=>({
   d:s(x.date,10),
   ok:x.complete!==false
  }))
 };
}

function passportObject(a,withHistory){
 return {
  app:'TerraControl',
  type:'animal-passport',
  v:4,

  animal:{
   id:s(a.publicId||a.displayId||a.uuid||a.uid,80),
   uuid:s(a.uuid||a.uid,80),
   name:s(a.name,60),
   animalGroup:s(a.animalGroup,60),
   genus:s(a.genus,60),
   species:s(a.species,60),
   sex:s(a.sex,20),
   sexCode:sexCode(a.sex),
   birth:s(a.birth,10),
   origin:s(a.origin||a.originType,40),
   father:s(a.father||a.vater||a.sire,60),
   mother:s(a.mother||a.mutter||a.dam,60),
   food:s(a.defaultFeeder,60),
   feedDays:Number(a.feedIntervalDays||a.feedingInterval||14),
   weightDays:Number(a.weightIntervalDays||30)
  },

  history:withHistory
   ?smallHistory(a)
   :undefined
 };
}

function passportPayload(a){
 try{
  const full=JSON.stringify(
   passportObject(a,true)
  );

  if(full.length<1800)return full;

  const lite=JSON.stringify(
   passportObject(a,false)
  );

  if(lite.length<1200)return lite;

  return [
   'TC2',
   s(a.publicId||a.uuid||a.uid,80),
   s(a.name,50),
   s(a.genus,50),
   s(a.species,50),
   s(a.sex,20),
   s(a.birth,10)
  ].join('|');

 }catch(e){
  return [
   'TC2',
   s(a.publicId||a.uuid||a.uid,80),
   s(a.name,50)
  ].join('|');
 }
}

function render(args){
 closePhotoViewer();

 ctx=args||ctx;
 tab=(args&&args.tab)?args.tab:'overview';

 const a=current();

 if(!a){
  return '<div class="card tc2PageCard">Tier nicht gefunden.</div>';
 }

 ensure(a);

 const cover=profilePhoto(a);
 const img=photoSrc(cover,true);
 const hs=healthStatus(a);
 const lw=latest(a.weights);
 const id=a.publicId||a.displayId||a.uuid||'-';
 const sci=scientificName(a);

 return `<div class="card tc2PageCard tc2ProfilePage tc2ProfileV4">
  <div class="tc2ProfileTopBar">
   <button
    class="tc2ProfileTopBack"
    onclick="NGT500.route('animals',{group:'${jsArg(a.animalGroup)}',genus:'${jsArg(a.genus||'Ohne Gattung')}'})"
   >
    ‹ Bestand
   </button>

   <div class="tc2ProfileTopStatus ${hs.cls}">
    ${hs.icon} ${esc(hs.txt)}
   </div>
  </div>

  <section class="tc2ProfileIdentity">
   <b class="tc2ProfilePublicId">${esc(id)}</b>

   ${a.name?`<h2>${esc(a.name)}</h2>`:''}

   <h3>${esc(sexCode(a.sex))}</h3>
   <h3 class="tc2ProfileScientific">${esc(sci)}</h3>

   ${a.morph?`<p>${esc(a.morph)}</p>`:''}

   <small>${esc(a.animalGroup||'Unsortiert')}</small>
  </section>

  <div
   class="tc2ProfileHero"
   ${img?'onclick="NGTProfile.openCoverPhoto()"':''}
  >
   ${
    img
     ?`<img src="${esc(img)}" alt="Tierfoto">`
     :'<div class="tc2ProfileHeroEmpty">📷</div>'
   }
  </div>

  <section class="tc2ProfileActionGrid">
   ${action('✏️','Bearbeiten',`NGT500.route('animals',{edit:${ctx.i}})`)}
   ${action('🍽️','Fütterung',`NGTProfile.setTab('feeds')`)}
   ${action('⚖️','Gewicht',`NGTProfile.setTab('weights')`)}
   ${action('🦴','Häutung',`NGTProfile.setTab('sheds')`)}
   ${action('📷','Fotos',`NGTProfile.setTab('photos')`)}
   ${action('📄','Dokumente',`NGTProfile.setTab('docs')`)}
   ${action('▦','Tierpass',`NGTProfile.setTab('qr')`)}
   ${action('🩺','Gesundheit',`NGTProfile.setTab('health')`)}
  </section>

  <div class="tc2ProfileStats">
   <div>
    <small>Gewicht</small>
    <b>
     ${
      lw
       ?esc(lw.weight)+' g'
       :(a.weight?esc(a.weight)+' g':'-')
     }
    </b>
   </div>

   <div>
    <small>Alter</small>
    <b>${esc(age(a.birth))}</b>
   </div>

   <div>
    <small>Status</small>
    <b>${esc(a.status||'-')}</b>
   </div>

   <div>
    <small>Intervall</small>
    <b>
     ${esc(a.feedIntervalDays||a.feedingInterval||'-')} Tage
    </b>
   </div>
  </div>

  <div class="tc2ProfileBody">
   ${body(a)}
  </div>
 </div>`;
}

function action(icon,label,onclick){
 return `<button class="tc2ProfileAction" onclick="${onclick}">
  <div class="tc2ProfileActionIcon">${icon}</div>
  <div class="tc2ProfileActionText">${esc(label)}</div>
  <div class="tc2ProfileActionArrow">›</div>
 </button>`;
}

function body(a){
 if(tab==='overview')return overview(a);

 if(tab==='life'){
  return `<div class="subcard tc2SubCard">
   <h3>Chronik</h3>
   ${NGTUI.list(NGTUI.timeline(a))}
  </div>`;
 }

 if(tab==='docs')return docs(a);
 if(tab==='feeds')return feedForm(a)+feedList(a);
 if(tab==='sheds')return shedForm()+shedList(a);
 if(tab==='weights')return weightForm()+weightList(a);
 if(tab==='photos')return photos(a);
 if(tab==='health')return health(a);
 if(tab==='charts')return charts(a);
 if(tab==='analysis')return analysis(a);

 if(tab==='qr'){
  const payload=passportPayload(a);

  return `<div class="subcard tc2SubCard">
   <h3>Digitaler Tierpass</h3>

   <div class="qrBox">
    <div id="profileQr"></div>
   </div>

   <p class="muted">
    QR-Code enthält TerraControl-ID, Tierdaten und optional
    gekürzte Historie.
   </p>

   <textarea readonly>${esc(payload)}</textarea>
  </div>`;
 }

 return '';
}

function overview(a){
 const lf=latest(a.feeds);
 const lw=latest(a.weights);
 const lh=latest(a.health);

 return `<div class="tc2ProfileOverviewGrid">
  <div>
   <small>Fotos</small>
   <b>${usablePhotos(a).length}</b>
  </div>

  <div>
   <small>Fütterungen</small>
   <b>${(a.feeds||[]).length}</b>
  </div>

  <div>
   <small>Gewichte</small>
   <b>${(a.weights||[]).length}</b>
  </div>

  <div>
   <small>Gesundheit</small>
   <b>${(a.health||[]).length}</b>
  </div>
 </div>

 <div class="subcard tc2SubCard">
  <h3>Zusammenfassung</h3>

  <div class="tc2InfoRows">
   <div>
    <b>TerraControl-ID</b>
    <span>${esc(a.publicId||a.displayId||'-')}</span>
   </div>

   <div>
    <b>Wissenschaftlich</b>
    <span>
     ${esc(sexCode(a.sex)+' '+scientificName(a))}
    </span>
   </div>

   <div>
    <b>Letzte Fütterung</b>
    <span>
     ${
      lf
       ?esc(lf.date)+' '+(
        lf.accepted===false
         ?'verweigert'
         :'gefressen'
       )
       :'-'
     }
    </span>
   </div>

   <div>
    <b>Gewicht</b>
    <span>
     ${
      lw
       ?esc(lw.weight)+' g am '+esc(lw.date)
       :'-'
     }
    </span>
   </div>

   <div>
    <b>Gesundheit</b>
    <span>
     ${
      lh
       ?esc(lh.date)+' '+esc(lh.title||lh.type)
       :'-'
     }
    </span>
   </div>

   <div>
    <b>Notizen</b>
    <span>${esc(a.note||'-')}</span>
   </div>
  </div>
 </div>

 <div class="subcard tc2SubCard">
  <h3>Chronik</h3>
  ${NGTUI.list(NGTUI.timeline(a).slice(0,6))}
 </div>`;
}

function docs(a){
 const uid=encodeURIComponent(
  a.uuid||
  a.uid||
  ''
 );

 return `<div class="subcard tc2SubCard">
  <h3>Dokumentencenter</h3>

  <div class="btnRow">
   <button onclick="location.href='./abgabe.html?id=${uid}'">
    Abgabenachweis / PDF
   </button>

   <button onclick="NGTProfile.setTab('qr')">
    Digitaler Tierpass QR
   </button>
  </div>

  <p class="muted">
   Später kommen hier Herkunftsnachweise,
   CITES/Artenschutz-Dokumente und Verkaufsunterlagen hinzu.
  </p>
 </div>`;
}

function feedForm(a){
 const items=normalizedFoodInventory();
 const selectedId=defaultFoodId(a);

 if(!items.length){
  return `<div class="subcard tc2SubCard warn">
   <h3>Fütterung eintragen</h3>

   <p class="muted">
    Es ist noch kein dynamischer Futterbestand vorhanden.
    Lege zuerst unter „Futterbestand“ eine Position an.
   </p>

   <button onclick="NGT500.route('food')">
    Futterbestand öffnen
   </button>
  </div>`;
 }

 return `<div class="subcard tc2SubCard">
  <h3>Fütterung eintragen</h3>

  <input
   id="feedDate"
   type="date"
   value="${NGT500.today()}"
  >

  <label>
   <span>Futterposition</span>

   <select
    id="feedInventoryId"
    onchange="NGTProfile.updateFeedStockStatus()"
   >
    ${foodOptions(a)}
   </select>
  </label>

  <select id="feedStatus">
   <option value="ok">Gefressen</option>
   <option value="no">Verweigert</option>
  </select>

  <div
   id="feedStockStatus"
   class="subcard"
  ></div>

  <button onclick="NGTProfile.addFeed()">
   Fütterung speichern
  </button>
 </div>`;
}

function shedForm(){
 return `<div class="subcard tc2SubCard">
  <h3>Häutung eintragen</h3>

  <input
   id="shedDate"
   type="date"
   value="${NGT500.today()}"
  >

  <button onclick="NGTProfile.addShed()">
   Häutung speichern
  </button>
 </div>`;
}

function weightForm(){
 return `<div class="subcard tc2SubCard">
  <h3>Gewicht eintragen</h3>

  <input
   id="weightDate"
   type="date"
   value="${NGT500.today()}"
  >

  <input
   id="weightValue"
   type="number"
   placeholder="Gewicht in g"
  >

  <button onclick="NGTProfile.addWeight()">
   Gewicht speichern
  </button>
 </div>`;
}

function row(d,txt,del){
 return `<div class="tc2ListRowFull">
  <div>
   <b>${esc(d||'-')}</b>
   <small>${esc(txt||'')}</small>
  </div>

  <button class="danger" onclick="${del}">
   Löschen
  </button>
 </div>`;
}

function feedList(a){
 return `<div class="subcard tc2SubCard">
  <h3>Fütterungen</h3>

  ${
   (a.feeds||[])
    .map((f,i)=>({f,i}))
    .reverse()
    .map(x=>row(
     x.f.date,
     `${
      x.f.accepted===false
       ?'Verweigert'
       :'Gefressen'
     } ${
      x.f.label||
      [
       x.f.state,
       x.f.prey,
       x.f.size
      ].filter(Boolean).join(' ')
     }`,
     `NGTProfile.deleteEntry('feeds',${x.i})`
    ))
    .join('')||
   '<p class="muted">Keine Fütterungen.</p>'
  }
 </div>`;
}

function shedList(a){
 return `<div class="subcard tc2SubCard">
  <h3>Häutungen</h3>

  ${
   (a.sheds||[])
    .map((entry,i)=>({entry,i}))
    .reverse()
    .map(x=>row(
     x.entry.date,
     'Häutung',
     `NGTProfile.deleteEntry('sheds',${x.i})`
    ))
    .join('')||
   '<p class="muted">Keine Häutungen.</p>'
  }
 </div>`;
}

function weightList(a){
 return `<div class="subcard tc2SubCard">
  <h3>Gewichte</h3>

  ${
   (a.weights||[])
    .map((entry,i)=>({entry,i}))
    .reverse()
    .map(x=>row(
     x.entry.date,
     x.entry.weight+'g',
     `NGTProfile.deleteEntry('weights',${x.i})`
    ))
    .join('')||
   '<p class="muted">Keine Gewichte.</p>'
  }
 </div>`;
}

function photos(a){
 const legacy=hasLegacyPhotos(a);

 return `${legacy?`<div class="subcard tc2SubCard warn">
  <h3>Alte Fotos migrieren</h3>

  <p class="muted">
   Dieses Tier enthält noch eingebettete Base64-Fotos.
   Migriere sie in den dauerhaften Foto-Speicher.
  </p>

  <button onclick="NGTProfile.migratePhotos()">
   Fotos jetzt migrieren
  </button>

  <div
   id="photoMigrationStatus"
   class="muted"
  ></div>
 </div>`:''}

 <div class="subcard tc2SubCard">
  <h3>Foto hinzufügen</h3>

  <input
   id="photoFileInput"
   type="file"
   accept="image/*"
   onchange="NGTProfile.addPhoto(this.files[0])"
  >

  <select id="photoType">
   <option>Portrait</option>
   <option>Terrarium</option>
   <option>Häutung</option>
   <option>Fütterung</option>
   <option>Nachwuchs</option>
   <option>Gesundheit</option>
   <option>Sonstige</option>
  </select>

  <input
   id="photoNote"
   placeholder="Notiz zum Foto"
  >

  <p
   id="photoUploadStatus"
   class="muted"
  >
   Fotos werden dauerhaft in Firebase Storage gespeichert.
  </p>
 </div>`+

 (a.photos||[]).map(function(photo,index){
  const img=photoSrc(photo,true);

  return `<div class="subcard tc2SubCard">
   ${
    img
     ?`<img
       class="photo"
       src="${esc(img)}"
       alt="Tierfoto"
       loading="lazy"
       onclick="NGTProfile.openPhoto(${index})"
      >`
     :'<div class="tc2ProfileHeroEmpty">📷</div>'
   }

   <b>${esc(photo.date||'')}</b>
   · ${esc(photo.type||'Sonstige')}
   ${photo.cover?'· Titelbild':''}

   <br>

   ${esc(photo.note||'')}

   <div class="btnRow">
    ${
     img
      ?`<button onclick="NGTProfile.openPhoto(${index})">
        Vollbild
       </button>`
      :''
    }

    <button onclick="NGTProfile.setCover(${index})">
     Als Titelbild
    </button>

    <button
     class="danger"
     onclick="NGTProfile.deletePhoto(${index})"
    >
     Foto löschen
    </button>
   </div>
  </div>`;
 }).join('');
}

function health(a){
 return healthForm()+
  (
   (a.health||[])
    .map((entry,i)=>({entry,i}))
    .reverse()
    .map(x=>`<div class="subcard tc2SubCard">
     <b>
      ${esc(x.entry.date||'-')}
      ·
      ${esc(x.entry.type||'Gesundheit')}
     </b>

     <br>

     ${esc(x.entry.title||'')}

     <br>

     ${esc(x.entry.medication||'')}
     ${esc(x.entry.dose||'')}
     ${esc(x.entry.duration||'')}

     <br>

     Status: ${esc(x.entry.status||'-')}

     <br>

     ${esc(x.entry.note||'')}

     <button
      class="danger"
      onclick="NGTProfile.deleteEntry('health',${x.i})"
     >
      Eintrag löschen
     </button>
    </div>`)
    .join('')||
   '<p class="muted">Keine Gesundheitsdaten.</p>'
  );
}

function healthForm(){
 return `<div class="subcard tc2SubCard">
  <h3>Gesundheits-Eintrag</h3>

  <input
   id="healthDate"
   type="date"
   value="${NGT500.today()}"
  >

  <select id="healthType">
   <option>Tierarzt</option>
   <option>Behandlung</option>
   <option>Medikament</option>
   <option>Diagnose</option>
   <option>Kontrolle</option>
   <option>Kotprobe</option>
   <option>Parasitenbehandlung</option>
   <option>OP</option>
   <option>Verletzung</option>
   <option>Quarantäne</option>
   <option>Notiz</option>
  </select>

  <input
   id="healthTitle"
   placeholder="Titel / Diagnose"
  >

  <input
   id="healthMedication"
   placeholder="Medikament"
  >

  <input
   id="healthDose"
   placeholder="Dosierung"
  >

  <input
   id="healthDuration"
   placeholder="Dauer"
  >

  <select id="healthStatus">
   <option>offen</option>
   <option>laufend</option>
   <option>abgeschlossen</option>
  </select>

  <textarea
   id="healthNote"
   placeholder="Notizen"
  ></textarea>

  <button onclick="NGTProfile.addHealth()">
   Gesundheit speichern
  </button>
 </div>`;
}

function barChart(rows){
 if(!rows.length){
  return '<p class="muted">Keine Daten.</p>';
 }

 const max=Math.max(
  ...rows.map(r=>Number(r.value||0)),
  1
 );

 return rows.map(r=>`<div class="tc2Bar">
  <small>${esc(r.label||'-')}</small>

  <span>
   <i
    style="width:${
     Math.max(
      4,
      Math.round(
       (Number(r.value||0)/max)*100
      )
     )
    }%"
   ></i>
  </span>

  <b>${esc(r.value)}</b>
 </div>`).join('');
}

function charts(a){
 return `<div class="subcard tc2SubCard">
  <h3>Gewicht</h3>

  ${barChart((a.weights||[]).map(w=>({
   label:w.date,
   value:Number(w.weight||0)
  })))}
 </div>

 <div class="subcard tc2SubCard">
  <h3>Fütterungen</h3>

  ${barChart((a.feeds||[]).map(f=>({
   label:f.date,
   value:f.accepted===false?0:1
  })))}
 </div>`;
}

function analysis(a){
 const refused=(a.feeds||[])
  .filter(f=>f.accepted===false)
  .length;

 const accepted=(a.feeds||[])
  .filter(f=>f.accepted!==false)
  .length;

 const first=(a.weights||[])[0];
 const last=(a.weights||[]).slice(-1)[0];

 let diff='-';

 if(first&&last&&first!==last){
  diff=(
   Number(last.weight)-
   Number(first.weight)
  )+'g';
 }

 return `<div class="subcard tc2SubCard">
  <h3>Analyse</h3>

  <div class="tc2InfoRows">
   <div>
    <b>Gefressen</b>
    <span>${accepted}</span>
   </div>

   <div>
    <b>Verweigert</b>
    <span>${refused}</span>
   </div>

   <div>
    <b>Gewichtsveränderung</b>
    <span>${esc(diff)}</span>
   </div>

   <div>
    <b>Status</b>
    <span>${esc(healthStatus(a).txt)}</span>
   </div>
  </div>
 </div>`;
}

function setTab(x){
 closePhotoViewer();

 tab=x;

 NGT500.route('profile',{
  t:ctx.t,
  i:ctx.i,
  tab:x
 });
}

function updateFeedStockStatus(){
 const select=document.getElementById('feedInventoryId');
 const box=document.getElementById('feedStockStatus');

 if(!select||!box)return;

 const item=foodById(select.value);

 if(!item){
  box.className='subcard danger';
  box.innerHTML='<b>Keine Futterposition ausgewählt.</b>';
  return;
 }

 const qty=Number(item.qty||0);
 const minimum=Number(item.minimum||0);
 const unit=item.unit||'Stück';

 let cls='ok';
 let title='Bestand ausreichend';

 if(qty<=0){
  cls='danger';
  title='Bestand leer';
 }else if(minimum>0&&qty<=minimum){
  cls='warn';
  title='Mindestbestand erreicht';
 }

 box.className='subcard '+cls;

 box.innerHTML=`
  <b>${esc(title)}</b>
  <br>
  ${esc(foodLabel(item))}
  · ${qty} ${esc(unit)} vorhanden
  ${
   minimum>0
    ?'· Mindestbestand '+minimum+' '+esc(unit)
    :''
  }
 `;
}

function addFeed(){
 const a=current();
 const select=document.getElementById('feedInventoryId');

 if(!select||!select.value){
  alert('Bitte eine Futterposition auswählen.');
  return;
 }

 const item=foodById(select.value);

 if(!item){
  alert('Die ausgewählte Futterposition wurde nicht gefunden.');
  return;
 }

 const accepted=
  document.getElementById('feedStatus').value!=='no';

 const qty=Number(item.qty||0);

 if(accepted&&qty<=0){
  alert(
   'Dieser Futterbestand ist leer. Die Fütterung kann nicht als gefressen gespeichert werden.'
  );
  return;
 }

 if(
  accepted&&
  qty===1&&
  !confirm(
   'Dies ist das letzte verfügbare Futtertier dieser Position. Fütterung trotzdem speichern?'
  )
 ){
  return;
 }

 a.feeds=a.feeds||[];

 a.feeds.push({
  id:NGT500.uid(),
  date:
   document.getElementById('feedDate').value||
   NGT500.today(),
  foodInventoryId:item.id,
  category:item.category,
  state:item.condition,
  condition:item.condition,
  prey:item.itemName,
  size:item.variant,
  variant:item.variant,
  unit:item.unit,
  amount:1,
  label:foodLabel(item),
  accepted:accepted
 });

 if(accepted){
  item.qty=Math.max(
   0,
   Number(item.qty||0)-1
  );
 }

 NGTStore.save();
 setTab('feeds');
}

function addShed(){
 const a=current();

 a.sheds=a.sheds||[];

 a.sheds.push({
  date:
   document.getElementById('shedDate').value||
   NGT500.today(),
  complete:true
 });

 NGTStore.save();
 setTab('sheds');
}

function addWeight(){
 const a=current();

 const weight=Number(
  document.getElementById('weightValue').value||
  0
 );

 if(!weight){
  alert('Gewicht fehlt');
  return;
 }

 a.weights=a.weights||[];

 a.weights.push({
  date:
   document.getElementById('weightDate').value||
   NGT500.today(),
  weight:weight
 });

 a.weight=weight;

 NGTStore.save();
 setTab('weights');
}

function addHealth(){
 const a=current();

 a.health=a.health||[];

 a.health.push({
  id:NGT500.uid(),
  date:
   document.getElementById('healthDate').value||
   NGT500.today(),
  type:
   document.getElementById('healthType').value,
  title:
   document.getElementById('healthTitle').value,
  medication:
   document.getElementById('healthMedication').value,
  dose:
   document.getElementById('healthDose').value,
  duration:
   document.getElementById('healthDuration').value,
  status:
   document.getElementById('healthStatus').value,
  note:
   document.getElementById('healthNote').value
 });

 NGTStore.save();
 setTab('health');
}

function deleteEntry(kind,i){
 if(!confirm('Eintrag löschen?'))return;

 const a=current();

 a[kind].splice(i,1);

 if(kind==='weights'){
  const last=(a.weights||[]).slice(-1)[0];
  a.weight=last?last.weight:'';
 }

 NGTStore.save();
 setTab(tab);
}

function setPhotoUploadStatus(message,isError){
 const status=document.getElementById('photoUploadStatus');

 if(!status)return;

 status.textContent=message;
 status.classList.toggle('danger',!!isError);
}

async function addPhoto(file){
 if(!file)return;

 if(
  !window.NGTPhotoStorage||
  !NGTPhotoStorage.upload
 ){
  alert('Foto-Speicher ist noch nicht geladen.');
  return;
 }

 const input=document.getElementById('photoFileInput');

 if(input){
  input.disabled=true;
 }

 setPhotoUploadStatus(
  'Foto wird verarbeitet und hochgeladen …',
  false
 );

 try{
  const a=current();
  ensure(a);

  const meta={
   date:NGT500.today(),
   type:
    document.getElementById('photoType')?.value||
    'Sonstige',
   note:
    document.getElementById('photoNote')?.value||
    '',
   cover:!profilePhoto(a)
  };

  const saved=await NGTPhotoStorage.upload(
   file,
   a,
   meta
  );

  a.photos.push(saved);

  if(
   !a.photos.some(function(photo){
    return photo&&
     photo.cover&&
     isUsablePhoto(photo);
   })
  ){
   saved.cover=true;
  }

  NGTStore.save();
  setTab('photos');

 }catch(e){
  console.error(e);

  setPhotoUploadStatus(
   e&&e.message
    ?e.message
    :'Foto konnte nicht gespeichert werden.',
   true
  );

  alert(
   e&&e.message
    ?e.message
    :'Foto konnte nicht dauerhaft gespeichert werden.'
  );

 }finally{
  if(input){
   input.disabled=false;
   input.value='';
  }
 }
}

async function migratePhotos(){
 if(
  !window.NGTPhotoStorage||
  !NGTPhotoStorage.migrateAnimal
 ){
  alert('Foto-Migration ist noch nicht geladen.');
  return;
 }

 const a=current();
 ensure(a);

 if(!hasLegacyPhotos(a)){
  alert('Keine alten Fotos zum Migrieren gefunden.');
  return;
 }

 const status=document.getElementById(
  'photoMigrationStatus'
 );

 if(status){
  status.textContent='Migration läuft …';
 }

 try{
  const res=await NGTPhotoStorage.migrateAnimal(
   a,
   function(info){
    const el=document.getElementById(
     'photoMigrationStatus'
    );

    if(el){
     el.textContent=
      'Migriert: '+
      info.count+
      ' / '+
      (info.total||info.count);
    }
   }
  );

  if(res.changed){
   const selected=profilePhoto(a);

   if(
    selected&&
    !a.photos.some(function(photo){
     return photo&&
      photo.cover&&
      isUsablePhoto(photo);
    })
   ){
    selected.cover=true;
   }

   NGTStore.save();
  }

  alert((res.count||0)+' Foto(s) migriert.');
  setTab('photos');

 }catch(e){
  console.error(e);

  alert(
   e&&e.message
    ?e.message
    :'Fotos konnten nicht migriert werden.'
  );
 }
}

function setCover(i){
 const a=current();
 const selected=(a.photos||[])[i];

 if(!selected||!isUsablePhoto(selected)){
  alert(
   'Dieses Foto kann nicht als Titelbild verwendet werden.'
  );
  return;
 }

 (a.photos||[]).forEach(function(photo,index){
  if(photo){
   photo.cover=index===i;
  }
 });

 NGTStore.save();
 setTab('photos');
}

async function deletePhoto(i){
 if(!confirm('Foto löschen?'))return;

 const a=current();
 const photo=(a.photos||[])[i];

 try{
  if(
   window.NGTPhotoStorage&&
   NGTPhotoStorage.remove&&
   photo
  ){
   await NGTPhotoStorage.remove(photo);
  }

  a.photos.splice(i,1);

  if(
   a.photos.length&&
   !a.photos.some(function(entry){
    return entry&&
     entry.cover&&
     isUsablePhoto(entry);
   })
  ){
   const next=profilePhoto(a);

   if(next){
    next.cover=true;
   }
  }

  NGTStore.save();
  closePhotoViewer();
  setTab('photos');

 }catch(e){
  console.error(e);

  alert(
   e&&e.message
    ?e.message
    :'Foto konnte nicht gelöscht werden.'
  );
 }
}

function openCoverPhoto(){
 const a=current();
 const photo=profilePhoto(a);

 if(!photo)return;

 const index=(a.photos||[]).indexOf(photo);

 if(index>=0){
  openPhoto(index);
 }
}

function openPhoto(index){
 const a=current();
 ensure(a);

 const photo=(a.photos||[])[index];

 if(!photo||!isUsablePhoto(photo)){
  alert('Dieses Foto kann nicht geöffnet werden.');
  return;
 }

 viewerIndex=index;
 renderPhotoViewer();
}

function usablePhotoIndexes(a){
 return (a.photos||[])
  .map(function(photo,index){
   return isUsablePhoto(photo)
    ?index
    :-1;
  })
  .filter(function(index){
   return index>=0;
  });
}

function renderPhotoViewer(){
 const a=current();

 if(!a)return;

 const indexes=usablePhotoIndexes(a);
 const photo=(a.photos||[])[viewerIndex];

 if(!photo||!isUsablePhoto(photo)){
  closePhotoViewer();
  return;
 }

 const source=
  photoSrc(photo,false)||
  photoSrc(photo,true);

 const position=indexes.indexOf(viewerIndex);
 const multiple=indexes.length>1;
 const root=document.getElementById('modalRoot');

 if(!root)return;

 root.innerHTML=`<div
  id="tc2PhotoViewer"
  style="
   position:fixed;
   inset:0;
   z-index:99999;
   background:rgba(0,0,0,.94);
   display:flex;
   flex-direction:column;
   align-items:center;
   justify-content:center;
   padding:16px;
   box-sizing:border-box;
  "
  onclick="if(event.target===this)NGTProfile.closePhotoViewer()"
 >
  <button
   onclick="NGTProfile.closePhotoViewer()"
   aria-label="Schließen"
   style="
    position:absolute;
    top:max(16px,env(safe-area-inset-top));
    right:16px;
    width:46px;
    height:46px;
    border-radius:50%;
    border:0;
    font-size:28px;
    background:rgba(255,255,255,.14);
    color:white;
    z-index:3;
   "
  >
   ×
  </button>

  ${multiple?`<button
   onclick="NGTProfile.previousPhoto()"
   aria-label="Vorheriges Foto"
   style="
    position:absolute;
    left:12px;
    top:50%;
    transform:translateY(-50%);
    width:48px;
    height:64px;
    border-radius:16px;
    border:0;
    font-size:32px;
    background:rgba(255,255,255,.14);
    color:white;
    z-index:3;
   "
  >
   ‹
  </button>`:''}

  <img
   src="${esc(source)}"
   alt="Tierfoto"
   style="
    display:block;
    max-width:100%;
    max-height:78vh;
    object-fit:contain;
    border-radius:14px;
    box-shadow:0 16px 48px rgba(0,0,0,.5);
   "
  >

  ${multiple?`<button
   onclick="NGTProfile.nextPhoto()"
   aria-label="Nächstes Foto"
   style="
    position:absolute;
    right:12px;
    top:50%;
    transform:translateY(-50%);
    width:48px;
    height:64px;
    border-radius:16px;
    border:0;
    font-size:32px;
    background:rgba(255,255,255,.14);
    color:white;
    z-index:3;
   "
  >
   ›
  </button>`:''}

  <div
   style="
    margin-top:14px;
    max-width:680px;
    text-align:center;
    color:white;
   "
  >
   <b>${esc(photo.type||'Foto')}</b>
   ${photo.cover?' · Titelbild':''}

   <div style="opacity:.72;margin-top:4px;">
    ${esc(photo.date||'')}
    ${
     multiple
      ?' · '+(position+1)+' / '+indexes.length
      :''
    }
   </div>

   ${
    photo.note
     ?`<div style="margin-top:8px;">
       ${esc(photo.note)}
      </div>`
     :''
   }
  </div>
 </div>`;

 document.body.style.overflow='hidden';

 if(viewerKeyHandler){
  document.removeEventListener(
   'keydown',
   viewerKeyHandler
  );
 }

 viewerKeyHandler=function(event){
  if(event.key==='Escape'){
   closePhotoViewer();
  }

  if(event.key==='ArrowLeft'){
   previousPhoto();
  }

  if(event.key==='ArrowRight'){
   nextPhoto();
  }
 };

 document.addEventListener(
  'keydown',
  viewerKeyHandler
 );
}

function adjacentPhoto(direction){
 const a=current();

 if(!a)return;

 const indexes=usablePhotoIndexes(a);

 if(!indexes.length)return;

 let position=indexes.indexOf(viewerIndex);

 if(position<0){
  position=0;
 }

 position=(
  position+
  direction+
  indexes.length
 )%indexes.length;

 viewerIndex=indexes[position];

 renderPhotoViewer();
}

function previousPhoto(){
 adjacentPhoto(-1);
}

function nextPhoto(){
 adjacentPhoto(1);
}

function closePhotoViewer(){
 const root=document.getElementById('modalRoot');

 if(root){
  root.innerHTML='';
 }

 document.body.style.overflow='';
 viewerIndex=-1;

 if(viewerKeyHandler){
  document.removeEventListener(
   'keydown',
   viewerKeyHandler
  );

  viewerKeyHandler=null;
 }
}

function afterRender(){
 const a=current();

 if(tab==='feeds'){
  updateFeedStockStatus();
 }

 if(tab==='qr'&&a&&window.QRCode){
  const box=document.getElementById('profileQr');

  box.innerHTML='';

  const payload=passportPayload(a);

  try{
   new QRCode(box,{
    text:payload,
    width:220,
    height:220,
    correctLevel:QRCode.CorrectLevel.L
   });

  }catch(e){
   box.innerHTML='';

   new QRCode(box,{
    text:[
     'TC2',
     s(a.publicId||a.uuid||a.uid,80),
     s(a.name,50)
    ].join('|'),
    width:220,
    height:220,
    correctLevel:QRCode.CorrectLevel.L
   });
  }
 }
}

window.NGTProfile={
 setTab,
 addPhoto,
 migratePhotos,
 setCover,
 deletePhoto,
 openCoverPhoto,
 openPhoto,
 previousPhoto,
 nextPhoto,
 closePhotoViewer,
 addFeed,
 addShed,
 addWeight,
 addHealth,
 deleteEntry,
 updateFeedStockStatus
};

NGT500.register('profile',{
 render,
 afterRender
});

})();