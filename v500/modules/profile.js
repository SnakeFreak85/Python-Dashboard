(function(){
'use strict';

const P=window.NGTProfileInternal;

if(!P){
 throw new Error(
  'NGTProfileInternal fehlt. '+
  'profile-core.js muss vor profile.js geladen werden.'
 );
}

const requiredModules=[
 'history',
 'food',
 'health',
 'passport',
 'photos'
];

requiredModules.forEach(function(name){
 if(!P[name]){
  throw new Error(
   'Profil-Modul fehlt: '+name
  );
 }
});

function render(args){
 P.photos.closePhotoViewer();
 P.setContext(args);

 const animal=P.current();

 if(!animal){
  return (
   '<div class="tc2PageCard tc2EmptyState">'+
    'Tier nicht gefunden.'+
   '</div>'
  );
 }

 P.ensure(animal);

 const context=P.getContext();
 const editRoute=
  window.NGTIdManager&&
  NGTIdManager.isOffspring&&
  NGTIdManager.isOffspring(animal)
   ?'offspring'
   :'animals';

 const cover=
  P.photos.profilePhoto(animal);

 const image=
  P.photos.photoSrc(
   cover,
   true
  );

 const healthStatus=
  P.health.healthStatus(animal);

 const latestWeight=
  P.latest(animal.weights);

 const feedInterval=
  CareRulesEngine.feedInterval(animal);

 const id=
  animal.publicId||
  animal.displayId||
  animal.uuid||
  '-';

 const scientificName=
  P.scientificName(animal);
 const inactive=
  !AnimalEngine.isActiveAnimal(animal)&&
  !AnimalEngine.isOffspringAnimal(animal);
 const backRoute=inactive
  ?`
   NGT500.route(
    'animals',
    {
     view:'archive',
     status:'${P.jsArg(AnimalEngine.canonicalStatus(animal.status))}'
    }
   )
  `
  :`
   NGT500.route(
    'animals',
    {
     group:'${P.jsArg(animal.animalGroup)}',
     genus:'${P.jsArg(
      animal.genus||
      'Ohne Gattung'
     )}'
    }
   )
  `;

 return `
  <div
   class="
    tc2PageCard
    tc2ProfilePage
    tc2ProfileV4
   "
  >
   <div class="tc2ProfileTopBar">
    <button
     class="tc2ProfileTopBack"
     onclick="${backRoute}"
    >
     ‹ ${inactive?'Archiv':'Bestand'}
    </button>

    <div
     class="
      tc2ProfileTopStatus
      ${healthStatus.cls}
     "
    >
     ${healthStatus.icon}
     ${P.esc(healthStatus.txt)}
    </div>
   </div>

   <section class="tc2ProfileIdentity">
    <b class="tc2ProfilePublicId">
     ${P.esc(id)}
    </b>

    ${
     animal.name
      ?`<h2>${P.esc(animal.name)}</h2>`
      :''
    }

    <h3>
     ${P.esc(P.sexCode(animal.sex))}
    </h3>

    <h3 class="tc2ProfileScientific">
     ${P.esc(scientificName)}
    </h3>

    ${
     animal.morph
      ?`<p>${P.esc(animal.morph)}</p>`
      :''
    }

    <small>
     ${P.esc(
      animal.animalGroup||
      'Unsortiert'
     )}
    </small>
   </section>

   ${
    inactive
     ?`
      <div class="tc2ProfileArchiveNotice">
       <span>Archiviert</span>

       <div>
        <b>${P.esc(AnimalEngine.canonicalStatus(animal.status))}</b>
        <small>
         Das Profil und alle bisherigen Einträge bleiben erhalten.
        </small>
       </div>
      </div>
     `
     :''
   }

   <div
    class="tc2ProfileHero"
    ${
     image
      ?'onclick="NGTProfile.openCoverPhoto()"'
      :''
    }
   >
    ${
     image
      ?`
       <img
        src="${P.esc(image)}"
        alt="Tierfoto"
       >
      `
      :`
       <div class="tc2ProfileHeroEmpty">
        📷
       </div>
      `
    }
   </div>

   <section class="tc2ProfileActionGrid">
    ${P.action(
     '✏️',
     'Bearbeiten',
     context.animalId
      ?`NGT500.route('${editRoute}',{editId:'${P.jsArg(context.animalId)}'})`
      :`NGT500.route('${editRoute}',{edit:${context.i}})`
    )}

    ${P.action(
     '🍽️',
     'Fütterung',
     "NGTProfile.setTab('feeds')"
    )}

    ${P.action(
     '⚖️',
     'Gewicht',
     "NGTProfile.setTab('weights')"
    )}

    ${P.action(
     '🦴',
     'Häutung',
     "NGTProfile.setTab('sheds')"
    )}

    ${P.action(
     '📷',
     'Fotos',
     "NGTProfile.setTab('photos')"
    )}

    ${P.action(
     '📄',
     'Dokumente',
     "NGTProfile.setTab('docs')"
    )}

    ${P.action(
     '▦',
     'Tierpass',
     "NGTProfile.setTab('qr')"
    )}

    ${P.action(
     '🩺',
     'Gesundheit',
     "NGTProfile.setTab('health')"
    )}

    ${P.managementActions(animal)}
   </section>

   <div class="tc2ProfileStats">
    <div>
     <small>Gewicht</small>

     <b>
      ${
       latestWeight
        ?P.esc(latestWeight.weight)+' g'
        :(
         animal.weight
          ?P.esc(animal.weight)+' g'
          :'-'
        )
      }
     </b>
    </div>

    <div>
     <small>Alter</small>

     <b>
      ${P.esc(P.age(animal.birth))}
     </b>
    </div>

    <div>
     <small>Status</small>

     <b>
      ${P.esc(animal.status||'-')}
     </b>
    </div>

    <div>
     <small>Intervall</small>

     <b>
      ${P.esc(
       feedInterval===null
        ?'Deaktiviert'
        :feedInterval+' Tage'
      )}
     </b>
    </div>
   </div>

   <div class="tc2ProfileBody">
    ${body(animal)}
   </div>
  </div>
 `;
}

function body(animal){
 const tab=P.getTab();

 if(tab==='overview'){
  return overview(animal);
 }

 if(tab==='life'){
  return `
   <div class="tc2SubCard">
    <h3>Chronik</h3>

    ${NGTUI.list(
     NGTUI.timeline(animal)
    )}
   </div>
  `;
 }

 if(tab==='docs'){
  return P.passport.docs(animal);
 }

 if(tab==='feeds'){
  return (
   P.food.feedForm(animal)+
   P.food.feedList(animal)
  );
 }

 if(tab==='sheds'){
  return (
   P.history.shedForm()+
   P.history.shedList(animal)
  );
 }

 if(tab==='weights'){
  return (
   P.history.weightForm()+
   P.history.weightList(animal)
  );
 }

 if(tab==='photos'){
  return P.photos.photos(animal);
 }

 if(tab==='health'){
  return P.health.health(animal);
 }

 if(tab==='charts'){
  return P.history.charts(animal);
 }

 if(tab==='analysis'){
  return analysis(animal);
 }

 if(tab==='qr'){
  return P.passport.qrView(animal);
 }

 return '';
}

function overview(animal){
 const latestFeed=
  P.latest(animal.feeds);

 const latestWeight=
  P.latest(animal.weights);

 const latestHealth=
  P.latest(animal.health);

 return `
  <div class="tc2ProfileOverviewGrid">
   <div>
    <small>Fotos</small>

    <b>
     ${
      P.photos
       .usablePhotos(animal)
       .length
     }
    </b>
   </div>

   <div>
    <small>Fütterungen</small>

    <b>
     ${(animal.feeds||[]).length}
    </b>
   </div>

   <div>
    <small>Gewichte</small>

    <b>
     ${(animal.weights||[]).length}
    </b>
   </div>

   <div>
    <small>Gesundheit</small>

    <b>
     ${(animal.health||[]).length}
    </b>
   </div>
  </div>

  <div class="tc2SubCard">
   <h3>Zusammenfassung</h3>

   <div class="tc2InfoRows">
    <div>
     <b>TerraControl-ID</b>

     <span>
      ${P.esc(
       animal.publicId||
       animal.displayId||
       '-'
      )}
     </span>
    </div>

    <div>
     <b>Wissenschaftlich</b>

     <span>
      ${P.esc(
       P.sexCode(animal.sex)+
       ' '+
       P.scientificName(animal)
      )}
     </span>
    </div>

    <div>
     <b>Letzte Fütterung</b>

     <span>
      ${
       latestFeed
        ?(
         P.esc(latestFeed.date)+
         ' '+
         (
          latestFeed.accepted===false
           ?'verweigert'
           :'gefressen'
         )
        )
        :'-'
      }
     </span>
    </div>

    <div>
     <b>Gewicht</b>

     <span>
      ${
       latestWeight
        ?(
         P.esc(latestWeight.weight)+
         ' g am '+
         P.esc(latestWeight.date)
        )
        :'-'
      }
     </span>
    </div>

    <div>
     <b>Gesundheit</b>

     <span>
      ${
       latestHealth
        ?(
         P.esc(latestHealth.date)+
         ' '+
         P.esc(
          latestHealth.title||
          latestHealth.type
         )
        )
        :'-'
      }
     </span>
    </div>

    <div>
     <b>Notizen</b>

     <span>
      ${P.esc(animal.note||'-')}
     </span>
    </div>
   </div>
  </div>

  <div class="tc2SubCard">
   <h3>Chronik</h3>

   ${
    NGTUI.list(
     NGTUI.timeline(animal)
      .slice(0,6)
    )
   }
  </div>
 `;
}

function analysis(animal){
 const refused=
  (animal.feeds||[])
   .filter(function(feed){
    return feed.accepted===false;
   })
   .length;

 const accepted=
  (animal.feeds||[])
   .filter(function(feed){
    return feed.accepted!==false;
   })
   .length;

 const sortedWeights=
  AnimalEngine.sortHistory(
   animal.weights,
   'asc'
  );

 const firstWeight=
  sortedWeights[0];

 const lastWeight=
  sortedWeights[
   sortedWeights.length-1
  ];

 let difference='-';

 if(
  firstWeight&&
  lastWeight&&
  firstWeight!==lastWeight
 ){
  difference=(
   Number(lastWeight.weight)-
   Number(firstWeight.weight)
  )+'g';
 }

 return `
  <div class="tc2SubCard">
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

     <span>
      ${P.esc(difference)}
     </span>
    </div>

    <div>
     <b>Status</b>

     <span>
      ${P.esc(
       P.health
        .healthStatus(animal)
        .txt
      )}
     </span>
    </div>
   </div>
  </div>
 `;
}

function setTab(tab){
 P.setTab(tab);
}

function afterRender(){
 const animal=P.current();
 const tab=P.getTab();

 if(tab==='feeds'){
  P.food.updateFeedStockStatus();
 }

 P.passport.afterRender(animal);
}

window.NGTProfile={
 setTab:setTab,

 addPhoto:
  P.photos.addPhoto,

 migratePhotos:
  P.photos.migratePhotos,

 setCover:
  P.photos.setCover,

 deletePhoto:
  P.photos.deletePhoto,

 openCoverPhoto:
  P.photos.openCoverPhoto,

 openPhoto:
  P.photos.openPhoto,

 previousPhoto:
  P.photos.previousPhoto,

 nextPhoto:
  P.photos.nextPhoto,

 closePhotoViewer:
  P.photos.closePhotoViewer,

 addFeed:
  P.food.addFeed,

 addShed:
  P.history.addShed,

 addWeight:
  P.history.addWeight,

 addHealth:
  P.health.addHealth,

 deleteEntry:
  P.history.deleteEntry,

 updateFeedStockStatus:
  P.food.updateFeedStockStatus
};

NGT500.register('profile',{
 render:render,
 afterRender:afterRender
});

})();
