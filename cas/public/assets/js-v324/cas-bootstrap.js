// Generated CAS-only production bootstrap v3.0.12. Source archive: modules/legacy/legacy-runtime/00-bootstrap.js
// JRVX CAS v3.0.10: dormant Arcade hub/category navigation excluded from production runtime.
const cards=[], games=[...document.querySelectorAll('.game')];
const JRVX_CAS_ONLY=document.documentElement?.dataset?.jrvxProduct==='cas';
const JRVX_LEGACY_RUNTIME_V312=window.JRVXLegacyRuntimeV312={casOnly:JRVX_CAS_ONLY,legacyGameInitCount:0,arcadeStorageWrites:0,arcadeShortcutBindings:0};
const CATEGORY_INFO=Object.freeze({casino:{title:'Азартные',sub:'Blackjack, Roulette и Poker Online'}});
const categoryChooser=null,categoryMenu=null,categoryGamesHead=null;
function resetCategoryChooser(){} function showCategoryNow(){} let pendingAgeCategory=null; function casinoAgeConfirmed(){return true} function showCategory(){} function closeAgeGate(){}
const COIN_NAME='Mura Arcade Coin', COIN_SHORT='MAC', RACE_FINISH_DISTANCE=15000;
const COIN_ICON_SRC='data:image/svg+xml,%3Csvg%20xmlns=%22http://www.w3.org/2000/svg%22%20viewBox=%220%200%20256%20256%22%3E%3Cdefs%3E%3ClinearGradient%20id=%22g%22%20x1=%220%22%20y1=%220%22%20x2=%221%22%20y2=%221%22%3E%3Cstop%20stop-color=%22#ffd76a%22/%3E%3Cstop%20offset=%221%22%20stop-color=%22#b97918%22/%3E%3C/linearGradient%3E%3C/defs%3E%3Ccircle%20cx=%22128%22%20cy=%22128%22%20r=%22112%22%20fill=%22url%28#g%29%22/%3E%3Ccircle%20cx=%22128%22%20cy=%22128%22%20r=%2286%22%20fill=%22#111827%22%20stroke=%22#ffe6a0%22%20stroke-width=%228%22/%3E%3Cpath%20d=%22M70%20174V82h24l34%2046%2034-46h24v92h-25v-51l-33%2044-33-44v51z%22%20fill=%22#ffe49a%22/%3E%3C/svg%3E';
const PROFILE_KEY='jarvisArcadeProfileV2';
const ACHIEVEMENTS=[]; // v3.0.10: legacy Arcade achievements retired; native CAS achievements are rendered by v70/progression.
const PROFILE_ID_START=1101111, PROFILE_REGISTRY_KEY='jarvisArcadeUserRegistryV1';
const profileMemoryStorage={};
const PROFILE_DEFAULTS={nickname:'Игрок',playerId:String(PROFILE_ID_START),xp:0,gamesPlayed:0,wins:0,coinsEarned:0,coinsSpent:0,skinsBought:0,pongPoints:0,wordsSolved:0,snakeBest:0,tttWins:0,bestRace:0,totalRaceDistance:0,raceFinishes:0,carsOwned:1,tuningBought:0,breakoutBest:0,breakoutLevelBest:0,breakoutBlocks:0,breakoutBestCombo:0,blackjackWins:0,blackjackHands:0,blackjackNaturals:0,rouletteWins:0,rouletteSpins:0,rouletteStraightWins:0,pokerHands:0,pokerWins:0,pokerTokens:0,casinoWagered:0,casinoProfit:0,hangCategoryWins:{},hangCategoriesCompleted:[],achievements:[],lastPlayed:'',daily:null};
function profileSafeGet(){try{return JSON.parse(localStorage.getItem(PROFILE_KEY)||profileMemoryStorage[PROFILE_KEY]||'null')}catch{try{return JSON.parse(profileMemoryStorage[PROFILE_KEY]||'null')}catch{return null}}}
function registrySafeGet(){try{const v=JSON.parse(localStorage.getItem(PROFILE_REGISTRY_KEY)||profileMemoryStorage[PROFILE_REGISTRY_KEY]||'[]');return Array.isArray(v)?v:[]}catch{try{const v=JSON.parse(profileMemoryStorage[PROFILE_REGISTRY_KEY]||'[]');return Array.isArray(v)?v:[]}catch{return []}}}
function normalizeProfileId(v){const digits=String(v??'').replace(/\D/g,'');const n=Math.max(PROFILE_ID_START,Number(digits||PROFILE_ID_START));return String(Math.floor(n))}
function registrySave(list){const raw=JSON.stringify(list);profileMemoryStorage[PROFILE_REGISTRY_KEY]=raw;try{localStorage.setItem(PROFILE_REGISTRY_KEY,raw)}catch{}}
function nextUniqueProfileId(list=registrySafeGet()){let n=PROFILE_ID_START;const used=new Set(list.map(u=>String(u.id)));while(used.has(String(n)))n++;return String(n)}
let playerProfile=Object.assign({},PROFILE_DEFAULTS,profileSafeGet()||{});playerProfile.nickname=((playerProfile.nickname||'Игрок').trim()||'Игрок').slice(0,20);playerProfile.playerId=normalizeProfileId(playerProfile.playerId||PROFILE_ID_START);
function currentBalanceSafe(){try{return Math.max(0,Math.floor(Number(raceCredits)||0))}catch{}try{return Math.max(0,Math.floor(Number(localStorage.getItem('jarvisRaceCredits')||0))||0)}catch{return Math.max(0,Math.floor(Number(profileMemoryStorage.jarvisRaceCredits||0))||0)}}
function ensureRegistryCurrent(){let list=registrySafeGet(),id=String(playerProfile.playerId||PROFILE_ID_START),row=list.find(u=>String(u.id)===id);if(!row){if(!list.length&&id!==String(PROFILE_ID_START)){id=String(PROFILE_ID_START);playerProfile.playerId=id}row={id,nickname:playerProfile.nickname||'Игрок',balance:currentBalanceSafe(),enabled:true,profile:Object.assign({},playerProfile)};list.push(row)}else{if(row.enabled==null)row.enabled=true;row.nickname=playerProfile.nickname||row.nickname||'Игрок';row.profile=Object.assign({},row.profile||{},playerProfile)}registrySave(list);return list}
function syncCurrentUserToRegistry(balanceOverride){let list=registrySafeGet(),id=String(playerProfile.playerId),row=list.find(u=>String(u.id)===id);if(!row){row={id,nickname:playerProfile.nickname||'Игрок',balance:0,enabled:true,profile:{}};list.push(row)}row.nickname=playerProfile.nickname||'Игрок';row.profile=Object.assign({},playerProfile);row.balance=balanceOverride==null?currentBalanceSafe():Math.max(0,Math.floor(Number(balanceOverride)||0));registrySave(list)}
function savePlayerProfile(){const raw=JSON.stringify(playerProfile);profileMemoryStorage[PROFILE_KEY]=raw;try{localStorage.setItem(PROFILE_KEY,raw)}catch{}syncCurrentUserToRegistry()}
ensureRegistryCurrent();savePlayerProfile();
function localDayKey(){const d=new Date();return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`}
function ensureDaily(){const k=localDayKey();if(!playerProfile.daily||playerProfile.daily.date!==k)playerProfile.daily={date:k,plays:0,wins:0,coins:0,raceDistance:0,claimed:[]};return playerProfile.daily}
const DAILY_MACSIONS=[]; // v3.0.10: old MAC missions retired; server progression owns CAS rewards.
function renderDailyMissions(){} function claimDailyMission(){}
function rankInfo(level){if(level>=18)return{name:'LEGEND',icon:'✦'};if(level>=12)return{name:'APEX',icon:'◆'};if(level>=8)return{name:'ELITE',icon:'◇'};if(level>=5)return{name:'PRO',icon:'P'};if(level>=3)return{name:'STREET',icon:'S'};return{name:'ROOKIE',icon:'R'}}
function showArcadeToast(title,body,icon='J',life=3300){const stack=document.getElementById('arcadeToastStack');if(!stack)return;const el=document.createElement('div');el.className='arcadeToast';el.innerHTML=`<div class="arcadeToastIcon">${icon}</div><div><strong>${title}</strong><span>${body}</span></div>`;stack.appendChild(el);setTimeout(()=>{el.classList.add('out');setTimeout(()=>el.remove(),280)},life)}
// v3.0.10: old MAC daily mission renderer/claim runtime removed.
function profileLevelInfo(xp){let level=1,need=250,remain=Math.max(0,Math.floor(xp||0));while(remain>=need&&level<99){remain-=need;level++;need=Math.round(need*1.22)}return{level,remain,need}}
function profileRecordText(game){if(game==='pong')return `${playerProfile.pongPoints||0} очков`;if(game==='hangman')return `${playerProfile.wordsSolved||0} слов`;if(game==='snake')return `рекорд ${playerProfile.snakeBest||0}`;if(game==='ttt')return `${playerProfile.tttWins||0} побед`;if(game==='breakout')return `ур. ${playerProfile.breakoutLevelBest||0} • ${playerProfile.breakoutBest||0}`;if(game==='blackjack')return `${playerProfile.blackjackWins||0} побед`;if(game==='roulette')return `${playerProfile.rouletteWins||0} побед`;if(game==='poker')return `${playerProfile.pokerWins||0} побед`;if(game==='race')return `${Math.floor(playerProfile.bestRace||0).toLocaleString('ru-RU')} м`;return '—'}
function awardXP(amount){amount=Math.max(0,Math.floor(amount||0));if(!amount)return;const before=profileLevelInfo(playerProfile.xp).level;playerProfile.xp+=amount;const after=profileLevelInfo(playerProfile.xp).level;if(after>before)showArcadeToast(`Новый уровень: ${after}`,`${rankInfo(after).name} • продолжайте набирать XP`,rankInfo(after).icon,4000);checkAchievements();savePlayerProfile();renderPlayerProfile()}
function profileEvent(type,data={}){const d=ensureDaily();if(type==='play'){playerProfile.gamesPlayed++;d.plays++;playerProfile.lastPlayed=data.game||playerProfile.lastPlayed||''}if(type==='win'){playerProfile.wins++;d.wins++}if(type==='pongPoint')playerProfile.pongPoints++;if(type==='wordWin')playerProfile.wordsSolved++;if(type==='snakeEnd')playerProfile.snakeBest=Math.max(playerProfile.snakeBest||0,data.score||0);if(type==='tttWin')playerProfile.tttWins++;if(type==='breakoutEnd'){playerProfile.breakoutBest=Math.max(playerProfile.breakoutBest||0,data.score||0);playerProfile.breakoutLevelBest=Math.max(playerProfile.breakoutLevelBest||0,data.level||0);playerProfile.breakoutBlocks=(playerProfile.breakoutBlocks||0)+(data.blocks||0);playerProfile.breakoutBestCombo=Math.max(playerProfile.breakoutBestCombo||0,data.combo||0)}if(type==='blackjackWin')playerProfile.blackjackWins++;if(type==='blackjackHand')playerProfile.blackjackHands++;if(type==='blackjackNatural')playerProfile.blackjackNaturals++;if(type==='rouletteWin')playerProfile.rouletteWins++;if(type==='rouletteSpin')playerProfile.rouletteSpins++;if(type==='rouletteStraight')playerProfile.rouletteStraightWins++;if(type==='pokerHand')playerProfile.pokerHands=(playerProfile.pokerHands||0)+1;if(type==='pokerWin')playerProfile.pokerWins=(playerProfile.pokerWins||0)+1;if(type==='raceEnd'){playerProfile.bestRace=Math.max(playerProfile.bestRace||0,data.distance||0);playerProfile.totalRaceDistance+=(data.distance||0);d.raceDistance+=(data.distance||0);if(data.finished)playerProfile.raceFinishes++}checkAchievements();savePlayerProfile();renderPlayerProfile();renderDailyMissions()}

function updateCategoryLive(){
  const unlocked=new Set(playerProfile.achievements||[]);
  const groups={arcade:['Pong','JVRX BREAKOUT','Змейка'],logic:['Виселица','Крестики-нолики'],racing:['JVRX RACING'],casino:['Blackjack','Roulette','Poker Online','Азартные']};
  for(const [cat,names] of Object.entries(groups)){const el=document.getElementById(`catLive-${cat}`);if(!el)continue;const total=ACHIEVEMENTS.filter(a=>names.includes(achievementGroupName(a.id))).length;const got=ACHIEVEMENTS.filter(a=>names.includes(achievementGroupName(a.id))&&unlocked.has(a.id)).length;el.innerHTML=`<b>${got}/${total}</b> достижений`}
}
function checkAchievements(){const unlocked=new Set(playerProfile.achievements||[]);let changed=false;for(const a of ACHIEVEMENTS){if(!unlocked.has(a.id)&&a.test(playerProfile)){unlocked.add(a.id);changed=true;showArcadeToast('Достижение открыто',a.name,a.icon,3900)}}playerProfile.achievements=[...unlocked];if(changed)savePlayerProfile();updateCategoryLive()}
function achievementGroupName(id){if(id.startsWith('pong'))return 'Pong';if(id.startsWith('breakout'))return 'JVRX BREAKOUT';if(id.startsWith('blackjack'))return 'Blackjack';if(id.startsWith('roulette'))return 'Roulette';if(id.startsWith('poker'))return 'Poker Online';if(id.startsWith('casino'))return 'Азартные';if(id.startsWith('word')||id.startsWith('hang_'))return 'Виселица';if(id.startsWith('snake'))return 'Змейка';if(id.startsWith('ttt'))return 'Крестики-нолики';if(id.startsWith('racer')||id.startsWith('race_'))return 'JVRX RACING';if(id.startsWith('mrc')||id.startsWith('spent')||id.startsWith('skin')||id.startsWith('cars')||id.startsWith('tuning'))return 'Экономика и коллекция';if(id.startsWith('level'))return 'Уровни';return 'Общие'}
function renderPlayerProfile(){try{window.__jrvxProfileSync?.()}catch{}}
function openProfile(){try{window.JRVXCASOpenGameProfile?.()}catch{}}
function closeProfile(){document.getElementById('v69Profile')?.classList.remove('active')}

// JRVX CAS v3.0.11: dormant Arcade preview/info catalog and command bar removed.
function renderArcadeCommandBar(){}
function openGenericGameInfo(){}
function closeGenericGameInfo(){}
function coinText(value){return `${Math.floor(value).toLocaleString('ru-RU')} MS`}
// JRVX CAS v3.0.11: old MAC reward helpers removed.
// JRVX CAS v3.0.11: old card tap helper removed.
function setActiveGameById(id,scroll=true){
  const c=cards.find(x=>x.dataset.game===id); if(!c)return;
  document.body.classList.add('game-mode');
  cards.forEach(x=>{x.classList.toggle('active',x===c);x.setAttribute('aria-pressed',x===c?'true':'false')});
  games.forEach(x=>x.classList.toggle('active',x.id===id));
  const g=document.getElementById(id);if(g){g.style.animation='none';void g.offsetWidth;g.style.animation='gameReveal .7s cubic-bezier(.2,.72,.22,1) both'}
  if(id==='race'&&typeof showGarageView==='function')showGarageView();if((id==='blackjack'||id==='roulette')&&typeof casinoRefresh==='function')casinoRefresh();if(typeof arcadeNetSend==='function')arcadeNetSend({type:'activity',game:id});
  if(scroll)requestAnimationFrame(()=>window.scrollTo({top:0,behavior:'smooth'}));
}
function goMainMenu(skipScroll=false){
  if(typeof arcadeNetPokerLeave==='function'&&document.getElementById('poker')?.classList.contains('active'))arcadeNetPokerLeave();
  if(typeof pongRunning!=='undefined')pongRunning=false;
  if(typeof snakeTimer!=='undefined'&&snakeTimer){clearInterval(snakeTimer);snakeTimer=null}
  if(typeof raceRunning!=='undefined')raceRunning=false;
  if(typeof raceKeys!=='undefined')raceKeys={left:false,right:false,gas:false,brake:false,nitro:false};
  document.body.classList.remove('game-mode');
  games.forEach(x=>x.classList.remove('active'));cards.forEach(x=>{x.classList.remove('active');x.setAttribute('aria-pressed','false')});
  resetCategoryChooser();if(typeof arcadeNetSend==='function')arcadeNetSend({type:'activity',game:'menu'});if(!skipScroll)window.scrollTo({top:0,behavior:'smooth'});
}
// JRVX CAS v3.0.11: old preview launch flow removed.
function currentRegistryUser(){return registrySafeGet().find(u=>String(u.id)===String(playerProfile.playerId))||null}
function currentUserEnabled(){const u=currentRegistryUser();return (!u||u.enabled!==false)&&(!window.arcadeNetState||window.arcadeNetState.accountEnabled!==false)}
function playSelectedGame(){
  if(!currentUserEnabled()){closeGamePreview();showArcadeToast('Профиль отключён','Администратор отключил доступ к играм','!');return}
  profileEvent('play',{game:previewGameId});awardXP(8);
  closeGamePreview();
  launchFade.classList.add('active'); launchFade.setAttribute('aria-hidden','false');
  setTimeout(()=>{setActiveGameById(previewGameId,false)},700);
  setTimeout(()=>{launchFade.classList.remove('active'); launchFade.setAttribute('aria-hidden','true');window.scrollTo({top:0,behavior:'smooth'})},1550);
}
function syncGameFromHash(){ /* direct hash no longer auto-launches a game */ }
// v3.0.11: obsolete preview/info DOM wiring removed.
// v3.0.10: old profile overlay wiring removed.
function reassignCurrentProfileId(nextId){nextId=normalizeProfileId(nextId);const oldId=String(playerProfile.playerId),list=registrySafeGet();if(nextId!==oldId&&list.some(u=>String(u.id)===nextId)){showArcadeToast('ID занят',`Игрок с ID ${nextId} уже существует`,'!');return false}const row=list.find(u=>String(u.id)===oldId);if(row)row.id=nextId;playerProfile.playerId=nextId;registrySave(list);return true}
// v3.0.11: retired local profile editor removed.
let adminSelectedUserId=null;
function adminMergedUsers(){const map=new Map();for(const u of registrySafeGet())map.set(String(u.id),Object.assign({},u,{online:false}));for(const u of (window.arcadeNetState?.adminUsers||[])){const id=String(u.id);map.set(id,Object.assign({},map.get(id)||{},u,{id}))}return [...map.values()]}
function renderAdminUsers(){}
function escapeAdminHtml(v){return String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
function selectAdminUser(id){const row=adminMergedUsers().find(u=>String(u.id)===String(id));adminSelectedUserId=row?String(row.id):null;return row||null}
function createAdminUser(){let list=registrySafeGet(),id=nextUniqueProfileId(list),profile=Object.assign({},PROFILE_DEFAULTS,{nickname:`Игрок ${list.length+1}`,playerId:id});list.push({id,nickname:profile.nickname,balance:0,enabled:true,profile});registrySave(list);showArcadeToast('Игрок создан',`ID ${id}`,'+')}
// v3.0.11: retired local admin editor actions removed.
// v3.0.10: legacy profile/admin DOM wiring removed.// v3.0.10: legacy profile/admin DOM wiring removed.
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&document.getElementById('v69Profile')?.classList.contains('active'))closeProfile()});
document.querySelectorAll('[data-main-menu]').forEach(b=>b.onclick=()=>goMainMenu());



// JVRX ARCADE ONLINE v48 — global UX + Poker engine/UI upgrade
window.arcadeNetState={connected:false,transportConnected:false,handshakeReady:false,lastServerAt:0,serverClockOffset:0,accountEnabled:true,onlineCount:1,games:{},poker:null,pokerTokens:0,serverBalance:null,pokerHands:0,pokerWins:0,adminUsers:[],pokerTokenRate:50};
const arcadeNet={ws:null,retry:null,handshakeTimer:null,heartbeatTimer:null,intentionalClose:false,sessionReplaced:false,url:'',hello:false,helloAck:false,connectSeq:0,protocolVersion:'v3.0.17'};
let pokerLastHandSeen=0,pokerLastResultSeen='',pokerMode='jarvis';
function arcadeNetUrl(){if(location.protocol==='http:'||location.protocol==='https:'){return `${location.protocol==='https:'?'wss':'ws'}://${location.host}/ws`}return 'ws://127.0.0.1:8787/ws'}
function setOnlineBadge(mode,count=1){const badge=document.getElementById('onlineBadge'),num=document.getElementById('onlinePlayersCount'),small=badge?.querySelector('small');if(!badge)return;const founderLocal=mode!=='live'&&mode!=='connecting'&&isFounderProfile();badge.classList.remove('live','offline','connecting');badge.classList.add(mode==='live'||founderLocal?'live':mode);if(num)num.textContent=founderLocal?1:count;if(small)small.textContent=mode==='live'?'LIVE':mode==='connecting'?'LINK':founderLocal?'FOUNDER':'LOCAL';badge.title=mode==='live'?`SERVER LINK: ${count} игроков подключено`:founderLocal?'Founder presence ONLINE • server link offline':'Online-сервер недоступен — Arcade работает локально'}
function renderOnlineSummary(){if(typeof renderArcadeCommandBar==='function')setTimeout(renderArcadeCommandBar,0);const live=window.arcadeNetState.connected,count=Math.max(1,Number(window.arcadeNetState.onlineCount)||1),games=window.arcadeNetState.games||{},poker=Math.max(0,Number(games.pokerTable??games.poker)||0),jarvis=Math.max(0,Number(games.pokerJVRX)||0);const set=(id,v)=>{const e=document.getElementById(id);if(e)e.textContent=v};set('onlineSummaryTotal',`${count} ${count===1?'игрок':'игроков'}`);set('onlineSummaryMode',live?'LIVE SERVER':(isFounderProfile()?'FOUNDER ONLINE':'LOCAL'));set('onlineSummaryPoker',`${poker} за online-столом`);set('onlineSummaryMulti',live?`${poker} online • ${jarvis} vs JVRX`:'Локальные режимы доступны');set('pokerCardOnline',live?`${poker} online`:'offline');const po=document.getElementById('pokerOnlineText');if(po)po.textContent=live?`ONLINE: ${count} • СТОЛ: ${poker}`:'ONLINE: —'}
function isFounderProfile(){return String(playerProfile?.playerId||'')==='JRVX-JRVX11101111'}
function muraTokenBalance(){return Math.max(0,Math.floor(Number(window.arcadeNetState.muraTokens??window.arcadeNetState.pokerTokens??playerProfile.pokerTokens??0)||0))}
function setMuraTokenBalance(value,{sync=true}={}){const n=Math.max(0,Math.floor(Number(value)||0));window.arcadeNetState.muraTokens=n;window.arcadeNetState.pokerTokens=n;playerProfile.pokerTokens=n;savePlayerProfile();try{localStorage.setItem('jarvisMuraTokensV1',String(n))}catch{}if(sync&&window.arcadeNetState.connected)arcadeNetSend({type:'mura_tokens_sync',tokens:n});renderPokerWallet();casinoRefresh();return n}
function loadLocalMuraTokens(){try{const n=Number(localStorage.getItem('jarvisMuraTokensV1'));if(Number.isFinite(n)&&n>=0){window.arcadeNetState.muraTokens=Math.floor(n);window.arcadeNetState.pokerTokens=Math.floor(n)}}catch{}}
function pokerTokenRate(){return Math.max(1,Math.floor(Number(window.arcadeNetState.pokerTokenRate)||50))}
// v3.0.11: obsolete exchange preview removed.
function renderPokerWallet(){if(typeof renderArcadeCommandBar==='function')setTimeout(renderArcadeCommandBar,0);const n=muraTokenBalance();const e=document.getElementById('pokerTokenBalance');if(e)e.textContent=`${n.toLocaleString('ru-RU')} MS`;playerProfile.pokerTokens=n;const ids=['profilePokerTokens','profilePokerTokenWalletBalance'];for(const id of ids){const pe=document.getElementById(id);if(pe)pe.textContent=id==='profilePokerTokens'?n:`${n.toLocaleString('ru-RU')} MS`}const mis=document.getElementById('profileWalletMrcBalance');if(mis)mis.textContent=coinText(currentBalanceSafe());updateAdminCasinoControls()}
function setPokerNetStatus(live,text){const dot=document.getElementById('pokerStatusDot'),status=document.getElementById('pokerNetStatus'),join=document.getElementById('pokerQuickJoin');if(dot)dot.classList.toggle('live',live);if(status)status.textContent=text||(live?'SERVER LINK • ONLINE':'LOCAL MODE • server link offline');if(join)join.disabled=!live;renderOnlineSummary()}
function pokerModeUI(){document.querySelectorAll('[data-poker-mode]').forEach(b=>b.classList.toggle('active',b.dataset.pokerMode===pokerMode));const join=document.getElementById('pokerQuickJoin');if(join)join.textContent=pokerMode==='jarvis'?'Играть против JRVX':'Войти в ONLINE стол';const status=document.getElementById('pokerNetStatus');if(status&&window.arcadeNetState.connected&&!window.arcadeNetState.poker?.you)status.textContent=pokerMode==='jarvis'?'JVRX готов к heads-up':'Online-стол готов';const table=document.getElementById('pokerTableWrap');if(table)table.classList.toggle('headsUp',pokerMode==='jarvis')}
function setPokerMode(mode){mode=mode==='online'?'online':'jarvis';const current=window.arcadeNetState.poker;if(current?.you&&current.mode&&current.mode!==mode)arcadeNetPokerLeave();pokerMode=mode;pokerModeUI();const emptySeats=Array(mode==='jarvis'?2:6).fill(null);if(!window.arcadeNetState.poker?.you)renderPokerState({mode,seats:emptySeats,community:[],pot:0,street:'waiting',handNo:0,you:null,smallBlind:1,bigBlind:2})}
function arcadeNetClearSessionTimers(){if(arcadeNet.handshakeTimer){clearTimeout(arcadeNet.handshakeTimer);arcadeNet.handshakeTimer=null}if(arcadeNet.heartbeatTimer){clearInterval(arcadeNet.heartbeatTimer);arcadeNet.heartbeatTimer=null}}
function arcadeNetStartHeartbeat(){if(arcadeNet.heartbeatTimer)clearInterval(arcadeNet.heartbeatTimer);if(!arcadeNet.helloAck)return;arcadeNet.heartbeatTimer=setInterval(()=>{if(document.visibilityState==='hidden'||!arcadeNet.helloAck)return;const ws=arcadeNet.ws;if(!ws||ws.readyState!==1)return;const last=Number(window.arcadeNetState.lastServerAt)||0;if(last&&Date.now()-last>70000){arcadeNet.intentionalClose=false;try{ws.close(4000,'Heartbeat timeout')}catch{}return}arcadeNetSend({type:'activity',game:'heartbeat',clientTime:Date.now()})},25000)}
function arcadeNetSend(obj){const ws=arcadeNet.ws;if(!ws||ws.readyState!==1)return false;if(obj?.type!=='hello'&&!arcadeNet.helloAck)return false;try{ws.send(JSON.stringify(obj));return true}catch{return false}}
function arcadeNetConnect(force=false){if(arcadeNet.sessionReplaced)return false;if(arcadeNet.retry){clearTimeout(arcadeNet.retry);arcadeNet.retry=null}if(arcadeNet.ws&&(arcadeNet.ws.readyState===0||arcadeNet.ws.readyState===1)){if(!force)return false;arcadeNet.intentionalClose=true;try{arcadeNet.ws.close(1000,'Reconnect')}catch{}}arcadeNetClearSessionTimers();arcadeNet.intentionalClose=false;arcadeNet.hello=false;arcadeNet.helloAck=false;window.arcadeNetState.connected=false;window.arcadeNetState.transportConnected=false;window.arcadeNetState.handshakeReady=false;const seq=++arcadeNet.connectSeq;arcadeNet.url=arcadeNetUrl();setOnlineBadge('connecting',1);setPokerNetStatus(false,'Проверяем SERVER LINK…');const connectWatch=setTimeout(()=>{if(seq===arcadeNet.connectSeq&&!arcadeNet.helloAck){setOnlineBadge('offline',1);setPokerNetStatus(false,'SERVER LINK: ожидание подтверждения…')}},5000);let ws;try{ws=window.JRVXCASHttpTransport?.enabled?window.JRVXCASHttpTransport.create(arcadeNet.url):new WebSocket(arcadeNet.url)}catch{clearTimeout(connectWatch);scheduleArcadeReconnect();return false}arcadeNet.ws=ws;ws.onopen=()=>{if(arcadeNet.ws!==ws||seq!==arcadeNet.connectSeq)return;window.arcadeNetState.transportConnected=true;arcadeNet.hello=true;const hello={type:'hello',protocol:'jrvx-cas-online',protocolVersion:arcadeNet.protocolVersion,clientVersion:'3.0.17'};const identityState=window.JRVXCASIdentityV300?.state?.();if(!identityState||identityState.mode==='development'){hello.playerId=String(playerProfile.playerId);hello.nickname=playerProfile.nickname||'Игрок'}arcadeNetSend(hello);setPokerNetStatus(false,'SERVER LINK: подтверждение сессии…');arcadeNet.handshakeTimer=setTimeout(()=>{if(arcadeNet.ws===ws&&!arcadeNet.helloAck){arcadeNet.intentionalClose=false;try{ws.close(4000,'Handshake timeout')}catch{}}},10000)};ws.onmessage=e=>{if(arcadeNet.ws!==ws||seq!==arcadeNet.connectSeq)return;let msg;try{msg=JSON.parse(e.data)}catch{return}window.arcadeNetState.lastServerAt=Date.now();if(Number.isFinite(Number(msg.serverTime)))window.arcadeNetState.serverClockOffset=Number(msg.serverTime)-Date.now();handleArcadeNetMessage(msg)};ws.onerror=()=>{};ws.onclose=e=>{if(arcadeNet.ws!==ws||seq!==arcadeNet.connectSeq)return;if(e?.code===4001){arcadeNet.sessionReplaced=true;arcadeNet.intentionalClose=true}if(e?.code===4003){arcadeNet.intentionalClose=true;setTimeout(()=>window.JRVXCASIdentityV300?.refresh?.(),100)}clearTimeout(connectWatch);arcadeNetClearSessionTimers();window.arcadeNetState.connected=false;window.arcadeNetState.transportConnected=false;window.arcadeNetState.handshakeReady=false;arcadeNet.hello=false;arcadeNet.helloAck=false;setOnlineBadge('offline',1);window.arcadeNetState.games={};window.arcadeNetState.poker=null;setPokerNetStatus(false,e?.code===4001?'Сессия открыта в другом окне':(isFounderProfile()?'FOUNDER ONLINE • LOCAL MODE':'LOCAL MODE • server link offline'));renderOnlineSummary();pokerModeUI();if(!arcadeNet.intentionalClose)scheduleArcadeReconnect()};return true}
function scheduleArcadeReconnect(){if(arcadeNet.sessionReplaced||arcadeNet.intentionalClose)return false;if(location.protocol==='file:'||location.origin==='null')return false;if(arcadeNet.retry)return false;const delay=3000+Math.floor(Math.random()*1500);arcadeNet.retry=setTimeout(()=>{arcadeNet.retry=null;arcadeNetConnect()},delay);return true}
function handleArcadeNetMessage(msg){if(!msg)return;
  if(msg.type==='hello_ack'){arcadeNet.helloAck=true;if(arcadeNet.handshakeTimer){clearTimeout(arcadeNet.handshakeTimer);arcadeNet.handshakeTimer=null}window.arcadeNetState.connected=true;window.arcadeNetState.transportConnected=true;window.arcadeNetState.handshakeReady=true;window.arcadeNetState.lastServerAt=Date.now();arcadeNetStartHeartbeat();window.arcadeNetState.accountEnabled=msg.enabled!==false;window.arcadeNetState.onlineCount=msg.count||1;window.arcadeNetState.games=msg.games||{};if(msg.muraTokens!=null||msg.pokerTokens!=null){const n=Math.max(0,Math.floor(Number(msg.muraTokens??msg.pokerTokens)||0));window.arcadeNetState.muraTokens=n;window.arcadeNetState.pokerTokens=n;try{localStorage.setItem('jarvisMuraTokensV1',String(n))}catch{}}if(msg.pokerTokenRate!=null)window.arcadeNetState.pokerTokenRate=msg.pokerTokenRate;if(msg.balance!=null){window.arcadeNetState.serverBalance=msg.balance;raceCredits=Math.max(0,Math.floor(Number(msg.balance)||0));saveGarage(false)}setOnlineBadge('live',window.arcadeNetState.onlineCount);setPokerNetStatus(true,'JRVX Online подключён');renderOnlineSummary();renderPokerWallet();pokerModeUI();return}
  if(msg.type==='presence'){window.arcadeNetState.onlineCount=Math.max(1,Number(msg.count)||1);window.arcadeNetState.games=msg.games||{};setOnlineBadge('live',window.arcadeNetState.onlineCount);setPokerNetStatus(true,window.arcadeNetState.poker?.you?(window.arcadeNetState.poker.mode==='jarvis'?'Heads-up против JRVX':'ONLINE стол'):'JRVX Online подключён');renderOnlineSummary();return}
  if(msg.type==='account_wallet'){if(msg.balance!=null){window.arcadeNetState.serverBalance=Math.max(0,Math.floor(Number(msg.balance)||0));raceCredits=window.arcadeNetState.serverBalance;saveGarage(false)}if(msg.pokerTokenRate!=null)window.arcadeNetState.pokerTokenRate=msg.pokerTokenRate;window.arcadeNetState.muraTokens=window.arcadeNetState.pokerTokens=Math.max(0,Math.floor(Number(msg.muraTokens??msg.pokerTokens)||0));try{localStorage.setItem('jarvisMuraTokensV1',String(window.arcadeNetState.pokerTokens))}catch{}window.arcadeNetState.pokerHands=Math.max(0,Math.floor(Number(msg.pokerHands)||0));window.arcadeNetState.pokerWins=Math.max(0,Math.floor(Number(msg.pokerWins)||0));playerProfile.pokerHands=Math.max(playerProfile.pokerHands||0,window.arcadeNetState.pokerHands);playerProfile.pokerWins=Math.max(playerProfile.pokerWins||0,window.arcadeNetState.pokerWins);savePlayerProfile();renderPokerWallet();if(typeof raceUpdateHud==='function')raceUpdateHud();return}
  if(msg.type==='account_status'){window.arcadeNetState.accountEnabled=msg.enabled!==false;const row=currentRegistryUser();if(row){row.enabled=msg.enabled!==false;const list=registrySafeGet(),idx=list.findIndex(x=>String(x.id)===String(row.id));if(idx>=0){list[idx]=row;registrySave(list)}}if(msg.enabled===false){goMainMenu(true);showArcadeToast('Аккаунт отключён','Администратор отключил доступ к JRVX CAS','×',5000)}renderAdminUsers();return}
  if(msg.type==='poker_state'){window.arcadeNetState.poker=msg.state;if(msg.state?.mode)pokerMode=msg.state.mode;renderPokerState(msg.state);pokerModeUI();return}
  if(msg.type==='notice'){const m=document.getElementById('pokerMessage');if(m)m.textContent=msg.message||'';showArcadeToast('JVRX Poker',msg.message||'Готово','♠',2600);return}
  if(msg.type==='poker_error'||msg.type==='error'){showArcadeToast('JRVX Online',msg.message||'Ошибка сервера','!',3500);const m=document.getElementById('pokerMessage');if(m)m.textContent=msg.message||'Ошибка сервера';return}
  if(msg.type==='admin_users'){window.arcadeNetState.adminUsers=Array.isArray(msg.users)?msg.users:[];renderAdminUsers();if(adminSelectedUserId)selectAdminUser(adminSelectedUserId);return}
  if(msg.type==='admin_result'){if(String(msg.playerId)===String(playerProfile.playerId)&&(msg.muraTokens!=null||msg.pokerTokens!=null))setMuraTokenBalance(msg.muraTokens??msg.pokerTokens,{sync:false});showArcadeToast('Server Admin',`ID ${msg.playerId} обновлён`,'✓');return}
}
function pokerRankLabel(r){return r==='T'?'10':r}function pokerSuitSymbol(s){return({S:'♠',H:'♥',D:'♦',C:'♣'})[s]||s}
function pokerCardHTML(code){if(!code||code==='??')return '<div class="pokerCard back">?</div>';const r=code[0],s=code[1],red=s==='H'||s==='D';return `<div class="pokerCard ${red?'red':''}">${pokerRankLabel(r)}<small>${pokerSuitSymbol(s)}</small></div>`}
function pokerStreetLabel(s){return({waiting:'Ожидание игроков',preflop:'Префлоп',flop:'Флоп',turn:'Тёрн',river:'Ривер',showdown:'Шоудаун'})[s]||s}
function renderPokerState(state){if(!state)return;if(state.mode)pokerMode=state.mode;const me=state.you||null,seatBox=document.getElementById('pokerSeats'),community=document.getElementById('pokerCommunity'),hole=document.getElementById('pokerHole'),pot=document.getElementById('pokerPot'),street=document.getElementById('pokerStreet'),msg=document.getElementById('pokerMessage'),result=document.getElementById('pokerResult'),table=document.getElementById('pokerTableWrap');if(table)table.classList.toggle('headsUp',(state.mode||pokerMode)==='jarvis');const tb=document.getElementById('pokerTestBanner');if(tb)tb.classList.toggle('active',isFounderProfile()&&!!state.testModeActive);if(pot)pot.textContent=`${Number(state.pot||0).toLocaleString('ru-RU')} MT`;if(street)street.textContent=`${pokerStreetLabel(state.street)} • #${state.handNo||0} • SB ${state.smallBlind||1} / BB ${state.bigBlind||2}`;if(community)community.innerHTML=(state.community||[]).map(pokerCardHTML).join('')||'<span class="pokerStatusMeta">Общие карты появятся здесь</span>';if(hole)hole.innerHTML=(me?.hole||[]).map(pokerCardHTML).join('')||(me?'<span class="pokerStatusMeta">Ожидание новой раздачи</span>':'<span class="pokerStatusMeta">Сначала выберите режим и бай-ин</span>');if(seatBox){const seats=state.seats||Array((state.mode||pokerMode)==='jarvis'?2:6).fill(null);seatBox.innerHTML=seats.map((p,seat)=>{if(!p)return `<div class="pokerSeat empty"><div class="pokerSeatName">Свободное место</div><div class="pokerSeatMeta"><span>SEAT ${seat+1}</span><span>—</span></div></div>`;const isMe=me&&String(p.id)===String(me.id),turn=state.turnSeat===seat,dealer=state.dealerSeat===seat,sb=state.smallBlindSeat===seat,bb=state.bigBlindSeat===seat,test=isFounderProfile()&&p.testMode&&p.testMode!=='normal';return `<div class="pokerSeat ${isMe?'me':''} ${turn?'turn':''} ${p.folded?'folded':''}"><div class="pokerSeatName">${escapeAdminHtml(p.nickname||'Игрок')}${dealer?'<span class="pokerDealerMark">D</span>':''}${sb?'<span class="pokerBlindMark">SB</span>':''}${bb?'<span class="pokerBlindMark bb">BB</span>':''}${test?`<span class="pokerSeatTest">${p.testMode==='favor'?'TEST +':'TEST −'}</span>`:''}</div><div class="pokerSeatMeta"><span>${Number(p.stack||0).toLocaleString('ru-RU')} MT${p.inHand&&Number(p.stack||0)===0?'<span class="pokerAllInBadge">ALL-IN</span>':''}</span><span>${p.bet?`ставка ${p.bet} MT`:''}</span></div><div class="pokerSeatAction ${p.wonLast?'pokerWin':''}">${p.wonLast?`+${p.wonLast} MT`:(p.lastAction||'')}</div><div class="pokerCommunity" style="justify-content:flex-start;margin-top:5px;min-height:0">${(p.hole||[]).map(pokerCardHTML).join('')}</div></div>`}).join('')}
  const logBox=document.getElementById('pokerHandTimeline'),logMeta=document.getElementById('pokerHandLogMeta');if(logBox){const logs=Array.isArray(state.actionLog)?state.actionLog:[];logBox.innerHTML=logs.length?logs.map(x=>`<div class="pokerHandEvent ${escapeAdminHtml(x.kind||'info')}"><strong>${escapeAdminHtml(x.text||'')}</strong><span>${pokerStreetLabel(x.street||state.street)}${x.kind==='result'?' • итог':''}</span></div>`).join(''):'<div class="pokerHandEmpty">Действия игроков появятся здесь.</div>';logBox.scrollLeft=logBox.scrollWidth}if(logMeta)logMeta.textContent=state.handNo?`Раздача #${state.handNo} • ${pokerStreetLabel(state.street)}`:'Ожидание раздачи';
  const fold=document.getElementById('pokerFold'),cc=document.getElementById('pokerCheckCall'),raise=document.getElementById('pokerRaise'),bet=document.getElementById('pokerBetInput'),combo=document.getElementById('pokerCurrentCombo'),betHint=document.getElementById('pokerBetHint');const turn=!!me?.yourTurn;if(combo)combo.textContent=me?.currentHandName||(me?.hole?.length===2?'Префлоп':'—');[fold,cc,raise,bet].forEach(e=>{if(e)e.disabled=!turn});if(cc)cc.textContent=me?.toCall>0?`Колл ${me.toCall} MT`:'Чек';if(bet&&turn){const bb=Math.max(1,Number(state.bigBlind)||2),max=(me.stack||0)+(me.bet||0),serverMin=Math.max(Number(state.minRaiseTo)||bb,bb),min=Math.min(serverMin,max),canRaise=max>Number(state.currentBet||0);bet.min=min;bet.max=max;bet.step=1;raise.disabled=!canRaise;bet.disabled=!canRaise;if(canRaise&&(Number(bet.value)<min||Number(bet.value)>max))bet.value=min;if(betHint)betHint.textContent=canRaise?`Рейз: минимум ${min} MT • максимум ${max} MT • банк ${Number(state.pot||0)} MT`:'Рейз недоступен: стек используется для колла / all-in.'}else if(betHint)betHint.textContent='Размер рейза станет доступен в Ваш ход.';if(msg){if(!me)msg.textContent=pokerMode==='jarvis'?'Укажите бай-ин и нажмите «Играть против JRVX».':'Укажите бай-ин и войдите в ONLINE стол.';else if(state.street==='waiting'){if((me.stack||0)<(state.bigBlind||2))msg.textContent='Стек меньше BB. Сделайте ребай Mura Tokens.';else msg.textContent=pokerMode==='jarvis'?'JVRX готовит следующую раздачу…':'Место занято. Ожидаем минимум второго online-игрока.'}else if(turn)msg.textContent='Ваш ход.';else if(me.inHand&&me.folded)msg.textContent='Вы сделали фолд. Ожидайте следующую раздачу.';else msg.textContent=pokerMode==='jarvis'?'JVRX принимает решение…':'Ожидание хода другого игрока…'}if(result)result.textContent=state.lastResult?.text?`${state.lastResult.text} MT`:'Банк, блайнды и ставки считаются в Mura Tokens. Остаток стека возвращается в кошелёк при выходе.';
  if(me&&state.handNo&&state.handNo!==pokerLastHandSeen&&me.inHand){pokerLastHandSeen=state.handNo;profileEvent('pokerHand');awardXP(10)}const resultKey=state.lastResult?`${state.roomId}:${state.handNo}:${(state.lastResult.winners||[]).join(',')}`:'';if(resultKey&&resultKey!==pokerLastResultSeen){pokerLastResultSeen=resultKey;if((state.lastResult.winners||[]).map(String).includes(String(me?.id))){profileEvent('pokerWin');profileEvent('win');awardXP(28);showArcadeToast(pokerMode==='jarvis'?'Poker vs JVRX':'Poker Online','Вы выиграли банк','♠',3500)}}pokerModeUI()}
// JRVX CAS v3.0.11: old MAC/MT buy/sell transport removed.
function arcadeNetPokerJoin(mode=pokerMode){if(!window.arcadeNetState.connected){showArcadeToast('JVRX Poker','Online-сервер не подключён','!');arcadeNetConnect(true);return}arcadeNetSend({type:'poker_join',mode:mode==='online'?'online':'jarvis',buyIn:pokerBuyIn()})}
function arcadeNetPokerLeave(){if(window.arcadeNetState.connected)arcadeNetSend({type:'poker_leave'});window.arcadeNetState.poker=null;renderPokerState({mode:pokerMode,seats:Array(pokerMode==='jarvis'?2:6).fill(null),community:[],pot:0,street:'waiting',handNo:0,you:null,smallBlind:1,bigBlind:2})}
function arcadeNetPokerAction(action){if(!window.arcadeNetState.connected)return;const state=window.arcadeNetState.poker,me=state?.you;if(!me?.yourTurn)return;const payload={type:'poker_action',action};if(action==='bet')payload.amount=Math.floor(Number(document.getElementById('pokerBetInput').value)||0);arcadeNetSend(payload)}
function arcadeNetAdminSetEnabled(id,enabled){return arcadeNetSend({type:'admin_set_enabled',playerId:String(id),enabled:enabled!==false})}
function arcadeNetAdminSetBalance(id,balance){return arcadeNetSend({type:'admin_set_balance',playerId:String(id),balance:Math.max(0,Math.floor(Number(balance)||0))})}
function arcadeNetAdminSetPokerTokens(id,pokerTokens){const value=Math.max(0,Math.floor(Number(pokerTokens)||0));if(String(id)===String(playerProfile.playerId))setMuraTokenBalance(value,{sync:false});return arcadeNetSend({type:'admin_set_mura_tokens',playerId:String(id),muraTokens:value})}
function arcadeNetAdminSetTestMode(id,mode){return arcadeNetSend({type:'admin_set_test_mode',playerId:String(id),mode:['normal','favor','challenge'].includes(mode)?mode:'normal'})}
function setProfileWalletTab(tab){document.querySelectorAll('.profileWalletTab').forEach(b=>b.classList.toggle('active',b.dataset.walletTab===tab));const m=document.getElementById('profileWalletMrc'),p=document.getElementById('profileWalletPoker');if(m)m.classList.toggle('active',tab==='mrc');if(p)p.classList.toggle('active',tab==='poker');renderPokerWallet()}
const pokerInfoOverlay=document.getElementById('pokerInfoOverlay');if(pokerInfoOverlay&&pokerInfoOverlay.parentElement!==document.body)document.body.appendChild(pokerInfoOverlay);
function openPokerInfo(){pokerInfoOverlay.classList.add('active');pokerInfoOverlay.setAttribute('aria-hidden','false');document.documentElement.classList.add('pokerModalOpen')}
function closePokerInfo(){pokerInfoOverlay.classList.remove('active');pokerInfoOverlay.setAttribute('aria-hidden','true');document.documentElement.classList.remove('pokerModalOpen')}
document.getElementById('pokerInfoBtn').onclick=openPokerInfo;document.getElementById('pokerInfoClose').onclick=closePokerInfo;document.getElementById('pokerInfoDone').onclick=closePokerInfo;pokerInfoOverlay.addEventListener('click',e=>{if(e.target===pokerInfoOverlay)closePokerInfo()});document.addEventListener('keydown',e=>{if(e.key==='Escape'&&pokerInfoOverlay.classList.contains('active'))closePokerInfo()});
function pokerSetBetSize(kind){const state=window.arcadeNetState.poker,me=state?.you,bet=document.getElementById('pokerBetInput');if(!me||!me.yourTurn||!bet)return;const bb=Math.max(1,Number(state.bigBlind)||2),current=Math.max(0,Number(state.currentBet)||0),max=(me.stack||0)+(me.bet||0),serverMin=Math.max(Number(state.minRaiseTo)||bb,bb),min=Math.min(serverMin,max),pot=Math.max(0,Number(state.pot)||0);if(max<=current)return;let target=min;if(kind==='half')target=Math.max(min,current+Math.max(bb,Math.ceil(pot*.5)));if(kind==='pot')target=Math.max(min,current+Math.max(bb,pot));if(kind==='allin')target=max;target=Math.max(min,Math.min(max,Math.floor(target)));bet.value=target;bet.dispatchEvent(new Event('input',{bubbles:true}))}
document.querySelectorAll('[data-poker-size]').forEach(b=>b.onclick=()=>pokerSetBetSize(b.dataset.pokerSize));
document.querySelectorAll('[data-wallet-tab]').forEach(b=>b.onclick=()=>setProfileWalletTab(b.dataset.walletTab));document.querySelectorAll('[data-poker-mode]').forEach(b=>b.onclick=()=>setPokerMode(b.dataset.pokerMode));
document.getElementById('pokerQuickJoin').onclick=()=>arcadeNetPokerJoin(pokerMode);document.getElementById('pokerRebuy').onclick=()=>arcadeNetPokerRebuy();document.getElementById('pokerLeave').onclick=arcadeNetPokerLeave;document.getElementById('pokerReconnect').onclick=()=>arcadeNetConnect(true);document.getElementById('pokerFold').onclick=()=>arcadeNetPokerAction('fold');document.getElementById('pokerCheckCall').onclick=()=>arcadeNetPokerAction((window.arcadeNetState.poker?.you?.toCall||0)>0?'call':'check');document.getElementById('pokerRaise').onclick=()=>arcadeNetPokerAction('bet');document.getElementById('onlineBadge').onclick=()=>showArcadeToast(window.arcadeNetState.connected?'SERVER LINK ONLINE':(isFounderProfile()?'FOUNDER ONLINE':'LOCAL MODE'),window.arcadeNetState.connected?`${window.arcadeNetState.onlineCount} игроков подключено к backend`:(isFounderProfile()?'Ваш founder-профиль всегда отображается ONLINE; сетевые игры требуют работающий backend.':'Сетевые игры требуют работающий JVRX backend.'),window.arcadeNetState.connected?'●':'○');
loadLocalMuraTokens();renderPokerState({mode:'jarvis',seats:Array(2).fill(null),community:[],pot:0,street:'waiting',handNo:0,you:null,smallBlind:1,bigBlind:2});setOnlineBadge('offline',1);renderOnlineSummary();renderPokerWallet();setPokerNetStatus(false,isFounderProfile()?'FOUNDER ONLINE • LOCAL MODE':'LOCAL MODE • server link offline');pokerModeUI();if(location.protocol!=='file:'&&location.origin!=='null')setTimeout(()=>arcadeNetConnect(),80);

// JRVX CAS v3.0.10: Arcade cosmetics/Pong/Breakout excluded from CAS production runtime.
// VIRTUAL CASINO HELPERS
function casinoUnit(){try{return window.JVRXCasEconomy?.get?.().currency==='MG'?'MG':'MS'}catch{return'MS'}}
function casinoRefresh(){const b=`${muraTokenBalance().toLocaleString('ru-RU')} ${casinoUnit()}`;const bj=document.getElementById('blackjackBalance'),rr=document.getElementById('rouletteBalance');if(bj)bj.textContent=b;if(rr)rr.textContent=b}
function casinoTakeBet(amount){amount=Math.floor(amount);const bal=muraTokenBalance();if(amount<=0||bal<amount)return false;setMuraTokenBalance(bal-amount);playerProfile.casinoWagered=(playerProfile.casinoWagered||0)+amount;savePlayerProfile();casinoRefresh();renderPlayerProfile();checkAchievements();return true}
function casinoReturn(payout,profit){payout=Math.max(0,Math.floor(payout));setMuraTokenBalance(muraTokenBalance()+payout);playerProfile.casinoProfit=(playerProfile.casinoProfit||0)+Math.floor(profit||0);savePlayerProfile();casinoRefresh();renderPlayerProfile();checkAchievements()}
function currentCasinoAdminMode(){if(!isFounderProfile())return 'normal';try{return localStorage.getItem('jarvisCasinoAdminModeV1')||'normal'}catch{return 'normal'}}
function setCasinoAdminMode(mode){mode=['normal','favor','challenge'].includes(mode)?mode:'normal';if(!isFounderProfile())mode='normal';try{localStorage.setItem('jarvisCasinoAdminModeV1',mode)}catch{};for(const id of ['bjAdminTestMode','rouletteAdminTestMode']){const e=document.getElementById(id);if(e)e.value=mode}updateAdminCasinoControls();return mode}
function updateAdminCasinoControls(){const founder=isFounderProfile();for(const id of ['bjAdminTestWrap','rouletteAdminTestWrap'])document.getElementById(id)?.classList.toggle('active',founder);if(founder){const m=currentCasinoAdminMode();for(const id of ['bjAdminTestMode','rouletteAdminTestMode']){const e=document.getElementById(id);if(e)e.value=m}}}
for(const id of ['bjAdminTestMode','rouletteAdminTestMode'])document.getElementById(id)?.addEventListener('change',e=>setCasinoAdminMode(e.target.value));

// BLACKJACK
const BJ_SUITS=['♠','♥','♦','♣'],BJ_RANKS=['A','2','3','4','5','6','7','8','9','10','J','Q','K'];let bjDeck=[],bjPlayer=[],bjDealer=[],bjBet=50,bjStake=0,bjActive=false,bjHideDealer=true;
function bjNewDeck(){bjDeck=[];for(const s of BJ_SUITS)for(const r of BJ_RANKS)bjDeck.push({s,r});for(let i=bjDeck.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[bjDeck[i],bjDeck[j]]=[bjDeck[j],bjDeck[i]]}}
function bjDraw(){if(!bjDeck.length)bjNewDeck();return bjDeck.pop()}
function bjValue(hand){let total=0,aces=0;for(const c of hand){if(c.r==='A'){total+=11;aces++}else if(['K','Q','J'].includes(c.r))total+=10;else total+=Number(c.r)}while(total>21&&aces){total-=10;aces--}return total}
function bjCardHTML(c,back=false){if(back)return '<div class="playingCard back"></div>';const red=c.s==='♥'||c.s==='♦';return `<div class="playingCard ${red?'red':''}">${c.r}<small>${c.s}</small><span class="cardCenter">${c.s}</span></div>`}
function bjGetBet(){const v=Math.floor(Number(document.getElementById('bjBetInput').value||0));return Number.isFinite(v)&&v>0?v:0}
function bjSyncBetChips(){const val=String(document.getElementById('bjBetInput').value||'');document.querySelectorAll('[data-bj-bet]').forEach(x=>x.classList.toggle('active',x.dataset.bjBet===val))}
function bjRenderHandV67(id,hand,hideSecond=false){
  const host=document.getElementById(id);if(!host)return;
  while(host.children.length>hand.length)host.lastElementChild.remove();
  hand.forEach((c,i)=>{
    const hidden=!!(hideSecond&&i===1),key=hidden?'BACK':`${c.r}${c.s}`,x=`${i*58}px`,xm=`${i*44}px`;
    let node=host.children[i];
    if(!node){const wrap=document.createElement('div');wrap.innerHTML=bjCardHTML(c,hidden).trim();node=wrap.firstElementChild;node.dataset.cardKey=key;node.style.setProperty('--bj-x',x);node.style.setProperty('--bj-xm',xm);node.classList.add('v67-card-enter');host.appendChild(node);setTimeout(()=>node?.classList.remove('v67-card-enter'),560);return}
    node.style.setProperty('--bj-x',x);node.style.setProperty('--bj-xm',xm);
    if(node.dataset.cardKey!==key){const wrap=document.createElement('div');wrap.innerHTML=bjCardHTML(c,hidden).trim();const fresh=wrap.firstElementChild;fresh.dataset.cardKey=key;fresh.style.setProperty('--bj-x',x);fresh.style.setProperty('--bj-xm',xm);fresh.classList.add(hidden?'v67-card-enter':'v67-card-flip');node.replaceWith(fresh);setTimeout(()=>fresh?.classList.remove('v67-card-enter','v67-card-flip'),720)}
  });
}
function bjRender(){const cbet=document.getElementById('bjCurrentBet');if(cbet)cbet.textContent=`${bjActive?bjStake:bjGetBet()||0} ${casinoUnit()}`;bjRenderHandV67('playerCards',bjPlayer,false);bjRenderHandV67('dealerCards',bjDealer,bjHideDealer);document.getElementById('playerValue').textContent=bjPlayer.length?bjValue(bjPlayer):0;document.getElementById('dealerValue').textContent=bjDealer.length?(bjHideDealer?bjValue([bjDealer[0]]):bjValue(bjDealer)):'?';document.getElementById('playerHand')?.classList.toggle('playerTurn',bjActive);document.getElementById('dealerHand')?.classList.toggle('playerTurn',!bjHideDealer&&bjActive);casinoRefresh();bjSyncBetChips()}
function bjButtons(active){document.getElementById('bjHit').disabled=!active;document.getElementById('bjStand').disabled=!active;document.getElementById('bjDouble').disabled=!active||bjPlayer.length!==2;document.getElementById('bjDeal').disabled=active;document.getElementById('bjBetInput').disabled=active}
function bjFinish(reason){bjActive=false;bjHideDealer=false;let pv=bjValue(bjPlayer),dv=bjValue(bjDealer),payout=0,profit=-bjStake,win=false,natural=false;if(reason==='playerBust'){reason='Перебор. Дилер выигрывает.'}else{natural=bjPlayer.length===2&&pv===21;if(dv>21||pv>dv){win=true;payout=natural?Math.floor(bjStake*2.5):bjStake*2;profit=payout-bjStake;reason=natural?'BLACKJACK! Выплата 3:2.':'Вы победили дилера.'}else if(pv===dv){payout=bjStake;profit=0;reason='Ничья. Ставка возвращена.'}else reason='Дилер победил.'}if(payout)casinoReturn(payout,profit);else{playerProfile.casinoProfit=(playerProfile.casinoProfit||0)-bjStake;savePlayerProfile();renderPlayerProfile()}if(win){profileEvent('blackjackWin');profileEvent('win');awardXP(18);if(natural)profileEvent('blackjackNatural')}const msg=document.getElementById('bjMessage');msg.textContent=`${reason} ${profit>0?`+${profit} ${casinoUnit()}`:profit<0?`${profit} ${casinoUnit()}`:''}`;msg.className='casinoMessage '+(profit>0?'win':profit<0?'loss':'push');msg.textContent+=` • Нажмите «Ещё раз»`;bjButtons(false);document.getElementById('bjDeal').textContent='Ещё раз';bjRender();checkAchievements()}
function bjDeal(){if(bjActive)return;document.getElementById('bjDeal').textContent='Раздать';bjBet=bjGetBet();if(!bjBet){document.getElementById('bjMessage').textContent='Введите корректную ставку.';return}if(!casinoTakeBet(bjBet)){document.getElementById('bjMessage').textContent=`Недостаточно ${casinoUnit()} для этой ставки.`;return}profileEvent('blackjackHand');bjStake=bjBet;bjNewDeck();const adminMode=currentCasinoAdminMode();if(adminMode==='favor'){bjPlayer=[{s:'♠',r:'A'},{s:'♥',r:'K'}];bjDealer=[bjDraw(),bjDraw()]}else if(adminMode==='challenge'){bjPlayer=[bjDraw(),bjDraw()];bjDealer=[{s:'♠',r:'A'},{s:'♦',r:'K'}]}else{bjPlayer=[bjDraw(),bjDraw()];bjDealer=[bjDraw(),bjDraw()]};bjActive=true;bjHideDealer=true;bjButtons(true);const msg=document.getElementById('bjMessage');msg.className='casinoMessage';msg.textContent=`Ставка ${bjStake} ${casinoUnit()}`;bjRender();if(bjValue(bjPlayer)===21){bjHideDealer=false;while(bjValue(bjDealer)<17)bjDealer.push(bjDraw());bjFinish('natural')}}
function bjHit(){if(!bjActive)return;bjPlayer.push(bjDraw());bjButtons(true);bjRender();if(bjValue(bjPlayer)>21)bjFinish('playerBust')}
function bjStand(){if(!bjActive)return;bjHideDealer=false;while(bjValue(bjDealer)<17)bjDealer.push(bjDraw());bjFinish('stand')}
function bjDouble(){if(!bjActive||bjPlayer.length!==2)return;const extra=bjStake;if(!casinoTakeBet(extra)){document.getElementById('bjMessage').textContent=`Недостаточно ${casinoUnit()} для удвоения ставки.`;return}bjStake+=extra;bjPlayer.push(bjDraw());bjRender();if(bjValue(bjPlayer)>21)bjFinish('playerBust');else bjStand()}
document.querySelectorAll('[data-bj-bet]').forEach(b=>b.onclick=()=>{if(bjActive)return;document.getElementById('bjBetInput').value=b.dataset.bjBet;bjSyncBetChips();document.getElementById('bjMessage').textContent=`Ставка выбрана: ${b.dataset.bjBet} ${casinoUnit()}`});document.getElementById('bjBetInput').addEventListener('input',()=>{bjSyncBetChips();bjRender()});document.getElementById('bjDeal').onclick=bjDeal;document.getElementById('bjHit').onclick=bjHit;document.getElementById('bjStand').onclick=bjStand;document.getElementById('bjDouble').onclick=bjDouble;
const bjRulesOverlay=document.getElementById('bjRulesOverlay');if(bjRulesOverlay&&bjRulesOverlay.parentElement!==document.body)document.body.appendChild(bjRulesOverlay);
function openBjRules(){bjRulesOverlay.classList.add('active');bjRulesOverlay.setAttribute('aria-hidden','false')}
function closeBjRules(){bjRulesOverlay.classList.remove('active');bjRulesOverlay.setAttribute('aria-hidden','true')}
document.getElementById('bjInfoBtn').onclick=openBjRules;document.getElementById('bjRulesClose').onclick=closeBjRules;document.getElementById('bjRulesDone').onclick=closeBjRules;bjRulesOverlay.addEventListener('click',e=>{if(e.target===bjRulesOverlay)closeBjRules()});document.addEventListener('keydown',e=>{if(e.key==='Escape'&&bjRulesOverlay.classList.contains('active'))closeBjRules()});


// ROULETTE — v42 continuous-physics rebuild
const R_RED=new Set([1,3,5,7,9,12,14,16,18,19,21,23,25,27,30,32,34,36]);
const R_ORDER=[0,32,15,19,4,21,2,25,17,34,6,27,13,36,11,30,8,23,10,5,24,16,33,1,20,14,31,9,22,18,29,7,28,12,35,3,26];
const R_TAU=Math.PI*2,R_SEG=R_TAU/R_ORDER.length;
let rouletteBet=50,rouletteType='red',rouletteExact=null,rouletteBusy=false,rouletteSpinDuration=7600;
let rouletteHistory=(()=>{try{return JSON.parse(localStorage.getItem('jarvisRouletteHistoryV1')||'[]')}catch{return[]}})();
const rouletteCanvasEl=document.getElementById('rouletteCanvas'),rouletteCtx=rouletteCanvasEl.getContext('2d');
const rouletteState={wheelAngle:0,ballAngle:-Math.PI/2,ballRadius:null,lastNumber:null,highlightIndex:-1,phase:'idle',spinPlan:null};
function rouletteColor(n){if(n===0)return'green';return R_RED.has(n)?'red':'black'}
function rouletteWins(type,n,exact){if(type==='red'||type==='black')return rouletteColor(n)===type;if(type==='even')return n!==0&&n%2===0;if(type==='odd')return n!==0&&n%2===1;if(type==='low')return n>=1&&n<=18;if(type==='high')return n>=19&&n<=36;if(type==='exact')return n===exact;return false}
function norm(a){a%=R_TAU;if(a<0)a+=R_TAU;return a}
function shortestAngleDelta(from,to){let d=norm(to)-norm(from);if(d>Math.PI)d-=R_TAU;if(d<-Math.PI)d+=R_TAU;return d}
function roulettePocketCenterAngle(index,wheelAngle=rouletteState.wheelAngle){return wheelAngle+(index+.5)*R_SEG-Math.PI/2}
function roulettePocketIndexAtAngle(ballAngle,wheelAngle=rouletteState.wheelAngle){const rel=norm(ballAngle-wheelAngle+Math.PI/2);return Math.min(36,Math.floor(rel/R_SEG))}
function rouletteCurrentBet(){const v=Math.floor(Number(document.getElementById('rouletteBetInput').value||0));return Number.isFinite(v)&&v>0?v:0}
function rouletteSyncBetChips(){const val=String(document.getElementById('rouletteBetInput').value||'');document.querySelectorAll('[data-r-bet]').forEach(x=>x.classList.toggle('active',x.dataset.rBet===val))}
function rouletteSetSelection(type,exact=null){rouletteType=type;rouletteExact=exact;document.querySelectorAll('.rouletteBet').forEach(x=>x.classList.remove('active'));if(type==='exact'){const btn=document.querySelector(`.numberBet[data-number="${exact}"]`);if(btn)btn.classList.add('active');document.getElementById('rouletteSelection').textContent=`Выбрана ставка: число ${exact} • выплата ×36`}else{const btn=document.querySelector(`.outsideBet[data-r-type="${type}"]`);if(btn)btn.classList.add('active');const names={red:'Красное',black:'Чёрное',even:'Чётное',odd:'Нечётное',low:'1–18',high:'19–36'};document.getElementById('rouletteSelection').textContent=`Выбрана ставка: ${names[type]} • выплата ×2`}}
function rouletteGeometry(){const size=Math.min(rouletteCanvasEl.width,rouletteCanvasEl.height),R=size/2;return{size,R,cx:rouletteCanvasEl.width/2,cy:rouletteCanvasEl.height/2,frame:R*.97,wood:R*.88,brass:R*.755,pocketOuter:R*.733,pocketInner:R*.50,numberR:R*.665,felt:R*.474,brandR:R*.365,rail:R*.813,prePocket:R*.755,ballPocket:R*.56,hub:R*.142}}
function rouletteDrawCircularBrand(ctx,r,wheelAngle){const count=12;ctx.save();ctx.fillStyle='#f8e6b4';ctx.font='900 15px system-ui';ctx.textAlign='center';ctx.textBaseline='middle';ctx.shadowBlur=4;ctx.shadowColor='rgba(0,0,0,.24)';for(let i=0;i<count;i++){const a=wheelAngle+i*R_TAU/count;ctx.save();ctx.rotate(a+Math.PI/2);ctx.translate(0,-r);ctx.fillText('JRVX',0,0);ctx.restore();const da=a+R_TAU/(count*2);ctx.beginPath();ctx.arc(Math.cos(da)*r,Math.sin(da)*r,2,0,R_TAU);ctx.fill()}ctx.restore()}
function rouletteDraw(){const g=rouletteGeometry(),ctx=rouletteCtx;ctx.clearRect(0,0,rouletteCanvasEl.width,rouletteCanvasEl.height);ctx.save();ctx.translate(g.cx,g.cy);
  if(window.JRVXRoulettePhoto?.draw(ctx,g,rouletteState,window.JRVXRouletteArtwork,rouletteBusy)){ctx.restore();return}
  ctx.save();ctx.shadowBlur=g.R*.12;ctx.shadowColor='rgba(0,0,0,.48)';ctx.fillStyle='rgba(0,0,0,.25)';ctx.beginPath();ctx.ellipse(0,g.R*.035,g.frame*.99,g.frame*.94,0,0,R_TAU);ctx.fill();ctx.restore();
  const frame=ctx.createRadialGradient(-g.R*.16,-g.R*.16,g.R*.08,0,0,g.frame);frame.addColorStop(0,'#fff0c7');frame.addColorStop(.16,'#d7ad62');frame.addColorStop(.48,'#735026');frame.addColorStop(.72,'#a77735');frame.addColorStop(1,'#f0cf87');ctx.fillStyle=frame;ctx.beginPath();ctx.arc(0,0,g.frame,0,R_TAU);ctx.fill();ctx.strokeStyle='rgba(255,248,218,.38)';ctx.lineWidth=g.R*.008;ctx.beginPath();ctx.arc(0,0,g.frame-g.R*.018,0,R_TAU);ctx.stroke();ctx.save();ctx.globalAlpha=.34;ctx.strokeStyle='#fff6d5';ctx.lineWidth=g.R*.012;ctx.beginPath();ctx.arc(0,0,g.frame-g.R*.035,-2.55,-.65);ctx.stroke();ctx.restore();
  const wood=ctx.createRadialGradient(0,0,g.wood*.15,0,0,g.wood);wood.addColorStop(0,'#4a2a13');wood.addColorStop(.65,'#261309');wood.addColorStop(1,'#120a06');ctx.fillStyle=wood;ctx.beginPath();ctx.arc(0,0,g.wood,0,R_TAU);ctx.fill();const brass=ctx.createRadialGradient(-g.R*.12,-g.R*.14,g.R*.05,0,0,g.brass);brass.addColorStop(0,'#f3d99f');brass.addColorStop(.3,'#bf8f49');brass.addColorStop(.68,'#735027');brass.addColorStop(1,'#dfba70');ctx.fillStyle=brass;ctx.beginPath();ctx.arc(0,0,g.brass,0,R_TAU);ctx.fill();
  for(let i=0;i<R_ORDER.length;i++){const n=R_ORDER[i],a0=rouletteState.wheelAngle+i*R_SEG-Math.PI/2,a1=a0+R_SEG,mid=(a0+a1)/2,color=rouletteColor(n);ctx.beginPath();ctx.arc(0,0,g.pocketOuter,a0,a1);ctx.arc(0,0,g.pocketInner,a1,a0,true);ctx.closePath();const pocketGrad=ctx.createRadialGradient(0,0,g.pocketInner,0,0,g.pocketOuter);pocketGrad.addColorStop(0,color==='red'?'#7b172b':color==='black'?'#090d11':'#0b5635');pocketGrad.addColorStop(.48,color==='red'?'#bb2d4b':color==='black'?'#20272e':'#178b54');pocketGrad.addColorStop(1,color==='red'?'#8b1b33':color==='black'?'#0d1116':'#0d603b');ctx.fillStyle=pocketGrad;ctx.fill();ctx.strokeStyle='rgba(255,240,204,.24)';ctx.lineWidth=g.R*.0042;ctx.stroke();if(rouletteState.highlightIndex===i){ctx.save();ctx.shadowBlur=g.R*.09;ctx.shadowColor='rgba(255,231,164,.72)';ctx.fillStyle='rgba(255,241,195,.13)';ctx.strokeStyle='#ffe8aa';ctx.lineWidth=g.R*.015;ctx.fill();ctx.stroke();ctx.restore()}ctx.save();ctx.translate(Math.cos(mid)*g.numberR,Math.sin(mid)*g.numberR);ctx.rotate(mid+Math.PI/2);ctx.fillStyle='#fff';ctx.strokeStyle='rgba(0,0,0,.86)';ctx.lineWidth=g.R*.011;ctx.font=`950 ${Math.round(g.R*.068)}px "Arial Narrow",system-ui`;ctx.textAlign='center';ctx.textBaseline='middle';ctx.strokeText(String(n),0,0);ctx.fillText(String(n),0,0);ctx.restore()}
  ctx.strokeStyle='rgba(255,255,255,.20)';ctx.lineWidth=g.R*.006;ctx.beginPath();ctx.arc(0,0,g.pocketOuter+g.R*.012,0,R_TAU);ctx.stroke();ctx.beginPath();ctx.arc(0,0,g.pocketInner-g.R*.012,0,R_TAU);ctx.stroke();const felt=ctx.createRadialGradient(-g.R*.08,-g.R*.08,g.R*.04,0,0,g.felt);felt.addColorStop(0,'#347557');felt.addColorStop(.72,'#22513b');felt.addColorStop(1,'#163426');ctx.fillStyle=felt;ctx.beginPath();ctx.arc(0,0,g.felt,0,R_TAU);ctx.fill();ctx.strokeStyle='#dcb970';ctx.lineWidth=g.R*.018;ctx.stroke();rouletteDrawCircularBrand(ctx,g.brandR,rouletteState.wheelAngle*.24);
  const hub=ctx.createRadialGradient(-g.hub*.3,-g.hub*.3,g.hub*.08,0,0,g.hub);hub.addColorStop(0,'#283640');hub.addColorStop(.55,'#081118');hub.addColorStop(1,'#020508');ctx.fillStyle=hub;ctx.beginPath();ctx.arc(0,0,g.hub,0,R_TAU);ctx.fill();ctx.strokeStyle='rgba(255,229,164,.38)';ctx.lineWidth=g.R*.004;ctx.stroke();ctx.fillStyle='#f5dda0';ctx.beginPath();ctx.arc(0,0,g.R*.035,0,R_TAU);ctx.fill();ctx.fillStyle='rgba(255,255,255,.45)';ctx.beginPath();ctx.arc(-g.R*.011,-g.R*.012,g.R*.009,0,R_TAU);ctx.fill();ctx.strokeStyle='rgba(255,255,255,.14)';ctx.lineWidth=g.R*.038;ctx.beginPath();ctx.arc(0,0,g.rail,0,R_TAU);ctx.stroke();ctx.strokeStyle='rgba(0,0,0,.30)';ctx.lineWidth=g.R*.006;ctx.beginPath();ctx.arc(0,0,g.rail-g.R*.022,0,R_TAU);ctx.stroke();
  // Photographic materials only. All 37 numbered pockets and the ball remain deterministic.
  const artwork=window.JRVXRouletteArtwork;
  if(artwork?.complete&&artwork.naturalWidth){
   ctx.save();ctx.beginPath();ctx.arc(0,0,g.frame,0,R_TAU);ctx.arc(0,0,g.R*.847,R_TAU,0,true);ctx.clip();ctx.drawImage(artwork,-g.frame,-g.frame,g.frame*2,g.frame*2);ctx.restore();
   ctx.save();ctx.beginPath();ctx.arc(0,0,g.felt-g.R*.01,0,R_TAU);ctx.clip();ctx.rotate(rouletteState.wheelAngle);ctx.drawImage(artwork,-g.frame*1.28,-g.frame*1.28,g.frame*2.56,g.frame*2.56);ctx.restore();
  }
  const br=g.R*.034,ballR=rouletteState.ballRadius??g.rail,bx=Math.cos(rouletteState.ballAngle)*ballR,by=Math.sin(rouletteState.ballAngle)*ballR;if(rouletteBusy&&rouletteState.phase!=='settled'){for(let i=3;i>=1;i--){const a=rouletteState.ballAngle-i*.028,r=ballR+i*.6;ctx.save();ctx.globalAlpha=.045*i;ctx.fillStyle='#fff';ctx.beginPath();ctx.arc(Math.cos(a)*r,Math.sin(a)*r,br*(.48+.1*i),0,R_TAU);ctx.fill();ctx.restore()}}ctx.save();ctx.fillStyle='rgba(0,0,0,.34)';ctx.beginPath();ctx.ellipse(bx+g.R*.012,by+g.R*.018,br*1.05,br*.65,0,0,R_TAU);ctx.fill();ctx.shadowBlur=g.R*.065;ctx.shadowColor='rgba(255,255,255,.75)';const ball=ctx.createRadialGradient(bx-br*.32,by-br*.38,br*.05,bx,by,br);ball.addColorStop(0,'#ffffff');ball.addColorStop(.38,'#f6fbff');ball.addColorStop(.75,'#cbd4db');ball.addColorStop(1,'#89949d');ctx.fillStyle=ball;ctx.beginPath();ctx.arc(bx,by,br,0,R_TAU);ctx.fill();ctx.restore();
  ctx.save();ctx.translate(0,-g.frame-g.R*.012);ctx.shadowBlur=g.R*.04;ctx.shadowColor='rgba(255,226,156,.44)';const marker=ctx.createLinearGradient(0,-g.R*.065,0,g.R*.025);marker.addColorStop(0,'#fff0bd');marker.addColorStop(1,'#b98537');ctx.fillStyle=marker;ctx.beginPath();ctx.moveTo(0,g.R*.025);ctx.lineTo(-g.R*.052,-g.R*.07);ctx.lineTo(g.R*.052,-g.R*.07);ctx.closePath();ctx.fill();ctx.restore();ctx.restore()}
function rouletteRenderHistory(){const host=document.getElementById('rouletteHistory');host.innerHTML=`<div class="rouletteSectionTitle" style="width:100%">Последние числа</div>`+rouletteHistory.slice(0,12).map(n=>`<span class="rouletteHistoryBall ${rouletteColor(n)}">${n}</span>`).join('')}
function rouletteUpdatePreview(n){const result=document.getElementById('rouletteResult'),preview=document.getElementById('roulettePocketPreview');if(n==null){result.textContent='—';result.className='rouletteResult';preview.innerHTML='<div class="rouletteSectionTitle">Последняя лунка</div><div>Запустите колесо, чтобы увидеть результат.<div class="rouletteZoomNote">Шар плавно теряет скорость, затем физически фиксируется в одной лунке.</div></div>';return}const color=rouletteColor(n),label=color==='red'?'Красное':color==='black'?'Чёрное':'Зеро',idx=R_ORDER.indexOf(n),left=R_ORDER[(idx-1+37)%37],right=R_ORDER[(idx+1)%37];result.textContent=n;result.className=`rouletteResult ${color}`;preview.innerHTML=`<div class="rouletteSectionTitle">Финальная лунка</div><div><span class="roulettePocketCard ${color}">${n}</span><strong>${label}</strong><div class="score">Шар остановился в лунке № ${n}</div><div class="rouletteLandingStrip"><div class="rouletteLandingCell ${rouletteColor(left)}">${left}</div><div class="rouletteLandingCell winner ${color}">${n}</div><div class="rouletteLandingCell ${rouletteColor(right)}">${right}</div></div><div class="rouletteSpinMeta"><span>Лунка подтверждена физикой</span><span>Соседи: ${left} / ${right}</span></div></div>`}
function rouletteRenderNumbers(){const host=document.getElementById('rouletteNumbers');host.innerHTML=Array.from({length:37},(_,n)=>`<button class="btn rouletteBet numberBet ${rouletteColor(n)}" data-number="${n}">${n}</button>`).join('');host.querySelectorAll('[data-number]').forEach(b=>b.onclick=()=>{if(!rouletteBusy)rouletteSetSelection('exact',Number(b.dataset.number))})}
function rouletteWheelEase(p){return 1-Math.pow(1-p,3)}
function rouletteWheelEaseD(p){return 3*Math.pow(1-p,2)}
function rouletteFreeEase(u){return u+.55*u*(1-u)}
function rouletteFreeEaseD(u){return 1+.55*(1-2*u)}
function rouletteSmooth(u){return u*u*(3-2*u)}
function rouletteHermite(p0,v0,p1,v1,u,T){const u2=u*u,u3=u2*u,h00=2*u3-3*u2+1,h10=u3-2*u2+u,h01=-2*u3+3*u2,h11=u3-u2;return h00*p0+h10*T*v0+h01*p1+h11*T*v1}
function rouletteAdminTargetIndex(){const mode=currentCasinoAdminMode();if(mode==='normal')return Math.floor(Math.random()*37);const wins=[];for(let i=0;i<37;i++){const n=R_ORDER[i],w=rouletteWins(rouletteType,n,rouletteExact);if((mode==='favor'&&w)||(mode==='challenge'&&!w))wins.push(i)}return wins.length?wins[Math.floor(Math.random()*wins.length)]:Math.floor(Math.random()*37)}
function rouletteBuildSpinPlan(verifiedTargetIndex=null){const g=rouletteGeometry(),duration=rouletteSpinDuration/1000,captureP=.77,ingressP=.58,startWheel=rouletteState.wheelAngle,startBall=rouletteState.ballAngle;const wheelDelta=-R_TAU*7,ballTurns=12.72,ballDelta=R_TAU*ballTurns,wheelCapture=startWheel+wheelDelta*rouletteWheelEase(captureP),ballCapture=startBall+ballDelta,wheelVelCapture=wheelDelta*rouletteWheelEaseD(captureP)/duration,ballVelCapture=ballDelta*rouletteFreeEaseD(1)/(captureP*duration),rel0=ballCapture-wheelCapture,relVel0=ballVelCapture-wheelVelCapture,capT=(1-captureP)*duration,targetIndex=Number.isInteger(verifiedTargetIndex)&&verifiedTargetIndex>=0&&verifiedTargetIndex<37?verifiedTargetIndex:rouletteAdminTargetIndex(),landingOffset=(Math.random()-.5)*R_SEG*.08,baseTarget=(targetIndex+.5)*R_SEG-Math.PI/2+landingOffset,desiredDelta=relVel0*capT*.48;let best=null,nearestK=Math.round((rel0+desiredDelta-baseTarget)/R_TAU);for(let k=nearestK-3;k<=nearestK+4;k++){const target=baseTarget+k*R_TAU,delta=target-rel0;if(delta<=0)continue;const slope=(relVel0*capT)/delta;if(slope<1.18||slope>2.75)continue;const score=Math.abs(slope-2.05);if(!best||score<best.score)best={target,score,slope}}if(!best){let k=nearestK;let target=baseTarget+k*R_TAU;while(target<=rel0+(relVel0*capT)/2.75)target+=R_TAU;best={target,score:0,slope:(relVel0*capT)/(target-rel0)}}const targetRel=best.target;return{g,duration,captureP,ingressP,startWheel,startBall,wheelDelta,ballDelta,wheelCapture,ballCapture,wheelVelCapture,ballVelCapture,rel0,relVel0,capT,targetRel,targetIndex,landingOffset,hermiteSlope:best.slope,finalWheel:startWheel+wheelDelta}}
function rouletteSampleSpinPlan(plan,p){p=Math.max(0,Math.min(1,p));const wheelAngle=plan.startWheel+plan.wheelDelta*rouletteWheelEase(p),g=plan.g;let ballAngle,ballRadius,phase='rail',highlightIndex=-1;if(p<plan.captureP){const u=p/plan.captureP;ballAngle=plan.startBall+plan.ballDelta*rouletteFreeEase(u);if(p<=plan.ingressP)ballRadius=g.rail;else{const q=rouletteSmooth((p-plan.ingressP)/(plan.captureP-plan.ingressP));ballRadius=g.rail+(g.prePocket-g.rail)*q;phase='descent'}}else{const u=(p-plan.captureP)/(1-plan.captureP),rel=rouletteHermite(plan.rel0,plan.relVel0,plan.targetRel,0,u,plan.capT);ballAngle=wheelAngle+rel;const err=Math.abs(plan.targetRel-rel),safeR=g.pocketOuter+g.R*.018,approach=rouletteSmooth(Math.max(0,Math.min(1,(u-.08)/.78)));ballRadius=g.prePocket+(safeR-g.prePocket)*approach;const timeDrop=rouletteSmooth(Math.max(0,Math.min(1,(u-.80)/.20))),angleLock=Math.max(0,Math.min(1,1-err/(R_SEG*.45))),drop=Math.min(timeDrop,angleLock);ballRadius=ballRadius+(g.ballPocket-ballRadius)*rouletteSmooth(drop);phase=drop<=.02?'capture':drop<.72?'settling':'pocket';if(angleLock>.50&&u>.82)highlightIndex=plan.targetIndex}if(p>=1){phase='settled';highlightIndex=plan.targetIndex}return{wheelAngle,ballAngle,ballRadius,phase,highlightIndex}}
function rouletteAnimate(done,verifiedTargetIndex=null,isCurrent=null){const plan=rouletteBuildSpinPlan(verifiedTargetIndex);rouletteState.spinPlan=plan;rouletteState.highlightIndex=-1;const t0=performance.now(),duration=window.JRVXExperience?.settings?.animations===false?Math.min(.25,plan.duration):plan.duration;let lastPhase='';function frame(now){if(isCurrent&&!isCurrent())return;const p=Math.min(1,(now-t0)/(duration*1000)),s=rouletteSampleSpinPlan(plan,p);rouletteState.wheelAngle=s.wheelAngle;rouletteState.ballAngle=s.ballAngle;rouletteState.ballRadius=s.ballRadius;rouletteState.phase=s.phase;rouletteState.highlightIndex=s.highlightIndex;if(s.phase!==lastPhase){lastPhase=s.phase;const msg=document.getElementById('rouletteMessage');if(s.phase==='rail')msg.textContent='Колесо набирает ход…';else if(s.phase==='descent')msg.textContent='Шар постепенно теряет скорость…';else if(s.phase==='capture')msg.textContent='Шар входит во внутреннюю дорожку…';else if(s.phase==='settling')msg.textContent='Шар подходит к лунке…';else if(s.phase==='pocket')msg.textContent='Шар мягко опускается в лунку…'}const live=document.visibilityState==='visible'&&document.getElementById('roulette')?.classList.contains('active');if(live){try{rouletteDraw()}catch{}}if(p<1){if(live)requestAnimationFrame(frame);else setTimeout(()=>frame(performance.now()),240)}else{const actual=roulettePocketIndexAtAngle(rouletteState.ballAngle,rouletteState.wheelAngle);done&&done(actual,plan)}}requestAnimationFrame(frame)}
function rouletteSpin(){if(rouletteBusy)return;rouletteBet=rouletteCurrentBet();if(!rouletteBet){document.getElementById('rouletteMessage').textContent='Введите корректную ставку.';return}if(rouletteType==='exact'&&rouletteExact==null){document.getElementById('rouletteMessage').textContent='Выберите точное число.';return}if(!casinoTakeBet(rouletteBet)){document.getElementById('rouletteMessage').textContent=`Недостаточно ${casinoUnit()} для этой ставки.`;return}profileEvent('rouletteSpin');rouletteBusy=true;document.getElementById('rouletteSpin').disabled=true;rouletteAnimate((actualIndex)=>{const n=R_ORDER[actualIndex],win=rouletteWins(rouletteType,n,rouletteExact),mult=rouletteType==='exact'?36:2,payout=win?rouletteBet*mult:0,profit=win?payout-rouletteBet:-rouletteBet;if(win){casinoReturn(payout,profit);profileEvent('rouletteWin');profileEvent('win');awardXP(rouletteType==='exact'?35:14);if(rouletteType==='exact')profileEvent('rouletteStraight')}else{playerProfile.casinoProfit=(playerProfile.casinoProfit||0)-rouletteBet;savePlayerProfile();renderPlayerProfile()}rouletteState.lastNumber=n;rouletteState.highlightIndex=actualIndex;rouletteHistory.unshift(n);rouletteHistory=rouletteHistory.slice(0,20);try{localStorage.setItem('jarvisRouletteHistoryV1',JSON.stringify(rouletteHistory))}catch{}rouletteUpdatePreview(n);rouletteRenderHistory();const rcan=document.getElementById('rouletteCanvas'),rp=document.getElementById('roulettePocketPreview');rcan.classList.remove('reveal');void rcan.offsetWidth;rcan.classList.add('reveal');rp.classList.add('hit');setTimeout(()=>rp.classList.remove('hit'),1100);rouletteDraw();document.getElementById('rouletteMessage').textContent=win?`Победа! +${profit} ${casinoUnit()} • выпало ${n}`:`Выпало ${n} • ставка проиграна`;rouletteBusy=false;document.getElementById('rouletteSpin').disabled=false;casinoRefresh();checkAchievements()})}
document.querySelectorAll('[data-r-bet]').forEach(b=>b.onclick=()=>{if(rouletteBusy)return;document.getElementById('rouletteBetInput').value=b.dataset.rBet;rouletteSyncBetChips()});document.getElementById('rouletteBetInput').addEventListener('input',rouletteSyncBetChips);document.querySelectorAll('[data-r-type]').forEach(b=>b.onclick=()=>{if(!rouletteBusy)rouletteSetSelection(b.dataset.rType)});document.getElementById('rouletteSpin').onclick=rouletteSpin;rouletteRenderNumbers();rouletteSetSelection('red');rouletteSyncBetChips();rouletteUpdatePreview(rouletteHistory[0]??null);rouletteRenderHistory();if(rouletteHistory.length){const n=rouletteHistory[0],idx=R_ORDER.indexOf(n);rouletteState.lastNumber=n;rouletteState.highlightIndex=idx;rouletteState.wheelAngle=Math.random()*R_TAU;rouletteState.ballAngle=roulettePocketCenterAngle(idx,rouletteState.wheelAngle);rouletteState.ballRadius=rouletteGeometry().ballPocket;rouletteState.phase='settled'}else{rouletteState.wheelAngle=-R_SEG/2;rouletteState.ballAngle=-1.064;rouletteState.ballRadius=rouletteGeometry().rail;rouletteState.phase='idle'}rouletteDraw();

// JRVX CAS v3.0.10: Hangman/Snake excluded from CAS production runtime.
// JRVX CAS v3.0.10: Racing/garage rendering and physics excluded from CAS production runtime.
const raceMemoryStorage={};
function storageGet(key){try{return window.localStorage.getItem(key)}catch{return Object.prototype.hasOwnProperty.call(raceMemoryStorage,key)?raceMemoryStorage[key]:null}}
function storageSet(key,value){raceMemoryStorage[key]=String(value);try{window.localStorage.setItem(key,String(value))}catch{}}
let raceCredits=Math.max(0,Math.floor(Number(storageGet('jarvisRaceCredits')||0)||0));
let raceRunning=false,raceSpeed=0,raceKeys={left:false,right:false,gas:false,brake:false,nitro:false};
function saveGarage(syncServer=true){storageSet('jarvisRaceCredits',String(Math.floor(raceCredits)));syncCurrentUserToRegistry(raceCredits);if(syncServer&&window.arcadeNetState?.connected&&typeof arcadeNetSend==='function')arcadeNetSend({type:'wallet_sync_balance',balance:Math.max(0,Math.floor(Number(raceCredits)||0))})}
function raceUpdateHud(){const el=document.getElementById('raceCredits');if(el)el.innerHTML=coinHTML(raceCredits)}
function renderGarage(){} function showGarageView(){}
function raceResetState(){raceRunning=false;raceSpeed=0;raceKeys={left:false,right:false,gas:false,brake:false,nitro:false}}
function raceKey(name,val){if(Object.prototype.hasOwnProperty.call(raceKeys,name))raceKeys[name]=!!val}
// JRVX CAS v3.0.10: Tic-Tac-Toe and Arcade startup branch excluded.
bjNewDeck();bjRender();casinoRefresh();renderPlayerProfile();goMainMenu(true);


// JVRX ARCADE ONLINE v50 — Arcade OS enhancements
function v50SafeParse(key,fallback){try{const x=JSON.parse(localStorage.getItem(key)||'null');return x??fallback}catch{return fallback}}
function v50Escape(v){return String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
// Fullscreen tool for every game
function v50ActiveGame(){return games.find(g=>g.classList.contains('active'))||null}
function v50ToggleFullscreen(game){const target=game||v50ActiveGame();if(!target)return;if(document.fullscreenElement){document.exitFullscreen?.().catch(()=>{})}else target.requestFullscreen?.().catch(()=>showArcadeToast('Fullscreen','Браузер не разрешил полноэкранный режим','!'))}
function v50InstallGameTools(){games.forEach(g=>{const actions=g.querySelector('.gamehead .actions');if(!actions||actions.querySelector('.v50GameTool'))return;const b=document.createElement('button');b.className='btn v50GameTool';b.type='button';b.textContent='⛶';b.title='Полный экран (F)';b.setAttribute('aria-label','Полноэкранный режим');b.onclick=()=>v50ToggleFullscreen(g);actions.insertBefore(b,actions.firstChild)});document.addEventListener('fullscreenchange',()=>document.querySelectorAll('.v50GameTool').forEach(b=>b.classList.toggle('fullscreenActive',!!document.fullscreenElement)))}v50InstallGameTools();

// v3.0.12: retired Arcade quality toggle removed.

// Blackjack session history
const V50_BJ_HISTORY='jarvisBlackjackHistoryV50';let v50BjHistory=Array.isArray(v50SafeParse(V50_BJ_HISTORY,[]))?v50SafeParse(V50_BJ_HISTORY,[]):[];
function v50RenderBjHistory(){const host=document.getElementById('blackjackSessionHistory'),stats=document.getElementById('blackjackSessionStats');if(!host||!stats)return;const arr=v50BjHistory.slice(0,10),w=arr.filter(x=>x.r==='win').length,l=arr.filter(x=>x.r==='loss').length,p=arr.filter(x=>x.r==='push').length;host.innerHTML=arr.length?arr.map(x=>`<span class="blackjackHistoryDot ${x.r}" title="${v50Escape(x.t)}">${x.r==='win'?'W':x.r==='loss'?'L':'P'}</span>`).join(''):'<em>Пока нет раздач</em>';stats.textContent=`${w}W / ${l}L / ${p}P`}
const v50BjFinishOriginal=bjFinish;bjFinish=function(reason){const out=v50BjFinishOriginal(reason),msg=document.getElementById('bjMessage');const r=msg?.classList.contains('win')?'win':msg?.classList.contains('loss')?'loss':'push';v50BjHistory.unshift({r,t:msg?.textContent||'',ts:Date.now()});v50BjHistory=v50BjHistory.slice(0,20);try{localStorage.setItem(V50_BJ_HISTORY,JSON.stringify(v50BjHistory))}catch{}v50RenderBjHistory();return out};v50RenderBjHistory();

// Roulette analytics based on real recent outcomes
function v50RenderRouletteAnalytics(){const h=(typeof rouletteHistory!=='undefined'?rouletteHistory:[]).slice(0,20),hot=document.getElementById('rouletteHot'),cs=document.getElementById('rouletteColorSplit'),ps=document.getElementById('rouletteParitySplit');if(!h.length){if(hot)hot.textContent='—';if(cs)cs.textContent='—';if(ps)ps.textContent='—';return}const freq=new Map();h.forEach(n=>freq.set(n,(freq.get(n)||0)+1));const max=Math.max(...freq.values()),hotNums=[...freq.entries()].filter(([,c])=>c===max).map(([n])=>n).slice(0,3);let red=0,black=0,odd=0,even=0;h.forEach(n=>{const c=rouletteColor(n);if(c==='red')red++;if(c==='black')black++;if(n){n%2?odd++:even++}});if(hot)hot.textContent=`${hotNums.join(', ')} • ×${max}`;if(cs)cs.textContent=`${red} / ${black}`;if(ps)ps.textContent=`${odd} / ${even}`}
const v50RouletteHistoryOriginal=rouletteRenderHistory;rouletteRenderHistory=function(){const out=v50RouletteHistoryOriginal();v50RenderRouletteAnalytics();return out};v50RenderRouletteAnalytics();

// Poker decision helper: informational only, server remains authoritative
function v50RenderPokerDecision(state){const me=state?.you,toCall=Math.max(0,Number(me?.toCall)||0),pot=Math.max(0,Number(state?.pot)||0),stack=Math.max(0,Number(me?.stack)||0);const a=document.getElementById('pokerToCallStat'),b=document.getElementById('pokerPotOddsStat'),c=document.getElementById('pokerStackStat');if(a)a.textContent=`${toCall} MT`;if(b)b.textContent=toCall>0?`${(100*toCall/Math.max(1,pot+toCall)).toFixed(1)}%`:'0%';if(c)c.textContent=me?`${stack} MT`:'—'}
const v50PokerRenderOriginal=renderPokerState;renderPokerState=function(state){const out=v50PokerRenderOriginal(state);v50RenderPokerDecision(state);return out};v50RenderPokerDecision(window.arcadeNetState?.poker||null);

// v3.0.12: retired Arcade wallet activity observer removed.

// v3.0.12: retired Arcade reconnect banner removed.

// v3.0.12: retired Arcade global hotkeys removed.


// JRVX CAS v3.0.10: Arcade-only per-game QoL excluded.
// v3.0.12: retired Arcade PWA/profile hooks removed.


// JVRX ARCADE v52 — global Poker rebuild, buy-in escrow, invitations and casino visual polish
(()=>{
const TABLES=[
 {id:'1-2',sb:1,bb:2,min:20},{id:'2-4',sb:2,bb:4,min:40},{id:'5-10',sb:5,bb:10,min:100},{id:'10-20',sb:10,bb:20,min:400},
 {id:'25-50',sb:25,bb:50,min:500},{id:'50-100',sb:50,bb:100,min:1000},{id:'100-200',sb:100,bb:200,min:2000}
];
let tableId='1-2',seatChoice=null,adminTopMode='wins',localPoker=null;
const table=()=>TABLES.find(x=>x.id===tableId)||TABLES[0];
const esc=x=>typeof escapeAdminHtml==='function'?escapeAdminHtml(String(x??'')):String(x??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
window.arcadeNetState.friends=Array.isArray(window.arcadeNetState.friends)?window.arcadeNetState.friends:[];
window.arcadeNetState.luckMode=window.arcadeNetState.luckMode||'normal';

// Hello now syncs overall wins as well.
const oldSend=arcadeNetSend;
// v3.0.10: legacy MAC/MT shop removed; bridge old callers to the native CAS MG/MS store.
function renderShop(){}
function openShop(){try{return window.openShop?.()}catch{}}
function closeShop(){}
// Wallet rendering extension.
const walletBase=renderPokerWallet;renderPokerWallet=function(){const out=walletBase();renderShop();return out};

// Luck lives only in Admin Panel. No game-level controls.
currentCasinoAdminMode=function(){return ['normal','favor','challenge'].includes(window.arcadeNetState.luckMode)?window.arcadeNetState.luckMode:'normal'};
setCasinoAdminMode=function(mode){window.arcadeNetState.luckMode=['normal','favor','challenge'].includes(mode)?mode:'normal';return window.arcadeNetState.luckMode};
updateAdminCasinoControls=function(){};

// v3.0.10: old local Admin editor/leaderboard UI removed; keep data helper only.
function v51AdminUsers(){return adminMergedUsers().map(u=>({...u,pokerTokens:Number(u.muraTokens??u.pokerTokens)||0,wins:Number(u.wins??u.profile?.wins??0)||0,luckMode:u.luckMode||u.testMode||'normal'}))}
function renderAdminTop(){}
function arcadeNetAdminSetLuckMode(id,mode){return arcadeNetSend({type:'admin_set_luck_mode',playerId:String(id),mode:['normal','favor','challenge'].includes(mode)?mode:'normal'})}
function arcadeNetAdminSetTestMode(id,mode){return arcadeNetAdminSetLuckMode(id,mode)}

// Friends.
function legacyFriendCacheEnabled(){try{return window.JRVXCASIdentityV300?.state?.().mode==='development'||/^(?:localhost|127\.0\.0\.1)$/.test(location.hostname)}catch{return false}}
function renderFriends(){const list=Array.isArray(window.arcadeNetState.friends)?window.arcadeNetState.friends:[],host=document.getElementById('profileFriendList'),sel=document.getElementById('pokerFriendSelect');if(host)host.innerHTML=list.length?list.map(f=>`<div class="friendRow"><div><strong>${esc(f.nickname||'Игрок')}</strong><span>ID ${esc(f.id)} • ${f.online?'ONLINE':'offline'}</span></div><button class="btn" data-remove-friend="${esc(f.id)}">Удалить</button></div>`).join(''):'<div class="adminEmpty">Список друзей пуст</div>';host?.querySelectorAll('[data-remove-friend]').forEach(b=>b.onclick=()=>{if(window.arcadeNetState.connected)arcadeNetSend({type:'friend_remove',playerId:b.dataset.removeFriend});else if(legacyFriendCacheEnabled()){window.arcadeNetState.friends=list.filter(f=>String(f.id)!==String(b.dataset.removeFriend));try{localStorage.setItem('jarvisFriendsV51',JSON.stringify(window.arcadeNetState.friends))}catch{}renderFriends()}else showArcadeToast('Друзья','Нет соединения с сервером. Изменение не сохранено.','!')});if(sel){const prev=sel.value;sel.innerHTML='<option value="">Выберите друга</option>'+list.map(f=>`<option value="${esc(f.id)}">${esc(f.nickname||'Игрок')} • ID ${esc(f.id)}${f.online?' • ONLINE':''}</option>`).join('');if([...sel.options].some(o=>o.value===prev))sel.value=prev}}
if(legacyFriendCacheEnabled())try{const f=JSON.parse(localStorage.getItem('jarvisFriendsV51')||'[]');if(Array.isArray(f)&&!window.arcadeNetState.friends.length)window.arcadeNetState.friends=f}catch{}
document.getElementById('profileFriendAdd')?.addEventListener('click',()=>{const id=String(document.getElementById('profileFriendId')?.value||'').trim().toUpperCase();if(!/^JRVX-[A-Z]{4}\d{8}$/.test(id)||id===String(playerProfile.playerId)){showArcadeToast('Друзья','Введите ID другого игрока','!');return}if(window.arcadeNetState.connected)arcadeNetSend({type:'friend_add',playerId:id});else if(legacyFriendCacheEnabled()){if(!window.arcadeNetState.friends.some(f=>String(f.id)===id))window.arcadeNetState.friends.push({id,nickname:`Игрок ${id}`,online:false});try{localStorage.setItem('jarvisFriendsV51',JSON.stringify(window.arcadeNetState.friends))}catch{}renderFriends();showArcadeToast('Друзья',`ID ${id} добавлен локально`,'✓')}else showArcadeToast('Друзья','Нет соединения с сервером. Изменение не сохранено.','!')});renderFriends();

// Extend network messages for v51 data.
const netBase=handleArcadeNetMessage;handleArcadeNetMessage=function(msg){const out=netBase(msg);if(msg?.type==='hello_ack'||msg?.type==='account_wallet'){if(msg.luckMode)window.arcadeNetState.luckMode=msg.luckMode;if(Array.isArray(msg.friends)){window.arcadeNetState.friends=msg.friends;if(legacyFriendCacheEnabled())try{localStorage.setItem('jarvisFriendsV51',JSON.stringify(msg.friends))}catch{}renderFriends()}if(msg.wins!=null)playerProfile.wins=Math.max(Number(playerProfile.wins)||0,Number(msg.wins)||0);renderShop()}if(msg?.type==='friends_update'){window.arcadeNetState.friends=Array.isArray(msg.friends)?msg.friends:[];if(legacyFriendCacheEnabled())try{localStorage.setItem('jarvisFriendsV51',JSON.stringify(window.arcadeNetState.friends))}catch{}renderFriends()}if(msg?.type==='account_luck_mode'&&msg.luckMode)window.arcadeNetState.luckMode=msg.luckMode;if(msg?.type==='admin_users')renderAdminTop();return out};

// Table selection + seat selection.
function updateTableUI(){const t=table();document.querySelectorAll('[data-poker-table]').forEach(b=>b.classList.toggle('active',b.dataset.pokerTable===tableId));const badge=document.getElementById('pokerBlindBadgeText');if(badge)badge.textContent=`SB ${t.sb} MT • BB ${t.bb} MT`;const input=document.getElementById('pokerBuyInInput');if(input){input.min=t.min;input.max=1000000;if(Number(input.value)<t.min)input.value=t.min}const minLabel=document.getElementById('pokerBuyInMinLabel');if(minLabel)minLabel.textContent=`Минимальный вход: ${t.min} MT`;const r=document.getElementById('pokerRebuyMin');if(r)r.textContent=`Rebuy: минимум ${t.bb*19} MT (19 BB)`;const bet=document.getElementById('pokerBetInput');if(bet&&Number(bet.value)<t.bb*2)bet.value=t.bb*2}
document.querySelectorAll('[data-poker-table]').forEach(b=>b.onclick=()=>{if(window.arcadeNetState.poker?.you||localPoker){showArcadeToast('Poker','Сначала покиньте текущий стол','!');return}tableId=b.dataset.pokerTable;seatChoice=null;updateTableUI();renderPokerState({mode:pokerMode,tableId,seats:Array(pokerMode==='jarvis'?2:6).fill(null),community:[],pot:0,street:'waiting',handNo:0,you:null,smallBlind:table().sb,bigBlind:table().bb})});
pokerBuyIn=function(){const t=table(),e=document.getElementById('pokerBuyInInput');return Math.max(t.bb*20,Math.min(1000000,Math.floor(Number(e?.value)||t.bb*20)))};
const pokerRenderBase=renderPokerState;renderPokerState=function(state){if(state?.tableId)tableId=state.tableId;const out=pokerRenderBase(state);const t=TABLES.find(x=>x.id===tableId)||{sb:Number(state?.smallBlind)||1,bb:Number(state?.bigBlind)||2};const badge=document.getElementById('pokerBlindBadgeText');if(badge)badge.textContent=`SB ${state?.smallBlind||t.sb} MT • BB ${state?.bigBlind||t.bb} MT`;document.querySelectorAll('[data-poker-table]').forEach(b=>b.classList.toggle('active',b.dataset.pokerTable===tableId));const minR=(Number(state?.minRebuy)||((state?.bigBlind||t.bb)*19)),r=document.getElementById('pokerRebuyMin');if(r)r.textContent=`Rebuy: минимум ${minR} MT (19 BB)`;document.querySelectorAll('#pokerSeats .pokerSeat.empty').forEach((node,i)=>{node.classList.add('selectable');node.dataset.pokerSeat=i;node.classList.toggle('selected',seatChoice===i);node.onclick=()=>{if(state?.you)return;seatChoice=i;document.querySelectorAll('#pokerSeats .pokerSeat.empty').forEach(x=>x.classList.toggle('selected',Number(x.dataset.pokerSeat)===i));showArcadeToast('Poker',`Выбрано место ${i+1}`,'♠',1300)}});return out};
setPokerNetStatus=function(live,text){const dot=document.getElementById('pokerStatusDot'),status=document.getElementById('pokerNetStatus'),join=document.getElementById('pokerQuickJoin');if(dot)dot.classList.toggle('live',live);if(status)status.textContent=text||(live?'SERVER LINK • ONLINE':'LOCAL MODE • JVRX доступен');if(join)join.disabled=!live&&pokerMode!=='jarvis';renderOnlineSummary()};
pokerModeUI=function(){document.querySelectorAll('[data-poker-mode]').forEach(b=>b.classList.toggle('active',b.dataset.pokerMode===pokerMode));const join=document.getElementById('pokerQuickJoin'),fb=document.getElementById('pokerFriendBar');if(join)join.textContent=pokerMode==='jarvis'?'Играть против JRVX':pokerMode==='friend'?'Играть с другом':'Войти в ONLINE стол';fb?.classList.toggle('active',pokerMode!=='jarvis');const inviteBtn=document.getElementById('pokerInviteFriend');if(inviteBtn)inviteBtn.style.display=pokerMode==='online'?'':'none';const status=document.getElementById('pokerNetStatus');if(status&&!window.arcadeNetState.poker?.you)status.textContent=pokerMode==='jarvis'?(window.arcadeNetState.connected?'JVRX готов к heads-up':'LOCAL JVRX готов'):pokerMode==='friend'?'Выберите друга для приватного стола':'Online-стол готов';document.getElementById('pokerTableWrap')?.classList.toggle('headsUp',pokerMode==='jarvis')};
setPokerMode=function(mode){mode=['jarvis','online','friend'].includes(mode)?mode:'jarvis';if((window.arcadeNetState.poker?.you||localPoker)&&pokerMode!==mode)arcadeNetPokerLeave();pokerMode=mode;seatChoice=null;pokerModeUI();const n=mode==='jarvis'?2:6;renderPokerState({mode,tableId,seats:Array(n).fill(null),community:[],pot:0,street:'waiting',handNo:0,you:null,smallBlind:table().sb,bigBlind:table().bb})};
document.querySelectorAll('[data-poker-mode]').forEach(b=>b.onclick=()=>setPokerMode(b.dataset.pokerMode));

// Lightweight but functional local heads-up Texas Hold'em against JVRX.
const ranks='23456789TJQKA',suits='SHDC';
function deck(){const d=[];for(const r of ranks)for(const s of suits)d.push(r+s);for(let i=d.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[d[i],d[j]]=[d[j],d[i]]}return d}
function cmpScore(a,b){for(let i=0;i<Math.max(a.length,b.length);i++){const d=(a[i]||0)-(b[i]||0);if(d)return d}return 0}
function score5(cards){const vals=cards.map(c=>ranks.indexOf(c[0])+2).sort((a,b)=>b-a),cnt={};vals.forEach(v=>cnt[v]=(cnt[v]||0)+1);const groups=Object.entries(cnt).map(([v,c])=>[Number(c),Number(v)]).sort((a,b)=>b[0]-a[0]||b[1]-a[1]);const flush=cards.every(c=>c[1]===cards[0][1]);let uniq=[...new Set(vals)];if(uniq[0]===14)uniq.push(1);let highStraight=0;for(let i=0;i<=uniq.length-5;i++)if(uniq[i]-uniq[i+4]===4){highStraight=uniq[i];break}if(flush&&highStraight)return[8,highStraight];if(groups[0][0]===4)return[7,groups[0][1],groups[1][1]];if(groups[0][0]===3&&groups[1]?.[0]>=2)return[6,groups[0][1],groups[1][1]];if(flush)return[5,...vals];if(highStraight)return[4,highStraight];if(groups[0][0]===3)return[3,groups[0][1],...groups.slice(1).map(g=>g[1]).sort((a,b)=>b-a)];const pairs=groups.filter(g=>g[0]===2);if(pairs.length>=2)return[2,pairs[0][1],pairs[1][1],groups.find(g=>g[0]===1)?.[1]||0];if(pairs.length===1)return[1,pairs[0][1],...groups.filter(g=>g[0]===1).map(g=>g[1]).sort((a,b)=>b-a)];return[0,...vals]}
function best7(cards){let best=null;for(let a=0;a<cards.length-4;a++)for(let b=a+1;b<cards.length-3;b++)for(let c=b+1;c<cards.length-2;c++)for(let d=c+1;d<cards.length-1;d++)for(let e=d+1;e<cards.length;e++){const sc=score5([cards[a],cards[b],cards[c],cards[d],cards[e]]);if(!best||cmpScore(sc,best)>0)best=sc}return best}
const handNames=['Старшая карта','Пара','Две пары','Тройка','Стрит','Флеш','Фулл-хаус','Каре','Стрит-флеш'];
const v52RankGen={2:'двоек',3:'троек',4:'четвёрок',5:'пятёрок',6:'шестёрок',7:'семёрок',8:'восьмёрок',9:'девяток',10:'десяток',11:'валетов',12:'дам',13:'королей',14:'тузов'};
function v52CurrentCombo(hole=[],community=[]){const cards=[...hole,...community].filter(c=>c&&c!=='??');if(!cards.length)return'';if(cards.length>=5){const sc=best7(cards);if(sc){if(sc[0]===1)return`Пара ${v52RankGen[sc[1]]||''}`.trim();if(sc[0]===2)return`Две пары: ${v52RankGen[sc[1]]||''} и ${v52RankGen[sc[2]]||''}`.trim();if(sc[0]===3)return`Тройка ${v52RankGen[sc[1]]||''}`.trim();if(sc[0]===7)return`Каре ${v52RankGen[sc[1]]||''}`.trim();return handNames[sc[0]]||''}}const cnt={};for(const c of cards){const v=ranks.indexOf(c[0])+2;cnt[v]=(cnt[v]||0)+1}const groups=Object.entries(cnt).map(([v,n])=>[Number(v),n]).sort((a,b)=>b[1]-a[1]||b[0]-a[0]);if(groups[0]?.[1]===4)return`Каре ${v52RankGen[groups[0][0]]||''}`.trim();if(groups[0]?.[1]===3)return`Тройка ${v52RankGen[groups[0][0]]||''}`.trim();const pairs=groups.filter(x=>x[1]===2).map(x=>x[0]);if(pairs.length>=2)return`Две пары: ${v52RankGen[pairs[0]]||''} и ${v52RankGen[pairs[1]]||''}`.trim();if(pairs.length===1)return`Пара ${v52RankGen[pairs[0]]||''}`.trim();return'Старшая карта'}
function localState(lastResult=null){if(!localPoker)return null;const L=localPoker,p=L.players[L.playerSeat],bot=L.players[L.botSeat],seats=Array(2).fill(null);const mk=(x,seat,isMe)=>({id:x.id,nickname:x.nickname,seat,stack:x.stack,bet:x.bet,inHand:true,folded:x.folded,lastAction:x.lastAction||'',wonLast:x.wonLast||0,hole:isMe?x.hole:(L.street==='showdown'?x.hole:['??','??']),yourTurn:isMe&&L.turn==='player',toCall:isMe?Math.max(0,L.currentBet-x.bet):0,currentHandName:isMe&&x.hole.length?v52CurrentCombo(x.hole,L.community):''});seats[L.playerSeat]=mk(p,L.playerSeat,true);seats[L.botSeat]=mk(bot,L.botSeat,false);return{roomId:'local-jarvis',mode:'jarvis',tableId:L.tableId,seats,community:L.community,pot:L.pot,street:L.street,handNo:L.handNo,you:seats[L.playerSeat],turnSeat:L.turn==='player'?L.playerSeat:L.botSeat,dealerSeat:L.dealer,smallBlindSeat:L.dealer,bigBlindSeat:L.dealer===0?1:0,smallBlind:L.sb,bigBlind:L.bb,currentBet:L.currentBet,minRaiseTo:Math.max(L.currentBet+L.bb,L.bb*2),minRebuy:L.bb*19,maxBuyIn:1000000,lastResult,actionLog:L.log.slice(-20)}}
function localRender(last=null){const st=localState(last);window.arcadeNetState.poker=st;renderPokerState(st);pokerModeUI()}
function localPost(seat,amount,label){const p=localPoker.players[seat],pay=Math.min(p.stack,amount);p.stack-=pay;p.bet+=pay;localPoker.pot+=pay;p.lastAction=label;localPoker.log.push({kind:'bet',street:localPoker.street,text:`${p.nickname}: ${label} ${pay} MT`});return pay}
function localNewHand(){const L=localPoker;if(!L)return;const p=L.players[L.playerSeat];if(p.stack<L.bb){L.street='waiting';L.turn=null;localRender();showArcadeToast('Poker',`Стек ниже BB. Rebuy минимум ${L.bb*19} MT.`,'!');return}if(L.players[L.botSeat].stack<L.bb*20)L.players[L.botSeat].stack=Math.max(L.buyIn,L.bb*100);L.handNo++;L.dealer=L.dealer===0?1:0;L.deck=deck();L.community=[];L.pot=0;L.currentBet=0;L.street='preflop';L.log=[];for(const x of L.players){x.hole=[L.deck.pop(),L.deck.pop()];x.bet=0;x.folded=false;x.lastAction='';x.wonLast=0}const sb=L.dealer,bb=sb===0?1:0;localPost(sb,L.sb,'SB');localPost(bb,L.bb,'BB');L.currentBet=L.bb;L.turn='player';localRender()}
function resetStreetBets(){for(const p of localPoker.players)p.bet=0;localPoker.currentBet=0}
function localShowdown(){const L=localPoker,p=L.players[L.playerSeat],b=L.players[L.botSeat];L.street='showdown';const a=best7([...p.hole,...L.community]),c=best7([...b.hole,...L.community]),cmp=cmpScore(a,c);let winners,text;if(cmp>0){p.stack+=L.pot;p.wonLast=L.pot;winners=[p.id];text=`Вы выиграли банк +${L.pot}`;profileEvent('pokerWin');profileEvent('win');awardXP(28)}else if(cmp<0){b.stack+=L.pot;b.wonLast=L.pot;winners=[b.id];text=`JVRX выиграл банк ${L.pot}`}else{const half=Math.floor(L.pot/2);p.stack+=half;b.stack+=L.pot-half;winners=[p.id,b.id];text=`Банк разделён: ${L.pot}`}L.log.push({kind:'result',street:'showdown',text});const res={text,winners};L.pot=0;L.turn=null;localRender(res);setTimeout(()=>{if(localPoker)localNewHand()},1150)}
function localAdvance(){const L=localPoker;if(!L)return;resetStreetBets();if(L.street==='preflop'){L.community.push(L.deck.pop(),L.deck.pop(),L.deck.pop());L.street='flop'}else if(L.street==='flop'){L.community.push(L.deck.pop());L.street='turn'}else if(L.street==='turn'){L.community.push(L.deck.pop());L.street='river'}else if(L.street==='river'){localShowdown();return}L.turn='player';localRender()}
function localAction(action){const L=localPoker;if(!L||L.turn!=='player')return;const p=L.players[L.playerSeat],b=L.players[L.botSeat],toCall=Math.max(0,L.currentBet-p.bet);if(action==='fold'){p.folded=true;p.lastAction='Фолд';b.stack+=L.pot;b.wonLast=L.pot;const res={text:`JVRX забирает банк ${L.pot}`,winners:[b.id]};L.log.push({kind:'result',street:L.street,text:res.text});L.pot=0;L.turn=null;localRender(res);setTimeout(()=>{if(localPoker)localNewHand()},900);return}if(action==='bet'){let target=Math.floor(Number(document.getElementById('pokerBetInput')?.value)||L.currentBet+L.bb);target=Math.max(L.currentBet+L.bb,Math.min(p.stack+p.bet,target));const pay=Math.max(0,target-p.bet);localPost(L.playerSeat,pay,'Рейз до');L.currentBet=p.bet}else if(toCall>0)localPost(L.playerSeat,toCall,'Колл');else{p.lastAction='Чек';L.log.push({kind:'check',street:L.street,text:`${p.nickname}: чек`})}L.turn='bot';localRender();setTimeout(()=>{if(!localPoker)return;const need=Math.max(0,L.currentBet-b.bet);if(need)localPost(L.botSeat,need,'Колл');else{b.lastAction='Чек';L.log.push({kind:'check',street:L.street,text:'JVRX: чек'})}localAdvance()},420)}
function localJoin(){const t=table(),buy=Math.max(t.min,pokerBuyIn());if(muraTokenBalance()<buy){showArcadeToast('Poker',`Для бай-ина нужно ${buy} MT`,'!');openShop();return}setMuraTokenBalance(muraTokenBalance()-buy,{sync:false});const ps=seatChoice===1?1:0,bs=ps===0?1:0;localPoker={tableId:t.id,sb:t.sb,bb:t.bb,buyIn:buy,playerSeat:ps,botSeat:bs,dealer:1,handNo:0,players:Array(2)};localPoker.players[ps]={id:String(playerProfile.playerId),nickname:playerProfile.nickname||'Вы',stack:buy,bet:0,hole:[]};localPoker.players[bs]={id:'jarvis-ai',nickname:'JVRX',stack:Math.max(buy,t.bb*100),bet:0,hole:[]};seatChoice=null;localNewHand();showArcadeToast('JVRX Poker',`Local heads-up • ${t.sb}/${t.bb} MT`,'♠')}
arcadeNetPokerJoin=function(mode=pokerMode){const t=table();if(mode==='jarvis'&&!window.arcadeNetState.connected){localJoin();return}if(!window.arcadeNetState.connected){showArcadeToast('JVRX Poker','Для ONLINE и игры с другом нужен SERVER LINK','!');arcadeNetConnect(true);return}const payload={type:'poker_join',mode:mode==='friend'?'friend':mode==='online'?'online':'jarvis',buyIn:pokerBuyIn(),tableId:t.id};if(seatChoice!=null)payload.seat=seatChoice;if(mode==='friend'){const fid=document.getElementById('pokerFriendSelect')?.value;if(!fid){showArcadeToast('Poker','Выберите друга','!');return}payload.friendId=fid}arcadeNetSend(payload)};
arcadeNetPokerRebuy=function(){const t=table(),min=(window.arcadeNetState.poker?.minRebuy)||t.bb*19;let amount=Math.max(min,Math.floor(Number(document.getElementById('pokerBuyInInput')?.value)||min));if(localPoker){if(muraTokenBalance()<amount){showArcadeToast('Rebuy',`Нужно ${amount} MT`,'!');openShop();return}setMuraTokenBalance(muraTokenBalance()-amount,{sync:false});localPoker.players[localPoker.playerSeat].stack+=amount;localPoker.log.push({kind:'info',street:localPoker.street,text:`Rebuy +${amount} MT`});localRender();return}if(window.arcadeNetState.connected)arcadeNetSend({type:'poker_rebuy',amount});else showArcadeToast('Rebuy','Сначала войдите за стол','!')};
arcadeNetPokerLeave=function(){if(localPoker){const left=Math.max(0,Math.floor(localPoker.players[localPoker.playerSeat].stack));setMuraTokenBalance(muraTokenBalance()+left,{sync:false});localPoker=null}if(window.arcadeNetState.connected)arcadeNetSend({type:'poker_leave'});window.arcadeNetState.poker=null;seatChoice=null;const t=table();renderPokerState({mode:pokerMode,tableId:t.id,seats:Array(pokerMode==='jarvis'?2:6).fill(null),community:[],pot:0,street:'waiting',handNo:0,you:null,smallBlind:t.sb,bigBlind:t.bb})};
const pokerActionBase=arcadeNetPokerAction;arcadeNetPokerAction=function(action){if(localPoker){localAction(action);return}return pokerActionBase(action)};
document.getElementById('pokerRebuy').onclick=arcadeNetPokerRebuy;document.getElementById('pokerLeave').onclick=arcadeNetPokerLeave;


// v52 Poker interaction and invitation layer.
function v52PokerAmountBounds(){const state=window.arcadeNetState.poker,me=state?.you;if(!me)return null;const bb=Math.max(1,Number(state.bigBlind)||2),current=Math.max(0,Number(state.currentBet)||0),max=Math.max(0,Number(me.stack||0)+Number(me.bet||0)),serverMin=Math.max(Number(state.minRaiseTo)||bb,bb),min=Math.min(serverMin,max),pot=Math.max(0,Number(state.pot)||0);return{state,me,bb,current,max,min,pot}}
function v52SetPokerBet(kind){const b=v52PokerAmountBounds(),input=document.getElementById('pokerBetInput');if(!b||!input)return;let target=b.min;if(kind==='half')target=Math.max(b.min,b.current+Math.max(b.bb,Math.ceil(b.pot*.5)));else if(kind==='pot')target=Math.max(b.min,b.current+Math.max(b.bb,b.pot));else if(kind==='allin')target=b.max;target=Math.max(0,Math.min(b.max,Math.floor(target)));input.value=String(target);input.setAttribute('value',String(target));const preview=document.getElementById('pokerBetPreview');if(preview)preview.textContent=`${target.toLocaleString('ru-RU')} MT`;const hint=document.getElementById('pokerBetHint');if(hint)hint.textContent=`Выбрано ${target.toLocaleString('ru-RU')} MT • MIN ${b.min.toLocaleString('ru-RU')} • MAX ${b.max.toLocaleString('ru-RU')}`;input.dispatchEvent(new Event('input',{bubbles:true}));input.dispatchEvent(new Event('change',{bubbles:true}))}
document.querySelectorAll('[data-poker-size]').forEach(btn=>btn.onclick=()=>v52SetPokerBet(btn.dataset.pokerSize));
document.getElementById('pokerBetInput')?.addEventListener('input',e=>{const v=Math.max(0,Math.floor(Number(e.target.value)||0)),preview=document.getElementById('pokerBetPreview');if(preview)preview.textContent=`${v.toLocaleString('ru-RU')} MT`});

const v52PokerRenderBase=renderPokerState;renderPokerState=function(state){const out=v52PokerRenderBase(state);const me=state?.you;if(me?.seat!=null){const node=document.querySelectorAll('#pokerSeats .pokerSeat')[Number(me.seat)];if(node){node.querySelector('.pokerSeatCombo')?.remove();const tag=document.createElement('div');tag.className='pokerSeatCombo';tag.textContent=me.currentHandName||((me.hole||[]).length===2?'Старшая карта':'Ожидание карт');node.prepend(tag)}}const preview=document.getElementById('pokerBetPreview'),input=document.getElementById('pokerBetInput');if(preview&&input)preview.textContent=`${Math.max(0,Math.floor(Number(input.value)||0)).toLocaleString('ru-RU')} MT`;const stand=document.getElementById('pokerLeave');if(stand)stand.disabled=!me&&!localPoker;return out};

function v52RenderPokerInvite(){const inv=window.arcadeNetState.pendingPokerInvite,box=document.getElementById('pokerInviteIncoming'),txt=document.getElementById('pokerInviteIncomingText');box?.classList.toggle('active',!!inv);if(txt&&inv)txt.textContent=`${inv.fromNickname||'Друг'} • стол ${inv.smallBlind}/${inv.bigBlind} MT • вход ${inv.buyIn} MT`}
function v52InviteSelectedFriend(){const fid=document.getElementById('pokerFriendSelect')?.value,t=table();if(!fid){showArcadeToast('Poker','Выберите друга из списка','!');return}if(!window.arcadeNetState.connected){showArcadeToast('Poker','Для приглашения нужен SERVER LINK','!');arcadeNetConnect(true);return}window.arcadeNetState.outgoingPokerInvite={friendId:fid,tableId:t.id,buyIn:Math.max(t.min,pokerBuyIn())};arcadeNetSend({type:'poker_invite',...window.arcadeNetState.outgoingPokerInvite})}
document.getElementById('pokerInviteFriend')?.addEventListener('click',v52InviteSelectedFriend);
document.getElementById('pokerInviteAccept')?.addEventListener('click',()=>{const inv=window.arcadeNetState.pendingPokerInvite;if(!inv)return;tableId=inv.tableId||tableId;updateTableUI();pokerMode='friend';pokerModeUI();const sel=document.getElementById('pokerFriendSelect');if(sel)sel.value=String(inv.fromId||'');const buy=document.getElementById('pokerBuyInInput');if(buy)buy.value=Math.max(Number(inv.minBuyIn)||table().min,Number(inv.buyIn)||table().min);window.arcadeNetState.pendingPokerInvite=null;v52RenderPokerInvite();arcadeNetPokerJoin('friend')});
document.getElementById('pokerInviteDecline')?.addEventListener('click',()=>{const inv=window.arcadeNetState.pendingPokerInvite;if(inv&&window.arcadeNetState.connected)arcadeNetSend({type:'poker_invite_decline',fromId:inv.fromId});window.arcadeNetState.pendingPokerInvite=null;v52RenderPokerInvite()});
const v52MessageBase=handleArcadeNetMessage;handleArcadeNetMessage=function(msg){if(msg?.type==='poker_invite'){window.arcadeNetState.pendingPokerInvite=msg;v52RenderPokerInvite();showArcadeToast('Poker invite',`${msg.fromNickname||'Друг'} зовёт Вас за стол ${msg.smallBlind}/${msg.bigBlind} MT`,'♠',5000);return}if(msg?.type==='poker_invite_sent'){const out=window.arcadeNetState.outgoingPokerInvite||msg;tableId=msg.tableId||out.tableId||tableId;updateTableUI();pokerMode='friend';pokerModeUI();const sel=document.getElementById('pokerFriendSelect');if(sel)sel.value=String(msg.friendId||out.friendId||'');const buy=document.getElementById('pokerBuyInInput');if(buy)buy.value=Math.max(Number(msg.minBuyIn)||table().min,Number(msg.buyIn)||Number(out.buyIn)||table().min);window.arcadeNetState.outgoingPokerInvite=null;arcadeNetPokerJoin('friend');return}return v52MessageBase(msg)};

// v3.0.12: retired Racing keyboard capture removed.

// Sync registry balances and wins for admin statistics.
const syncRegBase=syncCurrentUserToRegistry;syncCurrentUserToRegistry=function(balance){const out=syncRegBase(balance);const list=registrySafeGet(),i=list.findIndex(x=>String(x.id)===String(playerProfile.playerId));if(i>=0){list[i].pokerTokens=muraTokenBalance();list[i].wins=Number(playerProfile.wins)||0;list[i].luckMode=window.arcadeNetState.luckMode||'normal';registrySave(list)}return out};

// Reconnect hello payload: intercept WebSocket.send JSON just for hello by patching connect-time state via winsHint is server-optional; registry still tracks locally.
updateTableUI();pokerModeUI();
})();


/* === v53 UX / Poker / Casino patch === */
(function(){
  let localPoker=null;
  const style=document.createElement('style');
  style.id='v53-patch-style';
  style.textContent=`
  /* v3.0.11: dormant Hub/profile styles removed. */
  #poker .pokerHole{gap:14px;min-height:118px;align-items:center}
  #poker .pokerHole .pokerCard{width:84px;height:116px;font-size:28px;padding:10px;border-radius:12px;box-shadow:0 12px 26px rgba(0,0,0,.32)}
  #poker .pokerHole .pokerCard small{font-size:26px}
  #poker .pokerPanel.pokerHandPanel{display:flex;flex-direction:column;align-items:center;text-align:center}
  #poker .pokerPanel.pokerHandPanel .pokerMessage,#poker .pokerPanel.pokerHandPanel .pokerResult{max-width:560px}
  @media(max-width:560px){#poker .pokerHole .pokerCard{width:66px;height:92px;font-size:22px}#poker .pokerHole .pokerCard small{font-size:20px}}
  #poker .pokerSeat{padding-top:13px}
  #poker .pokerSeatInner{display:flex;gap:10px;align-items:flex-start}
  #poker .pokerSeatAvatar{width:34px;height:34px;flex:0 0 34px;border-radius:50%;display:grid;place-items:center;background:linear-gradient(180deg,#1c3a48,#08131a);border:1px solid rgba(255,255,255,.08);color:#d8ecf5;font-weight:1000;box-shadow:inset 0 1px rgba(255,255,255,.04)}
  #poker .pokerSeat.me .pokerSeatAvatar{background:linear-gradient(180deg,#1a644f,#093227);border-color:rgba(92,255,199,.35);color:#dffff0}
  #poker .pokerSeatNameWrap{min-width:0;flex:1}
  #poker .pokerSeatName{font-size:12px}
  #poker .pokerSeatStatus{display:block;margin-top:2px;color:var(--muted);font-size:9px}
  #poker .pokerSeatCards{display:flex;gap:4px;margin-top:7px;justify-content:flex-start}
  #poker .pokerSeatCards .pokerCard{width:36px;height:50px;font-size:11px;padding:4px}
  #poker .pokerSeat.me .pokerSeatCards .pokerCard{width:44px;height:60px;font-size:13px;padding:5px}
  #poker .pokerDealerSpot{position:absolute;left:50%;top:18px;transform:translateX(-50%);display:flex;align-items:center;gap:8px;padding:7px 11px;border-radius:999px;border:1px solid rgba(235,205,132,.28);background:rgba(8,13,16,.86);z-index:4;box-shadow:0 10px 18px rgba(0,0,0,.18)}
  #poker .pokerDealerAvatar{width:28px;height:28px;border-radius:50%;display:grid;place-items:center;background:radial-gradient(circle at 35% 25%,#fff1a5,#d49729 60%,#734715);color:#2d1903;font-weight:1000}
  #poker .pokerDealerSpot small{display:block;color:var(--muted);font-size:8px;letter-spacing:.12em}
  #poker .pokerDealerSpot strong{display:block;color:#fff2c7;font-size:11px}
  #poker:not(.poker-seated) .pokerTableStage,#poker:not(.poker-seated) .pokerBottom,#poker:not(.poker-seated) .pokerHandLogPanel{display:none!important}
  #poker.poker-seated .pokerTableSelector,#poker.poker-seated .pokerBuyInPolicy,#poker.poker-seated #pokerQuickJoin,#poker.poker-seated #pokerBuyInInput,#poker.poker-seated .pokerBuyInUnit,#poker.poker-seated #pokerInviteFriend,#poker.poker-seated #pokerFriendSelect{display:none!important}
  #poker.poker-seated .pokerBuyInBar{justify-content:flex-end}
  #poker .pokerStartHandBtn{display:none}
  #poker.poker-local-waiting .pokerStartHandBtn{display:inline-flex!important}
  #poker.poker-local-waiting #pokerRebuy{display:none!important}
  #poker .pokerLobbyNote{margin-top:10px;padding:12px;border-radius:14px;border:1px dashed rgba(92,255,199,.18);background:rgba(4,15,19,.38);color:var(--muted);font-size:11px;line-height:1.5}
  #blackjack .casinoDivider{display:none!important}
  #blackjack .casinoTable{border-radius:34px 34px 160px 160px / 34px 34px 76px 76px;padding-top:48px!important}
  #blackjack .casinoDealerBadge{position:absolute;left:50%;top:14px;transform:translateX(-50%);padding:8px 13px;border-radius:999px;border:1px solid rgba(236,209,150,.22);background:rgba(7,13,16,.84);color:#ffe7ac;font-size:10px;font-weight:1000;letter-spacing:.12em;box-shadow:0 10px 18px rgba(0,0,0,.16)}
  #blackjack .casinoDealerBadge span{display:block;color:#a2b7aa;font-size:8px;letter-spacing:.14em}
  `;
  document.head.appendChild(style);

  // JRVX CAS v3.0.11: dormant v53 Hub/profile injection removed.

  // Poker dealer spot + lobby note + local start button.  // Poker dealer spot + lobby note + local start button.
  const pokerWrap=document.getElementById('pokerTableWrap');
  if(pokerWrap && !document.getElementById('pokerDealerSpot')){
    pokerWrap.insertAdjacentHTML('beforeend','<div class="pokerDealerSpot" id="pokerDealerSpot"><div class="pokerDealerAvatar">D</div><div><small>DEALER</small><strong id="pokerDealerLabel">Готов к раздаче</strong></div></div>');
  }
  const pokerBuyBar=document.querySelector('#poker .pokerBuyInBar');
  if(pokerBuyBar && !document.getElementById('pokerStartHand')) pokerBuyBar.insertAdjacentHTML('beforeend','<button class="btn primary pokerStartHandBtn" id="pokerStartHand">Начать раздачу</button>');
  const pokerLobby=document.querySelector('#poker .pokerOnlinePanel');
  if(pokerLobby && !document.getElementById('pokerLobbyNote')) pokerLobby.insertAdjacentHTML('beforeend','<div class="pokerLobbyNote" id="pokerLobbyNote">Сначала выберите стол, при необходимости выберите место и нажмите «Играть против JRVX» или другой режим. После посадки за стол лобби скрывается, а сам стол открывается отдельно.</div>');

  function v53AvatarText(name,id){
    const s=String(name||id||'J').trim();
    if(/^jarvis/i.test(s)) return 'J';
    return (s[0]||'G').toUpperCase();
  }
  function v53SeatStatus(p,isMe){
    if(isMe) return 'Вы за столом';
    if(/^jarvis/i.test(String(p?.nickname||''))) return 'JVRX';
    return `ID ${p?.id||'—'}`;
  }
  function v53RenderSeatsFromState(state){
    const seatBox=document.getElementById('pokerSeats'); if(!seatBox||!state) return;
    const me=state.you||null;
    const total=(state.seats&&state.seats.length)||((state.mode||pokerMode)==='jarvis'?2:6);
    const seats=(state.seats&&state.seats.length?state.seats:Array(total).fill(null)).slice();
    const mapping=[];
    if(me && me.seat!=null){
      const start=Number(me.seat)||0;
      for(let off=0;off<total;off++) mapping.push((start+off)%total);
    } else {
      for(let i=0;i<total;i++) mapping.push(i);
    }
    seatBox.innerHTML=mapping.map((origSeat,displayIndex)=>{
      const p=seats[origSeat];
      if(!p) return `<div class="pokerSeat empty"><div class="pokerSeatName">Свободное место</div><div class="pokerSeatMeta"><span>SEAT ${origSeat+1}</span><span>—</span></div></div>`;
      const isMe=me&&String(p.id)===String(me.id),turn=state.turnSeat===origSeat,dealer=state.dealerSeat===origSeat,sb=state.smallBlindSeat===origSeat,bb=state.bigBlindSeat===origSeat,test=isFounderProfile()&&p.testMode&&p.testMode!=='normal';
      const cards=((p.hole||[]).map(c=>pokerCardHTML(c)).join(''));
      return `<div class="pokerSeat ${isMe?'me':''} ${turn?'turn':''} ${p.folded?'folded':''}"><div class="pokerSeatInner"><div class="pokerSeatAvatar">${v53AvatarText(p.nickname,p.id)}</div><div class="pokerSeatNameWrap"><div class="pokerSeatName">${escapeAdminHtml(p.nickname||'Игрок')}${dealer?'<span class="pokerDealerMark">D</span>':''}${sb?'<span class="pokerBlindMark">SB</span>':''}${bb?'<span class="pokerBlindMark bb">BB</span>':''}${test?`<span class="pokerSeatTest">${p.testMode==='favor'?'TEST +':'TEST −'}</span>`:''}</div><span class="pokerSeatStatus">${v53SeatStatus(p,isMe)}</span><div class="pokerSeatMeta"><span>${Number(p.stack||0).toLocaleString('ru-RU')} MT${p.inHand&&Number(p.stack||0)===0?'<span class="pokerAllInBadge">ALL-IN</span>':''}</span><span>${p.bet?`ставка ${p.bet} MT`:''}</span></div><div class="pokerSeatAction ${p.wonLast?'pokerWin':''}">${p.wonLast?`+${p.wonLast} MT`:(p.lastAction||'')}</div><div class="pokerSeatCards">${cards}</div></div></div></div>`;
    }).join('');

    document.querySelectorAll('#pokerSeats .pokerSeat.empty').forEach((node,idx)=>{
      const origSeat=mapping[idx];
      node.classList.add('selectable');
      node.dataset.pokerSeat=origSeat;
      node.classList.toggle('selected',seatChoice===origSeat);
      node.onclick=()=>{
        if(state?.you) return;
        seatChoice=origSeat;
        document.querySelectorAll('#pokerSeats .pokerSeat.empty').forEach(x=>x.classList.toggle('selected',Number(x.dataset.pokerSeat)===origSeat));
        showArcadeToast('Poker',`Выбрано место ${origSeat+1}`,'♠',1300);
      };
    });

    if(me){
      const meNode=document.querySelector('#pokerSeats .pokerSeat.me');
      if(meNode){
        meNode.querySelector('.pokerSeatCombo')?.remove();
        const tag=document.createElement('div');
        tag.className='pokerSeatCombo';
        tag.textContent=me.currentHandName||((me.hole||[]).length===2?'Старшая карта':'Ожидание карт');
        meNode.prepend(tag);
      }
    }
  }

  function localWaitingState(){
    if(!localPoker) return null;
    const L=localPoker, seats=Array(2).fill(null);
    const player=L.players[L.playerSeat], bot=L.players[L.botSeat];
    seats[L.playerSeat]={id:player.id,nickname:player.nickname,seat:L.playerSeat,stack:player.stack,bet:0,inHand:true,folded:false,lastAction:'Ожидание старта',wonLast:0,hole:[]};
    seats[L.botSeat]={id:bot.id,nickname:bot.nickname,seat:L.botSeat,stack:bot.stack,bet:0,inHand:true,folded:false,lastAction:'Готов',wonLast:0,hole:['??','??']};
    return {roomId:'local-jarvis',mode:'jarvis',tableId:L.tableId,seats,community:[],pot:0,street:'waiting',handNo:L.handNo||0,you:seats[L.playerSeat],turnSeat:null,dealerSeat:L.dealer,smallBlindSeat:L.dealer,bigBlindSeat:L.dealer===0?1:0,smallBlind:L.sb,bigBlind:L.bb,currentBet:0,minRaiseTo:L.bb*2,minRebuy:L.bb*19,actionLog:[]};
  }
  function renderLocalWaiting(){ const st=localWaitingState(); if(st){ window.arcadeNetState.poker=st; renderPokerState(st); pokerModeUI(); } }

  const localJoinBase=window.localJoin;
  if(typeof localJoinBase==='function'){
    window.localJoin=function(){
      const t=table(),buy=Math.max(t.min,pokerBuyIn());
      if(muraTokenBalance()<buy){showArcadeToast('Poker',`Для бай-ина нужно ${buy} MT`,'!');openShop();return}
      setMuraTokenBalance(muraTokenBalance()-buy,{sync:false});
      const ps=seatChoice===1?1:0,bs=ps===0?1:0;
      localPoker={tableId:t.id,sb:t.sb,bb:t.bb,buyIn:buy,playerSeat:ps,botSeat:bs,dealer:1,handNo:0,players:Array(2),community:[],pot:0,currentBet:0,street:'waiting',turn:null,log:[],handStarted:false};
      localPoker.players[ps]={id:String(playerProfile.playerId),nickname:playerProfile.nickname||'Вы',stack:buy,bet:0,hole:[]};
      localPoker.players[bs]={id:'jarvis-ai',nickname:'JVRX',stack:Math.max(buy,t.bb*100),bet:0,hole:[]};
      seatChoice=null;
      renderLocalWaiting();
      showArcadeToast('JVRX Poker',`Стол ${t.sb}/${t.bb} MT готов. Нажмите «Начать раздачу».`,'♠');
    }
  }
  const localNewHandBase=window.localNewHand;
  if(typeof localNewHandBase==='function') window.localNewHand=function(){ if(localPoker) localPoker.handStarted=true; return localNewHandBase.apply(this,arguments) };
  document.getElementById('pokerStartHand')?.addEventListener('click',()=>{ if(localPoker && !localPoker.handStarted){ localNewHand(); } });

  function pokerJoinedState(state){ return !!(state?.you || localPoker); }
  const prevRenderPokerState=window.renderPokerState;
  if(typeof prevRenderPokerState==='function'){
    window.renderPokerState=function(state){
      const out=prevRenderPokerState.apply(this,arguments);
      state=state||window.arcadeNetState?.poker||null;
      const joined=pokerJoinedState(state);
      const pokerRoot=document.getElementById('poker');
      if(pokerRoot){
        pokerRoot.classList.toggle('poker-seated',joined);
        pokerRoot.classList.toggle('poker-local-waiting',!!(localPoker && !localPoker.handStarted));
      }
      if(state) v53RenderSeatsFromState(state);
      const dealer=document.getElementById('pokerDealerLabel');
      if(dealer){
        let txt='Готов к раздаче';
        const ds=(state?.dealerSeat!=null && state?.seats?.[state.dealerSeat]) ? state.seats[state.dealerSeat].nickname : 'Dealer';
        if(joined) txt=`Раздаёт: ${ds||'Dealer'}`;
        dealer.textContent=txt;
      }
      const preview=document.getElementById('pokerBetPreview'),input=document.getElementById('pokerBetInput');
      if(preview&&input) preview.textContent=`${Math.max(0,Math.floor(Number(input.value)||0)).toLocaleString('ru-RU')} MT`;
      const stand=document.getElementById('pokerLeave'); if(stand) stand.disabled=!joined;
      return out;
    }
  }

  function v53PokerAmountBounds(){
    const state=window.arcadeNetState?.poker||null;
    const local=typeof localPoker==='undefined'?null:localPoker;
    const me=state?.you || (local ? (localWaitingState()?.you || null) : null);
    const t=(typeof table==='function')?table():{bb:2,sb:1,min:20};
    const bb=Math.max(1,Number(state?.bigBlind ?? local?.bb ?? t.bb ?? 2));
    const current=Math.max(0,Number(state?.currentBet ?? local?.currentBet ?? 0));
    const pot=Math.max(0,Number(state?.pot ?? local?.pot ?? 0));
    const max=Math.max(0,Number(me?.stack||0)+Number(me?.bet||0) || Math.max(Number(document.getElementById('pokerBuyInInput')?.value||0), bb*20));
    const minRaise=Math.max(Number(state?.minRaiseTo)||0,current+bb,bb*2);
    const min=Math.min(Math.max(bb,minRaise),max||Math.max(bb,minRaise));
    return {state,me,bb,current,max:max||min,pot,min};
  }
  window.v52SetPokerBet=function(kind){
    const b=v53PokerAmountBounds(),input=document.getElementById('pokerBetInput'); if(!b||!input) return;
    let target=b.min;
    if(kind==='half') target=Math.max(b.min,b.current+Math.max(b.bb,Math.ceil(b.pot*0.5)));
    else if(kind==='pot') target=Math.max(b.min,b.current+Math.max(b.bb,b.pot));
    else if(kind==='allin') target=b.max;
    target=Math.max(0,Math.min(b.max,Math.floor(target||0)));
    input.value=String(target);
    input.setAttribute('value',String(target));
    const preview=document.getElementById('pokerBetPreview'); if(preview) preview.textContent=`${target.toLocaleString('ru-RU')} MT`;
    const hint=document.getElementById('pokerBetHint'); if(hint) hint.textContent=`Выбрано ${target.toLocaleString('ru-RU')} MT • MIN ${b.min.toLocaleString('ru-RU')} • MAX ${b.max.toLocaleString('ru-RU')}`;
    input.dispatchEvent(new Event('input',{bubbles:true}));
    input.dispatchEvent(new Event('change',{bubbles:true}));
  };
  document.querySelectorAll('[data-poker-size]').forEach(btn=>{
    btn.onclick=()=>window.v52SetPokerBet(btn.dataset.pokerSize);
    btn.onpointerup=e=>{ if(e.pointerType==='touch') window.v52SetPokerBet(btn.dataset.pokerSize); };
  });

  // Reset games when reopened.
  function resetBlackjackView(){
    try{
      if(typeof bjActive!=='undefined') bjActive=false;
      if(typeof bjHideDealer!=='undefined') bjHideDealer=true;
      if(typeof bjPlayer!=='undefined') bjPlayer=[];
      if(typeof bjDealer!=='undefined') bjDealer=[];
      if(typeof bjStake!=='undefined') bjStake=0;
      if(typeof bjButtons==='function') bjButtons(false);
      const msg=document.getElementById('bjMessage'); if(msg){ msg.className='casinoMessage'; msg.textContent='Выберите ставку и начните раздачу.'; }
      const deal=document.getElementById('bjDeal'); if(deal) deal.textContent='Раздать';
      if(typeof bjRender==='function') bjRender();
    } catch(e){}
  }
  const bjTable=document.querySelector('#blackjack .casinoTable');
  if(bjTable && !bjTable.querySelector('.casinoDealerBadge')) bjTable.insertAdjacentHTML('afterbegin','<div class="casinoDealerBadge"><span>DEALER</span>JVRX</div>');

  const oldSetActive=window.setActiveGameById;
  if(typeof oldSetActive==='function'){
    window.setActiveGameById=function(id,scroll=true){
      const out=oldSetActive.call(this,id,scroll);
      if(id==='poker'){
        seatChoice=null;
        if(!localPoker){ const t=(typeof table==='function')?table():{id:'t1',sb:1,bb:2}; renderPokerState({mode:pokerMode,tableId:t.id,seats:Array(pokerMode==='jarvis'?2:6).fill(null),community:[],pot:0,street:'waiting',handNo:0,you:null,smallBlind:t.sb,bigBlind:t.bb}); }
      }
      if(id==='blackjack') resetBlackjackView();
      return out;
    }
  }

  const oldGoMain=window.goMainMenu;
  if(typeof oldGoMain==='function'){
    window.goMainMenu=function(skip){ const out=oldGoMain.call(this,skip); resetBlackjackView(); return out; }
  }

  // v3.0.12: removed stale Arcade Hub renderer bridge.
})();



/* === v54 stabilization / performance patch === */
(function(){
  const style=document.createElement('style');
  style.id='v54-stabilization-style';
  style.textContent=`
  .coinLetterBadge{width:26px;height:26px;border-radius:50%;display:inline-grid;place-items:center;background:radial-gradient(circle at 35% 25%,#fff1a5,#d49729 60%,#734715);border:1px solid #ffe099;color:#2d1903;font:1000 8px system-ui;letter-spacing:-.02em;box-shadow:0 0 14px rgba(255,210,84,.14)}
  .previewCoin .profileTokenIcon.mac{width:28px;height:28px;font-size:8px;flex:0 0 28px}
  #poker .pokerTableWrap{contain:layout paint;transform:translateZ(0)}
  #poker .pokerSeats,#poker .pokerCenter{will-change:auto}
  #poker .pokerSeat{transition:border-color .14s,box-shadow .14s,opacity .14s}
  #poker .pokerCard{transition:transform .12s,box-shadow .12s}
  #poker .pokerSeat.me{z-index:7}
  #poker .pokerSeat.me .pokerSeatCards{display:none}
  #poker .pokerBottom .pokerHole{margin-top:8px}
  #poker .pokerBetQuick .btn:active{transform:translateY(1px);filter:brightness(1.12)}
  #poker .pokerBetQuick .btn.betFlash{border-color:#ffe29c!important;color:#fff2c8!important;background:rgba(255,226,156,.12)!important;box-shadow:0 0 16px rgba(255,226,156,.12)}
  #poker.poker-seated .pokerModeSwitch{opacity:.45;pointer-events:none}
  #poker.poker-seated #pokerTableChips{pointer-events:none;opacity:.55}
  #poker .pokerLobbyDeck{transition:opacity .15s ease}
  #poker.poker-seated .pokerLobbyDeck{margin-bottom:8px}
  #blackjack .casinoTable{min-height:470px;overflow:hidden}
  #blackjack .casinoTable::before{left:4%;right:4%;top:7%;height:63%;border-radius:50% 50% 48% 48%/30% 30% 22% 22%;border:2px solid rgba(243,216,152,.18);border-bottom:2px solid rgba(243,216,152,.12)}
  #blackjack .casinoTable::after{opacity:.72}
  #blackjack #dealerHand{margin-top:8px;padding-bottom:20px}
  #blackjack #playerHand{margin-top:12px;padding-top:18px;border-top:1px solid rgba(239,211,151,.08)}
  @media(max-width:760px){
    #poker .pokerTableWrap{contain:layout paint}
    #poker .pokerSeat{box-shadow:0 8px 18px rgba(0,0,0,.24)}
    #blackjack .casinoTable{min-height:420px;border-radius:28px 28px 110px 110px / 28px 28px 58px 58px}
  }
  @media(prefers-reduced-motion:reduce){#poker .pokerSeat,#poker .pokerCard,#poker .pokerLobbyDeck{transition:none!important}}
  `;
  document.head.appendChild(style);

  // Avoid duplicate quick-bet handlers and make the buttons deterministic.
  function v54PokerBounds(){
    const state=window.arcadeNetState?.poker||null;
    const t=(typeof table==='function')?table():{bb:2};
    const localMe=(typeof localPoker!=='undefined'&&localPoker)?localPoker.players?.[localPoker.playerSeat]:null;
    const me=state?.you||localMe||null;
    const bb=Math.max(1,Number(state?.bigBlind ?? (typeof localPoker!=='undefined'&&localPoker?localPoker.bb:null) ?? t.bb ?? 2));
    const current=Math.max(0,Number(state?.currentBet ?? (typeof localPoker!=='undefined'&&localPoker?localPoker.currentBet:null) ?? 0));
    const pot=Math.max(0,Number(state?.pot ?? (typeof localPoker!=='undefined'&&localPoker?localPoker.pot:null) ?? 0));
    const maxFromSeat=Math.max(0,Number(me?.stack||0)+Number(me?.bet||0));
    const fallback=Math.max(Number(document.getElementById('pokerBuyInInput')?.value||0),bb*20);
    const max=Math.max(bb, maxFromSeat||fallback);
    const serverMin=Number(state?.minRaiseTo)||0;
    const min=Math.min(max,Math.max(bb*2,current+bb,serverMin));
    return {state,me,bb,current,pot,max,min};
  }
  function v54SetBet(kind,button){
    const b=v54PokerBounds(),input=document.getElementById('pokerBetInput'); if(!input) return;
    let target=b.min;
    if(kind==='half') target=Math.max(b.min,b.current+Math.max(b.bb,Math.ceil(b.pot/2)));
    else if(kind==='pot') target=Math.max(b.min,b.current+Math.max(b.bb,b.pot));
    else if(kind==='allin') target=b.max;
    target=Math.max(0,Math.min(b.max,Math.floor(target)));
    input.value=String(target);
    input.defaultValue=String(target);
    const preview=document.getElementById('pokerBetPreview'); if(preview) preview.textContent=`${target.toLocaleString('ru-RU')} MT`;
    const hint=document.getElementById('pokerBetHint'); if(hint) hint.textContent=`Выбрано ${target.toLocaleString('ru-RU')} MT • MIN ${b.min.toLocaleString('ru-RU')} • MAX ${b.max.toLocaleString('ru-RU')}`;
    input.dispatchEvent(new InputEvent('input',{bubbles:true,inputType:'insertReplacementText',data:String(target)}));
    input.dispatchEvent(new Event('change',{bubbles:true}));
    document.querySelectorAll('#poker .pokerBetQuick .btn').forEach(x=>x.classList.remove('betFlash'));
    if(button){button.classList.add('betFlash');setTimeout(()=>button.classList.remove('betFlash'),220)}
  }
  document.querySelectorAll('#poker [data-poker-size]').forEach(btn=>{
    const clean=btn.cloneNode(true); btn.replaceWith(clean);
    clean.addEventListener('click',e=>{e.preventDefault();v54SetBet(clean.dataset.pokerSize,clean)});
    clean.addEventListener('pointerup',e=>{if(e.pointerType==='touch'){e.preventDefault();v54SetBet(clean.dataset.pokerSize,clean)}});
  });
  window.v52SetPokerBet=(kind)=>v54SetBet(kind,null);

  // Connected heads-up now waits for an explicit "Start hand" command.
  const startBtn=document.getElementById('pokerStartHand');
  if(startBtn){
    const clean=startBtn.cloneNode(true); startBtn.replaceWith(clean);
    clean.addEventListener('click',()=>{
      if(typeof localPoker!=='undefined'&&localPoker){
        if(!localPoker.handStarted && typeof localNewHand==='function') localNewHand();
        return;
      }
      const state=window.arcadeNetState?.poker;
      if(state?.mode==='jarvis' && state?.you && state?.street==='waiting' && window.arcadeNetState?.connected){
        arcadeNetSend({type:'poker_start'});
        clean.disabled=true;
        setTimeout(()=>{clean.disabled=false},900);
      }
    });
  }

  function v54RefreshPokerPhase(state){
    const root=document.getElementById('poker'); if(!root) return;
    const joined=!!(state?.you || (typeof localPoker!=='undefined'&&localPoker));
    const localWaiting=!!(typeof localPoker!=='undefined'&&localPoker&&!localPoker.handStarted);
    const serverWaiting=!!(state?.mode==='jarvis'&&state?.you&&state?.street==='waiting'&&!localWaiting);
    root.classList.toggle('poker-seated',joined);
    root.classList.toggle('poker-local-waiting',localWaiting||serverWaiting);
    const sb=document.getElementById('pokerStartHand');
    if(sb){sb.style.display=(localWaiting||serverWaiting)?'inline-flex':'';sb.disabled=false}
    const leave=document.getElementById('pokerLeave'); if(leave) leave.disabled=!joined;
  }

  const rp=window.renderPokerState;
  if(typeof rp==='function'){
    window.renderPokerState=function(state){
      const out=rp.apply(this,arguments);
      v54RefreshPokerPhase(state||window.arcadeNetState?.poker||null);
      return out;
    }
  }

  const leaveBase=window.arcadeNetPokerLeave;
  if(typeof leaveBase==='function'){
    window.arcadeNetPokerLeave=function(){
      const out=leaveBase.apply(this,arguments);
      const root=document.getElementById('poker');
      root?.classList.remove('poker-seated','poker-local-waiting');
      const t=(typeof table==='function')?table():{id:'1-2',sb:1,bb:2};
      setTimeout(()=>{ if(typeof localPoker==='undefined'||!localPoker) renderPokerState({mode:pokerMode,tableId:t.id,seats:Array(pokerMode==='jarvis'?2:6).fill(null),community:[],pot:0,street:'waiting',handNo:0,you:null,smallBlind:t.sb,bigBlind:t.bb}); },0);
      return out;
    }
    const btn=document.getElementById('pokerLeave'); if(btn) btn.onclick=()=>window.arcadeNetPokerLeave();
  }

  // Cleanly reset Blackjack and Roulette when opened again.
  function v54ResetCasino(id){
    if(id==='blackjack'){
      try{bjActive=false;bjHideDealer=true;bjPlayer=[];bjDealer=[];bjStake=0;bjBet=Math.max(1,Number(document.getElementById('bjBetInput')?.value)||50);bjButtons(false);document.getElementById('bjDeal').textContent='Раздать';const m=document.getElementById('bjMessage');if(m){m.className='casinoMessage';m.textContent='Выберите ставку и начните раздачу.'}bjRender()}catch(e){}
    }
    if(id==='roulette'){
      try{const r=document.getElementById('rouletteResult');if(r)r.textContent='—';const m=document.getElementById('rouletteMessage');if(m){m.className='casinoMessage';m.textContent='Выберите тип ставки и сумму.'}}catch(e){}
    }
  }
  const setActiveBase=window.setActiveGameById;
  if(typeof setActiveBase==='function'){
    window.setActiveGameById=function(id,scroll=true){const out=setActiveBase.call(this,id,scroll);if(id==='blackjack'||id==='roulette')v54ResetCasino(id);if(id==='poker')v54RefreshPokerPhase(window.arcadeNetState?.poker||null);return out}
  }

  // v3.0.12: removed stale Hub metrics throttle.
})();


/* === v55 global recovery / UX patch === */
(function(){
  const style=document.createElement('style');
  style.id='v55-global-patch';
  style.textContent=`
  /* v3.0.12: retired mission/Hub styles removed. */

  /* Responsible-play warning. */
  .ageGateCard{width:min(500px,100%)!important}.ageGateCard p{font-size:13px}.ageGateRemember{display:flex!important;gap:9px;align-items:flex-start;margin:16px 0;padding:11px 12px;border-radius:13px;border:1px solid rgba(255,255,255,.08);background:rgba(0,0,0,.12);color:#c8d5ce;font-size:11px;line-height:1.4;cursor:pointer}.ageGateRemember input{margin-top:2px;accent-color:#63e7a8}

  /* v3.0.10: legacy profile/admin activity styles removed. */

  /* Poker: make the felt cards the primary hand display. */
  #poker.poker-seated .pokerHandPanel{display:none!important}
  #poker.poker-seated .pokerBottom{grid-template-columns:1fr!important}
  #poker .pokerSeat.me{z-index:9!important}
  #poker .pokerSeat.me .pokerSeatCards{display:flex!important;position:absolute;left:50%;bottom:calc(100% + 14px);transform:translateX(-50%);gap:8px;justify-content:center;z-index:8;filter:drop-shadow(0 12px 12px rgba(0,0,0,.25))}
  #poker .pokerSeat.me .pokerSeatCards .pokerCard{width:64px!important;height:88px!important;font-size:21px!important;padding:8px!important;border-radius:10px!important;box-shadow:0 12px 24px rgba(0,0,0,.34)!important}
  #poker .pokerSeat.me .pokerSeatCards .pokerCard small{font-size:21px!important}
  #poker .pokerSeat.me .pokerSeatCombo{bottom:calc(100% + 112px)!important}
  #poker .pokerSeat.me .pokerSeatCombo::after{display:none}
  #poker .pokerChangeTableBtn{display:none}
  #poker.poker-seated .pokerChangeTableBtn{display:inline-flex!important}
  #poker:not(.poker-seated) .pokerStandUpBtn,#poker:not(.poker-seated) .pokerRebuyBtn{display:none!important}
  @media(max-width:560px){#poker .pokerSeat.me .pokerSeatCards{bottom:calc(100% + 10px);gap:5px}#poker .pokerSeat.me .pokerSeatCards .pokerCard{width:52px!important;height:72px!important;font-size:17px!important;padding:6px!important}#poker .pokerSeat.me .pokerSeatCards .pokerCard small{font-size:17px!important}#poker .pokerSeat.me .pokerSeatCombo{bottom:calc(100% + 91px)!important}}

  /* Performance: reduce expensive off-screen work/effects. */
  .game:not(.active),.pokerInfoOverlay:not(.active),.ageGateOverlay:not(.active){content-visibility:auto}
  @media(max-width:760px){.pokerInfoOverlay,.ageGateOverlay{backdrop-filter:none!important;-webkit-backdrop-filter:none!important}.pokerInfoCard,.ageGateCard{box-shadow:0 20px 45px rgba(0,0,0,.38)!important}}
  `;
  document.head.appendChild(style);

  // Responsible gaming gate: persistent opt-out only when the user explicitly checks it.
  const gate=document.getElementById('ageGateOverlay'), gateCard=gate?.querySelector('.ageGateCard');
  if(gateCard){
    const p=gateCard.querySelector('p');
    if(p) p.textContent='Азартные игры могут формировать рискованное поведение и приводить к потере контроля. Играйте ответственно, делайте перерывы и относитесь к результату только как к развлечению.';
    const strong=gateCard.querySelector('strong'); if(strong) strong.textContent='Этот раздел предназначен только для пользователей 18+.';
    if(!document.getElementById('ageGateRemember')){
      const actions=gateCard.querySelector('.ageGateActions');
      actions?.insertAdjacentHTML('beforebegin','<label class="ageGateRemember"><input type="checkbox" id="ageGateRemember"> <span><b>Не показывать это предупреждение снова</b><br>Настройка сохранится на этом устройстве.</span></label>');
    }
  }
  function v55AgeGateDisabled(){try{return localStorage.getItem('jarvisCasinoAgeGateDismissedV55')==='yes'}catch{return false}}
  window.showCategory=function(cat){
    if(cat==='casino'&&!v55AgeGateDisabled()){
      pendingAgeCategory=cat;
      gate?.classList.add('active');gate?.setAttribute('aria-hidden','false');
      return;
    }
    return showCategoryNow(cat);
  };
  const confirm=document.getElementById('ageGateConfirm');
  if(confirm){
    const clean=confirm.cloneNode(true);confirm.replaceWith(clean);
    clean.onclick=()=>{
      const remember=document.getElementById('ageGateRemember')?.checked;
      if(remember){try{localStorage.setItem('jarvisCasinoAgeGateDismissedV55','yes')}catch{}}
      const cat=pendingAgeCategory||'casino';
      gate?.classList.remove('active');gate?.setAttribute('aria-hidden','true');pendingAgeCategory=null;
      showCategoryNow(cat);
    };
  }

  // v3.0.10: legacy profile/admin activity runtime removed.

  // Poker lobby controls.
  const buyBar=document.querySelector('#poker .pokerBuyInBar');
  if(buyBar&&!document.getElementById('pokerChangeTable')) buyBar.insertAdjacentHTML('beforeend','<button class="btn pokerChangeTableBtn" id="pokerChangeTable">Сменить стол</button>');

  function v55EmptyPokerState(){const t=(typeof table==='function')?table():{id:'1-2',sb:1,bb:2};return{mode:pokerMode,tableId:t.id,seats:Array(pokerMode==='jarvis'?2:6).fill(null),community:[],pot:0,street:'waiting',handNo:0,you:null,smallBlind:t.sb,bigBlind:t.bb,currentBet:0,minRaiseTo:t.bb*2}}
  function v55PokerLocalCashout(){
    if(typeof localPoker!=='undefined'&&localPoker){
      const me=localPoker.players?.[localPoker.playerSeat];const left=Math.max(0,Math.floor(Number(me?.stack)||0));
      if(left&&typeof setMuraTokenBalance==='function')setMuraTokenBalance(muraTokenBalance()+left,{sync:false});
      localPoker=null;
    }
  }
  function v55LeavePokerToLobby(showToast=true){
    const wasLocal=typeof localPoker!=='undefined'&&!!localPoker;
    v55PokerLocalCashout();
    if(window.arcadeNetState?.connected&&!wasLocal){try{arcadeNetSend({type:'poker_leave'})}catch{}}
    if(window.arcadeNetState)window.arcadeNetState.poker=null;
    seatChoice=null;
    const root=document.getElementById('poker');root?.classList.remove('poker-seated','poker-local-waiting');
    try{renderPokerState(v55EmptyPokerState());pokerModeUI();updateTableUI()}catch{}
    if(showToast)showArcadeToast('Poker','Вы встали из-за стола. Выберите новый стол или режим.','♠',1800);
    return true;
  }
  window.arcadeNetPokerLeave=function(){return v55LeavePokerToLobby(true)};
  const leave=document.getElementById('pokerLeave');if(leave){const clean=leave.cloneNode(true);leave.replaceWith(clean);clean.disabled=false;clean.onclick=e=>{e.preventDefault();v55LeavePokerToLobby(true)}}
  document.getElementById('pokerChangeTable')?.addEventListener('click',e=>{e.preventDefault();v55LeavePokerToLobby(false);showArcadeToast('Poker','Выберите другой стол и новый buy-in.','↻',1600)});

  // Reliable manual deal start for both local and connected heads-up.
  const start=document.getElementById('pokerStartHand');
  if(start){const clean=start.cloneNode(true);start.replaceWith(clean);clean.onclick=e=>{e.preventDefault();
    if(typeof localPoker!=='undefined'&&localPoker){
      if(localPoker.street==='waiting'||!localPoker.handStarted){localPoker.handStarted=true;localNewHand();return}
      showArcadeToast('Poker','Раздача уже идёт.','♠');return;
    }
    const st=window.arcadeNetState?.poker;
    if(st?.you&&st?.mode==='jarvis'&&st?.street==='waiting'&&window.arcadeNetState?.connected){arcadeNetSend({type:'poker_start'});showArcadeToast('Poker','Дилер начинает раздачу…','D',1200);return}
    if(!st?.you){showArcadeToast('Poker','Сначала сядьте за стол.','!');return}
    showArcadeToast('Poker','Раздача уже идёт или ручной старт здесь недоступен.','!');
  }}

  // Hard main-menu navigation. Poker can no longer trap the player in the table UI.
  function v55MainMenu(){
    if(document.getElementById('poker')?.classList.contains('active'))v55LeavePokerToLobby(false);
    document.body.classList.remove('game-mode');
    games.forEach(x=>x.classList.remove('active'));cards.forEach(x=>{x.classList.remove('active');x.setAttribute('aria-pressed','false')});
    resetCategoryChooser();
    if(typeof arcadeNetSend==='function')try{arcadeNetSend({type:'activity',game:'menu'})}catch{}
    window.scrollTo({top:0,behavior:'smooth'});
  }
  window.goMainMenu=v55MainMenu;
  document.querySelectorAll('[data-main-menu]').forEach(btn=>{const clean=btn.cloneNode(true);btn.replaceWith(clean);clean.onclick=e=>{e.preventDefault();v55MainMenu()}});

  // Player's cards remain large on the actual felt. The side hand block is secondary/hidden while seated.
  function v55EnsurePokerCardView(){const st=window.arcadeNetState?.poker;if(st?.you&&typeof v53RenderSeatsFromState==='function')try{v53RenderSeatsFromState(st)}catch{}}
  const renderPokerBase55=window.renderPokerState;
  if(typeof renderPokerBase55==='function')window.renderPokerState=function(state){const out=renderPokerBase55.apply(this,arguments);requestAnimationFrame(v55EnsurePokerCardView);return out};

  // v3.0.10: old profile-overlay performance bridge removed.

})();



/* === v56 Poker reliability / focused game UI / layout patch === */
(function(){
  const style=document.createElement('style');
  style.id='v56-global-patch';
  style.textContent=`
    /* Current CAS game shell. */
    body.game-mode .footer{display:none!important}
    body.game-mode #gamePanel{margin-top:8px!important}
    html.v56-modal-open,body.v56-modal-open{overflow:hidden!important;overscroll-behavior:none!important}
    .pokerInfoOverlay.active,.ageGateOverlay.active,.bjRulesOverlay.active{overscroll-behavior:contain!important}

    /* Poker lobby must become fully selectable after leaving/changing tables. */
    #poker:not(.poker-seated) .pokerLobbyDeck{display:block!important}
    #poker:not(.poker-seated) .pokerTableSelector{display:flex!important}
    #poker:not(.poker-seated) .pokerBuyInBar{display:flex!important}
    #poker:not(.poker-seated) #pokerQuickJoin,
    #poker:not(.poker-seated) #pokerBuyInInput,
    #poker:not(.poker-seated) .pokerBuyInUnit{display:inline-flex!important}
    #poker:not(.poker-seated) [data-poker-table]{pointer-events:auto!important;opacity:1!important}
    #poker.poker-seated .pokerChangeTableBtn{display:inline-flex!important}

    /* Player's actual hole cards on the felt are large and dominant. */
    #poker .pokerSeat.me{min-height:118px!important;width:205px!important}
    #poker .pokerSeat.me .pokerSeatCards{justify-content:center!important;gap:8px!important;margin-top:9px!important}
    #poker .pokerSeat.me .pokerSeatCards .pokerCard{width:62px!important;height:86px!important;font-size:20px!important;padding:8px!important;border-radius:10px!important;box-shadow:0 12px 24px rgba(0,0,0,.34)!important}
    #poker .pokerSeat.me .pokerSeatCards .pokerCard small{font-size:20px!important}
    #poker.poker-seated .pokerHandPanel{display:none!important}
    #poker .pokerSeatCombo{bottom:calc(100% + 7px)!important}
    @media(max-width:620px){#poker .pokerSeat.me{width:154px!important;min-height:105px!important}#poker .pokerSeat.me .pokerSeatCards .pokerCard{width:49px!important;height:69px!important;font-size:16px!important}#poker .pokerSeat.me .pokerSeatCards .pokerCard small{font-size:16px!important}}

    /* Lighter effects while actively playing. */
    body.game-mode .game.active{contain:layout style}
    body.game-mode .game.active .pokerSeat,body.game-mode .game.active .playingCard{will-change:auto!important}
    body.game-mode .game.active .pokerTableWrap{box-shadow:inset 0 0 0 8px #3c2412,inset 0 0 0 12px #a87939,inset 0 0 48px rgba(0,0,0,.24),0 18px 36px rgba(0,0,0,.18)!important}
  `;
  document.head.appendChild(style);

  // v3.0.12: retired Hub/category/profile normalization runtime removed.

  // Modal scroll lock, without disabling scrolling inside the modal itself.  // Modal scroll lock, without disabling scrolling inside the modal itself.
  /* v86: legacy modal watcher removed; current JRVX CAS modals own their lifecycle. */


  // v86: legacy pre-Poker59 reliability layer removed. Poker59 is the sole poker controller.

})();




