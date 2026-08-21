(function(){
'use strict';

let currentArgs={};
let threads=[];
let activeThread=null;
let messages=[];
let loading=false;
let sending=false;
let errorText='';
let subscriptions=[];
let loadRevision=0;

function esc(value){
 return NGT500.esc(value||'');
}

function jsArg(value){
 return String(value||'')
  .replace(/\\/g,'\\\\')
  .replace(/'/g,"\\'");
}

function user(){
 if(
  !window.NGTFirebaseSync||
  !NGTFirebaseSync.currentUser
 ){
  return null;
 }

 return NGTFirebaseSync.currentUser();
}

function isAdmin(){
 return !!(
  window.NGTSupportService&&
  NGTSupportService.isAdminUser(
   user()
  )
 );
}

function formatTime(value){
 const timestamp=Number(value)||0;

 if(!timestamp){
  return '';
 }

 try{
  return new Date(timestamp)
   .toLocaleString(
    window.TCI18n?TCI18n.locale():'de-DE',
    {
     day:'2-digit',
     month:'2-digit',
     hour:'2-digit',
     minute:'2-digit'
    }
   );
 }catch(error){
  return '';
 }
}

function stop(){
 subscriptions.forEach(function(unsubscribe){
  try{
   if(typeof unsubscribe==='function'){
    unsubscribe();
   }
  }catch(error){}
 });

 subscriptions=[];
 loadRevision++;
}

function statusCard(){
 if(!errorText){
  return '';
 }

 return `
  <div class="tc2SupportNotice danger">
   <b>Supportchat nicht verfügbar</b>
   <p>${esc(errorText)}</p>
  </div>
 `;
}

function loginView(){
 return `
  <section class="tc2Support">
   <div class="tc2SupportHero">
    <span>?</span>
    <div>
     <h2>TerraControl Support</h2>
     <p>
      Stelle Fragen, melde Fehler oder sende Feedback direkt
      an den TerraControl-Support.
     </p>
    </div>
   </div>

   ${statusCard()}

   <div class="tc2SupportLogin">
    <h3>Anmeldung erforderlich</h3>
    <p>
     Der Supportchat ist privat. Melde dich mit dem
     Google-Konto an, das du für den TerraControl-Test verwendest.
    </p>

    <button
     type="button"
     onclick="NGTSupport.signIn()"
    >
     Mit Google anmelden
    </button>
   </div>
  </section>
 `;
}

function emptyInbox(){
 return `
  <div class="tc2SupportEmpty">
   <span>✓</span>
   <h3>Keine Supportanfragen</h3>
   <p>Sobald ein Tester schreibt, erscheint die Unterhaltung hier.</p>
  </div>
 `;
}

function threadRows(){
 if(loading&&!threads.length){
  return `
   <div class="tc2SupportEmpty">
    <span>…</span>
    <h3>Supportanfragen werden geladen</h3>
   </div>
  `;
 }

 if(!threads.length){
  return emptyInbox();
 }

 return `
  <div class="tc2SupportThreads">
   ${threads.map(function(thread){
    return `
     <button
      type="button"
      class="tc2SupportThread"
      onclick="NGT500.route('support',{threadId:'${jsArg(thread.id)}'})"
     >
      <span class="tc2SupportAvatar">
       ${esc(
        String(
         thread.ownerName||
         thread.ownerEmail||
         'T'
        ).slice(0,1).toUpperCase()
       )}
      </span>

      <span class="tc2SupportThreadCopy">
       <b>${esc(thread.ownerName||'Tester')}</b>
       <small>${esc(thread.ownerEmail||'')}</small>
       <em>${esc(thread.lastMessage||'Noch keine Nachricht')}</em>
      </span>

      <span class="tc2SupportThreadMeta">
       <small>${esc(formatTime(thread.updatedAtMs))}</small>
       <i>${thread.lastSenderRole==='user'?'Neu':'Beantwortet'}</i>
      </span>

      <strong>›</strong>
     </button>
    `;
   }).join('')}
  </div>
 `;
}

function adminInbox(){
 return `
  <section class="tc2Support">
   <div class="tc2SupportHero admin">
    <span>TC</span>
    <div>
     <h2>Support-Posteingang</h2>
     <p>
      Private Nachrichten der TerraControl-Tester.
     </p>
    </div>
   </div>

   ${statusCard()}

   <button
    type="button"
    class="tc2SupportAnnouncementLink"
    onclick="NGT500.route('announcements')"
   >
    <span>i</span>
    <span>
     <b>Mitteilung an Tester</b>
     <small>Information auf allen Startseiten veröffentlichen</small>
    </span>
    <strong>›</strong>
   </button>

   <div class="tc2SupportInboxHead">
    <div>
     <small>Unterhaltungen</small>
     <b>${threads.length}</b>
    </div>

    <button
     type="button"
     onclick="NGTSupport.reload()"
    >
     Aktualisieren
    </button>
   </div>

   ${threadRows()}
  </section>
 `;
}

function messageRows(){
 if(loading&&!messages.length){
  return `
   <div class="tc2SupportEmpty compact">
    <span>…</span>
    <p>Nachrichten werden geladen.</p>
   </div>
  `;
 }

 if(!messages.length){
  return `
   <div class="tc2SupportEmpty compact">
    <span>💬</span>
    <h3>Noch keine Nachricht</h3>
    <p>
     Beschreibe dein Anliegen möglichst genau. Bei einem Fehler
     helfen die betroffene Seite und die ausgeführten Schritte.
    </p>
   </div>
  `;
 }

 const ownRole=isAdmin()
  ?'admin'
  :'user';

 return messages.map(function(message){
  const own=
   message.senderRole===ownRole;

  return `
   <article class="tc2SupportMessage ${own?'mine':'other'}">
    <div>
     <b>${esc(message.senderName||(
      message.senderRole==='admin'
       ?'TerraControl Support'
       :'Tester'
     ))}</b>
     <p>${esc(message.text).replace(/\n/g,'<br>')}</p>
     <small>${esc(formatTime(message.createdAtMs))}</small>
    </div>
   </article>
  `;
 }).join('');
}

function chatTitle(){
 if(isAdmin()){
  return (
   activeThread&&(
    activeThread.ownerName||
    activeThread.ownerEmail
   )
  )||'Supportanfrage';
 }

 return 'TerraControl Support';
}

function chatSubtitle(){
 if(isAdmin()){
  return activeThread&&activeThread.ownerEmail
   ?activeThread.ownerEmail
   :'Private Unterhaltung';
 }

 return 'Private Unterhaltung mit Sascha';
}

function chatView(){
 return `
  <section class="tc2Support tc2SupportChatPage">
   <div class="tc2SupportChatHead ${isAdmin()?'admin':''}">
    ${
     isAdmin()
      ?`
       <button
        type="button"
        class="tc2SupportBack"
        onclick="NGT500.route('support')"
        aria-label="Zum Support-Posteingang"
       >
        ‹
       </button>
      `
      :''
    }

    <span class="tc2SupportAvatar large">
     ${isAdmin()
      ?esc(
       String(
        activeThread&&(
         activeThread.ownerName||
         activeThread.ownerEmail
        )||
        'T'
       ).slice(0,1).toUpperCase()
      )
      :'TC'
     }
    </span>

    <div>
     <h2>${esc(chatTitle())}</h2>
     <p>${esc(chatSubtitle())}</p>
    </div>
   </div>

   ${statusCard()}

   <div
    id="supportMessages"
    class="tc2SupportMessages"
    aria-live="polite"
   >
    ${messageRows()}
   </div>

   <div class="tc2SupportComposer">
    <textarea
     id="supportText"
     maxlength="${NGTSupportService.MAX_MESSAGE_LENGTH}"
     placeholder="Nachricht an den Support …"
     ${sending?'disabled':''}
    ></textarea>

    <button
     id="supportSend"
     type="button"
     onclick="NGTSupport.send()"
     ${sending?'disabled':''}
    >
     ${sending?'Wird gesendet …':'Senden'}
    </button>
   </div>

   <p class="tc2SupportPrivacy">
    Nachrichten werden zur Bearbeitung deiner Supportanfrage
    in Firebase gespeichert.
   </p>
  </section>
 `;
}

function content(){
 if(!user()){
  return loginView();
 }

 if(
  isAdmin()&&
  !currentArgs.threadId
 ){
  return adminInbox();
 }

 return chatView();
}

function render(args){
 currentArgs=args||{};

 return `
  <div id="tcSupportRoot">
   ${content()}
  </div>
 `;
}

function scrollMessages(){
 const element=document.getElementById(
  'supportMessages'
 );

 if(element){
  element.scrollTop=
   element.scrollHeight;
 }
}

function paint(){
 const root=document.getElementById(
  'tcSupportRoot'
 );

 if(!root){
  return;
 }

 const draft=document.getElementById(
  'supportText'
 );
 const draftValue=draft
  ?draft.value
  :'';

 root.innerHTML=content();

 const nextDraft=document.getElementById(
  'supportText'
 );

 if(nextDraft&&draftValue){
  nextDraft.value=draftValue;
 }

 requestAnimationFrame(
  scrollMessages
 );
}

function reportError(message,error){
 errorText=message||(
  window.NGTSupportService
   ?NGTSupportService.errorMessage(error)
   :'Supportchat nicht verfügbar.'
 );
 loading=false;
 sending=false;
 paint();
}

async function begin(args){
 stop();

 currentArgs=args||{};
 threads=[];
 activeThread=null;
 messages=[];
 errorText='';
 loading=!!user();
 sending=false;
 paint();

 if(!user()){
  return;
 }

 const revision=loadRevision;

 try{
  if(
   isAdmin()&&
   !currentArgs.threadId
  ){
   const unsubscribe=
    await NGTSupportService.listenThreads(
     function(rows){
      if(revision!==loadRevision){
       return;
      }

      threads=rows;
      loading=false;
      errorText='';
      paint();
     },
     reportError
    );

   if(revision===loadRevision){
    subscriptions.push(
     unsubscribe
    );
   }else if(unsubscribe){
    unsubscribe();
   }

   return;
  }

  const threadId=currentArgs.threadId||'';
  const threadSubscription=
   await NGTSupportService.listenThread(
    threadId,
    function(thread){
     if(revision!==loadRevision){
      return;
     }

     activeThread=thread;
     paint();
    },
    reportError
   );

  if(revision===loadRevision){
   subscriptions.push(
    threadSubscription
   );
  }else if(threadSubscription){
   threadSubscription();
  }

  const messageSubscription=
   await NGTSupportService.listenMessages(
    threadId,
    function(rows){
     if(revision!==loadRevision){
      return;
     }

     messages=rows;
     loading=false;
     errorText='';
     paint();
    },
    reportError
   );

  if(revision===loadRevision){
   subscriptions.push(
    messageSubscription
   );
  }else if(messageSubscription){
   messageSubscription();
  }

 }catch(error){
  if(revision===loadRevision){
   reportError(
    NGTSupportService.errorMessage(
     error
    ),
    error
   );
  }
 }
}

async function signIn(){
 errorText='';
 paint();

 try{
  await NGTFirebaseSync.signIn();
  NGT500.route(
   'support',
   {},
   {
    replace:true
   }
  );
 }catch(error){
  reportError(
   NGTSupportService.errorMessage(
    error
   ),
   error
  );
 }
}

async function send(){
 if(sending){
  return;
 }

 const input=document.getElementById(
  'supportText'
 );
 const text=String(
  input&&input.value||''
 ).trim();

 if(!text){
  NGT500.toast(
   'Bitte gib zuerst eine Nachricht ein.',
   'warn'
  );
  return;
 }

 sending=true;
 errorText='';
 paint();

 try{
  await NGTSupportService.sendMessage(
   currentArgs.threadId||'',
   text
  );

  const nextInput=document.getElementById(
   'supportText'
  );

  if(nextInput){
   nextInput.value='';
  }

  sending=false;
  paint();

 }catch(error){
  reportError(
   NGTSupportService.errorMessage(
    error
   ),
   error
  );
 }
}

function reload(){
 begin(currentArgs);
}

function afterRender(args){
 begin(args||{});
}

window.NGTSupport={
 render:render,
 afterRender:afterRender,
 signIn:signIn,
 send:send,
 reload:reload,
 stop:stop
};

NGT500.register(
 'support',
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
   event.name!=='support'
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
   route.name==='support'
  ){
   NGT500.route(
    'support',
    route.args||{},
    {
     replace:true,
     noHistory:true
    }
   );
  }
 }
);

})();
