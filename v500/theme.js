(function(){
'use strict';

const KEY='terracontrol_theme_v1';
const DARK='dark';
const LIGHT='light';

function normalize(value){
 return value===LIGHT
  ?LIGHT
  :DARK;
}

function current(){
 try{
  return normalize(
   localStorage.getItem(KEY)
  );
 }catch(error){
  return DARK;
 }
}

function themeColor(value){
 return normalize(value)===LIGHT
  ?'#f1f6f8'
  :'#0d1722';
}

function apply(value,options){
 const theme=normalize(value);
 const root=document.documentElement;
 const meta=document.querySelector(
  'meta[name="theme-color"]'
 );

 root.dataset.tcTheme=theme;
 root.style.colorScheme=theme;

 if(meta){
  meta.setAttribute(
   'content',
   themeColor(theme)
  );
 }

 if(!options||options.persist!==false){
  try{
   localStorage.setItem(KEY,theme);
  }catch(error){}
 }

 window.dispatchEvent(
  new CustomEvent(
   'terracontrol:theme',
   {detail:{theme:theme}}
  )
 );

 return theme;
}

function set(value){
 return apply(value);
}

window.NGTTheme={
 KEY:KEY,
 DARK:DARK,
 LIGHT:LIGHT,
 current:current,
 apply:apply,
 set:set
};

apply(current(),{persist:false});

})();
