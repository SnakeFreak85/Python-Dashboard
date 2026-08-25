(function(){
'use strict';

let current=null;
let loading=true;
let saving=false;
let errorText='';
let draft=null;
let unsubscribe=null;
let revision=0;

function esc(value){
 return NGT500.esc(
  value||''
 );
}

function user(){
 return window.NGTFirebaseSync&&
  NGTFirebaseSync.currentUser
   ?NGTFirebaseSync.currentUser()
   :null;
}

function isAdmin(){
 return !!(
  window.NGTAnnouncementService&&
  NGTAnnouncementService.isAdminUser(
   user()
  )
 );
}

function formatDate(value){
 if(!value){
  return '';
 }

 try{
  return new Date(value).toLocaleString(
   window.TCI18n?TCI18n.locale():'de-DE',
   {
    dateStyle:'medium',
    timeStyle:'short'
   }
  );
 }catch(error){
  return '';
 }
}

function status(){
 if(errorText){
  return `
   <div class="tc2AnnouncementNotice danger">
    ${esc(errorText)}
   </div>
  `;
 }

 if(loading){
  return `
   <div class="tc2AnnouncementNotice">
    Mitteilung wird geladen …
   </div>
  `;
 }

 return '';
}

function denied(){
 return `
  <section class="tc2AnnouncementsAdmin">
   <div class="tc2AnnouncementAdminHero">
    <span>i</span>
    <div>
     <h2>Mitteilungen</h2>
     <p>Dieser Bereich ist nur für den TerraControl-Administrator verfügbar.</p>
    </div>
   </div>
  </section>
 `;
}

function preview(){
 if(!current){
  return `
   <div class="tc2AnnouncementEmpty">
    <b>Keine aktive Mitteilung</b>
    <span>Auf den Startseiten der Tester wird aktuell keine Information eingeblendet.</span>
   </div>
  `;
 }

 return `
  <article class="tc2AnnouncementCard ${current.important?'important':''}">
   <span class="tc2AnnouncementIcon">${current.important?'!':'i'}</span>
   <div>
    <small>Aktuelle Mitteilung</small>
    <h3>${esc(current.title)}</h3>
    <p>${esc(current.message).replace(/\n/g,'<br>')}</p>
    <time>${esc(formatDate(current.publishedAtMs))}</time>
   </div>
  </article>
 `;
}

function adminView(){
 const values=draft||current||{};
 const title=
  values.sourceTitle||
  values.title||'';
 const message=
  values.sourceMessage||
  values.message||'';

 return `
  <section class="tc2AnnouncementsAdmin">
   <div class="tc2AnnouncementAdminHero">
    <span>i</span>
    <div>
     <h2>Mitteilung an Tester</h2>
     <p>Eine zentrale Information auf allen angemeldeten Startseiten veröffentlichen.</p>
    </div>
   </div>

   ${status()}
   ${preview()}

   <div class="tc2AnnouncementEditor">
    <div class="tc2AnnouncementNotice">
     Du schreibst auf Deutsch. Beim Veröffentlichen erstellt TerraControl automatisch Englisch, Italienisch und Ungarisch.
    </div>

    <label>
     <span>Überschrift</span>
     <input
      id="announcementTitle"
      maxlength="${NGTAnnouncementService.MAX_TITLE_LENGTH}"
      value="${esc(title)}"
      placeholder="Zum Beispiel: Neue Testversion"
      ${saving?'disabled':''}
     >
    </label>

    <label>
     <span>Mitteilung</span>
     <textarea
      id="announcementMessage"
      maxlength="${NGTAnnouncementService.MAX_MESSAGE_LENGTH}"
      placeholder="Information für deine Tester …"
      ${saving?'disabled':''}
     >${esc(message)}</textarea>
    </label>

    <label class="tc2AnnouncementImportant">
     <input
      id="announcementImportant"
      type="checkbox"
      ${values.important?'checked':''}
      ${saving?'disabled':''}
     >
     <span>
      <b>Als wichtig markieren</b>
      <small>Die Mitteilung wird auf der Startseite deutlicher hervorgehoben.</small>
     </span>
    </label>

    <div class="tc2AnnouncementActions">
     <button
      type="button"
      onclick="NGTAnnouncements.publish()"
      ${saving?'disabled':''}
     >
      ${saving?'Wird übersetzt und veröffentlicht …':'Übersetzen und veröffentlichen'}
     </button>

     <button
      type="button"
      class="danger"
      onclick="NGTAnnouncements.close()"
      ${saving||!current?'disabled':''}
     >
      Mitteilung beenden
     </button>
    </div>
   </div>
  </section>
 `;
}

function content(){
 if(!isAdmin()){
  return denied();
 }

 return adminView();
}

function render(){
 return `
  <div id="tcAnnouncementsRoot">
   ${content()}
  </div>
 `;
}

function paint(){
 const root=document.getElementById(
  'tcAnnouncementsRoot'
 );

 if(root){
  root.innerHTML=content();
 }
}

function stop(){
 revision++;

 if(unsubscribe){
  try{
   unsubscribe();
  }catch(error){}
 }

 unsubscribe=null;
}

async function begin(){
 stop();
 current=null;
 errorText='';
 draft=null;
 loading=isAdmin();
 paint();

 if(!isAdmin()){
  loading=false;
  paint();
  return;
 }

 const activeRevision=revision;

 try{
  const listener=
   await NGTAnnouncementService.listenCurrent(
    function(value){
     if(activeRevision!==revision){
      return;
     }

     current=value;
     loading=false;
     errorText='';
     paint();
    },
    function(message){
     if(activeRevision!==revision){
      return;
     }

     loading=false;
     errorText=message;
     paint();
    }
   );

  if(activeRevision===revision){
   unsubscribe=listener;
  }else if(listener){
   listener();
  }
 }catch(error){
  if(activeRevision===revision){
   loading=false;
   errorText=
    NGTAnnouncementService.errorMessage(
     error
    );
   paint();
  }
 }
}

async function publish(){
 if(saving){
  return;
 }

 const titleInput=document.getElementById(
  'announcementTitle'
 );
 const messageInput=document.getElementById(
  'announcementMessage'
 );
 const importantInput=document.getElementById(
  'announcementImportant'
 );

 draft={
  title:String(
   titleInput&&titleInput.value||''
  ),
  message:String(
   messageInput&&messageInput.value||''
  ),
  important:!!(
   importantInput&&importantInput.checked
  )
 };

 saving=true;
 errorText='';
 paint();

 try{
  await NGTAnnouncementService.publish(
   draft
  );

  NGT500.toast(
   'Mitteilung wurde veröffentlicht.',
   'ok'
  );
  draft=null;
 }catch(error){
  errorText=
   NGTAnnouncementService.errorMessage(
    error
   );
 }finally{
  saving=false;
  paint();
 }
}

async function close(){
 if(
  saving||
  !current
 ){
  return;
 }

 if(!await NGT500.confirmAction(
  'Aktive Mitteilung von allen Startseiten entfernen?',
  {
   title:'Mitteilung beenden',
   confirmText:'Beenden',
   danger:true
  }
 )){
  return;
 }

 saving=true;
 errorText='';
 paint();

 try{
  await NGTAnnouncementService.close();
  NGT500.toast(
   'Mitteilung wurde beendet.',
   'ok'
  );
 }catch(error){
  errorText=
   NGTAnnouncementService.errorMessage(
    error
   );
 }finally{
  saving=false;
  paint();
 }
}

function afterRender(){
 begin();
}

window.NGTAnnouncements={
 render:render,
 afterRender:afterRender,
 publish:publish,
 close:close,
 stop:stop
};

NGT500.register(
 'announcements',
 {
  render:render,
  afterRender:afterRender
 }
);

NGT500.on(
 'route',
 function(event){
  if(
   !event||
   event.name!=='announcements'
  ){
   stop();
  }
 }
);

NGT500.on(
 'firebase:auth',
 function(){
  const route=NGT500.current&&
   NGT500.current();

  if(
   route&&
   route.name==='announcements'
  ){
   NGT500.route(
    'announcements',
    {},
    {
     replace:true,
     noHistory:true
    }
   );
  }
 }
);

})();
