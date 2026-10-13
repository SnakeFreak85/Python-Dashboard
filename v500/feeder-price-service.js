(function(){
'use strict';
const suppliers=[{id:'xclusive',name:'Xclusive Snakes',pickup:'Reilingen',kinds:['frozen']},{id:'tropic',name:'Tropic Shop',kinds:['frozen','live']},{id:'frost24',name:'Frostfutterversand24',kinds:['frozen']},{id:'kreuch',name:'Kreuch & Fleuch',kinds:['live']},{id:'frosttiere',name:'Frostfuttertiere.de',kinds:['frozen']},{id:'frostonline',name:'Frostfutter-Online',kinds:['frozen']},{id:'terraladen',name:'Terraristikladen',kinds:['live']},{id:'qb',name:'QB Insects',kinds:['live']}];
async function compare(query){
 if(!navigator.onLine)throw new Error('Für aktuelle Shoppreise benötigst du eine Internetverbindung.');
 const context=await NGTFirebaseSync.getContext();
 if(!NGTFirebaseSync.currentUser())throw new Error('Bitte melde dich im Bereich Konto an, um aktuelle Preise abzurufen.');
 const mod=await import('https://www.gstatic.com/firebasejs/12.15.0/firebase-functions.js');
 try{
  const response=await mod.httpsCallable(mod.getFunctions(context.app,'europe-west3'),'compareFeederPrices',{timeout:95000})(query);
  return response.data;
 }catch(error){
  console.warn('Futterpreisvergleich',error);
  if(/not-found|unimplemented/.test(error.code||''))throw new Error('Der Livepreis-Dienst ist noch nicht bereitgestellt.');
  if(/resource-exhausted/.test(error.code||''))throw new Error('Bitte warte 30 Sekunden bis zum nächsten Vergleich.');
  throw new Error('Die aktuellen Preise konnten nicht geladen werden. Bitte versuche es später erneut.');
 }
}
window.NGTFeederPriceService={suppliers:suppliers,compare:compare};
})();
