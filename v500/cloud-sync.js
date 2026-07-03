(function(){
'use strict';

const CFG='terracontrol_sync_config_v1';
const STATE='terracontrol_sync_state_v1';

let timer=null;
let running=false;

function load(k){
    try{
        return JSON.parse(localStorage.getItem(k)||'{}')||{};
    }catch(e){
        return {};
    }
}

function save(k,v){
    localStorage.setItem(k,JSON.stringify(v));
}

function cfg(){
    return Object.assign({
        enabled:true,
        delayMs:12000,
        minIntervalMs:20000,
        checkOnStart:true
    },load(CFG));
}

function setConfig(v){
    save(CFG,Object.assign(cfg(),v||{}));
    return cfg();
}

function state(){
    return load(STATE);
}

function hasCloud(){
    return !!(window.NGTCloudBackup && NGTCloudBackup.uploadToDrive);
}

function markDirty(reason){

    const s=state();

    s.dirty=true;
    s.reason=reason||'Änderung';
    s.lastChangeAt=new Date().toISOString();
    s.status='pending';

    save(STATE,s);

    schedule();
}

function schedule(){

    if(timer){
        clearTimeout(timer);
    }

    timer=setTimeout(function(){

        syncNow(false);

    },cfg().delayMs);

}

function syncNow(force){

    force=!!force;

    if(running){
        return Promise.resolve(false);
    }

    if(!hasCloud()){

        const s=state();
        s.status="waiting-cloud";
        save(STATE,s);

        return Promise.resolve(false);

    }

    const s=state();

    if(!force){

        if(!s.dirty){
            return Promise.resolve(false);
        }

        if(s.lastSyncAt){

            const diff=Date.now()-new Date(s.lastSyncAt).getTime();

            if(diff<cfg().minIntervalMs){

                schedule();
                return Promise.resolve(false);

            }

        }

    }

    running=true;

    s.status="syncing";
    save(STATE,s);

    return NGTCloudBackup.uploadToDrive()

        .then(function(meta){

            const n=state();

            n.dirty=false;
            n.status="ok";
            n.error="";
            n.lastSyncAt=new Date().toISOString();

            if(meta){

                n.lastDriveFileId=meta.driveFileId||"";
                n.lastBackupName=meta.lastBackupName||"";

            }

            save(STATE,n);

            return true;

        })

        .catch(function(err){

            const n=state();

            n.status="error";
            n.error=err.message||String(err);

            save(STATE,n);

            return false;

        })

        .finally(function(){

            running=false;

        });

}

function enable(v){

    setConfig({
        enabled:v!==false
    });

    if(v!==false){

        markDirty("AutoSync aktiviert");

    }

}

function label(){

    const s=state();

    if(!cfg().enabled){

        return "AutoSync aus";

    }

    if(s.status==="waiting-cloud"){

        return "Cloud wird vorbereitet...";

    }

    if(s.status==="pending"){

        return "Änderungen werden automatisch gespeichert...";

    }

    if(s.status==="syncing"){

        return "Synchronisierung läuft...";

    }

    if(s.status==="error"){

        return "Synchronisierung fehlgeschlagen";

    }

    if(s.lastSyncAt){

        return "Letzte Sicherung: "+new Date(s.lastSyncAt).toLocaleString("de-DE");

    }

    return "AutoSync aktiv";

}

function start(){

    setConfig({
        enabled:true
    });

    if(window.NGT500 && NGT500.on){

        NGT500.on("store:changed",function(){

            markDirty("Daten geändert");

        });

    }

    window.addEventListener("online",function(){

        if(state().dirty){

            schedule();

        }

    });

    document.addEventListener("visibilitychange",function(){

        if(document.visibilityState==="visible"){

            if(state().dirty){

                schedule();

            }

        }

    });

}

window.NGTCloudSync={

    cfg,
    setConfig,
    state,
    enable,
    markDirty,
    syncNow,
    label,
    start

};

if(document.readyState==="loading"){

    document.addEventListener("DOMContentLoaded",start);

}else{

    start();

}

})();
