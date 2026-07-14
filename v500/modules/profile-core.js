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
 const action=(
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

 if(label!=='Gesundheit'){
  return action;
 }

 const context=P.state.ctx||{};
 const removeAction=
  "NGTAnimals.remove('"+
  P.jsArg(context.t)+
  "',"+
  Number(context.i||0)+
  ")";

 return (
  action+
  '<button '+
   'class="tc2ProfileAction danger" '+
   'onclick="'+removeAction+'"'+
  '>'+ 
   '<div class="tc2ProfileActionIcon">🗑️</div>'+ 
   '<div class="tc2ProfileActionText">Tier löschen</div>'+ 
   '<div class="tc2ProfileActionArrow">›</div>'+ 
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

P.setTab=function(tab){
 P.state.tab=tab;
 NGT500.rerender();
};

P.getContext=function(){
 return P.state.ctx;
};

})();