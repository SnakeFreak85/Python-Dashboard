(function(){
'use strict';

const P=window.NGTProfileInternal;

if(!P){
 throw new Error(
  'NGTProfileInternal fehlt. profile-core.js muss vor profile-passport.js geladen werden.'
 );
}

function smallHistory(animal){
 return {
  weights:(animal.weights||[])
   .slice(-5)
   .map(function(entry){
    return {
     d:P.s(entry.date,10),
     g:Number(entry.weight||0)
    };
   }),

  feeds:(animal.feeds||[])
   .slice(-5)
   .map(function(entry){
    return {
     d:P.s(entry.date,10),
     p:P.s(entry.prey,24),
     g:Number(entry.amount||0),
     ok:entry.accepted!==false,
     state:P.s(
      entry.state||
      '',
      10
     ),
     size:P.s(
      entry.size||
      '',
      12
     )
    };
   }),

  sheds:(animal.sheds||[])
   .slice(-5)
   .map(function(entry){
    return {
     d:P.s(entry.date,10),
     ok:entry.complete!==false
    };
   })
 };
}

function passportObject(
 animal,
 withHistory
){
 return {
  app:'TerraControl',
  type:'animal-passport',
  v:4,

  animal:{
   id:P.s(
    animal.publicId||
    animal.displayId||
    animal.uuid||
    animal.uid,
    80
   ),

   uuid:P.s(
    animal.uuid||
    animal.uid,
    80
   ),

   name:P.s(
    animal.name,
    60
   ),

   animalGroup:P.s(
    animal.animalGroup,
    60
   ),

   genus:P.s(
    animal.genus,
    60
   ),

   species:P.s(
    animal.species,
    60
   ),

   sex:P.s(
    animal.sex,
    20
   ),

   sexCode:P.sexCode(
    animal.sex
   ),

   birth:P.s(
    animal.birth,
    10
   ),

   origin:P.s(
    animal.origin||
    animal.originType,
    40
   ),

   father:P.s(
    animal.father||
    animal.vater||
    animal.sire,
    60
   ),

   mother:P.s(
    animal.mother||
    animal.mutter||
    animal.dam,
    60
   ),

   food:P.s(
    animal.defaultFeeder,
    60
   ),

   feedDays:Number(
    animal.feedIntervalDays||
    animal.feedingInterval||
    14
   ),

   weightDays:Number(
    animal.weightIntervalDays||
    30
   )
  },

  history:
   withHistory
    ?smallHistory(animal)
    :undefined
 };
}

function passportPayload(animal){
 try{
  const full=JSON.stringify(
   passportObject(
    animal,
    true
   )
  );

  if(full.length<1800){
   return full;
  }

  const lite=JSON.stringify(
   passportObject(
    animal,
    false
   )
  );

  if(lite.length<1200){
   return lite;
  }

  return [
   'TC2',

   P.s(
    animal.publicId||
    animal.uuid||
    animal.uid,
    80
   ),

   P.s(
    animal.name,
    50
   ),

   P.s(
    animal.genus,
    50
   ),

   P.s(
    animal.species,
    50
   ),

   P.s(
    animal.sex,
    20
   ),

   P.s(
    animal.birth,
    10
   )
  ].join('|');

 }catch(error){
  return [
   'TC2',

   P.s(
    animal.publicId||
    animal.uuid||
    animal.uid,
    80
   ),

   P.s(
    animal.name,
    50
   )
  ].join('|');
 }
}

function qrView(animal){
 const payload=
  passportPayload(animal);

 return `
  <div class="subcard tc2SubCard">
   <h3>Digitaler Tierpass</h3>

   <div class="qrBox">
    <div id="profileQr"></div>
   </div>

   <p class="muted">
    QR-Code enthält TerraControl-ID,
    Tierdaten und optional gekürzte
    Historie.
   </p>

   <textarea readonly>${P.esc(payload)}</textarea>
  </div>
 `;
}

function docs(animal){
 const uid=encodeURIComponent(
  animal.uuid||
  animal.uid||
  ''
 );

 return `
  <div class="subcard tc2SubCard">
   <h3>Dokumentencenter</h3>

   <div class="btnRow">
    <button
     onclick="location.href='./abgabe.html?id=${uid}'"
    >
     Abgabenachweis / PDF
    </button>

    <button
     onclick="NGTProfile.setTab('qr')"
    >
     Digitaler Tierpass QR
    </button>
   </div>

   <p class="muted">
    Später kommen hier Herkunftsnachweise,
    CITES/Artenschutz-Dokumente und
    Verkaufsunterlagen hinzu.
   </p>
  </div>
 `;
}

function afterRender(animal){
 if(
  P.getTab()!=='qr'||
  !animal||
  !window.QRCode
 ){
  return;
 }

 const box=
  document.getElementById(
   'profileQr'
  );

 if(!box){
  return;
 }

 box.innerHTML='';

 const payload=
  passportPayload(animal);

 try{
  new QRCode(box,{
   text:payload,
   width:220,
   height:220,
   correctLevel:
    QRCode.CorrectLevel.L
  });

 }catch(error){
  box.innerHTML='';

  new QRCode(box,{
   text:[
    'TC2',

    P.s(
     animal.publicId||
     animal.uuid||
     animal.uid,
     80
    ),

    P.s(
     animal.name,
     50
    )
   ].join('|'),

   width:220,
   height:220,

   correctLevel:
    QRCode.CorrectLevel.L
  });
 }
}

P.passport={
 smallHistory:smallHistory,
 passportObject:passportObject,
 passportPayload:passportPayload,
 qrView:qrView,
 docs:docs,
 afterRender:afterRender
};

})();