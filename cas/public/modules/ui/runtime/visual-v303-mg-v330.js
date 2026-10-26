(()=>{
'use strict';
const VERSION='3.0.17';
const $=id=>document.getElementById(id);
const qa=(s,r=document)=>Array.from(r?.querySelectorAll?.(s)||[]);
let lastScreen='';

function activeScreen(){
 const root=$('v69Root');
 return root?.querySelector?.(':scope > .v69Screen.active,:scope > .v69PanelScreen.active')||null;
}
function modalOpen(){return !!document.querySelector('#v69Root .v69Modal.active,.modal.active,#profileOverlay.active,.ageGateOverlay.active')}
function resetRootScroll(force=false){
 const root=$('v69Root'); if(!root)return;
 const screen=activeScreen(); const id=screen?.id||'';
 if(!force&&id===lastScreen)return;
 lastScreen=id;
 const reset=()=>{
   try{root.scrollTop=0;root.scrollLeft=0}catch{}
   try{screen?.scrollTo?.({top:0,left:0,behavior:'auto'})}catch{if(screen)screen.scrollTop=0}
 };
 reset(); requestAnimationFrame(reset); setTimeout(reset,40);
}
function syncDock(){
 const root=$('v69Root'),dock=$('v76Dock');if(!root||!dock)return;
 const id=activeScreen()?.id||'';
 const allowed=(id==='v69Home'||id==='v69TablesScreen')&&!modalOpen()&&!document.body.classList.contains('game-mode');
 root.dataset.v303Dock=allowed?'on':'off';
 dock.setAttribute('aria-hidden',allowed?'false':'true');
 document.body.classList.toggle('v303-modal-open',modalOpen());
}
function sync(){resetRootScroll(false);syncDock()}
function patchRoutes(){
 const R=window.JVRXRoutes;if(!R||R.__v303Visual)return;
 for(const name of ['openTables','quickPlay','privatePlay','openTournaments','launchSimpleGame','returnHome']){
   const fn=typeof R[name]==='function'?R[name].bind(R):null;if(!fn)continue;
   R[name]=function(){const out=fn(...arguments);setTimeout(()=>{resetRootScroll(true);syncDock()},0);setTimeout(syncDock,120);return out};
 }
 Object.defineProperty(R,'__v303Visual',{value:true,configurable:true});
}
function bind(){
 document.documentElement.dataset.jrvxVisualRelease='v303';
 patchRoutes();sync();
 const root=$('v69Root');
 if(root){
   new MutationObserver(()=>requestAnimationFrame(sync)).observe(root,{subtree:true,attributes:true,attributeFilter:['class','hidden','style']});
 }
 document.addEventListener('click',e=>{
   if(e.target.closest?.('#v69Splash,#v69Accept,#v69Decline,#v69ExitToSplash,#v76Dock button,#v69TablesBack,#v74HeroTables,#v74HeroJRVX,#v69QuickPlay,#v69Tables,[data-main-menu],#p59Leave,[data-close],.v69Close')){
     setTimeout(()=>{patchRoutes();resetRootScroll(true);syncDock()},0);setTimeout(syncDock,100);
   }
 },true);
 window.addEventListener('resize',()=>requestAnimationFrame(syncDock),{passive:true});
 window.addEventListener('orientationchange',()=>setTimeout(()=>{resetRootScroll(true);syncDock()},80),{passive:true});
 [0,120,600,1400].forEach(ms=>setTimeout(()=>{patchRoutes();sync()},ms));
}
window.JRVXCASVisualV303={version:VERSION,sync,reset:()=>resetRootScroll(true),syncDock};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',bind,{once:true});else bind();
})();

/* v3.0.17 game UX hardening */
(function(){
'use strict';
const VERSION='3.0.17';
const $=id=>document.getElementById(id);
function unit(){return 'MG'}
function normalizeText(v){return String(v??'').replace(/\bJVRX\b/g,'JRVX').replace(/\bMT\b/g,unit())}
function normalizeGameSurface(root){
 if(!root)return;
 const w=document.createTreeWalker(root,NodeFilter.SHOW_TEXT);const nodes=[];while(w.nextNode())nodes.push(w.currentNode);
 for(const n of nodes){const next=normalizeText(n.nodeValue);if(next!==n.nodeValue)n.nodeValue=next}
}
function normalizeGameSurfaces(){for(const id of ['poker','blackjack','roulette'])normalizeGameSurface($(id))}
function installToastGuard(){
 const prev=window.showArcadeToast;if(typeof prev!=='function'||prev.__v313)return;
 const wrapped=function(title,text,...rest){return prev.call(this,normalizeText(title),normalizeText(text),...rest)};wrapped.__v313=true;wrapped.__base=prev;window.showArcadeToast=wrapped;
}
function installRoutes(){
 const R=window.JVRXRoutes;if(!R||R.__v313)return false;
 const baseSimple=typeof R.launchSimpleGame==='function'?R.launchSimpleGame.bind(R):null;
 const baseQuick=typeof R.quickPlay==='function'?R.quickPlay.bind(R):null;
 const baseTables=typeof R.openTables==='function'?R.openTables.bind(R):null;
 const basePrivate=typeof R.privatePlay==='function'?R.privatePlay.bind(R):null;
 let directLaunch=0;
 const clearDirect=()=>{directLaunch++;window.__JRVXPokerLaunchToken=(Number(window.__JRVXPokerLaunchToken)||0)+1;document.body.classList.remove('v314-poker-direct')};
 R.launchSimpleGame=function(id){
   clearDirect();
   if(id!=='poker')return baseSimple?.(id);
   document.body.classList.add('v314-poker-direct');
   const launch=directLaunch,token=window.__JRVXPokerLaunchToken;
   const out=baseSimple?.('poker');
   const reveal=(tries=0)=>{if(launch!==directLaunch||token!==window.__JRVXPokerLaunchToken||!document.body.classList.contains('v314-poker-direct'))return;const P=window.Poker59;if(P?.showLobby){if(!P.state?.game&&!P.state?.server)try{P.showLobby(false)}catch{}normalizeGameSurfaces();return}if(tries<30)setTimeout(()=>reveal(tries+1),80)};reveal();return out;
 };
 if(baseQuick)R.quickPlay=function(){clearDirect();return baseQuick(...arguments)};
 if(baseTables)R.openTables=function(){clearDirect();return baseTables(...arguments)};
 if(basePrivate)R.privatePlay=function(){clearDirect();return basePrivate(...arguments)};
 for(const name of ['returnHome','openTournaments']){const base=typeof R[name]==='function'?R[name].bind(R):null;if(base)R[name]=function(){clearDirect();return base(...arguments)}}
 R.__v313=true;return true;
}
function syncReleaseText(){
 document.documentElement.dataset.jrvxVersion=VERSION;
 for(const el of document.querySelectorAll('[data-jrvx-version-text],#v300Version,#v290Version'))if(el.textContent)el.textContent=el.textContent.replace(/3\.0\.\d+/g,VERSION);
 normalizeGameSurfaces();
}
function boot(){installToastGuard();installRoutes();syncReleaseText();
 for(const id of ['poker','blackjack','roulette']){const root=$(id);if(root)new MutationObserver(()=>normalizeGameSurface(root)).observe(root,{subtree:true,childList:true,characterData:true})}
 [150,700,1800].forEach(ms=>setTimeout(()=>{installToastGuard();installRoutes();syncReleaseText()},ms));
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
