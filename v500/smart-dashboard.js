(function(){
'use strict';

const DAY=86400000;

function esc(v){return NGT500.esc(v||'')}
function today0(){const d=new Date();d.setHours(0,0,0,0);return d}
function daysSince(date){const t=Date.parse(date||'');if(!t)return null;const d=new Date(t);d.setHours(0,0,0,0);return Math.floor((today0()-d)/DAY)}
function latest(list){return (list||[]).slice().sort((a,b)=>String(b.date||'').localeCompare(String(a.date||'')))[0]||null}

function animals(){
  try{return NGTStore.allAnimals().filter(x=>!['Archiv','Verkauft','Abgegeben','Verstorben'].includes(x.a.status))}
  catch(e){return []}
}

function inventory(){
  try{return (NGTStore.data().foodInventory||[]).filter(x=>Number(x.qty||0)>0)}
  catch(e){return []}
}

function documents(){
  try{
    const d=NGTStore.data();
    return []
      .concat(d.documents||[])
      .concat(d.sales||[])
      .concat(d.clutches||[]);
  }catch(e){return []}
}

function foodKey(s){return NGTStore.foodKey?NGTStore.foodKey(s):String(s||'').toLowerCase().replace(/\s+/g,'')}
function foodLabel(s){return NGTStore.foodLabel?NGTStore.foodLabel(s):String(s||'')}
function feedName(a){return a.defaultFeeder||a.futterStandard||a.standardFeed||''}
function feedInterval(a){return Math.max(1,Number(a.feedIntervalDays||a.feedingInterval||a.feedInterval||14))}
function weightInterval(a){return Math.max(1,Number(a.weightIntervalDays||a.weightInterval||30))}

function dueFeed(a,offset){
  const lf=latest(a.feeds);
  const days=daysSince(lf&&lf.date);
  if(days===null)return false;
  return days>=feedInterval(a)-offset;
}

function dueWeight(a,offset){
  const lw=latest(a.weights);
  const days=daysSince(lw&&lw.date);
  if(days===null)return false;
  return days>=weightInterval(a)-offset;
}

function plannedFeeds(offset){
  return animals().filter(x=>dueFeed(x.a,offset)).map(x=>({
    name:x.a.name||'Unbenannt',
    food:feedName(x.a),
    type:'Fütterung',
    t:x.t
  }));
}

function plannedWeights(offset){
  return animals().filter(x=>dueWeight(x.a,offset)).map(x=>({
    name:x.a.name||'Unbenannt',
    type:'Gewicht',
    t:x.t
  }));
}

function groupRows(){
  const all=animals(),rows=[];
  (NGTStore.TYPES||[]).forEach(t=>{
    const count=all.filter(x=>x.t===t).length;
    if(count>0){
      rows.push({
        t,
        count,
        label:(NGTStore.LABELS&&NGTStore.LABELS[t])?NGTStore.LABELS[t]:t
      });
    }
  });
  return rows;
}

function lowFood(){
  return inventory().filter(x=>Number(x.qty||0)<=5);
}

function recentActivities(){
  const rows=[];
  animals().forEach(x=>{
    const a=x.a;
    (a.feeds||[]).slice(-2).forEach(f=>rows.push({icon:'🍽',title:a.name||'Unbenannt',sub:'Fütterung · '+(f.date||'-')}));
    (a.weights||[]).slice(-2).forEach(w=>rows.push({icon:'⚖',title:a.name||'Unbenannt',sub:'Gewicht · '+(w.date||'-')}));
    (a.sheds||[]).slice(-2).forEach(s=>rows.push({icon:'🧤',title:a.name||'Unbenannt',sub:'Häutung · '+(s.date||'-')}));
  });
  return rows.slice(-4).reverse();
}

function iconFor(t){
  if(t==='boas')return '🐍';
  if(t==='geckos')return '🦎';
  if(t==='spinnen')return '🕷';
  return '●';
}

function donutStyle(groups,total){
  if(!total)return '';
  const cols=['#63d93f','#2f86e8','#8b3bd6','#ff9500'];
  let start=0;
  const parts=groups.map((g,i)=>{
    const deg=(g.count/total)*360;
    const p=`${cols[i%cols.length]} ${start}deg ${start+deg}deg`;
    start+=deg;
    return p;
  });
  return `style="background:conic-gradient(${parts.join(',')})"`;
}

function kpi(icon,num,label,sub,cls){
  return `<div class="tc2SDkpi ${cls||''}">
    <span>${icon}</span>
    <b>${num}</b>
    <small>${esc(label)}</small>
    ${sub?`<em>${esc(sub)}</em>`:''}
  </div>`;
}

function taskRow(r,i){
  return `<button class="tc2SDtask">
    <span>${i%3===0?'🟣':i%3===1?'🟢':'⚡'}</span>
    <div>
      <b>${esc(r.name)}</b>
      <small>${esc(r.type)}</small>
    </div>
    <em>heute</em>
    <i>›</i>
  </button>`;
}

function foodRow(f){
  const qty=Number(f.qty||0);
  return `<button class="tc2SDfood">
    <div class="tc2SDfoodImg">🥩</div>
    <div>
      <b>${esc(f.label||f.name)}</b>
      <small>Bestand: ${qty}</small>
    </div>
    <em class="${qty<=5?'warn':''}">${qty<=5?'NIEDRIG':'OK'}</em>
    <i>›</i>
  </button>`;
}

function render(){
  const all=animals();
  const inv=inventory();
  const docs=documents();
  const groups=groupRows();
  const today=[...plannedFeeds(0),...plannedWeights(0)];
  const low=lowFood();
  const acts=recentActivities();
  const total=all.length;

  return `
    <section class="tc2SD">

      <header class="tc2SDtop">
        <button onclick="NGT500.route('dashboard')">☰</button>
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
        ${kpi('●●●',total,'Tiere','','green')}
        ${kpi('⌂',inv.length,'Futterartikel',low.length?low.length+' niedrig':'','orange')}
        ${kpi('▣',today.length,'Heute fällig',today.length?today.length+' Aufgaben':'','orange')}
        ${kpi('▱',docs.length,'Dokumente','','blue')}
      </div>

      <section class="tc2SDcard">
        <div class="tc2SDcardHead">
          <h3>Bestand nach Tierart</h3>
          <button onclick="NGT500.route('dashboard')">Alle anzeigen ›</button>
        </div>
        ${
          groups.length
          ? `<div class="tc2SDdonutRow">
              <div class="tc2SDdonut" ${donutStyle(groups,total)}>
                <div><b>${total}</b><span>Gesamt</span></div>
              </div>
              <div class="tc2SDlegend">
                ${groups.map((g,i)=>`<button onclick="NGT500.route('animals',{t:'${g.t}'})">
                  <i class="c${i%4}"></i>
                  <span>${esc(g.label.replace(/^.\s*/,''))}</span>
                  <b>${g.count}</b>
                </button>`).join('')}
              </div>
            </div>`
          : `<div class="tc2SDempty">Noch keine Tiere im Bestand.</div>`
        }
      </section>

      <section class="tc2SDcard">
        <div class="tc2SDcardHead">
          <h3>Heute fällig</h3>
          <button>Alle anzeigen ›</button>
        </div>
        ${
          today.length
          ? today.slice(0,3).map(taskRow).join('')+(today.length>3?`<div class="tc2SDmore">+ ${today.length-3} weitere</div>`:'')
          : `<div class="tc2SDempty">Heute nichts fällig.</div>`
        }
      </section>

      <section class="tc2SDcard">
        <div class="tc2SDcardHead">
          <h3>Futterbestand</h3>
          <button onclick="NGT500.route('food')">Alle anzeigen ›</button>
        </div>
        ${
          inv.length
          ? inv.slice(0,3).map(foodRow).join('')
          : `<div class="tc2SDempty">Kein Futterbestand erfasst.</div>`
        }
      </section>

      <section class="tc2SDcard">
        <div class="tc2SDcardHead">
          <h3>Aktivitäten</h3>
          <button>Alle anzeigen ›</button>
        </div>
        ${
          acts.length
          ? acts.map(a=>`<div class="tc2SDactivity"><span>${a.icon}</span><div><b>${esc(a.title)}</b><small>${esc(a.sub)}</small></div></div>`).join('')
          : `<div class="tc2SDempty">Noch keine Aktivitäten vorhanden.</div>`
        }
      </section>

      <nav class="tc2SDnav">
        <button class="on">▥<span>Übersicht</span></button>
        <button onclick="NGT500.route('dashboard')">●●●<span>Start</span></button>
        <button onclick="NGT500.route('food')">⌂<span>Futter</span></button>
        <button onclick="NGT500.route('qr')">▱<span>QR</span></button>
        <button onclick="NGT500.route('settings')">⚙<span>System</span></button>
      </nav>

    </section>
  `;
}

window.NGTSmartDashboard={render};
if(window.NGT500)NGT500.register('smartDashboard',{render});

})();