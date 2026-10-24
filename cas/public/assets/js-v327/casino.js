/* source: modules/casino/runtime/shared.js */
(()=>{
'use strict';
const VERSION='v3.0.17',BJ_HISTORY_KEY='jrvxCasBlackjackHistoryV220',ROULETTE_LAST_KEY='jrvxCasRouletteLastBetV220';
const $=id=>document.getElementById(id),qa=(s,r=document)=>Array.from(r?.querySelectorAll?.(s)||[]);
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function unit(){try{return window.JRVXCasEconomy?.get?.().currency==='MG'?'MG':'MS'}catch{return'MS'}}
function haptic(ms=18){try{navigator.vibrate?.(ms)}catch{}}
// Safari before 15.4 exposes getRandomValues but has no crypto.randomUUID.
// Operation IDs must remain unpredictable and preserve the server UUID contract.
function newOperationId(){
 const source=window.crypto;
 if(typeof source?.randomUUID==='function')return source.randomUUID();
 if(typeof source?.getRandomValues!=='function')throw Error('secure_random_unavailable');
 const bytes=source.getRandomValues(new Uint8Array(16));
 bytes[6]=(bytes[6]&15)|64;bytes[8]=(bytes[8]&63)|128;
 const hex=Array.from(bytes,n=>n.toString(16).padStart(2,'0'));
 return hex.slice(0,4).join('')+'-'+hex.slice(4,6).join('')+'-'+hex.slice(6,8).join('')+'-'+hex.slice(8,10).join('')+'-'+hex.slice(10).join('');
}
function setVersion(){document.title='JRVX CAS '+VERSION;document.querySelectorAll('.v101UpdateCard,.v69Mini').forEach(card=>{if(!/Последнее обновление/i.test(card.textContent||''))return;const em=card.querySelector('em'),b=card.querySelector('b'),p=card.querySelector('p');if(em)em.textContent='Последнее обновление • '+VERSION;if(b)b.textContent='Последнее обновление, версия '+VERSION;if(p)p.textContent='Global Release: Online Multiplayer, серверная экономика, Progression, Admin, PWA, UX и production identity gate.'})}

// Keep an action ID durable before a request can change a server game.
function readPending(key){try{const value=sessionStorage.getItem(key);return value===null?null:JSON.parse(value)}catch{throw Error('pending_storage_unavailable')}}
function writePending(key,intent){try{const value=JSON.stringify(intent);sessionStorage.setItem(key,value);if(sessionStorage.getItem(key)!==value)throw Error('pending_write_failed')}catch{throw Error('pending_storage_unavailable')}}
function clearPending(key){try{sessionStorage.removeItem(key);return true}catch{return false}}
async function requestJSON(url,options={},timeout=12000){
 const controller=new AbortController();let timer;
 const deadline=new Promise((_,reject)=>{timer=setTimeout(()=>{controller.abort();reject(Error('request_timeout'))},timeout)});
 const operation=(async()=>{const response=await fetch(url,{credentials:'same-origin',cache:'no-store',...options,signal:controller.signal});const data=await response.json();return {response,data}})();
 try{return await Promise.race([operation,deadline])}finally{clearTimeout(timer)}
}

window.JRVXCASV220Shared={VERSION,BJ_HISTORY_KEY,ROULETTE_LAST_KEY,$,qa,esc,unit,haptic,setVersion,newOperationId,readPending,writePending,clearPending,requestJSON};
window.JRVXCASV220=window.JRVXCASV220||{version:VERSION,blackjack:{},roulette:{}};
})();
;
/* source: modules/blackjack/runtime/blackjack.js */
(()=>{
'use strict';
const S=window.JRVXCASV220Shared;if(!S)throw new Error('JRVX CAS shared casino runtime missing');
const {VERSION,BJ_HISTORY_KEY,$,qa,esc,unit,haptic,setVersion,newOperationId,readPending,writePending,clearPending,requestJSON}=S;
/* ---------------- BLACKJACK 3.0.2 MODULE ---------------- */
const B={shoe:[],hands:[],dealer:[],active:false,hand:0,hideDealer:true,insuranceOffered:false,insuranceResolved:false,insuranceBet:0,baseBet:50,roundId:0};
const SUITS=['♠','♥','♦','♣'],RANKS=['A','2','3','4','5','6','7','8','9','10','J','Q','K'];
function bj22Value(cards){let n=0,a=0;for(const c of cards){if(c.r==='A'){n+=11;a++}else if(['J','Q','K'].includes(c.r))n+=10;else n+=+c.r}while(n>21&&a){n-=10;a--}return n}
function bj22Shoe(){B.shoe=[];for(let d=0;d<6;d++)for(const s of SUITS)for(const r of RANKS)B.shoe.push({s,r});for(let i=B.shoe.length-1;i;i--){const j=Math.floor(Math.random()*(i+1));[B.shoe[i],B.shoe[j]]=[B.shoe[j],B.shoe[i]]}}
function bj22Draw(){if(B.shoe.length<52)bj22Shoe();return B.shoe.pop()}
function bj22Bet(){const n=Math.floor(Number($('bjBetInput')?.value||0));return Number.isFinite(n)&&n>0?n:0}
function bj22Card(c,back=false){try{return bjCardHTML(c,back)}catch{if(back)return'<div class="playingCard back"></div>';const red=c.s==='♥'||c.s==='♦';return `<div class="playingCard ${red?'red':''}">${esc(c.r)}<small>${esc(c.s)}</small><span class="cardCenter">${esc(c.s)}</span></div>`}}
function bj22HistoryKey(){return bj22Production()?`${BJ_HISTORY_KEY}:${window.JRVXCASIdentityV300?.state?.().user?.id||'anonymous'}`:BJ_HISTORY_KEY}
function bj22History(){try{const x=JSON.parse(localStorage.getItem(bj22HistoryKey())||'[]');return Array.isArray(x)?x.filter(row=>row&&typeof row==='object'&&!Array.isArray(row)&&Array.isArray(row.results)).map(row=>({...row,results:row.results.filter(result=>result&&typeof result==='object'&&!Array.isArray(result))})):[]}catch{return[]}}
function bj22Write(x){try{localStorage.setItem(bj22HistoryKey(),JSON.stringify(x.slice(0,30)))}catch{}}
function bj22AddHistory(results,roundId=B.roundId,dealer=B.dealer,currency=unit()){const rows=bj22History();if(rows.some(row=>row.roundId===roundId))return;rows.unshift({ts:Date.now(),roundId,unit:currency,dealer:dealer.map(c=>c.r+c.s),results:results.map(x=>({cards:x.cards.map(c=>c.r+c.s),value:bj22Value(x.cards),bet:x.bet,outcome:x.outcome,profit:x.profit}))});bj22Write(rows);bj22RenderSession()}
function bj22RenderSession(){const rows=bj22History(),host=$('blackjackSessionHistory'),stat=$('blackjackSessionStats');let w=0,l=0,p=0;for(const r of rows)for(const x of r.results||[]){if(x.outcome==='win')w++;else if(x.outcome==='loss')l++;else p++}if(stat)stat.textContent=`${w}W / ${l}L / ${p}P`;if(host){const last=rows.slice(0,7).flatMap(r=>(r.results||[]).map(x=>`<span class="${esc(x.outcome)}">${x.outcome==='win'?'W':x.outcome==='loss'?'L':'P'} ${x.profit>0?'+':''}${x.profit}</span>`));host.innerHTML=last.length?last.join(''):'<em>Пока нет раздач</em>'}}
function bj22EnsureUI(){const actions=$('blackjack')?.querySelector('.v66BlackjackActions');if(actions&&!$('bjSplit')){const split=document.createElement('button');split.className='btn';split.id='bjSplit';split.textContent='Разделить';actions.appendChild(split);const ins=document.createElement('button');ins.className='btn';ins.id='bjInsurance';ins.textContent='Страховка';actions.appendChild(ins)}const ph=$('playerHand');if(ph&&!$('v220BjHands')){const rail=document.createElement('div');rail.id='v220BjHands';rail.className='v220BjHands';ph.insertAdjacentElement('beforebegin',rail)}const table=$('blackjack')?.querySelector('.v66BlackjackTable');if(table&&!$('v220Shoe')){const e=document.createElement('div');e.id='v220Shoe';e.className='v220Shoe';e.innerHTML='SHOE <b>6 DECK</b> · ОСТАЛОСЬ <b id="v220ShoeCount">312</b>';const rule=table.querySelector('.v66BlackjackRule');rule?.insertAdjacentElement('afterend',e)}const split=$('bjSplit'),ins=$('bjInsurance');if(split)split.onclick=bj22Split;if(ins)ins.onclick=bj22Insurance;const input=$('bjBetInput');if(input&&bj22Production()){input.min='2';input.step='2'}}
function bj22CanSplit(h){return B.active&&h&&h.cards.length===2&&!h.done&&h.cards[0].r===h.cards[1].r&&B.hands.length<4}
function bj22CanDouble(h){return B.active&&h&&h.cards.length===2&&!h.done&&!h.doubled}
function bj22DealerNatural(){return B.dealer.length===2&&bj22Value(B.dealer)===21}
function bj22RenderCards(host,cards,hideSecond=false){if(!host)return;host.innerHTML=cards.map((c,i)=>bj22Card(c,hideSecond&&i===1)).join('')}
function bj22Render(){bj22EnsureUI();const h=B.hands[B.hand]||B.hands[0],roundCurrency=bj22Production()&&['MS','MG'].includes(B.currency)?B.currency:unit(),playCurrency=B.active?roundCurrency:unit();bj22RenderCards($('dealerCards'),B.dealer,B.hideDealer);bj22RenderCards($('playerCards'),h?.cards||[],false);if($('dealerValue'))$('dealerValue').textContent=B.dealer.length?(B.hideDealer?bj22Value([B.dealer[0]]):bj22Value(B.dealer)):'?';if($('playerValue'))$('playerValue').textContent=h?bj22Value(h.cards):0;if($('blackjackBalance'))try{const economy=window.JRVXCasEconomy||window.JVRXCasEconomy,balance=typeof economy?.balance==='function'?economy.balance(playCurrency):muraTokenBalance();$('blackjackBalance').textContent=`${balance.toLocaleString('ru-RU')} ${playCurrency}`}catch{};if($('bjCurrentBet'))$('bjCurrentBet').textContent=`${B.active?(h?.bet||0):(bj22Bet()||0)} ${playCurrency}`;if($('v220ShoeCount'))$('v220ShoeCount').textContent=String(B.shoeCount??B.shoe.length??312);const rail=$('v220BjHands');if(rail)rail.innerHTML=B.hands.map((x,i)=>`<div class="v220BjHandChip ${i===B.hand&&B.active?'active':''} ${x.outcome||''}">РУКА ${i+1} · ${bj22Value(x.cards)} · ${x.bet} ${roundCurrency}</div>`).join('');const split=$('bjSplit'),ins=$('bjInsurance');if(split)split.disabled=bj22ServerBusy||!bj22CanSplit(h);if(ins){ins.disabled=bj22ServerBusy||!(B.active&&B.insuranceOffered&&!B.insuranceResolved);ins.classList.toggle('offer',!ins.disabled)}const hit=$('bjHit'),stand=$('bjStand'),dbl=$('bjDouble'),deal=$('bjDeal'),inp=$('bjBetInput');if(hit)hit.disabled=bj22ServerBusy||!B.active||!h||h.done;if(stand)stand.disabled=bj22ServerBusy||!B.active||!h||h.done;if(dbl)dbl.disabled=bj22ServerBusy||!bj22CanDouble(h);if(deal)deal.disabled=bj22ServerBusy||B.active;if(inp)inp.disabled=B.active||bj22ServerBusy;qa('[data-bj-bet]').forEach(button=>{button.disabled=B.active||bj22ServerBusy});qa('#blackjack .v69GameCurrency button').forEach(button=>{button.disabled=B.active||bj22ServerBusy});try{bjSyncBetChips?.()}catch{}}
function bj22Message(t,kind=''){const m=$('bjMessage');if(!m)return;m.textContent=t;m.className='casinoMessage'+(kind?' '+kind:'')}
function bj22ResolveInsurance(declined=false){if(!B.insuranceOffered||B.insuranceResolved)return;B.insuranceResolved=true;const playerNatural=B.hands.length===1&&!B.hands[0].fromSplit&&B.hands[0].cards.length===2&&bj22Value(B.hands[0].cards)===21;if(declined){if(bj22DealerNatural()){B.hideDealer=false;bj22Message('У дилера Blackjack. Страховка была отклонена.','loss');bj22Settle();return}if(playerNatural){B.hideDealer=false;bj22Settle();return}bj22Message('Страховка отклонена. Ваш ход.');bj22Render();return}const max=Math.floor((B.hands[0]?.bet||B.baseBet)/2);if(max<=0||!casinoTakeBet(max)){bj22Message(`Недостаточно ${unit()} для страховки.`);B.insuranceResolved=false;return}B.insuranceBet=max;if(bj22DealerNatural()){casinoReturn(max*3,max*2);bj22Message(`Страховка сыграла: +${max*2} ${unit()}. Дилер — Blackjack.`,'push');B.hideDealer=false;bj22Settle()}else{try{playerProfile.casinoProfit=(playerProfile.casinoProfit||0)-max;savePlayerProfile();renderPlayerProfile()}catch{};if(playerNatural){B.hideDealer=false;bj22Settle();return}bj22Message(`Страховка ${max} ${unit()} проиграна. Ваш ход.`);bj22Render()}}
function bj22Insurance(){if(bj22Production())return bj22ServerAction("insurance");if(B.insuranceOffered&&!B.insuranceResolved){haptic();bj22ResolveInsurance(false)}}
function bj22Advance(){const cur=B.hands[B.hand];if(cur)cur.done=true;let next=B.hands.findIndex((x,i)=>i>B.hand&&!x.done);if(next<0)next=B.hands.findIndex(x=>!x.done);if(next>=0){B.hand=next;bj22Message(`Рука ${next+1}. Ваш ход.`);bj22Render();return}bj22DealerPlay()}
function bj22DealerPlay(){B.hideDealer=false;while(bj22Value(B.dealer)<17)B.dealer.push(bj22Draw());bj22Settle()}
function bj22Settle(){B.active=false;B.hideDealer=false;const dv=bj22Value(B.dealer),dealerBJ=bj22DealerNatural(),results=[];let totalProfit=0;for(const h of B.hands){const pv=bj22Value(h.cards);let payout=0,profit=-h.bet,outcome='loss';const natural=!h.fromSplit&&h.cards.length===2&&pv===21;if(pv>21){}else if(dealerBJ&&!natural){}else if(natural&&!dealerBJ){payout=Math.floor(h.bet*2.5);profit=payout-h.bet;outcome='win'}else if(dv>21||pv>dv){payout=h.bet*2;profit=h.bet;outcome='win'}else if(pv===dv){payout=h.bet;profit=0;outcome='push'}if(payout)casinoReturn(payout,profit);else try{playerProfile.casinoProfit=(playerProfile.casinoProfit||0)-h.bet;savePlayerProfile();renderPlayerProfile()}catch{};h.outcome=outcome;h.profit=profit;totalProfit+=profit;results.push(h)}if(totalProfit>0){try{profileEvent('blackjackWin');profileEvent('win');awardXP(18)}catch{}}try{const totalBet=results.reduce((n,h)=>n+Math.max(0,Number(h.bet)||0),0);window.JRVXProgress?.event(totalProfit>0?'blackjack_win':'blackjack_loss',{bet:totalBet,profit:totalProfit});if(results.some(h=>!h.fromSplit&&h.cards?.length===2&&bj22Value(h.cards)===21&&h.outcome==='win'))window.JRVXProgress?.event('blackjack_natural',{})}catch{}bj22AddHistory(results);const summary=results.map((h,i)=>`Р${i+1}: ${h.outcome==='win'?'победа':h.outcome==='push'?'ничья':'проигрыш'} ${h.profit>0?'+':''}${h.profit}`).join(' · ');bj22Message(`${summary} ${unit()} · дилер ${dv}`,totalProfit>0?'win':totalProfit<0?'loss':'push');if($('bjDeal'))$('bjDeal').textContent='Ещё раз';bj22Render();haptic(totalProfit>0?35:15);try{checkAchievements()}catch{}}
function bj22Deal(){if(bj22Production())return bj22ServerAction("deal");if(B.active)return;const bet=bj22Bet();if(!bet){bj22Message('Введите корректную ставку.');return}if(!casinoTakeBet(bet)){bj22Message(`Недостаточно ${unit()} для этой ставки.`);return}if(B.shoe.length<78)bj22Shoe();B.roundId++;B.baseBet=bet;B.hands=[{cards:[bj22Draw(),bj22Draw()],bet,fromSplit:false,done:false,doubled:false}];B.dealer=[bj22Draw(),bj22Draw()];B.hand=0;B.active=true;B.hideDealer=true;B.insuranceOffered=B.dealer[0]?.r==='A';B.insuranceResolved=!B.insuranceOffered;B.insuranceBet=0;if($('bjDeal'))$('bjDeal').textContent='Раздать';try{profileEvent('blackjackHand')}catch{};try{window.JRVXProgress?.event('blackjack_hand',{bet})}catch{};const playerNatural=bj22Value(B.hands[0].cards)===21;if(B.insuranceOffered)bj22Message('У дилера туз. Доступна страховка до ½ ставки.');else bj22Message(`Ставка ${bet} ${unit()}. Ваш ход.`);bj22Render();if(B.dealer[0]&&['10','J','Q','K'].includes(B.dealer[0].r)&&bj22DealerNatural()){B.hideDealer=false;bj22Settle();return}if(playerNatural&&!B.insuranceOffered){B.hideDealer=false;bj22DealerPlay()}}
function bj22BeforeAction(){if(B.insuranceOffered&&!B.insuranceResolved)bj22ResolveInsurance(true)}
function bj22Hit(){if(bj22Production())return bj22ServerAction("hit");if(!B.active)return;bj22BeforeAction();if(!B.active)return;const h=B.hands[B.hand];if(!h||h.done)return;h.cards.push(bj22Draw());haptic();if(bj22Value(h.cards)>=21)bj22Advance();else{bj22Message(`Рука ${B.hand+1}: ${bj22Value(h.cards)}. Ваш ход.`);bj22Render()}}
function bj22Stand(){if(bj22Production())return bj22ServerAction("stand");if(!B.active)return;bj22BeforeAction();if(!B.active)return;haptic();bj22Advance()}
function bj22Double(){if(bj22Production())return bj22ServerAction("double");if(!B.active)return;bj22BeforeAction();const h=B.hands[B.hand];if(!bj22CanDouble(h))return;if(!casinoTakeBet(h.bet)){bj22Message(`Недостаточно ${unit()} для удвоения.`);return}h.bet*=2;h.doubled=true;h.cards.push(bj22Draw());haptic(25);bj22Advance()}
function bj22Split(){if(bj22Production())return bj22ServerAction("split");if(!B.active)return;bj22BeforeAction();const h=B.hands[B.hand];if(!bj22CanSplit(h))return;if(!casinoTakeBet(h.bet)){bj22Message(`Недостаточно ${unit()} для Split.`);return}const c=h.cards.pop(),n={cards:[c,bj22Draw()],bet:h.bet,fromSplit:true,done:false,doubled:false};h.cards.push(bj22Draw());h.fromSplit=true;B.hands.splice(B.hand+1,0,n);haptic(25);if(h.cards[0].r==='A'){h.done=true;n.done=true;bj22DealerPlay();return}bj22Message(`Split: играем руку ${B.hand+1}.`);bj22Render()}
function bindBlackjack(){bj22EnsureUI();if(!bj22Production()&&!B.shoe.length)bj22Shoe();const map={bjDeal:bj22Deal,bjHit:bj22Hit,bjStand:bj22Stand,bjDouble:bj22Double,bjSplit:bj22Split,bjInsurance:bj22Insurance};for(const [id,fn] of Object.entries(map)){const e=$(id);if(e)e.onclick=fn}qa('[data-bj-bet]').forEach(b=>b.onclick=()=>{if(B.active||bj22ServerBusy)return;$('bjBetInput').value=b.dataset.bjBet;try{bjSyncBetChips?.()}catch{};bj22Message(`Ставка выбрана: ${b.dataset.bjBet} ${unit()}`);bj22Render()});const input=$('bjBetInput');if(input&&!input.dataset.bjBoundV300){input.dataset.bjBoundV300='1';input.addEventListener('input',()=>{if(!B.active)bj22Render()},{passive:true})}bj22RenderSession();bj22Render();if(bj22Production())void bj22LoadServerState()}
function bj22Production(){return window.JRVXCASIdentityV300?.state?.().mode!=='development'}
function bj22PendingKey(ownerId=bj22IdentityOwner()){return ownerId?`jrvxBlackjackPendingV302:${ownerId}`:''}
let bj22ServerBusy=false,bj22Operation=0,bj22OwnerEpoch=0;
function bj22IdentityOwner(){const identity=window.JRVXCASIdentityV300?.state?.();return identity?.authenticated?identity.user?.id||null:null}
function bj22SyncOwner(){
 const owner=bj22IdentityOwner();if(owner===B.serverOwner)return owner;
 bj22Operation++;bj22OwnerEpoch++;bj22ServerBusy=false;
 Object.assign(B,{shoe:[],shoeCount:312,hands:[],dealer:[],active:false,hand:0,hideDealer:true,insuranceOffered:false,insuranceResolved:false,insuranceBet:0,baseBet:50,roundId:0,serverOwner:owner,serverVersion:null});
 bj22RenderSession();bj22Render();return owner;
}
function bj22ApplyServerState(view,version,ownerId){
 if(!view||ownerId!==bj22IdentityOwner()||ownerId!==B.serverOwner||!Number.isSafeInteger(Number(version))||Number(version)<Number(B.serverVersion||0))return false;
 Object.assign(B,view);B.shoe=[];B.serverVersion=Number(version);
 // A background snapshot must not change the currency selected for another game.
 // Only resuming an active, visible blackjack hand restores its table currency.
 if(view.active&&$('blackjack')?.classList.contains('active'))try{(window.JRVXCasEconomy||window.JVRXCasEconomy)?.setCurrency?.(view.currency)}catch{}
 bj22Render();return true;
}
async function bj22RefreshAccount(ownerId){
 if(ownerId!==bj22IdentityOwner())return;
 if(window.JRVXCASServerAccount?.refresh)return window.JRVXCASServerAccount.refresh();
 const {response,data}=await requestJSON('/api/me');
 if(!response.ok)throw new Error('account_sync_failed');
 if(data.ok!==true||data.account?.id!==ownerId||ownerId!==bj22IdentityOwner())return;
 const eco=window.JRVXCasEconomy||window.JVRXCasEconomy;
 eco?.set?.({ms:data.wallet.MS,mg:data.wallet.MG});
 if(data.progress)window.JRVXProgress?.apply?.(data.progress,'blackjack-server');
 try{casinoRefresh()}catch{}
 return data;
}
async function bj22LoadServerState(){
 if(!bj22Production())return false;
 const ownerId=bj22SyncOwner(),epoch=bj22OwnerEpoch;if(!ownerId)return false;
 try{
  const {response,data}=await requestJSON('/api/blackjack/state');
  if(!response.ok||epoch!==bj22OwnerEpoch)return false;
  const applied=data.ok&&bj22ApplyServerState(data.state,data.version,ownerId);
  if(applied)void bj22RefreshAccount(ownerId).catch(()=>{});return !!applied;
 }catch{return false}
}
async function bj22ServerAction(action){
 if(bj22ServerBusy)return;
 const ownerId=bj22SyncOwner();if(!ownerId){bj22Message('Войдите через JRVX ID для серверной игры.');return}
 const operation=++bj22Operation,pendingKey=bj22PendingKey(ownerId),current=()=>operation===bj22Operation&&ownerId===bj22IdentityOwner();
 let accepted=false;
 bj22ServerBusy=true;bj22Render();
 try{
  if(B.serverVersion===null&&!await bj22LoadServerState()){if(current())bj22Message('Не удалось загрузить раздачу с сервера. Повторите подключение.','loss');return}
  if(!current())return;
  const pending=readPending(pendingKey);
  if(pending&&(pending.ownerId!==ownerId||!Number.isSafeInteger(pending.expectedVersion)))throw Error('pending_storage_unavailable');
  const intent=pending||{ownerId,actionId:newOperationId(),action,expectedVersion:B.serverVersion};
  if(!pending&&action==='deal'){
   intent.bet=Number($('bjBetInput')?.value||0);intent.currency=unit();
   if(!Number.isSafeInteger(intent.bet)||intent.bet<2||intent.bet>1_000_000||intent.bet%2!==0){bj22Message('Введите чётную целую ставку от 2 до 1 000 000.');return}
  }
  if(!pending)writePending(pendingKey,intent);
  bj22Message(pending?'Повторная проверка предыдущего действия…':'Сервер проверяет действие…');bj22Render();
  const {response,data}=await requestJSON('/api/blackjack/action',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(intent)});
  if(!response.ok||!data.ok){const error=new Error(data.error||'server_error');error.status=response.status;throw error}
  if(!current())return;
  const result=data.result;
  if(!result?.state||!Number.isSafeInteger(Number(result.version)))throw Error('invalid_server_result');
  // A valid server acknowledgement is final even when a local presentation
  // helper fails. It must never be reported as an uncertain retry afterwards.
  accepted=true;clearPending(pendingKey);
  bj22ApplyServerState(result.state,result.version,ownerId);
  let historySynced=true;
  if(result.settlement){
   try{bj22AddHistory(result.settlement.results,result.roundId,result.settlement.dealer,result.currency)}catch{historySynced=false}
   if(result.actionVersion===B.serverVersion&&!B.active){
    const profit=result.settlement.profit;
    bj22Message('Раздача завершена: '+(profit>0?'+':'')+profit+' '+result.currency,profit>0?'win':profit<0?'loss':'push');
    if($('bjDeal'))$('bjDeal').textContent='Ещё раз';haptic(profit>0?35:15);
   }else bj22Message(B.active?'Рука '+(B.hand+1)+'. Ваш ход.':'Предыдущее действие подтверждено.');
  }else bj22Message(B.insuranceOffered&&!B.insuranceResolved?'У дилера туз. Доступна страховка.':B.active?'Рука '+(B.hand+1)+'. Ваш ход.':'Раздача завершена.');
  if(!historySynced){const message=$('bjMessage');if(message)message.textContent+=' Историю не удалось обновить.'}
  try{casinoRefresh()}catch{}
  // The action and its controls are complete before an optional wallet read.
  // A late failed read must not replace a newer action's confirmation.
  const acknowledgedVersion=B.serverVersion,acknowledgedMessage=$('bjMessage')?.textContent;
  const warnBalance=()=>{const message=$('bjMessage');if(current()&&B.serverVersion===acknowledgedVersion&&message?.textContent===acknowledgedMessage)message.textContent+=' Действие подтверждено. Не удалось обновить баланс — он синхронизируется при следующем подключении.'};
  void bj22RefreshAccount(ownerId).then(data=>{if(!data)warnBalance()},warnBalance);
 }catch(error){
  if(!current())return;
  if(accepted){bj22Message('Действие подтверждено сервером. Не удалось обновить отображение раздачи. Перезагрузите страницу для синхронизации.');return}
  if(error.message==='intent_owner_mismatch'){bj22Message('Аккаунт изменился. Проверьте вход перед повторным действием.');try{Promise.resolve(window.JRVXCASIdentityV300?.refresh?.()).catch(()=>{})}catch{}return}
  if(error.status&&error.status<500)clearPending(pendingKey);
  if(error.message==='stale_state'){
   await bj22LoadServerState();if(current())bj22Message('Состояние раздачи обновилось. Проверьте руку и повторите действие.');
  }else bj22Message(error.message==='pending_storage_unavailable'?'Браузер не смог сохранить запрос. Разрешите сохранение данных сайта и попробуйте снова.':error.message==='insufficient_balance'?'Недостаточно средств для действия.':'Сервер не подтвердил действие. Повторная попытка проверит тот же запрос.','loss');
 }finally{if(operation===bj22Operation){bj22ServerBusy=false;try{bj22Render()}catch{}}}
}

document.addEventListener('jrvx-cas-identity',()=>{bj22SyncOwner();void bj22LoadServerState()});
function bindV242Blackjack(){setVersion();bindBlackjack();[200,900,1800,3200,5200].forEach(ms=>setTimeout(()=>{setVersion();bj22EnsureUI()},ms))}
Object.assign(window.JRVXCASV220.blackjack,{state:B,deal:bj22Deal,hit:bj22Hit,stand:bj22Stand,double:bj22Double,split:bj22Split,insurance:bj22Insurance,history:bj22History,value:bj22Value});
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',bindV242Blackjack,{once:true});else bindV242Blackjack();
})();
;
/* source: modules/roulette/runtime/roulette.js */
(()=>{
'use strict';
const S=window.JRVXCASV220Shared;if(!S)throw new Error('JRVX CAS shared casino runtime missing');
const {VERSION,ROULETTE_LAST_KEY,$,qa,esc,unit,haptic,setVersion,newOperationId,readPending,writePending,clearPending,requestJSON}=S;
/* ---------------- ROULETTE 3.0.2 MODULE ---------------- */
const R22={mode:'straight',splitAxis:'horizontal',selection:{type:'red',numbers:[],label:'Красное',mult:2},last:null,lastOwner:''};
let r22ServerEpoch=0,r22ServerOwner='';
const PAY={exact:36,split:18,street:12,corner:9,dozen1:3,dozen2:3,dozen3:3,col1:3,col2:3,col3:3,red:2,black:2,even:2,odd:2,low:2,high:2};
function r22NumbersFor(type,n){n=Number(n);if(!Number.isInteger(n)||n<0||n>36)return[];if(type==='straight'||type==='exact')return[n];if(n===0)return type==='split'?[0,2]:type==='street'?[0,1,2]:type==='corner'?[0,1,2,3]:[];const row=Math.floor((n-1)/3),col=(n-1)%3;if(type==='split'){const other=R22.splitAxis==='vertical'?(n<=33?n+3:n-3):(col<2?n+1:n-1);return[n,other].sort((a,b)=>a-b)}if(type==='street'){const a=row*3+1;return[a,a+1,a+2]}if(type==='corner'){const ar=Math.min(row,10),ac=Math.min(col,1),a=ar*3+ac+1;return[a,a+1,a+3,a+4]}return[n]}
function r22Wins(type,n,exact){if(type==='none')return false;if(type==='exact'||type==='split'||type==='street'||type==='corner')return Array.isArray(exact)?exact.includes(n):Number(exact)===n;if(type==='dozen1')return n>=1&&n<=12;if(type==='dozen2')return n>=13&&n<=24;if(type==='dozen3')return n>=25&&n<=36;if(type==='col1')return n>0&&n%3===1;if(type==='col2')return n>0&&n%3===2;if(type==='col3')return n>0&&n%3===0;try{return rouletteWinsLegacy(type,n,exact)}catch{}if(type==='red')return R_RED.has(n);if(type==='black')return n!==0&&!R_RED.has(n);if(type==='even')return n!==0&&n%2===0;if(type==='odd')return n%2===1;if(type==='low')return n>=1&&n<=18;if(type==='high')return n>=19&&n<=36;return false}
let rouletteWinsLegacy=null;try{rouletteWinsLegacy=rouletteWins;rouletteWins=r22Wins}catch{}
function r22Set(sel){R22.selection=sel;rouletteType=sel.type;rouletteExact=sel.numbers?.length?sel.numbers.slice():null;qa('#roulette .rouletteBet,#roulette .v220GroupBets .btn').forEach(x=>x.classList.remove('active'));if(['red','black','even','odd','low','high'].includes(sel.type))document.querySelector(`#roulette .outsideBet[data-r-type="${sel.type}"]`)?.classList.add('active');document.querySelector(`#roulette .v220GroupBets [data-r22-type="${sel.type}"]`)?.classList.add('active');qa('#roulette .numberBet').forEach(b=>b.classList.toggle('v220-selected',(sel.numbers||[]).includes(Number(b.dataset.number))));if($('rouletteSelection'))$('rouletteSelection').textContent=`Выбрана ставка: ${sel.label} • выплата ×${sel.mult}`;r22Summary()}
function r22Summary(){const e=$('v220BetSummary');if(!e)return;const amt=Math.max(0,Math.floor(Number($('rouletteBetInput')?.value)||0)),s=R22.selection;e.innerHTML=s.type==='none'?'Ставка не выбрана.':`<strong>${esc(s.label)}</strong> · ${amt.toLocaleString('ru-RU')} ${unit()} · возможная выплата ${(amt*s.mult).toLocaleString('ru-RU')} ${unit()}`}
function r22ChooseNumber(n){const nums=r22NumbersFor(R22.mode,n),labels={straight:`Число ${n}`,split:`Split ${nums.join(' / ')}`,street:`Street ${nums.join('–')}`,corner:`Corner ${nums.join(' / ')}`},type=R22.mode==='straight'?'exact':R22.mode;r22Set({type,numbers:nums,label:labels[R22.mode],mult:PAY[type]})}
function r22RenderNumbers(){const host=$('rouletteNumbers');if(!host)return;host.innerHTML=Array.from({length:37},(_,n)=>`<button class="btn rouletteBet numberBet ${rouletteColor(n)}" data-number="${n}">${n}</button>`).join('');qa('[data-number]',host).forEach(b=>b.onclick=()=>{if(!rouletteBusy){r22ChooseNumber(Number(b.dataset.number));$('roulette')?.querySelector('.v66RouletteConsole')?.classList.remove('v220-board-open')}});r22Set(R22.selection)}
function r22EnsureUI(){const board=$('roulette')?.querySelector('.v66BettingBoard');if(board&&!$('v220RouletteModes')){const modes=document.createElement('div');modes.id='v220RouletteModes';modes.className='v220RouletteModes';modes.innerHTML='<button class="btn active" data-r22-mode="straight">STRAIGHT ×36</button><button class="btn" data-r22-mode="split">SPLIT ×18</button><button class="btn" data-r22-mode="street">STREET ×12</button><button class="btn" data-r22-mode="corner">CORNER ×9</button>';const title=board.querySelector('.v66StraightTitle');title?.insertAdjacentElement('afterend',modes);const groups=document.createElement('div');groups.id='v220GroupBets';groups.className='v220GroupBets';groups.innerHTML='<button class="btn" data-r22-type="dozen1">1–12 · ×3</button><button class="btn" data-r22-type="dozen2">13–24 · ×3</button><button class="btn" data-r22-type="dozen3">25–36 · ×3</button><button class="btn" data-r22-type="col1">COL 1 · ×3</button><button class="btn" data-r22-type="col2">COL 2 · ×3</button><button class="btn" data-r22-type="col3">COL 3 · ×3</button>';modes.insertAdjacentElement('afterend',groups)}if(board&&!$('v220BoardClose')){const close=document.createElement('button');close.id='v220BoardClose';close.className='btn v220BoardClose';close.textContent='Готово · закрыть ставки';board.prepend(close)}const action=$('roulette')?.querySelector('.v66RouletteAction');if(action&&!$('v220RouletteTools')){const tools=document.createElement('div');tools.id='v220RouletteTools';tools.className='v220RouletteTools';tools.innerHTML='<button class="btn v220MobileBets" id="r22Bets">Ставки</button><button class="btn" id="r22Repeat">Повторить</button><button class="btn" id="r22Double">Ставка ×2</button><button class="btn" id="r22Clear">Очистить</button>';action.insertAdjacentElement('afterend',tools);const sum=document.createElement('div');sum.id='v220BetSummary';sum.className='v220BetSummary';tools.insertAdjacentElement('afterend',sum)}}
function r22Group(type){const labels={dozen1:'1–12',dozen2:'13–24',dozen3:'25–36',col1:'Колонка 1',col2:'Колонка 2',col3:'Колонка 3'};r22Set({type,numbers:[],label:labels[type],mult:3})}
function r22StorageOwner(){const auth=window.JRVXCASIdentityV300?.state?.();if(auth?.requiresAuthentication)return auth.authenticated?String(auth.user?.id||''):'';return 'development'}
function r22LastKey(){const owner=r22StorageOwner();if(!owner)return'';return owner==='development'?ROULETTE_LAST_KEY:`${ROULETTE_LAST_KEY}:${owner}`}
function r22PendingKey(owner=r22StorageOwner()){return owner&&owner!=='development'?`jrvxRoulettePendingV302:${owner}`:''}
function r22SavedSplitAxis(selection){const nums=selection.numbers||[];return nums.length===2?Math.abs(nums[0]-nums[1])===3?'vertical':'horizontal':selection.splitAxis==='vertical'?'vertical':'horizontal'}
function r22SaveLast(amount,selection=R22.selection){const owner=r22StorageOwner();R22.lastOwner=owner;R22.last={amount,type:selection.type,numbers:(selection.numbers||[]).slice(),label:selection.label,mult:selection.mult,...(selection.type==='split'?{splitAxis:r22SavedSplitAxis(selection)}:{})};const key=r22LastKey();if(!key)return;try{localStorage.setItem(key,JSON.stringify(R22.last))}catch{}}
function r22ValidLast(value){if(!value||typeof value!=='object'||Array.isArray(value)||!Number.isSafeInteger(value.amount)||value.amount<1||value.amount>1_000_000||typeof value.label!=='string'||!Object.prototype.hasOwnProperty.call(PAY,value.type)||value.mult!==PAY[value.type]||!Array.isArray(value.numbers))return false;const count={exact:1,split:2,street:3,corner:4}[value.type]||0;return value.numbers.length===count&&new Set(value.numbers).size===count&&value.numbers.every(n=>Number.isInteger(n)&&n>=0&&n<=36)}
function r22LoadLast(){const owner=r22StorageOwner();if(!owner)return null;if(R22.last&&R22.lastOwner===owner)return r22ValidLast(R22.last)?R22.last:null;R22.last=null;R22.lastOwner=owner;const key=r22LastKey();if(!key)return null;try{const value=JSON.parse(localStorage.getItem(key)||'null');return r22ValidLast(value)?R22.last=value:null}catch{return null}}
function r22RestoreHistory(entries){
 rouletteHistory=(Array.isArray(entries)?entries:[]).filter(x=>x?.game==='roulette'&&Number.isInteger(x.data?.number)&&x.data.number>=0&&x.data.number<=36).slice(0,30).map(x=>x.data.number);
 rouletteRenderHistory();
 if(!rouletteBusy){const number=rouletteHistory[0]??null,index=number===null?-1:R_ORDER.indexOf(number);rouletteState.lastNumber=number;rouletteState.highlightIndex=index;rouletteUpdatePreview(number);if(index>=0){rouletteState.ballAngle=roulettePocketCenterAngle(index,rouletteState.wheelAngle);rouletteState.ballRadius=rouletteGeometry().ballPocket;rouletteState.phase='settled'}else{rouletteState.ballRadius=rouletteGeometry().rail;rouletteState.phase='idle'}rouletteDraw()}
}
function r22Spin(){if(rouletteBusy)return;if(window.JRVXCASIdentityV300?.state?.().mode!=='development')return r22SpinServer();const amount=Math.floor(Number($('rouletteBetInput')?.value)||0),s=R22.selection;if(!amount){$('rouletteMessage').textContent='Введите корректную ставку.';return}if(!s||s.type==='none'){$('rouletteMessage').textContent='Выберите тип ставки.';return}if(!casinoTakeBet(amount)){$('rouletteMessage').textContent=`Недостаточно ${unit()} для этой ставки.`;return}rouletteBet=amount;rouletteType=s.type;rouletteExact=(s.numbers||[]).slice();r22SaveLast(amount);rouletteBusy=true;$('rouletteSpin').disabled=true;try{profileEvent('rouletteSpin')}catch{};try{window.JRVXProgress?.event('roulette_spin',{bet:amount})}catch{};rouletteAnimate(actualIndex=>{const n=R_ORDER[actualIndex],win=r22Wins(s.type,n,s.numbers),mult=s.mult,payout=win?amount*mult:0,profit=win?payout-amount:-amount;if(win){casinoReturn(payout,profit);try{profileEvent('rouletteWin');profileEvent('win');awardXP(s.type==='exact'?35:18)}catch{};try{window.JRVXProgress?.event('roulette_win',{bet:amount,profit,type:s.type});if(s.type==='exact')window.JRVXProgress?.event('roulette_straight',{})}catch{}}else{try{window.JRVXProgress?.event('roulette_loss',{bet:amount,profit,type:s.type})}catch{};try{playerProfile.casinoProfit=(playerProfile.casinoProfit||0)-amount;savePlayerProfile();renderPlayerProfile()}catch{}};rouletteState.lastNumber=n;rouletteState.highlightIndex=actualIndex;rouletteHistory.unshift(n);rouletteHistory=rouletteHistory.slice(0,30);try{localStorage.setItem('jarvisRouletteHistoryV1',JSON.stringify(rouletteHistory))}catch{};rouletteUpdatePreview(n);rouletteRenderHistory();try{window.v50RenderRouletteAnalytics?.()}catch{};const c=$('rouletteCanvas'),rp=$('roulettePocketPreview');c?.classList.remove('reveal');if(c){void c.offsetWidth;c.classList.add('reveal')}rp?.classList.add('hit');setTimeout(()=>rp?.classList.remove('hit'),1100);rouletteDraw();$('rouletteMessage').textContent=win?`Победа! +${profit} ${unit()} • ${s.label} • выпало ${n}`:`Выпало ${n} • ${s.label} не сыграла`;rouletteBusy=false;$('rouletteSpin').disabled=false;casinoRefresh();r22Summary();haptic(win?35:12);try{checkAchievements()}catch{}})}
function bindRoulette(){r22EnsureUI();r22RenderNumbers();qa('#roulette [data-r22-mode]').forEach(b=>b.onclick=()=>{if(rouletteBusy)return;if(R22.mode==='split'&&b.dataset.r22Mode==='split')R22.splitAxis=R22.splitAxis==='horizontal'?'vertical':'horizontal';R22.mode=b.dataset.r22Mode;if(b.dataset.r22Mode==='split'){b.textContent=R22.splitAxis==='vertical'?'SPLIT ↕ ×18':'SPLIT ↔ ×18';b.title='Нажмите повторно, чтобы изменить направление Split'}qa('#roulette [data-r22-mode]').forEach(x=>x.classList.toggle('active',x===b));if(R22.selection.numbers?.length)r22ChooseNumber(R22.selection.numbers[0])});qa('#roulette [data-r22-type]').forEach(b=>b.onclick=()=>{if(!rouletteBusy){r22Group(b.dataset.r22Type);$('roulette')?.querySelector('.v66RouletteConsole')?.classList.remove('v220-board-open')}});qa('#roulette [data-r-type]').forEach(b=>b.onclick=()=>{if(rouletteBusy)return;const type=b.dataset.rType,names={red:'Красное',black:'Чёрное',even:'Чётное',odd:'Нечётное',low:'1–18',high:'19–36'};r22Set({type,numbers:[],label:names[type],mult:2});$('roulette')?.querySelector('.v66RouletteConsole')?.classList.remove('v220-board-open')});qa('#roulette [data-r-bet]').forEach(b=>b.onclick=()=>{if(rouletteBusy)return;$('rouletteBetInput').value=b.dataset.rBet;try{rouletteSyncBetChips?.()}catch{};r22Summary()});$('rouletteBetInput')?.addEventListener('input',r22Summary,{passive:true});$('rouletteSpin').onclick=r22Spin;if($('r22Bets'))$('r22Bets').onclick=()=>{$('roulette')?.querySelector('.v66RouletteConsole')?.classList.toggle('v220-board-open')};if($('v220BoardClose'))$('v220BoardClose').onclick=()=>{$('roulette')?.querySelector('.v66RouletteConsole')?.classList.remove('v220-board-open')};$('r22Repeat').onclick=()=>{if(rouletteBusy)return;const x=r22LoadLast();if(!x){$('rouletteMessage').textContent='Нет предыдущей ставки.';return}$('rouletteBetInput').value=x.amount;R22.mode=x.type==='exact'?'straight':['split','street','corner'].includes(x.type)?x.type:R22.mode;if(x.type==='split')R22.splitAxis=r22SavedSplitAxis(x);qa('#roulette [data-r22-mode]').forEach(b=>{b.classList.toggle('active',b.dataset.r22Mode===R22.mode);if(b.dataset.r22Mode==='split')b.textContent=R22.splitAxis==='vertical'?'SPLIT ↕ ×18':'SPLIT ↔ ×18'});r22Set(x);try{rouletteSyncBetChips?.()}catch{};$('rouletteMessage').textContent='Предыдущая ставка восстановлена.'};$('r22Double').onclick=()=>{if(rouletteBusy)return;const v=Math.max(1,Math.floor(Number($('rouletteBetInput').value)||0)*2);$('rouletteBetInput').value=v;try{rouletteSyncBetChips?.()}catch{};r22Summary()};$('r22Clear').onclick=()=>{if(rouletteBusy)return;r22Set({type:'none',numbers:[],label:'—',mult:0});$('rouletteMessage').textContent='Поле ставок очищено.'};r22Set({type:'red',numbers:[],label:'Красное',mult:2});r22Summary()}

// Wallet and rendering helpers cannot turn a confirmed wager into a retry.
function r22Optional(work){try{Promise.resolve(work()).catch(()=>{})}catch{}}
async function r22SpinServer(){
 if(rouletteBusy)return;
 const identity=window.JRVXCASIdentityV300?.state?.();
 if(!identity?.authenticated||!identity.user?.id){$('rouletteMessage').textContent='Войдите через JRVX ID для серверной ставки.';return}
 const ownerId=identity.user.id,pendingKey=r22PendingKey(ownerId),epoch=++r22ServerEpoch;
 const current=()=>epoch===r22ServerEpoch&&window.JRVXCASIdentityV300?.state?.().authenticated===true&&window.JRVXCASIdentityV300.state().user?.id===ownerId;
 const finish=()=>{if(epoch===r22ServerEpoch){r22ServerOwner='';rouletteBusy=false;$('rouletteSpin').disabled=false}};
 let currency=unit();
 try{
  const pending=readPending(pendingKey);
  if(pending&&pending.ownerId!==ownerId)throw Error('pending_storage_unavailable');
  currency=pending?.currency||currency;
  const amount=pending?.amount??Number($('rouletteBetInput')?.value),bet=pending?.bet||{type:R22.selection?.type,numbers:(R22.selection?.numbers||[]).slice()};
  if(!Number.isSafeInteger(amount)||amount<1||amount>1_000_000||!PAY[bet.type]){$('rouletteMessage').textContent='Введите корректную ставку и выберите поле.';return}
  const intent=pending||{ownerId,spinId:newOperationId(),currency,amount,bet};
  if(!pending)writePending(pendingKey,intent);
  r22ServerOwner=ownerId;rouletteBusy=true;$('rouletteSpin').disabled=true;$('rouletteMessage').textContent=pending?'Проверяем результат предыдущего запроса…':'Сервер проверяет ставку…';
  const {response,data:payload}=await requestJSON('/api/roulette/spin',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(intent)});
  if(!response.ok||!payload.ok){const error=new Error(payload.error||'server_error');error.status=response.status;throw error}
  const result=payload.result,targetIndex=R_ORDER.indexOf(result?.number);
  if(targetIndex<0||!Number.isSafeInteger(result.balanceAfter))throw Error('invalid_server_result');
  if(!current()){finish();return}
  clearPending(pendingKey);
  const labels={exact:'Число '+bet.numbers?.[0],split:'Split '+(bet.numbers||[]).join(' / '),street:'Street '+(bet.numbers||[]).join('–'),corner:'Corner '+(bet.numbers||[]).join(' / '),red:'Красное',black:'Чёрное',even:'Чётное',odd:'Нечётное',low:'1–18',high:'19–36',dozen1:'1–12',dozen2:'13–24',dozen3:'25–36',col1:'Колонка 1',col2:'Колонка 2',col3:'Колонка 3'};
  r22SaveLast(amount,{type:bet.type,numbers:(bet.numbers||[]).slice(),label:labels[bet.type],mult:PAY[bet.type]});
  r22Optional(()=>window.JRVXCASServerAccount?.apply?.(result));
  // Account synchronization runs separately; it must not delay a confirmed spin.
  r22Optional(()=>window.JRVXCASServerAccount?.refresh?.());
  let revealed=false;
  const reveal=()=>{
   if(revealed)return;
   if(!current()){finish();return}
   revealed=true;
   rouletteState.lastNumber=result.number;rouletteState.highlightIndex=targetIndex;
   rouletteHistory.unshift(result.number);rouletteHistory=rouletteHistory.slice(0,30);
   $('rouletteMessage').textContent=result.won?'Победа! +'+result.profit+' '+currency+' • выпало '+result.number:'Выпало '+result.number+' • ставка не сыграла';
   finish();
   r22Optional(()=>{rouletteUpdatePreview(result.number);rouletteRenderHistory();rouletteDraw()});
   r22Optional(()=>{casinoRefresh();r22Summary();haptic(result.won?35:12)});
   r22Optional(()=>window.JRVXCASServerAccount?.refresh?.());r22Optional(()=>window.JRVXCASServerAccount?.history?.('roulette'));
  };
  try{rouletteAnimate(reveal,targetIndex,current)}catch{reveal()}
 }catch(error){
  if(!current()){finish();return}
  if(error.message==='intent_owner_mismatch'){finish();$('rouletteMessage').textContent='Аккаунт изменился. Проверьте вход перед повторной ставкой.';r22Optional(()=>window.JRVXCASIdentityV300?.refresh?.());return}
  if(error.status===400||['insufficient_balance','spin_id_conflict'].includes(error.message))clearPending(pendingKey);
  finish();$('rouletteMessage').textContent=error.message==='pending_storage_unavailable'?'Браузер не смог сохранить запрос. Разрешите сохранение данных сайта и попробуйте снова.':error.message==='insufficient_balance'?'Недостаточно '+currency+' для этой ставки.':'Сервер не подтвердил ставку. Повторная попытка проверит тот же запрос.';
 }
}
function patchRouletteBrand22(){try{const TAU=typeof R_TAU==='number'?R_TAU:Math.PI*2;rouletteDrawCircularBrand=function(ctx,r,wheelAngle){const count=12;ctx.save();ctx.fillStyle='#f8e6b4';ctx.font='900 15px system-ui';ctx.textAlign='center';ctx.textBaseline='middle';ctx.shadowBlur=4;ctx.shadowColor='rgba(0,0,0,.24)';for(let i=0;i<count;i++){const a=wheelAngle+i*TAU/count;ctx.save();ctx.rotate(a+Math.PI/2);ctx.translate(0,-r);ctx.fillText('JRVX',0,0);ctx.restore();const da=a+TAU/(count*2);ctx.beginPath();ctx.arc(Math.cos(da)*r,Math.sin(da)*r,2,0,TAU);ctx.fill()}ctx.restore()};rouletteDraw()}catch{}}
function bindV242Roulette(){setVersion();bindRoulette();patchRouletteBrand22();[200,900,1800,3200,5200].forEach(ms=>setTimeout(()=>{setVersion();r22EnsureUI()},ms))}
Object.assign(window.JRVXCASV220.roulette,{state:R22,spin:r22Spin,set:r22Set,wins:r22Wins,numbersFor:r22NumbersFor,restoreHistory:r22RestoreHistory});
document.addEventListener('jrvx-cas-identity',()=>{const owner=r22StorageOwner();if(owner!==R22.lastOwner){R22.last=null;R22.lastOwner=owner}if(r22ServerOwner&&owner!==r22ServerOwner){r22ServerEpoch++;r22ServerOwner='';rouletteBusy=false;$('rouletteSpin').disabled=false;$('rouletteMessage').textContent=owner?'Состояние аккаунта обновлено.':'Войдите через JRVX ID для серверной игры.'}});
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',bindV242Roulette,{once:true});else bindV242Roulette();
})();
;
