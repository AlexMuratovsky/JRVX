(function(){
'use strict';
const $=id=>document.getElementById(id);
function openCasShop(){
  const shop=$('v69Shop'); if(!shop)return false;
  if(shop.parentElement!==document.body)document.body.appendChild(shop);
  shop.classList.add('active');shop.setAttribute('aria-hidden','false');
  try{window.__jrvxV120Refresh?.()}catch{}
  return true;
}
function installOldTableRoutes(){
  const R=window.JVRXRoutes;
  if(R){
    R.quickPlay=()=>window.JRVXCASOpenTableFlow?.('jarvis');
    R.openTables=()=>window.JRVXCASOpenTableFlow?.('tables');
  }
  window.JRVXCASOpenJrvxChooser=()=>window.JRVXCASOpenTableFlow?.('jarvis');
}
function syncCasinoShopButtons(){
  document.querySelectorAll('#blackjack [data-open-token-shop],#roulette [data-open-token-shop]').forEach(b=>b.textContent='Магазин MG');
}
function cleanupLegacy(){
  $('arcadeShopOverlay')?.remove();
  document.querySelectorAll('.v122JarvisChooser').forEach(x=>{x.classList.remove('active');x.setAttribute('aria-hidden','true')});
  $('v84StreetRail')?.setAttribute('aria-hidden','true');
}
function boot(){
  const shop=$('v69Shop');if(shop&&shop.parentElement!==document.body)document.body.appendChild(shop);
  window.openShop=openCasShop;
  installOldTableRoutes();syncCasinoShopButtons();cleanupLegacy();
}
// Capture only the casino cashier buttons so obsolete bubble listeners cannot open a retired store.
document.addEventListener('click',e=>{
  const btn=e.target.closest?.('#blackjack [data-open-token-shop],#roulette [data-open-token-shop],#arcadeShopOpenBtn');
  if(!btn)return;e.preventDefault();e.stopImmediatePropagation();openCasShop();
},true);
window.addEventListener('pageshow',()=>{installOldTableRoutes();syncCasinoShopButtons();cleanupLegacy()},{passive:true});
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
