(function(){
'use strict';
function render(){return `<div class="card"><h2>🤖 KI Assistent</h2><p class="muted">V500-Modulbasis. Die intelligente Eingabe wird hier schrittweise direkt integriert.</p><textarea id="aiText" placeholder="Medusa gefressen\nMedusa gehäutet\nMedusa 2450g\n200g Ratte +10"></textarea><button onclick="NGTAssistant.run()">Befehl ausführen</button><div id="aiOut"></div><a class="btn" href="./ki-assistent.html?v=1.0.36">Alten Assistenten öffnen</a></div>`}
function run(){document.getElementById('aiOut').innerHTML='<div class="subcard ok">KI-Modul ist bereit. Die Parser-Funktionen werden im nächsten Schritt aus V400 übernommen.</div>'}
window.NGTAssistant={run};NGT500.register('assistant',{render});
})();
