(function(){
'use strict';
function loadAnalytics(){
 if(NGT500.modules.analytics){NGT500.route('analytics');return;}
 const s=document.createElement('script');
 s.src='./v500/modules/analytics.js?v=500.1';
 s.onload=function(){NGT500.route('analytics')};
 document.head.appendChild(s);
}
function nav(){
 const d=document.getElementById('drawer');
 d.innerHTML=`<button onclick="NGT500.route('dashboard')">🏠 Startseite</button><button onclick="NGT500.route('animals',{t:'koenig'})">🐍 Königspythons</button><button onclick="NGT500.route('animals',{t:'boas'})">🐍 Boas</button><button onclick="NGT500.route('animals',{t:'geckos'})">🦎 Leopardgeckos</button><button onclick="NGT500.route('animals',{t:'spinnen'})">🕷 Vogelspinnen</button><button onclick="NGT500.route('food')">🥩 Futter</button><button onclick="NGT500.route('qr')">📷 QR-System</button><button onclick="NGT500.route('assistant')">🤖 KI Assistent</button><button onclick="NGTApp.loadAnalytics()">📊 Analyse</button><button onclick="NGT500.route('backup')">💾 Backup</button><a href="./index.html">↩️ V400 öffnen</a>`;
}
function init(){
 document.getElementById('menuBtn').onclick=NGT500.openMenu;
 document.getElementById('overlay').onclick=NGT500.closeMenu;
 nav();
 NGT500.route('dashboard');
}
window.NGTApp={loadAnalytics};
document.readyState==='loading'?document.addEventListener('DOMContentLoaded',init):init();
})();
