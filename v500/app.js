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

function dynamicAnimalNav(){
 try{
  const map=NGTStore.animalsByGroup?NGTStore.animalsByGroup():{};
  const groups=Object.keys(map).sort();

  if(!groups.length){
   return [
    navButton('＋','Tier anlegen',"NGTDashboard.manualAnimal()")
   ];
  }

  return groups.map(function(g){
   return navButton('●●●',g,"NGT500.route('animals',{group:'"+g.replace(/'/g,"\\'")+"'})");
  });
 }catch(e){
  return [
   navButton('●●●','Bestand',"NGT500.route('dashboard')")
  ];
 }
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

  ${navGroup('Bestand',dynamicAnimalNav())}

  ${navGroup('Verwaltung',[
   navButton('🥩','Futterbestand',"NGT500.route('food')"),
   navButton('🏷️','QR / Tierpass',"NGT500.route('qr')"),
   navButton('💾','Backup',"NGT500.route('backup')")
  ])}

  ${navGroup('KI',[
   navButton('💬','TerraControl KI',"NGT500.route('chat')"),
   navButton('⚡','Schnelleingabe',"NGT500.route('assistant')")
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