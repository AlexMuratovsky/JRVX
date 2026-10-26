(function(){
'use strict';
const $=id=>document.getElementById(id),ROOT=$('v69Root');if(!ROOT)return;
const fmt=n=>window.JRVXCASMoneyV330.formatCompact(Number.isSafeInteger(n)?n:0,{currency:false});
const tableDefs=[
{id:'1-2',sb:1,bb:2,min:20,name:'Rookie Room'},
{id:'2-4',sb:2,bb:4,min:40,name:'Harbor Room'},
{id:'5-10',sb:5,bb:10,min:100,name:'Sapphire Room'},
{id:'10-20',sb:10,bb:20,min:200,name:'Violet Room'},
{id:'25-50',sb:25,bb:50,min:500,name:'Obsidian Room'},
{id:'50-100',sb:50,bb:100,min:1000,name:'Emerald Crown'},
{id:'100-200',sb:100,bb:200,min:2000,name:'Imperial Room'}];
let flow='tables',moveDirection=1,pendingLaunch=null,adminSelectedV71=null;
const ECO_KEY='jrvxCasMGDevelopmentV330',ACTIVE_KEY='jarvisCasActiveCurrencyV69';
function eco(){return {mg:(window.JRVXCasEconomy||window.JVRXCasEconomy)?.balance?.()||0}}
function setEco(value){return window.JRVXCasEconomy?.set?.({mg:value.mg})}
function activeCur(){return 'MG'}
function toast(title,msg){try{const t=$('v69Toast');if(t){$('v69ToastTitle').textContent=title;$('v69ToastText').textContent=msg;t.classList.add('show');clearTimeout(toast.t);toast.t=setTimeout(()=>t.classList.remove('show'),2600);return}showArcadeToast?.(title,msg,'♠')}catch{}}
function showLobby(){ROOT.hidden=false;ROOT.style.display='block';document.body.classList.remove('game-mode');document.querySelectorAll('.game').forEach(g=>g.classList.remove('active'));document.querySelectorAll('.v69Screen,.v69PanelScreen').forEach(x=>x.classList.remove('active'));$('v69Home')?.classList.add('active');document.body.style.overflow='hidden';window.scrollTo(0,0);closeLegacyLayers();refreshProfileIcon()}
function closeLegacyLayers(){['profileOverlay','gamePreviewOverlay','pokerRoyaleOverlay','ageGateOverlay','profileSwitcherOverlay'].forEach(id=>{$(id)?.classList.remove('active');$(id)?.setAttribute?.('aria-hidden','true')});}
window.v71ReturnLobby=showLobby;try{goMainMenu=function(){showLobby()}}catch{}
function refreshProfileIcon(){const a=$('v69ProfileTop');if(a){a.textContent='';a.setAttribute('aria-label','Профиль');a.title='Профиль'}}

// Main lobby: promote Private / Roulette / Blackjack to full-size actions and keep one news source.
const primary=$('v69Home')?.querySelector('.v69PrimaryGrid');
if(primary){
  const mk=(id,cls,num,icon,title,desc)=>{let b=$(id);if(!b){b=document.createElement('button');b.id=id;b.className=`v69Primary ${cls}`;b.innerHTML=`<div class="num">${num}</div><div class="v69PrimaryIcon">${icon}</div><h3>${title}</h3><p>${desc}</p>`;primary.appendChild(b)}return b};
  mk('v71Private','v71private','04 • Private','♥','Частная игра','Сначала выберите Mura Gold, затем стол и друга.');
  mk('v71Roulette','v71roulette','05 • Roulette','◉','Roulette','Отдельный крупный вход в европейскую рулетку с балансом MG.');
  mk('v71Blackjack','v71blackjack','06 • Blackjack','21','Blackjack','Крупный вход в стол 21 на MG Mura Gold.');
}
const quick=$('v69QuickPlay');if(quick){quick.querySelector('h3').textContent='Играть с JRVX';quick.querySelector('p').textContent='Выберите MG, затем стол для матча один на один с JRVX.'}
const sectionHead=$('v69Home')?.querySelector('.v69Section .v69SectionHead p');if(sectionHead)sectionHead.textContent='Столы, JRVX, приватная игра и дополнительные режимы.';
const scroller=$('v69Home')?.querySelector('.v69Scroller');if(scroller){scroller.querySelectorAll('[data-v69-action="private"],[data-v69-action="roulette"],[data-v69-action="blackjack"]').forEach(x=>x.remove())}
const clubHead=[...($('v69Home')?.querySelectorAll('.v69SectionHead')||[])].find(h=>h.querySelector('h2')?.textContent.trim()==='Клуб');if(clubHead){clubHead.querySelector('h2').textContent='Покерная лента';const p=clubHead.querySelector('p');if(p)p.textContent='Одна новость из мира покера меняется каждые два часа. Обучение остаётся рядом.'}
// Remove duplicate news mini; one dedicated rotating news card remains.
if(scroller)scroller.querySelector('[data-v69-action="news"]')?.remove();
const NEWS=[
 {title:'Novak выиграл 2026 WSOP Main Event',text:'PokerNews сообщил, что Novak стал чемпионом Main Event 2026 и получил свой первый браслет.',date:'23 сентября 2026'},
 {title:'Негреану снова был близок к браслету WSOP',text:'На финальном столе очередной турнирной серии неудачная раздача остановила девятую попытку Даниэля Негреану взять ещё один браслет.',date:'24 сентября 2026'},
 {title:'Рекордный WSOP Circuit Main Event в Техасе',text:'Eric Chang выиграл рекордный по масштабу WSOP Circuit Main Event на TCH Social.',date:'23 сентября 2026'},
 {title:'Nick Schulman взял Triton Main Event',text:'Schulman добавил титул Triton Main Event к своей покерной коллекции.',date:'16 сентября 2026'},
 {title:'Benny Glaser выиграл 17-й титул WCOOP',text:'Glaser продолжил серию успехов в WCOOP, победив в $1,050 8-Game.',date:'15 сентября 2026'},
 {title:'Бразильцы усилили серию побед WSOP Online',text:'Пятая победа Бразилии в серии WSOP Online 2026 продолжила сильный турнирный отрезок.',date:'14 сентября 2026'}
];
function renderNews(){let box=$('v71NewsCard');if(!box){box=document.createElement('article');box.id='v71NewsCard';box.className='v71NewsCard';const target=scroller?.closest('.v69Section');target?.insertAdjacentElement('beforeend',box)}if(!box)return;const bucket=Math.floor(Date.now()/(2*60*60*1000)),newsIndex=(Math.imul(bucket|0,1103515245)+12345>>>0)%NEWS.length,n=NEWS[newsIndex],next=new Date((bucket+1)*2*60*60*1000);box.innerHTML=`<div class="v71NewsIcon">N</div><div><small>POKER WORLD • ${n.date}</small><strong>${n.title}</strong><p>${n.text}</p></div><div class="v71NewsTime">Следующая: ${next.toLocaleTimeString('ru-RU',{hour:'2-digit',minute:'2-digit'})}</div>`}
renderNews();document.addEventListener('visibilitychange',()=>{if(!document.hidden)renderNews()},{passive:true});

// Eliminate visible legacy vocabulary from current JRVX CAS surfaces.
function sanitizeVisible(root=document){const walker=document.createTreeWalker(root,NodeFilter.SHOW_TEXT,{acceptNode(n){const p=n.parentElement;if(!p||['SCRIPT','STYLE','TEXTAREA'].includes(p.tagName))return NodeFilter.FILTER_REJECT;return /(Mura Tokens|Mura Arcade Coin|\bMAC\b|\bMT\b|казино|casino)/i.test(n.nodeValue||'')?NodeFilter.FILTER_ACCEPT:NodeFilter.FILTER_REJECT}});const nodes=[];while(walker.nextNode())nodes.push(walker.currentNode);const cur=activeCur(),full='Mura Gold';for(const n of nodes){let s=n.nodeValue||'';s=s.replace(/Mura Tokens/gi,full).replace(/Mura Arcade Coin/gi,'Mura Gold').replace(/\bMAC\b/g,'MG').replace(/\bMT\b/g,cur).replace(/казино/gi,'клуб').replace(/casino/gi,'club');if(s!==n.nodeValue)n.nodeValue=s}}
const sanitateRoots=['v69Root','poker','blackjack','roulette'];function sanitizeAll(){sanitateRoots.forEach(id=>{const r=$(id);if(r)sanitizeVisible(r)})}sanitizeAll();

// Shared currency-first table flow.
const tableBtn=$('v69Tables'),nativeTables=tableBtn?.onclick;
function setFlowCopy(){const title=$('v69TablesScreen')?.querySelector('.v69PanelHead h2'),sub=$('v69TableSubtitle');if(title)title.textContent=flow==='jarvis'?'Играть с JRVX':flow==='private'?'Частная игра':'Столы JRVX CAS';if(sub)sub.textContent='Все ставки в MG. Выберите формат и стол.'}
function openFlow(kind){flow=kind||'tables';if(nativeTables)nativeTables.call(tableBtn);else{document.querySelectorAll('.v69Screen,.v69PanelScreen').forEach(x=>x.classList.remove('active'));$('v69TablesScreen')?.classList.add('active')}ROOT.hidden=false;ROOT.style.display='block';window.JRVXCasEconomy?.setCurrency?.('MG');setFlowCopy();$('v69CurrencyStep').hidden=true;$('v69TableStep').hidden=false;afterCurrency();window.scrollTo(0,0)}
window.JRVXCASOpenTableFlow=openFlow;if(tableBtn)tableBtn.onclick=()=>openFlow('tables');if(quick)quick.onclick=()=>openFlow('jarvis');if($('v69Tournaments'))$('v69Tournaments').onclick=()=>openFlow('tournaments');if($('v71Private'))$('v71Private').onclick=()=>openFlow('private');

// Add context bar + tournament placeholder.
const tableStep=$('v69TableStep');if(tableStep&&!$('v71ContextBar')){const c=document.createElement('div');c.id='v71ContextBar';c.className='v71ContextBar';c.innerHTML='<div><strong id="v71ContextTitle">Poker Rooms</strong><span id="v71ContextText">Выберите формат и пролистайте столы.</span></div><span>Свайп по столу тоже работает</span>';tableStep.insertBefore(c,tableStep.firstChild)}
const wrap=$('v69TablesScreen')?.querySelector('.v69PanelWrap');if(wrap&&!$('v71TournamentSoon')){const x=document.createElement('div');x.id='v71TournamentSoon';x.className='v71TournamentSoon';x.innerHTML='<div class="icon">★</div><h3>Турниры готовятся</h3><p>Валюта выбрана. Турнирные сетки, бай-ины и рейтинговые серии будут подключены отдельным обновлением.</p><button class="v69Btn" id="v71TournamentBack" style="margin-top:16px">← Выбрать другую валюту</button>';wrap.appendChild(x);$('v71TournamentBack').onclick=()=>openFlow('tournaments')}
function afterCurrency(){setFlowCopy();const sub=$('v69TableSubtitle');if(flow==='tournaments'){if(sub)sub.textContent='Турнирный режим пока в разработке.';$('v69TableStep').hidden=true;$('v71TournamentSoon').classList.add('active');return}if(sub)sub.textContent='Выберите формат и пролистайте столы.';$('v71TournamentSoon')?.classList.remove('active');$('v69TableStep').hidden=false;const t=$('v71ContextTitle'),d=$('v71ContextText');if(t)t.textContent=flow==='jarvis'?'Heads-Up с JRVX':flow==='private'?'Частный стол':'Texas Hold’em / Omaha';if(d)d.textContent=flow==='jarvis'?'Выберите Hold’em / Omaha и лимит. Запуск — один на один с JRVX.':flow==='private'?'После выбора стола укажете друга.':'Texas Hold’em работает через сервер. Если связь недоступна, восстановите подключение перед входом за стол.';const enter=$('v69EnterTable');if(enter)enter.textContent=flow==='private'?'Продолжить к другу':'Войти за стол'}
document.querySelectorAll('.v69CurrencyCard[data-currency]').forEach(card=>{const native=card.onclick;card.onclick=e=>{native?.call(card,e);afterCurrency();sanitizeAll()}});
if($('v69ChangeCurrency')){$('v69ChangeCurrency').onclick=()=>{openFlow(flow)}}

// Table animation + swipe.
function pulseMove(dir){const stage=$('v69TableStep')?.querySelector('.v69TableStage');if(!stage)return;stage.classList.remove('v71MoveNext','v71MovePrev');void stage.offsetWidth;stage.classList.add(dir>0?'v71MoveNext':'v71MovePrev');setTimeout(()=>stage.classList.remove('v71MoveNext','v71MovePrev'),520)}
for(const [id,dir] of [['v69NextTable',1],['v69PrevTable',-1]]){const b=$(id);if(b){const native=b.onclick;b.onclick=e=>{moveDirection=dir;native?.call(b,e)}}}
const viewport=document.querySelector('.v69TableViewport');if(viewport){let sx=0,sy=0,drag=false;viewport.addEventListener('pointerdown',e=>{sx=e.clientX;sy=e.clientY;drag=true;try{viewport.setPointerCapture(e.pointerId)}catch{}},{passive:true});viewport.addEventListener('pointerup',e=>{if(!drag)return;drag=false;const dx=e.clientX-sx,dy=e.clientY-sy;if(Math.abs(dx)>48&&Math.abs(dx)>Math.abs(dy)*1.1){(dx<0?$('v69NextTable'):$('v69PrevTable'))?.click()}},{passive:true});viewport.addEventListener('touchstart',e=>{const t=e.touches[0];if(t){sx=t.clientX;sy=t.clientY}},{passive:true});viewport.addEventListener('touchend',e=>{const t=e.changedTouches[0];if(!t)return;const dx=t.clientX-sx,dy=t.clientY-sy;if(Math.abs(dx)>42&&Math.abs(dx)>Math.abs(dy)*1.1){(dx<0?$('v69NextTable'):$('v69PrevTable'))?.click()}},{passive:true})}

function selectedTable(){const i=Math.max(0,Math.min(tableDefs.length-1,(parseInt(($('v69TableCounter')?.textContent||'1').split('/')[0])||1)-1));return tableDefs[i]}
function selectedVariant(){return document.querySelector('.v69VariantToggle [data-variant].active')?.dataset.variant||'holdem'}
function currentBalance(){return window.JRVXCasEconomy?.balance?.()||0}
function closeRootForGameV71(){ROOT.hidden=true;ROOT.style.display='none';document.body.style.overflow='';closeLegacyLayers()}
function configurePoker(mode,table,friendId=''){
  const cur=activeCur();if(selectedVariant()==='omaha'){toast('Omaha','Omaha уже есть в выборе столов, но игровой движок ещё в разработке.');return}
  if(mode==='jarvis'&&currentBalance(cur)<table.min){toast('Недостаточно средств',`Для входа нужно минимум ${fmt(table.min)} ${cur}. Получите Daily или пополните баланс.`);return}
  const launchToken=(window.__JRVXPokerLaunchToken=(Number(window.__JRVXPokerLaunchToken)||0)+1);
  closeRootForGameV71();try{setActiveGameById('poker',false)}catch(e){console.warn(e)}
  const attempt=(n=0)=>{if(Number(window.__JRVXPokerLaunchToken)!==launchToken)return;const P=window.Poker59;if((!P?.state||!P?.join)&&n<35){setTimeout(()=>attempt(n+1),100);return}if(!P?.state||!P?.join){showLobby();toast('Poker','Стол не инициализировался.');return}try{P.state.mode=mode;P.state.tableId=table.id;P.state.seat=0}catch{};try{document.querySelector(`#p59Tables [data-table-id="${table.id}"],#p59Tables [data-p59-table="${table.id}"]`)?.click()}catch{};try{const input=$('p59BuyIn');if(input){input.min=String(table.min);input.value=String(table.min)}}catch{};try{document.querySelector(`[data-p59-mode="${mode}"]`)?.click()}catch{};if(mode==='friend'&&friendId){const f=$('p59Friend');if(f)f.value=friendId}try{P.join()}catch(err){console.warn(err)};setTimeout(()=>{sanitizeAll();if(mode!=='online'&&!$('p59Game')?.classList.contains('active')){}},160)};setTimeout(()=>attempt(),220)
}
function openFallback(table){pendingLaunch=table;$('v71FallbackTitle').textContent='Public Table сейчас offline';$('v71FallbackText').textContent=`SERVER LINK недоступен. Вы можете открыть ${table.name} (${table.sb}/${table.bb} ${activeCur()}) локально один на один.`;$('v71Fallback').classList.add('active');$('v71Fallback').setAttribute('aria-hidden','false')}
$('v71FallbackCancel').onclick=()=>{$('v71Fallback').classList.remove('active');pendingLaunch=null};$('v71FallbackLocal').onclick=()=>{const t=pendingLaunch;pendingLaunch=null;$('v71Fallback').classList.remove('active');if(t)configurePoker('jarvis',t)};
function privateFriendStep(table){let friends=[];try{const dev=window.JRVXCASIdentityV300?.state?.().mode==='development';friends=Array.isArray(window.arcadeNetState?.friends)?window.arcadeNetState.friends:(dev?JSON.parse(localStorage.getItem('jarvisFriendsV51')||'[]'):[])}catch{};const body=$('v69InfoBody'),title=$('v69InfoTitle');if(!body||!title)return;title.textContent='Частная игра';body.innerHTML=`<div class="v69Coming" style="padding:18px"><div class="icon">♥</div><h3>${table.name} • ${table.sb}/${table.bb} ${activeCur()}</h3><p>Выберите друга. Частный online-стол требует SERVER LINK.</p>${friends.length?`<div class="v69Field" style="max-width:420px;margin:18px auto"><label>Друг</label><select id="v71PrivateFriend" style="width:100%;padding:13px 14px;border-radius:15px;border:1px solid rgba(103,119,160,.45);background:#070c16;color:#fff">${friends.map(f=>`<option value="${String(f.id).replace(/"/g,'&quot;')}">${String(f.nickname||('Игрок '+f.id))}</option>`).join('')}</select></div><button class="v69Btn primary" id="v71PrivateStart">Войти за стол</button>`:'<div class="v70Empty">Список друзей пуст. Добавьте игрока в профиле.</div>'}</div>`;$('v69InfoModal').classList.add('active');setTimeout(()=>{const b=$('v71PrivateStart');if(b)b.onclick=()=>{const id=$('v71PrivateFriend')?.value||'';if(!window.arcadeNetState?.connected){toast('Private Table','Для игры с другом нужен SERVER LINK.');return}$('v69InfoModal').classList.remove('active');configurePoker('friend',table,id)}},0)}
const enter=$('v69EnterTable');if(enter)enter.onclick=()=>{const table=selectedTable();if(flow==='jarvis'){configurePoker('jarvis',table);return}if(flow==='private'){privateFriendStep(table);return}if(flow==='tournaments'){toast('Турниры','Раздел в разработке.');return}if(window.arcadeNetState?.connected)configurePoker('online',table);else openFallback(table)};

// Promote Roulette / Blackjack but force currency choice first.
function simpleCurrencyFlow(game){flow=game;window.JRVXCasEconomy?.setCurrency?.('MG');window.JVRXRoutes?.launchSimpleGame?.(game)}
if($('v71Roulette'))$('v71Roulette').onclick=()=>simpleCurrencyFlow('roulette');if($('v71Blackjack'))$('v71Blackjack').onclick=()=>simpleCurrencyFlow('blackjack');
document.querySelectorAll('.v69CurrencyCard[data-currency]').forEach(card=>{const wrapped=card.onclick;card.onclick=e=>{wrapped?.call(card,e);if(flow==='roulette'||flow==='blackjack'){const id=flow;ROOT.hidden=true;ROOT.style.display='none';document.body.style.overflow='';try{setActiveGameById(id,false)}catch{};setTimeout(()=>{sanitizeAll()},220)}}});

// Profile: read-only identity/balances; friends + achievements; only admin can edit identity/economy/mode.
const profile=$('v69Profile');if(profile){
 const pane=profile.querySelector('[data-v70-pane="profile"]');if(pane)pane.innerHTML='<div class="v71ProfileReadonly"><div class="v69Stat"><span>Никнейм</span><strong id="v71ProfileNick">Игрок</strong></div><div class="v69Stat"><span>ID</span><strong id="v71ProfileId">—</strong></div><div class="v69Stat"><span>Mura Gold</span><strong id="v71ProfileMG">0 MG</strong></div></div><div class="v71ReadOnlyNote">ID, никнейм, балансы и режим удачи изменяются только через Админ-панель. В обычном профиле доступны просмотр, друзья и достижения.</div>';
}
function currentProfile(){try{return playerProfile||{}}catch{return{}}}
function syncProfileReadOnly(){const p=currentProfile(),e=eco();if($('v71ProfileNick'))$('v71ProfileNick').textContent=p.nickname||'Игрок';if($('v71ProfileId'))$('v71ProfileId').textContent=p.playerId||'—';if($('v71ProfileMG'))$('v71ProfileMG').textContent=`${fmt(e.mg)} MG`;if($('v70ProfileHeroName'))$('v70ProfileHeroName').textContent=p.nickname||'Игрок';if($('v70ProfileHeroId'))$('v70ProfileHeroId').textContent=p.playerId||'—';if($('v70ProfileMG'))$('v70ProfileMG').textContent=`${fmt(e.mg)} MG`}
function registry(){try{return typeof registrySafeGet==='function'?(registrySafeGet()||[]):[]}catch{return[]}}
function saveRegistry(list){try{if(typeof registrySave==='function')registrySave(list)}catch{}}
function luckLabel(v){return v==='favor'?'Повышенная удача':v==='challenge'?'Пониженная удача':'Нормальный'}
function renderAdminV71(){window.JRVXAdminV270?.refresh?.()}
// Mode lookup for Blackjack / Roulette uses selected profile's admin setting.
try{currentCasinoAdminMode=function(){const p=currentProfile(),r=registry().find(x=>String(x.id)===String(p.playerId));const m=r?.luckMode||r?.testMode||window.arcadeNetState?.luckMode||'normal';return ['favor','normal','challenge'].includes(m)?m:'normal'};setCasinoAdminMode=function(m){return currentCasinoAdminMode()}}catch{}
// Profile tab routes.
document.querySelectorAll('[data-v70-tab]').forEach(b=>{const old=b.onclick;b.onclick=()=>{document.querySelectorAll('[data-v70-tab]').forEach(x=>x.classList.toggle('active',x===b));document.querySelectorAll('[data-v70-pane]').forEach(x=>x.classList.toggle('active',x.dataset.v70Pane===b.dataset.v70Tab));syncProfileReadOnly();if(b.dataset.v70Tab==='admin')renderAdminV71();else old?.call(b)}});
['v69ProfileTop','v69ProfileBtn'].forEach(id=>{const b=$(id);if(b)b.onclick=()=>{refreshProfileIcon();syncProfileReadOnly();profile?.classList.add('active')}});if($('v70ProfileClose'))$('v70ProfileClose').onclick=()=>profile?.classList.remove('active');

// Keep visible bet readouts synchronized immediately with chip/input selection.
function v71SyncBlackjackBet(pop=false){
  const input=$('bjBetInput');if(!input)return;const n=Math.max(0,Math.floor(Number(input.value)||0)),cur=activeCur();
  const txt=`${fmt(n)} ${cur}`;if($('bjCurrentBet'))$('bjCurrentBet').textContent=txt;if($('v68SelectedBetValue'))$('v68SelectedBetValue').textContent=txt;
  const label=document.querySelector('#blackjack .v66BetLabel strong');if(label)label.textContent=`Ставка: ${txt}`;
  document.querySelectorAll('#blackjack [data-bj-bet]').forEach(x=>x.classList.toggle('active',Number(x.dataset.bjBet)===n));
  if(pop){const a=document.querySelector(`#blackjack [data-bj-bet="${n}"]`);if(a){a.classList.remove('v68-chip-pop');void a.offsetWidth;a.classList.add('v68-chip-pop');setTimeout(()=>a.classList.remove('v68-chip-pop'),460)}}
}
function v71SyncRouletteBet(){
  const input=$('rouletteBetInput');if(!input)return;const n=Math.max(0,Math.floor(Number(input.value)||0)),cur=activeCur();
  if($('v66RouletteBetLive'))$('v66RouletteBetLive').textContent=`${fmt(n)} ${cur}`;
  document.querySelectorAll('#roulette [data-r-bet]').forEach(x=>x.classList.toggle('active',Number(x.dataset.rBet)===n));
}
document.querySelectorAll('#blackjack [data-bj-bet]').forEach(b=>b.addEventListener('click',()=>setTimeout(()=>v71SyncBlackjackBet(true),0)));
$('bjBetInput')?.addEventListener('input',()=>v71SyncBlackjackBet(false));
document.querySelectorAll('#roulette [data-r-bet]').forEach(b=>b.addEventListener('click',()=>setTimeout(v71SyncRouletteBet,0)));
$('rouletteBetInput')?.addEventListener('input',v71SyncRouletteBet);
setTimeout(()=>{v71SyncBlackjackBet(false);v71SyncRouletteBet()},0);

// Never let legacy profile/menu reopen. Capture exit routes from all three games.

// v92: legacy Poker exit rewiring removed; v91 route-manager is the sole owner.
const heroP=$('v69Home')?.querySelector('.v69HeroCard p');if(heroP)heroP.textContent='Главное меню JRVX CAS: столы, JRVX, приватные игры, Roulette, Blackjack, турниры, профиль и JRVX CAS в одном лобби.';
const homeHead=$('v69Home')?.querySelector('.v69Kicker');if(homeHead)homeHead.textContent='JRVX CAS • JRVX CAS';
refreshProfileIcon();syncProfileReadOnly();sanitizeAll();closeLegacyLayers();
document.addEventListener('visibilitychange',()=>{if(!document.hidden)refreshProfileIcon()},{passive:true});
})();
