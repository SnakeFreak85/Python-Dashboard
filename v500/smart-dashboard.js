(function(){
'use strict';

function esc(value){
 return NGT500.esc(value||'');
}

function jsArg(value){
 return String(value||'')
  .replace(/\\/g,'\\\\')
  .replace(/'/g,"\\'");
}

function dateLabel(value){
 return window.NGTDateDisplay?NGTDateDisplay.format(value||''):String(value||'');
}

function profileRouteArgs(row){
 if(row&&row.animalId){
  return `{animalId:'${jsArg(row.animalId)}'}`;
 }

 return (
  `{t:'${jsArg(row&&row.t)}',`+
  `i:${Number((row&&row.i)||0)}}`
 );
}

function feedEnabled(animal){
 return CareRulesEngine.feedEnabled(
  animal
 );
}

function weightEnabled(animal){
 return CareRulesEngine.weightEnabled(
  animal
 );
}

function feedInterval(animal){
 return CareRulesEngine.feedInterval(
  animal
 );
}

function weightInterval(animal){
 return CareRulesEngine.weightInterval(
  animal
 );
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
 className,
 action
){
 const tag=action?'button':'div';

 return `
  <${tag}
   class="tc2SDkpi ${className||''} ${action?'tc2SDkpiAction':''}"
   ${
    action
     ?`type="button" onclick="${action}" aria-label="${esc(label)} öffnen"`
     :''
   }
  >
   <span>${icon}</span>
   <b>${number}</b>
   <small>${esc(label)}</small>
   ${sub?`<em>${esc(sub)}</em>`:''}
  </${tag}>
 `;
}

function taskRow(
 row,
 index,
 closeModal
){
 return `
  <button
   class="tc2SDtask"
   onclick="${
    closeModal
     ?'NGT500.closeModal(false);'
     :''
   }NGT500.route('profile',${profileRouteArgs(row)})"
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

function dueTasks(){
 return [
  ...NGTDashboardData.plannedFeeds(0),
  ...NGTDashboardData.plannedWeights(0)
 ];
}

function openDueTasks(){
 const today=dueTasks();

 NGT500.modal(
  `
   <div class="tc2SDdueDialog">
    <h2>Heute fällig</h2>
    <p>
     ${
      today.length
       ?today.length+
        (
         today.length===1
          ?' Aufgabe benötigt heute deine Aufmerksamkeit.'
          :' Aufgaben benötigen heute deine Aufmerksamkeit.'
        )
       :'Heute ist keine Aufgabe fällig.'
     }
    </p>

    <div class="tc2SDdueList">
     ${
      today.length
       ?today.map(function(row,index){
        return taskRow(row,index,true);
       }).join('')
       :`
        <div class="tc2SDempty">
         Heute nichts fällig.
        </div>
       `
     }
    </div>

    <button
     class="tc2SDdueClose tc2ModalInitial"
     type="button"
     onclick="NGT500.closeModal(false)"
    >
     Schließen
    </button>
   </div>
  `,
  {
   label:'Heute fällige Aufgaben',
   className:'tc2SDdueModal'
  }
 );
}

function foodRow(item){
 const normalized=
  FoodInventoryEngine
   .normalizeItem(item);
 const quantity=
  FoodInventoryEngine
   .quantity(normalized);
 const stockStatus=
  FoodInventoryEngine
   .status(normalized);

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
     Bestand: ${quantity} ${esc(normalized.unit)}
    </small>
   </div>

   <em class="${stockStatus.needsRestock?'warn':''}">
    ${stockStatus.text.toUpperCase()}
   </em>

   <i>›</i>
  </button>
 `;
}

function render(){
 const all=
  NGTDashboardData.activeAnimals();
 const docs=
  NGTDashboardData.documents();
 const groups=
  NGTDashboardData.groupRows();

 const today=dueTasks();

 const low=
  NGTDashboardData.lowFood();
 const activities=
  NGTDashboardData.recentActivities();
 const breeding=
  NGTDashboardData.breedingProjects?NGTDashboardData.breedingProjects():[];

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
     '▣',
     today.length,
     'Heute fällig',
     today.length
      ?today.length+' Aufgaben'
      :'',
     'orange',
     'NGTSmartDashboard.openDueTasks()'
    )}

    ${kpi(
     '⌂',
     low.length,
     'Nachkaufen',
     low.length
      ?low.length+' Bestände'
      :'Alles ausreichend',
     low.length?'orange':'green'
    )}

    ${kpi(
     '▱',
     docs.length,
     'Dokumente',
     '',
     'blue'
    )}
   </div>

   <section class="tc2SDcard tc2SDactionCard tc2SDtasksCard">
    <div class="tc2SDcardHead">
     <h3>Heute fällig</h3>

     ${
      today.length
       ?`
        <button onclick="NGTSmartDashboard.openDueTasks()">
         Alle anzeigen ›
        </button>
       `
       :''
     }
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
          <button
           class="tc2SDmore"
           onclick="NGTSmartDashboard.openDueTasks()"
          >
           + ${today.length-3} weitere anzeigen
          </button>
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

   ${breeding.length?`
   <section class="tc2SDcard tc2SDbreedingCard">
    <div class="tc2SDcardHead">
     <h3>Zuchtprojekte</h3>
     <button onclick="NGT500.route('breeding')">Alle anzeigen ›</button>
    </div>
    <div class="tc2SDbreedingRows">
     ${breeding.slice(0,3).map(function(plan){
      const detail=plan.offspringRemaining
       ?plan.offspringRemaining+' Nachzuchten noch anzulegen'
       :(plan.expectedDate?'Erwartet: '+dateLabel(plan.expectedDate):plan.statusLabel);
      return `<button onclick="NGT500.route('breeding',{id:'${jsArg(plan.id)}'})">
       <span>⚭</span>
       <div><b>${esc(plan.title)}</b><small>${esc(detail)}</small></div>
       <em>${esc(plan.statusLabel)}</em><i>›</i>
      </button>`;
     }).join('')}
    </div>
   </section>`:''}

   <section class="tc2SDcard tc2SDactionCard tc2SDfoodCard">
    <div class="tc2SDcardHead">
     <h3>Futter nachkaufen</h3>

     <button onclick="NGT500.route('food')">
      Alle anzeigen ›
     </button>
    </div>

    ${
     low.length
      ?low
       .slice(0,3)
       .map(foodRow)
       .join('')
      :`
       <div class="tc2SDempty">
        Alle Futterbestände sind ausreichend.
       </div>
      `
    }
   </section>

   <section class="tc2SDcard tc2SDactivityCard">
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

   <section class="tc2SDcard tc2SDstockCard">
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

  </section>
 `;
}

window.NGTSmartDashboard={
 render:render,
 openDueTasks:openDueTasks,
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
