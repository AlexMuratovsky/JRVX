(()=>{
'use strict';
const VERSION='v3.0.17',SETTINGS_KEY='jrvxCasPokerSettingsV230',SESSION_KEY='jrvxCasPokerSessionV230';
const $=id=>document.getElementById(id),qa=(s,r=document)=>Array.from(r?.querySelectorAll?.(s)||[]),Core=window.Poker59Core;
const defaults={confirmAllIn:true,autoRebuy:false,rebuyThreshold:50,fourColor:true,fastAnimations:false,haptic:true};
let settings=loadSettings(),frameWrapped=false,allowAllIn=null,pendingAllIn=null,autoMode=null,autoOrigin=null,autoKey='',autoTimer=null,lastTurnHaptic='',lastResultHaptic='',recoveryObserver=null,sessionSaveTimer=0,lastSavedSessionSig='',sessionWriteCount=0,historyEnhanceTimer=0;
let confirmFocus=null,drawerFocus=null;
function safeJSON(v,f){try{return JSON.parse(v)}catch{return f}}
function loadSettings(){let raw='{}';try{raw=localStorage.getItem(SETTINGS_KEY)||'{}'}catch{}return Object.assign({},defaults,safeJSON(raw,{}))}
function saveSettings(){try{localStorage.setItem(SETTINGS_KEY,JSON.stringify(settings))}catch{};applySettings();syncSettingsUI()}
function unit(){try{return (window.JRVXCasEconomy||window.JVRXCasEconomy)?.get?.().currency==='MG'?'MG':'MS'}catch{return'MS'}}
function economy(){return window.JRVXCasEconomy||window.JVRXCasEconomy||null}
function balance(){try{return Math.max(0,Math.floor(Number(economy()?.balance?.(unit()))||0))}catch{return 0}}
function setBalance(v){const api=economy();if(!api?.set)return false;const cur=unit(),all=api.get?.()||{};api.set(cur==='MG'?{mg:Math.max(0,Math.floor(v)),ms:all.ms}:{ms:Math.max(0,Math.floor(v)),mg:all.mg});return true}
function haptic(ms=16){
 if(!settings.haptic||document.hidden||document.visibilityState==='hidden')return;
 try{
  const experience=window.JRVXExperience;
  if(!(typeof experience?.allows==='function'?experience.allows('haptics'):experience?.settings?.haptics!==false))return;
  if(navigator.userActivation&&!navigator.userActivation.hasBeenActive)return;
  navigator.vibrate?.(ms);
 }catch{}
}
function toast(title,msg,icon='♠'){try{showArcadeToast?.(title,msg,icon,2200)}catch{}}
function setVersion(){document.title='JRVX CAS '+VERSION;qa('.v101UpdateCard,.v69Mini').forEach(card=>{if(!/Последнее обновление/i.test(card.textContent||''))return;const em=card.querySelector('em'),b=card.querySelector('b'),p=card.querySelector('p');if(em)em.textContent='Последнее обновление • '+VERSION;if(b)b.textContent='Последнее обновление, версия '+VERSION;if(p)p.textContent='Global Release: Online Multiplayer, серверная экономика, Progression, Admin, PWA, UX и production identity gate.'})}
function applySettings(){const app=$('poker59App');if(!app)return;app.classList.toggle('v230-four-color',!!settings.fourColor);app.classList.toggle('v230-fast',!!settings.fastAnimations);const b=$('p230SettingsBtn');if(b)b.dataset.dot=(settings.autoRebuy||!settings.confirmAllIn||settings.fastAnimations)?'1':'0'}
function ensureUI(){const app=$('poker59App'),game=$('p59Game');if(!app||!game)return false;const btns=game.querySelector('.p59GameBtns');if(btns&&!$('p230SettingsBtn')){const s=document.createElement('button');s.className='btn';s.id='p230SettingsBtn';s.textContent='Настройки';btns.prepend(s);const r=document.createElement('button');r.className='btn';r.id='p230RebuyBtn';r.textContent='Rebuy';btns.prepend(r)}const panel=game.querySelector('.p59ActionPanel');if(panel&&!$('p230AutoStrip')){const x=document.createElement('div');x.id='p230AutoStrip';x.className='p230AutoStrip';x.innerHTML='<button class="btn" id="p230AutoCheck">AUTO CHECK</button><button class="btn" id="p230CheckFold">CHECK / FOLD</button>';const log=$('p59Log');(log||panel).insertAdjacentElement(log?'beforebegin':'beforeend',x)}if(!$('p230Drawer')){const d=document.createElement('aside');d.id='p230Drawer';d.className='p230Drawer';d.innerHTML=`<div class="p230DrawerHead"><div><span>POKER PRO</span><strong>Настройки стола</strong></div><button class="btn" id="p230SettingsClose">Закрыть</button></div><div class="p230DrawerBody"><label class="p230Setting"><div><strong>Подтверждать ALL-IN</strong><small>Защита от случайного выставления всего стека.</small></div><input class="p230Toggle" id="p230ConfirmAllIn" type="checkbox"></label><label class="p230Setting"><div><strong>Auto Rebuy</strong><small>После завершения руки пополнять стек до минимального buy-in стола.</small></div><input class="p230Toggle" id="p230AutoRebuy" type="checkbox"></label><label class="p230Setting"><div><strong>Порог Auto Rebuy</strong><small>Пополнение срабатывает, если стек ниже выбранной доли buy-in.</small></div><select id="p230RebuyThreshold"><option value="25">25%</option><option value="50">50%</option><option value="75">75%</option></select></label><label class="p230Setting"><div><strong>Четырёхцветная колода</strong><small>♥ красные, ♦ синие, ♣ зелёные, ♠ тёмные.</small></div><input class="p230Toggle" id="p230FourColor" type="checkbox"></label><label class="p230Setting"><div><strong>Быстрые анимации</strong><small>Ускоряет сдачу и раскрытие карт без отключения эффектов.</small></div><input class="p230Toggle" id="p230FastAnimations" type="checkbox"></label><label class="p230Setting"><div><strong>Haptic feedback</strong><small>Короткая вибрация на Ваш ход и результат, если устройство поддерживает.</small></div><input class="p230Toggle" id="p230Haptic" type="checkbox"></label><div class="p230RebuyCard"><strong>REBUY ДО BUY-IN</strong><p id="p230RebuyText">Доступно между раздачами.</p><button class="btn" id="p230RebuyInside">Пополнить стек</button></div></div>`;game.appendChild(d)}if(!$('p230Confirm')){const m=document.createElement('div');m.id='p230Confirm';m.className='p230Confirm';m.innerHTML='<div class="p230ConfirmCard"><h3>Подтвердить ALL-IN?</h3><p id="p230ConfirmText">Будет выставлен весь доступный стек.</p><div class="p230ConfirmActions"><button class="btn" id="p230AllInCancel">Отмена</button><button class="btn primary" id="p230AllInOk">ALL-IN</button></div></div>';document.body.appendChild(m)}if(!$('p230Recovery')){const x=document.createElement('div');x.id='p230Recovery';x.className='p230Recovery';x.innerHTML='<div><strong>Незавершённая Poker-сессия</strong><span id="p230RecoveryText">Можно восстановить локальный стол без повторного списания buy-in.</span></div><button class="btn primary" id="p230Restore">Восстановить</button><button class="btn" id="p230Discard">Закрыть</button>';document.body.appendChild(x)}bindUI();applySettings();syncSettingsUI();return true}
function restoreControlFocus(target,container){
 if(target?.isConnected&&!target.disabled&&!target.hidden&&(!target.getClientRects||target.getClientRects().length))target.focus?.();
 if(container?.contains?.(document.activeElement))document.activeElement.blur?.();
}
function closeDrawer(){const drawer=$('p230Drawer'),open=drawer?.classList.contains('active');drawer?.classList.remove('active');$('p230SettingsBtn')?.setAttribute?.('aria-expanded','false');if(open)restoreControlFocus(drawerFocus,drawer);drawerFocus=null}
function keyboardUI(e){
 const modal=$('p230Confirm'),focusedModal=document.activeElement?.closest?.('[aria-modal="true"]');
 if(focusedModal&&focusedModal!==modal)return;
 if(modal?.classList.contains('active')){
  if(e.key==='Escape'){e.preventDefault();e.stopImmediatePropagation();closeConfirm();return}
  if(e.key!=='Tab')return;
  const controls=qa('button:not([disabled]),a[href],input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])',modal).filter(node=>!node.hidden&&(!node.getClientRects||node.getClientRects().length));
  const first=controls[0]||$('p230AllInCancel'),last=controls.at(-1)||first;
  if(!controls.length||!modal.contains?.(document.activeElement)||e.shiftKey&&document.activeElement===first||!e.shiftKey&&document.activeElement===last){e.preventDefault();e.stopImmediatePropagation();(e.shiftKey?last:first)?.focus?.()}
  return;
 }
 if(e.key==='Escape'&&$('p230Drawer')?.classList.contains('active')){e.preventDefault();e.stopImmediatePropagation();closeDrawer()}
}
function bindUI(){
 const trigger=$('p230SettingsBtn'),modal=$('p230Confirm');
 trigger?.setAttribute?.('aria-controls','p230Drawer');trigger?.setAttribute?.('aria-expanded',String($('p230Drawer')?.classList.contains('active')===true));
 if(modal&&!modal.dataset.v328Dialog){modal.dataset.v328Dialog='1';modal.setAttribute?.('role','dialog');modal.setAttribute?.('aria-modal','true');modal.setAttribute?.('aria-labelledby','p230ConfirmTitle');modal.setAttribute?.('aria-describedby','p230ConfirmText');modal.setAttribute?.('aria-hidden',String(!modal.classList.contains('active')));const title=modal.querySelector('h3');if(title)title.id='p230ConfirmTitle'}
 if(trigger&&!trigger.dataset.bound){trigger.dataset.bound='1';trigger.onclick=()=>{$('p210Drawer')?.classList.remove('active');if($('p230Drawer')?.classList.contains('active'))closeDrawer();else{drawerFocus=trigger;$('p230Drawer')?.classList.add('active');trigger.setAttribute?.('aria-expanded','true')}syncSettingsUI()};$('p230SettingsClose').onclick=closeDrawer;$('p230RebuyBtn').onclick=()=>rebuy(false);$('p230RebuyInside').onclick=()=>rebuy(false);$('p230AutoCheck').onclick=()=>toggleAuto('check');$('p230CheckFold').onclick=()=>toggleAuto('checkfold');for(const [id,key] of [['p230ConfirmAllIn','confirmAllIn'],['p230AutoRebuy','autoRebuy'],['p230FourColor','fourColor'],['p230FastAnimations','fastAnimations'],['p230Haptic','haptic']])$(id).onchange=e=>{settings[key]=!!e.target.checked;saveSettings()};$('p230RebuyThreshold').onchange=e=>{settings.rebuyThreshold=[25,50,75].includes(Number(e.target.value))?Number(e.target.value):50;saveSettings()};$('p230AllInCancel').onclick=()=>closeConfirm();$('p230AllInOk').onclick=confirmAllIn;$('p230Restore').onclick=restoreSession;$('p230Discard').onclick=discardSession}
}
function syncSettingsUI(){if(!$('p230ConfirmAllIn'))return;$('p230ConfirmAllIn').checked=!!settings.confirmAllIn;$('p230AutoRebuy').checked=!!settings.autoRebuy;$('p230FourColor').checked=!!settings.fourColor;$('p230FastAnimations').checked=!!settings.fastAnimations;$('p230Haptic').checked=!!settings.haptic;$('p230RebuyThreshold').value=String(settings.rebuyThreshold||50);updateAutoButtons();updateRebuyUI()}
// Delayed UI actions belong to one owner, table and hand, never to a later snapshot.
function actionScope(st){
 if(!st?.you)return null;
 const identity=window.JRVXCASIdentityV300?.state?.(),requires=identity?.requiresAuthentication===true;
 const owner=requires?(identity?.authenticated&&identity?.user?.id?String(identity.user.id):''):String(identity?.user?.id||'development');
 if(!owner)return null;
 return{game:window.Poker59?.state?.game||null,key:JSON.stringify([owner,st.authoritative===true,st.roomId??'',st.tableId??'',st.mode??'',st.currency??unit(),unit(),st.handNo??'',st.you.id??'',st.you.seat??''])};
}
function sameScope(a,b){return!!a&&!!b&&a.game===b.game&&a.key===b.key}
function actionIntent(st){
 const scope=actionScope(st);if(!scope)return null;
 return{scope,key:JSON.stringify([st.revision??'',st.street??'',st.turnSeat??'',st.active!==false,!!st.you.yourTurn,st.you.stack??0,st.you.bet??0,st.you.toCall??0,st.currentBet??0,st.minRaiseTo??0,st.pot??0])};
}
function sameIntent(a,b){return!!a&&!!b&&sameScope(a.scope,b.scope)&&a.key===b.key}
function canAct(st){return!!st?.you?.yourTurn&&st.active!==false&&!!$('poker')?.classList.contains('active')&&(!st.authoritative||!!window.arcadeNetState?.connected)&&!!actionScope(st)}
function clearAuto(){clearTimeout(autoTimer);autoTimer=null;autoMode=null;autoOrigin=null;autoKey='';updateAutoButtons()}
function toggleAuto(mode){
 const enable=autoMode!==mode;clearAuto();const st=currentState(),scope=actionScope(st);
 if(!enable||!scope||!$('poker')?.classList.contains('active')||['waiting','showdown'].includes(st.street))return;
 autoMode=mode;autoOrigin=scope;updateAutoButtons();handleAuto(st);
}
function updateAutoButtons(){$('p230AutoCheck')?.classList.toggle('active',autoMode==='check');$('p230CheckFold')?.classList.toggle('active',autoMode==='checkfold')}
function currentState(){const P=window.Poker59,S=P?.state;if(S?.game)try{return S.game.state()}catch{}return S?.server||null}
function handleAuto(st){
 if(!autoMode)return;
 if(!sameScope(autoOrigin,actionScope(st))||!$('poker')?.classList.contains('active')||(st.authoritative&&!window.arcadeNetState?.connected)){clearAuto();return}
 if(!canAct(st)){if(autoTimer)clearAuto();return}
 if(autoMode==='check'&&Math.max(0,Number(st.you.toCall)||0)>0){clearAuto();toast('Auto Check','Ставка изменилась — требуется Ваше решение.');return}
 const intent=actionIntent(st),key=intent.key;if(key===autoKey)return;autoKey=key;clearTimeout(autoTimer);
 const mode=autoMode;
 autoTimer=setTimeout(()=>{
  autoTimer=null;const now=currentState();
  if(autoMode!==mode||!canAct(now)||!sameIntent(intent,actionIntent(now))){clearAuto();return}
  const toCall=Math.max(0,Number(now.you.toCall)||0),btn=mode==='checkfold'&&toCall>0?$('p59Fold'):$('p59Call');
  clearAuto();if(!btn||btn.disabled)return;haptic(10);btn.click();
 },160);
}
function allInIntent(st){
 const intent=actionIntent(st),target=Math.floor(Number($('p59Bet')?.value)||0),max=Math.max(0,Number(st?.you?.stack||0)+Number(st?.you?.bet||0));
 return intent&&max>0&&target>=max?{intent,target,max}:null;
}
function sameAllIn(a,b){return!!a&&!!b&&sameIntent(a.intent,b.intent)&&a.target===b.target&&a.max===b.max}
function openConfirm(st,trigger=$('p59Raise')){
 pendingAllIn=allInIntent(st);if(!pendingAllIn)return;
 const modal=$('p230Confirm');if(!modal.classList.contains('active'))confirmFocus=trigger||document.activeElement;
 $('p230ConfirmText').textContent='Будет выставлен весь стек: '+pendingAllIn.max.toLocaleString('ru-RU')+' '+unit()+'.';modal.classList.add('active');modal.setAttribute?.('aria-hidden','false');$('p230AllInCancel')?.focus?.();
}
function closeConfirm(){pendingAllIn=null;const modal=$('p230Confirm'),open=modal?.classList.contains('active');modal?.classList.remove('active');modal?.setAttribute?.('aria-hidden','true');if(open)restoreControlFocus(confirmFocus,modal);confirmFocus=null}
function confirmAllIn(){
 const pending=pendingAllIn,st=currentState(),button=$('p59Raise');closeConfirm();
 if(!pending||!canAct(st)||button?.disabled||!sameAllIn(pending,allInIntent(st))){toast('ALL-IN','Состояние стола изменилось. Выберите действие заново.');return}
 // Native click is synchronous: approval cannot leak into another click or hand.
 allowAllIn=pending;try{button?.click()}finally{allowAllIn=null}
}
function syncPendingActions(st){if(pendingAllIn&&(!canAct(st)||!sameAllIn(pendingAllIn,allInIntent(st))))closeConfirm()}
// Validated server snapshots and the development HeadsUpGame expose the legal
// minimum. A second big-blind floor incorrectly turns an open 2-chip bet into 4.
function bettingBounds(st){
 const local=getGame(),localRules=typeof Core?.HeadsUpGame==='function'&&local instanceof Core.HeadsUpGame;
 if(!st?.you||(st.authoritative!==true&&!localRules))return null;
 const stack=Number(st.you.stack),bet=Number(st.you.bet),minimum=Number(st.minRaiseTo),max=stack+bet;
 if(!Number.isSafeInteger(stack)||stack<0||!Number.isSafeInteger(bet)||bet<0||!Number.isSafeInteger(max)||!Number.isSafeInteger(minimum)||minimum<1)return null;
 return{min:Math.min(max,minimum),max};
}
function syncBettingBounds(st){
 const bounds=bettingBounds(st),input=$('p59Bet');if(!bounds||!input)return;
 input.min=String(bounds.min);input.max=String(bounds.max);
 const value=Number(input.value);if(st.you.yourTurn&&(!Number.isFinite(value)||value<bounds.min||value>bounds.max))input.value=String(bounds.min);
}
function authoritativeQuickSize(e){
 const button=e.target.closest?.('[data-p59-size],[data-v110-frac]');
 const kind=button?.dataset.p59Size||({min:'min','0.5':'half','0.75':'threeq','1':'pot','2':'twopot',allin:'allin'}[button?.dataset.v110Frac]);
 if(!['min','half','threeq','pot','twopot','allin'].includes(kind))return false;
 const st=currentState(),bounds=bettingBounds(st);if(!bounds)return false;
 // This selects an amount only; the existing Raise/ALL-IN action still owns
 // turn validation, confirmation, correlation and every server request.
 e.preventDefault();e.stopImmediatePropagation();
 if(button.disabled||!canAct(st))return true;
 const input=$('p59Bet');if(!input||input.disabled)return true;
 syncBettingBounds(st);
 const current=Math.max(0,Number(st.currentBet)||0),bb=Math.max(1,Number(st.bigBlind)||2),pot=Math.max(0,Number(st.pot)||0);
 let amount=bounds.min;
 if(kind==='allin')amount=bounds.max;
 else if(kind!=='min'){const fraction={half:.5,threeq:.75,pot:1,twopot:2}[kind];amount=Math.max(bounds.min,current+Math.max(bb,Math.ceil(pot*fraction)))}
 input.value=String(Math.max(bounds.min,Math.min(bounds.max,Math.floor(amount))));
 input.dispatchEvent(new Event('input',{bubbles:true}));input.dispatchEvent(new Event('change',{bubbles:true}));return true;
}
function interceptAllIn(e){
 if(authoritativeQuickSize(e))return;
 const action=e.target.closest?.('#p59Fold,#p59Call,#p59Raise,#p59Start');
 if(action){clearAuto();if(action.id!=='p59Raise')closeConfirm()}
 const b=e.target.closest?.('#p59Raise');if(!b)return;
 const st=currentState();
 if(allowAllIn&&sameAllIn(allowAllIn,allInIntent(st))){allowAllIn=null;return}
 if(!settings.confirmAllIn||!canAct(st))return;
 if(allInIntent(st)){e.preventDefault();e.stopImmediatePropagation();openConfirm(st,b)}
}
function cardSuitClass(c){return c?.[1]==='H'?'v230-heart':c?.[1]==='D'?'v230-diamond':c?.[1]==='C'?'v230-club':c?.[1]==='S'?'v230-spade':''}
function decorateSet(els,cards){els.forEach((el,i)=>{el.classList.remove('v230-heart','v230-diamond','v230-club','v230-spade','p230Best','p230Dim');const k=cardSuitClass(cards?.[i]);if(k)el.classList.add(k)})}
function bestFive(cards){cards=(cards||[]).filter(c=>c&&c!=='??');if(cards.length<5||!Core?.score5)return[];let best=null,bestCards=[];for(let a=0;a<cards.length-4;a++)for(let b=a+1;b<cards.length-3;b++)for(let c=b+1;c<cards.length-2;c++)for(let d=c+1;d<cards.length-1;d++)for(let e=d+1;e<cards.length;e++){const hand=[cards[a],cards[b],cards[c],cards[d],cards[e]],score=Core.score5(hand);if(!best||Core.compareScore(score,best)>0){best=score;bestCards=hand}}return bestCards}
function decorateCards(st){if(!st?.you)return;const hero=qa('#p59HeroCards .p59Card'),board=qa('#p59Community .p59Card'),opp=qa('#p59Seats .p59Seat:not(.me) .p62SeatCards .p59Card');decorateSet(hero,st.you.hole||[]);decorateSet(board,st.community||[]);const op=(st.seats||[]).find(p=>p&&String(p.id)!==String(st.you.id));decorateSet(opp,op?.hole||[]);const all=[...hero,...board,...opp];all.forEach(el=>el.classList.remove('p230Best','p230Dim'));if(st.street!=='showdown'||st.lastResult?.type==='fold'||!st.lastResult)return;const winIds=(st.lastResult.winners||[]).map(String),winner=(st.seats||[]).find(p=>p&&winIds.includes(String(p.id)))||st.you,best=new Set(bestFive([...(winner.hole||[]),...(st.community||[])]));const mappings=[];if(String(winner.id)===String(st.you.id))hero.forEach((el,i)=>mappings.push([el,st.you.hole?.[i]]));else opp.forEach((el,i)=>mappings.push([el,op?.hole?.[i]]));board.forEach((el,i)=>mappings.push([el,st.community?.[i]]));mappings.forEach(([el,c])=>el?.classList.toggle('p230Best',best.has(c)));all.forEach(el=>{if(!el.classList.contains('p230Best'))el.classList.add('p230Dim')})}
function productionPoker(){return window.JRVXCASIdentityV300?.state?.().requiresAuthentication===true}
function getGame(){return productionPoker()?null:window.Poker59?.state?.game||null}
function serverRebuyState(){const st=window.Poker59?.state?.server;if(!productionPoker()||!st?.authoritative||!st.you)return null;const target=Math.max(20,Number(Core?.tableById?.(st.tableId)?.min)||20);return{st,target,need:Math.max(0,target-Number(st.you.stack||0))}}
let pendingServerRebuy=null;
function serverRebuy(){const d=serverRebuyState();if(!d||d.st.active||!d.need||balance()<d.need||!window.arcadeNetState?.connected)return false;const key=d.st.roomId+':'+d.st.revision;if(pendingServerRebuy?.key!==key)pendingServerRebuy={key,amount:d.need,opId:'rebuy-'+window.JRVXCASV220Shared.newOperationId()};window.arcadeNetSend?.({type:'poker_rebuy',amount:pendingServerRebuy.amount,opId:pendingServerRebuy.opId});return true}
function rebuy(auto=false){if(productionPoker())return serverRebuy();const g=getGame();if(!g){if(!auto)toast('Rebuy','Доступен только в локальном Heads-Up.');return false}if(g.active){if(!auto)toast('Rebuy','Пополнение доступно между раздачами.');return false}const p=g.player(),target=Math.max(g.table?.min||0,Number(g.buyIn)||0),need=Math.max(0,target-Math.max(0,Number(p.stack)||0));if(!need){if(!auto)toast('Rebuy','Стек уже равен исходному buy-in.');return false}if(balance()<need){if(!auto)toast('Rebuy',`Нужно ещё ${need.toLocaleString('ru-RU')} ${unit()}.`,'!');return false}setBalance(balance()-need);p.stack+=need;window.Poker59.render(g.state());saveSession();toast(auto?'Auto Rebuy':'Rebuy',`+${need.toLocaleString('ru-RU')} ${unit()} в стек.`);haptic(14);return true}
function maybeAutoRebuy(st){if(productionPoker()){const d=serverRebuyState();if(settings.autoRebuy&&d&&!st.active&&st.street==='showdown'&&d.st.you.stack<Math.floor(d.target*(Number(settings.rebuyThreshold)||50)/100))serverRebuy();return}const g=getGame();if(!settings.autoRebuy||!g||g.active||st?.street!=='showdown')return;const p=g.player(),target=Math.max(g.table?.min||0,Number(g.buyIn)||0),threshold=Math.floor(target*(Number(settings.rebuyThreshold)||50)/100),key=`${g.handNo}|${p.stack}|${target}`;if(p.stack>=threshold||g.__v230RebuyKey===key)return;g.__v230RebuyKey=key;setTimeout(()=>rebuy(true),250)}
function updateRebuyUI(){const g=getGame(),b=$('p230RebuyBtn'),bi=$('p230RebuyInside'),text=$('p230RebuyText');if(productionPoker()){const d=serverRebuyState(),disabled=!d||d.st.active||!d.need||balance()<d.need||!window.arcadeNetState?.connected;if(b)b.disabled=disabled;if(bi)bi.disabled=disabled;if(text)text.textContent=!d?'Сначала войдите за серверный стол.':d.st.active?'Доступно после завершения раздачи.':`Пополнить стек до ${d.target} ${unit()} • нужно ${d.need} ${unit()}.`;return}const disabled=!g||g.active||g.player().stack>=g.buyIn;if(b)b.disabled=disabled;if(bi)bi.disabled=disabled;if(text)text.textContent=!g?'Доступно только в локальном Heads-Up.':g.active?'Доступно после завершения раздачи.':`Стек ${Math.floor(g.player().stack).toLocaleString('ru-RU')} / ${Math.floor(g.buyIn).toLocaleString('ru-RU')} ${unit()}.`}
function sessionData(){const g=getGame();if(!g)return null;return{v:2,ts:Date.now(),currency:unit(),tableId:g.table?.id||'1-2',playerSeat:g.playerSeat,botSeat:g.botSeat,buyIn:g.buyIn,players:JSON.parse(JSON.stringify(g.players)),dealerSeat:g.dealerSeat,smallBlindSeat:g.smallBlindSeat,bigBlindSeat:g.bigBlindSeat,handNo:g.handNo,street:g.street,active:g.active,deck:[...g.deck],community:[...g.community],pot:g.pot,currentBet:g.currentBet,lastRaiseSize:g.lastRaiseSize,turnSeat:g.turnSeat,pending:[...g.pending],log:JSON.parse(JSON.stringify(g.log||[])),lastResult:g.lastResult?JSON.parse(JSON.stringify(g.lastResult)):null}}
function sessionSignature(g=getGame()){if(!g)return'';const list=Array.isArray(g.players)?g.players:Object.values(g.players||{}),ps=list.map(p=>[p?.stack||0,p?.bet||0,p?.folded?1:0,p?.allIn?1:0,(p?.hole||[]).join('.')].join(':')).join('|');return[g.handNo,g.street,g.active?1:0,g.pot,g.currentBet,g.lastRaiseSize,g.turnSeat,(g.community||[]).join('.'),g.deck?.length||0,[...(g.pending||[])].join('.'),g.log?.length||0,g.lastResult?.text||'',ps].join('~')}
function flushSession(g=getGame(),sig=sessionSignature(g)){if(!g||!sig)return false;const d=sessionData();if(!d)return false;try{localStorage.setItem(SESSION_KEY,JSON.stringify(d));lastSavedSessionSig=sig;sessionWriteCount++;syncRecovery();return true}catch{return false}}
function saveSession(force=false){const g=getGame();if(!g)return false;const sig=sessionSignature(g);if(!force&&sig===lastSavedSessionSig)return false;if(force){clearTimeout(sessionSaveTimer);sessionSaveTimer=0;return flushSession(g,sig)}if(sessionSaveTimer)return false;sessionSaveTimer=setTimeout(()=>{sessionSaveTimer=0;const live=getGame(),liveSig=sessionSignature(live);if(live&&liveSig!==lastSavedSessionSig)flushSession(live,liveSig)},180);return true}
function loadSession(){if(productionPoker())return null;let raw='null';try{raw=localStorage.getItem(SESSION_KEY)||'null'}catch{}const d=safeJSON(raw,null);if(!d||Date.now()-Number(d.ts||0)>6*60*60*1000){try{localStorage.removeItem(SESSION_KEY)}catch{};return null}return d}
function clearSession(){clearTimeout(sessionSaveTimer);sessionSaveTimer=0;lastSavedSessionSig='';try{localStorage.removeItem(SESSION_KEY)}catch{};syncRecovery()}
function hydrate(d){if(!d||!Core?.HeadsUpGame)return null;const me=d.players?.[d.playerSeat]||{};const g=new Core.HeadsUpGame({tableId:d.tableId,buyIn:d.buyIn,playerId:me.id||'player',nickname:me.nickname||'Вы',seat:d.playerSeat});g.table=Core.tableById(d.tableId);g.playerSeat=Number(d.playerSeat)||0;g.botSeat=Number(d.botSeat)===0?0:1;g.buyIn=Math.max(g.table.min,Number(d.buyIn)||g.table.min);g.players=JSON.parse(JSON.stringify(d.players||g.players));g.dealerSeat=Number(d.dealerSeat);g.smallBlindSeat=Number(d.smallBlindSeat);g.bigBlindSeat=Number(d.bigBlindSeat);g.handNo=Math.max(0,Number(d.handNo)||0);g.street=String(d.street||'waiting');g.active=!!d.active;g.deck=Array.isArray(d.deck)?d.deck.slice():[];g.community=Array.isArray(d.community)?d.community.slice():[];g.pot=Math.max(0,Number(d.pot)||0);g.currentBet=Math.max(0,Number(d.currentBet)||0);g.lastRaiseSize=Math.max(g.table.bb,Number(d.lastRaiseSize)||g.table.bb);g.turnSeat=d.turnSeat==null?null:Number(d.turnSeat);g.pending=new Set(Array.isArray(d.pending)?d.pending.map(Number):[]);g.log=Array.isArray(d.log)?JSON.parse(JSON.stringify(d.log)):[];g.lastResult=d.lastResult?JSON.parse(JSON.stringify(d.lastResult)):null;return g}
function restoreSession(){const d=loadSession(),P=window.Poker59;if(!d||!P)return;if(P.state?.game||P.state?.server){toast('Poker','Сначала завершите текущий стол.');return}try{economy()?.setCurrency?.(d.currency==='MG'?'MG':'MS')}catch{};try{window.setActiveGameById?.('poker',false)}catch{};const g=hydrate(d);if(!g)return;P.state.game=g;P.state.server=null;P.state.ignoreServer=true;P.state.mode='jarvis';P.state.tableId=d.tableId;P.state.seat=d.playerSeat;P.render(g.state());$('p230Recovery')?.classList.remove('active');toast('Poker','Локальная сессия восстановлена без повторного buy-in.');haptic(24)}
function discardSession(){const d=loadSession();if(d&&!getGame()){const g=hydrate(d);if(g){const refund=Math.max(0,Math.floor(Number(g.player()?.stack)||0));if(refund)setBalance(balance()+refund)}}clearSession();$('p230Recovery')?.classList.remove('active');toast('Poker','Сессия закрыта. Стек вне активного банка возвращён.')}
function syncRecovery(){const d=loadSession(),x=$('p230Recovery');if(!x)return;const can=!!d&&!getGame()&&(!!$('v69Home')?.classList.contains('active')||!!$('poker')?.classList.contains('active'));x.classList.toggle('active',can);if(can){const me=d.players?.[d.playerSeat],t=Core?.tableById?.(d.tableId);$('p230RecoveryText').textContent=`Стол ${t?.sb||'?'} / ${t?.bb||'?'} • стек ${Math.floor(Number(me?.stack)||0).toLocaleString('ru-RU')} ${d.currency||'MS'} • раздача #${d.handNo||0}.`}}
function enhanceHistory(){const rows=window.JRVXCASV210?.history?.()||[],cards=qa('#p210DrawerList .p210Hand');cards.forEach((el,i)=>{if(el.querySelector('details')||!rows[i]?.actions?.length)return;const d=document.createElement('details');d.innerHTML='<summary>Действия раздачи</summary><div class="p230ActionRows">'+rows[i].actions.map(a=>`<span>${String(a.street||'').toUpperCase()} · ${String(a.text||'').replace(/[&<>]/g,'')}</span>`).join('')+'</div>';el.appendChild(d)})}
function scheduleHistoryEnhance(){if(!$('p210Drawer')?.classList.contains('active')||historyEnhanceTimer)return;historyEnhanceTimer=setTimeout(()=>{historyEnhanceTimer=0;enhanceHistory()},70)}
function frame(st){ensureUI();syncPendingActions(st);try{window.__jvrxV110Sync?.();window.__jvrxV112Sync?.()}catch{};syncBettingBounds(st);decorateCards(st);updateRebuyUI();handleAuto(st);maybeAutoRebuy(st);if(getGame())saveSession(false);if(st?.you?.yourTurn){const k=`${st.handNo}|${st.street}|${st.turnSeat}`;if(k!==lastTurnHaptic){lastTurnHaptic=k;haptic(12)}}if(st?.lastResult){const k=`${st.handNo}|${st.lastResult.text||''}`;if(k!==lastResultHaptic){lastResultHaptic=k;haptic((st.lastResult.winners||[]).map(String).includes(String(st.you?.id))?30:10)}}scheduleHistoryEnhance()}
function wrapFrame(){const cur=window.__jvrxPokerFrame;if(cur?.__v230){frameWrapped=true;return}const prior=cur;const fn=function(st){try{prior?.(st)}catch(e){console.warn('v230 previous frame',e)}try{frame(st)}catch(e){console.warn('v230 frame',e)}};fn.__v230=true;fn.__v210=!!prior?.__v210;window.__jvrxPokerFrame=fn;frameWrapped=true}
function wrapShowLobby(){const P=window.Poker59;if(!P||P.showLobby?.__v230)return;const old=P.showLobby.bind(P);const fn=function(cashout=true){const out=old(cashout);if(cashout)clearSession();clearAuto();closeConfirm();return out};fn.__v230=true;P.showLobby=fn}
function installRecoveryObserver(){try{recoveryObserver?.disconnect?.()}catch{};recoveryObserver=null;window.__JRVXV230RecoveryObserver=null;syncRecovery()}
function bind(){setVersion();ensureUI();wrapFrame();wrapShowLobby();installRecoveryObserver();window.addEventListener('click',interceptAllIn,true);window.addEventListener('keydown',keyboardUI,true);document.addEventListener('jrvx-cas-identity',()=>{clearAuto();closeConfirm()});document.addEventListener('click',e=>{if(e.target.closest?.('#p210HistoryBtn'))setTimeout(enhanceHistory,30);if(e.target.closest?.('#p59Leave,#p59Change,#poker [data-main-menu]')){clearAuto();closeConfirm();closeDrawer()}},{capture:false,passive:true});/* v3.0.17: final session save is handled centrally on pagehide. */[100,500,1200,2600,5400,7200].forEach(ms=>setTimeout(()=>{setVersion();ensureUI();wrapFrame();wrapShowLobby();syncRecovery()},ms));}
window.JRVXCASV230={version:VERSION,settings:()=>({...settings}),saveSession,loadSession,restoreSession,clearSession,rebuy,bestFive,syncRecovery,diagnostics:()=>({session:!!loadSession(),autoMode,settings:{...settings},localGame:!!getGame(),wallet:balance(),unit:unit(),sessionWrites:sessionWriteCount,sessionSavePending:!!sessionSaveTimer})};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',bind,{once:true});else bind();
})();
