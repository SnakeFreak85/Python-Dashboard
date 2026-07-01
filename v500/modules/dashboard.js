(function(){
'use strict';
function userName(){
 const keys=['tc_user_profile','terracontrol_user','ngt_user','ngt_google_user'];
 for(const k of keys){try{const u=JSON.parse(localStorage.getItem(k)||'{}');if(u.name)return String(u.name).split(' ')[0];if(u.displayName)return String(u.displayName).split(' ')[0];if(u.given_name)return u.given_name;}catch(e){}}
 const seller=(()=>{try{return JSON.parse(localStorage.getItem('ngt_seller_profile_v1')||'{}')}catch(e){return {}}})();
 if(seller.name)return String(seller.name).split(' ')[0];
 return '';
}
function render(){
 const all=NGTStore.allAnimals().filter(x=>!['Archiv','Verkauft','Abgegeben','Verstorben'].includes(x.a.status));
 const buy=all.reduce((s,x)=>s+Number(x.a.buyPrice||0),0);
 const mv=all.reduce((s,x)=>s+NGTStore.market(x.a),0);
 const smart=window.NGTSmartDashboard?NGTSmartDashboard.render():'';
 const name=userName();
 return `<div class="card"><h2>Willkommen${name?' '+NGT500.esc(name):''}</h2><p class="muted">TerraControl 1.0 · Terraristik Dashboard</p><input placeholder="Tier suchen..." oninput="NGTDashboard.search(this.value)"><div id="searchBox"></div><p class="muted">TerraControl bündelt Bestand, Pflege, Fütterung, Dokumentation und Warnungen.</p></div>${smart}<div class="card"><h2>Bestandsübersicht</h2><div class="grid"><div class="stat">Aktiver Bestand<b>${all.length}</b></div><div class="stat">Kaufwert<b>${NGT500.money(buy)}</b></div><div class="stat">Marktwert<b>${NGT500.money(mv)}</b></div><div class="stat">Differenz<b>${NGT500.money(mv-buy)}</b></div></div></div>`;
}
function search(q){q=String(q||'').toLowerCase();const rows=NGTStore.allAnimals().filter(x=>JSON.stringify(x.a).toLowerCase().includes(q));document.getElementById('searchBox').innerHTML=q?rows.map(NGTUI.animalCard).join('')||'<p class="muted">Keine Treffer.</p>':'';}
window.NGTDashboard={search};NGT500.register('dashboard',{render});
})();