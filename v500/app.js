(function(){
'use strict';

const V='1.0.4-navigation-v1';

function loadScriptOnce(
 moduleName,
 path,
 routeName,
 args,
 options
){
 if(NGT500.modules[moduleName]){
  NGT500.route(
   routeName,
   args||{},
   options||{}
  );

  return;
 }

 const existing=document.querySelector(
  'script[data-tc-module="'+moduleName+'"]'
 );

 if(existing){
  existing.addEventListener(
   'load',
   function(){
    NGT500.route(
     routeName,
     args||{},
     options||{}
    );
   },
   {
    once:true
   }
  );

  return;
 }

 const s=document.createElement('script');

 s.src=path+'?v='+V;
 s.dataset.tcModule=moduleName;

 s.onload=function(){
  NGT500.route(
   routeName,
   args||{},
   options||{}
  );
 };

 s.onerror=function(){
  console.error(
   'Modul konnte nicht geladen werden:',
   moduleName,
   path
  );

  if(NGT500.toast){
   NGT500.toast(
    'Ansicht konnte nicht geladen werden.',
    'danger'
   );
  }
 };

 document.head.appendChild(s);
}

function loadAnalytics(args,options){
 loadScriptOnce(
  'analytics',
  './v500/modules/analytics.js',
  'analytics',
  args,
  options
 );
}

function loadSettings(args,options){
 loadScriptOnce(
  'settings',
  './v500/modules/settings.js',
  'settings',
  args,
  options
 );
}

function loadReleaseTest(args,options){
 loadScriptOnce(
  'releaseTest',
  './v500/modules/release-test.js',
  'releaseTest',
  args,
  options
 );
}

function loadAccount(args,options){
 loadScriptOnce(
  'account',
  './v500/modules/account.js',
  'account',
  args,
  options
 );
}

function openMissingRoute(event){
 if(!event||!event.name){
  return;
 }

 const options=Object.assign(
  {},
  event.options||{},
  {
   replace:true,
   noHistory:true
  }
 );

 switch(event.name){
  case 'analytics':
   loadAnalytics(event.args,options);
   break;

  case 'settings':
   loadSettings(event.args,options);
   break;

  case 'releaseTest':
   loadReleaseTest(event.args,options);
   break;

  case 'account':
   loadAccount(event.args,options);
   break;

  default:
   /*
    * Unbekannte oder entfernte Route:
    * sicher auf die Startseite zurückfallen.
    */
   NGT500.route(
    'dashboard',
    {},
    {
     replace:true,
     noHistory:true
    }
   );
 }
}

function navButton(icon,label,action,group){
 return `
  <button
   class="tc2DrawerItem ${group||''}"
   onclick="${action}"
  >
   <span>${icon}</span>
   <b>${label}</b>
  </button>
 `;
}

function navGroup(title,items){
 return `
  <div class="tc2DrawerGroup">
   <div class="tc2DrawerGroupTitle">
    ${title}
   </div>

   ${items.join('')}
  </div>
 `;
}

function dynamicAnimalNav(){
 try{
  const map=NGTStore.animalsByGroup
   ?NGTStore.animalsByGroup()
   :{};

  const groups=Object.keys(map).sort();

  if(!groups.length){
   return [
    navButton(
     '＋',
     'Tier anlegen',
     "NGTDashboard.manualAnimal()"
    )
   ];
  }

  return groups.map(function(group){
   const safeGroup=String(group)
    .replace(/\\/g,'\\\\')
    .replace(/'/g,"\\'");

   return navButton(
    '●●●',
    group,
    "NGT500.route('animals',{group:'"+
     safeGroup+
    "'})"
   );
  });

 }catch(e){
  return [
   navButton(
    '●●●',
    'Bestand',
    "NGT500.route('dashboard')"
   )
  ];
 }
}

function nav(){
 const d=document.getElementById('drawer');

 if(!d){
  return;
 }

 d.innerHTML=`
  <div class="tc2DrawerHead">
   <div class="tc2DrawerLogo">TC</div>

   <div>
    <h2>TerraControl</h2>
    <p>Version 1.0.4 RC11</p>
   </div>
  </div>

  ${navGroup(
   'Start',
   [
    navButton(
     '🏠',
     'Startseite',
     "NGT500.route('dashboard')"
    ),
    navButton(
     '▥',
     'Smart Dashboard',
     "NGT500.route('smartDashboard')"
    )
   ]
  )}

  ${navGroup(
   'Bestand',
   dynamicAnimalNav()
  )}

  ${navGroup(
   'Verwaltung',
   [
    navButton(
     '🥩',
     'Futterbestand',
     "NGT500.route('food')"
    ),
    navButton(
     '🏷️',
     'QR / Tierpass',
     "NGT500.route('qr')"
    ),
    navButton(
     '💾',
     'Backup',
     "NGT500.route('backup')"
    )
   ]
  )}

  ${navGroup(
   'KI',
   [
    navButton(
     '💬',
     'TerraControl KI',
     "NGT500.route('chat')"
    ),
    navButton(
     '⚡',
     'Schnelleingabe',
     "NGT500.route('assistant')"
    )
   ]
  )}

  ${navGroup(
   'System',
   [
    navButton(
     '⚙️',
     'Einstellungen',
     "NGTApp.loadSettings()"
    ),
    navButton(
     '👤',
     'Konto',
     "NGTApp.loadAccount()"
    )
   ]
  )}
 `;
}

function init(){
 const menuButton=document.getElementById('menuBtn');
 const overlay=document.getElementById('overlay');

 if(menuButton){
  menuButton.onclick=NGT500.openMenu;
 }

 if(overlay){
  overlay.onclick=NGT500.closeMenu;
 }

 nav();

 /*
  * Wird eine gespeicherte dynamische Route gefunden,
  * lädt app.js das benötigte Modul nach.
  */
 NGT500.on(
  'route-missing',
  openMissingRoute
 );

 /*
  * Die vorherige Ansicht wiederherstellen.
  * Nur beim allerersten Start geht es zum Dashboard.
  */
 const restored=NGT500.restoreRoute();

 if(!restored){
  NGT500.route(
   'dashboard',
   {},
   {
    replace:true,
    noHistory:true
   }
  );
 }
}

window.NGTApp={
 loadAnalytics:loadAnalytics,
 loadSettings:loadSettings,
 loadReleaseTest:loadReleaseTest,
 loadAccount:loadAccount
};

document.readyState==='loading'
 ?document.addEventListener(
   'DOMContentLoaded',
   init
  )
 :init();

})();
