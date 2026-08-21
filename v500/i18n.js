(function(){
'use strict';

const STORAGE_KEY='terracontrol_language_v1';
const SUPPORTED=['de','en'];
const TEXT_ORIGINAL=new WeakMap();
const ATTRIBUTE_ORIGINAL=new WeakMap();
const ATTRIBUTES=['aria-label','placeholder','title'];

let observer=null;
let activeLanguage=readStoredLanguage()||suggestedLanguage();
let scheduled=false;

function validLanguage(value){
 const language=String(value||'').toLowerCase().split('-')[0];
 return SUPPORTED.includes(language)?language:'';
}

function readStoredLanguage(){
 try{
  return validLanguage(localStorage.getItem(STORAGE_KEY));
 }catch(error){
  return '';
 }
}

function suggestedLanguage(){
 const languages=(navigator.languages&&navigator.languages.length)
  ?navigator.languages
  :[navigator.language||''];

 for(const language of languages){
  const valid=validLanguage(language);
  if(valid)return valid;
 }

 return 'en';
}

function dictionary(language){
 const locales=window.NGTLocales||{};
 return locales[validLanguage(language)||'de']||locales.de||{phrases:{}};
}

function translateExact(value,language){
 const source=String(value==null?'':value);
 if((validLanguage(language)||activeLanguage)==='de')return source;

 const locale=dictionary(language||activeLanguage);
 return Object.prototype.hasOwnProperty.call(locale.phrases||{},source)
  ?locale.phrases[source]
  :source;
}

function translateText(value,language){
 const source=String(value==null?'':value);
 const trimmed=source.trim();
 if(!trimmed)return source;

 let translated=translateExact(trimmed,language);

 if(translated===trimmed&&(validLanguage(language)||activeLanguage)==='en'){
  const decorated=trimmed.match(/^([^A-Za-zÀ-ÖØ-öø-ÿ0-9]*)(.*?)(\s*[›»]+)?$/);
  if(decorated){
   const translatedCore=translateExact(decorated[2],language);
   if(translatedCore!==decorated[2]){
    translated=decorated[1]+translatedCore+(decorated[3]||'');
   }
  }

  translated=translated
   .replace(/^Hallo(?:\s+(.+?))?\s*👋$/,function(_,name){return 'Hello'+(name?' '+name:'')+' 👋';})
   .replace(/^(\d+)\s+Tiere\s*[·•]\s*(\d+)\s+Aufgaben\s+fällig$/,function(_,animals,tasks){return animals+' animals · '+tasks+' tasks due';})
   .replace(/^(\d+)\s+Tiere\s+ausgewählt$/,function(_,count){return count+' animals selected';})
   .replace(/^(\d+)\s+Tier\s+ausgewählt$/,function(_,count){return count+' animal selected';})
   .replace(/^(\d+)\s+Tiere$/,function(_,count){return count+' animals';})
   .replace(/^(\d+)\s+Tier$/,function(_,count){return count+' animal';})
   .replace(/^(\d+)\s+Aufgaben$/,function(_,count){return count+' tasks';})
   .replace(/^(\d+)\s+Aufgabe$/,function(_,count){return count+' task';})
   .replace(/^(\d+) fällige Aufgaben$/,function(_,count){return count+' tasks due';})
   .replace(/^1 fällige Aufgabe$/,function(){return '1 task due';})
   .replace(/^(\d+)\s+Bestände$/,function(_,count){return count+' stock items';})
   .replace(/^(\d+)\s+Positionen$/,function(_,count){return count+' items';})
   .replace(/^1 Position$/,function(){return '1 item';})
   .replace(/^(\d+)\s+Einträge$/,function(_,count){return count+' entries';})
   .replace(/^(\d+)\s+Stück$/,function(_,count){return count+' items';})
   .replace(/^Ausreichend · Mindestbestand (\d+) Stück$/,function(_,count){return 'Sufficient · Minimum stock '+count+' items';})
   .replace(/^Nachbestellen · Mindestbestand (\d+) Stück$/,function(_,count){return 'Restock · Minimum stock '+count+' items';})
   .replace(/^Bestand:\s*(\d+)\s*(.*)$/,function(_,count,unit){return 'Stock: '+count+(unit?' '+translateExact(unit,language):'');})
   .replace(/^(.+?) · Eigentümer$/,function(_,value){return value+' · Owner';})
   .replace(/^(.+?) · Mitglied$/,function(_,value){return value+' · Member';})
   .replace(/^Einladung von (.+)$/,function(_,value){return 'Invitation from '+value;})
   .replace(/^(\d+) Jahre$/,function(_,count){return count+' years';})
   .replace(/^1 Jahr$/,function(){return '1 year';})
   .replace(/^(\d+) Tage$/,function(_,count){return count+' days';})
   .replace(/^1 Tag$/,function(){return '1 day';})
   .replace(/^1 Futtertier mit etwa ([\d,.]+) g$/,function(_,weight){return '1 feeder weighing about '+weight+' g';})
   .replace(/^(\d+) Futtertiere mit etwa ([\d,.]+) g$/,function(_,count,weight){return count+' feeders weighing about '+weight+' g';})
   .replace(/^(.+?) · 1 Tier$/,function(_,label){return label+' · 1 animal';})
   .replace(/^(.+?) · (\d+) Tiere$/,function(_,label,count){return label+' · '+count+' animals';})
   .replace(/^alle (\d+)[–-](\d+) Tage$/,function(_,from,to){return 'every '+from+'–'+to+' days';})
   .replace(/^alle (\d+) Tage$/,function(_,count){return 'every '+count+' days';})
   .replace(/^Orientierungswert: etwa ([\d,.]+) % des Körpergewichts$/,function(_,amount){return 'Guideline: about '+amount+'% of body weight';})
   .replace(/^Nächste Fütterung:\s*(.+)$/,function(_,date){return 'Next feeding: '+date;})
   .replace(/^(.+?) · aktuelles Gewicht ([\d,.]+) g$/,function(_,species,weight){return species+' · current weight '+weight+' g';})
   .replace(/^(.+?) · (.+)$/,function(match,label,value){const translatedLabel=translateExact(label,language);return translatedLabel===label?match:translatedLabel+' · '+value;})
   .replace(/^(.+?) (gefressen|verweigert)$/i,function(_,value,status){return value+' '+(status.toLowerCase()==='gefressen'?'eaten':'refused');})
   .replace(/^([\d,.]+ g) am (.+)$/,function(_,weight,date){return weight+' on '+date;})
   .replace(/^(\d{2}\/\d{2}\/\d{4}) (Gewicht|Gefressen|Verweigert|Häutung)(.*)$/,function(_,date,label,rest){return date+' '+translateExact(label,language)+rest;})
   .replace(/^(Gewicht|Gefressen|Verweigert|Häutung)\s+(.+)$/,function(_,label,value){return translateExact(label,language)+' '+value;})
   .replace(/^(\d+) von (\d+) bereits angelegt$/,function(_,done,total){return done+' of '+total+' already created';})
   .replace(/^seit (\d+) Tagen fällig$/,function(_,count){return count+' days overdue';})
   .replace(/^in (\d+) Tagen$/,function(_,count){return 'in '+count+' days';})
   .replace(/^vor (\d+) Tagen$/,function(_,count){return count+' days ago';});
 }

 if(translated===trimmed)return source;

 const start=source.match(/^\s*/)[0];
 const end=source.match(/\s*$/)[0];
 return start+translated+end;
}

function skipped(node,attributesOnly){
 const element=node.nodeType===Node.ELEMENT_NODE
  ?node
  :node.parentElement;

 return !!(
  element&&
  element.closest(
   attributesOnly
    ?'script,style,code,pre,[data-tc-i18n-skip],[contenteditable="true"]'
    :'script,style,code,pre,textarea,[data-tc-i18n-skip],[contenteditable="true"],.tc2SupportMessage p,.tc2SupportThreadCopy b,.tc2SupportThreadCopy small,.tc2SupportThreadCopy em,.tc2AnnouncementCard h3,.tc2AnnouncementCard p'
  )
 );
}

function translateTextNode(node){
 if(!node||node.nodeType!==Node.TEXT_NODE||skipped(node))return;

 const current=node.nodeValue||'';
 let record=TEXT_ORIGINAL.get(node);

 if(!record||current!==record.last){
  record={source:current,last:current};
  TEXT_ORIGINAL.set(node,record);
 }

 let translated=translateText(record.source,activeLanguage);
 if(
  activeLanguage==='en'&&
  record.source.trim()==='Bestand'&&
  node.parentElement&&
  node.parentElement.closest('.tc2Food')
 ){
  translated=record.source.replace('Bestand','Stock');
 }
 record.last=translated;
 if(current!==translated)node.nodeValue=translated;
}

function translateAttributes(element){
 if(!element||element.nodeType!==Node.ELEMENT_NODE||skipped(element,true))return;

 let records=ATTRIBUTE_ORIGINAL.get(element);
 if(!records){
  records={};
  ATTRIBUTE_ORIGINAL.set(element,records);
 }

 ATTRIBUTES.forEach(function(attribute){
  if(!element.hasAttribute(attribute))return;
  const current=element.getAttribute(attribute)||'';
  let record=records[attribute];

  if(!record||current!==record.last){
   record={source:current,last:current};
   records[attribute]=record;
  }

  const translated=translateText(record.source,activeLanguage);
  record.last=translated;
  if(current!==translated){
   element.setAttribute(attribute,translated);
  }
 });
}

function translateRoot(root){
 if(!root)return;

 if(root.nodeType===Node.TEXT_NODE){
  translateTextNode(root);
  return;
 }

 if(root.nodeType!==Node.ELEMENT_NODE&&root.nodeType!==Node.DOCUMENT_NODE)return;
 if(root.nodeType===Node.ELEMENT_NODE)translateAttributes(root);

 const walker=document.createTreeWalker(
  root,
  NodeFilter.SHOW_ELEMENT|NodeFilter.SHOW_TEXT
 );
 let node=walker.nextNode();

 while(node){
  if(node.nodeType===Node.TEXT_NODE)translateTextNode(node);
  else translateAttributes(node);
  node=walker.nextNode();
 }
}

function refresh(){
 scheduled=false;
 document.documentElement.lang=activeLanguage;
 if(document.body)translateRoot(document.body);
}

function scheduleRefresh(){
 if(scheduled)return;
 scheduled=true;
 queueMicrotask(refresh);
}

function observe(){
 if(observer||!document.body)return;
 refresh();
 observer=new MutationObserver(function(records){
  if(records.some(function(record){
   return record.type==='childList'||record.type==='characterData'||record.type==='attributes';
  }))scheduleRefresh();
 });
 observer.observe(document.body,{
  childList:true,
  characterData:true,
  attributes:true,
  attributeFilter:ATTRIBUTES,
  subtree:true
 });
}

function hasSelection(){
 return !!readStoredLanguage();
}

function setLanguage(language,options){
 const valid=validLanguage(language);
 if(!valid)return false;

 activeLanguage=valid;
 try{localStorage.setItem(STORAGE_KEY,valid);}catch(error){}
 document.documentElement.lang=valid;
 closePicker();

 window.dispatchEvent(new CustomEvent('terracontrol-language-change',{
  detail:{language:valid,locale:locale()}
 }));

 if(options&&options.reload===false){
  refresh();
 }else{
  location.reload();
 }
 return true;
}

function closePicker(){
 const picker=document.getElementById('tcLanguagePicker');
 if(picker)picker.remove();
}

function showPicker(options){
 if(!document.body||document.getElementById('tcLanguagePicker'))return;
 const dismissible=!!(options&&options.dismissible);
 const suggested=suggestedLanguage();
 const root=document.createElement('div');
 root.id='tcLanguagePicker';
 root.className='tcLanguagePicker';
 root.setAttribute('data-tc-i18n-skip','');
 root.innerHTML=`
  <section class="tcLanguageDialog" role="dialog" aria-modal="true" aria-labelledby="tcLanguageTitle">
   <div class="tcLanguageMark">TC</div>
   <div>
    <h2 id="tcLanguageTitle">Sprache auswählen</h2>
    <p>Choose your language</p>
   </div>
   <div class="tcLanguageOptions">
    <button type="button" class="${suggested==='de'?'suggested':''}" data-language="de"><span>🇩🇪</span><b>Deutsch</b><small>German</small></button>
    <button type="button" class="${suggested==='en'?'suggested':''}" data-language="en"><span>🇬🇧</span><b>English</b><small>Englisch</small></button>
   </div>
   <small class="tcLanguageHint">Die Sprache kann später unter System geändert werden.<br>The language can be changed later under System.</small>
   ${dismissible?'<button type="button" class="tcLanguageCancel">Abbrechen / Cancel</button>':''}
  </section>`;

 root.addEventListener('click',function(event){
  const button=event.target.closest('[data-language]');
  if(button)setLanguage(button.dataset.language);
  if(event.target.closest('.tcLanguageCancel'))closePicker();
 });
 document.body.appendChild(root);
 }

function locale(){
 return dictionary(activeLanguage).locale||(activeLanguage==='de'?'de-DE':'en-GB');
}

function initialize(){
 observe();
 if(!hasSelection())showPicker({dismissible:false});
}

window.TCI18n={
 supported:SUPPORTED.slice(),
 current:function(){return activeLanguage;},
 locale:locale,
 hasSelection:hasSelection,
 suggested:suggestedLanguage,
 t:function(value){return translateText(value,activeLanguage).trim();},
 set:setLanguage,
 open:function(){showPicker({dismissible:true});},
 refresh:refresh
};

if(document.readyState==='loading'){
 document.addEventListener('DOMContentLoaded',initialize,{once:true});
}else{
 initialize();
}

})();
