(function(){
'use strict';

const P=window.NGTProfileInternal=
 window.NGTProfileInternal||{};

P.state={
 tab:'overview',
 ctx:{
  t:'',
  i:0
 },
 viewerIndex:-1,
 viewerKeyHandler:null,
 viewerPreviousFocus:null
};

P.esc=function(value){
 return NGT500.esc(value||'');
};

P.current=function(){
 return NGTStore.animal(
  P.state.ctx.t,
  P.state.ctx.i
 );
};

P.ensure=function(animal){
 return AnimalEngine.ensureHistories(
  animal
 );
};

P.latest=function(list){
 return AnimalEngine.latest(list);
};

P.daysSince=function(date){
 return AnimalEngine.daysSinceOr(
  date,
  9999
 );
};

P.age=function(birth){
 return AnimalEngine.getAgeYearsText({
  birth:birth
 });
};

P.s=function(value,length){
 return String(
  value==null
   ?''
   :value
 )
  .replace(/[\n\r|]/g,' ')
  .slice(0,length||80);
};

P.opt=function(list,currentValue){
 return (list||[])
  .map(function(value){
   const selected=
    String(currentValue||'')===
    String(value);

   return (
    '<option '+
    'value="'+P.esc(value)+'" '+
    (selected?'selected':'')+
    '>'+
    P.esc(value)+
    '</option>'
   );
  })
  .join('');
};

P.jsArg=function(value){
 return String(value||'')
  .replace(/\\/g,'\\\\')
  .replace(/'/g,"\\'");
};

P.text=function(value){
 return String(
  value==null
   ?''
   :value
 )
  .trim();
};

P.sexCode=function(value){
 value=String(value||'')
  .toLowerCase();

 if(value.includes('weib')){
  return '0.1';
 }

 if(
  value.includes('männ')||
  value.includes('maenn')
 ){
  return '1.0';
 }

 return '0.0';
};

P.scientificName=function(animal){
 return (
  AnimalEngine.getScientificName(
   animal
  )||
  '-'
 );
};

P.action=function(
 icon,
 label,
 onclick
){
 return (
  '<button '+
   'class="tc2ProfileAction" '+
   'onclick="'+onclick+'"'+
  '>'+
   '<div class="tc2ProfileActionIcon">'+
    icon+
   '</div>'+
   '<div class="tc2ProfileActionText">'+
    P.esc(label)+
   '</div>'+
   '<div class="tc2ProfileActionArrow">'+
    '›'+
   '</div>'+
  '</button>'
 );
};

P.row=function(
 date,
 label,
 deleteAction
){
 return (
  '<div class="tc2ListRowFull">'+
   '<div>'+
    '<b>'+
     P.esc(date||'-')+
    '</b>'+
    '<small>'+
     P.esc(label||'')+
    '</small>'+
   '</div>'+
   '<button '+
    'class="danger" '+
    'onclick="'+deleteAction+'"'+
   '>'+
    'Löschen'+
   '</button>'+
  '</div>'
 );
};

P.setContext=function(args){
 P.state.ctx=args||P.state.ctx;

 P.state.tab=
  args&&args.tab
   ?args.tab
   :'overview';
};

P.getTab=function(){
 return P.state.tab;
};

P.getContext=function(){
 return P.state.ctx;
};

P.setTab=function(tab){
 if(
  window.NGTProfile&&
  typeof NGTProfile.closePhotoViewer===
   'function'
 ){
  NGTProfile.closePhotoViewer();
 }

 P.state.tab=tab;

 NGT500.route('profile',{
  t:P.state.ctx.t,
  i:P.state.ctx.i,
  tab:tab
 });
};

P.deleteEntry=async function(
 kind,
 index
){
 if(!await NGT500.confirmAction(
  'Eintrag löschen?',
  {
   title:'Profileintrag löschen',
   confirmText:'Eintrag löschen',
   danger:true
  }
 )){
  return;
 }

 const animal=P.current();

 if(
  !animal||
  !Array.isArray(animal[kind])
 ){
  return;
 }

 animal[kind].splice(
  index,
  1
 );

 if(kind==='weights'){
  const last=
   (animal.weights||[])
    .slice(-1)[0];

  animal.weight=
   last
    ?last.weight
    :'';
 }

 NGTStore.save();

 P.setTab(
  P.state.tab
 );
};

P.addShed=function(){
 const animal=P.current();

 if(!animal){
  NGT500.toast(
   'Das Tier wurde nicht gefunden.',
   'danger'
  );
  return;
 }

 animal.sheds=
  Array.isArray(animal.sheds)
   ?animal.sheds
   :[];

 const dateInput=
  document.getElementById(
   'shedDate'
  );

 animal.sheds.push({
  date:
   (
    dateInput&&
    dateInput.value
   )||
   NGT500.today(),

  complete:true
 });

 NGTStore.save();
 P.setTab('sheds');
};

P.addWeight=function(){
 const animal=P.current();

 if(!animal){
  NGT500.toast(
   'Das Tier wurde nicht gefunden.',
   'danger'
  );
  return;
 }

 const valueInput=
  document.getElementById(
   'weightValue'
  );

 const weight=Number(
  valueInput
   ?valueInput.value
   :0
 );

 if(!weight){
  NGT500.toast('Gewicht fehlt.','warn');
  return;
 }

 animal.weights=
  Array.isArray(animal.weights)
   ?animal.weights
   :[];

 const dateInput=
  document.getElementById(
   'weightDate'
  );

 animal.weights.push({
  date:
   (
    dateInput&&
    dateInput.value
   )||
   NGT500.today(),

  weight:weight
 });

 animal.weight=weight;

 NGTStore.save();
 P.setTab('weights');
};

P.shedForm=function(){
 return (
  '<div class="tc2SubCard">'+
   '<h3>Häutung eintragen</h3>'+
   '<input '+
    'id="shedDate" '+
    'type="date" '+
    'value="'+NGT500.today()+'"'+
   '>'+
   '<button '+
    'onclick="NGTProfile.addShed()"'+
   '>'+
    'Häutung speichern'+
   '</button>'+
  '</div>'
 );
};

P.weightForm=function(){
 return (
  '<div class="tc2SubCard">'+
   '<h3>Gewicht eintragen</h3>'+
   '<input '+
    'id="weightDate" '+
    'type="date" '+
    'value="'+NGT500.today()+'"'+
   '>'+
   '<input '+
    'id="weightValue" '+
    'type="number" '+
    'placeholder="Gewicht in g"'+
   '>'+
   '<button '+
    'onclick="NGTProfile.addWeight()"'+
   '>'+
    'Gewicht speichern'+
   '</button>'+
  '</div>'
 );
};

P.shedList=function(animal){
 return (
  '<div class="tc2SubCard">'+
   '<h3>Häutungen</h3>'+
   (
    (animal.sheds||[])
     .map(function(entry,index){
      return {
       entry:entry,
       index:index
      };
     })
     .reverse()
     .map(function(item){
      return P.row(
       item.entry.date,
       'Häutung',
       (
        "NGTProfile.deleteEntry("+
        "'sheds',"+
        item.index+
        ")"
       )
      );
     })
     .join('')||
    '<p class="muted">'+
     'Keine Häutungen.'+
    '</p>'
   )+
  '</div>'
 );
};

P.weightList=function(animal){
 return (
  '<div class="tc2SubCard">'+
   '<h3>Gewichte</h3>'+
   (
    (animal.weights||[])
     .map(function(entry,index){
      return {
       entry:entry,
       index:index
      };
     })
     .reverse()
     .map(function(item){
      return P.row(
       item.entry.date,
       item.entry.weight+'g',
       (
        "NGTProfile.deleteEntry("+
        "'weights',"+
        item.index+
        ")"
       )
      );
     })
     .join('')||
    '<p class="muted">'+
     'Keine Gewichte.'+
    '</p>'
   )+
  '</div>'
 );
};

P.barChart=function(rows){
 if(!rows.length){
  return (
   '<p class="muted">'+
    'Keine Daten.'+
   '</p>'
  );
 }

 const max=Math.max(
  ...rows.map(function(row){
   return Number(
    row.value||
    0
   );
  }),
  1
 );

 return rows
  .map(function(row){
   const width=Math.max(
    4,
    Math.round(
     (
      Number(row.value||0)/
      max
     )*
     100
    )
   );

   return (
    '<div class="tc2Bar">'+
     '<small>'+
      P.esc(row.label||'-')+
     '</small>'+
     '<span>'+
      '<i style="width:'+
       width+
       '%">'+
      '</i>'+
     '</span>'+
     '<b>'+
      P.esc(row.value)+
     '</b>'+
    '</div>'
   );
  })
  .join('');
};

P.charts=function(animal){
 return (
  '<div class="tc2SubCard">'+
   '<h3>Gewicht</h3>'+
   P.barChart(
    (animal.weights||[])
     .map(function(weight){
      return {
       label:weight.date,
       value:Number(
        weight.weight||
        0
       )
      };
     })
   )+
  '</div>'+
  '<div class="tc2SubCard">'+
   '<h3>Fütterungen</h3>'+
   P.barChart(
    (animal.feeds||[])
     .map(function(feed){
      return {
       label:feed.date,
       value:
        feed.accepted===false
         ?0
         :1
      };
     })
   )+
  '</div>'
 );
};

})();
