(function(){
'use strict';

const modules={};
const listeners={};

const CURRENT_ROUTE_KEY='terracontrol_current_route_v1';
const ROUTE_STACK_KEY='terracontrol_route_stack_v1';

let currentRoute=null;
let pendingRoute=null;
let isGoingBack=false;
let modalResolve=null;
let modalPreviousFocus=null;
let modalKeyHandler=null;

function $(id){
 return document.getElementById(id);
}

function esc(s){
 return String(s??'').replace(
  /[&<>"']/g,
  function(c){
   return {
    '&':'&amp;',
    '<':'&lt;',
    '>':'&gt;',
    '"':'&quot;',
    "'":'&#39;'
   }[c];
  }
 );
}

function uid(){
 return 'tc-'+
  Date.now().toString(36)+'-'+
  Math.random().toString(36).slice(2,8);
}

function today(){
 return new Date().toISOString().slice(0,10);
}

function money(n){
 return Number(n||0).toLocaleString(
  'de-DE',
  {
   minimumFractionDigits:2,
   maximumFractionDigits:2
  }
 )+' €';
}

function on(type,fn){
 (listeners[type]=listeners[type]||[]).push(fn);
}

function emit(type,payload){
 (listeners[type]||[]).forEach(function(fn){
  try{
   fn(payload);
  }catch(e){
   console.error(e);
  }
 });
}

function safeArgs(args){
 try{
  return JSON.parse(
   JSON.stringify(args||{})
  );
 }catch(e){
  return {};
 }
}

function normalizeRoute(record){
 if(!record||typeof record!=='object'){
  return null;
 }

 const name=String(record.name||'').trim();

 if(!name){
  return null;
 }

 return {
  name:name,
  args:safeArgs(record.args)
 };
}

function sameRoute(a,b){
 if(!a||!b){
  return false;
 }

 if(a.name!==b.name){
  return false;
 }

 try{
  return JSON.stringify(a.args||{})===
   JSON.stringify(b.args||{});
 }catch(e){
  return false;
 }
}

function loadStoredRoute(){
 try{
  return normalizeRoute(
   JSON.parse(
    sessionStorage.getItem(CURRENT_ROUTE_KEY)||'null'
   )
  );
 }catch(e){
  return null;
 }
}

function saveStoredRoute(record){
 const normalized=normalizeRoute(record);

 if(!normalized){
  return;
 }

 try{
  sessionStorage.setItem(
   CURRENT_ROUTE_KEY,
   JSON.stringify(normalized)
  );
 }catch(e){}
}

function loadStack(){
 try{
  const parsed=JSON.parse(
   sessionStorage.getItem(ROUTE_STACK_KEY)||'[]'
  );

  if(!Array.isArray(parsed)){
   return [];
  }

  return parsed
   .map(normalizeRoute)
   .filter(Boolean);
 }catch(e){
  return [];
 }
}

function saveStack(stack){
 try{
  sessionStorage.setItem(
   ROUTE_STACK_KEY,
   JSON.stringify(stack||[])
  );
 }catch(e){}
}

function pushHistory(record){
 const normalized=normalizeRoute(record);

 if(!normalized){
  return;
 }

 const stack=loadStack();
 const last=stack[stack.length-1];

 if(last&&sameRoute(last,normalized)){
  return;
 }

 stack.push(normalized);

 /*
  * Verhindert unbegrenzt wachsenden Verlauf.
  */
 if(stack.length>60){
  stack.splice(0,stack.length-60);
 }

 saveStack(stack);
}

function popHistory(){
 const stack=loadStack();

 while(stack.length){
  const record=normalizeRoute(stack.pop());

  saveStack(stack);

  if(record){
   return record;
  }
 }

 saveStack([]);
 return null;
}

function clearHistory(){
 saveStack([]);
}

function routeLabel(name){
 const labels={
  dashboard:'Startseite',
  smartDashboard:'Smart Dashboard',
  animals:'Bestand',
  offspring:'Nachzuchten',
  profile:'Tierprofil',
  food:'Futterbestand',
  qr:'QR / Tierpass',
  backup:'Backup',
  assistant:'Schnelleingabe',
  chat:'TerraControl KI',
  settings:'Einstellungen',
  account:'Konto',
  analytics:'Analytics',
  releaseTest:'Release-Test'
 };

 return labels[name]||'Zurück';
}

function shouldShowBack(name){
 return name!=='dashboard'&&
  name!=='smartDashboard';
}

function appTop(name){
 if(
  name==='dashboard'||
  name==='smartDashboard'
 ){
  return '';
 }

 return `
  <header class="tc2AppTop tc2ModuleTop">
   <button
    type="button"
    class="tc2Menu"
    onclick="NGT500.openMenu()"
    aria-label="Menü öffnen"
   >
    ☰
   </button>

   <div class="tc2HeadTitle">
    <h1>${esc(routeLabel(name))}</h1>
    <p>TerraControl · TC2</p>
   </div>

   <div class="tc2Sync">
    <span>●</span>
    <b>TC2</b>
    <small>Bereich</small>
   </div>

   <div class="tc2Avatar">
    TC
   </div>
  </header>
 `;
}

function backBar(name){
 if(!shouldShowBack(name)){
  return '';
 }

 return `
  <nav class="tc2GlobalBackBar">
   <button
    type="button"
    class="tc2GlobalBackButton"
    onclick="NGT500.back()"
    aria-label="Zur vorherigen Seite"
   >
    <span>‹</span>
    <b>Zurück</b>
   </button>

   <small>${esc(routeLabel(name))}</small>
  </nav>
 `;
}

function renderRoute(record,options){
 const normalized=normalizeRoute(record);

 if(!normalized){
  return false;
 }

 const opts=options||{};
 const mod=modules[normalized.name];

 if(!mod||typeof mod.render!=='function'){
  pendingRoute={
   record:normalized,
   options:opts
  };

  emit(
   'route-missing',
   {
    name:normalized.name,
    args:normalized.args,
    options:opts
   }
  );

  return false;
 }

 const previous=currentRoute
  ?normalizeRoute(currentRoute)
  :null;

 if(
  previous&&
  !sameRoute(previous,normalized)&&
  !opts.replace&&
  !opts.noHistory&&
  !isGoingBack
 ){
  pushHistory(previous);
 }

 currentRoute=normalized;
 pendingRoute=null;

 saveStoredRoute(normalized);

 document
  .querySelectorAll('.drawer button')
  .forEach(function(button){
   button.classList.remove('ok');
  });

 const app=$('app');

 if(!app){
  return false;
 }

 let html='';

 try{
  html=mod.render(normalized.args||{})||'';
 }catch(e){
  console.error(
   'Route konnte nicht gerendert werden:',
   normalized.name,
   e
  );

  html=`
   <section class="tc2RouteError">
    <h2>Ansicht konnte nicht geladen werden</h2>
    <p>${esc(e&&e.message?e.message:String(e))}</p>
    <button onclick="NGT500.route('dashboard')">
     Zur Startseite
    </button>
   </section>
  `;
 }

 app.innerHTML=
  appTop(normalized.name)+
  backBar(normalized.name)+
  html;

 if(typeof mod.afterRender==='function'){
  try{
   mod.afterRender(normalized.args||{});
  }catch(e){
   console.error(
    'afterRender fehlgeschlagen:',
    normalized.name,
    e
   );
  }
 }

 closeMenu();

 emit(
  'route',
  {
   name:normalized.name,
   args:normalized.args
  }
 );

 window.scrollTo({
  top:0,
  left:0,
  behavior:'auto'
 });

 return true;
}

function register(name,mod){
 modules[name]=mod;

 if(
  pendingRoute&&
  pendingRoute.record&&
  pendingRoute.record.name===name
 ){
  const waiting=pendingRoute;

  pendingRoute=null;

  setTimeout(function(){
   renderRoute(
    waiting.record,
    Object.assign(
     {},
     waiting.options||{},
     {
      replace:true,
      noHistory:true
     }
    )
   );
  },0);
 }
}

function route(name,args,options){
 return renderRoute(
  {
   name:name,
   args:args||{}
  },
  options||{}
 );
}

function back(){
 const previous=popHistory();

 if(!previous){
  route(
   'dashboard',
   {},
   {
    replace:true,
    noHistory:true
   }
  );
  return;
 }

 isGoingBack=true;

 const rendered=renderRoute(
  previous,
  {
   replace:true,
   noHistory:true
  }
 );

 isGoingBack=false;

 if(!rendered){
  /*
   * Bei dynamisch geladenen Modulen wird die Route
   * nach dem Laden durch register() fortgesetzt.
   */
  pendingRoute={
   record:previous,
   options:{
    replace:true,
    noHistory:true
   }
  };
 }
}

function restoreRoute(){
 const stored=loadStoredRoute();

 if(!stored){
  return false;
 }

 /*
  * Beim Neuladen darf die wiederhergestellte Route
  * nicht erneut in den Verlauf geschrieben werden.
  */
 renderRoute(
  stored,
  {
   replace:true,
   noHistory:true
  }
 );

 return true;
}

function resetNavigation(){
 currentRoute=null;
 pendingRoute=null;

 try{
  sessionStorage.removeItem(CURRENT_ROUTE_KEY);
  sessionStorage.removeItem(ROUTE_STACK_KEY);
 }catch(e){}
}

function current(){
 return currentRoute
  ?normalizeRoute(currentRoute)
  :null;
}

function modal(html,options){
 options=options||{};

 const root=$('modalRoot');

 if(!root){
  return;
 }

 if(root.innerHTML){
  closeModal(false);
 }

 modalPreviousFocus=document.activeElement;
 modalResolve=
  typeof options.resolve==='function'
   ?options.resolve
   :null;

 root.innerHTML=
  '<div class="modal tc2ModalBackdrop">'+
   '<section '+
    'class="modalBox tc2ModalBox '+
     esc(options.className||'')+'" '+
    'role="dialog" '+
    'aria-modal="true" '+
    'aria-label="'+esc(options.label||'Dialog')+'" '+
    'tabindex="-1"'+
   '>'+
    (
     options.showClose===false
      ?''
      :'<button '+
        'class="tc2ModalClose" '+
        'type="button" '+
        'aria-label="Dialog schließen" '+
        'onclick="NGT500.closeModal(false)"'+
       '>×</button>'
    )+
    html+
   '</section>'+
  '</div>';

 document.body.classList.add('tc2ModalOpen');

 const backdrop=root.querySelector('.tc2ModalBackdrop');
 const dialog=root.querySelector('.tc2ModalBox');

 if(backdrop&&options.dismissible!==false){
  backdrop.addEventListener(
   'click',
   function(event){
    if(event.target===backdrop){
     closeModal(false);
    }
   }
  );
 }

 modalKeyHandler=function(event){
  if(event.key==='Escape'&&options.dismissible!==false){
   event.preventDefault();
   closeModal(false);
  }

  if(event.key==='Tab'&&dialog){
   const focusable=Array.from(
    dialog.querySelectorAll(
     'button:not([disabled]),'+
     'input:not([disabled]),'+
     'select:not([disabled]),'+
     'textarea:not([disabled]),'+
     'a[href],'+
     '[tabindex]:not([tabindex="-1"])'
    )
   ).filter(function(element){
    return element.offsetParent!==null;
   });

   if(!focusable.length){
    event.preventDefault();
    dialog.focus();
    return;
   }

   const first=focusable[0];
   const last=focusable[focusable.length-1];

   if(event.shiftKey&&document.activeElement===first){
    event.preventDefault();
    last.focus();
   }else if(!event.shiftKey&&document.activeElement===last){
    event.preventDefault();
    first.focus();
   }
  }
 };

 document.addEventListener('keydown',modalKeyHandler);

 requestAnimationFrame(function(){
  const initial=root.querySelector(
   '.tc2ModalInitial,'+
   'button:not([disabled]),'+
   'input:not([disabled]),'+
   'select:not([disabled]),'+
   'textarea:not([disabled]),'+
   'a[href]'
  );

  (initial||dialog)?.focus();
 });
}

function closeModal(result){
 const root=$('modalRoot');

 if(root){
  root.innerHTML='';
 }

 document.body.classList.remove('tc2ModalOpen');

 if(modalKeyHandler){
  document.removeEventListener('keydown',modalKeyHandler);
  modalKeyHandler=null;
 }

 const resolve=modalResolve;
 modalResolve=null;

 if(resolve){
  resolve(result===true);
 }

 const previous=modalPreviousFocus;
 modalPreviousFocus=null;

 if(previous&&typeof previous.focus==='function'){
  requestAnimationFrame(function(){
   if(document.contains(previous)){
    previous.focus();
   }
  });
 }
}

function confirmAction(message,options){
 options=options||{};

 return new Promise(function(resolve){
  modal(
   '<div class="tc2Dialog '+esc(options.type||'warn')+'">'+
    '<div class="tc2DialogIcon" aria-hidden="true">'+
     esc(options.icon||'!')+
    '</div>'+
    '<div class="tc2DialogCopy">'+
     '<h2>'+esc(options.title||'Bitte bestätigen')+'</h2>'+
     '<p>'+esc(message).replace(/\n/g,'<br>')+'</p>'+
    '</div>'+
    '<div class="tc2DialogActions">'+
     '<button '+
      'class="tc2DialogCancel tc2ModalInitial" '+
      'type="button" '+
      'onclick="NGT500.closeModal(false)"'+
     '>'+esc(options.cancelText||'Abbrechen')+'</button>'+
     '<button '+
      'class="tc2DialogConfirm '+
       (options.danger?'danger':'')+'" '+
      'type="button" '+
      'onclick="NGT500.closeModal(true)"'+
     '>'+esc(options.confirmText||'Bestätigen')+'</button>'+
    '</div>'+
   '</div>',
   {
    label:options.title||'Bitte bestätigen',
    showClose:false,
    dismissible:true,
    className:'tc2ConfirmDialog',
    resolve:resolve
   }
  );
 });
}

function notice(message,options){
 options=options||{};

 return new Promise(function(resolve){
  modal(
   '<div class="tc2Dialog '+esc(options.type||'ok')+'">'+
    '<div class="tc2DialogIcon" aria-hidden="true">'+
     esc(options.icon||(options.type==='danger'?'!':'✓'))+
    '</div>'+
    '<div class="tc2DialogCopy">'+
     '<h2>'+esc(options.title||'TerraControl')+'</h2>'+
     '<p>'+esc(message).replace(/\n/g,'<br>')+'</p>'+
    '</div>'+
    '<div class="tc2DialogActions single">'+
     '<button '+
      'class="tc2DialogConfirm tc2ModalInitial" '+
      'type="button" '+
      'onclick="NGT500.closeModal(true)"'+
     '>'+esc(options.confirmText||'OK')+'</button>'+
    '</div>'+
   '</div>',
   {
    label:options.title||'TerraControl',
    showClose:false,
    dismissible:false,
    className:'tc2NoticeDialog',
    resolve:resolve
   }
  );
 });
}

function openMenu(){
 $('drawer').classList.add('open');
 $('overlay').classList.add('show');
}

function closeMenu(){
 $('drawer').classList.remove('open');
 $('overlay').classList.remove('show');
}

function toast(msg,type){
 type=type||'ok';

 let root=document.getElementById('toastRoot');

 if(!root){
  root=document.createElement('div');
  root.id='toastRoot';
  root.className='tc2ToastRoot';
  root.setAttribute('aria-live','polite');
  root.setAttribute('aria-atomic','true');

  document.body.appendChild(root);
 }

 const el=document.createElement('div');

 el.className='tcToast '+type;
 el.setAttribute(
  'role',
  type==='danger'?'alert':'status'
 );

 el.textContent=msg;
 root.appendChild(el);

 requestAnimationFrame(function(){
  el.classList.add('show');
 });

 setTimeout(function(){
  el.classList.remove('show');

  setTimeout(function(){
   el.remove();
  },260);
 },3200);
}

window.NGT500={
 modules:modules,
 register:register,
 route:route,
 back:back,
 restoreRoute:restoreRoute,
 resetNavigation:resetNavigation,
 clearHistory:clearHistory,
 current:current,
 on:on,
 emit:emit,
 $:$,
 esc:esc,
 uid:uid,
 today:today,
 money:money,
 modal:modal,
 closeModal:closeModal,
 confirmAction:confirmAction,
 notice:notice,
 openMenu:openMenu,
 closeMenu:closeMenu,
 toast:toast
};

})();
