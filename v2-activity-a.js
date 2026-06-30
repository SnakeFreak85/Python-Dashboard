(function(){
'use strict';
function wait(fn){if(window.NGTV2&&window.NGTData)fn();else setTimeout(function(){wait(fn);},100);}
function n(a){return a&&(a.name||a.nickname||a.rufname||a.displayId||a.uuid)||'Tier';}
function build(){
 const data=NGTData.load();const out=[];
 ['koenig','boas','geckos','spinnen'].forEach(function(t){(data[t]||[]).forEach(function(a){
  (a.feeds||[]).forEach(function(f){out.push({time:f.date||'',kind:'feed',text:n(a)+' '+(f.accepted===false?'verweigert':'gefressen'),animalId:a.uuid});});
  (a.weights||[]).forEach(function(w){out.push({time:w.date||'',kind:'weight',text:n(a)+' Gewicht '+(w.weight||'')+'g',animalId:a.uuid});});
  (a.sheds||[]).forEach(function(s){out.push({time:s.date||'',kind:'shed',text:n(a)+' Häutung',animalId:a.uuid});});
 });});
 return out.sort(function(a,b){return (Date.parse(b.time)||0)-(Date.parse(a.time)||0);}).slice(0,200);
}
wait(function(){window.NGTActivity=window.NGTActivity||{};window.NGTActivity.build=build;NGTV2.log('v2-activity-builder-ready');});
})();
