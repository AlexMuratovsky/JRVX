(()=>{
'use strict';
const VERSION='3.0.17', SW='/service-worker.js', STORE='jrvxCasPwaV290';
const state={deferred:null,installed:false,online:navigator.onLine,toastTimer:0,updateTimer:0};
let installReturnFocus=null;
let updateRegistration=null,updateRequest=null;
const q=(s,r=document)=>r.querySelector(s);
const foreground=()=>!document.hidden&&document.visibilityState!=='hidden';
function checkUpdate(){
 if(!updateRegistration||!foreground()||navigator.onLine===false)return Promise.resolve(false);
 if(updateRequest)return updateRequest;
 const operation=Promise.resolve().then(()=>{
  if(!foreground()||navigator.onLine===false)return false;
  return Promise.resolve(updateRegistration.update()).then(()=>true);
 }).catch(()=>false).finally(()=>{if(updateRequest===operation)updateRequest=null});
 updateRequest=operation;return operation;
}
function standalone(){return matchMedia('(display-mode: standalone)').matches||matchMedia('(display-mode: fullscreen)').matches||navigator.standalone===true}
function mark(){document.documentElement.classList.add('v290-pwa');document.documentElement.classList.toggle('v290-standalone',standalone());if(document.body)document.body.classList.toggle('v290-pwa-standalone',standalone())}
function toast(text,online=null){let el=q('#v290PwaToast');if(!el){el=document.createElement('div');el.id='v290PwaToast';el.className='v290PwaToast';document.body.appendChild(el)}const dot=online===null?'':`<i class="${online?'v290OfflineDot v290OnlineDot':'v290OfflineDot'}"></i>`;el.innerHTML=dot+String(text||'');el.classList.add('show');clearTimeout(state.toastTimer);state.toastTimer=setTimeout(()=>el.classList.remove('show'),2600)}
function isiOS(){return /iphone|ipad|ipod/i.test(navigator.userAgent)||(/Mac/i.test(navigator.platform)&&navigator.maxTouchPoints>1)}
function closeInstallSheet(sh){
 sh.classList.remove('show');sh.hidden=true;
 const target=[installReturnFocus,q('#v290InstallBtn')].find(node=>node?.isConnected&&!node.disabled&&!node.hidden&&node.getClientRects().length);
 installReturnFocus=null;target?.focus();
 if(sh.contains(document.activeElement))document.activeElement.blur?.();
}
function openInstallSheet(trigger){
 const sh=installSheet();if(!sh.classList.contains('show'))installReturnFocus=trigger||document.activeElement;
 sh.hidden=false;sh.classList.add('show');q('[data-v290-close]',sh)?.focus();
}
function installSheet(){
 let sh=q('#v290InstallSheet');if(sh)return sh;
 sh=document.createElement('div');sh.id='v290InstallSheet';sh.className='v290InstallSheet';sh.hidden=true;
 sh.innerHTML='<div class="v290InstallCard" role="dialog" aria-modal="true" aria-labelledby="v290InstallTitle" aria-describedby="v290InstallDescription" tabindex="-1"><h3 id="v290InstallTitle">Установить JRVX CAS</h3><p id="v290InstallDescription">На iPhone установка выполняется средствами Safari.</p><div class="v290InstallSteps"><div class="v290InstallStep">1. Нажмите <b>Поделиться</b> в Safari.</div><div class="v290InstallStep">2. Выберите <b>На экран «Домой»</b>.</div><div class="v290InstallStep">3. Запускайте JRVX CAS с иконки в полноэкранном режиме.</div></div><div class="v290InstallActions"><button type="button" class="v69Btn" data-v290-close>Закрыть</button></div></div>';
 sh.addEventListener('click',e=>{if(e.target===sh||e.target.closest?.('[data-v290-close]'))closeInstallSheet(sh)});
 window.addEventListener('keydown',e=>{
  if(!sh.classList.contains('show'))return;
  if(e.key==='Escape'){e.preventDefault();e.stopPropagation();closeInstallSheet(sh);return}
  if(e.key!=='Tab')return;
  const nodes=[...sh.querySelectorAll('button:not([disabled]),a[href],input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])')].filter(node=>!node.hidden&&node.getClientRects().length);
  const first=nodes[0]||q('.v290InstallCard',sh),last=nodes.at(-1)||first;
  if(!nodes.length||!sh.contains(document.activeElement)||e.shiftKey&&document.activeElement===first||!e.shiftKey&&document.activeElement===last){e.preventDefault();e.stopPropagation();(e.shiftKey?last:first)?.focus()}
 },true);
 document.body.appendChild(sh);return sh;
}
function ensureInstallButton(){const host=q('#v69Home .v103TopRight')||q('.v69TopActions');if(!host)return null;let b=q('#v290InstallBtn');if(!b){b=document.createElement('button');b.type='button';b.id='v290InstallBtn';b.className='v69Btn v290InstallBtn';b.textContent='Установить';b.addEventListener('click',async()=>{if(state.deferred){const ev=state.deferred;state.deferred=null;b.classList.remove('show');try{await ev.prompt();const choice=await ev.userChoice;if(choice?.outcome==='accepted')toast('JRVX CAS устанавливается')}catch{}return}if(isiOS()&&!standalone()){openInstallSheet(b);return}toast(standalone()?'JRVX CAS уже установлен':'Установка недоступна в этом браузере')});host.insertBefore(b,host.lastElementChild||null)}const can=!!state.deferred||(isiOS()&&!standalone());b.classList.toggle('show',can&&!standalone());return b}
function network(online,announce=true){state.online=online;document.documentElement.classList.toggle('v290-offline',!online);if(!announce)return;if(online)toast('Соединение восстановлено',true);else toast('Офлайн-режим: online-функции временно недоступны',false)}
async function register(){if(!('serviceWorker'in navigator)||location.protocol==='file:')return;try{const reg=await navigator.serviceWorker.register(SW,{scope:'/',updateViaCache:'none'});updateRegistration=reg;window.JRVXPWA={version:VERSION,registration:reg,standalone,install:()=>q('#v290InstallBtn')?.click(),update:checkUpdate};state.updateTimer=setInterval(checkUpdate,30*60*1000);reg.addEventListener('updatefound',()=>{const w=reg.installing;if(!w)return;w.addEventListener('statechange',()=>{if(w.state==='installed'&&navigator.serviceWorker.controller)toast('Обновление JRVX CAS установлено. Применится при следующем запуске.')})})}catch(e){console.warn('[JRVX PWA] Service worker registration failed',e)}}
function resume(){mark();ensureInstallButton();network(navigator.onLine!==false,false);void checkUpdate()}
function protectGestures(){if(!matchMedia('(pointer: coarse)').matches)return;document.addEventListener('gesturestart',e=>e.preventDefault(),{passive:false})}
function boot(){mark();ensureInstallButton();const top=q('#v69Home .v69Topbar');if(top)new MutationObserver(ensureInstallButton).observe(top,{childList:true,subtree:true});protectGestures();network(navigator.onLine,false);register();window.addEventListener('online',()=>{network(true);void checkUpdate()},{passive:true});window.addEventListener('offline',()=>network(false),{passive:true});document.addEventListener('visibilitychange',()=>{if(foreground())resume()},{passive:true});matchMedia('(display-mode: standalone)').addEventListener?.('change',()=>{mark();ensureInstallButton()});window.addEventListener('beforeinstallprompt',e=>{e.preventDefault();state.deferred=e;ensureInstallButton()});window.addEventListener('appinstalled',()=>{state.installed=true;state.deferred=null;mark();ensureInstallButton();toast('JRVX CAS установлен')});window.addEventListener('pageshow',resume,{passive:true});
 try{localStorage.setItem(STORE,JSON.stringify({version:VERSION,lastLaunch:Date.now(),standalone:standalone()}))}catch{}
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
