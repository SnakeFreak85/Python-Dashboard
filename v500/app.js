(function(){
'use strict';

const V='1.0.4-syncfix';

function loadScriptOnce(moduleName,path,routeName){
 if(NGT500.modules[moduleName]){
  NGT500.route(routeName);
  return;
 }

 const s=document.createElement('script');
 s.src=path+'?v='+V;
 s.onload=function(){
  NGT500.route(routeName);
 };
 document.head.appendChild(s);
}

function loadAnalytics(){
 loadScriptOnce('analytics','./v500/modules/analytics.js','analytics');
}

function loadSettings(){
 loadScriptOnce('settings','./v500/modules/settings.js','settings');
}

function loadReleaseTest(){
 loadScriptOnce('releaseTest','./v500/modules/release-test.js','releaseTest');
}

function loadAccount(){
 loadScriptOnce('account','./v500/modules/account.js','account');
}

function navButton(icon,label,action,group){
 return `<button class="tc2DrawerItem ${group||''}" onclick="${action}">
  <span>${icon}</span>
  <b>${label}</b>
 </button>`;
}

function navGroup(title,items){
 return `<div class="tc2DrawerGroup">
  <div class="tc2DrawerGroupTitle">${title}</div>
  ${items.join('')}
 </div>`;
}

function nav(){
 const d=document.getElementById('drawer');

 d.innerHTML=`<div class="tc2DrawerHead">
   <div class="tc2DrawerLogo">TC</div>
   <div>
    <h2>TerraControl</h2>
    <p>Version 1.0.4 RC11</p>
   </div>
  </div>

  ${navGroup('Start',[
   navButton('🏠','Startseite',"NGT500.route('dashboard')"),
   navButton('▥','Smart Dashboard',"NGT500.route('smartDashboard')")
  ])}

  ${navGroup('Tiere',[
   navButton('🐍','Königspythons',"NGT500.route('animals',{t:'koenig'})"),
   navButton('🐍','Boas',"NGT500.route('animals',{t:'boas'})"),
   navButton('🦎','Leopardgeckos',"NGT500.route('animals',{t:'geckos'})"),
   navButton('🕷','Vogelspinnen',"NGT500.route('animals',{t:'spinnen'})")
  ])}

  ${navGroup('Verwaltung',[
   navButton('🥩','Futterbestand',"NGT500.route('food')"),
   navButton('🏷️','QR / Tierpass',"NGT500.route('qr')"),
   navButton('💾','Backup',"NGT500.route('backup')")
  ])}

  ${navGroup('KI & Analyse',[
   navButton('💬','TerraControl KI',"NGT500.route('chat')"),
   navButton('⚡','Schnelleingabe',"NGT500.route('assistant')"),
   navButton('📊','Analyse',"NGTApp.loadAnalytics()")
  ])}

  ${navGroup('System',[
   navButton('⚙️','Einstellungen',"NGTApp.loadSettings()"),
   navButton('👤','Konto',"NGTApp.loadAccount()")
  ])}
 `;
}

function init(){
 document.getElementById('menuBtn').onclick=NGT500.openMenu;
 document.getElementById('overlay').onclick=NGT500.closeMenu;
 nav();
 NGT500.route('dashboard');
}

window.NGTApp={loadAnalytics,loadSettings,loadReleaseTest,loadAccount};

document.readyState==='loading'
 ? document.addEventListener('DOMContentLoaded',init)
 : init();

})();