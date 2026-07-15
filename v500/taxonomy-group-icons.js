(function(){
'use strict';

const P=window.NGTAnimalsInternal;
const T=window.NGTTaxonomyUIInternal;
const illustrations=T&&T.illustrations;

if(!P||!P.editor||!illustrations){
 throw new Error('taxonomy-group-icons.js benoetigt Animals-Editor und Taxonomie-Icons.');
}

let pendingImage=null;
let pendingRemove=false;

function esc(value){
 return String(value||'')
  .replace(/&/g,'&amp;')
  .replace(/</g,'&lt;')
  .replace(/>/g,'&gt;')
  .replace(/"/g,'&quot;')
  .replace(/'/g,'&#39;');
}

function activeRows(){
 try{
  return typeof P.allActive==='function'?P.allActive():[];
 }catch(error){
  return [];
 }
}

function rowAnimal(row){
 return row&&row.a?row.a:row||{};
}

function matchingAnimals(label){
 const key=String(label||'').trim().toLowerCase();
 if(!key){return [];}

 return activeRows()
  .map(rowAnimal)
  .filter(function(animal){
   return [animal.animalGroup,animal.genus]
    .some(function(value){
     return String(value||'').trim().toLowerCase()===key;
    });
  });
}

function storedImage(label){
 const match=matchingAnimals(label).find(function(animal){
  return String(animal.groupIcon||'').startsWith('data:image/');
 });
 return match?match.groupIcon:'';
}

function contextText(label){
 const animals=matchingAnimals(label);
 const parts=[label];

 animals.slice(0,12).forEach(function(animal){
  parts.push(
   animal.animalGroup||'',
   animal.genus||'',
   animal.species||'',
   animal.scientificName||'',
   animal.commonName||''
  );
 });

 return parts.filter(Boolean).join(' ');
}

const previousIllustration=illustrations.illustrationFor;
illustrations.illustrationFor=function(label){
 const custom=storedImage(label);

 if(custom){
  return '<img class="tc2TaxReferenceIcon" src="'+esc(custom)+'" alt="'+esc(label)+'">';
 }

 return previousIllustration(contextText(label));
};

function previewHtml(data){
 if(!data){
  return '<span class="muted">Noch kein eigenes Gruppenbild gewählt.</span>';
 }

 return '<img src="'+esc(data)+'" alt="Gruppenbild Vorschau" style="width:88px;height:88px;object-fit:cover;border-radius:20px">';
}

function imageBlock(animal){
 const current=animal&&animal.groupIcon||'';
 pendingImage=null;
 pendingRemove=false;

 return `
  <div class="tc2AnimalEditorBlock" id="tc2GroupIconBlock">
   <h4>Gruppenbild</h4>
   <p class="muted">
    TerraControl erkennt bekannte Tierarten automatisch. Für neue oder ungewöhnliche Gruppen kannst du hier einmalig ein eigenes Bild wählen. Es wird anschließend automatisch für die gesamte Tiergruppe verwendet.
   </p>
   <div id="tc2GroupIconPreview">${previewHtml(current)}</div>
   <div class="tc2AnimalEditorActions" style="margin-top:12px">
    <label class="button" style="display:inline-flex;align-items:center;justify-content:center;cursor:pointer">
     Bild auswählen
     <input type="file" accept="image/*" hidden onchange="NGTGroupIcons.pick(event)">
    </label>
    <button type="button" onclick="NGTGroupIcons.clear()">Kein Bild</button>
   </div>
  </div>
 `;
}

const originalRender=P.editor.render;
P.editor.render=function(t,i,fromHkn){
 const html=originalRender(t,i,fromHkn);
 const animal=i!==undefined?NGTStore.animal(t,i)||{}:{};
 const marker='<div class="tc2AnimalEditorBlock"><h4>Stammdaten</h4>';
 return html.replace(marker,imageBlock(animal)+marker);
};

function resizeImage(file){
 return new Promise(function(resolve,reject){
  const reader=new FileReader();
  reader.onerror=function(){reject(new Error('Bild konnte nicht gelesen werden.'));};
  reader.onload=function(){
   const image=new Image();
   image.onerror=function(){reject(new Error('Bildformat wird nicht unterstützt.'));};
   image.onload=function(){
    const size=256;
    const canvas=document.createElement('canvas');
    canvas.width=size;
    canvas.height=size;
    const ctx=canvas.getContext('2d');
    const scale=Math.max(size/image.width,size/image.height);
    const width=image.width*scale;
    const height=image.height*scale;
    ctx.drawImage(image,(size-width)/2,(size-height)/2,width,height);
    resolve(canvas.toDataURL('image/jpeg',0.84));
   };
   image.src=reader.result;
  };
  reader.readAsDataURL(file);
 });
}

async function pick(event){
 const file=event&&event.target&&event.target.files&&event.target.files[0];
 if(!file){return;}

 try{
  pendingImage=await resizeImage(file);
  pendingRemove=false;
  const preview=document.getElementById('tc2GroupIconPreview');
  if(preview){preview.innerHTML=previewHtml(pendingImage);}
 }catch(error){
  if(window.NGT500&&NGT500.toast){NGT500.toast(error.message,'danger');}
 }
}

function clear(){
 pendingImage=null;
 pendingRemove=true;
 const preview=document.getElementById('tc2GroupIconPreview');
 if(preview){preview.innerHTML=previewHtml('');}
}

function inheritedImage(group){
 const key=String(group||'').trim().toLowerCase();
 const match=activeRows().map(rowAnimal).find(function(animal){
  return String(animal.animalGroup||'').trim().toLowerCase()===key&&
   String(animal.groupIcon||'').startsWith('data:image/');
 });
 return match?match.groupIcon:'';
}

const originalSave=P.editor.save;
P.editor.save=function(t,i){
 const add=NGTStore.addAnimal;
 const update=NGTStore.updateAnimal;

 function applyIcon(animal){
  const result={...animal};
  if(pendingRemove){
   result.groupIcon='';
  }else if(pendingImage){
   result.groupIcon=pendingImage;
  }else if(!result.groupIcon){
   result.groupIcon=inheritedImage(result.animalGroup);
  }
  return result;
 }

 NGTStore.addAnimal=function(type,animal){
  return add.call(NGTStore,type,applyIcon(animal));
 };
 NGTStore.updateAnimal=function(type,index,animal){
  return update.call(NGTStore,type,index,applyIcon(animal));
 };

 try{
  return originalSave(t,i);
 }finally{
  NGTStore.addAnimal=add;
  NGTStore.updateAnimal=update;
  pendingImage=null;
  pendingRemove=false;
 }
};

window.NGTGroupIcons={pick:pick,clear:clear};

})();