(function(){
'use strict';
function statusOptions(cur){return ['Bestand','Nachzucht','Verkauft','Abgegeben','Verstorben','Archiv'].map(s=>`<option ${cur===s?'selected':''}>${s}</option>`).join('')}
function render(args){const t=args.t||'koenig',edit=args.edit;const rows=(NGTStore.data()[t]||[]);const list=rows.map((a,i)=>NGTUI.animalCard({t,i,a})).join('')||'<div class="subcard"><h3>Noch keine Tiere</h3><p class="muted">Lege dein erstes Tier an. Danach kannst du Fütterungen, Häutungen, Gewichte, Fotos und den digitalen Tierpass pflegen.</p></div>';return `<div class="card"><h2>${NGTStore.LABELS[t]}</h2><button onclick="NGTAnimals.openEditor('${t}')">Tier anlegen</button>${edit!==undefined?editor(t,Number(edit)):''}<div>${list}</div></div>`}
function editor(t,i){
 const a=i!==undefined?NGTStore.animal(t,i):{};
 const opt=NGTStore.PREY.map(p=>`<option ${p===(a.defaultFeeder||'')?'selected':''}>${p}</option>`).join('');
 const feedInterval=a.feedIntervalDays||a.feedingInterval||a.feedInterval||14;
 return `<div class="subcard"><h3>${i!==undefined?'Tier bearbeiten':'Tier anlegen'}</h3>
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
 <select id="edFeeder"><option value="">Kein Standard</option>${opt}</select>
 <p class="muted">Gewichtsintervall: 30 Tage festgelegt.</p>
 <textarea id="edNote" placeholder="Notizen">${NGT500.esc(a.note||'')}</textarea>
 <button onclick="NGTAnimals.save('${t}',${i===undefined?'null':i})">Speichern</button></div>`
}
function openEditor(t){document.querySelector('.card').insertAdjacentHTML('afterbegin',editor(t));}
function save(t,i){
 const old=i===null?{}:NGTStore.animal(t,i);
 const interval=Math.max(1,Number(edFeedInterval.value||14));
 const a={...old,name:edName.value.trim()||'Unbenannt',morph:edMorph.value.trim(),weight:edWeight.value,origin:edOrigin.value.trim(),originType:edOrigin.value.trim(),birth:edBirth.value,father:edFather.value.trim(),vater:edFather.value.trim(),sire:edFather.value.trim(),mother:edMother.value.trim(),mutter:edMother.value.trim(),dam:edMother.value.trim(),feedIntervalDays:interval,feedingInterval:interval,feedInterval:interval,weightIntervalDays:30,buyPrice:edBuy.value,sex:edSex.value,status:edStatus.value,defaultFeeder:edFeeder.value,futterStandard:edFeeder.value,standardFeed:edFeeder.value,note:edNote.value.trim()};
 a.feeds=a.feeds||[];a.sheds=a.sheds||[];a.weights=a.weights||[];a.photos=a.photos||[];
 if(i===null)NGTStore.addAnimal(t,a);else NGTStore.updateAnimal(t,i,a);
 NGT500.route('animals',{t});
}
function remove(t,i){if(confirm('Tier wirklich löschen?')){NGTStore.deleteAnimal(t,i);NGT500.route('animals',{t})}}
window.NGTAnimals={openEditor,save,remove};NGT500.register('animals',{render});
})();