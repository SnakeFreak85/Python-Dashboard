(function(){
'use strict';
function render(){return `<div class="card"><h2>💾 Backup</h2><button onclick="NGTBackup.export()">⬇️ Backup exportieren</button><input type="file" accept="application/json" onchange="NGTBackup.import(this.files[0])"><p class="muted">Google Drive 2.0 wird später als eigenes Modul angebunden.</p></div>`}
function exportData(){const blob=new Blob([NGTStore.exportJson()],{type:'application/json'});const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='ng-terrarium-v500-backup.json';a.click()}
function importData(file){if(!file)return;const r=new FileReader();r.onload=()=>{try{NGTStore.importJson(r.result);alert('Import erfolgreich');NGT500.route('dashboard')}catch(e){alert('Import fehlgeschlagen')}};r.readAsText(file)}
window.NGTBackup={export:exportData,import:importData};NGT500.register('backup',{render});
})();
