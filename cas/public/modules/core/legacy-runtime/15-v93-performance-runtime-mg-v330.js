(function(){
'use strict';
const $=id=>document.getElementById(id),q=(s,r=document)=>r?.querySelector?.(s)||null,qa=(s,r=document)=>r?[...r.querySelectorAll(s)]:[];
let pruned=false;
function pruneLegacyPoker(){
  if(pruned)return;pruned=true;
  // Poker59 fully replaced the old poker shell many versions ago.
  q('#poker .pokerShell')?.remove();
  $('v77RebuyOverlay')?.remove();
  $('v78CenterNotice')?.remove();
}
function modernShop(){
  const modal=$('v69Shop');if(!modal)return false;
  modal.classList.add('active');modal.setAttribute('aria-hidden','false');
  try{document.getElementById('v69ShopTop')?.focus?.({preventScroll:true})}catch{}
  return true;
}
// Old Poker59 button still calls openShop(); point it at the current MG store.
window.openShop=modernShop;
function modernizeLegacyCopy(){
  const roots=[$('pokerInfoOverlay'),$('bjRulesOverlay')].filter(Boolean);
  roots.forEach(root=>{
    const walker=document.createTreeWalker(root,NodeFilter.SHOW_TEXT);
    const nodes=[];while(walker.nextNode())nodes.push(walker.currentNode);
    nodes.forEach(n=>{let s=n.nodeValue||'';s=s.replace(/Mura Tokens\s*\(MT\)/gi,'Mura Gold').replace(/Mura Tokens/gi,'Mura Gold').replace(/\bMT\b/g,'MG').replace(/Mura Arcade Coin/gi,'Mura Gold');if(s!==n.nodeValue)n.nodeValue=s});
  });
}
function cleanupTransient(){
  try{window.v84CleanupMotion?.()}catch{}
  qa('.v84CollectGhost,.v84FlyCard,.v78DealBack,.v78CollectCard').forEach(x=>x.remove());
}
function boot(){
  pruneLegacyPoker();modernizeLegacyCopy();
  // Rewire current Poker store button once, without another global observer/timer.
  const buy=$('p59BuyMt');if(buy&&!buy.dataset.v93){buy.dataset.v93='1';buy.onclick=(e)=>{e?.preventDefault?.();modernShop()}}
  window.addEventListener('pagehide',cleanupTransient,{passive:true});
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
