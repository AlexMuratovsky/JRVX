(function(){
'use strict';
const $=(s,r=document)=>r?.querySelector?.(s)||null,$$=(s,r=document)=>r?[...r.querySelectorAll(s)]:[];
const TABLES=[['1-2',1,2,20,'Rookie Room'],['2-4',2,4,40,'Harbor Room'],['5-10',5,10,100,'Sapphire Room'],['10-20',10,20,200,'Violet Room'],['25-50',25,50,500,'Obsidian Room'],['50-100',50,100,1000,'Emerald Crown'],['100-200',100,200,2000,'Imperial Room']];
const LOCAL_RECOVERY='jrvxCasLocalPokerRecoveryV122';
let chooser={currency:'MG',tableId:'1-2'},lastDealKey='',dealTimers=[],bypassJarvisIntercept=false,chooserLaunching=false;
function activeCurrency(){return 'MG'}
function setCurrency(){chooser.currency='MG';window.JRVXCasEconomy?.setCurrency?.('MG');renderChooser()}
function balance(cur){try{return Number(window.JVRXCasEconomy?.balance?.(cur))||0}catch{return 0}}
function tableDef(id){return TABLES.find(t=>t[0]===id)||TABLES[0]}
function ensureChooser(){
 let o=$('.v122JarvisChooser');if(o)return o;o=document.createElement('div');o.className='v122JarvisChooser';o.innerHTML=`<div class="v122ChooserCard"><div class="v122ChooserHead"><div><small>HEADS-UP • JRVX</small><h3>Играть с JRVX</h3><p>Выберите лимит MG перед посадкой за стол.</p></div><button class="v122ChooserClose" type="button">×</button></div><div class="v122ChooserSection"><div class="v122ChooserLabel">Игровая валюта</div><div class="v122CurrencyGrid"><button class="v122Choice" data-v122-cur="MG"><strong>Mura Gold</strong><span id="v122MgBal">0 MG</span></button></div></div><div class="v122ChooserSection"><div class="v122ChooserLabel">Стол</div><div class="v122TableGrid">${TABLES.map(t=>`<button class="v122TableChoice" data-v122-table="${t[0]}"><b>${t[1]} / ${t[2]}</b><small>${t[4]} • min ${t[3]}</small></button>`).join('')}</div></div><div class="v122ChooserNote" id="v122ChooserNote">После подтверждения откроется heads-up стол с JRVX.</div><div class="v122ChooserActions"><button type="button" class="v122Cancel">Отмена</button><button type="button" class="primary v122Start">Перейти за стол</button></div></div>`;document.body.appendChild(o);
 $('.v122ChooserClose',o).onclick=$('.v122Cancel',o).onclick=()=>o.classList.remove('active');
 $$('[data-v122-cur]',o).forEach(b=>b.onclick=()=>setCurrency(b.dataset.v122Cur));
 $$('[data-v122-table]',o).forEach(b=>b.onclick=()=>{chooser.tableId=b.dataset.v122Table;renderChooser()});
 $('.v122Start',o).onclick=launchChosenJarvis;
 return o;
}
function renderChooser(){const o=ensureChooser(),e=window.JVRXCasEconomy?.get?.()||{};$('#v122MgBal',o).textContent=`${window.JRVXCASMoneyV330.formatCompact(Number(e.mg)||0,{currency:false})} MG`;$$('[data-v122-cur]',o).forEach(b=>b.classList.toggle('active',b.dataset.v122Cur===chooser.currency));$$('[data-v122-table]',o).forEach(b=>b.classList.toggle('active',b.dataset.v122Table===chooser.tableId));const t=tableDef(chooser.tableId),bal=balance(chooser.currency),note=$('#v122ChooserNote',o);if(note)note.textContent=bal<t[3]?`На ${t[4]} требуется минимум ${t[3]} ${chooser.currency}. Текущий баланс: ${Math.floor(bal)} ${chooser.currency}.`:`${t[4]} • блайнды ${t[1]}/${t[2]} ${chooser.currency}. После входа нажмите «Начать раздачу».`}
function openChooser(pref={}){chooserLaunching=false;chooser.currency=pref.currency==='MG'?'MG':activeCurrency();chooser.tableId=TABLES.some(t=>t[0]===pref.tableId)?pref.tableId:'1-2';renderChooser();const o=ensureChooser(),start=$('.v122Start',o);if(start){start.disabled=false;start.textContent='Перейти за стол'}o.classList.add('active')}
window.JRVXCASOpenJrvxChooser=openChooser;
function moveTableFlowTo(id){const wanted=TABLES.findIndex(t=>t[0]===id);if(wanted<0)return;let guard=0;const step=()=>{const txt=$('#v69TableCounter')?.textContent||'1 / 7',now=Math.max(0,(parseInt(txt)||1)-1);if(now===wanted||guard++>10)return;$('#v69NextTable')?.click();setTimeout(step,30)};step()}
function launchChosenJarvis(){
 if(chooserLaunching)return;
 const t=tableDef(chooser.tableId),bal=balance(chooser.currency);if(bal<t[3]){const n=$('#v122ChooserNote');if(n)n.textContent=`Недостаточно средств: нужно ${t[3]} ${chooser.currency}.`;return}
 chooserLaunching=true;const start=$('.v122Start');if(start){start.disabled=true;start.textContent='Открываем стол…'}
 localRecoveryBlocked=false;lastLocalRecoverySig='';lastDealKey='';clearDealTimers();
 setCurrency(chooser.currency);ensureChooser().classList.remove('active');
 if(typeof window.JRVXCASLaunchPoker==='function'){window.JRVXCASLaunchPoker('jarvis',chooser.tableId);return}
 window.JRVXRoutes?.openTables?.();
 setTimeout(()=>{$(`.v69CurrencyCard[data-currency="${chooser.currency}"]`)?.click();setTimeout(()=>{moveTableFlowTo(chooser.tableId);setTimeout(()=>$('#v69EnterTable')?.click(),140)},100)},70);
}
// Intercept only explicit JRVX play actions; carousel side cards still rotate normally.
/* v1.3.1: the compact v122 JRVX chooser is retired; v69 illustrated table flow is authoritative. */

function currentState(){try{const p=window.Poker59?.state;if(!p)return window.arcadeNetState?.poker||null;if(p.mode==='jarvis'&&p.game)return p.game.state?.()||null;if(p.server?.you)return p.server;if(p.game)return p.game.state?.()||null;return window.arcadeNetState?.poker||null}catch{return window.arcadeNetState?.poker||null}}
let localRecoveryBlocked=false,lastLocalRecoverySig='';function storeLocalRecovery(force=false){const st=currentState();if(st?.authoritative||window.JRVXCASIdentityV300?.state?.().requiresAuthentication||localRecoveryBlocked||!st?.you||st.mode!=='jarvis')return;const currency=activeCurrency(),tableId=st.tableId||'1-2',stack=Math.max(0,Math.floor(Number(st.you.stack)||0)),handNo=Number(st.handNo)||0,sig=`${currency}|${tableId}|${stack}|${handNo}|${st.street||''}`;if(!force&&sig===lastLocalRecoverySig)return;lastLocalRecoverySig=sig;const snap={at:Date.now(),currency,tableId,stack,handNo};try{sessionStorage.setItem(LOCAL_RECOVERY,JSON.stringify(snap));localStorage.setItem(LOCAL_RECOVERY,JSON.stringify(snap))}catch{}}
function clearLocalRecovery(){lastLocalRecoverySig='';try{sessionStorage.removeItem(LOCAL_RECOVERY);localStorage.removeItem(LOCAL_RECOVERY)}catch{}}
function readLocalRecovery(){let value=null;try{value=JSON.parse(sessionStorage.getItem(LOCAL_RECOVERY)||localStorage.getItem(LOCAL_RECOVERY)||'null')}catch{}return value?.currency==='MG'&&Date.now()-Number(value.at||0)<=1800000?value:null}
function recoverLocalIntent(){
 if(window.JRVXCASIdentityV300?.state?.().mode!=='development'){clearLocalRecovery();return}
 const r=readLocalRecovery();if(!r)return;clearLocalRecovery();let refunded=0;
 try{
  const mark='jrvxCasLocalPokerRefundedV123',last=Number(localStorage.getItem(mark)||0);
  if(Number(r.at||0)>last){
   const amount=Math.max(0,Math.floor(Number(r.stack)||0)),cur='MG',eco=window.JVRXCasEconomy;
   if(amount>0&&eco?.get&&eco?.set){const state=eco.get()||{},key='mg',next={};next[key]=Math.max(0,Math.floor(Number(state[key])||0))+amount;eco.set(next);eco.setCurrency?.(cur);refunded=amount;localStorage.setItem(mark,String(Number(r.at)||Date.now()))}
  }
 }catch{}
 setTimeout(()=>{try{window.JRVXRoutes?.returnHome?.()}catch{};openChooser({currency:r.currency,tableId:r.tableId});const n=$('#v122ChooserNote');if(n)n.textContent=`Предыдущая локальная партия была прервана перезагрузкой.${refunded?` Остаток стека ${refunded} ${r.currency} возвращён на баланс.`:''} Выбран прежний стол ${r.tableId} и ${r.currency}; можно снова войти за стол.`},500)
}
let localExitPersistAt=0;function persistLocalOnExit(){const now=Date.now();if(now-localExitPersistAt<250)return;localExitPersistAt=now;storeLocalRecovery(true)}
addEventListener('beforeunload',persistLocalOnExit,{capture:true});addEventListener('pagehide',persistLocalOnExit,{capture:true});
document.addEventListener('click',e=>{if(e.target.closest?.('#p59Leave,[data-main-menu],#v69TablesBack')){localRecoveryBlocked=true;clearLocalRecovery();lastDealKey='';clearDealTimers()}else if(e.target.closest?.('#p59Join,#v69EnterTable,#v69QuickPlay,.v83Card.mode-jvrx .play')){localRecoveryBlocked=false;lastLocalRecoverySig='';lastDealKey='';clearDealTimers()}},true);

function ensureDealer(){const table=$('#p59Table');if(!table)return null;let d=$('.v122DealerHost',table);if(!d){d=document.createElement('div');d.className='v122DealerHost';d.innerHTML='<div class="v122DealerFace"></div><div class="v122DealerText"><small>DEALER</small><strong>JRVX CAS</strong></div>';table.appendChild(d)}return d}
function ensureComboBadge(){const table=$('#p59Table');if(!table)return null;let b=$('.v122ComboBadge',table);if(!b){b=document.createElement('div');b.className='v122ComboBadge';table.appendChild(b)}return b}
function category5(cards){const rv={'2':2,'3':3,'4':4,'5':5,'6':6,'7':7,'8':8,'9':9,'T':10,'J':11,'Q':12,'K':13,'A':14};const ranks=cards.map(c=>rv[String(c)[0]]||0).sort((a,b)=>a-b),suits=cards.map(c=>String(c)[1]),cnt={};ranks.forEach(r=>cnt[r]=(cnt[r]||0)+1);const groups=Object.values(cnt).sort((a,b)=>b-a),flush=new Set(suits).size===1;let u=[...new Set(ranks)];if(u.includes(14))u=[1,...u];let straight=false,high=0;for(let i=0;i<=u.length-5;i++){if(u.slice(i,i+5).every((v,j)=>j===0||v===u[i]+j)){straight=true;high=u[i]+4}}if(flush&&straight)return[high===14?9:8,high===14?'Роял-флеш':'Стрит-флеш'];if(groups[0]===4)return[7,'Каре'];if(groups[0]===3&&groups[1]===2)return[6,'Фулл-хаус'];if(flush)return[5,'Флеш'];if(straight)return[4,'Стрит'];if(groups[0]===3)return[3,'Сет'];if(groups[0]===2&&groups[1]===2)return[2,'Две пары'];if(groups[0]===2)return[1,'Пара'];return[0,'Старшая карта']}
function bestLabel(cards){cards=(cards||[]).filter(c=>c&&c!=='??');if(cards.length<2)return'Ожидание карт';if(cards.length<5)return'Префлоп';let best=[-1,'Старшая карта'];const n=cards.length;for(let a=0;a<n-4;a++)for(let b=a+1;b<n-3;b++)for(let c=b+1;c<n-2;c++)for(let d=c+1;d<n-1;d++)for(let e=d+1;e<n;e++){const x=category5([cards[a],cards[b],cards[c],cards[d],cards[e]]);if(x[0]>best[0])best=x}return best[1]}
function syncCombo(st){const b=ensureComboBadge();if(!b||!st?.you)return;const cards=[...(st.you.hole||[]),...(st.community||[])];const known=cards.filter(c=>c&&c!=='??').length;const label=known>=2?(st.you.currentHandName||bestLabel(cards)):'';b.textContent=label?String(label).replace(/^Комбинация:\s*/i,'').toUpperCase():''}

function clearDealTimers(){
 dealTimers.forEach(clearTimeout);dealTimers=[];
 $$('.v122DealGhost').forEach(x=>x.remove());
 $('#poker59App')?.classList.remove('v122-dealing');
 $$('.v122-card-revealed').forEach(x=>x.classList.remove('v122-card-revealed'))
}
function dealTargets122(){
 const hero=$('#p59HeroCards'),heroCards=hero?$$('.p59Card',hero):[];
 const oppSeats=$$('#poker59App .p59Seat:not(.me)').filter(s=>s.offsetParent!==null);
 const oppCards=oppSeats.map(s=>$$('.p62SeatCards .p59Card',s));
 const rounds=[];
 const maxCards=Math.max(heroCards.length,...oppCards.map(x=>x.length),0);
 for(let cardNo=0;cardNo<Math.min(2,maxCards);cardNo++){
   oppCards.forEach(cards=>{if(cards[cardNo])rounds.push(cards[cardNo])});
   if(heroCards[cardNo])rounds.push(heroCards[cardNo]);
 }
 return rounds
}
function animateDeal122(st){
 const app=$('#poker59App'),dealer=ensureDealer(),hero=$('#p59HeroCards');
 if(!app||!dealer||!hero||!st?.you)return;
 const hole=(st.you.hole||[]).filter(c=>c&&c!=='??');
 if(st.street!=='preflop'||hole.length<2||!st.handNo)return;
 const key=`${st.mode}|${st.tableId}|${st.handNo}`;
 if(key===lastDealKey)return;
 lastDealKey=key;clearDealTimers();app.classList.add('v122-dealing');
 const dr=dealer.getBoundingClientRect(),source={x:dr.left+dr.width/2,y:dr.top+dr.height/2};
 const targets=dealTargets122();
 if(!targets.length){app.classList.remove('v122-dealing');return}
 const step=Math.max(105,Math.min(180,900/Math.max(1,targets.length)));
 targets.forEach((card,i)=>{
   const delay=70+i*step;
   const timer=setTimeout(()=>{
     if(!document.body.contains(card)||!app.classList.contains('seated'))return;
     const r=card.getBoundingClientRect(),g=document.createElement('div');
     g.className='v122DealGhost';g.style.left=source.x+'px';g.style.top=source.y+'px';document.body.appendChild(g);
     requestAnimationFrame(()=>requestAnimationFrame(()=>{
       if(!g.isConnected)return;g.style.left=(r.left+r.width/2)+'px';g.style.top=(r.top+r.height/2)+'px';g.style.transform=`translate(-50%,-50%) rotate(${i%2?-5:5}deg)`
     }));
     const arrive=setTimeout(()=>{if(card.isConnected)card.classList.add('v122-card-revealed');g.style.opacity='0';setTimeout(()=>g.remove(),160)},360);
     dealTimers.push(arrive)
   },delay);
   dealTimers.push(timer)
 });
 const finish=setTimeout(()=>{app.classList.remove('v122-dealing');$$('.v122-card-revealed',app).forEach(x=>x.classList.remove('v122-card-revealed'));$$('.v122DealGhost').forEach(x=>x.remove());dealTimers=[]},70+targets.length*step+500);
 dealTimers.push(finish)
}
function syncPoker(st){if(!st)return;ensureDealer();syncCombo(st);animateDeal122(st)}

function installHelpContent(){const d=$('.v120PokerHelp');if(!d)return;const head=$('.v120PokerHelpHead h3',d);if(head)head.textContent='Комбинации Poker';if(!$('.v122HelpTip',d)){const tip=document.createElement('div');tip.className='v122HelpTip';tip.style.cssText='margin:0 0 12px;padding:10px 11px;border-radius:13px;border:1px solid rgba(255,255,255,.06);background:rgba(255,255,255,.025);color:#91a4b5;font-size:10px;line-height:1.45';tip.textContent='Комбинация составляется из лучших пяти карт среди Ваших карт и общего board.';$('.v120ComboList',d)?.before(tip)}}

async function syncIdentity(){if(!/^https?:$/.test(location.protocol))return;let u=null;for(const url of ['/auth/me']){try{const r=await fetch(url,{credentials:'include',cache:'no-store',headers:{accept:'application/json'}});if(!r.ok)continue;const j=await r.json();u=j?.user||(j?.authenticated?j:null);if(u)break}catch{}}if(!u)return;const name=u?.profile?.display_name||u.display_name||u.username||u.nickname||'Игрок',jid=String(u.jrvx_id||u.jrvxId||u.id||u.sub||'').trim();if(!jid)return;['#v109ProfileId','#v71ProfileId','#v69ProfileId','#v70ProfileHeroId','#profileArcadeId','#profileHeroId','#v69DashId'].forEach(s=>{const e=$(s);if(e)e.textContent=(/^ID\s/i.test(e.textContent||'')?'ID ':'')+jid});try{if(typeof playerProfile!=='undefined'&&playerProfile){playerProfile.playerId=jid;if(name)playerProfile.nickname=name;if(typeof savePlayerProfile==='function')savePlayerProfile()}}catch{}}
document.addEventListener('click',e=>{if(e.target.closest?.('#v109ProfileButton,#v69ProfileTop,#v69ProfileBtn'))setTimeout(()=>{try{window.__jrvxV120Refresh?.()}catch{}},0)},true);

function frame(){const st=currentState();if(st?.you){syncPoker(st);if(st.mode==='jarvis')storeLocalRecovery()}installHelpContent()}
window.__jrvxV122Frame=frame;
document.addEventListener('visibilitychange',()=>{if(document.hidden)clearDealTimers();else setTimeout(frame,80)},{passive:true});
addEventListener('pagehide',()=>clearDealTimers(),{passive:true});
function boot(){ensureChooser();ensureDealer();ensureComboBadge();installHelpContent();setTimeout(recoverLocalIntent,260)}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
addEventListener('pageshow',()=>{setTimeout(()=>{try{window.__jrvxV120Refresh?.()}catch{};frame()},120)},{passive:true});
})();
