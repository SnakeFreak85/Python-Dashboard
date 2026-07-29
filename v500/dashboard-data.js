(function(){
'use strict';

function isInactiveStatus(status){
 return AnimalEngine.isInactiveStatus(
  status
 );
}

function isOffspringAnimal(animal){
 return AnimalEngine.isOffspringAnimal(
  animal
 );
}

function activeAnimals(){
 try{
  return NGTStore
   .allAnimals()
   .filter(function(row){
    return !isInactiveStatus(
     row.a.status
    );
   });

 }catch(error){
  return [];
 }
}

function stockAnimals(){
 return activeAnimals()
  .filter(function(row){
   return !isOffspringAnimal(
    row.a
   );
  });
}

function offspringAnimals(){
 try{
  if(NGTStore.allOffspring){
   return NGTStore
    .allOffspring()
    .filter(function(row){
     return !isInactiveStatus(
      row.a.status
     );
    });
  }

  return activeAnimals()
   .filter(function(row){
    return isOffspringAnimal(
     row.a
    );
   });

 }catch(error){
  return [];
 }
}

function foodInventory(){
 try{
  return NGTStore.foodInventory();

 }catch(error){
  return [];
 }
}

function sortedInventory(){
 try{
  return FoodInventoryEngine
   .sortInventory(
    foodInventory()
   );

 }catch(error){
  return [];
 }
}

function lowFood(){
 return sortedInventory()
  .filter(function(item){
   return FoodInventoryEngine
    .needsRestock(item);
  });
}

function documents(){
 try{
  return NGTStore.documents();

 }catch(error){
  return [];
 }
}

function feedName(animal){
 return (
  animal.defaultFeeder||
  animal.futterStandard||
  animal.standardFeed||
  ''
 );
}

function plannedFeeds(offset){
 return activeAnimals()
  .filter(function(row){
   return CareRulesEngine.isFeedDue(
    row.a,
    {
     offsetDays:offset
    }
   );
  })
  .map(function(row){
   return {
    name:
     row.a.name||
     'Unbenannt',

    food:
     feedName(
      row.a
     ),

    type:
     'Fütterung',

    animalId:
     NGTStore.animalId(row.a),

    t:
     row.t,

    i:
     row.i
   };
  });
}

function plannedWeights(offset){
 return activeAnimals()
  .filter(function(row){
   return CareRulesEngine.isWeightDue(
    row.a,
    {
     offsetDays:offset
    }
   );
  })
  .map(function(row){
   return {
    name:
     row.a.name||
     'Unbenannt',

    type:
     'Gewicht',

    animalId:
     NGTStore.animalId(row.a),

    t:
     row.t,

    i:
     row.i
   };
  });
}

function dueTaskCount(offset){
 let count=0;

 stockAnimals()
  .concat(
   offspringAnimals()
  )
  .forEach(function(row){
   const animal=row.a||{};
   const options={
    offsetDays:offset
   };

   if(
    CareRulesEngine.isFeedDue(
     animal,
     options
    )
   ){
    count++;
   }

   if(
    CareRulesEngine.isWeightDue(
     animal,
     options
    )
   ){
    count++;
   }
  });

 return count;
}

function groupRows(){
 const map={};

 activeAnimals().forEach(function(row){
  const group=
   row.a.animalGroup||
   'Unsortiert';

  map[group]=
   (
    map[group]||
    0
   )+
   1;
 });

 return Object.keys(map)
  .sort(function(a,b){
   return a.localeCompare(
    b,
    'de'
   );
  })
  .map(function(group){
   return {
    label:group,
    count:map[group]
   };
  });
}

function recentActivities(){
 const rows=[];

 activeAnimals().forEach(function(row){
  const animal=row.a;

  AnimalEngine
   .historyEvents(
    animal,
    {
     includeMilestones:false,
     types:[
      'feed',
      'weight',
      'shed'
     ]
    }
   )
   .forEach(function(event){
    rows.push({
     date:event.date,
     icon:event.icon,
     title:
      animal.name||
      'Unbenannt',

     sub:
      event.title+
      ' · '+
      (
       event.date||
       '-'
      )
    });
   });
 });

 return AnimalEngine
  .sortHistory(
   rows,
   'desc'
  )
  .slice(0,4);
}

window.NGTDashboardData={
 isInactiveStatus:isInactiveStatus,
 isOffspringAnimal:isOffspringAnimal,
 activeAnimals:activeAnimals,
 stockAnimals:stockAnimals,
 offspringAnimals:offspringAnimals,
 foodInventory:foodInventory,
 sortedInventory:sortedInventory,
 lowFood:lowFood,
 documents:documents,
 plannedFeeds:plannedFeeds,
 plannedWeights:plannedWeights,
 dueTaskCount:dueTaskCount,
 groupRows:groupRows,
 recentActivities:recentActivities
};

})();
