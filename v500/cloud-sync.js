(function(){
'use strict';
const CFG='terracontrol_sync_config_v1';
const STATE='terracontrol_sync_state_v1';
let timer=null,running=false;
function load(k){try{return JSON.parse(localStorage.getItem(k)||'{}')||{}}catch(e){return {}}}
function save(k,o){localStorage.setItem(k,JSON.stringify(o||{}))}
function cfg(){return Object.assign({enabled:false,delayMs:45000,minIntervalMs:300000,checkOnStart:true},load(CFG))}
function setConfig(o){save(CFG,Object.assign(cfg(),o||{}));return cfg()}
function state(){return load(STATE)}
function hash(){try{const d=NGTStore.data?NGTStore.data():{};return String(JSON.stringify(d)).length+'-'+btoa(unescape(encodeURIComponent(JSON.stringify(d).slice(0,2000)))).slice(0,32)}catch(e){return String(Date.now())}}
function markDirty(reason){const c=cfg();if(!c.enabled)return;const s=state();s.dirty=true;s.reason=reason||'Änderung';s.lastChangeAt=new Date().toISOString();s.hash=hash();save(STATE,s);schedule()}
function schedule(){const c=cfg();if(!c.enabled)return;if(timer)clearTimeout(timer);timer=setTimeout(syncNow,c.delayMs)}
function canRun(){const c=cfg(),s=state();if(!c.enabled)return false;if(running)return false;if(!window.NGTCloudBackup||!NGTCloudBackup.uploadToDrive)return false;if(s.lastSyncAt&&Date.now()-new Date(s.lastSyncAt).getTime()<c.minIntervalMs)return false;return true}
function syncNow(){const c=cfg();if(!c.enabled)return Promise.resolve(false);if(running)return Promise.resolve(false);if(!window.NGTCloudBackup||!NGTCloudBackup.uploadToDrive){return Promise.resolve(false)}const s=state();if(!s.dirty&&s.lastSyncAt)return Promise.resolve(false);if(!canRun()&&s.lastSyncAt){schedule();return Promise.resolve(false)}running=true;s.status='syncing';s.startedAt=new Date().toISOString();save(STATE,s);return NGTCloudBackup.uploadToDrive().then(meta=>{const n=state();n.dirty=false;n.status='ok';n.lastSyncAt=new Date().toISOString();n.lastDriveFileId=meta.driveFileId||'';n.lastBackupName=meta.lastBackupName||'';n.error='';save(STATE,n);return true}).catch(e=>{const n=state();n.status='error';n.error=e.message||String(e);n.lastErrorAt=new Date().toISOString();save(STATE,n);throw e}).finally(()=>{running=false})}
function start(){patchStorage();if(cfg().enabled){markDirty('Startprüfung')}}
function enable(v){setConfig({enabled:!!v});const s=state();s.enabled=!!v;save(STATE,s);if(v)markDirty('Auto-Sync aktiviert')}
function patchStorage(){if(window.__tcSyncPatched)return;window.__tcSyncPatched=true;const rawSet=localStorage.setItem.bind(localStorage);localStorage.setItem=function(k,v){rawSet(k,v);if(String(k).startsWith('ngt_')||String(k).startsWith('terracontrol_settings')){setTimeout(()=>markDirty('Lokale Daten geändert'),0)}}}
function label(){const s=state();if(!cfg().enabled)return 'Auto-Sync aus';if(s.status==='syncing')return 'Synchronisierung läuft...';if(s.status==='error')return 'Sync-Fehler: '+(s.error||'unbekannt');if(s.lastSyncAt)return 'Letzte Auto-Sicherung: '+new Date(s.lastSyncAt).toLocaleString('de-DE');return 'Auto-Sync bereit'}
window.NGTCloudSync={cfg,setConfig,state,markDirty,syncNow,start,enable,label};
document.readyState==='loading'?document.addEventListener('DOMContentLoaded',start):start();
})();