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

function positiveNumber(value){
 const parsed=Number(
  String(value==null?'':value)
   .replace(',','.')
 );

 return Number.isFinite(parsed)&&parsed>0
  ?parsed
  :null;
}

function latestWeight(animal){
 const entries=(
  Array.isArray(animal&&animal.weights)
   ?animal.weights
   :[]
 )
  .map(function(entry){
   return {
    date:isoDate(entry&&entry.date),
    weight:positiveNumber(
     entry&&entry.weight
    )
   };
  })
  .filter(function(entry){
   return entry.date&&entry.weight!==null;
  })
  .sort(function(a,b){
   return a.date.localeCompare(b.date);
  });

 return entries.length
  ?entries[entries.length-1].weight
  :positiveNumber(animal&&animal.weight);
}

function ageMonths(animal,now){
 const birth=dateParts(
  animal&&(
   animal.birth||
   animal.birthDate||
   animal.hatchDate
  )
 );
 const current=dateParts(
  todayIso(now)
 );

 if(!birth||!current||birth.time>current.time){
  return null;
 }

 let months=
  (current.year-birth.year)*12+
  current.month-birth.month;

 if(current.day<birth.day){
  months-=1;
 }

 return Math.max(0,months);
}

function identity(animal){
 return [
  animal&&animal.animalGroup,
  animal&&animal.genus,
  animal&&animal.species,
  animal&&animal.breed,
  animal&&animal.art
 ]
  .map(text)
  .join(' ')
  .toLocaleLowerCase('de');
}

function animalKind(animal){
 const value=identity(animal);

 if(
  /python\s*regius|königspython|koenigspython|ball\s*python/.test(value)
 ){
  return 'ball-python';
 }

 if(/\bboa\b|boa\s*constrictor/.test(value)){
  return 'boa';
 }

 if(
  /eublepharis\s*macularius|leopardgecko/.test(value)
 ){
  return 'leopard-gecko';
 }

 if(
  /chamaeleo\s*calyptratus|jemen.?chamäleon|veiled\s*chameleon/.test(value)
 ){
  return 'veiled-chameleon';
 }

 if(
  /schlange|python|natter|viper|kobra|cobra/.test(value)
 ){
  return 'snake';
 }

 return 'unsupported';
}

function intervalLabel(minimum,maximum){
 if(minimum===1&&maximum===1){
  return 'täglich';
 }

 if(minimum===maximum){
  return 'alle '+minimum+' Tage';
 }

 return 'alle '+minimum+'–'+maximum+' Tage';
}

function feederWeight(item){
 const label=FoodInventoryEngine
  .itemLabel(item);
 const range=label.match(
  /(\d+(?:[.,]\d+)?)\s*[-–]\s*(\d+(?:[.,]\d+)?)\s*g\b/i
 );

 if(range){
  return (
   positiveNumber(range[1])+
   positiveNumber(range[2])
  )/2;
 }

 const single=label.match(
  /(\d+(?:[.,]\d+)?)\s*g\b/i
 );

 return single
  ?positiveNumber(single[1])
  :null;
}

function matchingRodent(
 inventory,
 target,
 minimum,
 maximum
){
 const candidates=inventoryItems(inventory)
  .map(function(item){
   return {
    item:item,
    label:FoodInventoryEngine.itemLabel(item),
    weight:feederWeight(item)
   };
  })
  .filter(function(candidate){
   return (
    /ratte|maus|mäus|vzm/i.test(candidate.label)&&
    candidate.weight!==null&&
    candidate.weight>=minimum&&
    candidate.weight<=maximum
   );
  })
  .sort(function(a,b){
   return (
    Math.abs(a.weight-target)-
    Math.abs(b.weight-target)
   );
  });

 return candidates[0]||null;
}

function ballPythonRule(weight,inventory){
 if(weight===null){
  return null;
 }

 let minimumDays=7;
 let maximumDays=7;

 if(weight>=1500){
  minimumDays=28;
  maximumDays=56;
 }else if(weight>=500){
  minimumDays=14;
  maximumDays=21;
 }else if(weight>=350){
  minimumDays=10;
  maximumDays=14;
 }else if(weight>=200){
  minimumDays=7;
  maximumDays=10;
 }

 const target=Math.max(1,Math.round(weight*0.10));
 const match=matchingRodent(
  inventory,
  target,
  weight*0.08,
  weight*0.12
 );

 return {
  primary:match
   ?'1 × '+match.label
   :'1 Beutetier mit etwa '+target+' g',
  minimumDays:minimumDays,
  maximumDays:maximumDays,
  dueDays:maximumDays,
  detail:
   'Orientierungswert: etwa 10 % des Körpergewichts',
  basis:
   'Python regius · aktuelles Gewicht '+weight+' g'
 };
}

function boaRule(weight,months,inventory){
 if(weight===null||months===null){
  return null;
 }

 let minimumDays=10;
 let maximumDays=12;

 if(months>=48){
  minimumDays=28;
  maximumDays=56;
 }else if(months>=36){
  minimumDays=28;
  maximumDays=42;
 }else if(months>=30){
  minimumDays=21;
  maximumDays=28;
 }else if(months>=18){
  minimumDays=14;
  maximumDays=21;
 }else if(months>=12){
  minimumDays=12;
  maximumDays=14;
 }

 const maximumWeight=Math.max(
  1,
  Math.floor(weight*0.10)
 );
 const target=Math.max(
  1,
  Math.round(weight*0.08)
 );
 const match=matchingRodent(
  inventory,
  target,
  weight*0.05,
  maximumWeight
 );

 return {
  primary:match
   ?'1 × '+match.label
   :'1 Beutetier bis etwa '+maximumWeight+' g',
  minimumDays:minimumDays,
  maximumDays:maximumDays,
  dueDays:maximumDays,
  detail:
   'Beutetier höchstens etwa 10 % des Körpergewichts',
  basis:
   'Boa · '+weight+' g · Alter '+months+' Monate'
 };
}

function leopardGeckoRule(months){
 if(months===null){
  return null;
 }

 const juvenile=months<12;

 return {
  primary:
   'Abwechslungsreiche, gut ernährte Futterinsekten',
  minimumDays:juvenile?1:2,
  maximumDays:juvenile?2:3,
  dueDays:juvenile?2:3,
  detail:
   'Futtertiere passend zur Größe des Geckos wählen',
  basis:
   'Leopardgecko · '+
   (juvenile?'Jungtier':'Adult')+
   ' · Alter '+months+' Monate'
 };
}

function veiledChameleonRule(months){
 if(months===null){
  return null;
 }

 const juvenile=months<12;

 return {
  primary:juvenile
   ?'12–20 kleine, gut ernährte Futterinsekten'
   :'Etwa 12 große Grillen oder 5–6 Superwürmer',
  minimumDays:juvenile?1:2,
  maximumDays:juvenile?1:2,
  dueDays:juvenile?1:2,
  detail:
   'Futterinsekten nicht breiter als der Kopf',
  basis:
   'Jemenchamäleon · '+
   (juvenile?'Jungtier':'Adult')+
   ' · Alter '+months+' Monate'
 };
}

function genericSnakeRule(months){
 return {
  primary:
   '1 Beutetier passend zur Körperbreite',
  minimumDays:7,
  maximumDays:14,
  dueDays:14,
  detail:
   'Beutetier nicht deutlich breiter als Kopf beziehungsweise Körpermitte',
  basis:
   'Allgemeine Schlangenorientierung'+
   (months===null?'':' · Alter '+months+' Monate')
 };
}

function speciesRule(animal,inventory,options){
 const kind=animalKind(animal);
 const weight=latestWeight(animal);
 const months=ageMonths(
  animal,
  options&&options.now
 );

 if(kind==='ball-python'){
  return ballPythonRule(
   weight,
   inventory
  );
 }

 if(kind==='boa'){
  return boaRule(
   weight,
   months,
   inventory
  );
 }

 if(kind==='leopard-gecko'){
  return leopardGeckoRule(months);
 }

 if(kind==='veiled-chameleon'){
  return veiledChameleonRule(months);
 }

 if(kind==='snake'){
  return genericSnakeRule(months);
 }

 return null;
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

 const rule=speciesRule(
  animal,
  inventory,
  options
 );

 const latestAny=
  AnimalEngine.latest(
   animal.feeds
  );

 const latestDate=
  latestAny&&
  isoDate(latestAny.date);

 const nextDate=
  latestDate&&rule
   ?addDays(
    latestDate,
    rule.dueDays
   )
   :'';

 const today=todayIso(
  options.now
 );

 let state='ok';
 let nextText='Noch nicht berechenbar';

 if(!rule){
  const kind=animalKind(animal);
  const missing=
   kind==='ball-python'
    ?'Für die Berechnung fehlt ein aktuelles Gewicht.'
    :(
     kind==='boa'
      ?'Für die Berechnung fehlen aktuelles Gewicht oder Schlupfdatum.'
      :(
       kind==='leopard-gecko'||
       kind==='veiled-chameleon'
        ?'Für die Berechnung fehlt das Schlupfdatum.'
        :'Für diese Tierart ist noch keine geprüfte Regel hinterlegt.'
      )
    );

  return {
   available:false,
   state:'incomplete',
   icon:'🍽️',
   heading:'Futterempfehlung',
   primary:'Noch nicht sicher berechenbar',
   intervalText:missing,
   nextLabel:'Nächste Fütterung',
   nextText:'Noch nicht berechenbar',
   basis:'Erforderliche Tierdaten ergänzen.',
   note:
    'Orientierung ersetzt keine individuelle tierärztliche Beratung.'
  };
 }

 if(!latestDate){
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

 return {
  available:true,
  state:state,
  icon:recommendationIcon(rule.primary),
  heading:'Futterempfehlung',
  primary:rule.primary,
  intervalText:
   intervalLabel(
    rule.minimumDays,
    rule.maximumDays
   ),
  nextLabel:'Nächste Fütterung',
  nextText:nextText,
  nextDate:nextDate,
  basis:rule.basis,
  detail:rule.detail,
  note:
   'Orientierung ersetzt keine individuelle tierärztliche Beratung.'
 };
}

window.FeedingRecommendationEngine={
 dateParts:dateParts,
 isoDate:isoDate,
 formatDate:formatDate,
 addDays:addDays,
 acceptedFeeds:acceptedFeeds,
 observedInterval:observedInterval,
 latestWeight:latestWeight,
 ageMonths:ageMonths,
 animalKind:animalKind,
 feederWeight:feederWeight,
 speciesRule:speciesRule,
 recommendation:recommendation
};

})();
