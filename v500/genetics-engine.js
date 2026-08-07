(function(){
'use strict';

function text(value){
 return String(value==null?'':value).trim();
}

function esc(value){
 const raw=text(value);
 return window.NGT500&&NGT500.esc
  ?NGT500.esc(raw)
  :raw.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

function normalized(value){
 return text(value).toLowerCase()
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g,'')
  .replace(/[^a-z0-9%]+/g,' ')
  .replace(/\s+/g,' ')
  .trim();
}

function catalog(){
 return window.GeneticsCatalog||{traits:[],byId:function(){return null;},forScope:function(){return [];}};
}

function animalScope(animal){
 const haystack=normalized([
  animal&&animal.animalGroup,
  animal&&animal.genus,
  animal&&animal.species
 ].filter(Boolean).join(' '));

 if(/leopardgecko|leopard gecko|eublepharis macularius/.test(haystack))return 'leopard-gecko';
 if(/konigspython|koenigspython|ball python|python regius/.test(haystack))return 'ball-python';
 return '';
}

function suggestedState(source,index){
 const prefix=source.slice(Math.max(0,index-30),index);
 const possible=prefix.match(/(?:poss(?:ible)?|moglich|moeglich|mgl)?\s*(50|66|100)?\s*%?\s*het\s*$/);
 if(possible&&/(poss|moglich|moeglich|mgl|50|66)/.test(possible[0])){
  return {state:'possible_het',probability:Number(possible[1]||66)};
 }
 if(/\bhet\s*$/.test(prefix))return {state:'het',probability:100};
 if(/\bsuper\s*$/.test(prefix))return {state:'super',probability:100};
 return {state:'visual',probability:100};
}

function groupedHetDirectives(source){
 const directives=[];
 const pattern=/\b(?:(50|66|100)\s*%?\s+)?(?:(pdh|pth|pqh)|(?:poss|possible|moglich|moeglich)\s+(double|triple|quad(?:ruple)?)\s+het|(?:double|triple|quad(?:ruple)?)\s+het|dhet|thet|qhet)\b/g;
 let match;
 while((match=pattern.exec(source))){
  const phrase=match[0];
  const possible=/\b(?:pdh|pth|pqh|poss|possible|moglich|moeglich)\b/.test(phrase);
  const count=/\b(?:pth|thet|triple)\b/.test(phrase)
   ?3
   :/\b(?:pqh|qhet|quad)\b/.test(phrase)
    ?4
    :2;
  directives.push({
   start:match.index,
   end:match.index+phrase.length,
   count:count,
   state:possible?'possible_het':'het',
   probability:possible?Number(match[1]||66):100,
   assumed:possible&&!match[1],
   phrase:phrase
  });
 }
 return directives;
}

function detect(animal){
 const source=normalized(animal&&animal.morph);
 const scope=animalScope(animal||{});
 const entries=[];
 const warnings=[];
 const occupied=[];
 const directives=groupedHetDirectives(source);

 if(!source)return {scope:scope,entries:entries,warnings:warnings,source:'morph'};

 const candidates=catalog().forScope(scope).slice().sort(function(a,b){
  function matchedLength(trait){
   return Math.max.apply(null,trait.aliases.map(function(alias){
    const needle=normalized(alias);
    return (' '+source+' ').indexOf(' '+needle+' ')>=0?needle.length:0;
   }));
  }
  return matchedLength(b)-matchedLength(a);
 });

 candidates.forEach(function(trait){
  const aliases=trait.aliases.slice().sort(function(a,b){return b.length-a.length;});
  let match=null;
  aliases.some(function(alias){
   const needle=normalized(alias);
   const index=(' '+source+' ').indexOf(' '+needle+' ');
   if(index<0)return false;
   const end=index+needle.length;
   if(occupied.some(function(range){return index<range.end&&end>range.start;}))return false;
   match={index:index,end:end};
   return true;
  });
  if(!match)return;

  occupied.push({start:match.index,end:match.end});
  const state=suggestedState(source,match.index);
  if(state.state==='possible_het'){
   warnings.push(trait.name+' ist nur als mögliches het angegeben; die Quote wird entsprechend gewichtet.');
  }
  entries.push({
   traitId:trait.id,
   name:trait.name,
   inheritance:trait.inheritance,
   state:state.state,
   probability:state.probability,
   line:'',
   confirmed:true,
   suggested:false
   ,_index:match.index
  });
 });

 entries.sort(function(a,b){return a._index-b._index;});
 directives.forEach(function(directive){
  const targets=entries.filter(function(entry){return entry._index>=directive.end;}).slice(0,directive.count);
  targets.forEach(function(entry){
   entry.state=directive.state;
   entry.probability=directive.probability;
  });
  occupied.push({start:directive.start,end:directive.end});
  if(targets.length<directive.count){
   warnings.push('Die Angabe „'+directive.phrase+'“ nennt '+directive.count+' het-Gene, danach wurden aber nur '+targets.length+' Gene erkannt.');
  }else if(directive.assumed){
   warnings.push('Für „'+directive.phrase+'“ fehlt die genaue Wahrscheinlichkeit; vorläufig werden 66 % je Gen verwendet.');
  }
 });
 entries.forEach(function(entry){
  delete entry._index;
  if(entry.state==='possible_het'&&!warnings.some(function(warning){return warning.indexOf(entry.name+' ist nur')===0;})){
   warnings.push(entry.name+' ist nur als mögliches het angegeben; die Quote wird entsprechend gewichtet.');
  }
 });

 if(!entries.length){
  warnings.push('Der Morphtext enthält keine Gene aus dem geprüften Katalog.');
 }else{
  const chars=source.split('');
  occupied.forEach(function(range){
   for(let i=range.start;i<range.end;i+=1)chars[i]=' ';
  });
  const unknown=chars.join('')
   .replace(/\b(?:het|possible|poss|moglich|moeglich|mgl|super|double|triple|quad|quadruple|pdh|pth|pqh|dhet|thet|qhet)\b/g,' ')
   .replace(/\b(?:50|66|100)\b/g,' ')
   .replace(/%/g,' ')
   .replace(/\s+/g,' ')
   .trim();
  if(unknown)warnings.push('Nicht automatisch erkannt: '+unknown+'. Diese Angabe wird nicht in die Quote einbezogen.');
 }
 return {scope:scope,entries:entries,warnings:warnings,source:'morph'};
}

function normalizeEntry(entry){
 const trait=catalog().byId(text(entry&&entry.traitId));
 if(!trait)return null;
 const state=['visual','het','super','possible_het'].includes(entry.state)?entry.state:'visual';
 return {
  traitId:trait.id,
  name:trait.name,
  inheritance:trait.inheritance,
  state:state,
  probability:state==='possible_het'?Math.max(0,Math.min(100,Number(entry.probability||66))):100,
  line:text(entry.line),
  confirmed:entry.confirmed===true||entry.verified===true,
  suggested:entry.suggested===true
 };
}

function geneticsForAnimal(animal){
 const morph=text(animal&&animal.morph);
 if(morph){
  const detected=detect(animal||{});
  return {
   scope:detected.scope,
   entries:detected.entries,
   editorEntries:detected.entries,
   provisional:false,
   warnings:detected.warnings
  };
 }

 const stored=Array.isArray(animal&&animal.genetics)
  ?animal.genetics.map(normalizeEntry).filter(Boolean)
  :[];

 if(stored.length){
  const unconfirmed=stored.filter(function(entry){return !entry.confirmed;});
  return {
   scope:animalScope(animal||{}),
   entries:stored.filter(function(entry){return entry.confirmed;}),
   editorEntries:stored,
   provisional:false,
   warnings:unconfirmed.length
    ?[unconfirmed.length+' nicht bestätigte Gen-Angabe(n) werden nicht berechnet.']
    :[]
  };
 }

 const detected=detect(animal||{});
 return {
  scope:detected.scope,
  entries:detected.entries,
  editorEntries:detected.entries,
  provisional:detected.entries.length>0,
  warnings:detected.warnings.concat(
   detected.entries.length?['Die Angaben wurden nur aus dem Morphtext erkannt und sind noch nicht bestätigt.']:[]
  )
 };
}

function traitOptions(selectedId,scope){
 const scopes=scope?[scope]:['ball-python','leopard-gecko'];
 const selectedTrait=catalog().byId(selectedId);
 if(selectedTrait&&!scopes.includes(selectedTrait.scope))scopes.push(selectedTrait.scope);
 const scopeNames={'ball-python':'Königspython','leopard-gecko':'Leopardgecko'};
 return '<option value="">Gen auswählen</option>'+scopes.map(function(scopeId){
  return `<optgroup label="${scopeNames[scopeId]}">${catalog().forScope(scopeId).map(function(trait){
   return `<option value="${esc(trait.id)}" ${trait.id===selectedId?'selected':''}>${esc(trait.name)}</option>`;
  }).join('')}</optgroup>`;
 }).join('');
}

function stateOptions(selected){
 const rows=[
  ['visual','Visual / sichtbar'],
  ['het','100 % het'],
  ['super','Super / homozygot'],
  ['possible_het','möglich het']
 ];
 return rows.map(function(row){
  return `<option value="${row[0]}" ${row[0]===selected?'selected':''}>${row[1]}</option>`;
 }).join('');
}

function rowHtml(entry,prefix,scope){
 entry=entry||{};
 const trait=catalog().byId(entry.traitId)||{};
 const rowClass=(entry.state==='possible_het'?' is-possible':'')+(trait.requiresLine?' needs-line':'');
 return `<div class="tc2GeneticsRow${rowClass}">
  <label class="tc2GeneticsTrait"><span>Gen</span><select class="tc2GeneticsTraitId" onchange="GeneticsEngine.updateEditorRow(this)">${traitOptions(entry.traitId||'',scope)}</select></label>
  <label><span>Genotyp</span><select class="tc2GeneticsState" onchange="GeneticsEngine.updateEditorRow(this)">${stateOptions(entry.state||'visual')}</select></label>
  <label class="tc2GeneticsProbability"><span>Wahrscheinlichkeit %</span><input class="tc2GeneticsProbabilityValue" type="number" min="1" max="100" value="${esc(entry.probability||66)}"></label>
  <label class="tc2GeneticsLine"><span>Linie (falls relevant)</span><input class="tc2GeneticsLineValue" placeholder="z. B. VPI" value="${esc(entry.line||'')}"></label>
  <label class="tc2GeneticsConfirmed"><input class="tc2GeneticsConfirmedValue" type="checkbox" ${entry.confirmed?'checked':''}><span>Genetik geprüft und bestätigt</span></label>
  <button type="button" class="tc2GeneticsRemove" onclick="GeneticsEngine.removeRow(this)" aria-label="Gen entfernen">×</button>
  ${trait.note?`<p class="tc2GeneticsRowNote">${esc(trait.note)}</p>`:''}
  ${trait.issue?`<p class="tc2GeneticsRowIssue">⚠ ${esc(trait.issue)}</p>`:''}
 </div>`;
}

function renderEditor(animal,options){
 options=options||{};
 const prefix=options.prefix||'edGenetics';
 const data=geneticsForAnimal(animal||{});
 const scope=data.scope;
 const entries=data.editorEntries||[];
 const inferred=data.provisional;

 return `<div class="tc2GeneticsEditor" id="${esc(prefix)}Editor" data-prefix="${esc(prefix)}" data-scope="${esc(scope)}">
  ${inferred?'<p class="tc2GeneticsSuggestion">Aus dem bisherigen Morphtext erkannt. Bitte jede Angabe prüfen und ausdrücklich bestätigen.</p>':''}
  ${!scope?'<p class="tc2GeneticsSuggestion">Die Tierart ist noch nicht eindeutig erkannt. Wähle Gene deshalb besonders sorgfältig aus.</p>':''}
  <div class="tc2GeneticsRows" id="${esc(prefix)}Rows">${entries.map(function(entry){return rowHtml(entry,prefix,scope);}).join('')}</div>
  <div class="tc2GeneticsEditorActions">
   <button type="button" onclick="GeneticsEngine.addRow('${esc(prefix)}')">＋ Gen hinzufügen</button>
   ${entries.length?`<button type="button" onclick="GeneticsEngine.confirmAll('${esc(prefix)}')">Alle Angaben bestätigen</button>`:''}
  </div>
  <p class="muted">Nur bestätigte Gene fließen verbindlich in den Morphrechner ein. Linien- und polygenetische Merkmale werden nicht mit erfundenen Prozentwerten berechnet.</p>
 </div>`;
}

function editorRoot(prefix){
 return document.getElementById(prefix+'Editor');
}

function addRow(prefix){
 const root=editorRoot(prefix);
 const rows=document.getElementById(prefix+'Rows');
 if(!root||!rows)return;
 rows.insertAdjacentHTML('beforeend',rowHtml({},prefix,root.dataset.scope||''));
 updateEditorRow(rows.lastElementChild&&rows.lastElementChild.querySelector('select'));
}

function removeRow(button){
 const row=button&&button.closest('.tc2GeneticsRow');
 if(row)row.remove();
}

function updateEditorRow(element){
 const row=element&&element.closest('.tc2GeneticsRow');
 if(!row)return;
 const trait=catalog().byId(text(row.querySelector('.tc2GeneticsTraitId').value));
 const state=text(row.querySelector('.tc2GeneticsState').value);
 row.classList.toggle('is-possible',state==='possible_het');
 row.classList.toggle('needs-line',!!(trait&&trait.requiresLine));
}

function confirmAll(prefix){
 const rows=document.getElementById(prefix+'Rows');
 if(!rows)return;
 rows.querySelectorAll('.tc2GeneticsConfirmedValue').forEach(function(input){input.checked=true;});
}

function readEditor(prefix){
 const rows=document.getElementById(prefix+'Rows');
 if(!rows)return [];
 return Array.from(rows.querySelectorAll('.tc2GeneticsRow')).map(function(row){
  const traitId=text(row.querySelector('.tc2GeneticsTraitId').value);
  if(!traitId)return null;
  const trait=catalog().byId(traitId);
  const state=text(row.querySelector('.tc2GeneticsState').value)||'visual';
  return {
   traitId:traitId,
   name:trait&&trait.name||'',
   inheritance:trait&&trait.inheritance||'',
   state:state,
   probability:state==='possible_het'
    ?Math.max(1,Math.min(100,Number(row.querySelector('.tc2GeneticsProbabilityValue').value||66)))
    :100,
   line:text(row.querySelector('.tc2GeneticsLineValue').value),
   confirmed:!!row.querySelector('.tc2GeneticsConfirmedValue').checked,
   catalogVersion:catalog().version||''
  };
 }).filter(Boolean);
}

function alleleChance(entry,trait,warnings){
 if(!entry)return 0;
 if(trait.inheritance==='polygenic'){
  warnings.push(trait.name+' ist ein Linienmerkmal und wird nicht mit einer Mendel-Quote berechnet.');
  return null;
 }
 if(entry.state==='possible_het')return (Number(entry.probability||66)/100)*.5;
 if(entry.state==='het')return .5;
 if(entry.state==='super')return 1;
 if(trait.inheritance==='recessive')return 1;
 if(trait.inheritance==='dominant'){
  warnings.push(trait.name+' wird mangels gesicherter Homozygotie als einfaktorig berechnet.');
 }
 return .5;
}

function locusOutcomes(trait,fatherEntry,motherEntry,warnings){
 const fp=alleleChance(fatherEntry,trait,warnings);
 const mp=alleleChance(motherEntry,trait,warnings);
 if(fp===null||mp===null)return null;
 const map={
  0:(1-fp)*(1-mp),
  1:fp*(1-mp)+(1-fp)*mp,
  2:fp*mp
 };
 return Object.keys(map).filter(function(key){return map[key]>.000001;}).map(function(key){
  const alleles=Number(key);
  let visual='';
  let carrier='';
  if(trait.inheritance==='recessive'){
   if(alleles===2)visual=trait.name;
   if(alleles===1)carrier='het '+trait.name;
  }else if(trait.inheritance==='incomplete'){
   if(alleles===2)visual='Super '+trait.name;
   if(alleles===1)visual=trait.name;
  }else if(alleles>0){
   visual=trait.name;
  }
  return {p:map[key],visual:visual,carrier:carrier};
 });
}

function complexGenotype(entries,traits,warnings,role){
 const alleles=[];
 const possible=[];
 traits.forEach(function(trait){
  const entry=entries.find(function(candidate){return candidate.traitId===trait.id;});
  if(!entry)return;
  if(entry.state==='possible_het'){
   possible.push({traitId:trait.id,probability:Math.max(0,Math.min(1,Number(entry.probability||66)/100))});
   return;
  }
  if(trait.inheritance==='recessive'&&(entry.state==='visual'||entry.state==='super')){
   alleles.push(trait.id,trait.id);
  }else if(entry.state==='super'){
   alleles.push(trait.id,trait.id);
  }else{
   alleles.push(trait.id);
  }
 });
 if(alleles.length>2||possible.length>1||alleles.length===2&&possible.length){
  warnings.push(role+': Im '+catalog().complexLabel(traits[0]&&traits[0].complex)+' sind mehr als zwei Allele eingetragen.');
  return null;
 }
 return {alleles:alleles,possible:possible[0]||null};
}

function complexGametes(genotype){
 const map={};
 const alleles=genotype.alleles.slice();
 const possible=genotype.possible;
 if(possible){
  if(alleles.length===0){
   map[possible.traitId]=possible.probability*.5;
   map.wild=1-map[possible.traitId];
  }else{
   map[alleles[0]]=.5;
   map[possible.traitId]=possible.probability*.5;
   map.wild=(1-possible.probability)*.5;
  }
 }else{
  while(alleles.length<2)alleles.push('wild');
  alleles.forEach(function(allele){map[allele]=(map[allele]||0)+.5;});
 }
 return Object.keys(map).map(function(allele){return {allele:allele,p:map[allele]};});
}

function complexOutcomes(complexId,traits,fatherEntries,motherEntries,warnings){
 const father=complexGenotype(fatherEntries,traits,warnings,'Vatertier');
 const mother=complexGenotype(motherEntries,traits,warnings,'Muttertier');
 if(!father||!mother)return null;
 const map={};

 complexGametes(father).forEach(function(f){
  complexGametes(mother).forEach(function(m){
   const pair=[f.allele,m.allele].sort();
   const key=pair.join('|');
   map[key]=(map[key]||0)+(f.p*m.p);
  });
 });

 return Object.keys(map).map(function(key){
  const pair=key.split('|');
  const active=pair.filter(function(id){return id!=='wild';});
  let visual='';
  let carrier='';
  if(active.length===1){
   const trait=catalog().byId(active[0])||{};
   if(trait.inheritance==='recessive')carrier='het '+(trait.name||active[0]);
   else visual=trait.name||active[0];
  }else if(active.length===2&&active[0]===active[1]){
   const trait=catalog().byId(active[0])||{};
   visual=trait.inheritance==='recessive'
    ?(trait.name||active[0])
    :'Super '+(trait.name||active[0]);
  }else if(active.length===2){
   const compound=catalog().compoundName&&catalog().compoundName(active[0],active[1]);
   const combined=active.map(function(id){return (catalog().byId(id)||{}).name||id;})
    .sort(function(a,b){return a.localeCompare(b,'de');})
    .join(' + ');
   visual=compound
    ?compound+' ('+combined+')'
    :combined+' ('+catalog().complexLabel(complexId)+')';
  }
  return {p:map[key],visual:visual,carrier:carrier};
 });
}

function predictionLabel(row){
 const parts=row.visuals.slice().sort(function(a,b){return a.localeCompare(b,'de');})
  .concat(row.carriers.slice().sort(function(a,b){return a.localeCompare(b,'de');}));
 return parts.length?parts.join(' · '):'ohne berechnete Merkmale';
}

function predict(father,mother){
 const fd=geneticsForAnimal(father||{});
 const md=geneticsForAnimal(mother||{});
 const warnings=fd.warnings.concat(md.warnings);
 const provisional=fd.provisional||md.provisional;
 const byId={};
 const duplicateIds=new Set();

 [
  {label:'Vatertier',entries:fd.entries},
  {label:'Muttertier',entries:md.entries}
 ].forEach(function(parent){
  const seen=new Set();
  parent.entries.forEach(function(entry){
   if(seen.has(entry.traitId)){
    warnings.push(parent.label+': '+entry.name+' ist mehrfach eingetragen und muss korrigiert werden.');
    duplicateIds.add(entry.traitId);
   }
   seen.add(entry.traitId);
  });
 });

 fd.entries.concat(md.entries).forEach(function(entry){byId[entry.traitId]=catalog().byId(entry.traitId);});
 let traits=Object.keys(byId).map(function(id){return byId[id];}).filter(Boolean);

 traits.forEach(function(trait){
  if(trait.issue)warnings.push(trait.name+': '+trait.issue);
  if(trait.sexLinked)warnings.push(trait.name+': Die Morphquote wird berechnet, nicht jedoch die Male-/Female-Maker-Geschlechterverteilung.');
 });
 traits=traits.filter(function(trait){
  if(duplicateIds.has(trait.id))return false;
  if(trait.inheritance==='polygenic'){
   warnings.push(trait.name+' ist ein Linienmerkmal und wird nicht mit einer Mendel-Quote berechnet.');
   return false;
  }
  const inFather=fd.entries.some(function(entry){return entry.traitId===trait.id;});
  const inMother=md.entries.some(function(entry){return entry.traitId===trait.id;});
  if((inFather&&fd.scope&&fd.scope!==trait.scope)||(inMother&&md.scope&&md.scope!==trait.scope)){
   warnings.push(trait.name+' passt nicht zur erkannten Tierart und wird nicht berechnet.');
   return false;
  }
  return true;
 });

 traits=traits.filter(function(trait){
  if(!trait.requiresLine)return true;
  const f=fd.entries.find(function(entry){return entry.traitId===trait.id;});
  const m=md.entries.find(function(entry){return entry.traitId===trait.id;});
  if(f&&m&&f.line&&m.line&&normalized(f.line)!==normalized(m.line)){
   warnings.push(trait.name+': unterschiedliche Linien werden nicht miteinander als dasselbe Gen berechnet.');
   return false;
  }
  if(f&&m&&(!f.line||!m.line))warnings.push(trait.name+': Für eine sichere Berechnung muss bei beiden Eltern die Linie angegeben werden.');
  if(f&&m&&(!f.line||!m.line))return false;
  return true;
 });

 if(!traits.length){
  return {
   available:false,
   outcomes:[],
   warnings:Array.from(new Set(warnings)),
   provisional:provisional,
   message:'Keine bestätigten oder sicher berechenbaren Gene vorhanden.'
  };
 }

 const complexMembers={};
 traits.forEach(function(trait){
  if(trait.complex)complexMembers[trait.complex]=(complexMembers[trait.complex]||[]).concat(trait.id);
 });

 let combined=[{p:1,visuals:[],carriers:[]}];
 let calculatedLoci=0;

 function combineWith(outcomes){
  if(!outcomes||!outcomes.length)return;
  calculatedLoci+=1;
  const next=[];
  combined.forEach(function(base){
   outcomes.forEach(function(outcome){
    next.push({
     p:base.p*outcome.p,
     visuals:base.visuals.concat(outcome.visual?[outcome.visual]:[]),
     carriers:base.carriers.concat(outcome.carrier?[outcome.carrier]:[])
    });
   });
  });
  combined=next;
 }

 traits.filter(function(trait){return !trait.complex;}).forEach(function(trait){
  const f=fd.entries.find(function(entry){return entry.traitId===trait.id;});
  const m=md.entries.find(function(entry){return entry.traitId===trait.id;});
  const outcomes=locusOutcomes(trait,f,m,warnings);
  combineWith(outcomes);
 });

 Object.keys(complexMembers).forEach(function(complexId){
  const members=Array.from(new Set(complexMembers[complexId])).map(function(id){return catalog().byId(id);}).filter(Boolean);
  combineWith(complexOutcomes(complexId,members,fd.entries,md.entries,warnings));
 });

 if(!calculatedLoci){
  return {
   available:false,
   outcomes:[],
   warnings:Array.from(new Set(warnings)),
   provisional:provisional,
   message:'Keine sicher berechenbaren Genorte vorhanden.'
  };
 }

 const merged={};
 combined.forEach(function(row){
  const label=predictionLabel(row);
  merged[label]=(merged[label]||0)+row.p;
 });
 const outcomes=Object.keys(merged).map(function(label){
  return {label:label,probability:Math.round(merged[label]*10000)/100};
 }).sort(function(a,b){return b.probability-a.probability||a.label.localeCompare(b.label,'de');});

 return {
  available:outcomes.length>0,
  outcomes:outcomes,
  warnings:Array.from(new Set(warnings)),
  provisional:provisional,
  traits:traits.map(function(trait){return trait.name;}),
  catalogVersion:catalog().version||''
 };
}

window.GeneticsEngine={
 animalScope:animalScope,
 detect:detect,
 geneticsForAnimal:geneticsForAnimal,
 renderEditor:renderEditor,
 readEditor:readEditor,
 addRow:addRow,
 removeRow:removeRow,
 updateEditorRow:updateEditorRow,
 confirmAll:confirmAll,
 predict:predict
};

})();
