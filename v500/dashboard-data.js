(function(){
'use strict';

function isInactiveStatus(status){
 return [
  'Archiv',
  'Verkauft',
  'Abgegeben',
  'Verstorben'
 ].includes(status);
}

function isOffspringAnimal(animal){
 if(
  window.NGTIdManager&&
  NGTIdManager.isOffspring
 ){
  return NGTIdManager.isOffspring(animal);
 }

 return (
  String(
   (animal&&animal.status)||''
  ).toLowerCase()==='nachzucht'||

  String(
   (animal&&animal.collection)||''
  ).toLowerCase()==='offspring'||

  String(
   (animal&&animal.collection)||''
  ).toLowerCase()==='nachzuchten'
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
  const data=NGTStore.data();

  return Array.isArray(data.foodInventory)
   ?data.foodInventory
   :[];

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
  const data=NGTStore.data();

  return []
   .concat(
    data.documents||
    []
   )
   .concat(
    data.sales||
    []
   )
   .concat(
    data.clutches||
    []
   );

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

  (
   animal.feeds||
   []
  )
   .slice(-2)
   .forEach(function(feed){
    rows.push({
     icon:'🍽',
     title:
      animal.name||
      'Unbenannt',

     sub:
      'Fütterung · '+
      (
       feed.date||
       '-'
      )
    });
   });

  (
   animal.weights||
   []
  )
   .slice(-2)
   .forEach(function(weight){
    rows.push({
     icon:'⚖',
     title:
      animal.name||
      'Unbenannt',

     sub:
      'Gewicht · '+
      (
       weight.date||
       '-'
      )
    });
   });

  (
   animal.sheds||
   []
  )
   .slice(-2)
   .forEach(function(shed){
    rows.push({
     icon:'🧤',
     title:
      animal.name||
      'Unbenannt',

     sub:
      'Häutung · '+
      (
       shed.date||
       '-'
      )
    });
   });
 });

 return rows
  .slice(-4)
  .reverse();
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
