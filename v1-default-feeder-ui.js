(function(){
'use strict';
const TYPES=['koenig','boas','geckos','spinnen'];
const SNAKE=['Ratte 10g','Ratte 20g','Ratte 30g','Ratte 50g','Ratte 70g','Ratte 90g','Ratte 120g','Ratte 150g','Ratte 200g','Ratte 250g','Maus 10g','Maus 20g','Maus 30g','Maus 50g','ASF 20g','ASF 30g','ASF 50g','ASF 70g','ASF 90g','Küken'];
const GECKO=['Heimchen klein','Heimchen mittel','Heimchen groß','Schabe klein','Schabe mittel','Schabe groß'];
const SPIDER=['Heimchen klein','Heimchen mittel','Heimchen groß','Schabe klein','Schabe mittel','Schabe groß'];
function optionsFor(t){return t==='geckos'?GECKO:t==='spinnen'?SPIDER:SNAKE;}
function db(){if(window.NGTData&&NGTData.load)return NGTData.load();try{if(typeof window.db!=='undefined')return window.db;}catch(e){}return {koenig:[],boas:[],geckos:[],spinnen:[]};}
function saveData(data){if(window.NGTData&&NGTData.save)return NGTData.save(data,'default-feeder-ui');try{localStorage.setItem('spd_v53',JSON.stringify(data));}catch(e){}return data;}
function animal(t,i){const data=db();return data[t]&&data[t][i];}
function injectEditor(t,i){
 const a=animal(t,i); if(!a)return;
 const note=document.getElementById('ae_note'); if(!note||document.getElementById('ae_default_feeder'))return;
 const wrap=document.createElement('div');
 wrap.id='ae_default_feeder_wrap';
 const current=a.defaultFeeder||a.futterStandard||a.standardFeed||'';
 wrap.innerHTML='<label style="display:block;margin-top:8px;font-weight:bold">🍽️ Standard-Futtertiergröße</label><select id="ae_default_feeder"><option value="">Kein Standard</option>'+optionsFor(t).map(x=>'<option value="'+x+'">'+x+'</option>').join('')+'</select>';
 note.parentNode.insertBefore(wrap,note);
 const select=document.getElementById('ae_default_feeder');
 if(select) select.value=current;
}
function patchEditor(){
 if(typeof window.openAnimalEditor==='function'&&!window.openAnimalEditor.__defaultFeederPatched){
  const old=window.openAnimalEditor;
  window.openAnimalEditor=function(t,i){const r=old.apply(this,arguments);setTimeout(()=>injectEditor(t,i),0);return r;};
  window.openAnimalEditor.__defaultFeederPatched=true;
 }
 if(typeof window.saveAnimalEditor==='function'&&!window.saveAnimalEditor.__defaultFeederPatched){
  const old=window.saveAnimalEditor;
  window.saveAnimalEditor=function(t,i){
   const select=document.getElementById('ae_default_feeder');
   if(select){const data=db();if(data[t]&&data[t][i]){data[t][i].defaultFeeder=select.value;data[t][i].futterStandard=select.value;data[t][i].standardFeed=select.value;saveData(data);}}
   const r=old.apply(this,arguments);
   const data=db();if(select&&data[t]&&data[t][i]){data[t][i].defaultFeeder=select.value;data[t][i].futterStandard=select.value;data[t][i].standardFeed=select.value;saveData(data);}
   return r;
  };
  window.saveAnimalEditor.__defaultFeederPatched=true;
 }
}
function showBadges(){
 const data=db();
 TYPES.forEach(t=>{const section=document.getElementById(t);if(!section)return;section.querySelectorAll('.animal').forEach((card,i)=>{const a=data[t]&&data[t][i];if(!a)return;let badge=card.querySelector('[data-default-feeder-badge]');const value=a.defaultFeeder||a.futterStandard||a.standardFeed||'';if(!value){if(badge)badge.remove();return;}if(!badge){badge=document.createElement('div');badge.setAttribute('data-default-feeder-badge','true');badge.style.margin='6px 0';card.insertBefore(badge,card.firstChild.nextSibling);}badge.innerHTML='🍽️ Standard-Futter: <b>'+String(value).replace(/[&<>]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;'}[c]))+'</b>';});});
}
function patchRender(){if(typeof window.render==='function'&&!window.render.__defaultFeederPatched){const old=window.render;window.render=function(){const r=old.apply(this,arguments);setTimeout(showBadges,0);return r;};window.render.__defaultFeederPatched=true;}}
function init(){patchEditor();patchRender();showBadges();let n=0;const timer=setInterval(()=>{patchEditor();patchRender();showBadges();if(++n>20)clearInterval(timer);},500);}
document.readyState==='loading'?document.addEventListener('DOMContentLoaded',init):init();
})();
