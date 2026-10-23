(()=>{
'use strict';
const VERSION='v3.0.17',$=id=>document.getElementById(id),q=(s,r=document)=>r?.querySelector?.(s)||null,qa=(s,r=document)=>Array.from(r?.querySelectorAll?.(s)||[]);
const controller=new AbortController(),signal=controller.signal;
let lifecycleObserver=null,syncRaf=0,lastGame='',routeChanges=0,errors=[],bootAt=performance.now(),syncCount=0;
function visible(el){if(!el||el.hidden)return false;try{const s=getComputedStyle(el);return s.display!=='none'&&s.visibility!=='hidden'&&Number(s.opacity||1)!==0}catch{return true}}
function activeGame(){return ['poker','blackjack','roulette'].find(id=>{const el=$(id);return el?.classList.contains('active')&&visible(el)})||''}
function activeRoot(){return q('#v69Root .v69Screen.active,#v69Root .v69PanelScreen.active')?.id||''}
function setVersion(){
 const title='JRVX CAS '+VERSION;if(document.title!==title)document.title=title;
 const emText='Последнее обновление • '+VERSION,titleText='Последнее обновление, версия '+VERSION,copyText='Global Release: Online Multiplayer, серверная экономика, Progression, Admin, PWA, UX и production identity gate.';
 qa('.v101UpdateCard,.v69Mini').forEach(card=>{if(!/Последнее обновление/i.test(card.textContent||''))return;const em=card.querySelector('em'),b=card.querySelector('b'),p=card.querySelector('p');if(em&&em.textContent!==emText)em.textContent=emText;if(b&&b.textContent!==titleText)b.textContent=titleText;if(p&&p.textContent!==copyText)p.textContent=copyText});
}
function closeInactiveUI(game){if(game!=='poker'){$('p210Drawer')?.classList.remove('active');$('p230Drawer')?.classList.remove('active');$('p230Confirm')?.classList.remove('active')}if(game!=='roulette')q('#roulette .v66RouletteConsole')?.classList.remove('v220-board-open')}
function syncNetwork(){
 const st=$('p59StatusSub');if(!st)return;
 const auth=window.JRVXCASIdentityV300?.state?.(),poker=window.Poker59?.state,net=window.arcadeNetState;
 const production=auth?.mode!=='development'&&auth?.requiresAuthentication!==false;
 if(!production&&poker?.mode==='jarvis'){st.textContent='Локальный режим готов';return}
 if(navigator.onLine===false){st.textContent='Соединение потеряно • ожидаем восстановление';return}
 if(production&&auth?.authenticated!==true){st.textContent='Войдите через JRVX ID для серверной игры';return}
 if(net?.connected===true&&net.handshakeReady===true){
  const confirmedState=poker?.server?.authoritative&&(!production||String(poker.server.you?.id||'')===String(auth.user?.id||''));
  st.textContent=confirmedState?'SERVER LINK ONLINE • серверное состояние':'SERVER LINK ONLINE • соединение подтверждено';
 }else st.textContent=net?.transportConnected===true?'SERVER LINK • подтверждение сессии…':'Нет связи с сервером • переподключение…';
}
function syncAll(){
 syncRaf=0;syncCount++;const g=activeGame();
 document.body.dataset.v241Game=g||'lobby';document.body.classList.toggle('v241-game-active',!!g);document.body.classList.toggle('v200-page-hidden',document.hidden);
 for(const id of ['poker','blackjack','roulette'])document.body.classList.toggle('v241-'+id,g===id);
 closeInactiveUI(g);setVersion();
 try{window.JRVXCASV200?.syncDock?.()}catch{}
 try{window.JRVXCASV230?.syncRecovery?.()}catch{}
 if(g!==lastGame){lastGame=g;routeChanges++}
 if(!g)try{window.JRVXCASV200?.validate?.('')}catch{}
}
function scheduleSync(){if(syncRaf)return;syncRaf=requestAnimationFrame(syncAll)}
function installObserver(){
 try{window.__JRVXV200Observer?.disconnect?.()}catch{};try{window.__JRVXV210Observer?.disconnect?.()}catch{};try{window.__JRVXV230RecoveryObserver?.disconnect?.()}catch{};try{window.JRVXCASV240?.destroy?.()}catch{};
 if(lifecycleObserver)return;
 lifecycleObserver=new MutationObserver(scheduleSync);
 const routeNodes=[...qa('#v69Root .v69Screen,#v69Root .v69PanelScreen'),$('poker'),$('blackjack'),$('roulette')].filter(Boolean);
 for(const n of routeNodes)lifecycleObserver.observe(n,{attributes:true,attributeFilter:['class','hidden','style']});
 window.__JRVXV241LifecycleObserver=lifecycleObserver;
}
function backgroundSync(){document.body.classList.toggle('v241-backgrounded',document.hidden);if(document.hidden){try{window.JRVXCASV230?.saveSession?.(true)}catch{};try{window.JRVXCASV210?.cleanupPokerTimers?.()}catch{}}else{setVersion();scheduleSync()}}
function pagehideSync(){try{window.JRVXCASV230?.saveSession?.(true)}catch{};try{window.JRVXCASV210?.cleanupPokerTimers?.()}catch{}}
function recordError(kind,ev){const item={t:Date.now(),kind,msg:String(ev?.reason?.message||ev?.message||ev?.reason||'Unknown runtime error').slice(0,240),game:activeGame(),root:activeRoot()};errors.push(item);if(errors.length>20)errors.shift();try{sessionStorage.setItem('jrvxCasRuntimeErrorsV241',JSON.stringify(errors))}catch{};setTimeout(()=>{try{window.JRVXCASV200?.validate?.('runtime')}catch{}},0)}
function diagnostics(){const p230=window.JRVXCASV230?.diagnostics?.()||{};return{version:VERSION,uptimeMs:Math.round(performance.now()-bootAt),activeGame:activeGame()||null,root:activeRoot()||null,routeChanges,syncCount,domNodes:document.getElementsByTagName('*').length,hidden:document.hidden,online:navigator.onLine!==false,errors:[...errors],poker:p230,observers:{lifecycle:!!lifecycleObserver,v200:!!window.__JRVXV200Observer,v210:!!window.__JRVXV210Observer,v230:!!window.__JRVXV230RecoveryObserver}}}
function bind(){
 setVersion();installObserver();syncNetwork();syncAll();
 document.addEventListener('visibilitychange',backgroundSync,{signal,passive:true});
 window.addEventListener('pageshow',()=>{setVersion();scheduleSync()},{signal,passive:true});
 window.addEventListener('pagehide',pagehideSync,{signal,passive:true});
 window.addEventListener('online',()=>{syncNetwork();scheduleSync()},{signal,passive:true});
 window.addEventListener('offline',()=>{syncNetwork();scheduleSync()},{signal,passive:true});
 window.addEventListener('error',e=>recordError('error',e),{signal});
 window.addEventListener('unhandledrejection',e=>recordError('promise',e),{signal});
 document.addEventListener('click',e=>{if(e.target.closest?.('#p59Leave,#p59Change,[data-main-menu],#v69EnterTable,#v69TablesBack,.v83Card .play,#rouletteSpin,#bjDeal,#p230Restore,#p230Discard'))setTimeout(scheduleSync,0)},{signal,passive:true});
 [120,700,1800,4200,7600].forEach(ms=>setTimeout(()=>{setVersion();installObserver();scheduleSync()},ms));
}
window.JRVXCASV241={version:VERSION,diagnostics,validate:()=>window.JRVXCASV200?.validate?.('manual'),sync:scheduleSync,destroy(){try{controller.abort();lifecycleObserver?.disconnect();lifecycleObserver=null;if(syncRaf)cancelAnimationFrame(syncRaf)}catch{}}};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',bind,{once:true});else bind();
})();
