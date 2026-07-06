(function(){
'use strict';

const DAY=86400000;

function esc(v){return NGT500.esc(v||'')}

function today0(){
  const d=new Date();
  d.setHours(0,0,0,0);
  return d;
}

function daysSince(date){
  const t=Date.parse(date||'');
  if(!t)return null;
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

function dueFeed(a,offset){
  const lf=latest(a.feeds);
  const days=daysSince(lf&&lf.date);
  if(days===null)return false;
  return days>=feedInterval(a)-offset;
}

function dueWeight(a,offset){
  const lw=latest(a.weights);
  const days=daysSince(lw&&lw.date);
  if(days===null)return false;
  return days>=weightInterval(a)-offset;
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

  groupCounts(plannedFeeds(1)).forEach(function(x){
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

function groupRows(){
  const rows=[];
  const all=animals();

  (NGTStore.TYPES||[]).forEach(function(t){
    const count=all.filter(function(x){return x.t===t}).length;
    if(count>0){
      rows.push({
        t:t,
        count:count,
        label:(NGTStore.LABELS&&NGTStore.LABELS[t])?NGTStore.LABELS[t]:t
      });
    }
  });

  return rows;
}

function item(icon,title,sub){
  return `<div class="tc2SmartItem">
    <span>${icon}</span>
    <div>
      <b>${esc(title)}</b>
      <small>${esc(sub||'')}</small>
    </div>
  </div>`;
}

function compactList(rows,empty,icon){
  if(!rows.length){
    return `<div class="tc2SmartEmpty">${esc(empty)}</div>`;
  }

  return rows.slice(0,5).map(function(r){
    return item(icon||'•',r,'');
  }).join('');
}

function render(){
  const rows=animals();
  const inv=inventory();
  const warn=warnings();
  const todayF=plannedFeeds(0);
  const todayW=plannedWeights(0);
  const tomF=plannedFeeds(1);
  const tomW=plannedWeights(1);
  const week=weekPlan();
  const shop=shopping().filter(function(x){return x.buy>0;});
  const groups=groupRows();

  const urgent=[
    ...warn.map(function(x){return x.txt;}),
    ...todayF.map(function(x){return 'Füttern: '+x.name+(x.food?' · '+foodLabel(x.food):'');}),
    ...todayW.map(function(x){return 'Wiegen: '+x.name;})
  ];

  const tomorrow=[
    ...groupCounts(tomF).map(function(x){
      return x.count+' × '+foodLabel(x.food)+' vorbereiten · Bestand '+x.stock;
    }),
    ...tomW.map(function(x){return 'Wiegen: '+x.name;})
  ];

  return `
    <section class="tc2SmartPage">
      <header class="tc2SmartTop">
  <button onclick="NGT500.route('dashboard')">‹</button>
  <div>
    <h2>Smart Dashboard</h2>
    <p>Analyse aus echten TerraControl-Daten</p>
  </div>
  <span>TC</span>
</header>

      <div class="tc2SmartKpis">
  <div>
    <span>🐍</span>
    <b>${rows.length}</b>
    <small>Tiere</small>
  </div>
  <div>
    <span>🥩</span>
    <b>${inv.length}</b>
    <small>Futter</small>
  </div>
  <div>
    <span>🔴</span>
    <b>${urgent.length}</b>
    <small>Sofort</small>
  </div>
  <div>
    <span>📅</span>
    <b>${week.feeds+week.weights}</b>
    <small>Woche</small>
  </div>
</div>

      <section class="tc2SmartPanel">
        <h3>Heute wichtig</h3>
        ${compactList(urgent,'Aktuell nichts Dringendes.','🔴')}
      </section>

      <section class="tc2SmartPanel">
        <h3>Morgen vorbereiten</h3>
        ${compactList(tomorrow,'Für morgen ist nichts vorzubereiten.','🟠')}
      </section>

      <section class="tc2SmartPanel">
        <h3>Bestand</h3>
        ${
          groups.length
            ? `<div class="tc2SmartRows">
                ${groups.map(function(g){
                  return `<button onclick="NGT500.route('animals',{t:'${g.t}'})">
                    <span>${esc(g.label.replace(/^.\s*/,''))}</span>
                    <b>${g.count}</b>
                  </button>`;
                }).join('')}
              </div>`
            : `<div class="tc2SmartEmpty">Noch keine Tiere im Bestand.</div>`
        }
      </section>

      <section class="tc2SmartPanel">
        <h3>Diese Woche</h3>
        <div class="tc2SmartRows">
          <div><span>Fütterungen</span><b>${week.feeds}</b></div>
          <div><span>Gewichte</span><b>${week.weights}</b></div>
          <div><span>Warnungen</span><b>${warn.length}</b></div>
          <div><span>Futterarten</span><b>${inv.length}</b></div>
        </div>
      </section>

      <section class="tc2SmartPanel">
        <h3>Einkaufsplanung</h3>
        ${
          shop.length
            ? shop.slice(0,5).map(function(x){
                return item('🥩','Nachkaufen: '+x.buy+' × '+foodLabel(x.food),'Bedarf 7 Tage: '+x.need+' · Bestand: '+x.stock);
              }).join('')
            : `<div class="tc2SmartEmpty">Der erfasste Futterbestand reicht für die nächsten 7 Tage.</div>`
        }
      </section>
    </section>
  `;
}

window.NGTSmartDashboard={
  render:render,
  warnings:warnings,
  plannedFeeds:plannedFeeds,
  plannedWeights:plannedWeights,
  shopping:shopping,
  weekPlan:weekPlan
};

if(window.NGT500){
  NGT500.register('smartDashboard',{render:render});
}

})();