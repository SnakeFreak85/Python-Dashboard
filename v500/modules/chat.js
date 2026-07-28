(function(){
'use strict';

const KEY='ngt_ai_chat_v1';

function esc(s){return NGT500.esc(s||'')}

function load(){
 try{return JSON.parse(sessionStorage.getItem(KEY)||'[]')||[]}
 catch(e){return []}
}

function save(list){
 sessionStorage.setItem(KEY,JSON.stringify(list.slice(-80)));
}

function add(role,html){
 const list=load();
 list.push({role,html,ts:Date.now()});
 save(list);
}

function commandHelp(){
 return `<div class="tc2HelpDialog">
   <h2>TerraControl KI · Mögliche Befehle</h2>

   <div class="tc2SubCard">
    <h3>Tiere</h3>
    <div class="tc2ExampleList">
     <span>Wie geht es Medusa?</span>
     <span>Zeige Status von Luna</span>
     <span>Welche Tiere sind weiblich?</span>
    </div>
   </div>

   <div class="tc2SubCard">
    <h3>Fütterung</h3>
    <div class="tc2ExampleList">
     <span>Medusa hat heute gefressen</span>
     <span>Apollo hat gestern verweigert</span>
     <span>Welche Tiere müssen morgen gefüttert werden?</span>
    </div>
   </div>

   <div class="tc2SubCard">
    <h3>Gewicht</h3>
    <div class="tc2ExampleList">
     <span>Medusa wiegt 2536 Gramm</span>
     <span>Welche Tiere müssen gewogen werden?</span>
     <span>Welche Tiere haben abgenommen?</span>
    </div>
   </div>

   <div class="tc2SubCard">
    <h3>Häutung</h3>
    <div class="tc2ExampleList">
     <span>Medusa hat sich heute gehäutet</span>
     <span>Welche Tiere haben sich zuletzt gehäutet?</span>
    </div>
   </div>

   <div class="tc2SubCard">
    <h3>Futterbestand</h3>
    <div class="tc2ExampleList">
     <span>Ich habe 25 Ratten 120g gekauft</span>
     <span>Bestand Ratte 70g auf 10 setzen</span>
     <span>Was muss ich einkaufen?</span>
    </div>
   </div>

   <button class="tc2ModalInitial" onclick="NGTChat.closeHelp()">Schließen</button>
 </div>`;
}

function render(){
 const msgs=load();

 if(!msgs.length){
  add('ai','Hallo, ich bin deine TerraControl KI. Ich helfe dir beim Eintragen, Auswerten und Planen deiner Tierdaten.');
 }

 return `<div class="tc2PageCard tc2ChatPage">
  <div class="tc2PageHead">
   <div>
    <h2>💬 TerraControl KI</h2>
    <p class="muted">Dein intelligenter Terraristik-Assistent für Fragen, Auswertungen und schnelle Einträge.</p>
   </div>
  </div>

  <div class="tc2ChatHero">
   <div class="tc2ChatBot">🤖</div>
   <div>
    <h3>Frag TerraControl</h3>
    <p>Analysiere Bestand, Fütterungen, Gewicht, Häutungen, Futterbestand und offene Aufgaben.</p>
   </div>
  </div>

  <div class="tc2AssistantChips">
   <button onclick="NGTChat.showHelp()">Mögliche Befehle</button>
   <button onclick="NGTChat.ask('Welche Tiere müssen gefüttert werden?')">Fütterung</button>
   <button onclick="NGTChat.ask('Welche Tiere müssen gewogen werden?')">Gewicht</button>
   <button onclick="NGTChat.clear()">Chat löschen</button>
  </div>

  <div id="chatLog" class="tc2ChatLog">${messages()}</div>

  <div class="tc2ChatInput">
   <textarea id="chatText" placeholder="Nachricht oder Befehl eingeben..."></textarea>
   <button onclick="NGTChat.send()">Senden</button>
  </div>

  <div id="chatHelp"></div>
 </div>`;
}

function messages(){
 return load()
  .map(function(m){
   return `<div class="tc2ChatMsg ${m.role==='user'?'userMsg':'aiMsg'}">
    <div>${m.html}</div>
   </div>`;
  })
  .join('');
}

function scroll(){
 const el=document.getElementById('chatLog');
 if(el)el.scrollTop=el.scrollHeight;
}

function showHelp(){
 NGT500.modal(
  commandHelp(),
  {
   label:'Mögliche Befehle der TerraControl KI',
   className:'tc2HelpModal'
  }
 );
}

function closeHelp(){
 NGT500.closeModal(false);
}

function answerQuestion(text){
 const q=NGTAIEngine.norm(text);

 if(window.NGTAIManager){
  if(q==='heute'||/tagesuebersicht|tagesübersicht|was steht an/.test(q)){
   return '<b>Heute</b>'+NGTAIManager.renderToday();
  }

  const hit=NGTAIEngine.findAnimal(text);
  if(hit&&/(wie geht|status|zusammenfassung|ueberblick|überblick|entwicklung)/.test(q)){
   return '<b>Tier-Zusammenfassung</b><br>'+esc(NGTAIManager.animalSummary(hit.a)).replace(/\n/g,'<br>');
  }
 }

 if(window.NGTAIRecommendations&&/empfehl|kritisch|warnung|problem|hinweis/.test(q)){
  return '<b>Empfehlungen</b>'+NGTAIRecommendations.render(NGTAIRecommendations.build());
 }

 if(window.NGTAIQuery){
  const a=NGTAIQuery.query(text);
  if(a)return NGTAIQuery.renderAnswer(a);
 }

 return '';
}

function applyStock(p){
 const ft=p.feeder;
 const info=p.stock||NGTAIEngine.stockQty(p.raw);

 if(!ft||!info.qty)return null;

 const item=NGTStore.updateFoodStock(ft,info);
 if(!item)return null;
 return 'Bestand '+ft+': '+item.qty;
}

function applyParsed(p){
 if(p.intent==='context')return 'Kontext gesetzt: '+p.animal.a.name;
 if(p.intent==='stock')return applyStock(p);
 if(!p.animal)return null;

 const a=p.animal.a;
 let txt='';

 if(p.intent==='defaultFeeder'){
  if(!p.feeder)return null;
  a.defaultFeeder=p.feeder;
  a.futterStandard=p.feeder;
  a.standardFeed=p.feeder;
  NGTStore.save();
  txt=a.name+': Standardfutter '+p.feeder;
 }else if(p.intent==='shed'){
  const result=NGTStore.recordShed(
   {animalId:NGTStore.animalId(a)},
   {
    date:p.date,
    complete:true,
    source:'chat',
    note:'TerraControl KI'
   }
  );
  if(!result)return null;
  txt=a.name+': Häutung '+p.date;
 }else if(p.intent==='weight'){
  if(!p.grams)return null;
  const result=NGTStore.recordWeight(
   {animalId:NGTStore.animalId(a)},
   {
    date:p.date,
    weight:p.grams,
    source:'chat',
    note:'TerraControl KI'
   }
  );
  if(!result)return null;
  txt=a.name+': Gewicht '+p.date+' '+p.grams+'g';
 }else if(p.intent==='feed'||p.intent==='feed_refused'){
  const ft=p.feeder||a.defaultFeeder||a.futterStandard||'';
  const f=NGTStore.parseFeeder(ft);
  const result=NGTStore.recordFeed(
   {animalId:NGTStore.animalId(a)},
   {
    date:p.date,
    condition:f.state,
    prey:f.prey,
    variantLabel:f.size,
    preyWeightGrams:f.amount,
    quantity:1,
    unit:'Stück',
    displayLabel:f.label,
    inventoryLabel:f.label,
    accepted:p.intent!=='feed_refused',
    source:'chat',
    note:'TerraControl KI',
    deductStock:true
   }
  );

  if(!result)return null;

  txt=
   a.name+': '+
   p.date+' '+
   AnimalEngine.formatFeedEvent(result.event);
 }else return null;

 return txt+(window.NGTAIManager?NGTAIManager.afterSave(p,a):'');
}

function process(text){
 const q=answerQuestion(text);
 if(q)return q;

 const ps=(window.NGTAIContext?NGTAIContext.parse:NGTAIEngine.parse)(text);
 const ok=[];
 const err=[];

 ps.forEach(function(p){
  const r=applyParsed(p);
  if(r)ok.push(r);
  else err.push(p.raw);
 });

 if(ok.length){
  return '<b>Gespeichert</b><br>'+ok.map(esc).join('<br>')+
   (err.length?'<br><br><b>Nicht erkannt</b><br>'+err.map(esc).join('<br>'):'');
 }

 return 'Das habe ich noch nicht sicher verstanden. Öffne „Mögliche Befehle“ für Beispiele.';
}

function send(){
 const el=document.getElementById('chatText');
 const text=(el.value||'').trim();
 if(!text)return;

 add('user',esc(text).replace(/\n/g,'<br>'));

 const reply=process(text);
 add('ai',reply);

 el.value='';
 NGT500.route('chat');
 setTimeout(scroll,50);
}

function ask(text){
 add('user',esc(text));
 add('ai',process(text));
 NGT500.route('chat');
 setTimeout(scroll,50);
}

function clear(){
 sessionStorage.removeItem(KEY);
 NGT500.route('chat');
}

function afterRender(){
 scroll();
}

window.NGTChat={send,ask,clear,showHelp,closeHelp};
NGT500.register('chat',{render,afterRender});

})();
