(function(){
'use strict';

function daysSince(date){
 return AnimalEngine.daysSinceOr(
  date,
  9999
 );
}

function latest(list){
 return AnimalEngine.latest(list);
}

function animals(){
 return NGTStore
  .allAnimals()
  .filter(function(row){
   return row.a.status!=='Archiv';
  });
}

function rec(
 type,
 level,
 title,
 text,
 animal
){
 return {
  type:type,
  level:level,
  title:title,
  text:text,
  animal:animal||'',
  d:''
 };
}

function animalRecommendations(
 animal,
 out
){
 const latestHealth=latest(
  animal.health
 );
 const feedState=
  CareRulesEngine.feedDueState(
   animal
  );
 const weightState=
  CareRulesEngine.weightDueState(
   animal
  );

 if(feedState.due){
  if(feedState.missing){
   out.push(
    rec(
     'feeding',
     'warn',
     animal.name,
     'Noch keine Fütterung dokumentiert.',
     animal.name
    )
   );
  }else{
   out.push(
    rec(
     'feeding',
     feedState.overdueDays>=14
      ?'danger'
      :'warn',
     animal.name,
     'Fütterung prüfen: letzte Fütterung vor '+
      feedState.days+
      ' Tagen.',
     animal.name
    )
   );
  }
 }

 const feeds=AnimalEngine.sortHistory(
  animal.feeds,
  'desc'
 );
 const lastThree=feeds.slice(0,3);

 if(
  lastThree.length>=3&&
  lastThree.every(function(feed){
   return feed.accepted===false;
  })
 ){
  out.push(
   rec(
    'refusal',
    'danger',
    animal.name,
    'Drei Verweigerungen in Folge.',
    animal.name
   )
  );
 }else if(
  lastThree.length>=2&&
  lastThree
   .slice(0,2)
   .every(function(feed){
    return feed.accepted===false;
   })
 ){
  out.push(
   rec(
    'refusal',
    'warn',
    animal.name,
    'Zwei Verweigerungen in Folge.',
    animal.name
   )
  );
 }

 const weights=AnimalEngine.sortHistory(
  animal.weights,
  'asc'
 );

 if(weightState.due){
  out.push(
   rec(
    'weight',
    'warn',
    animal.name,
    weightState.missing
     ?'Noch kein Gewicht dokumentiert.'
     :'Gewicht seit '+
       weightState.days+
       ' Tagen nicht aktualisiert.',
    animal.name
   )
  );
 }

 if(weights.length>=2){
  const previous=Number(
   weights[weights.length-2].weight||
   0
  );
  const current=Number(
   weights[weights.length-1].weight||
   0
  );

  if(previous&&current<previous){
   const difference=current-previous;

   out.push(
    rec(
     'weight',
     'danger',
     animal.name,
     'Gewichtsverlust: '+
      difference+
      'g seit letzter Messung.',
     animal.name
    )
   );
  }
 }

 const health=AnimalEngine.sortHistory(
  animal.health,
  'desc'
 );
 const open=health.filter(function(entry){
  return String(
   entry.status||
   ''
  ).toLowerCase()!=='abgeschlossen';
 });

 if(open.length){
  out.push(
   rec(
    'health',
    'warn',
    animal.name,
    'Offene Gesundheits-/Kontroll-Einträge: '+
     open.length+
     '.',
    animal.name
   )
  );
 }

 if(
  latestHealth&&
  String(
   latestHealth.type||
   ''
  ).toLowerCase().includes('kontrolle')&&
  daysSince(latestHealth.date)>=30
 ){
  out.push(
   rec(
    'health',
    'warn',
    animal.name,
    'Letzte Kontrolle vor '+
     daysSince(latestHealth.date)+
     ' Tagen.',
    animal.name
   )
  );
 }
}

function foodRecommendations(out){
 FoodInventoryEngine
  .sortInventory(
   NGTStore.data().foodInventory||
   []
  )
  .filter(function(item){
   return FoodInventoryEngine
    .needsRestock(item);
  })
  .forEach(function(item){
   const quantity=
    FoodInventoryEngine.quantity(item);

   out.push(
    rec(
     'food',
     quantity<=0
      ?'danger'
      :'warn',
     'Futterbestand',
     quantity<=0
      ?item.name+' ist leer.'
      :item.name+
       ' ist niedrig ('+
       quantity+
       ').'
    )
   );
  });
}

function build(){
 const out=[];

 animals().forEach(function(row){
  animalRecommendations(
   row.a,
   out
  );
 });

 foodRecommendations(out);

 return out.sort(function(a,b){
  return levelRank(b.level)-
   levelRank(a.level);
 });
}

function levelRank(level){
 return level==='danger'
  ?2
  :level==='warn'
   ?1
   :0;
}

function render(items){
 items=items||build();

 if(!items.length){
  return '<p class="muted">Keine Empfehlungen.</p>';
 }

 return items.map(function(item){
  return `<div class="tc2SubCard ${
   item.level==='danger'
    ?'danger'
    :'ok'
  }">
   <b>${NGT500.esc(item.title)}</b>
   <br>
   ${NGT500.esc(item.text)}
  </div>`;
 }).join('');
}

function textSummary(){
 const items=build();

 if(!items.length){
  return 'Keine aktuellen Empfehlungen.';
 }

 return items.map(function(item){
  return item.title+': '+item.text;
 }).join('\n');
}

window.NGTAIRecommendations={
 build:build,
 render:render,
 textSummary:textSummary
};

})();
