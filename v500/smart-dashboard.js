(function(){
'use strict';

const DAY=86400000;

function today0(){
 const d=new Date();
 d.setHours(0,0,0,0);
 return d;
}

function daysSince(date){
 const t=Date.parse(date||'');
 if(!t)return 9999;
 const d=new Date(t);
 d.setHours(0,0,0,0);
 return Math.floor((today0()-d)/DAY);
}

function latest(list){
 return (list||[])
  .slice()
  .sort(function(a,b){return String(b.date||'').localeCompare(String(a.date||''));})[0]||null;
}

function animals(){
 try{
  return NGTStore.allAnimals().filter(function(x){
   return !['Archiv','Verkauft','Abgegeben','Verstorben'].includes(x.a.status);
  });
 }catch(e){
  return [];
 }
}

function inventory(){
 try{
  return (NGTStore.data().foodInventory||[]).filter(function(x){
   return Number(x.qty||0)>0;
  });
 }catch(e){
  return [];
 }
}

function foodKey(s){
 return NGTStore.foodKey?NGTStore.foodKey(s):String(s||'').toLowerCase().replace(/\s+/g,'');
}

function foodLabel(s){
 return NGTStore.foodLabel?NGTStore.foodLabel(s):String(s||'');
}

function feedName(a){
 return a.defaultFeeder||a.futterStandard||a.standardFeed||'';
}

function feedInterval(a){
 return Math.max(1,Number(a.feedIntervalDays||a.feedingInterval||a.feedInterval||14));
}

function weightInterval(a){
 return Math.max(1,Number(a.weightIntervalDays||a.weightInterval||30));
}

function invQty(food){
 const k=foodKey(food);
 const item=inventory().find(function(x){
  return (x.key||foodKey(x.name||x.label))===k;
 });
 return item?Number(item.qty||0):0;
}

/*
 WICHTIG:
 Keine Erinnerungen ohne Historie.
 Ein Tier wird nur fällig, wenn bereits mindestens ein passender Eintrag existiert.
*/
function dueFeed(a,offset){
 const lf=latest(a.feeds);
 if(!lf||!lf.date)return false;
 return daysSince(lf.date)>=feedInterval(a)-offset;
}

function dueWeight(a,offset){
 const lw=latest(a.weights);
 if(!lw||!lw.date)return false;
 return daysSince(lw.date)>=weightInterval(a)-offset;
}

function plannedFeeds(offset){
 return animals()
  .filter(function(x){return dueFeed(x.a,offset);})
  .map(function(x){
   return {name:x.a.name||'Unbenannt',food:feedName(x.a),type:x.t};
  });
}

function plannedWeights(offset){
 return animals()
  .filter(function(x){return dueWeight(x.a,offset);})
  .map(function(x){
   return {name:x.a.name||'Unbenannt',type:x.t};
  });
}

function groupCounts(rows){
 const m={};
 rows.forEach(function(x){
  const food=x.food||'';
  if(!food)return;
  const k=foodKey(food);
  if(!m[k])m[k]={food:food,count:0};
  m[k].count++;
 });
 return Object.keys(m).map(function(k){
  return {food:m[k].food,count:m[k].count,stock:invQty(m[k].food)};
 });
}

function warnings(){
 const rows=[];
 animals().forEach(function(x){
  const a=x.a;

  const recentFeeds=(a.feeds||[])
   .slice()
   .sort(function(p,q){return String(q.date||'').localeCompare(String(p.date||''));})
   .slice(0,3);

  if(recentFeeds.length>=2&&recentFeeds.slice(0,2).every(function(f){return f.accepted===false;})){
   rows.push({level:3,txt:(a.name||'Unbenannt')+' hat wiederholt verweigert'});
  }

  const weights=(a.weights||[])
   .slice()
   .sort(function(p,q){return String(p.date||'').localeCompare(String(q.date||''));});

  if(weights.length>=2&&Number(weights[weights.length-1].weight)<Number(weights[weights.length-2].weight)){
   rows.push({level:3,txt:(a.name||'Unbenannt')+' hat Gewicht verloren'});
  }

  const lh=latest(a.health);
  if(lh&&String(lh.status||'').toLowerCase()!=='abgeschlossen'){
   rows.push({level:2,txt:(a.name||'Unbenannt')+' offene Gesundheit: '+(lh.title||lh.type||'Eintrag')});
  }
 });

 const tomorrow=plannedFeeds(1);
 groupCounts(tomorrow).forEach(function(x){
  if(x.food&&x.stock<x.count){
   rows.push({level:3,txt:foodLabel(x.food)+': morgen '+x.count+' benötigt, Bestand '+x.stock});
  }
 });

 return rows.sort(function(a,b){return b.level-a.level;});
}

function weekPlan(){
 let feeds=0;
 let weights=0;
 for(let i=0;i<7;i++){
  feeds+=plannedFeeds(i).length;
  weights+=plannedWeights(i).length;
 }
 return {feeds:feeds,weights:weights};
}

function shopping(){
 const need={};
 const label={};

 for(let i=0;i<7;i++){
  plannedFeeds(i).forEach(function(x){
   if(!x.food)return;
   const k=foodKey(x.food);
   need[k]=(need[k]||0)+1;
   label[k]=x.food;
  });
 }

 return Object.keys(need).map(function(k){
  const stock=invQty(label[k]);
  return {
   food:label[k],
   need:need[k],
   stock:stock,
   buy:Math.max(0,need[k]-stock)
  };
 });
}

function list(rows,empty){
 if(!rows.length)return '<p class="muted">'+NGT500.esc(empty)+'</p>';
 return rows.map(function(r){
  return '<div class="subcard">'+NGT500.esc(r)+'</div>';
 }).join('');
}

function render(){
 const rows=animals();
 const inv=inventory();

 if(!rows.length&&!inv.length){
  return `<div class="card">
   <h2>Smart Dashboard</h2>
   <p class="muted">Noch keine echten Daten vorhanden.</p>
   <div class="subcard">
    Lege Tiere oder Futterbestände an. Danach zeigt das Smart Dashboard ausschließlich deine gespeicherten Daten.
   </div>
  </div>`;
 }

 const warn=warnings();
 const todayF=plannedFeeds(0);
 const todayW=plannedWeights(0);
 const tomF=plannedFeeds(1);
 const tomW=plannedWeights(1);
 const week=weekPlan();
 const shop=shopping();

 const prep=groupCounts(tomF);

 const urgent=[
  ...warn.map(function(x){return x.txt;}),
  ...todayF.map(function(x){return 'Heute füttern: '+x.name+(x.food?' · '+foodLabel(x.food):'');}),
  ...todayW.map(function(x){return 'Heute wiegen: '+x.name;})
 ];

 const prepRows=[
  ...prep.map(function(x){return 'Morgen vorbereiten: '+x.count+' × '+foodLabel(x.food)+' (Bestand: '+x.stock+')';}),
  ...tomW.map(function(x){return 'Morgen wiegen: '+x.name;})
 ];

 const shopRows=shop
  .filter(function(x){return x.buy>0;})
  .map(function(x){
   return 'Nachkaufen: '+x.buy+' × '+foodLabel(x.food)+' (Bedarf 7 Tage: '+x.need+', Bestand: '+x.stock+')';
  });

 return `<div class="card">
  <h2>Smart Dashboard</h2>
  <div class="grid">
   <div class="stat">Tiere<b>${rows.length}</b></div>
   <div class="stat">Futterarten<b>${inv.length}</b></div>
   <div class="stat">Sofort<b>${urgent.length}</b></div>
   <div class="stat">Woche<b>${week.feeds+week.weights}</b></div>
  </div>
  <p class="muted">Es werden ausschließlich echte gespeicherte Daten angezeigt.</p>
 </div>

 <div class="card">
  <h2>Sofort erledigen</h2>
  ${list(urgent,'Aktuell nichts Dringendes.')}
 </div>

 <div class="card">
  <h2>Morgen vorbereiten</h2>
  ${list(prepRows,'Für morgen ist nichts vorzubereiten.')}
 </div>

 <div class="card">
  <h2>Diese Woche</h2>
  <div class="grid">
   <div class="stat">Fütterungen<b>${week.feeds}</b></div>
   <div class="stat">Gewicht<b>${week.weights}</b></div>
   <div class="stat">Warnungen<b>${warn.length}</b></div>
   <div class="stat">Einkauf<b>${shopRows.length}</b></div>
  </div>
 </div>

 <div class="card">
  <h2>Einkaufsplanung</h2>
  ${list(shopRows,'Für die nächsten 7 Tage reicht der erfasste Futterbestand.')}
 </div>`;
}

window.NGTSmartDashboard={
 render:render,
 warnings:warnings,
 plannedFeeds:plannedFeeds,
 plannedWeights:plannedWeights,
 shopping:shopping,
 weekPlan:weekPlan
};

})();
