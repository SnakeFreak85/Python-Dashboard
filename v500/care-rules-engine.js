(function(){
'use strict';

function positiveInteger(value){
 const parsed=Number(value);

 return (
  Number.isFinite(parsed)&&
  parsed>=1
 )
  ?Math.round(parsed)
  :null;
}

function feedInterval(animal){
 animal=animal||{};

 if(animal.feedIntervalEnabled===false){
  return null;
 }

 return positiveInteger(
  animal.feedIntervalDays ??
  animal.feedInterval ??
  animal.feedingInterval
 );
}

function weightInterval(animal){
 animal=animal||{};

 if(animal.weightIntervalEnabled===false){
  return null;
 }

 return positiveInteger(
  animal.weightIntervalDays ??
  animal.weightInterval
 );
}

function feedEnabled(animal){
 return feedInterval(animal)!==null;
}

function weightEnabled(animal){
 return weightInterval(animal)!==null;
}

function historyFor(animal,type){
 if(type==='feed'){
  return animal.feeds;
 }

 if(type==='weight'){
  return animal.weights;
 }

 return [];
}

function intervalFor(animal,type){
 return type==='feed'
  ?feedInterval(animal)
  :weightInterval(animal);
}

function dueState(animal,type,options){
 animal=animal||{};
 options=options||{};

 const interval=intervalFor(
  animal,
  type
 );

 if(interval===null){
  return {
   type:type,
   enabled:false,
   due:false,
   missing:false,
   invalid:false,
   interval:null,
   days:null,
   overdueDays:null,
   status:'disabled'
  };
 }

 const latest=AnimalEngine.latest(
  historyFor(animal,type)
 );

 if(!latest){
  return {
   type:type,
   enabled:true,
   due:true,
   missing:true,
   invalid:false,
   interval:interval,
   days:null,
   overdueDays:null,
   status:'missing'
  };
 }

 const days=AnimalEngine.daysSince(
  latest.date,
  options.now
 );

 if(days===null){
  return {
   type:type,
   enabled:true,
   due:false,
   missing:false,
   invalid:true,
   interval:interval,
   days:null,
   overdueDays:null,
   status:'invalid'
  };
 }

 const offset=Math.max(
  0,
  Number(options.offsetDays||0)
 );
 const due=
  days>=Math.max(
   0,
   interval-offset
  );

 return {
  type:type,
  enabled:true,
  due:due,
  missing:false,
  invalid:false,
  interval:interval,
  days:days,
  overdueDays:Math.max(
   0,
   days-interval
  ),
  status:due?'due':'scheduled'
 };
}

function feedDueState(animal,options){
 return dueState(
  animal,
  'feed',
  options
 );
}

function weightDueState(animal,options){
 return dueState(
  animal,
  'weight',
  options
 );
}

function isFeedDue(animal,options){
 return feedDueState(
  animal,
  options
 ).due;
}

function isWeightDue(animal,options){
 return weightDueState(
  animal,
  options
 ).due;
}

function sortedHistory(list){
 return (
  Array.isArray(list)
   ?list
   :[]
 )
  .slice()
  .sort(function(a,b){
   return String(a.date||'')
    .localeCompare(
     String(b.date||'')
    );
  });
}

function healthStatus(animal,options){
 animal=animal||{};
 options=options||{};

 let score=0;
 const reasons=[];
 const feeds=sortedHistory(
  animal.feeds
 );
 const weights=sortedHistory(
  animal.weights
 );
 const latestHealth=AnimalEngine.latest(
  animal.health
 );
 const recentFeeds=feeds
  .slice()
  .reverse()
  .slice(0,2);

 if(
  recentFeeds.length>=2&&
  recentFeeds.every(function(feed){
   return feed.accepted===false;
  })
 ){
  score+=2;
  reasons.push('wiederholte Futterverweigerung');
 }

 if(
  weights.length>=2&&
  Number(weights[weights.length-1].weight)<
  Number(weights[weights.length-2].weight)
 ){
  score+=2;
  reasons.push('Gewichtsverlust');
 }

 const feedState=feedDueState(
  animal,
  options
 );

 if(
  feedState.enabled&&
  !feedState.missing&&
  feedState.days>=feedState.interval+7
 ){
  score+=1;
  reasons.push('Fütterung überfällig');
 }

 const weightState=weightDueState(
  animal,
  options
 );

 if(
  weightState.enabled&&
  !weightState.missing&&
  weightState.days>=weightState.interval+15
 ){
  score+=1;
  reasons.push('Gewichtskontrolle überfällig');
 }

 if(
  latestHealth&&
  String(
   latestHealth.status||
   ''
  ).toLowerCase()!=='abgeschlossen'
 ){
  score+=1;
  reasons.push('offener Gesundheitseintrag');
 }

 if(score>=3){
  return {
   score:score,
   reasons:reasons,
   txt:'Handlungsbedarf',
   icon:'🔴',
   cls:'danger'
  };
 }

 if(score>=1){
  return {
   score:score,
   reasons:reasons,
   txt:'Beobachten',
   icon:'🟡',
   cls:'warn'
  };
 }

 return {
  score:score,
  reasons:reasons,
  txt:'Alles in Ordnung',
  icon:'🟢',
  cls:'ok'
 };
}

window.CareRulesEngine={
 positiveInteger:positiveInteger,
 feedInterval:feedInterval,
 weightInterval:weightInterval,
 feedEnabled:feedEnabled,
 weightEnabled:weightEnabled,
 dueState:dueState,
 feedDueState:feedDueState,
 weightDueState:weightDueState,
 isFeedDue:isFeedDue,
 isWeightDue:isWeightDue,
 healthStatus:healthStatus
};

})();
