(function(){
'use strict';
const modules={};const listeners={};
function $(id){return document.getElementById(id)}
function esc(s){return String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
function uid(){return 'ngt-'+Date.now().toString(36)+'-'+Math.random().toString(36).slice(2,8)}
function today(){return new Date().toISOString().slice(0,10)}
function money(n){return Number(n||0).toLocaleString('de-DE',{minimumFractionDigits:2,maximumFractionDigits:2})+' €'}
function on(type,fn){(listeners[type]=listeners[type]||[]).push(fn)}
function emit(type,payload){(listeners[type]||[]).forEach(fn=>{try{fn(payload)}catch(e){console.error(e)}})}
function register(name,mod){modules[name]=mod}
function route(name,args){const mod=modules[name];if(!mod||!mod.render)return;document.querySelectorAll('.drawer button').forEach(b=>b.classList.remove('ok'));$('app').innerHTML=mod.render(args||{});if(mod.afterRender)mod.afterRender(args||{});closeMenu();emit('route',{name,args});}
function modal(html){$('modalRoot').innerHTML='<div class="modal"><div class="modalBox">'+html+'</div></div>'}
function closeModal(){$('modalRoot').innerHTML=''}
function openMenu(){$('drawer').classList.add('open');$('overlay').classList.add('show')}
function closeMenu(){$('drawer').classList.remove('open');$('overlay').classList.remove('show')}
window.NGT500={modules,register,route,on,emit,$,esc,uid,today,money,modal,closeModal,openMenu,closeMenu};
})();
