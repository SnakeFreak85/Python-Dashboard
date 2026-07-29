(function(){
'use strict';
function norm(s){return NGTAIEngine.norm(s)}
function daysSince(date){const t=Date.parse(date||'');return t?Math.floor((Date.now()-t)/86400000):9999}
function latest(list){return AnimalEngine.latest(list)}
function animals(){return NGTStore.allAnimals().filter(x=>AnimalEngine.isActiveAnimal(x.a))}
function line(x,txt){return {d:'',txt:x.a.name+(txt?': '+txt:'')}}
function needsFeeding(){return animals().filter(x=>CareRulesEngine.isFeedDue(x.a)).map(x=>line(x,'Fütterung prüfen'))}
function needsWeight(){return animals().filter(x=>CareRulesEngine.isWeightDue(x.a)).map(x=>line(x,'Gewicht aktualisieren'))}
function refusals(){return animals().filter(x=>{const r=AnimalEngine.sortHistory(x.a.feeds,'desc').slice(0,3);return r.length>=3&&r.every(f=>f.accepted===false)}).map(x=>line(x,'3 Verweigerungen in Folge'))}
function weightLoss(){return animals().filter(x=>{const w=AnimalEngine.sortHistory(x.a.weights,'asc');return w.length>=2&&Number(w[w.length-1].weight)<Number(w[w.length-2].weight)}).map(x=>{const w=AnimalEngine.sortHistory(x.a.weights,'asc');const diff=Number(w[w.length-1].weight)-Number(w[w.length-2].weight);return line(x,'Gewicht '+diff+'g')})}
function foodStock(q){const food=NGTStore.foodInventory();const ft=NGTAIEngine.feeder(q);if(ft){const item=food.find(x=>norm(x.name)===norm(ft));return [{d:'',txt:ft+': '+(item?item.qty:0)}]}return food.map(x=>({d:'',txt:x.name+': '+Number(x.qty||0)}))}
function animalStatus(q){const hit=NGTAIEngine.findAnimal(q);if(!hit)return null;const a=hit.a;const lf=latest(a.feeds);const lw=latest(a.weights);const ls=latest(a.sheds);const lh=latest(a.health);return [{d:'',txt:a.name+' · Gewicht: '+(lw?lw.weight+'g am '+lw.date:'-')},{d:'',txt:'Letzte Fütterung: '+(lf?lf.date+' '+(lf.accepted===false?'verweigert':'gefressen'):'-')},{d:'',txt:'Letzte Häutung: '+(ls?ls.date:'-')},{d:'',txt:'Gesundheit: '+(lh?lh.date+' '+(lh.title||lh.type||'Eintrag'):'keine offenen Daten')}]}
function query(text){const q=norm(text);if(!q.includes('?')&&!/welche|wer|wie viele|wieviele|zeige|zeig|status|geht es|bestand|futter/.test(q))return null;if(/geht es|status|ueberblick|überblick/.test(q)){const r=animalStatus(text);if(r)return {title:'Tierstatus',rows:r}}
if(/futterbestand|bestand|wie viele|wieviele/.test(q)&&/ratte|maus|asf|kueken|küken|heimchen|schabe|futter/.test(q))return {title:'Futterbestand',rows:foodStock(text)};
if(/fuetter|fütter|fressen|gefuttert|gefüttert/.test(q)&&/(muss|muessen|müssen|faellig|fällig|pruefen|prüfen)/.test(q))return {title:'Fütterung prüfen',rows:needsFeeding()};
if(/gewicht|wiegen|gewogen/.test(q)&&/(muss|muessen|müssen|fehlt|faellig|fällig|pruefen|prüfen)/.test(q))return {title:'Gewichte aktualisieren',rows:needsWeight()};
if(/verweigert|verweigerung|nicht gefressen/.test(q))return {title:'Verweigerungen',rows:refusals()};
if(/abgenommen|gewicht verloren|gewichtsverlust|verloren/.test(q))return {title:'Gewichtsverlust',rows:weightLoss()};
return {title:'Frage nicht erkannt',rows:[{d:'',txt:'Ich kann aktuell Fragen zu Fütterung, Gewicht, Verweigerungen, Gewichtsverlust, Futterbestand und Tierstatus beantworten.'}]}
}
function renderAnswer(ans){if(!ans)return '';return '<div class="tc2SubCard ok"><b>'+NGT500.esc(ans.title)+'</b></div>'+((ans.rows&&ans.rows.length)?NGTUI.list(ans.rows):'<p class="muted">Keine Treffer.</p>')}
window.NGTAIQuery={query,renderAnswer,needsFeeding,needsWeight,refusals,weightLoss,foodStock,animalStatus};
})();
