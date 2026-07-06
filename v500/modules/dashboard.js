(function(){
'use strict';

let statusTimer=null;

function tc2(on){
  document.body.classList.toggle('tc2RefMode',!!on);
}

function installRouteGuard(){
  if(!window.NGT500 || NGT500.__tc2RouteGuardInstalled)return;
  NGT500.__tc2RouteGuardInstalled=true;

  const originalRoute=NGT500.route;
  NGT500.route=function(name,args){
    tc2(name==='dashboard'||name==='smartDashboard');
    return originalRoute.call(NGT500,name,args);
  };

  if(NGT500.on){
    NGT500.on('route',function(e){
      tc2(e&&(e.name==='dashboard'||e.name==='smartDashboard'));
    });
  }
}

installRouteGuard();

function esc(v){return NGT500.esc(v||'')}

function userName(){
  const keys=['tc_user_profile','terracontrol_user','ngt_user','ngt_google_user'];
  for(const k of keys){
    try{
      const u=JSON.parse(localStorage.getItem(k)||'{}');
      if(u.given_name)return u.given_name;
      if(u.name)return String(u.name).split(' ')[0];
      if(u.displayName)return String(u.displayName).split(' ')[0];
    }catch(e){}
  }
  return '';
}

function cloudLabel(){
  try{
    return window.NGTFirebaseSync?NGTFirebaseSync.label():'Nicht angemeldet';
  }catch(e){
    return 'Nicht angemeldet';
  }
}

function updateCloudStatus(){
  const el=document.getElementById('dashboardCloudStatus');
  if(el)el.textContent=cloudLabel();
}

async function googleSignIn(){
  if(window.NGTFirebaseSync)await NGTFirebaseSync.signIn();
  updateCloudStatus();
}

async function firestoreSave(){
  if(window.NGTFirebaseSync){
    await NGTFirebaseSync.saveCloud();
    updateCloudStatus();
  }
}

async function firestoreLoad(){
  if(window.NGTFirebaseSync&&confirm('Daten aus Firestore laden? Lokale Daten können überschrieben werden.')){
    await NGTFirebaseSync.loadCloud();
    location.reload();
  }
}

function openHknImport(){
  if(window.NGTHknImport)NGTHknImport.run();
  else alert('HKN-Import lädt noch.');
}

function manualAnimal(){
  NGT500.route('animals',{t:'koenig'});
  setTimeout(function(){
    if(window.NGTAnimals&&NGTAnimals.openEditor)NGTAnimals.openEditor('koenig');
  },120);
}

function toggleBestand(){
  const el=document.getElementById('bestandPanel');
  if(el)el.classList.toggle('hidden');
}

function openSmartDashboard(){
  NGT500.route('smartDashboard');
}

function allAnimals(){
  try{
    return NGTStore.allAnimals().filter(function(x){
      return !['Archiv','Verkauft','Abgegeben','Verstorben'].includes(x.a.status);
    });
  }catch(e){
    return [];
  }
}

function foodItems(){
  try{
    return (NGTStore.data().foodInventory||[]).filter(function(x){
      return Number(x.qty||0)>0;
    });
  }catch(e){
    return [];
  }
}

function groupRows(){
  const rows=[];
  const animals=allAnimals();
  (NGTStore.TYPES||[]).forEach(function(t){
    const count=animals.filter(function(x){return x.t===t}).length;
    if(count>0){
      rows.push({
        t:t,
        count:count,
        label:(NGTStore.LABELS&&NGTStore.LABELS[t])?NGTStore.LABELS[t]:t
      });
    }
  });
  return rows;
}

function latest(list){
  return (list||[]).slice().sort(function(a,b){
    return String(b.date||'').localeCompare(String(a.date||''));
  })[0]||null;
}

function todayISO(){
  return new Date().toISOString().slice(0,10);
}

function daysBetween(a,b){
  const da=new Date(a+'T00:00:00');
  const db=new Date(b+'T00:00:00');
  return Math.floor((db-da)/86400000);
}

function feedingInterval(a){
  const age=String(a.ageStage||a.stage||'').toLowerCase();
  if(age.includes('adult'))return 14;
  if(age.includes('sub'))return 10;
  if(age.includes('jung')||age.includes('baby'))return 7;
  return Number(a.feedInterval||a.feedingInterval||a.interval||14);
}

function dueStats(){
  const today=todayISO();
  let overdue=0,todayDue=0,ok=0;
  const rows=[];

  allAnimals().forEach(function(x){
    const a=x.a;
    const lf=latest(a.feeds);
    if(!lf||!lf.date){
      overdue++;
      rows.push({icon:'🍽',name:a.name||'Unbenannt',type:'Keine Fütterung erfasst',state:'Überfällig'});
      return;
    }

    const diff=daysBetween(lf.date,today);
    const interval=feedingInterval(a);

    if(diff>interval){
      overdue++;
      rows.push({icon:'🍽',name:a.name||'Unbenannt',type:'Fütterung überfällig',state:'Überfällig'});
    }else if(diff===interval){
      todayDue++;
      rows.push({icon:'🍽',name:a.name||'Unbenannt',type:'Fütterung heute',state:'Heute'});
    }else{
      ok++;
    }
  });

  return {overdue,today:todayDue,ok,rows:rows.slice(0,4)};
}

function recentActivities(){
  const rows=[];
  allAnimals().forEach(function(x){
    const a=x.a;
    (a.feeds||[]).slice(-3).forEach(function(f){
      rows.push({icon:'🍽',text:'Fütterung: '+(a.name||'Unbenannt'),date:f.date||''});
    });
    (a.weights||[]).slice(-3).forEach(function(w){
      rows.push({icon:'⚖',text:'Gewicht: '+(a.name||'Unbenannt'),date:w.date||''});
    });
    (a.sheds||[]).slice(-3).forEach(function(s){
      rows.push({icon:'🧤',text:'Häutung: '+(a.name||'Unbenannt'),date:s.date||''});
    });
  });
  return rows.sort(function(a,b){
    return String(b.date).localeCompare(String(a.date));
  }).slice(0,4);
}

function quick(icon,title,sub,onclick){
  return `<button class="tc2DashQuick" onclick="${onclick}">
    <span>${icon}</span>
    <b>${esc(title)}</b>
    <small>${esc(sub)}</small>
  </button>`;
}

function renderGroups(){
  const rows=groupRows();
  if(!rows.length){
    return `<div class="tc2DashEmpty">
      <b>Noch keine Tiere</b>
      <span>Lege dein erstes Tier an oder lade deine Cloud-Daten.</span>
    </div>`;
  }

  return `<div class="tc2DashGroupList">
    ${rows.map(function(r){
      return `<button onclick="NGT500.route('animals',{t:'${r.t}'})">
        <span>${esc(r.label.replace(/^.\s*/,''))}</span>
        <b>${r.count}</b>
      </button>`;
    }).join('')}
  </div>`;
}

function renderDueRows(rows){
  if(!rows.length){
    return `<div class="tc2DashEmpty">
      <b>Alles ruhig</b>
      <span>Aktuell gibt es keine kritischen Fütterungshinweise.</span>
    </div>`;
  }

  return `<div class="tc2DashTaskList">
    ${rows.map(function(r){
      return `<div>
        <span>${r.icon}</span>
        <b>${esc(r.name)}</b>
        <small>${esc(r.type)}</small>
        <em>${esc(r.state)}</em>
      </div>`;
    }).join('')}
  </div>`;
}

function render(){
  tc2(true);

  const name=userName();
  const animals=allAnimals();
  const foods=foodItems();
  const due=dueStats();
  const groups=groupRows();

  return `<section class="tc2Screen tc2DashboardV2">

    <header class="tc2DashTop">
      <button onclick="NGT500.openMenu()">☰</button>
      <div>
        <h1>TerraControl</h1>
        <p id="dashboardCloudStatus">${esc(cloudLabel())}</p>
      </div>
      <span>TC</span>
    </header>

    <section class="tc2DashHero">
      <h2>Hallo${name?' '+esc(name):''} 👋</h2>
      <p>Dein Bestand heute auf einen Blick.</p>
      <div>
        <b>${animals.length}</b><span>Tiere</span>
        <b>${due.overdue}</b><span>Überfällig</span>
        <b>${foods.length}</b><span>Futter</span>
      </div>
    </section>

    <section class="tc2DashCloud">
      <button onclick="NGTDashboard.googleSignIn()">Anmelden</button>
      <button onclick="NGTDashboard.firestoreSave()">Cloud speichern</button>
      <button onclick="NGTDashboard.firestoreLoad()">Cloud laden</button>
    </section>

    <section class="tc2DashQuickGrid">
      ${quick('＋','Tier','Anlegen','NGTDashboard.manualAnimal()')}
      ${quick('⚡','Schnell','Eintragen',"NGT500.route('assistant')")}
      ${quick('🥩','Futter','Bestand',"NGT500.route('food')")}
      ${quick('🏷️','QR','Tierpass',"NGT500.route('qr')")}
    </section>

    <section class="tc2DashCard">
      <div class="tc2DashCardHead">
        <h3>Heute</h3>
        <button onclick="NGTDashboard.openSmartDashboard()">Details</button>
      </div>
      <div class="tc2DashStatusGrid">
        <div><b>${due.overdue}</b><span>Überfällig</span></div>
        <div><b>${due.today}</b><span>Heute</span></div>
        <div><b>${due.ok}</b><span>Okay</span></div>
      </div>
      ${renderDueRows(due.rows)}
    </section>

    <section class="tc2DashCard">
      <div class="tc2DashCardHead">
        <h3>Bestand</h3>
        <button onclick="NGTDashboard.toggleBestand()">Anzeigen</button>
      </div>
      <div class="tc2DashTotal"><b>${animals.length}</b><span>aktive Tiere</span></div>
      <div id="bestandPanel">${renderGroups()}</div>
    </section>

    <button class="tc2DashAi" onclick="NGT500.route('chat')">
      <span>🤖</span>
      <div>
        <b>TerraControl KI</b>
        <small>Fragen, Analysen und Empfehlungen</small>
      </div>
      <em>›</em>
    </button>

  </section>`;
}

function smartRender(){
  tc2(true);

  const animals=allAnimals();
  const foods=foodItems();
  const due=dueStats();
  const acts=recentActivities();
  const groups=groupRows();

  return `<section class="tc2Screen tc2DashboardV2">

    <header class="tc2DashTop">
      <button onclick="NGT500.openMenu()">☰</button>
      <div>
        <h1>Smart Dashboard</h1>
        <p>${esc(cloudLabel())}</p>
      </div>
      <span>TC</span>
    </header>

    <section class="tc2DashHero">
      <h2>Deine echten Daten</h2>
      <p>Analyse aus Bestand, Futter und Aktivitäten.</p>
      <div>
        <b>${animals.length}</b><span>Tiere</span>
        <b>${foods.length}</b><span>Futter</span>
        <b>${acts.length}</b><span>Aktivitäten</span>
      </div>
    </section>

    <section class="tc2DashCard">
      <div class="tc2DashCardHead">
        <h3>Bestand nach Gruppen</h3>
        <button onclick="NGT500.route('dashboard')">Start</button>
      </div>
      ${groups.length?`<div class="tc2DashGroupList">
        ${groups.map(function(g){
          return `<button onclick="NGT500.route('animals',{t:'${g.t}'})">
            <span>${esc(g.label.replace(/^.\s*/,''))}</span>
            <b>${g.count}</b>
          </button>`;
        }).join('')}
      </div>`:`<div class="tc2DashEmpty"><b>Keine Tiere vorhanden</b><span>Lade Daten oder lege Tiere an.</span></div>`}
    </section>

    <section class="tc2DashCard">
      <div class="tc2DashCardHead">
        <h3>Fälligkeiten</h3>
      </div>
      <div class="tc2DashStatusGrid">
        <div><b>${due.overdue}</b><span>Überfällig</span></div>
        <div><b>${due.today}</b><span>Heute</span></div>
        <div><b>${due.ok}</b><span>Okay</span></div>
      </div>
      ${renderDueRows(due.rows)}
    </section>

    <section class="tc2DashCard">
      <div class="tc2DashCardHead">
        <h3>Letzte Aktivitäten</h3>
      </div>
      ${acts.length?`<div class="tc2DashTaskList">
        ${acts.map(function(r){
          return `<div><span>${r.icon}</span><b>${esc(r.text)}</b><small>${esc(r.date||'-')}</small><em>›</em></div>`;
        }).join('')}
      </div>`:`<div class="tc2DashEmpty"><b>Noch keine Aktivitäten</b><span>Fütterungen, Gewichte und Häutungen erscheinen hier.</span></div>`}
    </section>

    <nav class="tc2BottomNav">
      <button class="on">▥<span>Übersicht</span></button>
      <button onclick="NGT500.route('dashboard')">●●●<span>Start</span></button>
      <button onclick="NGT500.route('food')">⌂<span>Futter</span></button>
      <button onclick="NGT500.route('assistant')">▣<span>KI</span></button>
      <button onclick="NGT500.route('backup')">▱<span>Backup</span></button>
    </nav>

  </section>`;
}

function afterRender(){
  tc2(true);
  updateCloudStatus();
  if(statusTimer)clearInterval(statusTimer);
  statusTimer=setInterval(updateCloudStatus,1500);
}

window.NGTDashboard={
  updateCloudStatus,
  googleSignIn,
  firestoreSave,
  firestoreLoad,
  openHknImport,
  manualAnimal,
  toggleBestand,
  openSmartDashboard
};

NGT500.register('dashboard',{render,afterRender});
NGT500.register('smartDashboard',{render:smartRender});

})();