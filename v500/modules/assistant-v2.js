(function(){
'use strict';

function esc(v){return NGT500.esc(v||'')}

function commandHelp(){
 return `<div class="tc2HelpDialog">
   <h2>TerraControl KI · Mögliche Befehle</h2>

  <div class="tc2SubCard">
    <h3>Schnelle Einträge</h3>
    <div class="tc2ExampleList">
     <span>Medusa hat heute eine 200g Ratte gefressen</span>
     <span>Apollo hat gestern verweigert</span>
     <span>Medusa wiegt jetzt 2536 Gramm</span>
     <span>Medusa hat sich gehäutet</span>
    </div>
   </div>

  <div class="tc2SubCard">
    <h3>Futterbestand</h3>
    <div class="tc2ExampleList">
     <span>Ich habe 25 Ratten 120g gekauft</span>
     <span>Bestand Ratte 70g auf 10 setzen</span>
    </div>
   </div>

  <div class="tc2SubCard">
    <h3>Fragen</h3>
    <div class="tc2ExampleList">
     <span>Wie geht es Medusa?</span>
     <span>Welche Tiere müssen gefüttert werden?</span>
     <span>Welche Tiere müssen gewogen werden?</span>
     <span>Welche Empfehlungen gibt es?</span>
    </div>
   </div>

   <button class="tc2ModalInitial" onclick="NGTAssistant.closeHelp()">Schließen</button>
 </div>`;
}

function render(){
 return `<div class="tc2PageCard tc2AssistantPage">
  <div class="tc2PageHead">
   <div>
    <h2>⚡ Schnelleingabe</h2>
    <p class="muted">Fütterungen, Gewichte, Häutungen, Futterbestand und Tierfragen per Text erfassen.</p>
   </div>
  </div>

  <div class="tc2AssistantHero">
   <div class="tc2AssistantIcon">🤖</div>
   <div>
    <h3>TerraControl KI</h3>
    <p>Schreibe natürlich, was passiert ist. TerraControl erkennt Tier, Datum, Futter, Gewicht oder Bestand.</p>
   </div>
  </div>

  <div class="tc2AssistantChips">
   <button onclick="NGTAssistant.showHelp()">Mögliche Befehle</button>
   <button onclick="NGTAssistant.today()">Heute</button>
   <button onclick="NGTAssistant.clearContext()">Kontext löschen</button>
  </div>

 <div class="tc2FormCard">
   <h3>Eingabe</h3>
   <textarea id="aiText" placeholder="Beispiel: Medusa hat heute Frost Ratte 200 g gefressen..."></textarea>
   <div class="tc2AssistantActions">
    <button onclick="NGTAssistant.preview()">Analysieren</button>
    <button onclick="NGTAssistant.run()">Ausführen</button>
   </div>
  </div>

  <div id="aiHelp"></div>
  <div id="aiOut" class="tc2AssistantOutput"></div>
 </div>`;
}

function html(s){return esc(s)}
function show(s){document.getElementById('aiOut').innerHTML=s}
function showHelp(){
 NGT500.modal(
  commandHelp(),
  {
   label:'Mögliche Befehle der Schnelleingabe',
   className:'tc2HelpModal'
  }
 );
}

function closeHelp(){
 NGT500.closeModal(false);
}

function applyParsed(p){
 return NGTAIActions.applyParsed(
  p,
  {
   source:'assistant',
   contextText:'Kontext: '
  }
 );
}

function rawText(){return document.getElementById('aiText').value}
function parsed(){return (window.NGTAIContext?NGTAIContext.parse:NGTAIEngine.parse)(rawText())}

function recommendationAnswer(){
 const q=NGTAIEngine.norm(rawText());
 if(!window.NGTAIRecommendations)return null;
 if(/empfehl|kritisch|warnung|hinweis|problem|auffaellig|auffällig/.test(q)){
  return '<div class="tc2SubCard ok"><b>Empfehlungen</b></div>'+NGTAIRecommendations.render(NGTAIRecommendations.build());
 }
 return null;
}

function managerQuestion(){
 const q=NGTAIEngine.norm(rawText());
 if(!window.NGTAIManager)return null;
 if(/heute|tagesuebersicht|tagesübersicht|manager/.test(q)&&/was|zeige|übersicht|uebersicht|steht|an/.test(q)){
  return '<div class="tc2SubCard ok"><b>Heute</b></div>'+NGTAIManager.renderToday();
 }
 const hit=NGTAIEngine.findAnimal(rawText());
 if(hit&&/(wie geht|status|zusammenfassung|ueberblick|überblick)/.test(q)){
  return '<div class="tc2SubCard ok"><b>Tier-Zusammenfassung</b><br>'+html(NGTAIManager.animalSummary(hit.a)).replace(/\n/g,'<br>')+'</div>';
 }
 return null;
}

function answer(){
 const m=managerQuestion();
 if(m)return m;
 const r=recommendationAnswer();
 if(r)return r;
 const a=window.NGTAIQuery?NGTAIQuery.query(rawText()):null;
 return a?NGTAIQuery.renderAnswer(a):null;
}

function preview(){
 const ans=answer();
 if(ans){show(ans);return;}

 const ps=parsed();
 const ctx=window.NGTAIContext?NGTAIContext.get():{};

 show(`<div class="tc2SubCard">
   <h3>Analyse</h3>
   <p class="muted">Aktueller Kontext: ${html(ctx.lastAnimal||'-')}</p>
  </div>`+
 ps.map(p=>`<div class="tc2SubCard">
   <h3>${html(p.intent)}</h3>
   <div class="tc2InfoRows">
    <div><b>Text</b><span>${html(p.raw)}</span></div>
    <div><b>Tier</b><span>${p.animal?html(p.animal.a.name):'nicht erkannt'}</span></div>
    <div><b>Datum</b><span>${html(p.date||'-')}</span></div>
    <div><b>Futter</b><span>${html(p.feeder||'-')}</span></div>
    <div><b>Gewicht</b><span>${html(p.grams||'-')}</span></div>
    <div><b>Bestand</b><span>${p.stock?html(p.stock.mode+' '+p.stock.qty):'-'}</span></div>
   </div>
  </div>`).join('')
 );
}

function run(){
 const ans=answer();
 if(ans){show(ans);return;}

 const ps=parsed();
 const ok=[];
 const err=[];

 ps.forEach(p=>{
  const r=applyParsed(p);
  if(r&&r.text)ok.push(r.text);
  else err.push('Nicht gespeichert: '+p.raw);
 });

 show(
  (ok.length?`<div class="tc2SubCard ok">✅ ${ok.length} Eintrag/Einträge gespeichert.</div>`:'')+
  ok.map(x=>`<div class="tc2SubCard">${html(x)}</div>`).join('')+
  err.map(x=>`<div class="tc2SubCard danger">❌ ${html(x)}</div>`).join('')
 );
}

function today(){
 show(window.NGTAIManager?'<div class="tc2SubCard ok"><b>Heute</b></div>'+NGTAIManager.renderToday():'<p>KI-Manager nicht geladen.</p>');
}

function clearContext(){
 if(window.NGTAIContext)NGTAIContext.clear();
 show('<div class="tc2SubCard ok">Kontext gelöscht.</div>');
}

window.NGTAssistant={preview,run,today,clearContext,showHelp,closeHelp};
NGT500.register('assistant',{render});

})();
