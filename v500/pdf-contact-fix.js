(function(){
'use strict';
var SELLER_KEY='ngt_seller_profile_v1';
function id(x){return document.getElementById(x)}
function esc(s){return String(s||'').replace(/[&<>"']/g,function(m){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]})}
function readSeller(){try{return JSON.parse(localStorage.getItem(SELLER_KEY)||'{}')||{}}catch(e){return {}}}
function splitContact(v){v=String(v||'').trim();var r={phone:'',email:''};if(!v)return r;var email=(v.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i)||[''])[0];if(email)r.email=email;var phone=v.replace(email,'').replace(/[·|,;]/g,' ').trim();if(phone)r.phone=phone;return r}
function syncSellerFields(){var s=readSeller();var old=splitContact(s.contact);if(id('sPhone'))id('sPhone').value=s.phone||old.phone||'';if(id('sEmail'))id('sEmail').value=s.email||s.mail||old.email||'';syncHidden()}
function syncHidden(){if(id('sContact'))id('sContact').value=[id('sPhone')&&id('sPhone').value,id('sEmail')&&id('sEmail').value].filter(Boolean).join(' · ');if(id('bContact'))id('bContact').value=[id('bPhone')&&id('bPhone').value,id('bEmail')&&id('bEmail').value].filter(Boolean).join(' · ')}
function saveSellerSplit(){var s={name:id('sName').value,street:id('sStreet').value,address:id('sStreet').value,city:id('sCity').value,phone:id('sPhone').value,email:id('sEmail').value,mail:id('sEmail').value,contact:[id('sPhone').value,id('sEmail').value].filter(Boolean).join(' · ')};localStorage.setItem(SELLER_KEY,JSON.stringify(s));syncHidden()}
function replaceBox(title,obj){var boxes=[].slice.call(document.querySelectorAll('#doc .box'));var box=boxes.find(function(b){return b.querySelector('h3')&&b.querySelector('h3').textContent.trim()===title});if(!box)return;var h='<h3>'+esc(title)+'</h3>'+esc(obj.name||'')+'<br>'+esc(obj.street||'')+'<br>'+esc(obj.city||'');if(obj.phone)h+='<br><br>Telefon: '+esc(obj.phone);if(obj.email)h+='<br>E-Mail: '+esc(obj.email);box.innerHTML=h}
function patchDoc(){var s=readSeller();var b={name:id('bName')&&id('bName').value,street:id('bStreet')&&id('bStreet').value,city:id('bCity')&&id('bCity').value,phone:id('bPhone')&&id('bPhone').value,email:id('bEmail')&&id('bEmail').value};replaceBox('Verkäufer',s);replaceBox('Käufer',b)}
function wrapRender(){if(!window.NGTPdfV2||!NGTPdfV2.renderDoc)return;var old=NGTPdfV2.renderDoc;NGTPdfV2.renderDoc=function(){syncHidden();old();patchDoc()}}
function init(){syncSellerFields();['sPhone','sEmail','bPhone','bEmail'].forEach(function(x){var e=id(x);if(e)e.addEventListener('input',function(){syncHidden();setTimeout(patchDoc,40)})});var btn=id('saveSeller');if(btn)btn.addEventListener('click',function(){saveSellerSplit();setTimeout(patchDoc,80)});wrapRender();setTimeout(function(){syncHidden();if(window.NGTPdfV2&&NGTPdfV2.renderDoc)NGTPdfV2.renderDoc()},120)}
document.readyState==='loading'?document.addEventListener('DOMContentLoaded',init):init();
})();