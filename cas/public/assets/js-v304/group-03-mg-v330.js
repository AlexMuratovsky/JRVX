/* source: modules/poker/legacy-runtime/37-v110-global-poker-runtime.js */
(function(){
'use strict';
const q=(s,r=document)=>r?.querySelector?.(s)||null, qa=(s,r=document)=>r?[...r.querySelectorAll(s)]:[];
function state(){const P=window.Poker59?.state;if(!P)return null;try{return P.game?.state?.()||P.server||null}catch(e){return P.server||null}}
function unit(){return 'MG'}
function wallet(){try{const e=window.JRVXCasEconomy||window.JVRXCasEconomy;return Math.max(0,Math.floor(Number(e?e.balance?.(e.get?.().currency):muraTokenBalance())||0))}catch(e){return 0}}
function profile(){return window.playerProfile||{}}
function build(){
 const app=q('#poker59App');if(!app||app.dataset.v110==='1')return false;
 const game=q('#p59Game',app),bar=q('.p59GameBar',game),info=q('.p59GameInfo',bar),btns=q('.p59GameBtns',bar),table=q('#p59Table',game),actions=q('.p59ActionPanel',game);if(!game||!bar||!table||!actions)return false;
 app.dataset.v110='1';
 // HUD brand
 const brand=document.createElement('div');brand.className='v110Brand';brand.innerHTML='<div class="v110Orb"></div><div class="v110BrandText"><strong>JRVX CAS</strong><small>POKER • BLACKJACK • ROULETTE</small></div>';bar.insertBefore(brand,info);
 // Blinds badge
 const blind=document.createElement('span');blind.className='v110BlindBadge';blind.innerHTML='Блайнды <strong id="v110Blinds">—</strong>';if(info.children[1])info.insertBefore(blind,info.children[1]);else info.appendChild(blind);
 // wallet/profile
 const leave=q('#p59Leave',btns);if(leave)leave.textContent='⌂  В лобби';
 const w=document.createElement('div');w.className='v110Wallet';w.innerHTML='<div class="v110Coin">◉</div><div><span>Баланс:</span><strong id="v110WalletText">0 MG</strong></div>';btns.appendChild(w);
 const p=document.createElement('button');p.type='button';p.className='v110Profile';p.innerHTML='<div class="v110ProfileAvatar" id="v110Avatar">N</div><div><span>Игровой профиль</span><strong id="v110ProfileName">Игрок</strong></div><b class="v110ProfileCheck">✓</b>';p.addEventListener('click',()=>{try{window.openGameProfile?.()}catch(e){try{document.getElementById('v109TopProfileBtn')?.click()}catch{}}});btns.appendChild(p);
 // table extras
 const label=document.createElement('div');label.className='v110HoldemLabel';label.textContent='TEXAS HOLD’EM';table.appendChild(label);
 const deck=document.createElement('div');deck.className='v110Deck';deck.innerHTML='<div class="v110DeckStack"><i></i><i></i><i></i></div><span>Колода</span>';table.appendChild(deck);
 const dealer=q('.p59Dealer',table);if(dealer){const span=q('span',dealer);if(span)span.textContent='Дилер'}
 // action panel controls
 const bet=q('#p59Bet',actions),box=q('.p59BetBox',actions),quick=q('.p59Quick',actions);
 if(box&&bet){
   const minus=document.createElement('button');minus.type='button';minus.className='v110StepMinus';minus.textContent='−';
   const plus=document.createElement('button');plus.type='button';plus.className='v110StepPlus';plus.textContent='+';
   box.append(minus,plus);
   const step=d=>{const min=Math.max(0,Number(bet.min)||0),max=Math.max(min,Number(bet.max)||999999),bb=Math.max(1,Number(state()?.bigBlind)||1),next=Math.max(min,Math.min(max,(Number(bet.value)||min)+d*bb));bet.value=Math.floor(next);bet.dispatchEvent(new Event('input',{bubbles:true}))};
   minus.addEventListener('click',()=>step(-1));plus.addEventListener('click',()=>step(1));
 }
 const track=document.createElement('div');track.className='v110BetTrack';track.innerHTML='<i></i><b></b>';if(quick)actions.querySelector('.p59Actions')?.insertBefore(track,quick);
 if(track&&bet){const setFromPointer=e=>{const r=track.getBoundingClientRect(),min=Number(bet.min)||0,max=Math.max(min,Number(bet.max)||min+1),x=Math.max(0,Math.min(r.width,e.clientX-r.left)),pct=r.width?x/r.width:0;bet.value=Math.round(min+(max-min)*pct);bet.dispatchEvent(new Event('input',{bubbles:true}));};track.addEventListener('pointerdown',e=>{if(bet.disabled)return;track.setPointerCapture?.(e.pointerId);setFromPointer(e);const move=ev=>setFromPointer(ev),up=ev=>{setFromPointer(ev);track.removeEventListener('pointermove',move);track.removeEventListener('pointerup',up);track.removeEventListener('pointercancel',up)};track.addEventListener('pointermove',move);track.addEventListener('pointerup',up);track.addEventListener('pointercancel',up)});}
 if(quick){
   quick.innerHTML='<button class="btn" data-v110-frac="min">MIN</button><button class="btn" data-v110-frac="0.5">½ БАНК</button><button class="btn" data-v110-frac="0.75">¾ БАНК</button><button class="btn" data-v110-frac="1">БАНК</button><button class="btn" data-v110-frac="2">2× БАНК</button><button class="btn" data-v110-frac="allin">ALL-IN</button>';
   quick.addEventListener('click',e=>{const b=e.target.closest('[data-v110-frac]');if(!b||!bet)return;const st=state(),me=st?.you;if(!me)return;const cur=Math.max(0,Number(st.currentBet)||0),pot=Math.max(0,Number(st.pot)||0),bb=Math.max(1,Number(st.bigBlind)||1),max=Math.max(0,Number(me.stack||0)+Number(me.bet||0)),min=Math.min(max,Math.max(Number(st.minRaiseTo)||0,cur+bb,bb*2));let val=max;if(b.dataset.v110Frac==='min')val=min;else if(b.dataset.v110Frac!=='allin')val=Math.max(min,cur+Math.max(bb,Math.ceil(pot*Number(b.dataset.v110Frac))));bet.value=Math.max(0,Math.min(max,Math.floor(val)));bet.dispatchEvent(new Event('input',{bubbles:true}));});
 }
 // bottom dock
 const dock=document.createElement('div');dock.className='v110BottomDock';actions.before(dock);dock.appendChild(actions);
 const side=document.createElement('aside');side.className='v110Side';side.innerHTML='<div class="v110Tabs"><button class="active" data-v110-tab="history">История</button><button data-v110-tab="chat">Чат</button><button data-v110-tab="players">Игроки</button><button data-v110-tab="info">Инфо</button></div><div class="v110Panel" id="v110Panel"></div>';dock.appendChild(side);
 side.addEventListener('click',e=>{const b=e.target.closest('[data-v110-tab]');if(!b)return;qa('[data-v110-tab]',side).forEach(x=>x.classList.toggle('active',x===b));side.dataset.tab=b.dataset.v110Tab;syncPanel()});side.dataset.tab='history';
 return true;
}
function syncPanel(){
 const side=q('.v110Side'),panel=q('#v110Panel');if(!side||!panel)return;
 const st=state(),tab=side.dataset.tab||'history';let html='';
 const clean=v=>String(v??'').replace(/[<>]/g,'');
 const action=v=>clean(v).replace(/\bcheck\b/ig,'Чек').replace(/\bcall\b/ig,'Колл').replace(/\bfold\b/ig,'Фолд').replace(/\braise\b/ig,'Рейз').replace(/^FLOP$/i,'Открыт флоп').replace(/^TURN$/i,'Открыт тёрн').replace(/^RIVER$/i,'Открыт ривер').replace(/^SHOWDOWN$/i,'Шоудаун');
 const street=v=>({PREFLOP:'ПРЕФЛОП',FLOP:'ФЛОП',TURN:'ТЁРН',RIVER:'РИВЕР',SHOWDOWN:'ШОУДАУН',WAITING:'ОЖИДАНИЕ'}[String(v||'').toUpperCase()]||String(v||'').toUpperCase());
 if(tab==='history'){
   let log=Array.isArray(st?.actionLog)?st.actionLog.slice(-10):[];
   if(!log.length)log=(st?.seats||[]).filter(Boolean).map(p=>({text:`${p.nickname||'Игрок'} — ${p.lastAction||'ожидает'}`,street:st?.street||''})).filter(x=>!/ожидает$/.test(x.text));
   if(log.length){const seen=[];for(const x of log.slice(-12)){const key=`${String(x.text||'')}|${String(x.street||'')}`;if(seen.length&&seen[seen.length-1].key===key)continue;seen.push({key,x})}html=seen.slice(-7).reverse().map(({x})=>{const a=action(x.text||'Действие'),isStreet=/^Открыт (флоп|тёрн|ривер)$|^Шоудаун$/i.test(a);return `<div class="v110HistoryRow${isStreet?' street':''}"><span>${a}</span><span>${isStreet?'':street(x.street||st?.street||'')}</span></div>`}).join('')}else html=`<div class="v110Empty">Раздача #${st?.handNo||0} • история появится после первого действия.</div>`;
 } else if(tab==='players'){
   const seats=(st?.seats||[]).filter(Boolean);html=seats.length?seats.map(p=>`<div class="v110PlayerRow"><span>${clean(p.nickname||'Игрок')}${String(p.id)===String(st?.you?.id)?' • Вы':''}</span><span>${window.JRVXCASMoneyV330.formatCompact(Number(p.stack)||0,{currency:false})} ${unit()}</span></div>`).join(''):'<div class="v110Empty">Игроки ещё не сели за стол.</div>';
 } else if(tab==='chat') html='<div class="v110ChatNote"><strong>Чат комнаты</strong><br>Серверный протокол текущей сборки пока не передаёт сообщения чата. Интерфейс сохранён без имитации сообщений.</div>';
 else {const me=st?.you;html=`<div class="v110InfoGrid"><div><span>Режим</span><strong>${st?.mode==='jarvis'?'JRVX Heads-Up':'Online'}</strong></div><div><span>Стол</span><strong>${st?.smallBlind||0}/${st?.bigBlind||0} ${unit()}</strong></div><div><span>Раздача</span><strong>#${st?.handNo||0}</strong></div><div><span>Банк</span><strong>${Math.floor(Number(st?.pot)||0)} ${unit()}</strong></div><div><span>Улица</span><strong>${street(st?.street||'waiting')}</strong></div><div><span>Ваш стек</span><strong>${Math.floor(Number(me?.stack)||0)} ${unit()}</strong></div></div>`;}
 const signature=tab+'|'+html;if(syncPanel._signature===signature)return;syncPanel._signature=signature;panel.innerHTML=html;
}
function sync(){if(!build()){}const app=q('#poker59App');if(!app)return;const seated=app.classList.contains('seated')&&q('#p59Game')?.offsetParent!==null;document.body.classList.toggle('v110-poker-seated',seated);if(!seated)return;
 const st=state(),prof=profile(),u=unit();
 const blind=q('#v110Blinds');if(blind)blind.textContent=st?`${st.smallBlind||0}/${st.bigBlind||0}`:'—';
 const wt=q('#v110WalletText');if(wt)wt.textContent=`${window.JRVXCASMoneyV330.formatCompact(wallet(),{currency:false})} ${u}`;
 const name=prof.nickname||st?.you?.nickname||'Игрок',pn=q('#v110ProfileName'),av=q('#v110Avatar');if(pn)pn.textContent=name;if(av)av.textContent=(name[0]||'N').toUpperCase();
 const dealer=q('.p59Dealer');if(dealer)dealer.setAttribute('aria-label','Dealer button');
 const hero=q('.p59Seat.me'),turnText=(q('#p61TurnText')?.textContent||'').match(/\d+/)?.[0]||'';if(hero){if(st?.you?.yourTurn){hero.dataset.turnTime=turnText||'15'}else delete hero.dataset.turnTime;}
 const bet=q('#p59Bet'),fill=q('.v110BetTrack i'),knob=q('.v110BetTrack b');if(bet&&fill&&knob){const min=Number(bet.min)||0,max=Math.max(min+1,Number(bet.max)||1),v=Math.max(min,Math.min(max,Number(bet.value)||min)),pct=(v-min)/(max-min)*100;fill.style.width=`${pct}%`;knob.style.left=`${pct}%`;}
 syncPanel();
}
window.__jrvxV110Sync=sync;function boot(){build();sync();let tries=0;const appWait=()=>{if(build()){sync();return}if(++tries<25)setTimeout(appWait,400)};setTimeout(appWait,400);}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
;
/* source: modules/poker/legacy-runtime/38-v112-final-poker-runtime.js */
(function(){
'use strict';
const q=(s,r=document)=>r?.querySelector?.(s)||null,qa=(s,r=document)=>r?[...r.querySelectorAll(s)]:[];
let prevHand=-1,prevStreet='',prevBoard=0,toastTimer=0,lastConnection='';
function state(){const P=window.Poker59?.state;if(!P)return null;try{return P.game?.state?.()||P.server||null}catch(e){return P.server||null}}
function visualOrder(st){const seats=st?.seats||[],me=st?.you;if(!seats.length)return[];if(me?.seat==null)return seats.map((_,i)=>i);const start=Number(me.seat)||0;return seats.map((_,i)=>(start+i)%seats.length)}
function posFor(i,total){return total===2?(i===0?0:3):i}
function seatForOriginal(st,orig){const order=visualOrder(st),i=order.indexOf(orig);if(i<0)return null;return q(`.p59Seat[data-pos="${posFor(i,order.length)}"]`,q('#p59Seats'))}
function ensureExtras(){const table=q('#p59Table');if(!table)return false;if(!q('.v112StatusToast',table)){const t=document.createElement('div');t.className='v112StatusToast';table.appendChild(t)}if(!q('.v112NetBadge',table)){const n=document.createElement('div');n.className='v112NetBadge';n.innerHTML='<i></i><span>LOCAL</span>';table.appendChild(n)}if(!q('.v112Reconnect',table)){const b=document.createElement('button');b.type='button';b.className='v112Reconnect';b.textContent='Переподключиться';b.onclick=()=>{try{window.arcadeNetConnect?.(true)}catch(e){};try{q('#pokerReconnect')?.click()}catch(e){}};table.appendChild(b)}if(!q('.v112StreetChip',table)){const s=document.createElement('div');s.className='v112StreetChip';s.textContent='Ожидание';table.appendChild(s)}return true}
function toast(text,type=''){const el=q('.v112StatusToast');if(!el)return;clearTimeout(toastTimer);el.textContent=text;el.className=`v112StatusToast show ${type}`;toastTimer=setTimeout(()=>el.className='v112StatusToast',1350)}
function roles(st){
 const rows=[['dealerSeat','D','d'],['smallBlindSeat','SB','sb'],['bigBlindSeat','BB','bb']];
 const signature=rows.map(([key])=>`${key}:${st?.[key]??''}`).join('|')+'|'+visualOrder(st).join(',');
 if(roles._signature===signature)return;roles._signature=signature;
 qa('.v112RoleBadge').forEach(x=>x.remove());if(!st)return;
 for(const [key,label,cls] of rows){const orig=Number(st[key]);if(!Number.isInteger(orig)||orig<0)continue;const seat=seatForOriginal(st,orig);if(!seat)continue;const b=document.createElement('span');b.className=`v112RoleBadge ${cls}`;b.textContent=label;seat.appendChild(b)}
}
function winners(st){
 const ids=(st?.lastResult?.winners||[]).map(String),signature=(st?.handNo||0)+'|'+ids.join(',');if(winners._signature===signature)return;winners._signature=signature;
 qa('#p59Seats .p59Seat').forEach(x=>x.classList.remove('v112Winner'));if(!ids.length)return;
 const order=visualOrder(st);order.forEach((orig,i)=>{const p=st.seats?.[orig];if(!p||!ids.includes(String(p.id)))return;const seat=q(`.p59Seat[data-pos="${posFor(i,order.length)}"]`,q('#p59Seats'));seat?.classList.add('v112Winner')})
}
function connection(st){
 const badge=q('.v112NetBadge'),re=q('.v112Reconnect');if(!badge)return;
 const mode=st?.mode||window.Poker59?.state?.mode||'jarvis',online=!!(st?.authoritative||window.JRVXCASIdentityV300?.state?.().requiresAuthentication||mode!=='jarvis'),connected=!!window.arcadeNetState?.connected,key=`${online}:${connected}`;
 if(connection._key===key)return;connection._key=key;
 badge.classList.toggle('local',!online);badge.classList.toggle('offline',online&&!connected);badge.querySelector('span').textContent=!online?'LOCAL':connected?'ONLINE':'CONNECTION LOST';re?.classList.toggle('show',online&&!connected);document.body.classList.toggle('v112OfflinePoker',online&&!connected);
 if(lastConnection&&key!==lastConnection){if(online&&connected)toast('Соединение восстановлено','deal');else if(online&&!connected)toast('Связь с сервером потеряна','showdown')}lastConnection=key
}
function transitions(st){if(!st)return;const hand=Number(st.handNo)||0,street=String(st.street||'waiting'),board=(st.community||[]).length,table=q('#p59Table'),deck=q('.v110Deck');if(hand&&hand!==prevHand){table?.classList.remove('v112Showdown');table?.classList.add('v112NewHand');deck?.classList.add('v112DealPulse');toast(`Раздача #${hand}`,'deal');setTimeout(()=>{table?.classList.remove('v112NewHand');deck?.classList.remove('v112DealPulse')},650);prevBoard=0}
 if(street!==prevStreet){const labels={preflop:'Префлоп',flop:'Флоп',turn:'Тёрн',river:'Ривер',showdown:'Шоудаун',waiting:'Ожидание'};if(prevStreet&&street!=='waiting'&&street!=='preflop')toast(labels[street]||street,street==='showdown'?'showdown':'deal');if(street==='showdown')table?.classList.add('v112Showdown');else table?.classList.remove('v112Showdown');prevStreet=street}
 if(board>prevBoard&&prevBoard>=0){deck?.classList.add('v112DealPulse');setTimeout(()=>deck?.classList.remove('v112DealPulse'),500)}prevBoard=board;prevHand=hand;
 const chip=q('.v112StreetChip');if(chip)chip.textContent=({waiting:'Ожидание',preflop:'Префлоп',flop:'Флоп',turn:'Тёрн',river:'Ривер',showdown:'Шоудаун'}[street]||street)}
function sync(){if(!ensureExtras())return;const st=state();if(!st)return;roles(st);winners(st);connection(st);transitions(st)}
window.__jrvxV112Sync=sync;function boot(){sync();document.addEventListener('click',e=>{if(e.target.closest?.('#poker59App'))requestAnimationFrame(sync)},{passive:true});document.addEventListener('visibilitychange',()=>{if(!document.hidden)sync()});}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
;
/* source: modules/core/legacy-runtime/39-v114-stability-runtime.js */
(function(){
'use strict';
const q=(s,r=document)=>r?.querySelector?.(s)||null;
let lastConnected=!!window.arcadeNetState?.connected,lastPokerSignature='',lastRecovery=0;
function pokerState(){const p=window.Poker59;return p?.state?.server||p?.state?.game?.state?.()||window.arcadeNetState?.poker||null}
function sig(st){if(!st)return'';const me=st.you||{};return [st.mode,st.tableId,st.handNo,st.street,st.turnSeat,st.pot,(st.community||[]).join(','),(me.hole||[]).join(','),me.stack,me.bet,me.toCall,me.yourTurn?1:0].join('|')}
function recoverOnline(){
 const p=window.Poker59,connected=!!window.arcadeNetState?.connected,cached=window.arcadeNetState?.poker;
 if(lastConnected===false&&connected&&p&&cached?.you&&!p.state.game){
   const now=performance.now();if(now-lastRecovery>900){lastRecovery=now;p.state.ignoreServer=false;p.state.server=cached;try{p.render(cached)}catch(e){}}
 }
 lastConnected=connected;
}
function heal(){
 recoverOnline();
 const st=pokerState(),app=q('#poker59App');if(!app||!st)return;
 const s=sig(st);if(s!==lastPokerSignature){lastPokerSignature=s;window.__jrvxSyncTurnBanner?.();}
 const pending=app.classList.contains('v113-action-pending');app.classList.toggle('v114-network-pending',pending&&st.mode!=='jarvis');
}
function boot(){
 document.addEventListener('visibilitychange',()=>{if(!document.hidden)heal()},{passive:true});
 addEventListener('online',heal,{passive:true});addEventListener('offline',heal,{passive:true});
 document.addEventListener('click',e=>{if(e.target.closest?.('#poker59App,[data-main-menu],#v69Root'))requestAnimationFrame(heal)},{passive:true});
 window.__jrvxV114Heal=heal;heal();
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
;
