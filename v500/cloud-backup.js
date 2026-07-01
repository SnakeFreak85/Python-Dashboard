(function(){
'use strict';
const META_KEY='terracontrol_cloud_meta_v1';
const LAST_KEY='terracontrol_cloud_last_backup_v1';
function load(k){try{return JSON.parse(localStorage.getItem(k)||'{}')||{}}catch(e){return {}}}
function save(k,o){localStorage.setItem(k,JSON.stringify(o||{}))}
function profile(){return load('tc_user_profile')}
function stripPhotosAnimal(a){const copy=JSON.parse(JSON.stringify(a||{}));if(Array.isArray(copy.photos)){copy.photos=copy.photos.map(p=>({date:p.date||'',type:p.type||'',note:p.note||'',cover:!!p.cover,omitted:true}))}return copy}
function stripPhotosData(data){const d=JSON.parse(JSON.stringify(data||{}));['koenig','boas','geckos','spinnen'].forEach(k=>{if(Array.isArray(d[k]))d[k]=d[k].map(stripPhotosAnimal)});return d}
function collectLocalStorage(){const out={};Object.keys(localStorage).forEach(k=>{if(k.startsWith('terracontrol_')||k.startsWith('tc_')||k.startsWith('ngt_')){try{out[k]=JSON.parse(localStorage.getItem(k))}catch(e){out[k]=localStorage.getItem(k)}}});return out}
function packageData(){const p=profile();const raw=NGTStore.data?NGTStore.data():{};const payload={app:'TerraControl',type:'cloud-backup',version:'1.0',createdAt:new Date().toISOString(),user:{name:p.name||'',email:p.email||'',sub:p.sub||'',provider:p.provider||''},data:stripPhotosData(raw),localStorage:collectLocalStorage(),notes:'Fotos werden in Phase B.2 noch nicht als Bilddaten gesichert.'};return payload}
function filename(){const dt=new Date().toISOString().replace(/[:.]/g,'-').slice(0,19);return 'TerraControl-Cloud-Backup-'+dt+'.json'}
function download(){const payload=packageData();const blob=new Blob([JSON.stringify(payload,null,2)],{type:'application/json'});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=filename();document.body.appendChild(a);a.click();a.remove();URL.revokeObjectURL(url);const meta={lastBackupAt:payload.createdAt,lastBackupType:'export',lastBackupName:a.download,user:payload.user};save(META_KEY,meta);save(LAST_KEY,payload);return meta}
function status(){return load(META_KEY)}
function restoreFromObject(obj){if(!obj||obj.app!=='TerraControl'){throw new Error('Kein TerraControl Backup.')}if(obj.data){localStorage.setItem('ngt_v500_data',JSON.stringify(obj.data));}if(obj.localStorage){Object.keys(obj.localStorage).forEach(k=>{try{localStorage.setItem(k,JSON.stringify(obj.localStorage[k]))}catch(e){}})}save(META_KEY,{lastRestoreAt:new Date().toISOString(),restoredBackupAt:obj.createdAt||'',lastBackupType:'restore',user:obj.user||{}});return true}
function importFile(file){return new Promise((resolve,reject)=>{const r=new FileReader();r.onload=function(){try{const obj=JSON.parse(String(r.result||'{}'));restoreFromObject(obj);resolve(obj)}catch(e){reject(e)}};r.onerror=reject;r.readAsText(file)})}
window.NGTCloudBackup={packageData,download,status,restoreFromObject,importFile};
})();