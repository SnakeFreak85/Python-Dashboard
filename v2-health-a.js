(function(){
'use strict';
function wait(fn){if(window.NGTV2&&window.NGTData)fn();else setTimeout(function(){wait(fn);},100);}
function list(v){return Array.isArray(v)?v:[];}
function byDate(a,b){return (Date.parse(a.date||'')||0)-(Date.parse(b.date||'')||0);}
function fixAnimal(a,type,i){
 if(!a||typeof a!=='object')return a;
 a.uuid=a.uuid||a.uid||('ngt-'+Date.now().toString(36)+'-'+Math.random().toString(36).slice(2));
 a.uid=a.uid||a.uuid;
 a.type=a.type||type;
 a.displayId=a.displayId||type+'-'+String(i+1).padStart(3,'0');
 a.feeds=list(a.feeds).sort(byDate);
 a.weights=list(a.weights).sort(byDate);
 a.sheds=list(a.sheds).sort(byDate);
 a.defaultFeeder=a.defaultFeeder||a.futterStandard||a.standardFeed||'';
 a.feeds.forEach(function(f){if(f.accepted===undefined)f.accepted=true;f.status=f.accepted===false?'Verweigert':'Gefressen';});
 return a;
}
function repair(){
 const data=NGTData.load();
 ['koenig','boas','geckos','spinnen'].forEach(function(t){data[t]=list(data[t]).map(function(a,i){return fixAnimal(a,t,i);});});
 ['clutches','sales','archive','foodInventory'].forEach(function(k){data[k]=list(data[k]);});
 data.__healthCheckedAt=new Date().toISOString();
 NGTData.save(data,'v2-health');
 NGTV2.emit('health:checked',{});
 return data;
}
wait(function(){window.NGTHealth={repair:repair};repair();NGTV2.log('v2-health-ready');});
})();
