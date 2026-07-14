(function(){
'use strict';

const KEY='terracontrol_release_test_v2';

const GROUPS=[
 {
  id:'animals',
  title:'Tiere und Profile',
  icon:'🐾',
  tests:[
   'Tier anlegen',
   'Tier bearbeiten',
   'Tierdaten nach Neuladen prüfen',
   'Tier im Bestand öffnen',
   'Tierprofil vollständig prüfen'
  ]
 },
 {
  id:'photos',
  title:'Fotos',
  icon:'📷',
  tests:[
   'Foto hinzufügen',
   'Foto nach Neuladen anzeigen',
   'Titelbild setzen',
   'Titelbild im Bestand anzeigen',
   'Foto in Vollbild öffnen'
  ]
 },
 {
  id:'care',
  title:'Pflege und Historie',
  icon:'🩺',
  tests:[
   'Fütterung speichern',
   'Futterbestand korrekt reduzieren',
   'Verweigerte Fütterung speichern',
   'Gewicht speichern',
   'Häutung speichern',
   'Gesundheitseintrag speichern'
  ]
 },
 {
  id:'food',
  title:'Futterverwaltung',
  icon:'🥩',
  tests:[
   'Futterposition anlegen',
   'Futterposition bearbeiten',
   'Bestand mit Plus und Minus ändern',
   'Doppelte Position zusammenführen',
   'Mindestbestand prüfen'
  ]
 },
 {
  id:'offspring',
  title:'Nachzuchten',
  icon:'🥚',
  tests:[
   'Nachzucht anlegen',
   'Nachzucht bearbeiten',
   'Nachzucht im eigenen Nummernkreis prüfen',
   'Foto bei Nachzucht anzeigen',
   'Standardfutter bei Nachzucht speichern'
  ]
 },
 {
  id:'tools',
  title:'Werkzeuge',
  icon:'🧰',
  tests:[
   'Smart Dashboard prüfen',
   'Digitalen Tierpass öffnen',
   'QR-Code erzeugen',
   'Abgabenachweis oder PDF erstellen',
   'Backup exportieren',
   'Backup importieren'
  ]
 },
 {
  id:'ai',
  title:'KI-Funktionen',
  icon:'⚡',
  tests:[
   'TerraControl KI testen',
   'KI-Schnelleingabe testen',
   'KI-Dokumentenimport testen'
  ]
 },
 {
  id:'system',
  title:'System und Synchronisation',
  icon:'☁️',
  tests:[
   'Einstellungen speichern',
   'Firebase-Anmeldung prüfen',
   'Daten in Firebase speichern',
   'Daten auf zweitem Gerät laden',
   'App vollständig neu laden',
   'Browserdaten-Verlust mit Cloud-Wiederherstellung prüfen'
  ]
 }
];

function esc(value){
 return NGT500.esc(value||'');
}

function allTests(){
 const rows=[];

 GROUPS.forEach(function(group){
  group.tests.forEach(function(label,index){
   rows.push({
    key:group.id+'_'+index,
    groupId:group.id,
    groupTitle:group.title,
    label:label
   });
  });
 });

 return rows;
}

function load(){
 try{
  const parsed=JSON.parse(
   localStorage.getItem(KEY)||'{}'
  );

  return parsed&&typeof parsed==='object'
   ?parsed
   :{};
 }catch(error){
  return {};
 }
}

function saveState(state){
 localStorage.setItem(
  KEY,
  JSON.stringify(state)
 );
}

function completedCount(state){
 return allTests().filter(function(test){
  return !!state[test.key];
 }).length;
}

function percentage(done,total){
 return total
  ?Math.round(done/total*100)
  :0;
}

function statusInfo(done,total){
 if(done===total&&total>0){
  return {
   label:'Release-Test bestanden',
   description:'Alle Prüfpunkte wurden bestätigt.',
   className:'ok',
   icon:'✅'
  };
 }

 if(done===0){
  return {
   label:'Noch nicht begonnen',
   description:'Starte mit dem ersten Prüfbereich.',
   className:'',
   icon:'○'
  };
 }

 return {
  label:'Test läuft',
  description:(total-done)+' Prüfpunkte sind noch offen.',
  className:'warn',
  icon:'🟡'
 };
}

function groupProgress(group,state){
 const done=group.tests.filter(function(_,index){
  return !!state[group.id+'_'+index];
 }).length;

 return {
  done:done,
  total:group.tests.length,
  percent:percentage(done,group.tests.length)
 };
}

function summary(state){
 const tests=allTests();
 const done=completedCount(state);
 const total=tests.length;
 const open=total-done;
 const groupsDone=GROUPS.filter(function(group){
  const progress=groupProgress(group,state);
  return progress.done===progress.total;
 }).length;

 return `<div class="tc2ReleaseSummary">
  <article>
   <small>Erledigt</small>
   <b>${done}/${total}</b>
  </article>

  <article>
   <small>Fortschritt</small>
   <b>${percentage(done,total)} %</b>
  </article>

  <article>
   <small>Offen</small>
   <b>${open}</b>
  </article>

  <article>
   <small>Bereiche fertig</small>
   <b>${groupsDone}/${GROUPS.length}</b>
  </article>
 </div>`;
}

function progressBar(done,total){
 const value=percentage(done,total);

 return `<div class="tc2ReleaseProgress">
  <div>
   <b>Gesamtfortschritt</b>
   <span>${value} %</span>
  </div>

  <div class="tc2ReleaseProgressTrack">
   <i style="width:${value}%"></i>
  </div>
 </div>`;
}

function testRow(group,index,label,state){
 const key=group.id+'_'+index;
 const checked=!!state[key];

 return `<label class="tc2ReleaseTestRow ${checked?'done':''}">
  <input
   type="checkbox"
   ${checked?'checked':''}
   onchange="NGTReleaseTest.toggle('${esc(key)}',this.checked)"
  >

  <span class="tc2ReleaseCheckbox">
   ${checked?'✓':''}
  </span>

  <span class="tc2ReleaseTestText">
   ${esc(label)}
  </span>
 </label>`;
}

function groupCard(group,state){
 const progress=groupProgress(group,state);
 const complete=progress.done===progress.total;

 return `<section class="tc2ReleaseGroup ${complete?'complete':''}">
  <header class="tc2ReleaseGroupHead">
   <div class="tc2ReleaseGroupIcon">
    ${group.icon}
   </div>

   <div>
    <h3>${esc(group.title)}</h3>
    <p>
     ${progress.done} von ${progress.total} erledigt
    </p>
   </div>

   <b>${progress.percent} %</b>
  </header>

  <div class="tc2ReleaseMiniProgress">
   <i style="width:${progress.percent}%"></i>
  </div>

  <div class="tc2ReleaseTests">
   ${group.tests.map(function(label,index){
    return testRow(
     group,
     index,
     label,
     state
    );
   }).join('')}
  </div>

  <button
   class="tc2ReleaseGroupAction"
   onclick="NGTReleaseTest.toggleGroup('${esc(group.id)}',${complete?'false':'true'})"
  >
   ${complete?'Bereich zurücksetzen':'Bereich vollständig markieren'}
  </button>
 </section>`;
}

function render(){
 const state=load();
 const tests=allTests();
 const done=completedCount(state);
 const total=tests.length;
 const status=statusInfo(done,total);

 return `<section class="tc2ReleasePage">
  <header class="tc2ReleaseHero">
   <div class="tc2ReleaseHeroIcon">🧪</div>

   <div>
    <h2>Release-Test</h2>
    <p>
     Qualitätsprüfung für TerraControl vor einer neuen
     Test- oder Produktionsversion.
    </p>
   </div>
  </header>

  ${summary(state)}
  ${progressBar(done,total)}

  <section class="tc2ReleaseStatus ${status.className}">
   <span>${status.icon}</span>

   <div>
    <b>${esc(status.label)}</b>
    <p>${esc(status.description)}</p>
   </div>
  </section>

  <div class="tc2ReleaseActions">
   <button onclick="NGTReleaseTest.markAll()">
    Alles erledigt
   </button>

   <button
    class="danger"
    onclick="NGTReleaseTest.reset()"
   >
    Zurücksetzen
   </button>
  </div>

  <div class="tc2ReleaseGroups">
   ${GROUPS.map(function(group){
    return groupCard(group,state);
   }).join('')}
  </div>

  <section class="tc2ReleaseFooter">
   <h3>Hinweis</h3>

   <p>
    Die Prüfliste wird lokal auf diesem Gerät gespeichert.
    Ein gesetzter Haken bestätigt nur, dass der jeweilige
    Test bewusst durchgeführt wurde.
   </p>

   <button onclick="NGT500.route('dashboard')">
    Zur Startseite
   </button>
  </section>
 </section>`;
}

function toggle(key,value){
 const state=load();

 state[key]=!!value;

 saveState(state);
 NGT500.route('releaseTest');
}

function toggleGroup(groupId,value){
 const state=load();
 const group=GROUPS.find(function(entry){
  return entry.id===groupId;
 });

 if(!group)return;

 group.tests.forEach(function(_,index){
  state[group.id+'_'+index]=!!value;
 });

 saveState(state);
 NGT500.route('releaseTest');
}

async function reset(){
 if(!await NGT500.confirmAction(
  'Den vollständigen Release-Test wirklich zurücksetzen?',
  {
   title:'Release-Test zurücksetzen',
   confirmText:'Test zurücksetzen',
   danger:true
  }
 )){
  return;
 }

 localStorage.removeItem(KEY);
 NGT500.route('releaseTest');
}

async function markAll(){
 if(!await NGT500.confirmAction(
  'Alle Prüfpunkte als erledigt markieren?',
  {
   title:'Alle Prüfpunkte abschließen',
   confirmText:'Alle markieren'
  }
 )){
  return;
 }

 const state={};

 allTests().forEach(function(test){
  state[test.key]=true;
 });

 saveState(state);
 NGT500.route('releaseTest');
}

window.NGTReleaseTest={
 toggle:toggle,
 toggleGroup:toggleGroup,
 reset:reset,
 markAll:markAll
};

NGT500.register('releaseTest',{
 render:render
});

})();
