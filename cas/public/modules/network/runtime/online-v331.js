(()=>{
'use strict';
const VERSION='v3.0.17';
const $=id=>document.getElementById(id);
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const unit=()=> 'MG';
const amount=value=>Number.isSafeInteger(value)&&value>=0?value:0;
const money=value=>window.JRVXCASMoneyV330.formatCompact(value);
const exactMoney=value=>window.JRVXCASMoneyV330.formatExact(value);
function validMoneyState(st){if(!st||st.currency!=='MG')return false;const values=[st.pot,st.currentBet,st.minRaiseTo,st.bigBlind,st.smallBlind,...(st.seats||[]).filter(Boolean).flatMap(p=>[p.stack,p.bet,p.wonLast])].filter(v=>v!==undefined);return values.every(v=>Number.isSafeInteger(v)&&v>=0)}
let rooms=[],invite=null,lastRevision=new Map(),spectating='',refreshTimer=0,actionSeq=0,serverWallet=null,userLeft=false,leaveOperationId=null,pendingJoin=null,pendingOps=new Map(),intentOwner=currentOwner();

// Pending commands and UI fences belong to one verified account only. Ordinary
// identity refreshes for that same owner must retain uncertain request IDs.
function currentOwner(){const id=window.JRVXCASIdentityV300?.state?.();return id?.requiresAuthentication===true?(id.authenticated&&id.user?.id?String(id.user.id):''):String(id?.user?.id||'development')}
function clearJoinIntents(){for(const [key,record] of pendingOps)if(['poker_join','poker_accept_invite'].includes(record.type))pendingOps.delete(key)}
function syncIntentOwner(){
 const owner=currentOwner();if(owner===intentOwner)return false;intentOwner=owner;
 pendingOps.clear();pendingJoin=null;leaveOperationId=null;userLeft=false;lastRevision.clear();serverWallet=null;rooms=[];invite=null;spectating='';
 if(window.arcadeNetState)window.arcadeNetState.poker=null;
 const state=window.Poker59?.state;if(state){state.server=null;if(window.JRVXCASIdentityV300?.state?.().requiresAuthentication)state.game=null;state.ignoreServer=false;}
 $('poker59App')?.classList.remove('seated','can-start');$('v250Spectator')?.classList.remove('active');$('v250Spectator')?.setAttribute('aria-hidden','true');
 renderStatus();renderRooms();renderInvite();return true;
}
function belongsToOwner(st){const id=window.JRVXCASIdentityV300?.state?.();return !st?.you||id?.requiresAuthentication!==true||!!currentOwner()&&String(st.you.id||'')===currentOwner()}
function definitiveError(msg){const code=String(msg?.error||msg?.message||'');return /^(?:currency_retired|invalid_[a-z_]+|table_full|table_unavailable|private_table_forbidden|friend_not_found|invite_expired|insufficient_balance|balance_limit|economy_draining|action_id_conflict|unauthorized|cas_account_disabled|stale_state|not_seated|out_of_turn|turn_expired|cannot_check|opponent_all_in|rebuy_unavailable|hand_not_ready|poker_escrow_limit|table_escrow_limit)$/.test(code)}
function settleRequest(requestId){if(!requestId)return;for(const [key,record] of pendingOps)if(record.opId===requestId||record.actionId===requestId)pendingOps.delete(key)}
function prunePendingOps(now=Date.now()){for(const [k,v] of pendingOps)if(now-v.at>20000)pendingOps.delete(k)}
function stableIntentKey(obj){
 const st=window.arcadeNetState?.poker||{};const room=String(st.roomId||'');const rev=Number.isFinite(Number(st.revision))?Number(st.revision):-1;const hand=Number.isFinite(Number(st.handNo))?Number(st.handNo):-1;
 if(obj.type==='poker_action')return `action|${room}|${hand}|${rev}|${String(obj.action||'')}|${Number(obj.amount)||0}`;
 if(obj.type==='poker_start')return `start|${room}|${hand}|${rev}`;
 if(obj.type==='poker_rebuy')return `rebuy|${room}|${rev}|${Number(obj.amount)||0}`;
 if(obj.type==='poker_join')return `join|${String(obj.mode||'online')}|${String(obj.tableId||'')}|${String(obj.currency||unit())}|${Number(obj.buyIn)||0}|${String(obj.friendId||'')}`;
 if(obj.type==='poker_accept_invite')return `invite|${String(obj.roomId||'')}|${String(obj.currency||unit())}|${Number(obj.buyIn)||0}`;
 return '';
}
function reuseIntent(obj){
 prunePendingOps();const key=stableIntentKey(obj);if(!key)return obj;let rec=pendingOps.get(key);if(!rec){rec={type:obj.type,roomId:String(window.arcadeNetState?.poker?.roomId||''),revision:Number(window.arcadeNetState?.poker?.revision),at:Date.now(),opId:obj.opId||`op-${Date.now().toString(36)}-${(++actionSeq).toString(36)}`,actionId:obj.actionId||''};if(obj.type==='poker_action')rec.actionId=rec.actionId||`act-${Date.now().toString(36)}-${(++actionSeq).toString(36)}`;pendingOps.set(key,rec)}
 if(obj.type==='poker_action')obj.actionId=rec.actionId;else obj.opId=rec.opId;return obj;
}
function settlePendingForState(st){if(!st)return;const room=String(st.roomId||''),rev=Number(st.revision);for(const [k,v] of pendingOps){if(Date.now()-v.at>20000||!['poker_join','poker_accept_invite'].includes(v.type)&&v.roomId===room&&Number.isFinite(rev)&&rev>v.revision)pendingOps.delete(k)}}
function setVersion(){document.title='JRVX CAS '+VERSION;document.querySelectorAll('.v69Mini,.v101UpdateCard').forEach(card=>{if(!/Последнее обновление/i.test(card.textContent||''))return;const em=card.querySelector('em'),b=card.querySelector('b'),p=card.querySelector('p');if(em)em.textContent='Последнее обновление • '+VERSION;if(b)b.textContent='Последнее обновление, версия '+VERSION;if(p)p.textContent='Global Release: Online Multiplayer, серверная экономика, Progression, Admin, PWA, UX и production identity gate.'})}
function toast(title,text,icon='●',ms=2400){try{window.showArcadeToast?.(title,text,icon,ms)}catch{}}
function syncWallet(msg){
 const eco=window.JRVXCasEconomy||window.JVRXCasEconomy;
 if(window.JRVXCASIdentityV300?.state?.().requiresAuthentication){window.JRVXCASServerAccount?.apply?.(msg);serverWallet={MG:amount(eco?.balance?.('MG'))};renderStatus();return}
 const value=msg?.wallet?.MG??msg?.mg;if(!Number.isSafeInteger(value)||value<0)return;
 serverWallet={MG:value};eco?.set?.({mg:value});if(window.arcadeNetState){window.arcadeNetState.muraTokens=value;window.arcadeNetState.pokerTokens=value}
 try{if(window.playerProfile)window.playerProfile.pokerTokens=value}catch{}renderStatus();
}
function ensureUI(){const lobby=document.querySelector('#poker59App .p59LobbyCard');if(lobby&&!$('v250OnlinePanel')){const panel=document.createElement('section');panel.id='v250OnlinePanel';panel.className='v250OnlinePanel';panel.innerHTML=`<div class="v250Head"><div><span>JRVX ONLINE · SERVER AUTHORITY</span><strong id="v250NetTitle">Подключение…</strong></div><div class="v250Badges"><b id="v250Players">0 online</b><b id="v250RoomsCount">0 столов</b></div></div><div class="v250Meta" id="v250Meta">Колода, банк и действия проверяются сервером.</div><div class="v250Invite" id="v250Invite" hidden><div><span>ПРИГЛАШЕНИЕ</span><strong id="v250InviteText"></strong></div><div><button class="btn primary" id="v250InviteAccept">Принять</button><button class="btn" id="v250InviteDecline">Отклонить</button></div></div><div class="v250Rooms" id="v250Rooms"><div class="v250Empty">Активных публичных столов пока нет.</div></div><div class="v250Actions"><button class="btn" id="v250RefreshRooms">Обновить столы</button><span>Reconnect: 30 сек · ход: 15 сек</span></div>`;lobby.appendChild(panel);$('v250RefreshRooms').onclick=requestRooms;$('v250InviteAccept').onclick=acceptInvite;$('v250InviteDecline').onclick=()=>{invite=null;renderInvite()}}
 if(!$('v250Spectator')){const o=document.createElement('div');o.id='v250Spectator';o.className='v250Spectator';o.setAttribute('aria-hidden','true');o.innerHTML=`<div class="v250SpectatorCard"><div class="v250SpectatorHead"><div><span>JRVX SPECTATOR</span><strong id="v250SpectatorTitle">ONLINE TABLE</strong></div><button class="btn" id="v250SpectatorClose">Закрыть</button></div><div class="v250SpectatorMeta" id="v250SpectatorMeta"></div><div class="v250SpecBoard" id="v250SpecBoard"></div><div class="v250SpecSeats" id="v250SpecSeats"></div><div class="v250SpecLog" id="v250SpecLog"></div></div>`;document.body.appendChild(o);$('v250SpectatorClose').onclick=closeSpectator;o.addEventListener('click',e=>{if(e.target===o)closeSpectator()})}
 renderStatus();renderRooms();renderInvite()}
function renderStatus(){const live=!!window.arcadeNetState?.connected,count=Math.max(0,Number(window.arcadeNetState?.onlineCount)||0),title=$('v250NetTitle'),players=$('v250Players'),rc=$('v250RoomsCount'),meta=$('v250Meta');if(title)title.textContent=live?'SERVER LINK ONLINE':'SERVER LINK OFFLINE';if(players)players.textContent=`${count} online`;if(rc)rc.textContent=`${rooms.length} столов`;if(meta){const s=window.arcadeNetState?.poker;meta.textContent=s?.authoritative?`Серверная раздача #${s.handNo||0} · ${s.currency||unit()} · revision ${s.revision||0}`:'Колода, банк, действия и таймер хода определяются сервером.'}}
function renderRooms(){const host=$('v250Rooms');if(!host)return;if(!rooms.length){host.innerHTML='<div class="v250Empty">Активных публичных столов пока нет. Войдите первым — второй игрок подключится автоматически.</div>';return}host.innerHTML=rooms.map(r=>`<div class="v250Room"><div><strong>${esc(r.tableId)} · ${esc('MG')}</strong><span>${r.seated||0}/2 игрока · раздача #${r.handNo||0} · ${esc(r.street||'waiting')}</span></div><div><b>${r.active?'LIVE':'WAITING'}</b><button class="btn" data-v250-watch="${esc(r.roomId)}">Смотреть</button></div></div>`).join('');host.querySelectorAll('[data-v250-watch]').forEach(b=>b.onclick=()=>watchRoom(b.dataset.v250Watch))}
function renderInvite(){const box=$('v250Invite');if(!box)return;box.hidden=!invite;if(invite){$('v250InviteText').textContent=`${invite.fromNickname||'Игрок'} зовёт за стол ${invite.tableId} · ${'MG'}`}}
function requestRooms(){if(window.arcadeNetState?.connected)window.arcadeNetSend?.({type:'poker_rooms'});renderStatus()}
function acceptInvite(){
 syncIntentOwner();const invitation=invite;if(!invitation)return;if(invitation.currency!=='MG'){toast('Private Table','Прежнее приглашение закрыто после обновления экономики.');invite=null;renderInvite();return false}
 let accepted=false;try{accepted=window.arcadeNetSend?.({type:'poker_accept_invite',roomId:invitation.roomId,buyIn:Math.max(20,Number(invitation.buyIn)||20),currency:invitation.currency||unit()})===true}catch{}
 // A busy or disconnected transport has not consumed the invitation.
 if(!accepted){toast('Private Table','Не удалось принять приглашение. Повторите после подтверждения связи.','!');return false;}
 const P=window.Poker59;if(P?.state){P.state.mode='friend';P.state.tableId=invitation.tableId||P.state.tableId;P.state.ignoreServer=false}try{window.setActiveGameById?.('poker',false)}catch{}
 if(invite===invitation)invite=null;renderInvite();return true;
}
function watchRoom(id){if(!id||!window.arcadeNetState?.connected)return toast('Spectator','SERVER LINK не подключён','!');const roomId=String(id);if(window.arcadeNetSend?.({type:'poker_watch',roomId})!==true)return toast('Spectator','Не удалось открыть стол. Повторите после подтверждения связи.','!');spectating=roomId;const o=$('v250Spectator');if(o){o.classList.add('active');o.setAttribute('aria-hidden','false')}}
function closeSpectator(){const roomId=spectating;spectating='';const o=$('v250Spectator');o?.classList.remove('active');o?.setAttribute('aria-hidden','true');if(roomId)window.arcadeNetSend?.({type:'poker_unwatch',roomId})}
function card(c){if(!c||c==='??')return '<i class="back">?</i>';const r=c[0]==='T'?'10':c[0],s={S:'♠',H:'♥',D:'♦',C:'♣'}[c[1]]||c[1],red=c[1]==='H'||c[1]==='D';return `<i class="${red?'red':''}">${r}<small>${s}</small></i>`}
function renderSpectator(st){if(!validMoneyState(st)||!spectating||String(st.roomId||'')!==spectating)return;ensureUI();const o=$('v250Spectator');if(o&&!o.classList.contains('active')){o.classList.add('active');o.setAttribute('aria-hidden','false')}$('v250SpectatorTitle').textContent=`${st.tableId||'TABLE'} · ${'MG'}`;$('v250SpectatorMeta').textContent=`Банк ${money(st.pot||0)} · ${String(st.street||'waiting').toUpperCase()} · #${st.handNo||0}`;$('v250SpecBoard').innerHTML=(st.community||[]).map(card).join('')||'<span>Борд ещё не открыт</span>';$('v250SpecSeats').innerHTML=(st.seats||[]).map((p,i)=>p?`<div class="v250SpecSeat ${st.turnSeat===i?'turn':''}"><div><strong>${esc(p.nickname||'Игрок')}</strong><span>${p.connected===false?'RECONNECT':'ONLINE'}</span></div><b title="${exactMoney(p.stack||0)}">${money(p.stack||0)}</b><div class="v250SpecCards">${(p.hole||[]).map(card).join('')}</div><small>${esc(p.lastAction||'')}</small></div>`:'').join('');$('v250SpecLog').innerHTML=(st.actionLog||[]).slice(-8).reverse().map(x=>`<span>${esc(x.text||'')}</span>`).join('')}
// A rejected transport send did not begin a join; keep accepting the current table.
function installSend(){
 const old=window.arcadeNetSend;if(typeof old!=='function'||old.__v250)return;
 const wrapped=function(obj){
  syncIntentOwner();let acceptedJoin=null,leaving=false,preparedLeaveId='';
  if(obj&&typeof obj==='object'){
   obj={...obj};
   const monetary=['poker_join','poker_accept_invite','poker_action','poker_rebuy','poker_start','poker_leave'].includes(obj.type);
   if(monetary&&obj.currency!==undefined&&obj.currency!=='MG'){toast('JRVX CAS','Валюта прежнего запроса выведена из обращения.');return false}
   if(monetary){obj.currency='MG';const value=['poker_join','poker_accept_invite'].includes(obj.type)?obj.buyIn:obj.type==='poker_rebuy'||obj.type==='poker_action'&&['bet','raise'].includes(obj.action)?obj.amount:undefined;if(value!==undefined&&(!Number.isSafeInteger(value)||value<1||value>1_000_000_000)){toast('JRVX CAS','Укажите целую сумму MG в пределах стола.');return false}}

   if(obj.type==='poker_leave'){leaving=true;preparedLeaveId=leaveOperationId||obj.opId||`leave-${Date.now().toString(36)}-${(++actionSeq).toString(36)}`;obj.opId=preparedLeaveId;}
   if(['poker_join','poker_accept_invite'].includes(obj.type)){obj.currency=obj.currency||unit();obj.clientVersion=VERSION;obj=reuseIntent(obj);acceptedJoin={opId:obj.opId,fromRoom:String(window.arcadeNetState?.poker?.roomId||'')};}
   if(obj.type==='hello'){obj.protocolVersion=VERSION;obj.capabilities=['server-authority','reconnect','private-tables','spectator','transaction-ledger','admin-v270','request-correlation','idempotent-client-intents'];}
   if(['poker_rebuy','poker_start'].includes(obj.type)){obj.currency=obj.currency||unit();obj.clientVersion=VERSION;obj=reuseIntent(obj)}
   if(obj.type==='poker_action'){obj.handNo=window.arcadeNetState?.poker?.handNo;obj.revision=window.arcadeNetState?.poker?.revision;obj=reuseIntent(obj)}
   if(obj.type==='poker_start'){obj.handNo=window.arcadeNetState?.poker?.handNo;obj.revision=window.arcadeNetState?.poker?.revision;}
   if(leaving){obj.currency=obj.currency||unit();obj.clientVersion=VERSION;}
  }
  const sent=old.call(this,obj);
  if(sent===true){
   if(leaving){userLeft=true;pendingJoin=null;leaveOperationId=preparedLeaveId;clearJoinIntents();if(window.arcadeNetState)window.arcadeNetState.poker=null;}
   if(acceptedJoin){userLeft=false;leaveOperationId=null;pendingJoin={...acceptedJoin,at:Date.now()};}
  }
  return sent;
 };
 wrapped.__v250=true;wrapped.__base=old;window.arcadeNetSend=wrapped;
}
// A terminal join error ends its correlation fence, allowing authoritative resume.
function installHandler(){const prev=window.handleArcadeNetMessage;if(typeof prev!=='function'||prev.__v250)return;const wrapped=function(msg){syncIntentOwner();if(msg?.type==='poker_state'&&msg.state&&!validMoneyState(msg.state)){toast('JRVX CAS','Требуется синхронизация стола с обновлённой экономикой.');return false}if(msg?.type==='poker_state'&&!belongsToOwner(msg.state))return false;if(msg?.type==='poker_error'&&definitiveError(msg)){settleRequest(msg.requestId);if(pendingJoin&&(!msg.requestId||msg.requestId===pendingJoin.opId)){settleRequest(pendingJoin.opId);pendingJoin=null;}}if(msg?.type==='poker_state'&&pendingJoin){if(msg.requestId===pendingJoin.opId){settleRequest(msg.requestId);pendingJoin=null}else if(Date.now()-pendingJoin.at<12000){return}else pendingJoin=null;}if(window.JRVXCASIdentityV300?.state?.().requiresAuthentication&&['hello_ack','account_wallet','progress_state'].includes(msg?.type)){window.JRVXCASServerAccount?.apply?.(msg);const e=window.JRVXCasEconomy||window.JVRXCasEconomy;msg={...msg,progress:undefined,wallet:{MG:amount(e?.balance?.('MG'))},muraTokens:e?.balance?.(unit())||0,pokerTokens:e?.balance?.(unit())||0};}if(msg?.type==='poker_state'&&!msg.state&&msg.roomId&&window.arcadeNetState?.poker?.roomId&&window.arcadeNetState.poker.roomId!==msg.roomId)return;if(msg?.type==='poker_state'&&msg.state?.you&&userLeft)return;if(msg?.type==='poker_state')settleRequest(msg.requestId);if(msg?.type==='poker_state'&&msg.state?.roomId&&Number.isFinite(Number(msg.state.revision))){const last=lastRevision.get(msg.state.roomId);const rev=Number(msg.state.revision);if(Number.isFinite(last)&&rev<last)return;lastRevision.set(msg.state.roomId,rev);settlePendingForState(msg.state)}if(msg?.type==='poker_state'&&msg.state?.authoritative&&msg.state?.you&&window.Poker59?.state){Object.assign(window.Poker59.state,{ignoreServer:false,game:null,server:msg.state,mode:msg.state.mode,tableId:msg.state.tableId});if(!document.getElementById('poker')?.classList.contains('active'))window.setActiveGameById?.('poker',false);}if(msg?.type==='poker_state'&&msg.state?.currency){const c='MG';try{(window.JRVXCasEconomy||window.JVRXCasEconomy)?.setCurrency?.(c)}catch{}if(serverWallet&&window.arcadeNetState){window.arcadeNetState.muraTokens=serverWallet[c];window.arcadeNetState.pokerTokens=serverWallet[c]}}const out=prev.call(this,msg);if(msg?.type==='poker_state'&&!msg.state&&userLeft){if(window.arcadeNetState)window.arcadeNetState.poker=null;if(window.Poker59?.state)window.Poker59.state.server=null;}if(msg?.type==='hello_ack'||msg?.type==='account_wallet')syncWallet(msg);if(msg?.type==='hello_ack'&&Array.isArray(msg.rooms)){rooms=msg.rooms.filter(r=>r?.currency==='MG');renderRooms()}if(msg?.type==='presence'){if(Array.isArray(msg.rooms))rooms=msg.rooms.filter(r=>r?.currency==='MG');renderStatus();renderRooms()}if(msg?.type==='poker_rooms'){rooms=Array.isArray(msg.rooms)?msg.rooms.filter(r=>r?.currency==='MG'):[];renderStatus();renderRooms()}if(msg?.type==='poker_invite'&&msg.currency==='MG'){invite=msg;renderInvite();toast('Private Table',`${msg.fromNickname||'Игрок'} приглашает Вас за стол`,'♠',4000)}if(msg?.type==='spectator_state')renderSpectator(msg.state);if(msg?.type==='session_replaced')toast('JRVX Online','Сессия перенесена в другое окно.','!',5000);if(msg?.type==='poker_state'&&msg.state){const st=msg.state,owner=intentOwner;requestAnimationFrame(()=>{if(currentOwner()!==owner||!belongsToOwner(st)||window.arcadeNetState?.poker!==st)return;const app=$('poker59App');if(app&&st.canStart)app.classList.add('can-start');renderStatus();const disconnected=(st.seats||[]).find(p=>p&&p.connected===false);const status=$('p59StatusSub');if(disconnected&&status)status.textContent=`${disconnected.nickname||'Игрок'} переподключается · место удерживается 30 сек`;else if(status&&st.authoritative)status.textContent='SERVER AUTHORITY · карты и банк подтверждаются backend';})}return out};wrapped.__v250=true;wrapped.__base=prev;window.handleArcadeNetMessage=wrapped}
function bind(){document.addEventListener('jrvx-cas-identity',syncIntentOwner);syncIntentOwner();setVersion();ensureUI();installSend();installHandler();clearInterval(refreshTimer);refreshTimer=setInterval(()=>{setVersion();ensureUI();renderStatus();const p=$('poker59App');if(window.arcadeNetState?.connected&&p&&p.offsetParent!==null)requestRooms()},5000);document.addEventListener('click',e=>{if(e.target.closest?.('[data-p59-mode="online"],[data-p59-mode="friend"],#p59Join'))setTimeout(()=>{ensureUI();requestRooms()},50);if(e.target.closest?.('[data-v122-cur],[data-currency]')&&serverWallet)setTimeout(()=>{const c=unit();if(window.arcadeNetState){window.arcadeNetState.muraTokens=serverWallet[c];window.arcadeNetState.pokerTokens=serverWallet[c]}},0)},{passive:true});[200,900,2200,5200].forEach(ms=>setTimeout(()=>{setVersion();ensureUI();installSend();installHandler()},ms))}
window.JRVXCASV250={version:VERSION,requestRooms,watchRoom,closeSpectator,leaveIntent:()=>{syncIntentOwner();userLeft=true;pendingJoin=null;clearJoinIntents();if(window.arcadeNetState)window.arcadeNetState.poker=null},rooms:()=>rooms.slice(),diagnostics:()=>({pendingJoin:pendingJoin?{...pendingJoin}:null,pendingOps:[...pendingOps.entries()].map(([key,v])=>({key,...v})),lastRevision:[...lastRevision.entries()]})};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',bind,{once:true});else bind();
})();
