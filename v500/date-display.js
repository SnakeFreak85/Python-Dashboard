(function(){
'use strict';

/*
 * TerraControl speichert Datumswerte intern weiterhin
 * im sicheren ISO-Format JJJJ-MM-TT.
 *
 * Dieses Modul verändert ausschließlich die sichtbare
 * Darstellung innerhalb der App.
 */

const DATE_PATTERN=
 /\b(\d{4})[-/](\d{2})[-/](\d{2})(?:T(\d{2}):(\d{2})(?::\d{2}(?:\.\d+)?)?Z?)?\b/g;

const EXCLUDED_SELECTOR=[
 'script',
 'style',
 'input',
 'textarea',
 'code',
 'pre',
 '[data-tc-date-raw]'
].join(',');

let observer=null;
let scheduled=false;

function validDateParts(year,month,day){
 const yearNumber=Number(year);
 const monthNumber=Number(month);
 const dayNumber=Number(day);

 if(
  !Number.isInteger(yearNumber)||
  !Number.isInteger(monthNumber)||
  !Number.isInteger(dayNumber)
 ){
  return false;
 }

 if(
  monthNumber<1||
  monthNumber>12||
  dayNumber<1||
  dayNumber>31
 ){
  return false;
 }

 const date=new Date(
  yearNumber,
  monthNumber-1,
  dayNumber
 );

 return (
  date.getFullYear()===yearNumber&&
  date.getMonth()===monthNumber-1&&
  date.getDate()===dayNumber
 );
}

function formatDate(value){
 return String(
  value==null
   ?''
   :value
 ).replace(
  DATE_PATTERN,
  function(
   original,
   year,
   month,
   day,
   hour,
   minute
  ){
   if(
    !validDateParts(
     year,
     month,
     day
    )
   ){
    return original;
   }

   const formatted=
    day+'/'+month+'/'+year;

   if(
    hour!==undefined&&
    minute!==undefined
   ){
    return (
     formatted+
     ' '+
     hour+
     ':'+
     minute
    );
   }

   return formatted;
  }
 );
}

function isExcluded(node){
 const parent=
  node&&
  node.parentElement;

 if(!parent){
  return false;
 }

 return !!parent.closest(
  EXCLUDED_SELECTOR
 );
}

function formatTextNode(node){
 if(
  !node||
  node.nodeType!==Node.TEXT_NODE||
  isExcluded(node)
 ){
  return;
 }

 const current=node.nodeValue||'';
 const formatted=formatDate(current);

 if(formatted!==current){
  node.nodeValue=formatted;
 }
}

function formatRoot(root){
 if(!root){
  return;
 }

 if(root.nodeType===Node.TEXT_NODE){
  formatTextNode(root);
  return;
 }

 const walker=document.createTreeWalker(
  root,
  NodeFilter.SHOW_TEXT
 );

 let node=walker.nextNode();

 while(node){
  formatTextNode(node);
  node=walker.nextNode();
 }
}

function formatPage(){
 scheduled=false;

 if(!document.body){
  return;
 }

 formatRoot(document.body);
}

function schedule(){
 if(scheduled){
  return;
 }

 scheduled=true;

 queueMicrotask(
  formatPage
 );
}

function observe(){
 if(
  observer||
  !document.body
 ){
  return;
 }

 formatPage();

 observer=new MutationObserver(
  function(records){
   const relevant=records.some(
    function(record){
     return (
      record.type==='childList'||
      record.type==='characterData'
     );
    }
   );

   if(relevant){
    schedule();
   }
  }
 );

 observer.observe(
  document.body,
  {
   childList:true,
   characterData:true,
   subtree:true
  }
 );
}

window.NGTDateDisplay={
 format:formatDate,
 refresh:formatPage
};

if(window.NGT500){
 NGT500.formatDate=formatDate;
}

if(document.readyState==='loading'){
 document.addEventListener(
  'DOMContentLoaded',
  observe,
  {once:true}
 );
}else{
 observe();
}

})();
