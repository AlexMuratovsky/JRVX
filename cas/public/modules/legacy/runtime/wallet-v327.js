(function(){
  'use strict';
  const ROOT=document.getElementById('v69Root'); if(!ROOT)return;
  const ECO_KEY='jarvisCasEconomyV69', ACTIVE_KEY='jarvisCasActiveCurrencyV69', DAILY_KEY='jarvisCasDailyV69';
  const ecoDefault={ms:0,mg:0};
  function loadEco(){try{return Object.assign({},ecoDefault,JSON.parse(localStorage.getItem(ECO_KEY)||'{}'))}catch{return {...ecoDefault}}}
  const isDevelopmentEconomy=()=>window.JRVXCASIdentityV300?.state?.().mode==='development';
  let eco={...ecoDefault},developmentEconomyHydrated=false;
  function hydrateDevelopmentEconomy(){if(!isDevelopmentEconomy()||developmentEconomyHydrated)return;eco=loadEco();developmentEconomyHydrated=true;renderEconomy();syncLegacyWallet();syncGameCurrencyUI()}
  let activeCurrency=(()=>{try{return localStorage.getItem(ACTIVE_KEY)==='MG'?'MG':'MS'}catch{return 'MS'}})();
  const tables=[
    {id:'1-2',sb:1,bb:2,name:'Rookie Room',tag:'STARTER TABLE',min:20,a:'#202632',b:'#0b0f16',glow:'rgba(159,176,198,.13)',border:'rgba(169,184,204,.24)',feltA:'#405247',feltB:'#24342c',rail:'#75685c'},
    {id:'2-4',sb:2,bb:4,name:'Harbor Room',tag:'CASUAL TABLE',min:40,a:'#17263b',b:'#09121e',glow:'rgba(64,155,255,.16)',border:'rgba(75,164,255,.30)',feltA:'#176a67',feltB:'#0b3c43',rail:'#718b9d'},
    {id:'5-10',sb:5,bb:10,name:'Sapphire Room',tag:'CLASSIC TABLE',min:100,a:'#14263f',b:'#08121f',glow:'rgba(66,151,255,.20)',border:'rgba(83,164,255,.34)',feltA:'#17655f',feltB:'#0a3d3e',rail:'#829bb1'},
    {id:'10-20',sb:10,bb:20,name:'Violet Room',tag:'ROYAL TABLE',min:200,a:'#281d42',b:'#100a1d',glow:'rgba(144,94,255,.23)',border:'rgba(155,105,255,.34)',feltA:'#315d56',feltB:'#173931',rail:'#9b74c7'},
    {id:'25-50',sb:25,bb:50,name:'Obsidian Room',tag:'ELITE TABLE',min:500,a:'#17191f',b:'#07080b',glow:'rgba(207,215,230,.10)',border:'rgba(184,194,211,.26)',feltA:'#285c4a',feltB:'#102f25',rail:'#6f7785'},
    {id:'50-100',sb:50,bb:100,name:'Emerald Crown',tag:'HIGH ROLLER',min:1000,a:'#102d24',b:'#06150f',glow:'rgba(66,232,164,.25)',border:'rgba(80,229,173,.40)',feltA:'#12744f',feltB:'#073c2a',rail:'#d0a455'},
    {id:'100-200',sb:100,bb:200,name:'Imperial Room',tag:'ULTRA TABLE',min:2000,a:'#392a14',b:'#100b04',glow:'rgba(255,211,103,.32)',border:'rgba(255,215,113,.48)',feltA:'#2e6a4c',feltB:'#103521',rail:'#e0b75d'}
  ];
  const state={screen:'splash',currency:activeCurrency,variant:'holdem',table:0};
  const escapeHTML=value=>String(value??'').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
  function currentPokerOwner(){const auth=window.JRVXCASIdentityV300?.state?.();return auth?.mode==='development'?'development':auth?.authenticated?String(auth.user?.id||''):''}
  function cancelPokerLaunch(){return window.__JRVXPokerLaunchToken=(Number(window.__JRVXPokerLaunchToken)||0)+1}
  let pokerLaunchOwner=currentPokerOwner();
  document.addEventListener('jrvx-cas-identity',()=>{const owner=currentPokerOwner();if(owner!==pokerLaunchOwner){pokerLaunchOwner=owner;cancelPokerLaunch()}});
  function saveEco(){eco.ms=Math.max(0,Math.floor(Number(eco.ms)||0));eco.mg=Math.max(0,Math.floor(Number(eco.mg)||0));if(isDevelopmentEconomy())try{localStorage.setItem(ECO_KEY,JSON.stringify(eco))}catch{};renderEconomy()}
  function balance(cur=activeCurrency){return cur==='MG'?eco.mg:eco.ms}
  function blackjackCurrency(){const round=window.JRVXCASV220?.blackjack?.state;return round?.active&&['MS','MG'].includes(round.currency)?round.currency:activeCurrency}
  function setBalance(cur,val){if(cur==='MG')eco.mg=Math.max(0,Math.floor(Number(val)||0));else eco.ms=Math.max(0,Math.floor(Number(val)||0));saveEco();return balance(cur)}
  function setActiveCurrency(cur){activeCurrency=cur==='MG'?'MG':'MS';state.currency=activeCurrency;try{localStorage.setItem(ACTIVE_KEY,activeCurrency)}catch{};syncLegacyWallet();renderEconomy();syncGameCurrencyUI()}
  function fmt(n){return Math.max(0,Math.floor(Number(n)||0)).toLocaleString('ru-RU')}
  function playerName(){try{return playerProfile?.nickname||'Игрок'}catch{return 'Игрок'}}
  function playerId(){try{const v=String(playerProfile?.playerId||'').trim();return ['1101111','11101111','11101-111','JRVX-1101111'].includes(v)?'JRVX-JRVX11101111':(v||'—')}catch{return '—'}}
  function toast(title,text){const el=document.getElementById('v69Toast');document.getElementById('v69ToastTitle').textContent=title;document.getElementById('v69ToastText').textContent=text;el.classList.add('show');clearTimeout(toast.t);toast.t=setTimeout(()=>el.classList.remove('show'),2800)}
  function renderEconomy(){
    const map={v69MsTop:`${fmt(eco.ms)} MS`,v69MgTop:`${fmt(eco.mg)} MG`,v69MsHero:`${fmt(eco.ms)} MS`,v69MgHero:`${fmt(eco.mg)} MG`,v69MsCurrency:`${fmt(eco.ms)} MS`,v69MgCurrency:`${fmt(eco.mg)} MG`,v69ProfileMs:`${fmt(eco.ms)} MS`,v69ProfileMg:`${fmt(eco.mg)} MG`};
    for(const [id,v] of Object.entries(map)){const e=document.getElementById(id);if(e)e.textContent=v}
    document.getElementById('v69ActiveCurrencyLabel').textContent=state.currency;
    const pb=document.getElementById('pokerTokenBalance');if(pb)pb.textContent=`${fmt(balance())} ${activeCurrency}`;
    const bj=document.getElementById('blackjackBalance'),bjCurrency=blackjackCurrency();if(bj)bj.textContent=`${fmt(balance(bjCurrency))} ${bjCurrency}`;
    const rr=document.getElementById('rouletteBalance');if(rr)rr.textContent=`${fmt(balance())} ${activeCurrency}`;
  }
  function renderProfile(){const n=playerName(),id=playerId();for(const x of ['v69HeroName','v69DashName','v69ProfileName','v69LeaderName','v69LeaderboardYou']){const e=document.getElementById(x);if(e)e.textContent=n}for(const x of ['v69DashId','v69ProfileId']){const e=document.getElementById(x);if(e)e.textContent=id}try{document.getElementById('v69ProfileWins').textContent=playerProfile?.pokerWins||0;document.getElementById('v69ProfileHands').textContent=playerProfile?.pokerHands||0}catch{};{const top=document.getElementById('v69ProfileTop');if(top)top.textContent=(n||'JC').slice(0,2).toUpperCase()}}
  function showOnly(id){for(const el of ROOT.querySelectorAll('.v69Screen'))el.classList.toggle('active',el.id===id);for(const el of ROOT.querySelectorAll('.v69PanelScreen'))el.classList.toggle('active',el.id===id);state.screen=id;window.scrollTo(0,0)}
  function showModal(id){document.getElementById(id)?.classList.add('active')}
  function hideModal(id){document.getElementById(id)?.classList.remove('active')}
  function openHome(){cancelPokerLaunch();ROOT.hidden=false;ROOT.style.display='block';ROOT.style.visibility='visible';ROOT.style.opacity='1';showOnly('v69Home');renderProfile();renderEconomy();updateDaily();document.body.style.overflow='hidden';setTimeout(()=>{document.getElementById('pokerRoyaleOverlay')?.classList.remove('active')},30)}
  function splashToAge(){const s=document.getElementById('v69Splash');if(s.classList.contains('v69DimOut'))return;s.classList.add('v69DimOut');setTimeout(()=>{s.classList.remove('v69DimOut');showOnly('v69Age')},620)}
  function updateDaily(){if(window.JRVXCASIdentityV300?.state?.().mode!=='development'){document.getElementById('v69DailyState').textContent='Задания';document.getElementById('v69DailyText').textContent='Награды за подтверждённые сервером игры.';const b=document.getElementById('v69DailyClaim');b.disabled=false;b.textContent='Открыть задания';return;}let last='';try{last=localStorage.getItem(DAILY_KEY)||''}catch{}const today=new Date().toLocaleDateString('sv-SE');const claimed=last===today;document.getElementById('v69DailyState').textContent=claimed?'Получено':'500 MS';document.getElementById('v69DailyState').className=claimed?'v69DailyDone':'v69DailyReady';document.getElementById('v69DailyText').textContent=claimed?'Следующая награда будет доступна завтра.':'Награда доступна один раз в день.';const b=document.getElementById('v69DailyClaim');b.disabled=claimed;b.textContent=claimed?'Получено сегодня':'Получить 500 MS'}
  function claimDaily(){if(window.JRVXCASIdentityV300?.state?.().mode!=='development'){window.JRVXCASOpenGameProfile?.();document.querySelector('[data-v70-tab=progress]')?.click();window.JRVXProgress?.request?.();return;}let last='';try{last=localStorage.getItem(DAILY_KEY)||''}catch{}const today=new Date().toLocaleDateString('sv-SE');if(last===today){toast('Daily','Сегодняшняя награда уже получена.');return}eco.ms+=500;try{localStorage.setItem(DAILY_KEY,today)}catch{}saveEco();updateDaily();toast('Ежедневная награда','+500 MS начислено на баланс.')}
  function openInfo(kind){const title=document.getElementById('v69InfoTitle'),body=document.getElementById('v69InfoBody');if(kind==='news'){title.textContent='Новости JRVX CAS';body.innerHTML='<div class="v69Coming" style="padding:18px"><div class="icon">✦</div><h3>Обновление v3.0.17</h3><p>Production Hardening: подтверждённый JRVX ID handshake, heartbeat SERVER LINK и устойчивое переподключение для online-режимов.</p></div>'}else if(kind==='learn'){title.textContent='Обучение покеру';body.innerHTML='<div class="v69ProfileGrid"><div class="v69Stat"><span>Цель</span><strong>Собрать лучшую комбинацию</strong></div><div class="v69Stat"><span>Texas Hold’em</span><strong>2 карты + 5 общих</strong></div><div class="v69Stat"><span>Улицы</span><strong>Preflop → Flop → Turn → River</strong></div><div class="v69Stat"><span>Сильнейшая рука</span><strong>Royal Flush</strong></div></div><p style="color:#9aa7ca;line-height:1.7;margin-top:16px">В Texas Hold’em игрок получает две закрытые карты и использует их вместе с пятью общими картами стола. Можно собрать лучшую пятикарточную комбинацию либо выиграть банк ставками, если соперники сбросят карты.</p>'}else{title.textContent='JRVX CAS';body.innerHTML='<div class="v69Coming"><div class="icon">★</div><h3>Раздел в разработке</h3><p>Этот экран уже встроен в новую структуру клуба и будет подключён на следующем этапе.</p></div>'}showModal('v69InfoModal')}
  function openTournaments(){openInfo('coming')}
  function renderTables(){const track=document.getElementById('v69TableTrack');track.innerHTML=tables.map((t,i)=>`<div class="v69TableSlide"><article class="v69TableCard" style="--tA:${t.a};--tB:${t.b};--tGlow:${t.glow};--tBorder:${t.border};--feltA:${t.feltA};--feltB:${t.feltB};--rail:${t.rail}"><div class="v69TableName">${t.tag} • ${state.variant==='holdem'?'TEXAS HOLD’EM':'OMAHA'}</div><h3>${t.name}</h3><p>${state.currency==='MG'?'Premium Mura Gold table':'Mura Silver table'} • Min buy-in ${fmt(t.min)} ${state.currency}</p><div class="v69TableDetails"><span>${state.variant==='holdem'?'2 hole cards':'4 hole cards'}</span><span>${state.variant==='holdem'?'Online table':'Omaha layout'}</span><span>${state.currency}</span></div><div class="v69Felt"></div><div class="v69BlindBadge">Блайнды ${t.sb} / ${t.bb} ${state.currency}</div></article></div>`).join('');track.style.transform=`translateX(-${state.table*100}%)`;document.getElementById('v69TableCounter').textContent=`${state.table+1} / ${tables.length}`;document.getElementById('v69ActiveCurrencyLabel').textContent=state.currency;document.querySelectorAll('.v69VariantToggle [data-variant]').forEach(b=>b.classList.toggle('active',b.dataset.variant===state.variant))}
  function openTables(){cancelPokerLaunch();showOnly('v69TablesScreen');document.getElementById('v69CurrencyStep').hidden=false;document.getElementById('v69TableStep').hidden=true;document.getElementById('v69TableSubtitle').textContent='Шаг 1 из 2 — выберите валюту.';renderEconomy()}
  function chooseCurrency(cur){state.currency=cur;setActiveCurrency(cur);document.getElementById('v69CurrencyStep').hidden=true;document.getElementById('v69TableStep').hidden=false;document.getElementById('v69TableSubtitle').textContent='Шаг 2 из 2 — выберите формат и пролистайте столы.';state.table=0;renderTables();window.scrollTo(0,0)}
  function moveTable(delta){state.table=(state.table+delta+tables.length)%tables.length;const track=document.getElementById('v69TableTrack');track.style.transform=`translateX(-${state.table*100}%)`;document.getElementById('v69TableCounter').textContent=`${state.table+1} / ${tables.length}`}
  function selectVariant(v){state.variant=v==='omaha'?'omaha':'holdem';renderTables()}
  function syncLegacyWallet(){try{if(window.arcadeNetState){window.arcadeNetState.muraTokens=balance();window.arcadeNetState.pokerTokens=balance()}if(typeof playerProfile!=='undefined')playerProfile.pokerTokens=balance()}catch{}}
  function patchEconomyFunctions(){
    try{window.muraTokenBalance=function(){return balance()};muraTokenBalance=window.muraTokenBalance}catch{}
    try{window.setMuraTokenBalance=function(value){setBalance(activeCurrency,value);syncLegacyWallet();try{if(typeof savePlayerProfile==='function')savePlayerProfile()}catch{};try{if(typeof casinoRefresh==='function')casinoRefresh()}catch{};return balance()};setMuraTokenBalance=window.setMuraTokenBalance}catch{}
    try{window.casinoRefresh=function(){const b=`${fmt(balance())} ${activeCurrency}`,bjCurrency=blackjackCurrency();const bj=document.getElementById('blackjackBalance'),rr=document.getElementById('rouletteBalance');if(bj)bj.textContent=`${fmt(balance(bjCurrency))} ${bjCurrency}`;if(rr)rr.textContent=b;renderEconomy()};casinoRefresh=window.casinoRefresh}catch{}
    syncLegacyWallet();
  }
  function closeRootForGame(){ROOT.hidden=true;ROOT.style.display='none';document.body.style.overflow='';document.getElementById('pokerRoyaleOverlay')?.classList.remove('active')}
  function gameCurrencyBar(gameId){const game=document.getElementById(gameId);const head=game?.querySelector('.gamehead');if(!head||head.querySelector('.v69GameCurrency'))return;const bar=document.createElement('div');bar.className='v69GameCurrency';bar.innerHTML='<button data-cur="MS">MS</button><button data-cur="MG">MG</button>';head.querySelector('div')?.appendChild(bar);bar.querySelectorAll('button').forEach(b=>b.onclick=()=>setActiveCurrency(b.dataset.cur));syncGameCurrencyUI()}
  function syncGameCurrencyUI(){document.querySelectorAll('.v69GameCurrency button').forEach(b=>b.classList.toggle('active',b.dataset.cur===activeCurrency));renderEconomy();setTimeout(syncCasinoUnits,0)}
  function launchPoker(mode='online',tableId='1-2',friendId=''){
    const launchToken=cancelPokerLaunch(),launchOwner=currentPokerOwner();pokerLaunchOwner=launchOwner;
    setActiveCurrency(state.currency||activeCurrency);closeRootForGame();
    try{setActiveGameById('poker',false)}catch(e){console.warn(e)}
    const t=tables.find(x=>x.id===tableId)||tables[0];
    const configureAndJoin=(attempt=0)=>{
      // Loading a table may outlive navigation or an account. A cancelled
      // launch must never submit its eventual buy-in in the background.
      if(Number(window.__JRVXPokerLaunchToken)!==launchToken||currentPokerOwner()!==launchOwner)return;
      if(!document.getElementById('poker')?.classList.contains('active')){cancelPokerLaunch();return}
      const P=window.Poker59;
      if((!P?.state||!P?.join)&&attempt<30){setTimeout(()=>configureAndJoin(attempt+1),100);return}
      if(!P?.state||!P?.join){toast('Poker','Не удалось инициализировать стол.');return}
      try{if(P.state.game||P.state.server)P.showLobby(true)}catch{}
      try{P.state.mode=mode;P.state.tableId=tableId;P.state.seat=0}catch{}
      try{const tb=document.querySelector(`#p59Tables [data-table-id="${tableId}"]`)||document.querySelector(`#p59Tables [data-p59-table="${tableId}"]`);tb?.click()}catch{}
      try{const input=document.getElementById('p59BuyIn');if(input){input.min=String(t.min);input.value=String(t.min)}}catch{}
      try{document.querySelector(`[data-p59-mode="${mode}"]`)?.click()}catch{}
      if(mode==='friend'){try{const dst=document.getElementById('p59Friend');if(dst&&friendId)dst.value=friendId}catch{}}
      try{const gt=document.getElementById('v68PokerGateTitle'),gx=document.getElementById('v68PokerGateText');if(gt)gt.textContent=mode==='online'?'Подключаем Texas Hold’em Online…':mode==='friend'?'Подключаем приватный стол…':'JRVX CAS готовит heads-up стол…';if(gx)gx.textContent=`${t.name} • блайнды ${t.sb}/${t.bb} ${activeCurrency}. Повторный выбор стола отключён.`}catch{}
      try{P.join()}catch(e){console.warn(e)}
      setTimeout(syncCasinoUnits,120);
    };
    try{const title=document.querySelector('#poker .pokerGameHead h2');if(title)title.textContent='JRVX CAS POKER'}catch{}
    configureAndJoin();
  }
  function enterSelectedTable(){const t=tables[state.table];if(state.variant==='omaha'){toast('Omaha','Интерфейс столов готов. Полноценная логика Omaha пока в разработке.');return}if(!window.arcadeNetState?.connected){toast('ONLINE','Сервер не подключён. Откройте сайт через JRVX сервер.');return}launchPoker('online',t.id)}
  function quickPlay(){state.currency=activeCurrency;state.variant='holdem';state.table=0;launchPoker('jarvis','1-2')}
  function privatePlay(){
    state.currency=activeCurrency;state.variant='holdem';state.table=0;
    const title=document.getElementById('v69InfoTitle'),body=document.getElementById('v69InfoBody');title.textContent='Частная игра';
    let opts=[];try{opts=[...(document.getElementById('p59Friend')?.options||[])].filter(o=>o.value).map(o=>({value:o.value,label:o.textContent||o.value}))}catch{}
    body.innerHTML=`<div class="v69Coming" style="padding:18px"><div class="icon">♥</div><h3>Играть с другом</h3><p>Выберите друга и откройте приватный стол 1 / 2 ${activeCurrency}.</p>${opts.length?`<div class="v69Field" style="max-width:420px;margin:18px auto"><label>Друг</label><select id="v69PrivateFriend" style="width:100%;padding:13px 14px;border-radius:15px;border:1px solid rgba(103,119,160,.45);background:#070c16;color:#fff">${opts.map(o=>`<option value="${escapeHTML(o.value)}">${escapeHTML(o.label)}</option>`).join('')}</select></div><button class="v69Btn primary" id="v69PrivateStart">Войти за стол</button>`:'<div class="v69Stat" style="max-width:520px;margin:18px auto;text-align:left"><span>Список друзей</span><strong>Пока пуст</strong></div>'}</div>`;
    showModal('v69InfoModal');
    const b=document.getElementById('v69PrivateStart');if(b)b.onclick=()=>{const id=document.getElementById('v69PrivateFriend')?.value||'';hideModal('v69InfoModal');launchPoker('friend','1-2',id)};
  }
  function syncCasinoUnits(){
    // Settlements and recorded hands retain the currency in which they happened.
    // Only current controls and decorative labels follow the selected wallet.
    const fixedCurrency='.v69GameCurrency,[data-open-token-shop],.casinoMessage,#bjMessage,#rouletteMessage,#blackjackSessionHistory,#blackjackSessionStats,#rouletteHistory,.v220BjHandChip,[data-currency-fixed]';
    for(const id of ['blackjack','roulette']){const root=document.getElementById(id);if(!root||!root.classList.contains('active'))continue;const currency=id==='blackjack'?blackjackCurrency():activeCurrency;const w=document.createTreeWalker(root,NodeFilter.SHOW_TEXT,{acceptNode(n){const p=n.parentElement;if(!p||['SCRIPT','STYLE','TEXTAREA'].includes(p.tagName)||p.closest?.(fixedCurrency)||/\bMS\s*(?:\/|или|и)\s*MG\b/.test(n.nodeValue||''))return NodeFilter.FILTER_REJECT;return /\b(?:MT|MS|MG)\b/.test(n.nodeValue||'')?NodeFilter.FILTER_ACCEPT:NodeFilter.FILTER_REJECT}});const nodes=[];while(w.nextNode())nodes.push(w.currentNode);for(const n of nodes)n.nodeValue=n.nodeValue.replace(/\b(?:MT|MS|MG)\b/g,currency)}
    renderEconomy();
  }
  window.v90SyncCasinoUnits=syncCasinoUnits;
  function launchSimpleGame(id){cancelPokerLaunch();closeRootForGame();try{setActiveGameById(id,false)}catch(e){console.warn(e)}setTimeout(()=>{gameCurrencyBar(id);syncGameCurrencyUI();syncCasinoUnits()},300)}
  function returnHome(){try{if(typeof arcadeNetPokerLeave==='function'&&document.getElementById('poker')?.classList.contains('active'))arcadeNetPokerLeave()}catch{};try{document.body.classList.remove('game-mode');document.querySelectorAll('.game').forEach(g=>g.classList.remove('active'))}catch{};openHome()}
  window.JVRXRoutes={openTables,quickPlay,privatePlay,openTournaments,launchSimpleGame,returnHome};
  window.JRVXCASLaunchPoker=launchPoker;window.JRVXCASOpenTables=openTables;
  window.v69OpenMain=returnHome;
  function bindLegacyMainButtons(){['poker','blackjack','roulette'].forEach(id=>document.querySelectorAll(`#${id} [data-main-menu]`).forEach(old=>{const b=old.cloneNode(true);old.replaceWith(b);b.textContent='Главное меню';b.onclick=e=>{e.preventDefault();returnHome()}}));const pbtn=document.getElementById('pokerRoyaleLobbyBtn');if(pbtn){pbtn.textContent='Главное меню';pbtn.onclick=returnHome}}
  function openShop(){showModal('v69Shop');renderEconomy()}
  let exchangeEpoch=0,exchangeBusy=false,exchangeOwner='';
  const exchangeAccount=()=>{const auth=window.JRVXCASIdentityV300?.state?.();return auth?.authenticated?String(auth.user?.id||''):''};
  document.addEventListener('jrvx-cas-identity',()=>{const owner=exchangeAccount();if(owner!==exchangeOwner){exchangeOwner=owner;exchangeEpoch++}});
  function exchangeOperationId(){try{return crypto.randomUUID()}catch{return `exchange-${Date.now()}-${Math.random().toString(36).slice(2)}`}}
  async function exchangeRequest(pending,q){
    const controller=new AbortController();let timer;
    const deadline=new Promise((_,reject)=>{timer=setTimeout(()=>{controller.abort();reject(Error('exchange_timeout'))},12000)});
    try{return await Promise.race([(async()=>{const response=await fetch('/api/wallet/exchange',{method:'POST',credentials:'same-origin',cache:'no-store',headers:{'content-type':'application/json','accept':'application/json'},body:JSON.stringify({ownerId:pending.ownerId,operationId:pending.operationId,quantity:q}),signal:controller.signal});const data=await response.json().catch(()=>({ok:false,error:'invalid_response'}));return {response,data}})(),deadline])}finally{clearTimeout(timer)}
  }
  async function exchange(){
    if(exchangeBusy)return;
    const input=document.getElementById('v69ExchangeQty'),button=document.getElementById('v69ExchangeBtn');let q=Math.max(1,Math.min(10000,Math.floor(Number(input?.value)||1))),cost=q*300;
    if(isDevelopmentEconomy()){if(eco.ms<cost){toast('Обмен',`Недостаточно MS. Нужно ${fmt(cost)} MS.`);return}eco.ms-=cost;eco.mg+=q;saveEco();toast('Обмен выполнен',`−${fmt(cost)} MS • +${fmt(q)} MG`);return}
    const ownerId=exchangeAccount();if(ownerId!==exchangeOwner){exchangeOwner=ownerId;exchangeEpoch++}
    const epoch=exchangeEpoch,current=()=>epoch===exchangeEpoch&&exchangeAccount()===ownerId;
    if(!ownerId){toast('Обмен','Войдите через JRVX ID, чтобы выполнить обмен.');return}
    const pendingKey=`jrvxWalletExchangePendingV302:${ownerId}`;let pending=null,accepted=false;
    try{pending=JSON.parse(sessionStorage.getItem(pendingKey)||'null');if(pending&&(pending.ownerId!==ownerId||!Number.isSafeInteger(pending.quantity)||pending.quantity<1||pending.quantity>10000||typeof pending.operationId!=='string'||!pending.operationId))throw Error('invalid_pending');if(!pending){pending={ownerId,operationId:exchangeOperationId(),quantity:q};const encoded=JSON.stringify(pending);sessionStorage.setItem(pendingKey,encoded);if(sessionStorage.getItem(pendingKey)!==encoded)throw Error('pending_write_failed')}}catch{toast('Обмен','Браузер не смог сохранить запрос обмена. Разрешите сохранение данных сайта и повторите.');return}
    q=pending.quantity;if(input)input.value=String(q);updateExchangePreview();exchangeBusy=true;
    if(button){button.disabled=true;button.dataset.exchangeBusy='1';button.textContent='Обмен…'}
    try{
      const {response,data}=await exchangeRequest(pending,q);
      if(!response.ok||data.ok!==true){const error=Error(data.error||`http_${response.status}`);error.status=response.status;throw error}
      if(!current())return;accepted=true;
      try{sessionStorage.removeItem(pendingKey)}catch{}try{window.JRVXCASServerAccount?.apply?.(data)}catch{}try{Promise.resolve(window.JRVXCASServerAccount?.refresh?.()).catch(()=>{})}catch{}
      toast('Обмен выполнен',`−${fmt(data.exchange?.costMS??q*300)} MS • +${fmt(data.exchange?.receivedMG??q)} MG`)
    }catch(error){
      if(!current()||accepted)return;
      const code=String(error?.message||'exchange_failed');if(code==='intent_owner_mismatch'){toast('Аккаунт изменился','Проверьте вход перед повторным обменом.');try{Promise.resolve(window.JRVXCASIdentityV300?.refresh?.()).catch(()=>{})}catch{}return}if([400,409].includes(Number(error?.status)))try{sessionStorage.removeItem(pendingKey)}catch{}
      if(code==='insufficient_balance')toast('Обмен',`Недостаточно MS. Нужно ${fmt(q*300)} MS.`);else if(code==='unauthorized')toast('Обмен','Сессия JRVX ID истекла. Войдите снова.');else toast('Обмен','Не удалось подтвердить обмен сервером. Повторите попытку.')
    }finally{exchangeBusy=false;if(button){button.disabled=false;delete button.dataset.exchangeBusy;button.textContent='Обменять'}}
  }
  function updateExchangePreview(){const q=Math.max(1,Math.floor(Number(document.getElementById('v69ExchangeQty').value)||1));document.getElementById('v69ExchangeCost').textContent=`${fmt(q*300)} MS`}
  function rebrandText(root=document.body){/* v75: branding is explicit; no automatic CAS suffixing */}

  document.getElementById('v69Splash').addEventListener('click',splashToAge);document.getElementById('v69Splash').addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' ')splashToAge()});
  document.getElementById('v69Accept').onclick=openHome;document.getElementById('v69Decline').onclick=()=>showOnly('v69Denied');document.getElementById('v69ExitToSplash').onclick=()=>showOnly('v69Splash');
  document.getElementById('v69DailyClaim').onclick=claimDaily;document.getElementById('v69Tables').onclick=openTables;document.getElementById('v69QuickPlay').onclick=quickPlay;document.getElementById('v69Tournaments').onclick=openTournaments;
  document.getElementById('v69TablesBack').onclick=openHome;document.getElementById('v69ChangeCurrency').onclick=()=>{document.getElementById('v69CurrencyStep').hidden=false;document.getElementById('v69TableStep').hidden=true;document.getElementById('v69TableSubtitle').textContent='Шаг 1 из 2 — выберите валюту.'};
  document.querySelectorAll('.v69CurrencyCard[data-currency]').forEach(c=>c.onclick=()=>chooseCurrency(c.dataset.currency));document.querySelectorAll('.v69VariantToggle [data-variant]').forEach(b=>b.onclick=()=>selectVariant(b.dataset.variant));document.getElementById('v69PrevTable').onclick=()=>moveTable(-1);document.getElementById('v69NextTable').onclick=()=>moveTable(1);document.getElementById('v69EnterTable').onclick=enterSelectedTable;
  ['v69ShopTop','v69BalanceShop','v69WalletOpen'].forEach(id=>document.getElementById(id).onclick=openShop);['v69ProfileTop','v69ProfileBtn'].forEach(id=>document.getElementById(id).onclick=()=>{renderProfile();showModal('v69Profile')});document.getElementById('v69LeaderboardBtn').onclick=()=>showModal('v69Leaderboard');
  document.querySelectorAll('[data-close]').forEach(b=>b.onclick=()=>hideModal(b.dataset.close));document.querySelectorAll('.v69Modal').forEach(m=>m.addEventListener('click',e=>{if(e.target===m)m.classList.remove('active')}));
  document.querySelectorAll('[data-pack]').forEach(b=>b.onclick=()=>toast('Магазин MG',`${Number(b.dataset.pack).toLocaleString('ru-RU')} MG выбрано. Реальная оплата будет подключена позже.`));document.getElementById('v69ExchangeQty').addEventListener('input',updateExchangePreview);document.getElementById('v69ExchangeBtn').onclick=exchange;
  document.querySelectorAll('[data-v69-action]').forEach(el=>el.addEventListener('click',()=>{const a=el.dataset.v69Action;if(a==='news'||a==='learn')openInfo(a);else if(a==='private')privatePlay();else if(a==='roulette')launchSimpleGame('roulette');else if(a==='blackjack')launchSimpleGame('blackjack')}));

  document.addEventListener('jrvx-cas-identity',()=>{const auth=window.JRVXCASIdentityV300?.state?.();if(auth?.mode==='development'){hydrateDevelopmentEconomy();return}developmentEconomyHydrated=false;try{localStorage.removeItem(ECO_KEY)}catch{}if(!auth?.authenticated){eco={...ecoDefault};renderEconomy();syncLegacyWallet();syncGameCurrencyUI()}});

  /* Neutralize v68 auto-overlay, own entry flow always starts from splash. */
  try{localStorage.setItem('jarvisCasinoResponsibleV68','yes')}catch{}
  setTimeout(()=>{document.getElementById('v68SafetyOverlay')?.classList.remove('active');document.getElementById('pokerRoyaleOverlay')?.classList.remove('active')},420);
  patchEconomyFunctions();renderEconomy();renderProfile();updateDaily();renderTables();updateExchangePreview();bindLegacyMainButtons();gameCurrencyBar('blackjack');gameCurrencyBar('roulette');rebrandText(document.body);
  const obs={disconnect(){}}; /* v75: legacy brand observer disabled */
  window.JVRXCasEconomy={
    get:()=>({ms:Math.max(0,Math.floor(Number(eco.ms)||0)),mg:Math.max(0,Math.floor(Number(eco.mg)||0)),currency:activeCurrency}),
    set:(next={})=>{if(next.ms!=null)eco.ms=Math.max(0,Math.floor(Number(next.ms)||0));if(next.mg!=null)eco.mg=Math.max(0,Math.floor(Number(next.mg)||0));saveEco();syncLegacyWallet();renderEconomy();syncGameCurrencyUI();return{ms:eco.ms,mg:eco.mg,currency:activeCurrency}},
    setCurrency:(cur)=>{setActiveCurrency(cur==='MG'?'MG':'MS');return activeCurrency},
    balance:(cur=activeCurrency)=>cur==='MG'?eco.mg:eco.ms
  };
  document.body.style.overflow='hidden';showOnly('v69Splash');
})();
