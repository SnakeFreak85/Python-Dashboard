(function(){
'use strict';
function loadAnalytics(){
 if(NGT500.modules.analytics){NGT500.route('analytics');return;}
 const s=document.createElement('script');
 s.src='./v500/modules/analytics.js?v=1.0';
 s.onload=function(){NGT500.route('analytics')};
 document.head.appendChild(s);
}
function loadSettings(){
 if(NGT500.modules.settings){NGT500.route('settings');return;}
 const s=document.createElement('script');
 s.src='./v500/modules/settings.js?v=1.0';
 s.onload=function(){NGT500.route('settings')};
 document.head.appendChild(s);
}
function nav(){
 const d=document.getElementById('drawer');
 d.innerHTML='<button onclick="NGT500.route(\'dashboard\')">Startseite</button><button onclick="NGT500.route(\'chat\')">TerraControl KI</button><button onclick="NGT500.route(\'assistant\')">Schnelleingabe</button><button onclick="NGT500.route(\'animals\',{t:\'koenig\'})">Königspythons</button><button onclick="NGT500.route(\'animals\',{t:\'boas\'})">Boas</button><button onclick="NGT500.route(\'animals\',{t:\'geckos\'})">Leopardgeckos</button><button onclick="NGT500.route(\'animals\',{t:\'spinnen\'})">Vogelspinnen</button><button onclick="NGT500.route(\'food\')">Futterbestand</button><button onclick="NGT500.route(\'qr\')">QR/Tierpass</button><button onclick="NGTApp.loadAnalytics()">Analyse</button><button onclick="NGT500.route(\'backup\')">Backup</button><button onclick="NGTApp.loadSettings()">Einstellungen</button>';
}
function init(){
 document.getElementById('menuBtn').onclick=NGT500.openMenu;
 document.getElementById('overlay').onclick=NGT500.closeMenu;
 nav();
 NGT500.route('dashboard');
}
window.NGTApp={loadAnalytics,loadSettings};
document.readyState==='loading'?document.addEventListener('DOMContentLoaded',init):init();
})();