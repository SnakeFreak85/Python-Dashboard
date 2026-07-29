(function(){
'use strict';

function esc(value){
 return NGT500.esc(value||'');
}

function number(value){
 const parsed=Number(value);
 return Number.isFinite(parsed)?parsed:0;
}

function latest(list){
 return AnimalEngine.latest(list);
}

function activeAnimals(){
 try{
  return NGTStore.allAnimals()
   .filter(function(row){
    return ![
     'Archiv',
     'Verkauft',
     'Abgegeben',
     'Verstorben'
    ].includes(row.a.status);
   });
 }catch(error){
  return [];
 }
}

function money(value){
 if(window.NGT500&&NGT500.money){
  return NGT500.money(number(value));
 }

 return number(value).toLocaleString('de-DE',{
  style:'currency',
  currency:'EUR'
 });
}

function percent(part,total){
 return total
  ?Math.round((part/total)*100)
  :0;
}

function safeMarket(animal){
 try{
  return NGTStore.market
   ?number(NGTStore.market(animal))
   :0;
 }catch(error){
  return 0;
 }
}

function analyticsData(){
 const animals=activeAnimals();

 const result={
  animals:animals,
  feeds:0,
  accepted:0,
  refused:0,
  sheds:0,
  weights:0,
  health:0,
  photos:0,
  buyValue:0,
  marketValue:0,
  weightRows:[],
  latestFeedRows:[],
  species:{},
  status:{}
 };

 animals.forEach(function(row){
  const animal=row.a||{};
  const feeds=Array.isArray(animal.feeds)?animal.feeds:[];
  const sheds=Array.isArray(animal.sheds)?animal.sheds:[];
  const weights=Array.isArray(animal.weights)?animal.weights:[];
  const health=Array.isArray(animal.health)?animal.health:[];
  const photos=Array.isArray(animal.photos)?animal.photos:[];

  result.feeds+=feeds.length;
  result.accepted+=feeds.filter(function(feed){
   return feed.accepted!==false;
  }).length;

  result.refused+=feeds.filter(function(feed){
   return feed.accepted===false;
  }).length;

  result.sheds+=sheds.length;
  result.weights+=weights.length;
  result.health+=health.length;
  result.photos+=photos.length;
  result.buyValue+=number(animal.buyPrice);
  result.marketValue+=safeMarket(animal);

  const group=animal.animalGroup||'Unsortiert';
  result.species[group]=(result.species[group]||0)+1;

  const status=animal.status||'Unbekannt';
  result.status[status]=(result.status[status]||0)+1;

  const sortedWeights=
   AnimalEngine.sortHistory(
    weights,
    'asc'
   );

  if(sortedWeights.length>=2){
   const first=sortedWeights[0];
   const lastWeight=sortedWeights[sortedWeights.length-1];
   const difference=number(lastWeight.weight)-number(first.weight);

   result.weightRows.push({
    name:animal.name||animal.publicId||'Unbenannt',
    date:lastWeight.date||'',
    current:number(lastWeight.weight),
    difference:difference
   });
  }

  const lastFeed=latest(feeds);

  if(lastFeed){
   result.latestFeedRows.push({
    name:animal.name||animal.publicId||'Unbenannt',
    date:lastFeed.date||'',
    accepted:lastFeed.accepted!==false,
    label:AnimalEngine.formatFeedEvent(
     lastFeed,
     {
      includeStatus:false
     }
    )
   });
  }
 });

 result.weightRows.sort(function(a,b){
  return Math.abs(b.difference)-Math.abs(a.difference);
 });

 result.latestFeedRows.sort(function(a,b){
  return String(b.date||'').localeCompare(String(a.date||''));
 });

 return result;
}

function kpi(icon,label,value,sub,cls){
 return `<article class="tc2AnalyticsKpi ${cls||''}">
  <span class="tc2AnalyticsKpiIcon">${icon}</span>

  <div>
   <small>${esc(label)}</small>
   <b>${esc(value)}</b>
   ${sub?`<em>${esc(sub)}</em>`:''}
  </div>
 </article>`;
}

function progressRow(label,value,max,meta,cls){
 const percentValue=max>0
  ?Math.max(4,Math.round((value/max)*100))
  :0;

 return `<div class="tc2AnalyticsProgressRow">
  <div class="tc2AnalyticsProgressHead">
   <b>${esc(label)}</b>
   <span>${esc(meta||value)}</span>
  </div>

  <div class="tc2AnalyticsProgress">
   <i
    class="${cls||''}"
    style="width:${percentValue}%"
   ></i>
  </div>
 </div>`;
}

function distributionCard(title,rows){
 if(!rows.length){
  return `<section class="tc2AnalyticsCard">
   <div class="tc2AnalyticsCardHead">
    <h3>${esc(title)}</h3>
   </div>

   <div class="tc2AnalyticsEmpty">
    Noch keine Daten vorhanden.
   </div>
  </section>`;
 }

 const max=Math.max.apply(
  null,
  rows.map(function(row){
   return row.value;
  }).concat([1])
 );

 return `<section class="tc2AnalyticsCard">
  <div class="tc2AnalyticsCardHead">
   <h3>${esc(title)}</h3>
  </div>

  <div class="tc2AnalyticsProgressList">
   ${rows.map(function(row,index){
    const classes=[
     'green',
     'blue',
     'orange',
     'purple'
    ];

    return progressRow(
     row.label,
     row.value,
     max,
     row.value,
     classes[index%classes.length]
    );
   }).join('')}
  </div>
 </section>`;
}

function weightTable(rows){
 if(!rows.length){
  return `<div class="tc2AnalyticsEmpty">
   Für eine Gewichtsentwicklung werden mindestens zwei
   Messungen pro Tier benötigt.
  </div>`;
 }

 return `<div class="tc2AnalyticsList">
  ${rows.slice(0,10).map(function(row){
   const positive=row.difference>0;
   const negative=row.difference<0;

   return `<article class="tc2AnalyticsListRow">
    <div>
     <b>${esc(row.name)}</b>
     <small>
      ${esc(row.date||'-')} · ${row.current} g
     </small>
    </div>

    <span class="${
     positive
      ?'ok'
      :(negative?'danger':'')
    }">
     ${
      row.difference>0
       ?'+'
       :''
     }${row.difference} g
    </span>
   </article>`;
  }).join('')}
 </div>`;
}

function feedTable(rows){
 if(!rows.length){
  return `<div class="tc2AnalyticsEmpty">
   Noch keine Fütterungen vorhanden.
  </div>`;
 }

 return `<div class="tc2AnalyticsList">
  ${rows.slice(0,10).map(function(row){
   return `<article class="tc2AnalyticsListRow">
    <div>
     <b>${esc(row.name)}</b>
     <small>
      ${esc(row.date||'-')}
      ${row.label?' · '+esc(row.label):''}
     </small>
    </div>

    <span class="${row.accepted?'ok':'danger'}">
     ${row.accepted?'Gefressen':'Verweigert'}
    </span>
   </article>`;
  }).join('')}
 </div>`;
}

function render(){
 const data=analyticsData();

 const feedRate=percent(
  data.accepted,
  data.feeds
 );

 const refusedRate=percent(
  data.refused,
  data.feeds
 );

 const valueDifference=
  data.marketValue-
  data.buyValue;

 const speciesRows=Object.keys(data.species)
  .sort(function(a,b){
   return data.species[b]-data.species[a];
  })
  .map(function(label){
   return {
    label:label,
    value:data.species[label]
   };
  });

 const statusRows=Object.keys(data.status)
  .sort(function(a,b){
   return data.status[b]-data.status[a];
  })
  .map(function(label){
   return {
    label:label,
    value:data.status[label]
   };
  });

 return `<section class="tc2AnalyticsPage">
  <header class="tc2AnalyticsHero">
   <div>
    <h2>📊 Analyse</h2>
    <p>
     Bestand, Fütterungen, Gewicht und Werte auf einen Blick.
    </p>
   </div>
  </header>

  <section class="tc2AnalyticsKpiGrid">
   ${kpi(
    '🐾',
    'Aktive Tiere',
    data.animals.length,
    'im aktuellen Bestand',
    'green'
   )}

   ${kpi(
    '🍽️',
    'Fütterungsquote',
    feedRate+' %',
    data.accepted+' von '+data.feeds+' gefressen',
    'blue'
   )}

   ${kpi(
    '⚖️',
    'Gewichtseinträge',
    data.weights,
    'gespeicherte Messungen',
    'orange'
   )}

   ${kpi(
    '📷',
    'Fotos',
    data.photos,
    'gespeicherte Tierfotos',
    'purple'
   )}
  </section>

  <section class="tc2AnalyticsGrid">
   <section class="tc2AnalyticsCard">
    <div class="tc2AnalyticsCardHead">
     <div>
      <h3>Fütterungen</h3>
      <p>Auswertung aller gespeicherten Fütterungen.</p>
     </div>
    </div>

    <div class="tc2AnalyticsStats">
     <div>
      <small>Gesamt</small>
      <b>${data.feeds}</b>
     </div>

     <div>
      <small>Gefressen</small>
      <b>${data.accepted}</b>
     </div>

     <div>
      <small>Verweigert</small>
      <b>${data.refused}</b>
     </div>

     <div>
      <small>Verweigerungsquote</small>
      <b>${refusedRate} %</b>
     </div>
    </div>

    <div class="tc2AnalyticsProgressList">
     ${progressRow(
      'Gefressen',
      data.accepted,
      Math.max(data.feeds,1),
      feedRate+' %',
      'green'
     )}

     ${progressRow(
      'Verweigert',
      data.refused,
      Math.max(data.feeds,1),
      refusedRate+' %',
      'orange'
     )}
    </div>
   </section>

   <section class="tc2AnalyticsCard">
    <div class="tc2AnalyticsCardHead">
     <div>
      <h3>Pflegeaktivitäten</h3>
      <p>Gespeicherte Einträge nach Bereich.</p>
     </div>
    </div>

    <div class="tc2AnalyticsStats">
     <div>
      <small>Häutungen</small>
      <b>${data.sheds}</b>
     </div>

     <div>
      <small>Gesundheit</small>
      <b>${data.health}</b>
     </div>

     <div>
      <small>Gewichte</small>
      <b>${data.weights}</b>
     </div>

     <div>
      <small>Fotos</small>
      <b>${data.photos}</b>
     </div>
    </div>
   </section>
  </section>

  <section class="tc2AnalyticsGrid">
   ${distributionCard(
    'Bestand nach Tiergruppe',
    speciesRows
   )}

   ${distributionCard(
    'Bestand nach Status',
    statusRows
   )}
  </section>

  <section class="tc2AnalyticsCard">
   <div class="tc2AnalyticsCardHead">
    <div>
     <h3>💰 Wertanalyse</h3>
     <p>
      Kaufwerte und geschätzter Marktwert des aktiven Bestands.
     </p>
    </div>
   </div>

   <div class="tc2AnalyticsValueGrid">
    <div>
     <small>Kaufwert</small>
     <b>${esc(money(data.buyValue))}</b>
    </div>

    <div>
     <small>Schätzwert</small>
     <b>${esc(money(data.marketValue))}</b>
    </div>

    <div class="${
     valueDifference<0
      ?'danger'
      :'ok'
    }">
     <small>Differenz</small>
     <b>${esc(money(valueDifference))}</b>
    </div>
   </div>
  </section>

  <section class="tc2AnalyticsGrid">
   <section class="tc2AnalyticsCard">
    <div class="tc2AnalyticsCardHead">
     <div>
      <h3>⚖️ Gewichtsentwicklung</h3>
      <p>
       Tiere mit mindestens zwei gespeicherten Messungen.
      </p>
     </div>
    </div>

    ${weightTable(data.weightRows)}
   </section>

   <section class="tc2AnalyticsCard">
    <div class="tc2AnalyticsCardHead">
     <div>
      <h3>🍽️ Letzte Fütterungen</h3>
      <p>
       Die zuletzt dokumentierten Fütterungen.
      </p>
     </div>
    </div>

    ${feedTable(data.latestFeedRows)}
   </section>
  </section>
 </section>`;
}

NGT500.register('analytics',{
 render:render
});

})();
