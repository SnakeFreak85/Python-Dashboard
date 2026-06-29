(function(){
  'use strict';
  function h(value){return window.NGT?window.NGT.escapeHtml(value):String(value||'');}
  function today(){return new Date().toISOString().slice(0,10);}
  function close(){const modal=document.getElementById('ngtAnimalModal'); if(modal) modal.remove();}
  function healthTable(animal){
    if(!animal.health||!animal.health.length) return '<p class="ngt-muted">Keine Einträge vorhanden.</p>';
    return '<table class="ngt-table"><tr><th>Datum</th><th>Kontakt</th><th>Eintrag</th><th>Notiz</th></tr>'+animal.health.map(e=>
      '<tr><td>'+h(e.date)+'</td><td>'+h(e.vet)+'</td><td>'+h(e.diagnosis)+'</td><td>'+h(e.medication)+'</td></tr>'
    ).join('')+'</table>';
  }
  function openAnimalProfile(type,index){
    const db=window.NGT.getDb();
    const animal=window.NGT.normalizeAnimal(db[type][index],type,index);
    close();
    const modal=document.createElement('div');
    modal.id='ngtAnimalModal';
    modal.className='ngt-modal';
    modal.innerHTML='<div class="ngt-modal-box">'+
      '<h2>Tierprofil 1.0</h2><p class="ngt-muted">UUID: '+h(animal.uuid)+'</p>'+
      '<div class="ngt-form-grid">'+
      field('name','Name',animal.name)+field('nickname','Rufname',animal.nickname)+field('species','Art',animal.species)+field('subspecies','Unterart',animal.subspecies)+
      field('morph','Morph',animal.morph)+selectSex(animal.sex)+field('birthDate','Geburtsdatum',animal.birthDate,'date')+field('hatchDate','Schlupfdatum',animal.hatchDate,'date')+
      field('origin','Herkunft',animal.origin)+field('breeder','Züchter',animal.breeder)+field('purchaseDate','Kaufdatum',animal.purchaseDate,'date')+
      field('purchasePrice','Kaufpreis',animal.purchasePrice,'number')+field('salePrice','Verkaufspreis',animal.salePrice,'number')+field('status','Status',animal.status)+
      field('cites','CITES',animal.cites)+field('chipNumber','Chipnummer',animal.chipNumber)+field('ringNumber','Ringnummer',animal.ringNumber)+field('terrarium','Terrarium',animal.terrarium)+
      field('tags','Tags',(animal.tags||[]).join(', '))+'</div>'+
      '<label>Notizen<textarea id="ngt_notes">'+h(animal.notes)+'</textarea></label>'+
      '<h3>Gesundheit und Pflege</h3><div id="ngt_health_list">'+healthTable(animal)+'</div>'+
      '<div class="ngt-form-grid"><input id="ngt_health_date" type="date" value="'+today()+'"><input id="ngt_health_vet" placeholder="Kontakt"><input id="ngt_health_diagnosis" placeholder="Eintrag"><input id="ngt_health_medication" placeholder="Notiz"></div>'+
      '<button id="ngt_add_health">Eintrag hinzufügen</button>'+documentBlock(animal)+
      '<h3>QR-Code</h3><div class="feedPanel">'+h(animal.displayId)+' | '+h(animal.name||animal.nickname||animal.species)+'</div>'+
      '<div class="ngt-actions"><button id="ngt_save_profile">Speichern</button><button id="ngt_close_profile">Schließen</button></div></div>';
    document.body.appendChild(modal);
    document.getElementById('ngt_sex').value=animal.sex||'Unbestimmt';
    document.getElementById('ngt_close_profile').onclick=close;
    document.getElementById('ngt_add_health').onclick=function(){
      animal.health.push({date:val('health_date')||today(),vet:val('health_vet'),diagnosis:val('health_diagnosis'),medication:val('health_medication')});
      document.getElementById('ngt_health_list').innerHTML=healthTable(animal);
    };
    document.getElementById('ngt_save_profile').onclick=function(){
      ['name','nickname','species','subspecies','morph','sex','birthDate','hatchDate','origin','breeder','purchaseDate','purchasePrice','salePrice','status','cites','chipNumber','ringNumber','terrarium','notes'].forEach(k=>{animal[k]=val(k);});
      animal.tags=window.NGT.asList(val('tags'));
      animal.buyPrice=animal.purchasePrice;
      animal.price=animal.salePrice;
      animal.birth=animal.hatchDate||animal.birthDate;
      animal.note=animal.notes;
      animal.history=animal.history||[];
      animal.history.push({date:new Date().toISOString(),event:'Profil aktualisiert'});
      if(typeof window.save==='function') window.save();
      close();
    };
  }
  function field(key,label,value,type){return '<label>'+label+'<input id="ngt_'+key+'" type="'+(type||'text')+'" value="'+h(value)+'"></label>';}
  function selectSex(value){return '<label>Geschlecht<select id="ngt_sex"><option>Unbestimmt</option><option>Weiblich</option><option>Männlich</option></select></label>';}
  function val(key){const el=document.getElementById('ngt_'+key); return el?el.value:'';}
  function documentBlock(animal){
    const docs=animal.documents||[];
    return '<h3>Dokumente</h3><div class="feedPanel">'+(docs.length?docs.map(x=>h(x.name||x)).join('<br>'):'Noch keine Dokumente hinterlegt')+'</div>';
  }
  function enhanceAnimalCards(){
    if(!window.NGT) return;
    window.NGT.TYPES.forEach(type=>{
      const section=document.getElementById(type);
      if(!section) return;
      section.querySelectorAll('.animal').forEach((card,index)=>{
        if(card.querySelector('[data-ngt-profile]')) return;
        const btn=document.createElement('button');
        btn.textContent='🗂 Profil 1.0';
        btn.setAttribute('data-ngt-profile','true');
        btn.onclick=()=>openAnimalProfile(type,index);
        card.insertBefore(btn,card.firstChild);
      });
    });
  }
  function init(){
    window.NGT=window.NGT||{};
    window.NGT.openAnimalProfile=openAnimalProfile;
    window.NGT.enhanceAnimalCards=enhanceAnimalCards;
    enhanceAnimalCards();
  }
  document.readyState==='loading'?document.addEventListener('DOMContentLoaded',init):init();
})();
