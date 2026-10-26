(()=>{
'use strict';
const $$=(s,r=document)=>Array.from(r.querySelectorAll(s));
function syncFixedLabels(){
 $$('.v69GameCurrency [data-cur]').forEach(b=>{const v=(b.dataset.cur||'').toUpperCase();if(v&&(b.textContent||'').trim()!==v)b.textContent=v});
 $$('[data-open-token-shop]').forEach(b=>{if((b.textContent||'').trim()!=='Магазин MG')b.textContent='Магазин MG'});
}
function run(){syncFixedLabels()}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',run,{once:true});else run();
setTimeout(run,350);setTimeout(run,1200);
})();
