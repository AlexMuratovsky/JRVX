(function(){
'use strict';
const VERSION='3.0.17',LEGACY_QUEUE_KEY='jrvxCasProgressQueueV260',QUEUE_PREFIX='jrvxCasProgressQueueV301:';
const $=id=>document.getElementById(id),esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let state=null,lastLevel=0,lastAchievements=new Set(),installed=false,seq=0,owner='',flushTimer=0;
function toast(title,text,icon='◆'){try{window.showArcadeToast?.(title,text,icon,3500)}catch{}}
function connected(){return !!window.arcadeNetState?.connected&&typeof window.arcadeNetSend==='function'}
function authState(){try{return window.JRVXCASIdentityV300?.state?.()||null}catch{return null}}
function queueOwner(){const auth=authState();if(auth?.requiresAuthentication)return auth.authenticated?String(auth.user?.id||''):'';return 'development'}
function queueKey(id=queueOwner()){return id?QUEUE_PREFIX+encodeURIComponent(id):''}
function queueLoad(id=queueOwner()){const key=queueKey(id);if(!key)return[];try{const x=JSON.parse(localStorage.getItem(key)||'[]');return Array.isArray(x)?x.slice(-50):[]}catch{return[]}}
function queueSave(q,id=queueOwner()){const key=queueKey(id);if(!key)return;try{localStorage.setItem(key,JSON.stringify(q.slice(-50)))}catch{}}
function discardLegacyQueue(){try{localStorage.removeItem(LEGACY_QUEUE_KEY)}catch{}}
function newId(){try{return crypto.randomUUID()}catch{return `${Date.now().toString(36)}-${(++seq).toString(36)}-${Math.random().toString(36).slice(2,7)}`}}
function trySend(payload){try{return window.arcadeNetSend?.(payload)===true}catch{return false}}
function sendEvent(event,data={}){const ownerId=queueOwner();if(!ownerId)return false;const payload={type:'progress_event',event:String(event),eventId:newId(),ownerId,data:data&&typeof data==='object'?data:{}};if(connected()&&trySend(payload))return true;const q=queueLoad(ownerId);q.push(payload);queueSave(q,ownerId);if(connected())flushQueue();return false}
function flushQueue(){const ownerId=queueOwner();if(!ownerId||!connected()||flushTimer)return;const step=()=>{flushTimer=0;if(queueOwner()!==ownerId||!connected())return;const q=queueLoad(ownerId).filter(x=>x&&x.ownerId===ownerId);if(!q.length){queueSave([],ownerId);return}const [next,...rest]=q;if(!trySend(next)){flushTimer=setTimeout(step,1000);return}queueSave(rest,ownerId);if(rest.length)flushTimer=setTimeout(step,125)};step()}
function request(){if(connected())window.arcadeNetSend({type:'progress_get'})}
function claim(id){if(!connected())return toast('Прогресс','Для получения серверной награды требуется SERVER LINK.','!');window.arcadeNetSend({type:'progress_claim_daily',missionId:String(id||'')})}
function setVersion(){document.documentElement.dataset.jrvxVersion=VERSION;const title=document.querySelector('#v69Home .v69HeroCard h1');if(document.title.includes('JRVX CAS'))document.title=`JRVX CAS v${VERSION}`;const card=document.querySelector('[data-update-version],#v139Version');if(card&&/v2\.[0-9.]+/i.test(card.textContent||''))card.textContent=`v${VERSION}`}
function ensureUI(){
 const profile=$('v69Profile');if(!profile)return;
 const tabs=profile.querySelector('.v70ProfileTabs');if(tabs&&!tabs.querySelector('[data-v70-tab="progress"]')){const b=document.createElement('button');b.className='v70ProfileTab';b.dataset.v70Tab='progress';b.textContent='Прогресс';const friends=tabs.querySelector('[data-v70-tab="friends"]');tabs.insertBefore(b,friends||null)}
 const card=profile.querySelector('.v69ModalCard');if(card&&!profile.querySelector('[data-v70-pane="progress"]')){const pane=document.createElement('section');pane.className='v70ProfilePane v260ProgressPane';pane.dataset.v70Pane='progress';pane.innerHTML=`
  <div class="v260Hero"><div><span>JRVX CAS PROGRESSION</span><strong id="v260Rank">ROOKIE</strong><small id="v260Streak">Серия: 1 день</small></div><div class="v260Level"><b id="v260Level">LVL 1</b><span id="v260XpText">0 / 250 XP</span></div></div>
  <div class="v260Xp"><i id="v260XpFill"></i></div>
  <div class="v260StatGrid" id="v260StatGrid"></div>
  <div class="v260SectionHead"><div><span>DAILY</span><strong>Задания дня</strong></div><small id="v260DailyDate">—</small></div>
  <div class="v260Daily" id="v260Daily"></div>
  <div class="v260SectionHead"><div><span>ACHIEVEMENTS</span><strong>Достижения</strong></div><small id="v260AchievementCount">0 / 0</small></div>
  <div class="v260Achievements" id="v260Achievements"></div>`;const admin=profile.querySelector('[data-v70-pane="admin"]');card.insertBefore(pane,admin||null)}
 if(!profile.__v260Tabs){profile.__v260Tabs=true;profile.addEventListener('click',e=>{const t=e.target.closest?.('[data-v70-tab]');if(!t)return;const key=t.dataset.v70Tab;profile.querySelectorAll('[data-v70-tab]').forEach(x=>x.classList.toggle('active',x===t));profile.querySelectorAll('[data-v70-pane]').forEach(x=>x.classList.toggle('active',x.dataset.v70Pane===key));if(key==='progress')request()});}
 const hero=profile.querySelector('.v70ProfileHero>div:first-child');if(hero&&!$('v260HeroBadge')){const d=document.createElement('div');d.id='v260HeroBadge';d.className='v260HeroBadge';d.innerHTML='<b>LVL 1</b><span>ROOKIE</span>';hero.appendChild(d)}
 render();
}
function fmt(n){return Math.trunc(Number(n)||0).toLocaleString('ru-RU')}
const money=n=>{try{return window.JRVXCASMoneyV330.formatCompact(n??0)}catch{return '—'}};

function pct(n,d){return d?Math.round((Number(n)||0)/(Number(d)||1)*100):0}
function clearUI(){const rank=$('v260Rank'),level=$('v260Level'),xp=$('v260XpText'),fill=$('v260XpFill'),streak=$('v260Streak'),date=$('v260DailyDate'),grid=$('v260StatGrid'),daily=$('v260Daily'),count=$('v260AchievementCount'),ach=$('v260Achievements'),badge=$('v260HeroBadge');if(rank)rank.textContent='ROOKIE';if(level)level.textContent='LVL 1';if(xp)xp.textContent='0 / 250 XP';if(fill)fill.style.width='0%';if(streak)streak.textContent='Серия: 0 дн.';if(date)date.textContent='—';if(grid)grid.innerHTML='';if(daily)daily.innerHTML='';if(count)count.textContent='0 / 0';if(ach)ach.innerHTML='';if(badge)badge.innerHTML='<b>LVL 1</b><span>ROOKIE</span>'}
function reset(reason='identity'){clearTimeout(flushTimer);flushTimer=0;state=null;lastLevel=0;lastAchievements=new Set();window.JRVXProgress.state=null;clearUI();return reason}
function syncOwner(){const next=queueOwner();if(next===owner)return false;owner=next;reset('owner-change');return true}
function render(){if(!state)return;ensureBasic();const s=state,st=s.streak||{},stats=s.stats||{},p=stats.poker||{},b=stats.blackjack||{},r=stats.roulette||{};
 if($('v260Rank'))$('v260Rank').textContent=s.rank||'ROOKIE';if($('v260Level'))$('v260Level').textContent=`LVL ${s.level||1}`;if($('v260XpText'))$('v260XpText').textContent=`${fmt(s.xpCurrent)} / ${fmt(s.xpNeed)} XP`;if($('v260XpFill'))$('v260XpFill').style.width=`${Math.max(0,Math.min(100,Number(s.xpPct)||0))}%`;if($('v260Streak'))$('v260Streak').textContent=`Серия: ${st.current||0} дн. · рекорд ${st.best||0}`;if($('v260DailyDate'))$('v260DailyDate').textContent=s.dailyDate||'сегодня';
 const badge=$('v260HeroBadge');if(badge)badge.innerHTML=`<b>LVL ${s.level||1}</b><span>${esc(s.rank||'ROOKIE')}</span>`;
 const grid=$('v260StatGrid');if(grid)grid.innerHTML=`
  <article><span>POKER</span><strong>${fmt(p.wins)} / ${fmt(p.hands)}</strong><small>победы / раздачи · WR ${pct(p.wins,p.hands)}%</small><em>MG с обновления · лучший банк ${money(p.biggestPot)}</em></article>
  <article><span>BLACKJACK</span><strong>${fmt(b.wins)} / ${fmt(b.hands)}</strong><small>победы / руки · WR ${pct(b.wins,b.hands)}%</small><em>MG с обновления · лучший +${money(b.biggestWin)} · Natural ${fmt(b.naturals)}</em></article>
  <article><span>ROULETTE</span><strong>${fmt(r.wins)} / ${fmt(r.spins)}</strong><small>победы / вращения · WR ${pct(r.wins,r.spins)}%</small><em>MG с обновления · лучший +${money(r.biggestWin)} · Straight ${fmt(r.straightWins)}</em></article>`;
 const daily=$('v260Daily');if(daily)daily.innerHTML=(s.daily||[]).map(m=>{const pr=Math.min(100,pct(m.value,m.goal));return `<article class="${m.claimed?'claimed':m.ready?'ready':''}"><div><strong>${esc(m.name)}</strong><small>+${fmt(m.rewardXp)} XP${m.rewardMg?` · +${fmt(m.rewardMg)} MG`:''}</small></div><p>${esc(m.desc)}</p><div class="v260MissionBar"><i style="width:${pr}%"></i></div><footer><span>${fmt(m.value)} / ${fmt(m.goal)}</span><button class="v69Btn ${m.ready?'primary':''}" data-v260-claim="${esc(m.id)}" ${m.ready?'': 'disabled'}>${m.claimed?'Получено':m.ready?'Забрать':'В процессе'}</button></footer></article>`}).join('');daily?.querySelectorAll('[data-v260-claim]').forEach(x=>x.onclick=()=>claim(x.dataset.v260Claim));
 if($('v260AchievementCount'))$('v260AchievementCount').textContent=`${s.achievementCount||0} / ${s.achievementTotal||0}`;const ag=$('v260Achievements');if(ag)ag.innerHTML=(s.achievements||[]).map(a=>`<article class="${a.unlocked?'unlocked':'locked'}"><i>${esc(a.icon)}</i><div><strong>${esc(a.name)}</strong><span>${esc(a.unlocked?'Получено':a.desc)}</span></div></article>`).join('');
}
function ensureBasic(){const profile=$('v69Profile');if(!profile)return;const pane=profile.querySelector('[data-v70-pane="progress"]');if(!pane)ensureUI()}
function applyProgress(p,reason='sync'){if(!p||typeof p!=='object'||!queueOwner())return;const prevLevel=state?.level||lastLevel||0,prevAch=new Set((state?.achievements||[]).filter(x=>x.unlocked).map(x=>x.id));state=p;render();if(prevLevel&&p.level>prevLevel)toast(`Уровень ${p.level}`,`${p.rank} · новый уровень JRVX CAS`,'▲');const nowAch=(p.achievements||[]).filter(x=>x.unlocked);for(const a of nowAch)if(prevAch.size&&!prevAch.has(a.id))toast('Достижение открыто',a.name,a.icon||'◆');lastLevel=p.level||lastLevel;lastAchievements=new Set(nowAch.map(x=>x.id));window.JRVXProgress.state=state}
function installHandler(){const prev=window.handleArcadeNetMessage;if(typeof prev!=='function'||prev.__v260Progress)return;const wrapped=function(msg){const out=prev.apply(this,arguments);if(window.JRVXCASIdentityV300?.state?.().requiresAuthentication&&['hello_ack','progress_state'].includes(msg?.type)){window.JRVXCASServerAccount?.apply?.(msg);if(msg?.type==='hello_ack')setTimeout(flushQueue,60);return out}if(msg?.type==='hello_ack'){if(msg.progress)applyProgress(msg.progress,'hello');setTimeout(flushQueue,60)}if(msg?.type==='progress_state')applyProgress(msg.progress,msg.reason);if(msg?.type==='progress_reward')toast('Задание выполнено',`+${fmt(msg.rewardXp)} XP · +${fmt(msg.rewardMg)} MG`,'✓');if(msg?.type==='progress_error')toast('Прогресс',msg.message||'Операция недоступна','!');return out};wrapped.__v260Progress=true;wrapped.__base=prev;window.handleArcadeNetMessage=wrapped}
function bind(){if(installed)return;installed=true;discardLegacyQueue();syncOwner();setVersion();ensureUI();installHandler();document.addEventListener('jrvx-cas-identity',()=>{const changed=syncOwner();if(queueOwner()&&connected()){request();if(changed)setTimeout(flushQueue,80)}});document.addEventListener('click',e=>{if(e.target.closest?.('#v69ProfileOpen,[data-open-profile],#profileOpenBtn'))setTimeout(()=>{ensureUI();request()},80)},{passive:true});[250,900,2200,5200].forEach(ms=>setTimeout(()=>{setVersion();ensureUI();installHandler();if(ms===900)request()},ms));window.addEventListener('online',()=>setTimeout(()=>{flushQueue();request()},250),{passive:true})}
window.JRVXProgress={version:VERSION,state,event:sendEvent,request,claim,flush:flushQueue,apply:applyProgress,reset,queueOwner};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',bind,{once:true});else bind();
})();
