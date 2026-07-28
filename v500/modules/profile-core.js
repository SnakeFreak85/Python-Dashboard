(function(){
'use strict';

const P=window.NGTProfileInternal=
 window.NGTProfileInternal||{};

P.state={tab:'overview',ctx:{animalId:'',t:'',i:null},viewerIndex:-1,viewerKeyHandler:null,viewerPreviousFocus:null};
P.esc=function(value){return NGT500.esc(value||'');};
P.currentRow=function(){return NGTStore.resolveAnimal(P.state.ctx);};
P.current=function(){const row=P.currentRow();return row?row.a:null;};
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
P.action=function(icon,label,onclick){const action='<button class="tc2ProfileAction" onclick="'+onclick+'"><div class="tc2ProfileActionIcon">'+icon+'</div><div class="tc2ProfileActionText">'+P.esc(label)+'</div><div class="tc2ProfileActionArrow">›</div></button>';if(label!=='Gesundheit')return action;const context=P.state.ctx||{};const removeAction=context.animalId?"NGTAnimals.removeById('"+P.jsArg(context.animalId)+"')":"NGTAnimals.remove('"+P.jsArg(context.t)+"',"+Number(context.i||0)+")";return action+'<button class="tc2ProfileAction danger" style="grid-column:1/-1;width:100%;min-height:68px;background:linear-gradient(180deg,#d63a3a,#b6222b)!important;border:1px solid rgba(255,125,125,.55)!important;color:#fff!important;box-shadow:0 14px 30px rgba(125,0,12,.28)!important" onclick="'+removeAction+'"><div class="tc2ProfileActionIcon">🗑️</div><div class="tc2ProfileActionText">Tier löschen</div><div class="tc2ProfileActionArrow" style="color:#fff!important">›</div></button>';};
P.row=function(date,label,deleteAction){return '<div class="tc2ListRowFull"><div><b>'+P.esc(date||'-')+'</b><small>'+P.esc(label||'')+'</small></div><button class="danger" onclick="'+deleteAction+'">Löschen</button></div>';};

P.setContext=function(args){const next=args||P.state.ctx||{};const current=P.state.ctx||{};const row=NGTStore.resolveAnimal(next);const resolved=row?{...next,animalId:NGTStore.animalId(row.a),t:row.t,i:row.i}:next;const changed=String(resolved.animalId||'')!==String(current.animalId||'')||(!resolved.animalId&&(String(resolved.t||'')!==String(current.t||'')||Number(resolved.i||0)!==Number(current.i||0)));P.state.ctx=resolved;if(args&&args.tab)P.state.tab=args.tab;else if(changed)P.state.tab='overview';};
P.getTab=function(){return P.state.tab;};
P.setTab=function(tab){const context=P.state.ctx||{};P.state.tab=tab;const args=context.animalId?{animalId:context.animalId,tab:tab}:{t:context.t,i:Number(context.i||0),tab:tab};NGT500.route('profile',args,{replace:true,noHistory:true});};
P.getContext=function(){return P.state.ctx;};

})();
