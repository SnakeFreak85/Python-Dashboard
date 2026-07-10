(function(){
'use strict';

const modules={};
const listeners={};

const CURRENT_ROUTE_KEY='terracontrol_current_route_v1';
const ROUTE_STACK_KEY='terracontrol_route_stack_v1';

let currentRoute=null;
let pendingRoute=null;
let isGoingBack=false;

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

function modal(html){
 $('modalRoot').innerHTML=
  '<div class="modal">'+
   '<div class="modalBox">'+
    html+
   '</div>'+
  '</div>';
}

function closeModal(){
 $('modalRoot').innerHTML='';
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
  root.style.cssText=
   'position:fixed;'+
   'left:16px;'+
   'right:16px;'+
   'bottom:18px;'+
   'z-index:9999;'+
   'display:grid;'+
   'gap:8px;'+
   'pointer-events:none';

  document.body.appendChild(root);
 }

 const el=document.createElement('div');

 el.className='tcToast '+type;

 el.style.cssText=
  'pointer-events:auto;'+
  'margin:auto;'+
  'max-width:520px;'+
  'background:#172331;'+
  'color:#fff;'+
  'border-radius:16px;'+
  'padding:12px 14px;'+
  'box-shadow:0 12px 35px rgba(0,0,0,.28);'+
  'font-weight:700;'+
  'opacity:0;'+
  'transform:translateY(12px);'+
  'transition:.22s ease';

 if(type==='danger'){
  el.style.background='#7f1d1d';
 }

 if(type==='warn'){
  el.style.background='#7c4a03';
 }

 el.textContent=msg;
 root.appendChild(el);

 requestAnimationFrame(function(){
  el.style.opacity='1';
  el.style.transform='translateY(0)';
 });

 setTimeout(function(){
  el.style.opacity='0';
  el.style.transform='translateY(12px)';

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
 openMenu:openMenu,
 closeMenu:closeMenu,
 toast:toast
};

})();