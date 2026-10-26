(function(){
'use strict';
const $=(s,r=document)=>r?.querySelector?.(s)||null;
const $$=(s,r=document)=>r?[...r.querySelectorAll(s)]:[];

function economy(){
  try{const auth=window.JRVXCASIdentityV300?.state?.();if(auth?.requiresAuthentication!==false&&!auth?.authenticated)return{mg:0,currency:'MG'};const value=(window.JRVXCasEconomy||window.JVRXCasEconomy)?.get?.()?.mg;return{mg:Number.isSafeInteger(value)&&value>=0?value:0,currency:'MG'}}catch{return{mg:0,currency:'MG'}}
}
function identity(){
  let auth=null;try{auth=window.JRVXCASIdentityV300?.state?.()||null}catch{}
  const serverOwned=auth?.requiresAuthentication!==false;
  const candidate=serverOwned?(auth?.authenticated===true?auth.user:null):(window.JRVXIdentity||null),remote=(candidate&&String(candidate.source||'')!=='owner-profile-migration')?candidate:null;
  let local=null;try{local=window.playerProfile||playerProfile}catch{}
  const rid=remote?.jrvx_id||remote?.jrvxId||remote?.id||remote?.sub||'';
  const name=remote?.casNickname||remote?.nickname||remote?.profile?.display_name||remote?.display_name||remote?.username||(!serverOwned&&local?.nickname)||'Игрок';
  const rawId=String(rid||'').trim(),legacyOwner=['1101111','11101111','11101-111','JRVX-1101111'].includes(rawId),safeId=remote?(legacyOwner?'JRVX-JRVX11101111':(rawId||'—')):'—';
  return {remote,local,name,id:safeId,serverOwned,owner:!!remote&&safeId==='JRVX-JRVX11101111'};
}
function initials(name){const s=String(name||'JX').trim();const parts=s.split(/\s+/).filter(Boolean);return ((parts[0]?.[0]||'J')+(parts[1]?.[0]||parts[0]?.[1]||'X')).toUpperCase().slice(0,2)}
function ensureHeader(){
  const right=$('#v69Home .v103TopRight');if(!right)return;
  if(!$('.v109TopWallet',right)){
    const wallet=document.createElement('div');wallet.className='v109TopWallet';wallet.innerHTML='<button class="v109TopWalletUnit mg" data-v109-wallet="MG"><span>Mura Gold</span><strong id="v109TopMG">0 MG</strong></button>';
    right.insertBefore(wallet,$('.v103Search',right)||right.firstChild);
    wallet.addEventListener('click',e=>{if(!e.target.closest('[data-v109-wallet]'))return;if(typeof window.JRVXCASWalletV330?.openShop==='function')window.JRVXCASWalletV330.openShop();else document.getElementById('v69BalanceShop')?.click()});
  }
  if(!$('.v109ProfileButton',right)){
    const b=document.createElement('button');b.className='v109ProfileButton';b.type='button';b.setAttribute('aria-label','Открыть игровой профиль');b.innerHTML='<span class="v109ProfileAvatar" id="v109TopAvatar">JX</span><span class="v109ProfileCopy"><small>JRVX CAS</small><strong id="v109TopName">Профиль</strong></span>';
    const divider=$('.v103Divider',right);right.insertBefore(b,divider||$('.v103Auth',right)||null);
    b.addEventListener('click',e=>{e.preventDefault();e.stopPropagation();openGameProfile()});
  }
}
function enhanceProfile(){
  const modal=document.getElementById('v69Profile'),hero=$('.v70ProfileHero',modal);if(!modal||!hero)return;
  if(!$('.v109ProfileIdentity',hero)){
    const name=hero.querySelector('#v70ProfileHeroName'),p=hero.querySelector('p');
    const wrap=document.createElement('div');wrap.className='v109ProfileIdentity';wrap.innerHTML='<div class="v109ProfileLargeAvatar" id="v109ProfileAvatar">JX</div><div class="v109IdentityText"><h4 id="v109ProfileName">Игрок</h4><p>ID <span id="v109ProfileId">—</span> • игровой профиль JRVX CAS</p><span class="v109IdentityBadge" id="v109IdentityBadge">GAME PROFILE</span></div>';
    if(name?.parentElement){name.parentElement.replaceWith(wrap)}else hero.prepend(wrap);
  }
  if(!$('.v109ProfileStats',modal)){
    const tabs=$('.v70ProfileTabs',modal);const stats=document.createElement('div');stats.className='v109ProfileStats';stats.innerHTML='<div class="v109ProfileStat"><span>Poker • победы</span><strong id="v109PokerWins">0</strong></div><div class="v109ProfileStat"><span>Poker • раздачи</span><strong id="v109PokerHands">0</strong></div><div class="v109ProfileStat"><span>Статус</span><strong id="v109OnlineState">OFFLINE</strong></div><div class="v109ProfileStat"><span>Активная валюта</span><strong id="v109ActiveCurrency">MG</strong></div>';tabs?.before(stats);
  }
  const pane=$('[data-v70-pane="profile"]',modal);
  if(pane&&!$('.v109IdentityNote',pane)){const note=document.createElement('div');note.className='v109IdentityNote';note.id='v109IdentityNote';pane.appendChild(note)}
}
function syncProfile(){
  ensureHeader();enhanceProfile();const e=economy(),i=identity();
  const set=(id,val)=>{const el=document.getElementById(id);if(el)el.textContent=val};
  const setMoney=id=>{const node=document.getElementById(id);if(node){node.textContent=window.JRVXCASMoneyV330.formatCompact(e.mg);node.title=window.JRVXCASMoneyV330.formatExact(e.mg);node.setAttribute('aria-label',node.title)}};setMoney('v109TopMG');set('v109TopName',i.name);set('v109TopAvatar',initials(i.name));
  set('v109ProfileName',i.name);set('v109ProfileId',i.id);set('v109ProfileAvatar',initials(i.name));
  const stats=i.serverOwned?window.JRVXProgress?.state?.stats?.poker:i.local;set('v109PokerWins',i.serverOwned?(i.remote?stats?.wins||0:0):stats?.pokerWins||0);set('v109PokerHands',i.serverOwned?(i.remote?stats?.hands||0:0):stats?.pokerHands||0);set('v109OnlineState',window.arcadeNetState?.connected?'ONLINE':'OFFLINE');set('v109ActiveCurrency',e.currency);
    set('v70ProfileHeroName',i.name);set('v70ProfileHeroId',i.id);setMoney('v70ProfileMG');setMoney('v71ProfileMG');
  const badge=document.getElementById('v109IdentityBadge');if(badge){badge.textContent=i.owner?'OWNER • SUPERADMIN':(i.remote?'JRVX ID CONNECTED':'GAME PROFILE');badge.style.color=i.owner?'#f1ce76':''}
  const idInput=document.getElementById('v70PlayerId'),nick=document.getElementById('v70Nick'),save=document.getElementById('v70SaveProfile'),note=document.getElementById('v109IdentityNote');
  if(i.remote||i.serverOwned){if(idInput){idInput.value=i.id;idInput.readOnly=true;idInput.setAttribute('aria-readonly','true')}if(nick){nick.value=i.name;nick.readOnly=true;nick.setAttribute('aria-readonly','true')}if(save){save.disabled=true;save.textContent=i.remote?'Профиль управляется через JRVX ID':'Войдите через JRVX ID'}if(note)note.textContent=i.remote?'Имя и JRVX ID получены из единого аккаунта. Игровая статистика, друзья, достижения и балансы относятся к JRVX CAS.':'Войдите через JRVX ID, чтобы открыть игровой профиль.'}
  else {if(note)note.textContent='Локальный игровой профиль. После подключения JRVX ID идентификатор и имя будут синхронизироваться с единым аккаунтом.'}
}
function installProgressSync(){
  const progress=window.JRVXProgress,previous=progress?.apply;
  if(typeof previous!=='function'||previous.__v328Profile)return;
  const wrapped=function(){const result=previous.apply(this,arguments);try{syncProfile()}catch{}return result};
  wrapped.__v328Profile=true;wrapped.__base=previous;progress.apply=wrapped;
}
function openGameProfile(){
  const top=document.querySelector('#v69Home .v103TopRight');
  if(top&&!top.classList.contains('v120Authenticated')){location.href='https://id.jrvx.ru/';return}
  const modal=document.getElementById('v69Profile');if(modal)modal.classList.add('active');
  setTimeout(syncProfile,0);setTimeout(()=>{syncProfile();try{window.__jrvxV120Refresh?.()}catch{}},80);
}
window.JRVXCASOpenGameProfile=openGameProfile;
function bindProfileRoutes(){
  ensureHeader();
  document.querySelectorAll('#v76Dock [data-a="profile"]').forEach(b=>{if(b.dataset.v109)return;b.dataset.v109='1';b.addEventListener('click',e=>{e.preventDefault();e.stopImmediatePropagation();openGameProfile()},true)});
  document.querySelectorAll('[data-v103-nav="profile"]').forEach(b=>{if(b.dataset.v109)return;b.dataset.v109='1';b.onclick=openGameProfile});
}
function boot(){installProgressSync();ensureHeader();enhanceProfile();bindProfileRoutes();syncProfile();}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
window.__jrvxProfileSync=syncProfile;setTimeout(boot,250);setTimeout(boot,900);
document.addEventListener('jrvx-cas-identity',()=>setTimeout(()=>{installProgressSync();syncProfile()},0));
const prev=window.handleArcadeNetMessage;window.handleArcadeNetMessage=function(message){const r=prev?.apply(this,arguments);if(['hello_ack','account_wallet','online_wallet','profile_update','admin_users'].includes(message?.type))setTimeout(syncProfile,0);return r};
})();
