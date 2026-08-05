(function(){
'use strict';

function text(value){
 return String(
  value==null
   ?''
   :value
 ).trim();
}

function positiveInteger(value){
 const parsed=Number(value);

 return (
  Number.isSafeInteger(parsed)&&
  parsed>=1
 )
  ?parsed
  :null;
}

function dateParts(value){
 const match=text(value).match(
  /^(\d{4})-(\d{2})-(\d{2})/
 );

 if(!match){
  return null;
 }

 const year=Number(match[1]);
 const month=Number(match[2]);
 const day=Number(match[3]);
 const date=new Date(
  Date.UTC(
   year,
   month-1,
   day
  )
 );

 if(
  date.getUTCFullYear()!==year||
  date.getUTCMonth()!==month-1||
  date.getUTCDate()!==day
 ){
  return null;
 }

 return {
  year:year,
  month:month,
  day:day,
  time:date.getTime()
 };
}

function isoDate(value){
 const parts=dateParts(value);

 if(!parts){
  return '';
 }

 return [
  String(parts.year).padStart(4,'0'),
  String(parts.month).padStart(2,'0'),
  String(parts.day).padStart(2,'0')
 ].join('-');
}

function formatDate(value){
 const parts=dateParts(value);

 if(!parts){
  return '-';
 }

 return [
  String(parts.day).padStart(2,'0'),
  String(parts.month).padStart(2,'0'),
  String(parts.year).padStart(4,'0')
 ].join('/');
}

function addDays(value,days){
 const parts=dateParts(value);
 const amount=positiveInteger(days);

 if(!parts||amount===null){
  return '';
 }

 return new Date(
  parts.time+
  amount*86400000
 )
  .toISOString()
  .slice(0,10);
}

function todayIso(now){
 if(typeof now==='string'){
  return isoDate(now);
 }

 const date=
  now instanceof Date
   ?now
   :new Date();

 return [
  date.getFullYear(),
  String(date.getMonth()+1).padStart(2,'0'),
  String(date.getDate()).padStart(2,'0')
 ].join('-');
}

function acceptedFeeds(animal){
 return (
  Array.isArray(animal&&animal.feeds)
   ?animal.feeds
   :[]
 )
  .map(function(feed){
   return AnimalEngine.normalizeFeedEvent(
    feed
   );
  })
  .filter(function(feed){
   return (
    feed.accepted!==false&&
    !!dateParts(feed.date)
   );
  })
  .sort(function(a,b){
   return String(a.date)
    .localeCompare(
     String(b.date)
    );
  });
}

function observedInterval(feeds){
 if(feeds.length<2){
  return null;
 }

 const gaps=[];

 for(
  let index=1;
  index<feeds.length;
  index+=1
 ){
  const previous=dateParts(
   feeds[index-1].date
  );

  const current=dateParts(
   feeds[index].date
  );

  if(!previous||!current){
   continue;
  }

  const gap=Math.round(
   (
    current.time-
    previous.time
   )/
   86400000
  );

  if(gap>=1&&gap<=365){
   gaps.push(gap);
  }
 }

 if(!gaps.length){
  return null;
 }

 const recent=gaps
  .slice(-5)
  .sort(function(a,b){
   return a-b;
  });

 const middle=Math.floor(
  recent.length/2
 );

 if(recent.length%2){
  return recent[middle];
 }

 return Math.round(
  (
   recent[middle-1]+
   recent[middle]
  )/
  2
 );
}

function inventoryItems(inventory){
 return FoodInventoryEngine.sortInventory(
  Array.isArray(inventory)
   ?inventory
   :[]
 );
}

function inventoryById(inventory,id){
 if(!id){
  return null;
 }

 return FoodInventoryEngine.findById(
  inventory,
  id
 );
}

function resolveFood(
 animal,
 inventory,
 feeds
){
 const latest=
  feeds[feeds.length-1]||
  null;

 const preferredId=text(
  animal.defaultFeederId||
  animal.foodInventoryId||
  latest&&latest.foodInventoryId
 );

 let item=inventoryById(
  inventory,
  preferredId
 );

 const legacyLabel=text(
  animal.defaultFeeder||
  animal.futterStandard||
  animal.standardFeed
 );

 if(!item&&legacyLabel){
  const normalizedLegacy=
   legacyLabel.toLocaleLowerCase('de');

  item=inventory.find(function(candidate){
   return (
    FoodInventoryEngine
     .itemLabel(candidate)
     .toLocaleLowerCase('de')===
    normalizedLegacy
   );
  })||null;
 }

 let matchingFeed=null;

 if(item){
  matchingFeed=feeds
   .slice()
   .reverse()
   .find(function(feed){
    return (
     String(feed.foodInventoryId||'')===
     String(item.id||'')
    );
   })||null;
 }

 if(!matchingFeed){
  matchingFeed=latest;
 }

 const label=
  item
   ?FoodInventoryEngine.itemLabel(item)
   :text(
    matchingFeed&&(
     matchingFeed.displayLabel||
     matchingFeed.label
    )||
    legacyLabel
   );

 return {
  item:item,
  feed:matchingFeed,
  label:label,
  quantity:
   positiveInteger(
    matchingFeed&&matchingFeed.quantity
   )||
   1
 };
}

function recommendationIcon(label){
 const value=text(label)
  .toLocaleLowerCase('de');

 if(
  /ratte|maus|mäus|vzm/.test(value)
 ){
  return '🐭';
 }

 if(
  /heimchen|grille|schabe|heuschrecke|insekt|larve|wurm/.test(value)
 ){
  return '🦗';
 }

 if(/fisch/.test(value)){
  return '🐟';
 }

 return '🍽️';
}

function recommendation(
 animal,
 inventory,
 options
){
 animal=animal||{};
 options=options||{};

 const feeds=acceptedFeeds(animal);
 const allInventory=inventoryItems(
  inventory
 );
 const food=resolveFood(
  animal,
  allInventory,
  feeds
 );

 const configuredInterval=
  CareRulesEngine.feedInterval(
   animal
  );

 const learnedInterval=
  observedInterval(
   feeds
  );

 const interval=
  configuredInterval||
  learnedInterval;

 const latestAny=
  AnimalEngine.latest(
   animal.feeds
  );

 const latestDate=
  latestAny&&
  isoDate(latestAny.date);

 const nextDate=
  latestDate&&interval
   ?addDays(
    latestDate,
    interval
   )
   :'';

 const today=todayIso(
  options.now
 );

 let state='ok';
 let nextText='Noch nicht berechenbar';

 if(!food.label){
  return {
   available:false,
   state:'incomplete',
   icon:'🍽️',
   heading:'Futterempfehlung',
   primary:'Noch nicht verfügbar',
   intervalText:
    'Standardfutter oder erste Fütterung hinterlegen',
   nextLabel:'Nächste Fütterung',
   nextText:'Noch nicht berechenbar',
   basis:
    'Die App verwendet nur deine hinterlegten Tier- und Verlaufsdaten.'
  };
 }

 if(interval===null){
  state='incomplete';
  nextText='Intervall hinterlegen';
 }else if(!latestDate){
  state='warn';
  nextText='Erste Fütterung eintragen';
 }else if(nextDate){
  const difference=Math.round(
   (
    dateParts(nextDate).time-
    dateParts(today).time
   )/
   86400000
  );

  if(difference<0){
   state='due';
   nextText=
    'seit '+
    Math.abs(difference)+
    (
     Math.abs(difference)===1
      ?' Tag fällig'
      :' Tagen fällig'
    );
  }else if(difference===0){
   state='due';
   nextText='Heute fällig';
  }else{
   nextText=formatDate(nextDate);
  }
 }

 const basis=[];

 if(food.item){
  basis.push('Standardfutter');
 }

 if(configuredInterval!==null){
  basis.push('Intervall');
 }

 if(feeds.length){
  basis.push('Verlauf');
 }

 return {
  available:true,
  state:state,
  icon:recommendationIcon(
   food.label
  ),
  heading:'Futterempfehlung',
  primary:
   food.quantity+
   ' × '+
   food.label,
  intervalText:
   interval===null
    ?'Intervall noch nicht festgelegt'
    :(
     configuredInterval!==null
      ?'alle '+interval+' Tage'
      :'nach Verlauf etwa alle '+interval+' Tage'
    ),
  nextLabel:'Nächste Fütterung',
  nextText:nextText,
  nextDate:nextDate,
  basis:
   basis.length
    ?'Basierend auf '+basis.join(', ')
    :'Basierend auf deinen hinterlegten Tierdaten'
 };
}

window.FeedingRecommendationEngine={
 dateParts:dateParts,
 isoDate:isoDate,
 formatDate:formatDate,
 addDays:addDays,
 acceptedFeeds:acceptedFeeds,
 observedInterval:observedInterval,
 recommendation:recommendation
};

})();
