(function(){
'use strict';

const STORAGE_KEY='terracontrol_language_v1';
const SUPPORTED=['de','en','it','hu'];
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
 const currentLanguage=validLanguage(language)||activeLanguage;

 if(translated===trimmed&&currentLanguage!=='de'){
  const decorated=trimmed.match(/^([^A-Za-zÀ-ÖØ-öø-ÿ0-9]*)(.*?)(\s*[›»]+)?$/);
  if(decorated){
   const translatedCore=translateExact(decorated[2],language);
   if(translatedCore!==decorated[2]){
    translated=decorated[1]+translatedCore+(decorated[3]||'');
   }
  }
 }

 if(translated===trimmed&&currentLanguage==='en'){
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
   .replace(/^seit 1 Tag fällig$/,function(){return '1 day overdue';})
   .replace(/^seit (\d+) Tagen fällig$/,function(_,count){return count+' days overdue';})
   .replace(/^in (\d+) Tagen$/,function(_,count){return 'in '+count+' days';})
   .replace(/^vor (\d+) Tagen$/,function(_,count){return count+' days ago';})
   .replace(/^Alter (\d+) Monate$/,function(_,count){return 'Age '+count+' months';})
   .replace(/^Boa · ([\d,.]+ g) · Alter (\d+) Monate$/,function(_,weight,months){return 'Boa · '+weight+' · age '+months+' months';})
   .replace(/^(Leopardgecko|Jemenchamäleon|Chamäleon) · (Jungtier|Adult) · Alter (\d+) Monate$/,function(_,species,stage,months){return translateExact(species,language)+' · '+(stage==='Jungtier'?'juvenile':'adult')+' · age '+months+' months';})
   .replace(/^Chamäleon · genaue Art und Lebensphase beachten$/,function(){return 'Chameleon · consider the exact species and life stage';})
   .replace(/^Allgemeine Schlangenorientierung · Alter (\d+) Monate$/,function(_,months){return 'General snake guidance · age '+months+' months';})
   .replace(/^1 Futtertier bis etwa ([\d,.]+) g$/,function(_,weight){return '1 feeder up to about '+weight+' g';})
   .replace(/^Einladung wurde für (.+) hinterlegt\.$/,function(_,email){return 'Invitation created for '+email+'.';})
   .replace(/^(\d+) Nachzucht(?:en)? (?:wurde|wurden) gelöscht\.$/,function(_,count){return count+' offspring deleted.';})
   .replace(/^(\d+) Nachzucht(?:en)? angelegt\.$/,function(_,count){return count+' offspring created.';})
   .replace(/^(\d+) Fütterung(?:en)? (?:wurde|wurden) gespeichert\.$/,function(_,count){return count+' feeding'+(count==='1'?'':'s')+' saved.';})
   .replace(/^(.+): benötigt (\d+), vorhanden (\d+)\.$/,function(_,item,needed,stock){return item+': '+needed+' needed, '+stock+' available.';})
   .replace(/^(\d+) nicht bestätigte Gen-Angabe\(n\) werden nicht berechnet\.$/,function(_,count){return count+' unconfirmed genetic entries are not calculated.';})
   .replace(/^Nicht automatisch erkannt: (.+)\. Diese Angabe wird nicht in die Quote einbezogen\.$/,function(_,value){return 'Not recognised automatically: '+value+'. This entry is not included in the probability.';})
   .replace(/^(.+) ist nur als mögliches het angegeben; die Quote wird entsprechend gewichtet\.$/,function(_,trait){return trait+' is listed only as possible het; the probability is weighted accordingly.';})
   .replace(/^Fütterung prüfen: letzte Fütterung vor (\d+) Tagen\.$/,function(_,days){return 'Check feeding: last feeding '+days+' days ago.';})
   .replace(/^Gewicht seit (\d+) Tagen nicht aktualisiert\.$/,function(_,days){return 'Weight not updated for '+days+' days.';})
   .replace(/^Gewichtsverlust: ([\d,.-]+)g seit letzter Messung\.$/,function(_,weight){return 'Weight loss: '+weight+' g since the last measurement.';})
   .replace(/^Offene Gesundheits-\/Kontroll-Einträge: (\d+)\.$/,function(_,count){return 'Open health/check-up records: '+count+'.';})
   .replace(/^Letzte Kontrolle vor (\d+) Tagen\.$/,function(_,days){return 'Last check-up '+days+' days ago.';})
   .replace(/^(.+) ist leer\.$/,function(_,item){return item+' is empty.';})
   .replace(/^(.+) ist niedrig \((\d+)\)\.$/,function(_,item,count){return item+' is low ('+count+').';})
   .replace(/^steigend \(\+([\d,.]+)g\)$/,function(_,weight){return 'rising (+'+weight+' g)';})
   .replace(/^fallend \(([\d,.-]+)g\)$/,function(_,weight){return 'falling ('+weight+' g)';})
   .replace(/^letzte Häutung vor (\d+) Tagen$/,function(_,days){return 'last shed '+days+' days ago';})
   .replace(/^(.+?):\s*(.+)$/,function(match,label,value){const translatedLabel=translateExact(label,language);const translatedValue=translateText(value,language);return translatedLabel===label&&translatedValue===value?match:translatedLabel+': '+translatedValue;});
 }

 if(translated===trimmed&&currentLanguage==='it'){
  translated=translated
   .replace(/^Hallo(?:\s+(.+?))?\s*👋$/,function(_,name){return 'Ciao'+(name?' '+name:'')+' 👋';})
   .replace(/^(\d+)\s+Tiere\s*[·•]\s*(\d+)\s+Aufgaben\s+fällig$/,function(_,animals,tasks){return animals+' animali · '+tasks+' attività in scadenza';})
   .replace(/^(\d+)\s+Tiere\s+ausgewählt$/,function(_,count){return count+' animali selezionati';})
   .replace(/^(\d+)\s+Tier\s+ausgewählt$/,function(_,count){return count+' animale selezionato';})
   .replace(/^(\d+)\s+Tiere$/,function(_,count){return count+' animali';})
   .replace(/^(\d+)\s+Tier$/,function(_,count){return count+' animale';})
   .replace(/^(\d+)\s+Aufgaben$/,function(_,count){return count+' attività';})
   .replace(/^(\d+)\s+Aufgabe$/,function(_,count){return count+' attività';})
   .replace(/^(\d+) fällige Aufgaben$/,function(_,count){return count+' attività in scadenza';})
   .replace(/^1 fällige Aufgabe$/,function(){return '1 attività in scadenza';})
   .replace(/^(\d+)\s+Bestände$/,function(_,count){return count+' scorte';})
   .replace(/^(\d+)\s+Positionen$/,function(_,count){return count+' articoli';})
   .replace(/^1 Position$/,function(){return '1 articolo';})
   .replace(/^(\d+)\s+Einträge$/,function(_,count){return count+' voci';})
   .replace(/^(\d+)\s+Stück$/,function(_,count){return count+' pezzi';})
   .replace(/^Ausreichend · Mindestbestand (\d+) Stück$/,function(_,count){return 'Sufficiente · Scorta minima '+count+' pezzi';})
   .replace(/^Nachbestellen · Mindestbestand (\d+) Stück$/,function(_,count){return 'Da riordinare · Scorta minima '+count+' pezzi';})
   .replace(/^Bestand:\s*(\d+)\s*(.*)$/,function(_,count,unit){return 'Scorta: '+count+(unit?' '+translateExact(unit,language):'');})
   .replace(/^(.+?) · Eigentümer$/,function(_,value){return value+' · Proprietario';})
   .replace(/^(.+?) · Mitglied$/,function(_,value){return value+' · Membro';})
   .replace(/^Einladung von (.+)$/,function(_,value){return 'Invito da '+value;})
   .replace(/^(\d+) Jahre$/,function(_,count){return count+' anni';})
   .replace(/^1 Jahr$/,function(){return '1 anno';})
   .replace(/^(\d+) Tage$/,function(_,count){return count+' giorni';})
   .replace(/^1 Tag$/,function(){return '1 giorno';})
   .replace(/^1 Futtertier mit etwa ([\d,.]+) g$/,function(_,weight){return '1 animale da pasto di circa '+weight+' g';})
   .replace(/^(\d+) Futtertiere mit etwa ([\d,.]+) g$/,function(_,count,weight){return count+' animali da pasto di circa '+weight+' g';})
   .replace(/^(.+?) · 1 Tier$/,function(_,label){return label+' · 1 animale';})
   .replace(/^(.+?) · (\d+) Tiere$/,function(_,label,count){return label+' · '+count+' animali';})
   .replace(/^alle (\d+)[–-](\d+) Tage$/,function(_,from,to){return 'ogni '+from+'–'+to+' giorni';})
   .replace(/^alle (\d+) Tage$/,function(_,count){return 'ogni '+count+' giorni';})
   .replace(/^Orientierungswert: etwa ([\d,.]+) % des Körpergewichts$/,function(_,amount){return 'Valore indicativo: circa il '+amount+'% del peso corporeo';})
   .replace(/^Nächste Fütterung:\s*(.+)$/,function(_,date){return 'Prossima alimentazione: '+date;})
   .replace(/^(.+?) · aktuelles Gewicht ([\d,.]+) g$/,function(_,species,weight){return species+' · peso attuale '+weight+' g';})
   .replace(/^(.+?) · (.+)$/,function(match,label,value){const translatedLabel=translateExact(label,language);return translatedLabel===label?match:translatedLabel+' · '+value;})
   .replace(/^(.+?) (gefressen|verweigert)$/i,function(_,value,status){return value+' '+(status.toLowerCase()==='gefressen'?'mangiato':'rifiutato');})
   .replace(/^([\d,.]+ g) am (.+)$/,function(_,weight,date){return weight+' il '+date;})
   .replace(/^(\d{2}\/\d{2}\/\d{4}) (Gewicht|Gefressen|Verweigert|Häutung)(.*)$/,function(_,date,label,rest){return date+' '+translateExact(label,language)+rest;})
   .replace(/^(Gewicht|Gefressen|Verweigert|Häutung)\s+(.+)$/,function(_,label,value){return translateExact(label,language)+' '+value;})
   .replace(/^(\d+) von (\d+) bereits angelegt$/,function(_,done,total){return done+' di '+total+' già creati';})
   .replace(/^seit 1 Tag fällig$/,function(){return 'in ritardo di 1 giorno';})
   .replace(/^seit (\d+) Tagen fällig$/,function(_,count){return 'in ritardo di '+count+' giorni';})
   .replace(/^in (\d+) Tagen$/,function(_,count){return 'tra '+count+' giorni';})
   .replace(/^vor (\d+) Tagen$/,function(_,count){return count+' giorni fa';})
   .replace(/^Alter (\d+) Monate$/,function(_,count){return 'Età '+count+' mesi';})
   .replace(/^Boa · ([\d,.]+ g) · Alter (\d+) Monate$/,function(_,weight,months){return 'Boa · '+weight+' · età '+months+' mesi';})
   .replace(/^(Leopardgecko|Jemenchamäleon|Chamäleon) · (Jungtier|Adult) · Alter (\d+) Monate$/,function(_,species,stage,months){return translateExact(species,language)+' · '+(stage==='Jungtier'?'giovane':'adulto')+' · età '+months+' mesi';})
   .replace(/^Chamäleon · genaue Art und Lebensphase beachten$/,function(){return 'Camaleonte · considerare la specie esatta e la fase di vita';})
   .replace(/^Allgemeine Schlangenorientierung · Alter (\d+) Monate$/,function(_,months){return 'Indicazioni generali per serpenti · età '+months+' mesi';})
   .replace(/^1 Futtertier bis etwa ([\d,.]+) g$/,function(_,weight){return '1 preda fino a circa '+weight+' g';})
   .replace(/^Einladung wurde für (.+) hinterlegt\.$/,function(_,email){return 'Invito creato per '+email+'.';})
   .replace(/^(\d+) Nachzucht(?:en)? (?:wurde|wurden) gelöscht\.$/,function(_,count){return count+' esemplari di prole eliminati.';})
   .replace(/^(\d+) Nachzucht(?:en)? angelegt\.$/,function(_,count){return count+' esemplari di prole creati.';})
   .replace(/^(\d+) Fütterung(?:en)? (?:wurde|wurden) gespeichert\.$/,function(_,count){return count+' alimentazioni salvate.';})
   .replace(/^(.+): benötigt (\d+), vorhanden (\d+)\.$/,function(_,item,needed,stock){return item+': necessari '+needed+', disponibili '+stock+'.';})
   .replace(/^(\d+) nicht bestätigte Gen-Angabe\(n\) werden nicht berechnet\.$/,function(_,count){return count+' voci genetiche non confermate non vengono calcolate.';})
   .replace(/^Nicht automatisch erkannt: (.+)\. Diese Angabe wird nicht in die Quote einbezogen\.$/,function(_,value){return 'Non riconosciuto automaticamente: '+value+'. Questa voce non è inclusa nella probabilità.';})
   .replace(/^(.+) ist nur als mögliches het angegeben; die Quote wird entsprechend gewichtet\.$/,function(_,trait){return trait+' è indicato solo come possibile het; la probabilità viene ponderata di conseguenza.';})
   .replace(/^Fütterung prüfen: letzte Fütterung vor (\d+) Tagen\.$/,function(_,days){return 'Controlla alimentazione: ultima alimentazione '+days+' giorni fa.';})
   .replace(/^Gewicht seit (\d+) Tagen nicht aktualisiert\.$/,function(_,days){return 'Peso non aggiornato da '+days+' giorni.';})
   .replace(/^Gewichtsverlust: ([\d,.-]+)g seit letzter Messung\.$/,function(_,weight){return 'Perdita di peso: '+weight+' g dall’ultima misurazione.';})
   .replace(/^Offene Gesundheits-\/Kontroll-Einträge: (\d+)\.$/,function(_,count){return 'Registrazioni sanitarie/di controllo aperte: '+count+'.';})
   .replace(/^Letzte Kontrolle vor (\d+) Tagen\.$/,function(_,days){return 'Ultimo controllo '+days+' giorni fa.';})
   .replace(/^(.+) ist leer\.$/,function(_,item){return item+' è esaurito.';})
   .replace(/^(.+) ist niedrig \((\d+)\)\.$/,function(_,item,count){return item+' è in esaurimento ('+count+').';})
   .replace(/^steigend \(\+([\d,.]+)g\)$/,function(_,weight){return 'in aumento (+'+weight+' g)';})
   .replace(/^fallend \(([\d,.-]+)g\)$/,function(_,weight){return 'in calo ('+weight+' g)';})
   .replace(/^letzte Häutung vor (\d+) Tagen$/,function(_,days){return 'ultima muta '+days+' giorni fa';})
   .replace(/^(.+?):\s*(.+)$/,function(match,label,value){const translatedLabel=translateExact(label,language);const translatedValue=translateText(value,language);return translatedLabel===label&&translatedValue===value?match:translatedLabel+': '+translatedValue;});
 }

 if(translated===trimmed&&currentLanguage==='hu'){
  translated=translated
   .replace(/^Hallo(?:\s+(.+?))?\s*👋$/,function(_,name){return 'Szia'+(name?' '+name:'')+' 👋';})
   .replace(/^(\d+)\s+Tiere\s*[·•]\s*(\d+)\s+Aufgaben\s+fällig$/,function(_,animals,tasks){return animals+' állat · '+tasks+' esedékes feladat';})
   .replace(/^(\d+)\s+Tiere\s+ausgewählt$/,function(_,count){return count+' állat kiválasztva';})
   .replace(/^(\d+)\s+Tier\s+ausgewählt$/,function(_,count){return count+' állat kiválasztva';})
   .replace(/^(\d+)\s+Tiere$/,function(_,count){return count+' állat';})
   .replace(/^(\d+)\s+Tier$/,function(_,count){return count+' állat';})
   .replace(/^(\d+)\s+Aufgaben$/,function(_,count){return count+' feladat';})
   .replace(/^(\d+)\s+Aufgabe$/,function(_,count){return count+' feladat';})
   .replace(/^(\d+) fällige Aufgaben$/,function(_,count){return count+' esedékes feladat';})
   .replace(/^1 fällige Aufgabe$/,function(){return '1 esedékes feladat';})
   .replace(/^(\d+)\s+Bestände$/,function(_,count){return count+' készletelem';})
   .replace(/^(\d+)\s+Positionen$/,function(_,count){return count+' tétel';})
   .replace(/^1 Position$/,function(){return '1 tétel';})
   .replace(/^(\d+)\s+Einträge$/,function(_,count){return count+' bejegyzés';})
   .replace(/^(\d+)\s+Stück$/,function(_,count){return count+' darab';})
   .replace(/^Ausreichend · Mindestbestand (\d+) Stück$/,function(_,count){return 'Elegendő · Minimális készlet '+count+' darab';})
   .replace(/^Nachbestellen · Mindestbestand (\d+) Stück$/,function(_,count){return 'Utánrendelés · Minimális készlet '+count+' darab';})
   .replace(/^Bestand:\s*(\d+)\s*(.*)$/,function(_,count,unit){return 'Készlet: '+count+(unit?' '+translateExact(unit,language):'');})
   .replace(/^(.+?) · Eigentümer$/,function(_,value){return value+' · Tulajdonos';})
   .replace(/^(.+?) · Mitglied$/,function(_,value){return value+' · Tag';})
   .replace(/^Einladung von (.+)$/,function(_,value){return 'Meghívás tőle: '+value;})
   .replace(/^(\d+) Jahre$/,function(_,count){return count+' év';})
   .replace(/^1 Jahr$/,function(){return '1 év';})
   .replace(/^(\d+) Tage$/,function(_,count){return count+' nap';})
   .replace(/^1 Tag$/,function(){return '1 nap';})
   .replace(/^1 Futtertier mit etwa ([\d,.]+) g$/,function(_,weight){return '1 etetőállat, körülbelül '+weight+' g';})
   .replace(/^(\d+) Futtertiere mit etwa ([\d,.]+) g$/,function(_,count,weight){return count+' etetőállat, egyenként körülbelül '+weight+' g';})
   .replace(/^(.+?) · 1 Tier$/,function(_,label){return label+' · 1 állat';})
   .replace(/^(.+?) · (\d+) Tiere$/,function(_,label,count){return label+' · '+count+' állat';})
   .replace(/^alle (\d+)[–-](\d+) Tage$/,function(_,from,to){return from+'–'+to+' naponta';})
   .replace(/^alle (\d+) Tage$/,function(_,count){return count+' naponta';})
   .replace(/^Orientierungswert: etwa ([\d,.]+) % des Körpergewichts$/,function(_,amount){return 'Irányérték: a testsúly körülbelül '+amount+'%-a';})
   .replace(/^Nächste Fütterung:\s*(.+)$/,function(_,date){return 'Következő etetés: '+date;})
   .replace(/^(.+?) · aktuelles Gewicht ([\d,.]+) g$/,function(_,species,weight){return species+' · jelenlegi súly '+weight+' g';})
   .replace(/^(.+?) · (.+)$/,function(match,label,value){const translatedLabel=translateExact(label,language);return translatedLabel===label?match:translatedLabel+' · '+value;})
   .replace(/^(.+?) (gefressen|verweigert)$/i,function(_,value,status){return value+' '+(status.toLowerCase()==='gefressen'?'elfogyasztva':'visszautasítva');})
   .replace(/^([\d,.]+ g) am (.+)$/,function(_,weight,date){return weight+' · '+date;})
   .replace(/^(\d{2}\/\d{2}\/\d{4}) (Gewicht|Gefressen|Verweigert|Häutung)(.*)$/,function(_,date,label,rest){return date+' '+translateExact(label,language)+rest;})
   .replace(/^(Gewicht|Gefressen|Verweigert|Häutung)\s+(.+)$/,function(_,label,value){return translateExact(label,language)+' '+value;})
   .replace(/^(\d+) von (\d+) bereits angelegt$/,function(_,done,total){return done+'/'+total+' már létrehozva';})
   .replace(/^seit 1 Tag fällig$/,function(){return '1 napja esedékes';})
   .replace(/^seit (\d+) Tagen fällig$/,function(_,count){return count+' napja esedékes';})
   .replace(/^in (\d+) Tagen$/,function(_,count){return count+' nap múlva';})
   .replace(/^vor (\d+) Tagen$/,function(_,count){return count+' napja';})
   .replace(/^Alter (\d+) Monate$/,function(_,count){return 'Kor: '+count+' hónap';})
   .replace(/^Boa · ([\d,.]+ g) · Alter (\d+) Monate$/,function(_,weight,months){return 'Boa · '+weight+' · kor: '+months+' hónap';})
   .replace(/^(Leopardgecko|Jemenchamäleon|Chamäleon) · (Jungtier|Adult) · Alter (\d+) Monate$/,function(_,species,stage,months){return translateExact(species,language)+' · '+(stage==='Jungtier'?'fiatal':'felnőtt')+' · kor: '+months+' hónap';})
   .replace(/^Chamäleon · genaue Art und Lebensphase beachten$/,function(){return 'Kaméleon · vedd figyelembe a pontos fajt és életszakaszt';})
   .replace(/^Allgemeine Schlangenorientierung · Alter (\d+) Monate$/,function(_,months){return 'Általános kígyóetetési útmutató · kor: '+months+' hónap';})
   .replace(/^1 Futtertier bis etwa ([\d,.]+) g$/,function(_,weight){return '1 táplálékállat legfeljebb körülbelül '+weight+' g';})
   .replace(/^Einladung wurde für (.+) hinterlegt\.$/,function(_,email){return 'Meghívó létrehozva számára: '+email+'.';})
   .replace(/^(\d+) Nachzucht(?:en)? (?:wurde|wurden) gelöscht\.$/,function(_,count){return count+' utód törölve.';})
   .replace(/^(\d+) Nachzucht(?:en)? angelegt\.$/,function(_,count){return count+' utód létrehozva.';})
   .replace(/^(\d+) Fütterung(?:en)? (?:wurde|wurden) gespeichert\.$/,function(_,count){return count+' etetés mentve.';})
   .replace(/^(.+): benötigt (\d+), vorhanden (\d+)\.$/,function(_,item,needed,stock){return item+': szükséges '+needed+', elérhető '+stock+'.';})
   .replace(/^(\d+) nicht bestätigte Gen-Angabe\(n\) werden nicht berechnet\.$/,function(_,count){return count+' meg nem erősített genetikai bejegyzés nem kerül kiszámításra.';})
   .replace(/^Nicht automatisch erkannt: (.+)\. Diese Angabe wird nicht in die Quote einbezogen\.$/,function(_,value){return 'Nem automatikusan felismert: '+value+'. Ez a bejegyzés nem szerepel a valószínűségben.';})
   .replace(/^(.+) ist nur als mögliches het angegeben; die Quote wird entsprechend gewichtet\.$/,function(_,trait){return trait+' csak lehetséges het-ként van megadva; a valószínűség ennek megfelelően súlyozott.';})
   .replace(/^Fütterung prüfen: letzte Fütterung vor (\d+) Tagen\.$/,function(_,days){return 'Etetés ellenőrzése: az utolsó etetés '+days+' napja volt.';})
   .replace(/^Gewicht seit (\d+) Tagen nicht aktualisiert\.$/,function(_,days){return 'A súly '+days+' napja nem lett frissítve.';})
   .replace(/^Gewichtsverlust: ([\d,.-]+)g seit letzter Messung\.$/,function(_,weight){return 'Súlycsökkenés: '+weight+' g az utolsó mérés óta.';})
   .replace(/^Offene Gesundheits-\/Kontroll-Einträge: (\d+)\.$/,function(_,count){return 'Nyitott egészségügyi/ellenőrzési bejegyzések: '+count+'.';})
   .replace(/^Letzte Kontrolle vor (\d+) Tagen\.$/,function(_,days){return 'Az utolsó ellenőrzés '+days+' napja volt.';})
   .replace(/^(.+) ist leer\.$/,function(_,item){return item+' elfogyott.';})
   .replace(/^(.+) ist niedrig \((\d+)\)\.$/,function(_,item,count){return item+' készlete alacsony ('+count+').';})
   .replace(/^steigend \(\+([\d,.]+)g\)$/,function(_,weight){return 'növekvő (+'+weight+' g)';})
   .replace(/^fallend \(([\d,.-]+)g\)$/,function(_,weight){return 'csökkenő ('+weight+' g)';})
   .replace(/^letzte Häutung vor (\d+) Tagen$/,function(_,days){return 'utolsó vedlés '+days+' napja';})
   .replace(/^(.+?):\s*(.+)$/,function(match,label,value){const translatedLabel=translateExact(label,language);const translatedValue=translateText(value,language);return translatedLabel===label&&translatedValue===value?match:translatedLabel+': '+translatedValue;});
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
  activeLanguage!=='de'&&
  record.source.trim()==='Bestand'&&
  node.parentElement&&
  node.parentElement.closest('.tc2Food')
 ){
  translated={en:'Stock',it:'Scorta',hu:'Készlet'}[activeLanguage]||translated;
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
    <button type="button" class="${suggested==='it'?'suggested':''}" data-language="it"><span>🇮🇹</span><b>Italiano</b><small>Italienisch</small></button>
    <button type="button" class="${suggested==='hu'?'suggested':''}" data-language="hu"><span>🇭🇺</span><b>Magyar</b><small>Ungarisch</small></button>
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
 const fallback={de:'de-DE',en:'en-GB',it:'it-IT',hu:'hu-HU'};
 return dictionary(activeLanguage).locale||fallback[activeLanguage]||'en-GB';
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
