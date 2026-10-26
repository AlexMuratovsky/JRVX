(function(){
  'use strict';
  const ROOT=document.getElementById('v69Root'); if(!ROOT)return;
  const ECO_KEY='jrvxCasMGDevelopmentV330';
  const $=id=>document.getElementById(id);
  const safeAmount=value=>Number.isSafeInteger(value)&&value>=0;
  const ecoDefault={mg:0};let eco={...ecoDefault},activeCurrency='MG',balanceConfirmed=false;
  const isDevelopmentEconomy=()=>window.JRVXCASIdentityV300?.state?.().mode==='development';
  function hydrateDevelopmentEconomy(){/* Legacy browser saves are never financial authority. */}
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
  function saveEco(){if(isDevelopmentEconomy())try{localStorage.setItem(ECO_KEY,JSON.stringify({mg:eco.mg}))}catch{};renderEconomy()}
  function balance(){return eco.mg}
  function blackjackCurrency(){return 'MG'}
  function setBalance(cur,value){if(safeAmount(value)){eco.mg=value;saveEco()}return eco.mg}
  function setActiveCurrency(){activeCurrency='MG';state.currency='MG';syncLegacyWallet();renderEconomy();syncGameCurrencyUI()}
  function fmt(value){return window.JRVXCASMoneyV330.formatCompact(value,{currency:false})}
  function exact(value){return window.JRVXCASMoneyV330.formatExact(value)}
  function moneyNode(id,value){const node=$(id);if(!node)return;node.textContent=window.JRVXCASMoneyV330.formatCompact(value);node.title=exact(value);node.setAttribute?.('aria-label',exact(value))}
  function playerName(){try{return playerProfile?.nickname||'Игрок'}catch{return 'Игрок'}}
  function playerId(){try{const v=String(playerProfile?.playerId||'').trim();return ['1101111','11101111','11101-111','JRVX-1101111'].includes(v)?'JRVX-JRVX11101111':(v||'—')}catch{return '—'}}
  function toast(title,text){const el=document.getElementById('v69Toast');document.getElementById('v69ToastTitle').textContent=title;document.getElementById('v69ToastText').textContent=text;el.classList.add('show');clearTimeout(toast.t);toast.t=setTimeout(()=>el.classList.remove('show'),2800)}
  function renderEconomy(){
    for(const id of ['v69MgTop','v69MgHero','v69MgCurrency','v69ProfileMg','pokerTokenBalance','blackjackBalance','rouletteBalance'])moneyNode(id,eco.mg);
    if($('v69ActiveCurrencyLabel'))$('v69ActiveCurrencyLabel').textContent='MG';
    const accountButton=$('jrvxCasAccountButton');if(account()&&balanceConfirmed){accountButton?.setAttribute?.('data-mg-balance',window.JRVXCASMoneyV330.formatCompact(eco.mg));accountButton?.setAttribute?.('data-mg-exact',exact(eco.mg));accountButton?.setAttribute?.('aria-label','Аккаунт. Баланс '+exact(eco.mg))}else{accountButton?.removeAttribute?.('data-mg-balance');accountButton?.removeAttribute?.('data-mg-exact');accountButton?.removeAttribute?.('aria-label')}
  }
  function renderProfile(){const n=playerName(),id=playerId();for(const x of ['v69HeroName','v69DashName','v69ProfileName','v69LeaderName','v69LeaderboardYou']){const e=document.getElementById(x);if(e)e.textContent=n}for(const x of ['v69DashId','v69ProfileId']){const e=document.getElementById(x);if(e)e.textContent=id}try{document.getElementById('v69ProfileWins').textContent=playerProfile?.pokerWins||0;document.getElementById('v69ProfileHands').textContent=playerProfile?.pokerHands||0}catch{};{const top=document.getElementById('v69ProfileTop');if(top)top.textContent=(n||'JC').slice(0,2).toUpperCase()}}
  function showOnly(id){for(const el of ROOT.querySelectorAll('.v69Screen'))el.classList.toggle('active',el.id===id);for(const el of ROOT.querySelectorAll('.v69PanelScreen'))el.classList.toggle('active',el.id===id);state.screen=id;window.scrollTo(0,0)}
  function showModal(id){document.getElementById(id)?.classList.add('active')}
  function hideModal(id){document.getElementById(id)?.classList.remove('active')}
  function openHome(){cancelPokerLaunch();ROOT.hidden=false;ROOT.style.display='block';ROOT.style.visibility='visible';ROOT.style.opacity='1';showOnly('v69Home');renderProfile();renderEconomy();updateDaily();document.body.style.overflow='hidden';setTimeout(()=>{document.getElementById('pokerRoyaleOverlay')?.classList.remove('active')},30)}
  function splashToAge(){const s=document.getElementById('v69Splash');if(s.classList.contains('v69DimOut'))return;s.classList.add('v69DimOut');setTimeout(()=>{s.classList.remove('v69DimOut');showOnly('v69Age')},620)}
  let dailyReadSequence=0,dailyRefreshTimer=0,accountEpoch=0,accountOwner='',daily=null,dailyBusy=false,dailyRequest=null,catalog=null,catalogBusy=false,catalogRequest=null,checkoutRequest=null,checkoutURL=null,walletChannel=null;
  const account=()=>{const auth=window.JRVXCASIdentityV300?.state?.();return auth?.authenticated?String(auth.user?.id||''):''};
  const active=(owner,epoch)=>!!owner&&account()===owner&&accountEpoch===epoch;
  const pendingKey=(kind,owner)=>'jrvxCASMGV330:'+kind+':'+owner;
  function updateDaily(){
    const button=$('v69DailyClaim'),label=$('v69DailyState'),text=$('v69DailyText'),signedIn=!!account(),claimed=daily?.claimed===true;
    if(label){label.textContent=claimed?'Получено':daily?window.JRVXCASMoneyV330.formatCompact(10000):signedIn?'Проверка…':'Войдите';label.className=claimed?'v69DailyDone':'v69DailyReady';label.title=exact(10000)}
    if(text)text.textContent=claimed?'Награда за этот серверный день уже получена.':'10 000 MG один раз за календарный день сервера.';
    if(button){button.disabled=!signedIn||!daily||claimed||dailyBusy;button.textContent=dailyBusy?'Проверяем…':claimed?'Получено сегодня':signedIn?'Получить 10K MG':'Войдите через JRVX ID';button.title=exact(10000)}
  }
  async function requestJSON(path,body){
    const controller=new AbortController();let timer;
    const timeout=new Promise((_,reject)=>{timer=setTimeout(()=>{controller.abort();reject(Error('request_timeout'))},12000)});
    try{return await Promise.race([(async()=>{const response=await fetch(path,{method:body?'POST':'GET',credentials:'same-origin',cache:'no-store',headers:{accept:'application/json',...(body?{'content-type':'application/json'}:{})},...(body?{body:JSON.stringify(body)}:{}),signal:controller.signal});const data=await response.json().catch(()=>({ok:false,error:'invalid_response'}));if(!response.ok||data.ok===false){const error=Error(data.error||'request_failed');error.status=response.status;throw error}return data})(),timeout])}finally{clearTimeout(timer)}
  }
  function applySnapshot(data){
    const owner=account(),id=String(data?.account?.id||data?.jrvxId||data?.playerId||'');if(!owner||owner!==id)return false;
    if(data.economy?.version==='mg-v330'&&safeAmount(data.wallet?.MG)){balanceConfirmed=true;renderEconomy()}
    const next=data.dailyBonus||data.daily;if(next&&/^\d{4}-\d{2}-\d{2}$/.test(next.day)&&typeof next.claimed==='boolean'&&next.amount===10000){if(!daily||next.day>daily.day||next.day===daily.day&&(!daily.claimed||next.claimed)){daily={day:next.day,claimed:next.claimed,amount:10000,nextAvailableAt:next.nextAvailableAt||next.nextClaimAt};const remaining=Number(next.nextAvailableAt||next.nextClaimAt)-Number(next.serverTime);if(Number.isSafeInteger(remaining)&&remaining>0&&remaining<=86400000){clearTimeout(dailyRefreshTimer);dailyRefreshTimer=setTimeout(()=>{dailyRefreshTimer=0;if(account()===owner)void refreshDaily()},remaining+100)}}updateDaily()}
    return true;
  }
  async function refreshDaily(){
    const owner=account(),epoch=accountEpoch,sequence=++dailyReadSequence;if(!owner){daily=null;updateDaily();return null}
    try{const data=await requestJSON('/api/me');if(!active(owner,epoch)||sequence!==dailyReadSequence)return null;window.JRVXCASServerAccount?.apply?.(data);applySnapshot(data);return daily}catch{if(active(owner,epoch)&&sequence===dailyReadSequence){daily=null;updateDaily()}return null}
  }
  function durableIntent(kind,owner,extra={}){
    const key=pendingKey(kind,owner);let saved;
    try{saved=JSON.parse(sessionStorage.getItem(key)||'null');if(saved&&(saved.ownerId!==owner||typeof saved.operationId!=='string'||!saved.operationId||Object.entries(extra).some(([k,v])=>saved[k]!==v)))throw Error('pending_invalid');if(!saved){saved={ownerId:owner,operationId:crypto.randomUUID(),...extra};const encoded=JSON.stringify(saved);sessionStorage.setItem(key,encoded);if(sessionStorage.getItem(key)!==encoded)throw Error('pending_storage_unavailable')}return saved}catch{throw Error('pending_storage_unavailable')}
  }
  function clearIntent(kind,owner){try{sessionStorage.removeItem(pendingKey(kind,owner))}catch{}}
  function notifyOtherTabs(owner){try{walletChannel?.postMessage({type:'refresh',ownerId:owner})}catch{}}
  async function claimDaily(){
    if(dailyRequest)return dailyRequest;const owner=account(),epoch=accountEpoch;if(!owner||!daily||daily.claimed)return false;
    let intent;try{intent=durableIntent('daily',owner)}catch{toast('Награда','Браузер не смог сохранить запрос. Разрешите сохранение данных сайта.');return false}
    dailyBusy=true;updateDaily();
    dailyRequest=(async()=>{try{const data=await requestJSON('/api/wallet/daily',intent);if(!active(owner,epoch))return false;window.JRVXCASServerAccount?.apply?.(data);applySnapshot(data);if(!daily?.claimed)await refreshDaily();if(!active(owner,epoch))return false;clearIntent('daily',owner);notifyOtherTabs(owner);toast('Ежедневная награда',daily?.claimed?'Статус получения 10 000 MG подтверждён сервером.':'Получение проверено. Обновляем состояние аккаунта.');return true}catch(error){if(active(owner,epoch)){if(error.status===401)daily=null;toast('Ежедневная награда','Сервер не подтвердил получение. Повторная попытка проверит прежний запрос.')}return false}finally{if(active(owner,epoch)){dailyBusy=false;dailyRequest=null;updateDaily()}}})();
    return dailyRequest;
  }
  function openInfo(kind){const title=document.getElementById('v69InfoTitle'),body=document.getElementById('v69InfoBody');if(kind==='news'){title.textContent='Новости JRVX CAS';body.innerHTML='<div class="v69Coming" style="padding:18px"><div class="icon">✦</div><h3>Обновление v3.0.17</h3><p>Production Hardening: подтверждённый JRVX ID handshake, heartbeat SERVER LINK и устойчивое переподключение для online-режимов.</p></div>'}else if(kind==='learn'){title.textContent='Обучение покеру';body.innerHTML='<div class="v69ProfileGrid"><div class="v69Stat"><span>Цель</span><strong>Собрать лучшую комбинацию</strong></div><div class="v69Stat"><span>Texas Hold’em</span><strong>2 карты + 5 общих</strong></div><div class="v69Stat"><span>Улицы</span><strong>Preflop → Flop → Turn → River</strong></div><div class="v69Stat"><span>Сильнейшая рука</span><strong>Royal Flush</strong></div></div><p style="color:#9aa7ca;line-height:1.7;margin-top:16px">В Texas Hold’em игрок получает две закрытые карты и использует их вместе с пятью общими картами стола. Можно собрать лучшую пятикарточную комбинацию либо выиграть банк ставками, если соперники сбросят карты.</p>'}else{title.textContent='JRVX CAS';body.innerHTML='<div class="v69Coming"><div class="icon">★</div><h3>Раздел в разработке</h3><p>Этот экран уже встроен в новую структуру клуба и будет подключён на следующем этапе.</p></div>'}showModal('v69InfoModal')}
  function openTournaments(){openInfo('coming')}
  function renderTables(){const track=document.getElementById('v69TableTrack');track.innerHTML=tables.map((t,i)=>`<div class="v69TableSlide"><article class="v69TableCard" style="--tA:${t.a};--tB:${t.b};--tGlow:${t.glow};--tBorder:${t.border};--feltA:${t.feltA};--feltB:${t.feltB};--rail:${t.rail}"><div class="v69TableName">${t.tag} • ${state.variant==='holdem'?'TEXAS HOLD’EM':'OMAHA'}</div><h3>${t.name}</h3><p>Mura Gold table • Min buy-in ${fmt(t.min)} ${state.currency}</p><div class="v69TableDetails"><span>${state.variant==='holdem'?'2 hole cards':'4 hole cards'}</span><span>${state.variant==='holdem'?'Online table':'Omaha layout'}</span><span>${state.currency}</span></div><div class="v69Felt"></div><div class="v69BlindBadge">Блайнды ${t.sb} / ${t.bb} ${state.currency}</div></article></div>`).join('');track.style.transform=`translateX(-${state.table*100}%)`;document.getElementById('v69TableCounter').textContent=`${state.table+1} / ${tables.length}`;document.getElementById('v69ActiveCurrencyLabel').textContent=state.currency;document.querySelectorAll('.v69VariantToggle [data-variant]').forEach(b=>b.classList.toggle('active',b.dataset.variant===state.variant))}
  function openTables(){cancelPokerLaunch();showOnly('v69TablesScreen');document.getElementById('v69CurrencyStep').hidden=true;document.getElementById('v69TableStep').hidden=false;document.getElementById('v69TableSubtitle').textContent='Выберите формат и стол. Все ставки в MG.';state.table=0;renderTables();renderEconomy()}
  function chooseCurrency(cur){state.currency='MG';setActiveCurrency();document.getElementById('v69CurrencyStep').hidden=true;document.getElementById('v69TableStep').hidden=false;document.getElementById('v69TableSubtitle').textContent='Выберите формат и пролистайте столы. Все ставки в MG.';state.table=0;renderTables();window.scrollTo(0,0)}
  function moveTable(delta){state.table=(state.table+delta+tables.length)%tables.length;const track=document.getElementById('v69TableTrack');track.style.transform=`translateX(-${state.table*100}%)`;document.getElementById('v69TableCounter').textContent=`${state.table+1} / ${tables.length}`}
  function selectVariant(v){state.variant=v==='omaha'?'omaha':'holdem';renderTables()}
  function syncLegacyWallet(){try{if(window.arcadeNetState){window.arcadeNetState.muraTokens=balance();window.arcadeNetState.pokerTokens=balance()}if(typeof playerProfile!=='undefined')playerProfile.pokerTokens=balance()}catch{}}
  function patchEconomyFunctions(){
    try{window.muraTokenBalance=function(){return balance()};muraTokenBalance=window.muraTokenBalance}catch{}
    try{window.setMuraTokenBalance=function(value){if(!isDevelopmentEconomy())return balance();setBalance(activeCurrency,value);syncLegacyWallet();try{if(typeof savePlayerProfile==='function')savePlayerProfile()}catch{};try{if(typeof casinoRefresh==='function')casinoRefresh()}catch{};return balance()};setMuraTokenBalance=window.setMuraTokenBalance}catch{}
    try{window.casinoRefresh=function(){const b=`${fmt(balance())} ${activeCurrency}`,bjCurrency=blackjackCurrency();const bj=document.getElementById('blackjackBalance'),rr=document.getElementById('rouletteBalance');if(bj)bj.textContent=`${fmt(balance(bjCurrency))} ${bjCurrency}`;if(rr)rr.textContent=b;renderEconomy()};casinoRefresh=window.casinoRefresh}catch{}
    syncLegacyWallet();
  }
  function closeRootForGame(){ROOT.hidden=true;ROOT.style.display='none';document.body.style.overflow='';document.getElementById('pokerRoyaleOverlay')?.classList.remove('active')}
  function gameCurrencyBar(gameId){const game=document.getElementById(gameId);const head=game?.querySelector('.gamehead');if(!head||head.querySelector('.v69GameCurrency'))return;const bar=document.createElement('div');bar.className='v69GameCurrency';bar.innerHTML='<span class="v330CurrencyUnit">MG</span>';head.querySelector('div')?.appendChild(bar);bar.querySelectorAll('button').forEach(b=>b.onclick=()=>setActiveCurrency(b.dataset.cur));syncGameCurrencyUI()}
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
  function syncCasinoUnits(){renderEconomy()}
  window.v90SyncCasinoUnits=syncCasinoUnits;
  function launchSimpleGame(id){cancelPokerLaunch();closeRootForGame();try{setActiveGameById(id,false)}catch(e){console.warn(e)}setTimeout(()=>{gameCurrencyBar(id);syncGameCurrencyUI();syncCasinoUnits()},300)}
  function returnHome(){try{if(typeof arcadeNetPokerLeave==='function'&&document.getElementById('poker')?.classList.contains('active'))arcadeNetPokerLeave()}catch{};try{document.body.classList.remove('game-mode');document.querySelectorAll('.game').forEach(g=>g.classList.remove('active'))}catch{};openHome()}
  window.JVRXRoutes={openTables,quickPlay,privatePlay,openTournaments,launchSimpleGame,returnHome};
  window.JRVXCASLaunchPoker=launchPoker;window.JRVXCASOpenTables=openTables;
  window.v69OpenMain=returnHome;
  function bindLegacyMainButtons(){['poker','blackjack','roulette'].forEach(id=>document.querySelectorAll(`#${id} [data-main-menu]`).forEach(old=>{const b=old.cloneNode(true);old.replaceWith(b);b.textContent='Главное меню';b.onclick=e=>{e.preventDefault();returnHome()}}));const pbtn=document.getElementById('pokerRoyaleLobbyBtn');if(pbtn){pbtn.textContent='Главное меню';pbtn.onclick=returnHome}}
  function openShop(){showModal('v69Shop');renderEconomy();void loadCatalog()}
  function renderCatalog(){
    const host=$('v69Shop')?.querySelector('.v69ShopGrid');if(!host)return;
    if(!catalog){host.textContent=catalogBusy?'Проверяем каталог магазина…':'Магазин временно недоступен. Откройте его повторно.';return}
    host.innerHTML=catalog.packages.map(pack=>`<article class="v69Pack"><div class="v69PackCoin">MG</div><strong title="${escapeHTML(exact(pack.mg))}">${escapeHTML(window.JRVXCASMoneyV330.formatCompact(pack.mg))}</strong><span>Mura Gold</span><div class="v69Price">${(pack.priceKopecks/100).toLocaleString('ru-RU')} ₽</div><button type="button" class="v69Btn gold" data-package-id="${escapeHTML(pack.id)}" ${!catalog.checkoutAvailable||checkoutRequest?'disabled':''}>${catalog.checkoutAvailable?'Купить':'Оплата недоступна'}</button></article>`).join('');
    host.querySelectorAll('[data-package-id]').forEach(button=>button.onclick=()=>void checkout(button.dataset.packageId));
    let status=$('v330ShopStatus');if(!status){status=document.createElement('p');status.id='v330ShopStatus';status.setAttribute('role','status');host.after?.(status)}if(status){status.textContent=catalog.checkoutAvailable?'Начисление выполняется сервером после подтверждения оплаты.':'Платёжный провайдер не подключён. Деньги и MG не списываются.';if(checkoutURL){status.textContent='Заказ подготовлен. ';const link=document.createElement('a');link.href=checkoutURL;link.target='_blank';link.rel='noopener noreferrer';link.textContent='Перейти к оплате';status.appendChild(link)}}
  }
  async function loadCatalog(){
    if(catalogRequest)return catalogRequest;const owner=account(),epoch=accountEpoch;catalogBusy=true;renderCatalog();
    const promise=(async()=>{try{const response=await requestJSON('/api/shop/catalog');const data={...response,packages:response.packages?.map(pack=>({...pack,mg:pack.mg??pack.amountMG}))};if(accountEpoch!==epoch||account()!==owner)return null;if(!Array.isArray(data.packages)||!data.packages.length||data.packages.some(pack=>typeof pack.id!=='string'||!pack.id||!safeAmount(pack.mg)||pack.mg===0||!safeAmount(pack.priceKopecks)))throw Error('invalid_catalog');catalog={packages:data.packages.map(({id,mg,priceKopecks})=>({id,mg,priceKopecks})),checkoutAvailable:data.checkoutAvailable===true||data.paymentsAvailable===true,provider:Array.isArray(data.providers)?data.providers[0]:undefined};return catalog}catch{if(accountEpoch===epoch)catalog=null;return null}finally{if(accountEpoch===epoch){catalogBusy=false;catalogRequest=null;renderCatalog()}}})();catalogRequest=promise;return promise;
  }
  async function checkout(packageId){
    if(checkoutRequest)return checkoutRequest;const owner=account(),epoch=accountEpoch;
    if(!owner){toast('Магазин MG','Войдите через JRVX ID.');return false}if(!catalog?.checkoutAvailable||!catalog.packages.some(pack=>pack.id===packageId)){toast('Магазин MG','Оплата сейчас недоступна.');return false}
    let intent;try{intent=durableIntent('checkout:'+packageId,owner,{packageId})}catch{toast('Магазин MG','Браузер не смог сохранить запрос покупки.');return false}
    checkoutRequest=(async()=>{try{const data=await requestJSON('/api/shop/checkout',{...intent,requestId:intent.operationId,...(catalog.provider?{provider:catalog.provider}:{})});if(!active(owner,epoch))return false;const destination=data.checkoutUrl||data.checkout?.url;const url=destination?new URL(destination):null;if(!url||url.protocol!=='https:')throw Error('invalid_checkout');checkoutURL=url.href;return true}catch(error){if(active(owner,epoch)){if(error.status===503){catalog.checkoutAvailable=false;renderCatalog()}toast('Магазин MG',error.status===503?'Платёжный провайдер не подключён. Начисление не выполнялось.':'Не удалось подтвердить заказ. Повторная попытка проверит прежний запрос.')}return false}finally{if(active(owner,epoch)){checkoutRequest=null;renderCatalog()}}})();renderCatalog();return checkoutRequest;
  }
  function rebrandText(root=document.body){/* v75: branding is explicit; no automatic CAS suffixing */}

  function legacyShopCapture(event){if(event.target?.closest?.('#v76Dock [data-a="shop"]'))openShop()}
  window.addEventListener?.('click',legacyShopCapture,{capture:true});
  function bind(id,fn){const node=$(id);if(node)node.onclick=fn}
  $('v69Splash')?.addEventListener('click',splashToAge);$('v69Splash')?.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' ')splashToAge()});
  bind('v69Accept',openHome);bind('v69Decline',()=>showOnly('v69Denied'));bind('v69ExitToSplash',()=>showOnly('v69Splash'));
  bind('v69DailyClaim',claimDaily);bind('v69Tables',openTables);bind('v69QuickPlay',quickPlay);bind('v69Tournaments',openTournaments);bind('v69TablesBack',openHome);bind('v69ChangeCurrency',openTables);
  document.querySelectorAll('.v69CurrencyCard[data-currency]').forEach(c=>c.onclick=()=>chooseCurrency('MG'));document.querySelectorAll('.v69VariantToggle [data-variant]').forEach(b=>b.onclick=()=>selectVariant(b.dataset.variant));bind('v69PrevTable',()=>moveTable(-1));bind('v69NextTable',()=>moveTable(1));bind('v69EnterTable',enterSelectedTable);
  ['v69ShopTop','v69BalanceShop','v69WalletOpen'].forEach(id=>bind(id,openShop));['v69ProfileTop','v69ProfileBtn'].forEach(id=>bind(id,()=>{renderProfile();showModal('v69Profile')}));bind('v69LeaderboardBtn',()=>showModal('v69Leaderboard'));
  document.querySelectorAll('[data-close]').forEach(b=>b.onclick=()=>hideModal(b.dataset.close));document.querySelectorAll('.v69Modal').forEach(m=>m.addEventListener('click',e=>{if(e.target===m)m.classList.remove('active')}));
  document.querySelectorAll('[data-v69-action]').forEach(el=>el.addEventListener('click',()=>{const a=el.dataset.v69Action;if(a==='news'||a==='learn')openInfo(a);else if(a==='private')privatePlay();else if(a==='roulette')launchSimpleGame('roulette');else if(a==='blackjack')launchSimpleGame('blackjack')}));
  function identityChanged(){const owner=account();if(owner!==accountOwner){accountOwner=owner;accountEpoch++;dailyReadSequence++;clearTimeout(dailyRefreshTimer);dailyRefreshTimer=0;daily=null;dailyBusy=false;dailyRequest=null;catalog=null;catalogBusy=false;catalogRequest=null;checkoutRequest=null;checkoutURL=null;balanceConfirmed=false;eco={...ecoDefault};renderEconomy();syncLegacyWallet()}updateDaily();if(owner)void refreshDaily()}
  document.addEventListener('jrvx-cas-identity',identityChanged);
  function installWalletChannel(){if(walletChannel)return;try{walletChannel=new BroadcastChannel('jrvx-cas-wallet-v330');walletChannel.onmessage=event=>{if(event.data?.type==='refresh'&&event.data.ownerId===account()){void window.JRVXCASServerAccount?.refresh?.();void refreshDaily()}}}catch{}}
  installWalletChannel();
  window.addEventListener?.('storage',event=>{if(event.key===ECO_KEY&&account())void refreshDaily()});
  window.addEventListener?.('pageshow',()=>{installWalletChannel();if(account())void refreshDaily()});
  window.addEventListener?.('pagehide',()=>{try{walletChannel?.close()}catch{};walletChannel=null});
  /* Neutralize v68 auto-overlay, own entry flow always starts from splash. */
  try{localStorage.setItem('jarvisCasinoResponsibleV68','yes')}catch{}
  setTimeout(()=>{document.getElementById('v68SafetyOverlay')?.classList.remove('active');document.getElementById('pokerRoyaleOverlay')?.classList.remove('active')},420);
  patchEconomyFunctions();renderEconomy();renderProfile();updateDaily();renderTables();bindLegacyMainButtons();gameCurrencyBar('blackjack');gameCurrencyBar('roulette');rebrandText(document.body);
  const obs={disconnect(){}}; /* v75: legacy brand observer disabled */
  const economy={
    get:()=>({mg:eco.mg,currency:'MG'}),
    set:(next={})=>{if(safeAmount(next.mg)){eco.mg=next.mg}saveEco();syncLegacyWallet();syncGameCurrencyUI();return{mg:eco.mg,currency:'MG'}},
    setCurrency:()=>{setActiveCurrency();return 'MG'},balance:()=>eco.mg
  };
  window.JRVXCasEconomy=window.JVRXCasEconomy=economy;
  window.JRVXCASWalletV330={openShop,applySnapshot,refreshDaily,claimDaily,loadCatalog,checkout,diagnostics:()=>({owner:accountOwner,mg:eco.mg,daily:daily?{...daily}:null,catalog:catalog?{...catalog}:null,dailyBusy}),destroy(){window.removeEventListener?.('click',legacyShopCapture,true);accountEpoch++;dailyReadSequence++;clearTimeout(dailyRefreshTimer);walletChannel?.close?.();walletChannel=null}};
  identityChanged();
  document.body.style.overflow='hidden';showOnly('v69Splash');
})();
