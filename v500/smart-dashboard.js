(function(){
'use strict';

const DAY=86400000;

function esc(value){
 return NGT500.esc(value||'');
}

function today0(){
 const date=new Date();

 date.setHours(
  0,
  0,
  0,
  0
 );

 return date;
}

function daysSince(value){
 const time=Date.parse(
  value||''
 );

 if(!time){
  return null;
 }

 const date=new Date(time);

 date.setHours(
  0,
  0,
  0,
  0
 );

 return Math.floor(
  (
   today0()-
   date
  )/
  DAY
 );
}

function latest(list){
 return (
  list||
  []
 )
  .slice()
  .sort(function(a,b){
   return String(
    b.date||
    ''
   ).localeCompare(
    String(
     a.date||
     ''
    )
   );
  })[0]||
  null;
}

function positiveInteger(value){
 const number=Number(value);

 if(
  Number.isFinite(number)&&
  number>=1
 ){
  return Math.round(number);
 }

 return null;
}

function animals(){
 try{
  return NGTStore
   .allAnimals()
   .filter(function(row){
    return ![
     'Archiv',
     'Verkauft',
     'Abgegeben',
     'Verstorben'
    ].includes(
     row.a.status
    );
   });

 }catch(error){
  return [];
 }
}

function inventory(){
 try{
  return (
   NGTStore
    .data()
    .foodInventory||
   []
  ).filter(function(item){
   return Number(
    item.qty||
    0
   )>0;
  });

 }catch(error){
  return [];
 }
}

function documents(){
 try{
  const data=
   NGTStore.data();

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

function feedEnabled(animal){
 if(
  animal.feedIntervalEnabled===
  false
 ){
  return false;
 }

 if(
  animal.feedIntervalEnabled===
  true
 ){
  return true;
 }

 return (
  positiveInteger(
   animal.feedIntervalDays||
   animal.feedingInterval||
   animal.feedInterval
  )!==null
 );
}

function weightEnabled(animal){
 if(
  animal.weightIntervalEnabled===
  false
 ){
  return false;
 }

 if(
  animal.weightIntervalEnabled===
  true
 ){
  return true;
 }

 return (
  positiveInteger(
   animal.weightIntervalDays||
   animal.weightInterval
  )!==null
 );
}

function feedInterval(animal){
 if(!feedEnabled(animal)){
  return null;
 }

 return positiveInteger(
  animal.feedIntervalDays||
  animal.feedingInterval||
  animal.feedInterval
 );
}

function weightInterval(animal){
 if(!weightEnabled(animal)){
  return null;
 }

 return positiveInteger(
  animal.weightIntervalDays||
  animal.weightInterval
 );
}

function dueFeed(
 animal,
 offset
){
 const interval=
  feedInterval(animal);

 if(interval===null){
  return false;
 }

 const lastFeed=
  latest(
   animal.feeds
  );

 const days=
  daysSince(
   lastFeed&&
   lastFeed.date
  );

 if(days===null){
  return false;
 }

 return (
  days>=
  interval-
  offset
 );
}

function dueWeight(
 animal,
 offset
){
 const interval=
  weightInterval(animal);

 if(interval===null){
  return false;
 }

 const lastWeight=
  latest(
   animal.weights
  );

 const days=
  daysSince(
   lastWeight&&
   lastWeight.date
  );

 if(days===null){
  return false;
 }

 return (
  days>=
  interval-
  offset
 );
}

function plannedFeeds(offset){
 return animals()
  .filter(function(row){
   return dueFeed(
    row.a,
    offset
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

    t:
     row.t,

    i:
     row.i
   };
  });
}

function plannedWeights(offset){
 return animals()
  .filter(function(row){
   return dueWeight(
    row.a,
    offset
   );
  })
  .map(function(row){
   return {
    name:
     row.a.name||
     'Unbenannt',

    type:
     'Gewicht',

    t:
     row.t,

    i:
     row.i
   };
  });
}

function groupRows(){
 const all=animals();
 const map={};

 all.forEach(function(row){
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

function lowFood(){
 return inventory()
  .filter(function(item){
   return Number(
    item.qty||
    0
   )<=5;
  });
}

function recentActivities(){
 const rows=[];

 animals().forEach(function(row){
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

function donutStyle(
 groups,
 total
){
 if(!total){
  return '';
 }

 const colors=[
  '#63d93f',
  '#2f86e8',
  '#8b3bd6',
  '#ff9500'
 ];

 let start=0;

 const parts=
  groups.map(function(group,index){
   const degrees=
    (
     group.count/
     total
    )*
    360;

   const part=
    colors[
     index%
     colors.length
    ]+
    ' '+
    start+
    'deg '+
    (
     start+
     degrees
    )+
    'deg';

   start+=degrees;

   return part;
  });

 return (
  'style="background:conic-gradient('+
  parts.join(',')+
  ')"'
 );
}

function kpi(
 icon,
 number,
 label,
 sub,
 className
){
 return `
  <div class="tc2SDkpi ${className||''}">
   <span>${icon}</span>
   <b>${number}</b>
   <small>${esc(label)}</small>
   ${sub?`<em>${esc(sub)}</em>`:''}
  </div>
 `;
}

function taskRow(
 row,
 index
){
 return `
  <button
   class="tc2SDtask"
   onclick="NGT500.route('profile',{t:'${String(row.t||'').replace(/'/g,"\\'")}',i:${Number(row.i||0)}})"
  >
   <span>
    ${
     index%3===0
      ?'🟣'
      :index%3===1
       ?'🟢'
       :'⚡'
    }
   </span>

   <div>
    <b>${esc(row.name)}</b>
    <small>${esc(row.type)}</small>
   </div>

   <em>heute</em>
   <i>›</i>
  </button>
 `;
}

function foodRow(item){
 const quantity=Number(
  item.qty||
  0
 );

 return `
  <button
   class="tc2SDfood"
   onclick="NGT500.route('food')"
  >
   <div class="tc2SDfoodImg">
    🥩
   </div>

   <div>
    <b>
     ${esc(
      item.label||
      item.name
     )}
    </b>

    <small>
     Bestand: ${quantity}
    </small>
   </div>

   <em class="${quantity<=5?'warn':''}">
    ${quantity<=5?'NIEDRIG':'OK'}
   </em>

   <i>›</i>
  </button>
 `;
}

function render(){
 const all=animals();
 const stock=inventory();
 const docs=documents();
 const groups=groupRows();

 const today=[
  ...plannedFeeds(0),
  ...plannedWeights(0)
 ];

 const low=lowFood();
 const activities=
  recentActivities();

 const total=all.length;

 return `
  <section class="tc2SD">
   <header class="tc2SDtop">
    <button onclick="NGT500.openMenu()">
     ☰
    </button>

    <div>
     <h2>Smart Dashboard</h2>
     <p>Deine intelligente Übersicht</p>
    </div>

    <div class="tc2SDsync">
     <b>☁ Synchronisiert</b>
     <span>Heute</span>
    </div>

    <strong>TC</strong>
   </header>

   <div class="tc2SDkpis">
    ${kpi(
     '●●●',
     total,
     'Tiere',
     '',
     'green'
    )}

    ${kpi(
     '⌂',
     stock.length,
     'Futterartikel',
     low.length
      ?low.length+' niedrig'
      :'',
     'orange'
    )}

    ${kpi(
     '▣',
     today.length,
     'Heute fällig',
     today.length
      ?today.length+' Aufgaben'
      :'',
     'orange'
    )}

    ${kpi(
     '▱',
     docs.length,
     'Dokumente',
     '',
     'blue'
    )}
   </div>

   <section class="tc2SDcard">
    <div class="tc2SDcardHead">
     <h3>Bestand nach Tierart</h3>

     <button onclick="NGT500.route('animals')">
      Alle anzeigen ›
     </button>
    </div>

    ${
     groups.length
      ?`
       <div class="tc2SDdonutRow">
        <div
         class="tc2SDdonut"
         ${donutStyle(groups,total)}
        >
         <div>
          <b>${total}</b>
          <span>Gesamt</span>
         </div>
        </div>

        <div class="tc2SDlegend">
         ${groups.map(function(group,index){
          return `
           <button
            onclick="NGT500.route('animals',{group:'${String(group.label).replace(/\\/g,'\\\\').replace(/'/g,"\\'")}'})"
           >
            <i class="c${index%4}"></i>
            <span>${esc(group.label)}</span>
            <b>${group.count}</b>
           </button>
          `;
         }).join('')}
        </div>
       </div>
      `
      :`
       <div class="tc2SDempty">
        Noch keine Tiere im Bestand.
       </div>
      `
    }
   </section>

   <section class="tc2SDcard">
    <div class="tc2SDcardHead">
     <h3>Heute fällig</h3>
    </div>

    ${
     today.length
      ?today
       .slice(0,3)
       .map(taskRow)
       .join('')+
       (
        today.length>3
         ?`
          <div class="tc2SDmore">
           + ${today.length-3} weitere
          </div>
         `
         :''
       )
      :`
       <div class="tc2SDempty">
        Heute nichts fällig.
       </div>
      `
    }
   </section>

   <section class="tc2SDcard">
    <div class="tc2SDcardHead">
     <h3>Futterbestand</h3>

     <button onclick="NGT500.route('food')">
      Alle anzeigen ›
     </button>
    </div>

    ${
     stock.length
      ?stock
       .slice(0,3)
       .map(foodRow)
       .join('')
      :`
       <div class="tc2SDempty">
        Kein Futterbestand erfasst.
       </div>
      `
    }
   </section>

   <section class="tc2SDcard">
    <div class="tc2SDcardHead">
     <h3>Aktivitäten</h3>
    </div>

    ${
     activities.length
      ?activities.map(function(activity){
       return `
        <div class="tc2SDactivity">
         <span>${activity.icon}</span>

         <div>
          <b>${esc(activity.title)}</b>
          <small>${esc(activity.sub)}</small>
         </div>
        </div>
       `;
      }).join('')
      :`
       <div class="tc2SDempty">
        Noch keine Aktivitäten vorhanden.
       </div>
      `
    }
   </section>

   <nav class="tc2SDnav">
    <button class="on">
     ▥
     <span>Übersicht</span>
    </button>

    <button onclick="NGT500.route('dashboard')">
     ●●●
     <span>Start</span>
    </button>

    <button onclick="NGT500.route('food')">
     ⌂
     <span>Futter</span>
    </button>

    <button onclick="NGT500.route('qr')">
     ▱
     <span>QR</span>
    </button>

    <button onclick="NGT500.route('settings')">
     ⚙
     <span>System</span>
    </button>
   </nav>

  </section>
 `;
}

window.NGTSmartDashboard={
 render:render,
 feedEnabled:feedEnabled,
 weightEnabled:weightEnabled,
 feedInterval:feedInterval,
 weightInterval:weightInterval
};

if(window.NGT500){
 NGT500.register(
  'smartDashboard',
  {
   render:render
  }
 );
}

})();
