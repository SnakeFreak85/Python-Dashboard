(function(){
'use strict';

const CFG='terracontrol_sync_config_v1';
const STATE='terracontrol_sync_state_v1';

let timer=null;
let running=false;

function load(k){
  try{return JSON.parse(localStorage.getItem(k)||'{}')||{}}
  catch(e){return {}}
}

function save(k,o){
  localStorage.setItem(k,JSON.stringify(o||{}));
}

function cfg(){
  return Object.assign({
    enabled:true,
    delayMs:15000,
    minIntervalMs:60000,
    checkOnStart:true,
    syncOnClose:true
  }, load(CFG));
}

function setConfig(o){
  save(CFG,Object.assign(cfg(),o||{}));
  return cfg();
}

function state(){
  return load(STATE);
}

function hash(){
  try{
    const d=NGTStore.data?NGTStore.data():{};
    const txt=JSON.stringify(d);
    return String(txt.length)+'-'+btoa(unescape(encodeURIComponent(txt.slice(0,2000)))).slice(0,32);
  }catch(e){
    return String(Date.now());
  }
}

function markDirty(reason){
  const s=state();
  s.dirty=true;
  s.reason=reason||'Änderung';
  s.lastChangeAt=new Date().toISOString();
  s.hash=hash();
  s.enabled=true;
  save(STATE,s);
}

function canRun(force){
  const c=cfg();
  const s=state();

  if(!c.enabled && !force)return false;
  if(running)return false;
  if(!window.NGTCloudBackup || !NGTCloudBackup.uploadToDrive)return false;

  if(!force && s.lastSyncAt && Date.now()-new Date(s.lastSyncAt).getTime()<c.minIntervalMs && !s.dirty){
    return false;
  }

  return true;
}

function syncNow(force){
  force=!!force;

  if(!canRun(force))return Promise.resolve(false);

  const s=state();

  if(!force && !s.dirty && s.lastSyncAt){
    return Promise.resolve(false);
  }

  running=true;
  s.status='syncing';
  s.startedAt=new Date().toISOString();
  save(STATE,s);

  return NGTCloudBackup.uploadToDrive()
    .then(meta=>{
      const n=state();
      n.dirty=false;
      n.status='ok';
      n.lastSyncAt=new Date().toISOString();
      n.lastDriveFileId=meta.driveFileId||'';
      n.lastBackupName=meta.lastBackupName||'';
      n.error='';
      save(STATE,n);
      return true;
    })
    .catch(e=>{
      const n=state();
      n.status='error';
      n.error=e.message||String(e);
      n.lastErrorAt=new Date().toISOString();
      save(STATE,n);
      throw e;
    })
    .finally(()=>{
      running=false;
    });
}

function syncBeforeClose(){
  const s=state();

  if(!cfg().syncOnClose)return;
  if(!s.dirty)return;

  if(window.NGTCloudBackup && NGTCloudBackup.uploadToDrive){
    syncNow(true).catch(()=>{});
  }
}

function start(){
  setConfig({enabled:true});

  if(window.NGT500 && NGT500.on){
    NGT500.on('store:changed',function(){
      markDirty('Lokale Daten geändert');
    });
  }

  window.addEventListener('pagehide',syncBeforeClose);

  document.addEventListener('visibilitychange',function(){
    if(document.visibilityState==='hidden'){
      syncBeforeClose();
    }
  });

  if(cfg().checkOnStart){
    markDirty('Startprüfung');
  }
}

function enable(v){
  setConfig({enabled:v!==false});
  const s=state();
  s.enabled=v!==false;
  save(STATE,s);
  if(v!==false)markDirty('Auto-Sync aktiviert');
}

function label(){
  const s=state();

  if(!cfg().enabled)return 'Auto-Sync aus';
  if(s.status==='syncing')return 'Synchronisierung läuft...';
  if(s.status==='error')return 'Sync-Fehler: '+(s.error||'unbekannt');
  if(s.dirty)return 'Auto-Sync aktiv – Änderungen werden beim Schließen gesichert';
  if(s.lastSyncAt)return 'Letzte Auto-Sicherung: '+new Date(s.lastSyncAt).toLocaleString('de-DE');

  return 'Auto-Sync aktiv';
}

window.NGTCloudSync={
  cfg,
  setConfig,
  state,
  markDirty,
  syncNow,
  start,
  enable,
  label
};

document.readyState==='loading'
  ? document.addEventListener('DOMContentLoaded',start)
  : start();

})();
