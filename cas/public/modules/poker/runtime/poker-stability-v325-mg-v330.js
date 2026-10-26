(()=>{
'use strict';
const VERSION='v3.0.17',HISTORY_KEY='jrvxCasPokerHistoryV210';
const $=id=>document.getElementById(id),qa=(s,r=document)=>Array.from(r?.querySelectorAll?.(s)||[]);
let booted=false,routeObserver=null,lastRecorded='',pageSession='p'+Date.now().toString(36)+Math.random().toString(36).slice(2,7);
function safeJSON(v,fallback){try{return JSON.parse(v)}catch{return fallback}}
function historyOwner(){const state=window.JRVXCASIdentityV300?.state?.();if(state?.mode==='development')return'development';return state?.authenticated&&state?.user?.id?String(state.user.id):''}
function historyKey(){const owner=historyOwner();if(owner==='development')return HISTORY_KEY;return owner?`${HISTORY_KEY}:${owner}`:''}
function history(){const key=historyKey();if(!key)return[];let rows=[];try{rows=JSON.parse(localStorage.getItem(key)||'[]')}catch{}return Array.isArray(rows)?rows.filter(row=>row?.currency==='MG'):[]}
function writeHistory(x){const key=historyKey();if(!key)return;try{localStorage.setItem(key,JSON.stringify(x.slice(0,50)))}catch{}}
function discardLegacyHistory(){if(historyOwner()==='development')return;try{localStorage.removeItem(HISTORY_KEY)}catch{}}
function unit(){return 'MG'}
function setVersion(){
 document.title='JRVX CAS '+VERSION;
 qa('.v101UpdateCard,.v69Mini').forEach(card=>{if(!/Последнее обновление/i.test(card.textContent||''))return;const em=card.querySelector('em'),b=card.querySelector('b'),p=card.querySelector('p');if(em)em.textContent='Последнее обновление • '+VERSION;if(b)b.textContent='Последнее обновление, версия '+VERSION;if(p)p.textContent='Global Release: Online Multiplayer, серверная экономика, Progression, Admin, PWA, UX и production identity gate.'});
}
function cleanupPokerTimers(){
 const S=window.Poker59?.state;if(!S)return;
 for(const k of ['botTimer','nextTimer','countdownTimer','turnTimer','turnTick','turnWatch']){try{const v=S[k];if(v){clearTimeout(v);clearInterval(v)}S[k]=null}catch{}}
 if(Array.isArray(S.phaseTimers)){for(const t of S.phaseTimers){clearTimeout(t);clearInterval(t)}S.phaseTimers.length=0}
 try{window.__jvrxPokerCancelFrame?.()}catch{}
}
function installRouteObserver(){
 try{window.__JRVXV200Observer?.disconnect?.()}catch{};try{routeObserver?.disconnect?.()}catch{};routeObserver=null;window.__JRVXV210Observer=null;
}
function ensurePokerUI(){
 const app=$('poker59App'),game=$('p59Game');if(!app||!game)return false;
 const bar=game.querySelector('.p59GameBar');if(bar&&!$('p210StatsBar')){const el=document.createElement('div');el.id='p210StatsBar';el.className='p210StatsBar';el.innerHTML='<div class="p210Stat"><span>Раздачи</span><strong id="p210Hands">0</strong></div><div class="p210Stat"><span>Победы</span><strong id="p210Wins">0</strong></div><div class="p210Stat"><span>Win rate</span><strong id="p210Rate">0%</strong></div><div class="p210Stat"><span>Макс. банк</span><strong id="p210Best">0</strong></div>';bar.insertAdjacentElement('afterend',el)}
 const btns=game.querySelector('.p59GameBtns');if(btns&&!$('p210HistoryBtn')){const b=document.createElement('button');b.className='btn';b.id='p210HistoryBtn';b.textContent='История';b.onclick=()=>{$('p210Drawer')?.classList.toggle('active');renderHistory()};btns.prepend(b)}
 const betbox=game.querySelector('.p59BetBox');if(betbox&&!$('p210RaiseMeta')){const m=document.createElement('div');m.id='p210RaiseMeta';m.className='p210RaiseMeta';betbox.appendChild(m);const inp=$('p59Bet');inp?.addEventListener('input',()=>updateRaise(window.Poker59?.state?.game?.state?.()||window.Poker59?.state?.server),{passive:true})}
 if(!$('p210Drawer')){const d=document.createElement('aside');d.id='p210Drawer';d.className='p210Drawer';d.innerHTML='<div class="p210DrawerHead"><div><span>POKER HISTORY</span><strong>Последние раздачи</strong></div><button class="btn" id="p210HistoryClose">Закрыть</button></div><div class="p210DrawerList" id="p210DrawerList"></div>';game.appendChild(d);$('p210HistoryClose').onclick=()=>d.classList.remove('active')}
 renderStats();return true;
}
function resultOutcome(st){const ids=(st?.lastResult?.winners||[]).map(String),me=String(st?.you?.id??'');if(ids.length>1&&ids.includes(me))return'tie';return ids.includes(me)?'win':'loss'}
function gameKey(st){const g=window.Poker59?.state?.game;if(g){if(!g.__v210id)try{Object.defineProperty(g,'__v210id',{value:'g'+Date.now().toString(36)+Math.random().toString(36).slice(2,6)})}catch{};return g.__v210id||pageSession}return String(st?.roomId||st?.tableId||pageSession)}
function recordHand(st){
 if(!st?.lastResult||!st?.handNo||!st?.you)return;
 const auth=window.JRVXCASIdentityV300?.state?.();
 if(auth?.mode!=='development'&&auth?.requiresAuthentication===true){
  const id=historyOwner();if(!id||String(st.you.id||'')!==id)return;
 }
 const key=`${gameKey(st)}|${st.handNo}|${st.lastResult.text||''}`;if(key===lastRecorded)return;lastRecorded=key;
 const rows=history();if(rows.some(x=>x.key===key))return;
 const rec={key,ts:Date.now(),handNo:Number(st.handNo)||0,table:String(st.tableId||''),currency:unit(),pot:Math.max(0,Number(st.lastResult.pot)||0),outcome:resultOutcome(st),result:String(st.lastResult.text||''),winningHand:String(st.lastResult.winningHand||st.you.currentHandName||''),hole:Array.isArray(st.you.hole)?st.you.hole.slice(0,2):[],board:Array.isArray(st.community)?st.community.slice(0,5):[],actions:(Array.isArray(st.actionLog)?st.actionLog.slice(-24):[]).map(x=>({street:x.street||'',text:x.text||''}))};rows.unshift(rec);writeHistory(rows);renderStats();if($('p210Drawer')?.classList.contains('active'))renderHistory();
}
function renderStats(){const rows=history(),hands=rows.length,wins=rows.filter(x=>x.outcome==='win').length,best=rows.reduce((m,x)=>Math.max(m,Number(x.pot)||0),0);if($('p210Hands'))$('p210Hands').textContent=String(hands);if($('p210Wins'))$('p210Wins').textContent=String(wins);if($('p210Rate'))$('p210Rate').textContent=hands?Math.round(wins/hands*100)+'%':'0%';if($('p210Best'))$('p210Best').textContent=window.JRVXCASMoneyV330.formatCompact(best,{currency:false});const b=$('p210HistoryBtn');if(b)b.dataset.count=String(Math.min(hands,50))}
function esc(v){return String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
function renderHistory(){const list=$('p210DrawerList');if(!list)return;const rows=history();if(!rows.length){list.innerHTML='<div class="p210Empty">История появится после завершения первой раздачи.</div>';return}list.innerHTML=rows.map(x=>{const t=new Date(x.ts).toLocaleTimeString('ru-RU',{hour:'2-digit',minute:'2-digit'}),cards=[x.hole?.join(' ')||'—',x.board?.join(' ')||'—'];return `<div class="p210Hand ${esc(x.outcome)}"><div class="p210HandTop"><strong>#${x.handNo} • ${esc(x.table||'Poker')} • ${esc(x.pot)} ${esc(x.currency)}</strong><span>${t}</span></div><div class="p210HandResult">${esc(x.winningHand||x.result||'Раздача завершена')}</div><div class="p210Cards">Рука: ${esc(cards[0])} • Борд: ${esc(cards[1])}</div></div>`}).join('')}
function updateRaise(st){const meta=$('p210RaiseMeta'),inp=$('p59Bet');if(!meta||!inp||!st?.you){if(meta)meta.textContent='';return}const target=Math.max(0,Math.floor(Number(inp.value)||0)),stack=Math.max(0,Number(st.you.stack)||0),bet=Math.max(0,Number(st.you.bet)||0),remain=Math.max(0,stack+bet-target),min=Math.max(0,Number(st.minRaiseTo)||0),max=stack+bet;meta.textContent=st.you.yourTurn?`Рейз до ${target.toLocaleString('ru-RU')} ${unit()} • останется ${remain.toLocaleString('ru-RU')} • min ${min.toLocaleString('ru-RU')} / max ${max.toLocaleString('ru-RU')}`:''}
function paintResult(st){const app=$('poker59App');if(!app)return;app.classList.remove('p210-win','p210-loss','p210-tie');if(st?.street==='showdown'&&st?.lastResult){app.classList.add('p210-'+resultOutcome(st))}}
function frame(st){if(!ensurePokerUI()||!st)return;if($('poker')?.classList.contains('active'))document.body.classList.remove('v91-lobby-mode');updateRaise(st);paintResult(st);recordHand(st)}
function wrapFrame(){const cur=window.__jvrxPokerFrame;if(cur?.__v210)return;const prior=cur;const wrapped=function(st){try{prior?.(st)}catch(e){console.warn('v210 previous poker frame',e)}try{frame(st)}catch(e){console.warn('v210 poker frame',e)}};wrapped.__v210=true;wrapped.__v230=!!prior?.__v230;window.__jvrxPokerFrame=wrapped}
function bind(){if(booted)return;booted=true;setVersion();installRouteObserver();ensurePokerUI();wrapFrame();document.addEventListener('click',e=>{if(e.target.closest?.('#p59Leave,#p59Change,#poker [data-main-menu]')){try{if(window.Poker59?.state?.game||window.Poker59?.state?.server)window.Poker59.showLobby(true)}catch(err){console.warn('v210 poker cashout',err)}cleanupPokerTimers();$('p210Drawer')?.classList.remove('active')}},{capture:true,passive:true});/* v3.0.17: pagehide + online/offline are handled by one lifecycle controller. */[120,700,1600,2600].forEach(ms=>setTimeout(()=>{setVersion();ensurePokerUI();wrapFrame()},ms));}
window.JRVXCASV210={version:VERSION,history,renderHistory,cleanupPokerTimers,diagnostics:()=>({domNodes:document.getElementsByTagName('*').length,history:history().length,activeGame:['poker','blackjack','roulette'].find(id=>$(id)?.classList.contains('active'))||null})};
discardLegacyHistory();document.addEventListener('jrvx-cas-identity',()=>{lastRecorded='';discardLegacyHistory();renderStats();if($('p210Drawer')?.classList.contains('active'))renderHistory()});
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',bind,{once:true});else bind();
})();
