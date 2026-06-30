(function(){
'use strict';
function nav(){const d=document.getElementById('drawer');d.innerHTML=`<button onclick="NGT500.route('dashboard')">🏠 Startseite</button><button onclick="NGT500.route('animals',{t:'koenig'})">🐍 Königspythons</button><button onclick="NGT500.route('animals',{t:'boas'})">🐍 Boas</button><button onclick="NGT500.route('animals',{t:'geckos'})">🦎 Leopardgeckos</button><button onclick="NGT500.route('animals',{t:'spinnen'})">🕷 Vogelspinnen</button><button onclick="NGT500.route('food')">🥩 Futter</button><button onclick="NGT500.route('qr')">📷 QR-System</button><button onclick="NGT500.route('assistant')">🤖 KI Assistent</button><button onclick="NGT500.route('backup')">💾 Backup</button><a href="./index.html">↩️ V400 öffnen</a>`}
function init(){document.getElementById('menuBtn').onclick=NGT500.openMenu;document.getElementById('overlay').onclick=NGT500.closeMenu;nav();NGT500.route('dashboard')}
document.readyState==='loading'?document.addEventListener('DOMContentLoaded',init):init();
})();
