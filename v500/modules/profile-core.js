(function(){
'use strict';

const P=window.NGTProfileInternal=
 window.NGTProfileInternal||{};

P.state={tab:'overview',ctx:{t:'',i:0},viewerIndex:-1,viewerKeyHandler:null,viewerPreviousFocus:null};
P.esc=function(value){return NGT500.esc(value||'');};
P.current=function(){return NGTStore.animal(P.state.ctx.t,P.state.ctx.i);};
P.ensure=function(animal){return AnimalEngine.ensureHistories(animal);};
P.latest=function(list){return AnimalEngine.latest(list);};
P.daysSince=function(date){return AnimalEngine.daysSinceOr(date,9999);};
P.age=function(birth){return AnimalEngine.getAgeYearsText({birth:birth});};
P.s=function(value,length){return String(value==null?'':value).replace(/[\n\r|]/g,' ').slice(0,length||80);};
P.opt=function(list,currentValue){return (list||[]).map(function(value){const selected=String(currentValue||'')===String(value);return '<option value="'+P.esc(value)+'" '+(selected?'selected':'')+'>'+P.esc(value)+'</option>';}).join('');};
P.jsArg=function(value){return String(value||'').replace(/\\/g,'\\\\').replace(/'/g,"\\'");};
P.text=function(value){return String(value==null?'':value).trim();};
P.sexCode=function(value){value=String(value||'').toLowerCase();if(value.includes('weib'))return '0.1';if(value.includes('männ')||value.includes('maenn'))return '1.0';return '0.0';};
P.scientificName=function(animal){return AnimalEngine.getScientificName(animal)||'-';};
P.action=function(icon,label,onclick){const action='<button class="tc2ProfileAction" onclick="'+onclick+'"><div class="tc2ProfileActionIcon">'+icon+'</div><div class="tc2ProfileActionText">'+P.esc(label)+'</div><div class="tc2ProfileActionArrow">›</div></button>';if(label!=='Gesundheit')return action;const context=P.state.ctx||{};const removeAction="NGTAnimals.remove('"+P.jsArg(context.t)+"',"+Number(context.i||0)+")";return action+'<button class="tc2ProfileAction danger" style="grid-column:1/-1;width:100%;min-height:68px;background:linear-gradient(180deg,#d63a3a,#b6222b)!important;border:1px solid rgba(255,125,125,.55)!important;color:#fff!important;box-shadow:0 14px 30px rgba(125,0,12,.28)!important" onclick="'+removeAction+'"><div class="tc2ProfileActionIcon">🗑️</div><div class="tc2ProfileActionText">Tier löschen</div><div class="tc2ProfileActionArrow" style="color:#fff!important">›</div></button>';};
P.row=function(date,label,deleteAction){return '<div class="tc2ListRowFull"><div><b>'+P.esc(date||'-')+'</b><small>'+P.esc(label||'')+'</small></div><button class="danger" onclick="'+deleteAction+'">Löschen</button></div>';};

P.shedForm=function(){return '<div class="subcard tc2SubCard"><h3>Häutung eintragen</h3><input id="shedDate" type="date" value="'+NGT500.today()+'"><button onclick="NGTProfile.addShed()">Häutung speichern</button></div>';};
P.shedList=function(animal){const rows=(animal.sheds||[]).map(function(entry,index){return {entry:entry,index:index};}).reverse().map(function(item){return P.row(item.entry.date,'Häutung',"NGTProfile.deleteEntry('sheds',"+item.index+")");}).join('');return '<div class="subcard tc2SubCard"><h3>Häutungen</h3>'+(rows||'<p class="muted">Keine Häutungen.</p>')+'</div>';};
P.addShed=function(){const animal=P.current();const input=document.getElementById('shedDate');if(!animal)return;P.ensure(animal);animal.sheds.push({id:NGT500.uid(),date:(input&&input.value)||NGT500.today(),complete:true});NGTStore.save();P.setTab('sheds');};

P.weightForm=function(){return '<div class="subcard tc2SubCard"><h3>Gewicht eintragen</h3><input id="weightDate" type="date" value="'+NGT500.today()+'"><input id="weightValue" type="number" min="0" step="0.1" placeholder="Gewicht in g"><button onclick="NGTProfile.addWeight()">Gewicht speichern</button></div>';};
P.weightList=function(animal){const rows=(animal.weights||[]).map(function(entry,index){return {entry:entry,index:index};}).reverse().map(function(item){return P.row(item.entry.date,item.entry.weight+' g',"NGTProfile.deleteEntry('weights',"+item.index+")");}).join('');return '<div class="subcard tc2SubCard"><h3>Gewichte</h3>'+(rows||'<p class="muted">Keine Gewichte.</p>')+'</div>';};
P.addWeight=function(){const animal=P.current();const value=document.getElementById('weightValue');const date=document.getElementById('weightDate');const weight=Number(value&&value.value);if(!animal)return;if(!Number.isFinite(weight)||weight<=0){window.alert('Bitte ein gültiges Gewicht eingeben.');return;}P.ensure(animal);animal.weights.push({id:NGT500.uid(),date:(date&&date.value)||NGT500.today(),weight:weight});animal.weight=weight;NGTStore.save();P.setTab('weights');};

P.deleteEntry=function(kind,index){const animal=P.current();if(!animal||!Array.isArray(animal[kind])||index<0||index>=animal[kind].length)return;animal[kind].splice(index,1);if(kind==='weights'){const latest=P.latest(animal.weights);animal.weight=latest?latest.weight:'';}NGTStore.save();P.setTab(P.getTab());};
P.charts=function(animal){return '<div class="subcard tc2SubCard"><h3>Gewicht</h3><p class="muted">'+(animal.weights||[]).length+' Einträge</p></div><div class="subcard tc2SubCard"><h3>Fütterungen</h3><p class="muted">'+(animal.feeds||[]).length+' Einträge</p></div>';};

P.setContext=function(args){const next=args||P.state.ctx||{};const current=P.state.ctx||{};const changed=String(next.t||'')!==String(current.t||'')||Number(next.i||0)!==Number(current.i||0);P.state.ctx=next;if(args&&args.tab)P.state.tab=args.tab;else if(changed)P.state.tab='overview';};
P.getTab=function(){return P.state.tab;};
P.setTab=function(tab){const context=P.state.ctx||{};P.state.tab=tab;NGT500.route('profile',{t:context.t,i:Number(context.i||0),tab:tab},{replace:true,noHistory:true});};
P.getContext=function(){return P.state.ctx;};

})();