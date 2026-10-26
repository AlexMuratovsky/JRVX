(()=>{
'use strict';
const $=id=>document.getElementById(id);
const q=(s,r=document)=>r?.querySelector?.(s)||null;
const fmt=n=>window.JRVXCASMoneyV330.formatCompact(Number.isSafeInteger(n)?n:0,{currency:false});
const setText=(el,value)=>{if(el&&el.textContent!==value)el.textContent=value};

function ensureProps(){
 const table=q('#blackjack .v66BlackjackTable');
 if(!table||q('.v318Props',table))return;
 const props=document.createElement('div');
 props.className='v318Props';
 props.setAttribute('aria-hidden','true');
 props.innerHTML=`<div class="v318ChipRack"><i class="v318ChipStack"></i><i class="v318ChipStack"></i><i class="v318ChipStack"></i><i class="v318ChipStack"></i><i class="v318ChipStack"></i></div><div class="v318Shoe"></div><i class="v318BetSpot left"></i><i class="v318BetSpot right"></i>`;
 table.prepend(props);
}
function ensureBetAdjust(){
 const row=q('#blackjack .casinoBetRow'),input=$('bjBetInput');
 if(!row||!input||q('.v318BetAmount',row))return;
 const wrap=document.createElement('div');wrap.className='v318BetAmount';
 const minus=document.createElement('button');minus.type='button';minus.className='v318BetAdjust';minus.setAttribute('aria-label','Уменьшить ставку');minus.textContent='−';
 const plus=document.createElement('button');plus.type='button';plus.className='v318BetAdjust';plus.setAttribute('aria-label','Увеличить ставку');plus.textContent='+';
 input.parentNode.insertBefore(wrap,input);wrap.append(minus,input,plus);
 const change=dir=>{
   if(input.disabled)return;
   const v=Math.max(0,Math.floor(Number(input.value)||0));
   const step=v>=1000?500:v>=500?100:v>=100?50:10;
   const min=Math.max(1,Number(input.min)||1);
   const increment=Math.max(1,Number(input.step)||1);
   const ceiling=Number(input.max);
   const max=input.max&&Number.isFinite(ceiling)?min+Math.max(0,Math.floor((ceiling-min)/increment))*increment:Infinity;
   const target=Math.max(min,Math.min(max,v+dir*step));
   const units=dir>0?Math.ceil((target-min)/increment):Math.floor((target-min)/increment);
   input.value=String(Math.max(min,Math.min(max,min+units*increment)));
   input.dispatchEvent(new Event('input',{bubbles:true}));
   try{navigator.vibrate?.(12)}catch{}
 };
 minus.onclick=()=>change(-1);plus.onclick=()=>change(1);
}
function syncBetAdjust(){
 const input=$('bjBetInput');if(!input)return;
 for(const button of document.querySelectorAll('#blackjack .v318BetAdjust'))if(button.disabled!==input.disabled)button.disabled=input.disabled;
}
function ensureWallet(){
 const metric=q('#blackjack .v66CasinoMetrics>div:first-child');
 if(!metric||q('.v318WalletExtra',metric))return;
 const e=document.createElement('div');e.className='v318WalletExtra';e.innerHTML='<b id="v318WalletMG">0 MG</b>';metric.appendChild(e);const label=metric.querySelector('span');if(label&&label!==e.querySelector('span'))label.textContent='ВАШ БАЛАНС';
}
function syncWallet(){const value=(window.JRVXCasEconomy||window.JVRXCasEconomy)?.balance?.()||0,node=$('v318WalletMG');setText(node,window.JRVXCASMoneyV330.formatCompact(value));if(node)node.title=window.JRVXCASMoneyV330.formatExact(value)}
function syncLabels(){
 const menu=q('#blackjack [data-main-menu]')||[...document.querySelectorAll('#blackjack .gamehead .actions .btn')].find(b=>/Главное меню|В лобби/i.test(b.textContent||''));setText(menu,'‹   В ЛОББИ');
 const rules=$('bjInfoBtn');setText(rules,'?   ПРАВИЛА');
 const dealerLabel=q('#dealerHand h3 span');setText(dealerLabel,'ДИЛЕР');
 const playerLabel=q('#playerHand h3 span');setText(playerLabel,'ВАШИ КАРТЫ');
 const stand=$('bjStand');if(stand&&stand.textContent!=='Стоп')stand.textContent='Стоп';
 const hit=$('bjHit');if(hit&&hit.textContent!=='Ещё')hit.textContent='Ещё';
 const dbl=$('bjDouble');if(dbl&&dbl.textContent!=='Удвоить')dbl.textContent='Удвоить';
 const split=$('bjSplit');if(split&&split.textContent!=='Разделить')split.textContent='Разделить';
}
function boot(){ensureProps();ensureBetAdjust();syncBetAdjust();ensureWallet();syncLabels();syncWallet();}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(boot,0),{once:true});else setTimeout(boot,0);
let syncQueued=false;
const syncActive=()=>{syncQueued=false;if($('blackjack')?.classList.contains('active')){boot();syncLabels();syncWallet();}};
const mo=new MutationObserver(()=>{if(!syncQueued&&$('blackjack')?.classList.contains('active')){syncQueued=true;queueMicrotask(syncActive)}});
mo.observe(document.documentElement,{subtree:true,childList:true,attributes:true,attributeFilter:['class','disabled']});
setInterval(()=>{if($('blackjack')?.classList.contains('active'))syncWallet()},800);
})();

/* v3.0.19 reference-match refinements */
;(()=>{
 const q=(s,r=document)=>r?.querySelector?.(s)||null;
 function enhanceV319(){
   const bj=document.getElementById('blackjack'); if(!bj)return;
   if(!bj.classList.contains('v319-blackjack-reference'))bj.classList.add('v319-blackjack-reference');
   const chips=[...bj.querySelectorAll('.casinoChip')];
   if(chips.length>=5){
     if(!chips[0].classList.contains('v319-hidden-chip'))chips[0].classList.add('v319-hidden-chip');
     const vals=[100,500,1000,5000],labels=['100','500','1K','5K'];
     chips.slice(1,5).forEach((b,i)=>{const v=String(vals[i]);if(b.dataset.bjBet!==v)b.dataset.bjBet=v;if(b.textContent!==labels[i])b.textContent=labels[i]});
   }
   const input=document.getElementById('bjBetInput');
   if(input && !input.dataset.v319Defaulted && Number(input.value)===50){input.value='500';input.dataset.v319Defaulted='1';input.dispatchEvent(new Event('input',{bubbles:true}))}
 }
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(enhanceV319,0),{once:true}); else setTimeout(enhanceV319,0);
 let v319Queued=false;
 new MutationObserver(()=>{if(!v319Queued&&document.getElementById('blackjack')?.classList.contains('active')){v319Queued=true;queueMicrotask(()=>{v319Queued=false;enhanceV319()})}}).observe(document.documentElement,{subtree:true,childList:true,attributes:true,attributeFilter:['class']});
})();
