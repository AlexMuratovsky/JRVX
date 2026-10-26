/* source: modules/ui/runtime/compat-v139.js */
(()=>{
'use strict';
const VERSION='v3.0.17';
const LEGACY=['pong','hangman','snake','ttt','breakout','race'];
const q=(s,r=document)=>r?.querySelector?.(s)||null;
const qa=(s,r=document)=>r?[...r.querySelectorAll(s)]:[];
let versionObserver=null, brandRaf=0, pokerHooked=false, roulettePatched=false;

function canonicalText(root=document.body){
 if(!root)return;
 const walker=document.createTreeWalker(root,NodeFilter.SHOW_TEXT,{acceptNode(n){
   const p=n.parentElement;if(!p||['SCRIPT','STYLE','NOSCRIPT','TEXTAREA','OPTION'].includes(p.tagName))return NodeFilter.FILTER_REJECT;
   return /JVRX|JARVIX|JARVIS/i.test(n.nodeValue||'')?NodeFilter.FILTER_ACCEPT:NodeFilter.FILTER_REJECT;
 }});
 const nodes=[];while(walker.nextNode())nodes.push(walker.currentNode);
 for(const n of nodes)n.nodeValue=(n.nodeValue||'').replace(/JARVIX|JARVIS|JVRX/gi,'JRVX');
}
function ensureHeroBrand(){
 const host=q('.v74HeroVisual');if(!host)return;
 let mark=q('.v139HeroBrandPatch',host);
 if(!mark){mark=document.createElement('div');mark.className='v139HeroBrandPatch';mark.setAttribute('aria-hidden','true');mark.textContent='JRVX CAS';host.appendChild(mark)}
}
function enforceVersion(){
 document.title='JRVX CAS '+VERSION;
 const card=q('.v101UpdateCard');if(!card)return;
 const em=q('em',card),title=q('b',card),copy=q('p',card);
 const wantedEm='Последнее обновление • '+VERSION;
 const wantedTitle='Последнее обновление, версия '+VERSION;
 const wantedCopy='Online Multiplayer: серверные Poker-столы, reconnect, private tables, spectator mode и авторитетное серверное состояние.';
 if(em&&em.textContent!==wantedEm)em.textContent=wantedEm;
 if(title&&title.textContent!==wantedTitle)title.textContent=wantedTitle;
 if(copy&&copy.textContent!==wantedCopy)copy.textContent=wantedCopy;
 if(!versionObserver){
   /* v3.0.17: persistent version watching is owned by the consolidated lifecycle observer. */
 }
}
function labelMainMenu(){
 const leave=q('#p59Leave');if(leave&&leave.textContent.trim()!=='Главное меню')leave.textContent='Главное меню';
 qa('#poker [data-main-menu],#blackjack [data-main-menu],#roulette [data-main-menu],#blackjack [data-v91-exit],#roulette [data-v91-exit]').forEach(b=>{if(b.textContent.trim()!=='Главное меню')b.textContent='Главное меню'});
}
function pruneLegacyDom(){
 for(const id of LEGACY){
   const game=document.getElementById(id);if(game?.isConnected)game.remove();
 }
 qa(LEGACY.map(id=>`[data-game="${id}"]`).join(',')).forEach(el=>el.remove());
}
function patchRouletteBrand(){
 if(roulettePatched)return;
 if(typeof window.rouletteDrawCircularBrand!=='function')return;
 const TAU=(typeof R_TAU==='number'?R_TAU:Math.PI*2);
 window.rouletteDrawCircularBrand=function(ctx,r,wheelAngle){
   const count=12;ctx.save();ctx.fillStyle='#f8e6b4';ctx.font='900 15px system-ui';ctx.textAlign='center';ctx.textBaseline='middle';ctx.shadowBlur=4;ctx.shadowColor='rgba(0,0,0,.24)';
   for(let i=0;i<count;i++){const a=wheelAngle+i*TAU/count;ctx.save();ctx.rotate(a+Math.PI/2);ctx.translate(0,-r);ctx.fillText('JRVX',0,0);ctx.restore();const da=a+TAU/(count*2);ctx.beginPath();ctx.arc(Math.cos(da)*r,Math.sin(da)*r,2,0,TAU);ctx.fill()}
   ctx.restore();
 };
 roulettePatched=true;
 try{window.rouletteDraw?.()}catch{}
}
function hookPokerRender(){
 if(pokerHooked)return;
 const P=window.Poker59;if(!P||typeof P.render!=='function')return;
 const base=P.render;if(base.__v139)return;
 const wrapped=function(){const out=base.apply(this,arguments);requestAnimationFrame(()=>{labelMainMenu()});return out};
 wrapped.__v139=true;P.render=wrapped;pokerHooked=true;
}
function fixBrandSurfaces(){
 canonicalText(q('#v69Root'));
 canonicalText(q('#poker'));
 canonicalText(q('#blackjack'));
 canonicalText(q('#roulette'));
 ensureHeroBrand();labelMainMenu();patchRouletteBrand();hookPokerRender();
}
function run(){pruneLegacyDom();enforceVersion();fixBrandSurfaces()}
function schedule(){if(brandRaf)return;brandRaf=requestAnimationFrame(()=>{brandRaf=0;run()})}

if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',run,{once:true});else run();
/* v3.0.17: pageshow / visibility / route clicks are handled centrally. */
setTimeout(run,300);setTimeout(run,1350);
})();
;
/* source: modules/core/runtime/core.js */
(()=>{
'use strict';
const VERSION='v3.0.17';
const $=id=>document.getElementById(id);
const qa=(s,r=document)=>Array.from(r?.querySelectorAll?.(s)||[]);
let lastRootScreen='v69Home', recoveryTimer=0, dockTimer=0, launchSeq=0;
const GAME_IDS=['poker','blackjack','roulette'];
const ROUTE_TOUCH='#v69EnterTable,#v69TablesBack,#v69QuickPlay,#v69Tables,#v74HeroJRVX,#v74HeroTables,.v83Card .play,.v69CurrencyCard,[data-main-menu],#p59Leave,#v76Dock button';

function visible(el){
 if(!el||el.hidden)return false;
 try{const s=getComputedStyle(el);return s.display!=='none'&&s.visibility!=='hidden'&&Number(s.opacity||1)!==0}catch{return true}
}
function activeRoot(){const r=$('v69Root');return r?.querySelector?.('.v69Screen.active,.v69PanelScreen.active')||null}
function activeGame(){return GAME_IDS.map($).find(g=>g?.classList.contains('active')&&visible(g))||null}
function remember(){const a=activeRoot();if(a?.id)lastRootScreen=a.id}
function toast(title,text){try{window.showArcadeToast?.(title,text,'!',2100)}catch{} }

function setVersion(){
 document.title='JRVX CAS '+VERSION;
 const card=qa('.v69Mini').find(el=>/Последнее обновление/i.test(el.textContent||''));
 if(card){const em=card.querySelector('em'),b=card.querySelector('b'),p=card.querySelector('p');if(em)em.textContent='Последнее обновление • '+VERSION;if(b)b.textContent='Последнее обновление, версия '+VERSION;if(p)p.textContent='Global Release: Online Multiplayer, серверная экономика, Progression, Admin, PWA, UX и production identity gate.'}
}
function canonicalSmall(root){
 if(!root)return;
 const w=document.createTreeWalker(root,NodeFilter.SHOW_TEXT,{acceptNode(n){const p=n.parentElement;if(!p||['SCRIPT','STYLE','TEXTAREA'].includes(p.tagName))return NodeFilter.FILTER_REJECT;return /JVRX|JARVIX|JARVIS/i.test(n.nodeValue||'')?NodeFilter.FILTER_ACCEPT:NodeFilter.FILTER_REJECT}});
 const nodes=[];while(w.nextNode())nodes.push(w.currentNode);for(const n of nodes)n.nodeValue=(n.nodeValue||'').replace(/JARVIX|JARVIS|JVRX/gi,'JRVX');
}
function pruneLegacy(){for(const id of ['pong','hangman','snake','ttt','breakout','race'])$(id)?.remove()}

function inferDock(){
 const dock=$('v76Dock');if(!dock)return;
 let key='lobby';
 const modal=qa('#v69Root .v69Modal.active')[0];
 if(modal?.id==='v69Shop')key='shop';
 else if(/profile/i.test(modal?.id||''))key='profile';
 else if($('v69TablesScreen')?.classList.contains('active')){
   key=/EVENTS|Турнир/i.test(($('v71FlowBadge')?.textContent||'')+' '+($('v69TableSubtitle')?.textContent||''))?'events':'tables';
 }else if(/Турнир/i.test(($('v69InfoTitle')?.textContent||''))) key='events';
 qa('button[data-a]',dock).forEach(b=>b.classList.toggle('active',b.dataset.a===key));
}
function syncDockSoon(){clearTimeout(dockTimer);dockTimer=setTimeout(inferDock,35)}

function clearGameShell(){
 document.body.classList.remove('game-mode','v85-poker-active','v87-live-poker','jrvx-poker-playing','v110-poker-seated');
 qa('.game').forEach(g=>g.classList.remove('active','v87GameEnter'));
}
function restoreRoot(reason=''){
 const root=$('v69Root');if(!root)return;
 clearGameShell();root.hidden=false;root.style.display='block';
 let target=$(lastRootScreen);if(!target||(!target.matches('.v69Screen,.v69PanelScreen')))target=$('v69Home');
 qa('.v69Screen,.v69PanelScreen',root).forEach(s=>s.classList.remove('active'));
 target?.classList.add('active');
 if(reason)toast('JRVX CAS','Интерфейс восстановлен после сбоя перехода.');
 remember();inferDock();
}
function validateSurface(reason=''){
 remember();
 if(activeGame())return true;
 const root=$('v69Root'),screen=activeRoot();
 if(root&&visible(root)&&screen&&visible(screen)){syncDockSoon();return true}
 restoreRoot(reason||'surface');return false;
}
function scheduleValidation(reason='route',delay=900){
 const seq=++launchSeq;clearTimeout(recoveryTimer);recoveryTimer=setTimeout(()=>{if(seq===launchSeq)validateSurface(reason)},delay)
}

function patchRoutes(){
 const R=window.JVRXRoutes;if(!R||R.__v200)return;
 const oldReturn=typeof R.returnHome==='function'?R.returnHome.bind(R):null;
 if(oldReturn)R.returnHome=function(){window.__JRVXPokerLaunchToken=(Number(window.__JRVXPokerLaunchToken)||0)+1;const out=oldReturn();lastRootScreen='v69Home';setTimeout(()=>{validateSurface('');inferDock()},0);return out};
 for(const name of ['openTables','quickPlay','privatePlay','openTournaments']){
   const fn=typeof R[name]==='function'?R[name].bind(R):null;if(!fn)continue;
   R[name]=function(){const out=fn(...arguments);setTimeout(()=>{remember();inferDock()},0);scheduleValidation(name,1200);return out};
 }
 const simple=typeof R.launchSimpleGame==='function'?R.launchSimpleGame.bind(R):null;
 if(simple)R.launchSimpleGame=function(id){const out=simple(id);scheduleValidation('launch:'+id,1300);return out};
 Object.defineProperty(R,'__v200',{value:true,configurable:true});
}

function pokerPreflight(e){
 if(e.target.closest?.('#p59Leave')){
  e.preventDefault();e.stopImmediatePropagation();
  window.__JRVXPokerLaunchToken=(Number(window.__JRVXPokerLaunchToken)||0)+1;
  window.JRVXCASV250?.leaveIntent?.();
  window.arcadeNetSend?.({type:'poker_leave'});
  if(window.Poker59?.state?.server||window.Poker59?.state?.game)window.Poker59.showLobby(true);
  lastRootScreen='v69Home';restoreRoot();return;
 }
 const gameButton=e.target.closest?.('.mode-blackjack .play,.mode-roulette .play');
 if(gameButton){e.preventDefault();e.stopImmediatePropagation();window.JVRXRoutes?.launchSimpleGame?.(gameButton.closest('.mode-blackjack')?'blackjack':'roulette');return;}

 const btn=e.target.closest?.('#v69EnterTable');if(!btn)return;
 const badge=$('v71FlowBadge')?.textContent||'';if(!/HEADS-UP/i.test(badge))return;
 let cur='MG';try{cur='MG'}catch{}
 let balance=0;try{balance=Math.max(0,Number(window.JVRXCasEconomy?.balance?.(cur))||0)}catch{}
 const counter=Math.max(0,(parseInt(($('v69TableCounter')?.textContent||'1').match(/\d+/)?.[0]||'1',10)-1));
 const mins={MG:[20,40,100,200,500,1000,2000]};
 const min=(mins[cur]||mins.MG)[Math.min(counter,6)];
 if(balance>=min)return;
 e.preventDefault();e.stopImmediatePropagation();
 const root=$('v69Root');if(root){root.hidden=false;root.style.display='block'}
 qa('.v69Screen,.v69PanelScreen',root).forEach(s=>s.classList.toggle('active',s.id==='v69TablesScreen'));
 lastRootScreen='v69TablesScreen';inferDock();
 toast('Недостаточно средств',`Для этого стола нужно минимум ${min.toLocaleString('ru-RU')} ${cur}.`);
}

function onRouteClick(e){
 if(e.target.closest?.('#p59Leave')){lastRootScreen='v69Home';restoreRoot();}
 if(!e.target.closest?.(ROUTE_TOUCH))return;
 remember();syncDockSoon();scheduleValidation('navigation',1300);
}
function bind(){
 document.documentElement.dataset.jrvxRoutesRelease='v300-production-r13';
 // Compatibility aliases: historical builds used JVRX for internal APIs while newer poker layers use JRVX.
 if(!window.JRVXCasEconomy&&window.JVRXCasEconomy)window.JRVXCasEconomy=window.JVRXCasEconomy;
 if(!window.JRVXRoutes&&window.JVRXRoutes)window.JRVXRoutes=window.JVRXRoutes;
 patchRoutes();pruneLegacy();setVersion();canonicalSmall($('v69Root'));
 document.addEventListener('click',pokerPreflight,true);
 document.addEventListener('click',onRouteClick,{passive:true});
 /* v3.0.17: visibility + route observation are owned by the consolidated lifecycle runtime. */
 window.__JRVXV200Observer=null;
 // v104 used to force the Events icon active late in boot. Reassert the actual screen state after all legacy boot timers.
 [0,120,650,1400].forEach(ms=>setTimeout(()=>{patchRoutes();setVersion();inferDock();validateSurface('')},ms));
}
window.JRVXCASV200={version:VERSION,validate:validateSurface,restore:restoreRoot,syncDock:inferDock,pruneLegacy};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',bind,{once:true});else bind();
})();
;
