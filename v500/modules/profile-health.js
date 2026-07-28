(function(){
'use strict';

const P=window.NGTProfileInternal;

if(!P){
 throw new Error(
  'NGTProfileInternal fehlt. profile-core.js muss vor profile-health.js geladen werden.'
 );
}

function healthStatus(animal){
 return CareRulesEngine.healthStatus(
  animal
 );
}

function healthForm(){
 return `
  <div class="tc2SubCard">
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
  </div>
 `;
}

function health(animal){
 return healthForm()+
  (
   (animal.health||[])
    .map(function(entry,index){
     return {
      entry:entry,
      index:index
     };
    })
    .reverse()
    .map(function(item){
     return `
      <div class="tc2SubCard">
       <b>
        ${P.esc(
         item.entry.date||
         '-'
        )}
        ·
        ${P.esc(
         item.entry.type||
         'Gesundheit'
        )}
       </b>

       <br>

       ${P.esc(
        item.entry.title||
        ''
       )}

       <br>

       ${P.esc(
        item.entry.medication||
        ''
       )}

       ${P.esc(
        item.entry.dose||
        ''
       )}

       ${P.esc(
        item.entry.duration||
        ''
       )}

       <br>

       Status:
       ${P.esc(
        item.entry.status||
        '-'
       )}

       <br>

       ${P.esc(
        item.entry.note||
        ''
       )}

       <button
        class="danger"
        onclick="NGTProfile.deleteEntry('health',${item.index})"
       >
        Eintrag löschen
       </button>
      </div>
     `;
    })
    .join('')||
   '<p class="muted">Keine Gesundheitsdaten.</p>'
  );
}

function addHealth(){
 const animal=P.current();

 if(!animal){
  NGT500.toast(
   'Das Tier wurde nicht gefunden.',
   'danger'
  );
  return;
 }

 const dateElement=
  document.getElementById(
   'healthDate'
  );

 const typeElement=
  document.getElementById(
   'healthType'
  );

 const titleElement=
  document.getElementById(
   'healthTitle'
  );

 const medicationElement=
  document.getElementById(
   'healthMedication'
  );

 const doseElement=
  document.getElementById(
   'healthDose'
  );

 const durationElement=
  document.getElementById(
   'healthDuration'
  );

 const statusElement=
  document.getElementById(
   'healthStatus'
  );

 const noteElement=
  document.getElementById(
   'healthNote'
  );

 const result=NGTStore.recordHealth(
  P.getContext(),
  {
  date:
   (
    dateElement&&
    dateElement.value
   )||
   NGT500.today(),

  type:
   typeElement
    ?typeElement.value
    :'Gesundheit',

  title:
   titleElement
    ?titleElement.value
    :'',

  medication:
   medicationElement
    ?medicationElement.value
    :'',

  dose:
   doseElement
    ?doseElement.value
    :'',

  duration:
   durationElement
    ?durationElement.value
    :'',

  status:
   statusElement
    ?statusElement.value
    :'offen',

  note:
   noteElement
    ?noteElement.value
    :'',

  source:'profile'
  }
 );

 if(result){
  P.setTab('health');
 }
}

P.health={
 healthStatus:healthStatus,
 healthForm:healthForm,
 health:health,
 addHealth:addHealth
};

})();
