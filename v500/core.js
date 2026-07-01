(function(){
'use strict';
const modules={};const listeners={};
function $(id){return document.getElementById(id)}
function esc(s){return String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
function uid(){return 'tc-'+Date.now().toString(36)+'-'+Math.random().toString(36).slice(2,8)}
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
function toast(msg,type){
 type=type||'ok';
 let root=document.getElementById('toastRoot');
 if(!root){root=document.createElement('div');root.id='toastRoot';root.style.cssText='position:fixed;left:16px;right:16px;bottom:18px;z-index:9999;display:grid;gap:8px;pointer-events:none';document.body.appendChild(root)}
 const el=document.createElement('div');
 el.className='tcToast '+type;
 el.style.cssText='pointer-events:auto;margin:auto;max-width:520px;background:#172331;color:#fff;border-radius:16px;padding:12px 14px;box-shadow:0 12px 35px rgba(0,0,0,.28);font-weight:700;opacity:0;transform:translateY(12px);transition:.22s ease';
 if(type==='danger')el.style.background='#7f1d1d';
 if(type==='warn')el.style.background='#7c4a03';
 el.textContent=msg;
 root.appendChild(el);
 requestAnimationFrame(()=>{el.style.opacity='1';el.style.transform='translateY(0)'});
 setTimeout(()=>{el.style.opacity='0';el.style.transform='translateY(12px)';setTimeout(()=>el.remove(),260)},3200);
}
window.NGT500={modules,register,route,on,emit,$,esc,uid,today,money,modal,closeModal,openMenu,closeMenu,toast};
})();