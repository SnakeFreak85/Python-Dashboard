(function(){
'use strict';
function statusOptions(cur){return ['Bestand','Nachzucht','Verkauft','Abgegeben','Verstorben','Archiv'].map(s=>`<option ${cur===s?'selected':''}>${s}</option>`).join('')}
function opt(list,cur){return (list||[]).map(v=>`<option value="${NGT500.esc(v)}" ${String(cur||'')===String(v)?'selected':''}>${NGT500.esc(v)}</option>`).join('')}
function hknDraft(){try{return JSON.parse(sessionStorage.getItem('terracontrol_hkn_import_v1')||'null')}catch(e){return null}}
function hknInfo(){const h=hknDraft();if(!h)return '';return `<div class="subcard ok"><h3>📄 Herkunftsnachweis erkannt</h3><p class="muted">Foto/Datei wurde übernommen. KI-Auswertung folgt als nächster Schritt. Du kannst das Tier jetzt bereits manuell anhand des HKN anlegen.</p>${h.data&&String(h.data).startsWith('data:image')?`<img class="photo" src="${h.data}">`:''}<p><b>Datei:</b><br>${NGT500.esc(h.name||'Herkunftsnachweis')}</p></div>`}
function render(args){args=args||{};const t=args.t||'koenig';const edit=args.edit;const hkn=!!args.hkn;const rows=(NGTStore.data()[t]||[]);const list=rows.map((a,i)=>NGTUI.animalCard({t,i,a})).join('')||'<div class="subcard"><h3>Noch keine Tiere</h3><p class="muted">Lege dein erstes Tier an. Danach kannst du Fütterungen, Häutungen, Gewichte, Fotos und den digitalen Tierpass pflegen.</p></div>';return `<div class="card"><h2>${NGTStore.LABELS[t]}</h2><button onclick="NGTAnimals.openEditor('${t}')">Tier anlegen</button>${hkn?hknInfo()+editor(t,undefined,true):''}${edit!==undefined?editor(t,Number(edit)):''}<div>${list}</div></div>`}
function editor(t,i,fromHkn){
 const a=i!==undefined?NGTStore.animal(t,i):{};
 const parsed=NGTStore.parseFeeder(a.defaultFeeder||a.futterStandard||a.standardFeed||'');
 const defState=a.defaultFeederState||parsed.state||'Frost';
 const defType=a.defaultFeederType||parsed.prey||'Ratte';
 const defSize=a.defaultFeederSize||parsed.size||((NGTStore.FEEDER_SIZES[defType]||[])[0]||'');
 const feedInterval=a.feedIntervalDays||a.feedingInterval||a.feedInterval||14;
 return `<div class="subcard"><h3>${i!==undefined?'Tier bearbeiten':(fromHkn?'Tier aus HKN anlegen':'Tier anlegen')}</h3>
 <input id="edName" placeholder="Name" value="${NGT500.esc(a.name||'')}">
 <input id="edMorph" placeholder="Morph" value="${NGT500.esc(a.morph||'')}">
 <input id="edWeight" type="number" placeholder="Gewicht" value="${NGT500.esc(a.weight||'')}">
 <input id="edOrigin" placeholder="Herkunft / ENZ / FNZ" value="${NGT500.esc(a.origin||a.originType||'')}">
 <input id="edBirth" type="date" value="${NGT500.esc(a.birth||a.birthDate||'')}">
 <input id="edFather" placeholder="Vatertier" value="${NGT500.esc(a.father||a.vater||a.sire||'')}">
 <input id="edMother" placeholder="Muttertier" value="${NGT500.esc(a.mother||a.mutter||a.dam||'')}">
 <input id="edFeedInterval" type="number" min="1" placeholder="Fütterungsintervall in Tagen" value="${NGT500.esc(feedInterval)}">
 <input id="edBuy" type="number" placeholder="Kaufpreis" value="${NGT500.esc(a.buyPrice||'')}">
 <select id="edSex"><option ${a.sex==='Unbestimmt'?'selected':''}>Unbestimmt</option><option ${a.sex==='Männlich'?'selected':''}>Männlich</option><option ${a.sex==='Weiblich'?'selected':''}>Weiblich</option></select>
 <select id="edStatus">${statusOptions(a.status||'Bestand')}</select>
 <h3>Standardfutter</h3>
 <select id="edFeederState"><option ${defState==='Frost'?'selected':''}>Frost</option><option ${defState==='Lebend'?'selected':''}>Lebend</option></select>
 <select id="edFeederType" onchange="NGTAnimals.refreshSizeSelect('edFeederType','edFeederSize')">${opt(NGTStore.FEEDER_TYPES,defType)}</select>
 <select id="edFeederSize">${opt(NGTStore.FEEDER_SIZES[defType]||[],defSize)}</select>
 <p class="muted">Gewichtsintervall: 30 Tage festgelegt.</p>
 <textarea id="edNote" placeholder="Notizen">${NGT500.esc(a.note||'')}</textarea>
 <button onclick="NGTAnimals.save('${t}',${i===undefined?'null':i})">Speichern</button></div>`
}
function refreshSizeSelect(typeId,sizeId){const type=document.getElementById(typeId).value;const size=document.getElementById(sizeId);size.innerHTML=(NGTStore.FEEDER_SIZES[type]||[]).map(v=>`<option value="${NGT500.esc(v)}">${NGT500.esc(v)}</option>`).join('')}
function openEditor(t){document.querySelector('.card').insertAdjacentHTML('afterbegin',editor(t));}
function save(t,i){
 const old=i===null?{}:NGTStore.animal(t,i);
 const interval=Math.max(1,Number(edFeedInterval.value||14));
 const state=edFeederState.value||'Frost';
 const type=edFeederType.value||'Ratte';
 const size=edFeederSize.value||'';
 const feeder=NGTStore.feederLabel(state,type,size);
 const h=hknDraft();
 const noteBase=edNote.value.trim();
 const note=h&&i===null?(noteBase?noteBase+'\n\n':'')+'HKN importiert: '+(h.name||'Herkunftsnachweis'):noteBase;
 const a={...old,name:edName.value.trim()||'Unbenannt',morph:edMorph.value.trim(),weight:edWeight.value,origin:edOrigin.value.trim(),originType:edOrigin.value.trim(),birth:edBirth.value,father:edFather.value.trim(),vater:edFather.value.trim(),sire:edFather.value.trim(),mother:edMother.value.trim(),mutter:edMother.value.trim(),dam:edMother.value.trim(),feedIntervalDays:interval,feedingInterval:interval,feedInterval:interval,weightIntervalDays:30,buyPrice:edBuy.value,sex:edSex.value,status:edStatus.value,defaultFeeder:feeder,defaultFeederState:state,defaultFeederType:type,defaultFeederSize:size,futterStandard:feeder,standardFeed:feeder,note};
 a.feeds=a.feeds||[];a.sheds=a.sheds||[];a.weights=a.weights||[];a.photos=a.photos||[];
 if(h&&h.data&&String(h.data).startsWith('data:image')&&i===null){a.photos.unshift({date:NGT500.today(),type:'Herkunftsnachweis',note:h.name||'Herkunftsnachweis',data:h.data,cover:false})}
 if(i===null){NGTStore.addAnimal(t,a);try{sessionStorage.removeItem('terracontrol_hkn_import_v1')}catch(e){}}else NGTStore.updateAnimal(t,i,a);
 NGT500.route('animals',{t});
}
function remove(t,i){if(confirm('Tier wirklich löschen?')){NGTStore.deleteAnimal(t,i);NGT500.route('animals',{t})}}
window.NGTAnimals={openEditor,save,remove,refreshSizeSelect};NGT500.register('animals',{render});
})();