(function(){
'use strict';
if(window.NGTV2&&window.NGTV2.ready)return;
const LOG_KEY='ngt_v2_logs';
const listeners={};
function now(){return new Date().toISOString();}
function clone(v){try{return JSON.parse(JSON.stringify(v));}catch(e){return v;}}
function emit(type,payload){(listeners[type]||[]).forEach(fn=>{try{fn(payload);}catch(e){log('listener-error',{type,error:String(e&&e.message||e)});}});(listeners['*']||[]).forEach(fn=>{try{fn(type,payload);}catch(e){}});}
function on(type,fn){if(!listeners[type])listeners[type]=[];listeners[type].push(fn);return function(){listeners[type]=listeners[type].filter(x=>x!==fn);};}
function log(type,data){const entry={time:now(),type,data:data||{}};try{const arr=JSON.parse(localStorage.getItem(LOG_KEY)||'[]');arr.push(entry);localStorage.setItem(LOG_KEY,JSON.stringify(arr.slice(-250)));}catch(e){} if(window.console&&console.debug)console.debug('[NGT]',type,data||'');emit('log',entry);return entry;}
function error(type,err,data){return log(type,{error:String(err&&err.message||err),stack:err&&err.stack,data:data||{}});}
function getData(){if(window.NGTData&&NGTData.load)return NGTData.load();try{if(typeof db!=='undefined'&&db)return db;}catch(e){}return window.db||{};}
function saveData(data,source){if(window.NGTData&&NGTData.save)return NGTData.save(data,source||'v2-core');try{localStorage.setItem('spd_v53',JSON.stringify(data));window.db=data;}catch(e){error('save-failed',e);}return data;}
function validateAnimal(a,path){const issues=[];if(!a||typeof a!=='object'){issues.push(path+': kein Objekt');return issues;}if(!a.uuid&&!a.uid)issues.push(path+': keine UUID');['feeds','weights','sheds'].forEach(k=>{if(a[k]&&!Array.isArray(a[k]))issues.push(path+'.'+k+': keine Liste');});return issues;}
function validate(data){data=data||getData();const issues=[];['koenig','boas','geckos','spinnen'].forEach(t=>{if(!Array.isArray(data[t]))issues.push(t+': keine Liste');else data[t].forEach((a,i)=>issues.push(...validateAnimal(a,t+'['+i+']')));});return {valid:issues.length===0,issues};}
function transaction(label,fn){const before=getData();const draft=clone(before);try{const result=fn(draft);const saved=saveData(draft,label);emit('data:changed',{label,before,after:saved,result});log('transaction',{label});return result;}catch(e){error('transaction-failed',e,{label});emit('data:error',{label,error:e});throw e;}}
function activity(kind,text,meta){const data=getData();if(!Array.isArray(data.activities))data.activities=[];data.activities.unshift({id:'act-'+Date.now().toString(36)+'-'+Math.random().toString(36).slice(2),time:now(),kind,text,meta:meta||{}});data.activities=data.activities.slice(0,300);saveData(data,'activity');emit('activity',{kind,text,meta});}
function recentActivities(limit){const data=getData();return (data.activities||[]).slice(0,limit||25);}
window.NGTV2={ready:true,on,emit,log,error,getData,saveData,validate,transaction,activity,recentActivities};
log('v2-core-ready');
})();
