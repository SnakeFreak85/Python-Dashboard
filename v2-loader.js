(function(){
'use strict';
function load(src,id){
 if(document.querySelector('script[data-'+id+']'))return;
 var s=document.createElement('script');
 s.src=src;
 s.defer=true;
 s.setAttribute('data-'+id,'true');
 document.head.appendChild(s);
}
function init(){
 load('./v2-core.js?v=2.0.3','ngt-v2-core');
 load('./v2-health-a.js?v=2.0.3','ngt-v2-health');
 load('./v2-activity-a.js?v=2.0.3','ngt-v2-activity-a');
 load('./v2-activity-b.js?v=2.0.3','ngt-v2-activity-b');
}
document.readyState==='loading'?document.addEventListener('DOMContentLoaded',init):init();
})();
