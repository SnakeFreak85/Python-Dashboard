(function(){
'use strict';

const STATUS={
 planned:{label:'Geplant',tone:'planned'},
 paired:{label:'Verpaarung läuft',tone:'active'},
 expecting:{label:'Gelege / Wurf erwartet',tone:'expecting'},
 clutch:{label:'Gelege / Wurf erfasst',tone:'clutch'},
 incubation:{label:'Inkubation',tone:'incubation'},
 hatched:{label:'Schlupf / Geburt',tone:'hatched'},
 completed:{label:'Abgeschlossen',tone:'completed'},
 cancelled:{label:'Abgebrochen',tone:'cancelled'},
 archived:{label:'Archiv',tone:'archived'}
};

const EVENT_TYPES={
 pairing:'Verpaarung',
 ovulation:'Ovulation',
 prelay_shed:'Legehäutung',
 clutch:'Gelege / Wurf',
 incubation:'Inkubationsbeginn',
 hatch:'Schlupf',
 birth:'Geburt',
 note:'Notiz'
};

function esc(value){
 return NGT500.esc(value==null?'':value);
}

function text(value){
 return String(value==null?'':value).trim();
}

function jsArg(value){
 return text(value)
  .replace(/\\/g,'\\\\')
  .replace(/'/g,"\\'");
}

function value(id){
 const element=document.getElementById(id);
 return element?text(element.value):'';
}

function dateLabel(value){
 return window.NGTDateDisplay
  ?NGTDateDisplay.format(value||'')
  :text(value);
}

function plans(){
 return NGTStore.breedingPlans
  ?NGTStore.breedingPlans()
  :[];
}

function planById(id){
 return NGTStore.breedingPlanById
  ?NGTStore.breedingPlanById(id)
  :null;
}

function activeStock(){
 return (NGTStore.allAnimals?NGTStore.allAnimals():[])
  .filter(function(row){
   const animal=row.a||{};
   return AnimalEngine.isActiveAnimal(animal)&&
    !AnimalEngine.isOffspringAnimal(animal);
  });
}

function animalLabel(animal){
 animal=animal||{};
 const id=text(animal.publicId||animal.displayId);
 const name=text(AnimalEngine.getDisplayName(animal));
 const taxonomy=[animal.genus,animal.species]
  .filter(Boolean)
  .join(' ');

 return [
  id,
  name&&name!==id?name:'',
  taxonomy,
  animal.sex
 ].filter(Boolean).join(' · ')||'Unbenanntes Tier';
}

function sexKind(value){
 const normalized=text(value).toLowerCase();

 if(
  normalized.includes('männ')||
  normalized.includes('maenn')||
  normalized==='male'
 ){
  return 'male';
 }

 if(
  normalized.includes('weib')||
  normalized==='female'
 ){
  return 'female';
 }

 return 'unknown';
}

function parentOptions(role,selectedId){
 const wanted=role==='father'?'male':'female';
 const empty=role==='father'
  ?'Kein Vatertier ausgewählt'
  :'Kein Muttertier ausgewählt';
 const rows=activeStock()
  .filter(function(row){
   const kind=sexKind(row.a.sex);
   return kind===wanted||kind==='unknown'||
    NGTStore.animalId(row.a)===selectedId;
  })
  .sort(function(a,b){
   return animalLabel(a.a).localeCompare(animalLabel(b.a),'de');
  });

 return `<option value="">${empty}</option>`+
  rows.map(function(row){
   const id=NGTStore.animalId(row.a);
   return `<option value="${esc(id)}" ${id===selectedId?'selected':''}>${esc(animalLabel(row.a))}</option>`;
  }).join('');
}

function animalSnapshot(id,externalLabel){
 const row=id&&NGTStore.findAnimalById
  ?NGTStore.findAnimalById(id)
  :null;

 if(!row){
  return externalLabel
   ?{external:true,label:externalLabel}
   :{};
 }

 const animal=row.a||{};
 return {
  animalId:id,
  publicId:text(animal.publicId||animal.displayId),
  name:text(AnimalEngine.getDisplayName(animal)),
  animalGroup:text(animal.animalGroup),
  genus:text(animal.genus),
  species:text(animal.species),
  morph:text(animal.morph),
  genetics:Array.isArray(animal.genetics)?animal.genetics:[],
  sex:text(animal.sex),
  label:animalLabel(animal)
 };
}

function parentName(plan,role){
 const snapshot=plan&&plan[role+'Snapshot']||{};
 const id=text(plan&&plan[role+'Id']);
 const row=id&&NGTStore.findAnimalById
  ?NGTStore.findAnimalById(id)
  :null;

 return row
  ?animalLabel(row.a)
  :text(snapshot.label)||
   text(plan&&plan[role+'External'])||
   (role==='father'?'Vatertier':'Muttertier');
}

function inferBreedingType(father,mother,requested){
 if(requested&&requested!=='auto'){
  return requested;
 }

 const haystack=[
  father&&father.animalGroup,
  father&&father.genus,
  father&&father.species,
  mother&&mother.animalGroup,
  mother&&mother.genus,
  mother&&mother.species
 ].join(' ').toLowerCase();

 if(/boa|eunectes|anaconda|thamnophis|strumpfband/.test(haystack)){
  return 'viviparous';
 }

 return 'oviparous';
}

function typeLabel(type){
 return {
  oviparous:'Eierlegend',
  viviparous:'Lebendgebärend',
  manual:'Manuell'
 }[type]||'Automatisch';
}

function nextProjectCode(){
 const year=new Date().getFullYear();
 const max=plans().reduce(function(result,plan){
  const match=text(plan.projectCode).match(new RegExp('^ZP-'+year+'-(\\d+)$','i'));
  return match?Math.max(result,Number(match[1])):result;
 },0);

 return 'ZP-'+year+'-'+String(max+1).padStart(2,'0');
}

function statusLabel(status){
 return (STATUS[status]||STATUS.planned).label;
}

function statusOptions(current){
 return Object.keys(STATUS).map(function(key){
  return `<option value="${key}" ${key===current?'selected':''}>${STATUS[key].label}</option>`;
 }).join('');
}

function pageHead(title,subtitle){
 return `<div class="tc2BreedingHead">
  <div>
   <h2>${esc(title)}</h2>
   <p>${esc(subtitle)}</p>
  </div>
 </div>`;
}

function overviewCard(plan){
 const state=STATUS[plan.status]||STATUS.planned;
 const father=parentName(plan,'father');
 const mother=parentName(plan,'mother');
 const species=text(plan.taxonomy)||
  text(plan.motherSnapshot&&[
   plan.motherSnapshot.genus,
   plan.motherSnapshot.species
  ].filter(Boolean).join(' '));

 return `<button class="tc2BreedingProject ${state.tone}" onclick="NGT500.route('breeding',{id:'${jsArg(plan.id)}'})">
  <span class="tc2BreedingProjectIcon">⚭</span>
  <span class="tc2BreedingProjectText">
   <b>${esc(plan.title||mother+' × '+father)}</b>
   <small>${esc(species||typeLabel(plan.breedingType))}</small>
   <em>${esc(state.label)}</em>
  </span>
  <span class="tc2BreedingProjectCode">${esc(plan.projectCode||'Zuchtprojekt')}</span>
  <strong>›</strong>
 </button>`;
}

function renderOverview(args){
 args=args||{};
 const filter=text(args.filter||'active');
 const all=plans().sort(function(a,b){
  return text(b.updatedAt).localeCompare(text(a.updatedAt));
 });
 const counts={
  planned:all.filter(function(p){return p.status==='planned';}).length,
  active:all.filter(function(p){return ['paired','expecting','clutch'].includes(p.status);}).length,
  incubation:all.filter(function(p){return p.status==='incubation';}).length
 };
 const visible=all.filter(function(plan){
  if(filter==='archive'){
   return ['completed','cancelled','archived'].includes(plan.status);
  }
  if(filter==='all'){
   return true;
  }
  return !['completed','cancelled','archived'].includes(plan.status);
 });

 return `<section class="tc2PageCard tc2BreedingPage">
  ${pageHead('Verpaarungsplanung','Verpaarungen, Gelege, Würfe, Inkubation und Schlupf gemeinsam verwalten.')}

  <button class="tc2BreedingCreate" onclick="NGT500.route('breeding',{create:true})">
   <span>＋</span>
   <b>Neue Verpaarung</b>
   <em>›</em>
  </button>

  <div class="tc2BreedingKpis">
   <button onclick="NGT500.route('breeding',{filter:'active'})">
    <span>▣</span><small>Geplant</small><b>${counts.planned}</b>
   </button>
   <button onclick="NGT500.route('breeding',{filter:'active'})">
    <span>⚭</span><small>Laufend</small><b>${counts.active}</b>
   </button>
   <button onclick="NGT500.route('breeding',{filter:'active'})">
    <span>◯</span><small>Inkubation</small><b>${counts.incubation}</b>
   </button>
  </div>

  <div class="tc2BreedingTabs">
   <button class="${filter==='active'?'on':''}" onclick="NGT500.route('breeding',{filter:'active'})">Aktiv</button>
   <button class="${filter==='all'?'on':''}" onclick="NGT500.route('breeding',{filter:'all'})">Alle</button>
   <button class="${filter==='archive'?'on':''}" onclick="NGT500.route('breeding',{filter:'archive'})">Archiv</button>
  </div>

  <div class="tc2BreedingProjects">
   ${visible.length
    ?visible.map(overviewCard).join('')
    :`<div class="tc2EmptyState"><div class="tc2EmptyStateIcon">⚭</div><h3>Noch keine Zuchtprojekte</h3><p>Lege deine erste Verpaarung an.</p></div>`}
  </div>
 </section>`;
}

function renderForm(plan){
 plan=plan||{};
 const editing=!!plan.id;

 return `<section class="tc2PageCard tc2BreedingPage">
  ${pageHead(editing?'Verpaarung bearbeiten':'Neue Verpaarung','Elterntiere verbinden und den Ablauf des Zuchtprojekts planen.')}

  <div class="tc2AnimalEditor tc2BreedingEditor">
   <div class="tc2AnimalEditorBlock">
    <h4>Projekt</h4>
    <div class="tc2AnimalFields">
     <label><span>Projektcode</span><input id="breedingCode" value="${esc(plan.projectCode||nextProjectCode())}"></label>
     <label><span>Titel</span><input id="breedingTitle" placeholder="z. B. Luna × Jack" value="${esc(plan.title||'')}"></label>
     <label><span>Startdatum</span><input id="breedingStart" type="date" value="${esc(plan.startDate||NGT500.today())}"></label>
     <label><span>Status</span><select id="breedingStatus">${statusOptions(plan.status||'planned')}</select></label>
     <label><span>Zuchtform</span><select id="breedingType">
      <option value="auto" ${!plan.breedingType||plan.breedingType==='auto'?'selected':''}>Automatisch erkennen</option>
      <option value="oviparous" ${plan.breedingType==='oviparous'?'selected':''}>Eierlegend</option>
      <option value="viviparous" ${plan.breedingType==='viviparous'?'selected':''}>Lebendgebärend</option>
      <option value="manual" ${plan.breedingType==='manual'?'selected':''}>Manuell</option>
     </select></label>
    </div>
   </div>

   <div class="tc2AnimalEditorBlock">
    <h4>Elterntiere</h4>
    <div class="tc2AnimalFields">
     <label><span>Vatertier aus dem Bestand</span><select id="breedingFatherId">${parentOptions('father',text(plan.fatherId))}</select></label>
     <label><span>Muttertier aus dem Bestand</span><select id="breedingMotherId">${parentOptions('mother',text(plan.motherId))}</select></label>
     <label><span>Externes Vatertier</span><input id="breedingFatherExternal" placeholder="optional" value="${esc(plan.fatherExternal||'')}"></label>
     <label><span>Externes Muttertier</span><input id="breedingMotherExternal" placeholder="optional" value="${esc(plan.motherExternal||'')}"></label>
    </div>
    <p class="muted">Interne Elterntiere werden dauerhaft über ihre TerraControl-ID verknüpft.</p>
   </div>

   <div class="tc2AnimalEditorBlock">
    <h4>Planung</h4>
    <div class="tc2AnimalFields">
     <label><span>Gelege / Wurf</span><input id="breedingClutch" placeholder="z. B. KP-2026-01" value="${esc(plan.clutchCode||'')}"></label>
     <label><span>Erwartetes Datum</span><input id="breedingExpected" type="date" value="${esc(plan.expectedDate||'')}"></label>
     <label><span>Zuchtziel</span><input id="breedingGoal" placeholder="Morph, Linie oder Ziel" value="${esc(plan.goal||'')}"></label>
    </div>
    <label class="tc2BreedingNotes"><span>Notizen</span><textarea id="breedingNotes" placeholder="Beobachtungen und Planungsdetails">${esc(plan.notes||'')}</textarea></label>
   </div>

   <div class="tc2AnimalEditorActions">
    <button type="button" onclick="NGT500.route('breeding')">Abbrechen</button>
    <button type="button" onclick="NGTBreeding.savePlan('${jsArg(plan.id||'')}')">Verpaarung speichern</button>
   </div>
  </div>
 </section>`;
}

function offspringRows(plan){
 const ids=new Set(Array.isArray(plan.offspringIds)?plan.offspringIds:[]);
 const rows=[];

 (NGTStore.allAnimals?NGTStore.allAnimals():[]).forEach(function(row){
  const animal=row.a||{};
  const animalId=NGTStore.animalId(animal);
  if(animal.breedingPlanId===plan.id||ids.has(animalId)){
   ids.add(animalId);
   rows.push(row);
  }
 });

 return rows;
}

function linkedOffspring(plan){
 const rows=offspringRows(plan);

 if(!rows.length){
  return '<p class="muted">Noch keine Nachzuchten aus diesem Projekt angelegt.</p>';
 }

 return `<div class="tc2BreedingOffspring">${rows.map(function(row){
  return `<button onclick="NGT500.route('profile',{animalId:'${jsArg(NGTStore.animalId(row.a))}'})"><b>${esc(row.a.publicId||row.a.displayId||'Nachzucht')}</b><span>${esc(AnimalEngine.getDisplayName(row.a))}</span><em>›</em></button>`;
 }).join('')}</div>`;
}

function parentAnimal(plan,role){
 const id=text(plan&&plan[role+'Id']);
 const row=id&&NGTStore.findAnimalById?NGTStore.findAnimalById(id):null;
 return row?row.a:(plan&&plan[role+'Snapshot']||{});
}

function geneticsPrediction(plan){
 if(!window.GeneticsEngine){
  return {available:false,outcomes:[],warnings:[],message:'Genetik-Modul ist nicht geladen.'};
 }
 return GeneticsEngine.predict(parentAnimal(plan,'father'),parentAnimal(plan,'mother'));
}

function renderGenetics(plan){
 const prediction=geneticsPrediction(plan);
 const warnings=(prediction.warnings||[]).map(function(warning){
  return `<li>${esc(warning)}</li>`;
 }).join('');

 return `<section class="tc2BreedingSection tc2BreedingGenetics">
  <div class="tc2BreedingSectionHead"><h3>Mögliche Morphen</h3><small>Katalog ${esc(prediction.catalogVersion||'Vorschau')}</small></div>
  ${prediction.provisional?'<p class="tc2BreedingGeneticWarnings">Vorschau aus dem freien Morphtext. Bestätige die Gene zuerst in den Tierprofilen der Elterntiere.</p>':''}
  ${prediction.available
   ?`<div class="tc2BreedingGeneticRows">${prediction.outcomes.slice(0,8).map(function(outcome){
     return `<div><b>${esc(outcome.label)}</b><strong>${esc(String(outcome.probability).replace('.',','))} %</strong></div>`;
    }).join('')}</div>${prediction.outcomes.length>8?`<p class="muted">${prediction.outcomes.length-8} weitere rechnerische Kombinationen.</p>`:''}`
   :`<p class="muted">${esc(prediction.message||'Keine sichere Berechnung möglich.')}</p>`}
  ${warnings?`<ul class="tc2BreedingGeneticWarnings">${warnings}</ul>`:''}
  <p class="tc2BreedingGeneticNotice">Rechnerische Wahrscheinlichkeiten sind keine Bestimmung. Die tatsächliche Genetik jeder Nachzucht muss geprüft und bestätigt werden.</p>
 </section>`;
}

function expectedOffspringCount(plan){
 const event=(plan.events||[]).filter(function(row){
  return (row.type==='hatch'||row.type==='birth')&&Number(row.count)>0;
 }).sort(function(a,b){
  return text(b.date).localeCompare(text(a.date));
 })[0];
 return Math.max(0,Number(
  event&&event.count||
  (plan.status==='hatched'?plan.offspringExpected:0)||
  0
 ));
}

function renderBulkOffspring(plan){
 const expected=expectedOffspringCount(plan);
 const linked=offspringRows(plan).length;
 const remaining=Math.max(0,expected-linked);

 if(!expected){
  return '<div class="tc2BreedingBulkInfo">Trage zuerst einen Schlupf oder eine Geburt mit Anzahl ein. Danach können alle Nachzuchten gesammelt angelegt werden.</div>';
 }
 if(!remaining){
  return `<div class="tc2BreedingBulkDone">✓ Alle ${expected} Nachzuchten dieses Projekts sind angelegt.</div>`;
 }
 return `<div class="tc2BreedingBulk">
  <div><b>${remaining} fehlende Nachzucht${remaining===1?'':'en'}</b><small>${linked} von ${expected} bereits angelegt</small></div>
  <label><span>Anzahl</span><input id="breedingBulkCount" type="number" min="1" max="${remaining}" value="${remaining}"></label>
  <button onclick="NGTBreeding.createBulkOffspring('${jsArg(plan.id)}')">Alle automatisch anlegen</button>
 </div>`;
}

function renderDetail(plan){
 const events=(plan.events||[]).slice().sort(function(a,b){
  return text(b.date).localeCompare(text(a.date));
 });
 const breedingType=plan.breedingType||'manual';

 return `<section class="tc2PageCard tc2BreedingPage">
  <div class="tc2BreedingDetailHead">
   <span>⚭</span>
   <div><small>${esc(plan.projectCode||'Zuchtprojekt')}</small><h2>${esc(plan.title||parentName(plan,'mother')+' × '+parentName(plan,'father'))}</h2><p>${esc(statusLabel(plan.status))} · ${esc(typeLabel(breedingType))}</p></div>
  </div>

  <div class="tc2BreedingParents">
   <div><small>Vatertier</small><b>${esc(parentName(plan,'father'))}</b></div>
   <span>×</span>
   <div><small>Muttertier</small><b>${esc(parentName(plan,'mother'))}</b></div>
  </div>

  ${renderGenetics(plan)}

  <div class="tc2BreedingStatusEditor">
   <label><span>Projektstatus</span><select id="breedingDetailStatus">${statusOptions(plan.status||'planned')}</select></label>
   <button onclick="NGTBreeding.updateStatus('${jsArg(plan.id)}')">Status übernehmen</button>
  </div>

  <section class="tc2BreedingSection">
   <h3>Neue Etappe eintragen</h3>
   <div class="tc2BreedingEventForm">
    <select id="breedingEventType">${Object.keys(EVENT_TYPES).map(function(key){return `<option value="${key}">${EVENT_TYPES[key]}</option>`;}).join('')}</select>
    <input id="breedingEventDate" type="date" value="${NGT500.today()}">
    <input id="breedingEventCount" type="number" min="0" placeholder="Anzahl">
    <input id="breedingEventNote" placeholder="Notiz (optional)">
    <button onclick="NGTBreeding.addEvent('${jsArg(plan.id)}')">Etappe speichern</button>
   </div>
  </section>

  <section class="tc2BreedingSection">
   <div class="tc2BreedingSectionHead"><h3>Verlauf</h3><small>${events.length} Einträge</small></div>
   <div class="tc2BreedingTimeline">
    ${events.length?events.map(function(event){
     return `<div><span></span><section><small>${esc(dateLabel(event.date))}</small><b>${esc(EVENT_TYPES[event.type]||event.label||'Ereignis')}${event.count?' · '+esc(event.count):''}</b>${event.note?`<p>${esc(event.note)}</p>`:''}</section></div>`;
    }).join(''):'<p class="muted">Noch keine Etappen dokumentiert.</p>'}
   </div>
  </section>

  <section class="tc2BreedingSection">
   <div class="tc2BreedingSectionHead"><h3>Nachzuchten</h3><button onclick="NGTBreeding.createOffspring('${jsArg(plan.id)}')">＋ Nachzucht anlegen</button></div>
   ${renderBulkOffspring(plan)}
   ${linkedOffspring(plan)}
  </section>

  <div class="tc2BreedingDetailActions">
   <button onclick="NGT500.route('breeding',{edit:'${jsArg(plan.id)}'})">Bearbeiten</button>
   <button onclick="NGTBreeding.archive('${jsArg(plan.id)}')">Archivieren</button>
   <button class="danger" onclick="NGTBreeding.remove('${jsArg(plan.id)}')">Projekt löschen</button>
  </div>
 </section>`;
}

function render(args){
 args=args||{};

 if(args.create){
  return renderForm(null);
 }

 if(args.edit){
  const editing=planById(args.edit);
  return editing
   ?renderForm(editing)
   :renderOverview({});
 }

 if(args.id){
  const plan=planById(args.id);
  return plan
   ?renderDetail(plan)
   :renderOverview({});
 }

 return renderOverview(args);
}

function savePlan(id){
 const fatherId=value('breedingFatherId');
 const motherId=value('breedingMotherId');
 const fatherExternal=value('breedingFatherExternal');
 const motherExternal=value('breedingMotherExternal');

 if((!fatherId&&!fatherExternal)||(!motherId&&!motherExternal)){
  NGT500.toast('Bitte Vater- und Muttertier auswählen oder extern eintragen.','danger');
  return;
 }

 if(fatherId&&motherId&&fatherId===motherId){
  NGT500.toast('Vater- und Muttertier müssen unterschiedlich sein.','danger');
  return;
 }

 const current=id?planById(id):null;
 const fatherSnapshot=animalSnapshot(fatherId,fatherExternal);
 const motherSnapshot=animalSnapshot(motherId,motherExternal);
 const breedingType=inferBreedingType(fatherSnapshot,motherSnapshot,value('breedingType'));
 const taxonomy=[
  motherSnapshot.genus||fatherSnapshot.genus,
  motherSnapshot.species||fatherSnapshot.species
 ].filter(Boolean).join(' ');
 const plan=NGTStore.saveBreedingPlan({
  ...(current||{}),
  id:id||undefined,
  projectCode:value('breedingCode')||nextProjectCode(),
  title:value('breedingTitle'),
  startDate:value('breedingStart')||NGT500.today(),
  expectedDate:value('breedingExpected'),
  status:value('breedingStatus')||'planned',
  breedingType:breedingType,
  fatherId:fatherId,
  motherId:motherId,
  fatherExternal:fatherExternal,
  motherExternal:motherExternal,
  fatherSnapshot:fatherSnapshot,
  motherSnapshot:motherSnapshot,
  taxonomy:taxonomy,
  clutchCode:value('breedingClutch'),
  goal:value('breedingGoal'),
  notes:value('breedingNotes')
 });

 NGT500.toast('Verpaarung gespeichert.');
 NGT500.route('breeding',{id:plan.id});
}

function updateStatus(id){
 const plan=planById(id);
 if(!plan)return;
 plan.status=value('breedingDetailStatus')||plan.status;
 NGTStore.saveBreedingPlan(plan);
 NGT500.toast('Status aktualisiert.');
 NGT500.route('breeding',{id:id},{replace:true});
}

function statusForEvent(type,current){
 return {
  pairing:'paired',
  ovulation:'expecting',
  prelay_shed:'expecting',
  clutch:'clutch',
  incubation:'incubation',
  hatch:'hatched',
  birth:'hatched'
 }[type]||current||'planned';
}

function addEvent(id){
 const plan=planById(id);
 if(!plan)return;
 const type=value('breedingEventType')||'note';
 const count=Math.max(0,Number(value('breedingEventCount')||0));
 const event={
  id:NGT500.uid(),
  type:type,
  date:value('breedingEventDate')||NGT500.today(),
  count:count||undefined,
  note:value('breedingEventNote'),
  createdAt:new Date().toISOString()
 };
 plan.events=Array.isArray(plan.events)?plan.events:[];
 plan.events.push(event);
 plan.status=statusForEvent(type,plan.status);
 if((type==='clutch'||type==='hatch'||type==='birth')&&count){
  plan.offspringExpected=count;
  plan.offspringExpectedSource=type;
 }
 NGTStore.saveBreedingPlan(plan);
 NGT500.toast('Etappe gespeichert.');
 NGT500.route('breeding',{id:id},{replace:true});
}

function archive(id){
 const plan=planById(id);
 if(!plan)return;
 plan.status='archived';
 NGTStore.saveBreedingPlan(plan);
 NGT500.toast('Projekt archiviert.');
 NGT500.route('breeding',{filter:'archive'});
}

async function remove(id){
 const plan=planById(id);
 if(!plan)return;
 const confirmed=await NGT500.confirmAction(
  'Das Projekt und sein Verlauf werden entfernt. Bereits angelegte Nachzuchten bleiben erhalten.',
  {
   title:'Zuchtprojekt löschen?',
   confirmText:'Projekt löschen',
   cancelText:'Abbrechen',
   danger:true
  }
 );
 if(!confirmed)return;
 NGTStore.deleteBreedingPlan(id);
 NGT500.toast('Zuchtprojekt gelöscht.');
 NGT500.route('breeding');
}

function latestBirthDate(plan){
 const events=(plan.events||[]).filter(function(event){
  return event.type==='hatch'||event.type==='birth';
 }).sort(function(a,b){
  return text(b.date).localeCompare(text(a.date));
 });
 return events.length?events[0].date:'';
}

function offspringPreset(id){
 const plan=planById(id);
 if(!plan)return {};
 const mother=plan.motherSnapshot||{};
 const father=plan.fatherSnapshot||{};
 return {
  animalGroup:mother.animalGroup||father.animalGroup||'',
  genus:mother.genus||father.genus||'',
  species:mother.species||father.species||'',
  birth:latestBirthDate(plan),
  birthDate:latestBirthDate(plan),
  clutchId:plan.clutchCode||plan.projectCode||'',
  clutch:plan.clutchCode||plan.projectCode||'',
  fatherId:plan.fatherId||'',
  father:parentName(plan,'father'),
  motherId:plan.motherId||'',
  mother:parentName(plan,'mother'),
  breedingPlanId:plan.id,
  note:'Zuchtprojekt '+(plan.projectCode||'')
 };
}

function createOffspring(id){
 NGT500.route('offspring',{create:true,breedingPlanId:id});
}

async function createBulkOffspring(id){
 const plan=planById(id);
 if(!plan)return;

 const expected=expectedOffspringCount(plan);
 const existing=offspringRows(plan);
 const remaining=Math.max(0,expected-existing.length);
 const requested=Math.max(0,Math.floor(Number(value('breedingBulkCount')||remaining)));
 const count=Math.min(requested,remaining);

 if(!remaining){
  NGT500.toast('Alle Nachzuchten dieses Projekts sind bereits angelegt.');
  return;
 }
 if(!count){
  NGT500.toast('Bitte eine gültige Anzahl eingeben.','danger');
  return;
 }

 const confirmed=await NGT500.confirmAction(
  count+' Nachzucht'+(count===1?'':'en')+' automatisch im Nachzuchtenbestand anlegen?',
  {
   title:'Nachzuchten anlegen',
   confirmText:count+' anlegen',
   cancelText:'Abbrechen'
  }
 );
 if(!confirmed)return;

 const activePlan=planById(id);
 const currentRows=offspringRows(activePlan);
 const currentRemaining=Math.max(0,expectedOffspringCount(activePlan)-currentRows.length);
 const finalCount=Math.min(count,currentRemaining);
 if(!finalCount){
  NGT500.toast('Die Nachzuchten wurden bereits angelegt.');
  NGT500.route('breeding',{id:id},{replace:true});
  return;
 }

 const preset=offspringPreset(id);
 const items=[];
 for(let index=0;index<finalCount;index+=1){
  items.push({
   animalGroup:preset.animalGroup||'Nachzuchten',
   genus:preset.genus||'',
   species:preset.species||'',
   name:'',
   morph:'',
   sex:'Unbestimmt',
   status:'Nachzucht',
   collection:'offspring',
   origin:'Eigene Nachzucht',
   birth:preset.birth||'',
   birthDate:preset.birthDate||preset.birth||'',
   clutchId:preset.clutchId||'',
   clutch:preset.clutch||'',
   fatherId:preset.fatherId||'',
   father:preset.father||'',
   motherId:preset.motherId||'',
   mother:preset.mother||'',
   breedingPlanId:activePlan.id,
   note:preset.note||'',
   feeds:[],
   sheds:[],
   weights:[],
   photos:[],
   health:[]
  });
 }

 const created=NGTStore.addAnimalsBulk?NGTStore.addAnimalsBulk(items):items.map(function(item){
  return NGTStore.addAnimal('',item);
 });
 activePlan.offspringIds=Array.from(new Set(
  currentRows.map(function(row){return NGTStore.animalId(row.a);})
   .concat(created.map(function(animal){return NGTStore.animalId(animal);}))
 ));
 NGTStore.saveBreedingPlan(activePlan);
 NGT500.toast(created.length+' Nachzucht'+(created.length===1?'':'en')+' angelegt.');
 NGT500.route('breeding',{id:id},{replace:true});
}

function linkOffspring(planId,animalId){
 const plan=planById(planId);
 if(!plan||!animalId)return;
 plan.offspringIds=Array.isArray(plan.offspringIds)?plan.offspringIds:[];
 if(!plan.offspringIds.includes(animalId)){
  plan.offspringIds.push(animalId);
 }
 NGTStore.saveBreedingPlan(plan);
}

window.NGTBreeding={
 render:render,
 savePlan:savePlan,
 updateStatus:updateStatus,
 addEvent:addEvent,
 archive:archive,
 remove:remove,
 createOffspring:createOffspring,
 createBulkOffspring:createBulkOffspring,
 offspringPreset:offspringPreset,
 linkOffspring:linkOffspring
};

NGT500.register('breeding',{render:render});

})();
