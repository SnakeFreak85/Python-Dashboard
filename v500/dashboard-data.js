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

function foodDemandRows(){
 const inventory=sortedInventory();
 const inventoryById={};
 const groups={};

 inventory.forEach(function(item){
  if(item&&item.id){
   inventoryById[String(item.id)]=item;
  }
 });

 activeAnimals().forEach(function(row){
  const animal=row.a||{};
  const group=String(animal.animalGroup||'Unsortiert').trim()||'Unsortiert';
  const feederId=String(animal.defaultFeederId||animal.foodInventoryId||'').trim();
  const inventoryItem=feederId&&inventoryById[feederId]||null;
  const feederLabel=String(
   inventoryItem
    ?FoodInventoryEngine.itemLabel(inventoryItem)
    :feedName(animal)
  ).trim();
  const requestedQuantity=Number(
   animal.defaultFeederQuantity||
   animal.defaultFeedQuantity||
   1
  );
  const quantity=
   Number.isFinite(requestedQuantity)&&requestedQuantity>0
    ?Math.max(1,Math.round(requestedQuantity))
    :1;

  if(!groups[group]){
   groups[group]={
    label:group,
    animalCount:0,
    assignedCount:0,
    missingCount:0,
    totalQuantity:0,
    items:{}
   };
  }

  const target=groups[group];
  target.animalCount++;

  if(!feederLabel){
   target.missingCount++;
   return;
  }

  const key=feederId
   ?'id:'+feederId
   :'label:'+feederLabel.toLowerCase();

  if(!target.items[key]){
   target.items[key]={
    id:feederId,
    label:feederLabel,
    unit:String(
     inventoryItem&&inventoryItem.unit||
     animal.defaultFeederUnit||
     'Stück'
    ),
    quantity:0,
    animalCount:0,
    stock:inventoryItem
     ?FoodInventoryEngine.quantity(inventoryItem)
     :null
   };
  }

  target.items[key].quantity+=quantity;
  target.items[key].animalCount++;
  target.assignedCount++;
  target.totalQuantity+=quantity;
 });

 return Object.keys(groups)
  .sort(function(a,b){return a.localeCompare(b,'de');})
  .map(function(group){
   const row=groups[group];

   return {
    label:row.label,
    animalCount:row.animalCount,
    assignedCount:row.assignedCount,
    missingCount:row.missingCount,
    totalQuantity:row.totalQuantity,
    items:Object.keys(row.items)
     .map(function(key){return row.items[key];})
     .sort(function(a,b){return a.label.localeCompare(b.label,'de');})
   };
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

 (NGTStore.breedingPlans?NGTStore.breedingPlans():[]).forEach(function(plan){
  (Array.isArray(plan.events)?plan.events:[]).forEach(function(event){
   rows.push({
    date:event.date,
    icon:'⚭',
    title:plan.title||plan.projectCode||'Zuchtprojekt',
    sub:(event.label||({
     pairing:'Verpaarung',
     ovulation:'Ovulation',
     prelay_shed:'Legehäutung',
     clutch:'Gelege / Wurf',
     incubation:'Inkubationsbeginn',
     hatch:'Schlupf',
     birth:'Geburt',
     note:'Notiz'
    }[event.type]||'Zuchtereignis'))+' · '+(event.date||'-')
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

function breedingProjects(){
 const hidden=new Set(['completed','cancelled','archived']);
 const labels={
  planned:'Geplant',
  paired:'Verpaarung läuft',
  expecting:'Gelege / Wurf erwartet',
  clutch:'Gelege / Wurf erfasst',
  incubation:'Inkubation',
  hatched:'Schlupf / Geburt'
 };

 return (NGTStore.breedingPlans?NGTStore.breedingPlans():[])
  .filter(function(plan){return !hidden.has(plan.status);})
  .map(function(plan){
   const linked=(NGTStore.allAnimals?NGTStore.allAnimals():[]).filter(function(row){
    return row.a&&row.a.breedingPlanId===plan.id;
   }).length;
   const expected=plan.status==='hatched'
    ?Math.max(0,Number(plan.offspringExpected||0))
    :0;
   return {
    id:plan.id,
    title:plan.title||plan.projectCode||'Zuchtprojekt',
    code:plan.projectCode||'',
    status:plan.status||'planned',
    statusLabel:labels[plan.status]||'Aktiv',
    expectedDate:plan.expectedDate||'',
    offspringExpected:expected,
    offspringLinked:linked,
    offspringRemaining:Math.max(0,expected-linked)
   };
  })
  .sort(function(a,b){
   return String(a.expectedDate||'9999-12-31').localeCompare(String(b.expectedDate||'9999-12-31'));
  });
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
 foodDemandRows:foodDemandRows,
 documents:documents,
 plannedFeeds:plannedFeeds,
 plannedWeights:plannedWeights,
 dueTaskCount:dueTaskCount,
 groupRows:groupRows,
 recentActivities:recentActivities,
 breedingProjects:breedingProjects
};

})();
