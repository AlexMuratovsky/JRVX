(function(){
'use strict';
const q=(s,r=document)=>r?.querySelector?.(s)||null,qa=(s,r=document)=>r?[...r.querySelectorAll(s)]:[];
const ROOMS=[
 ['Royal Ace',1,2,20,'Мягкий старт и быстрый heads-up.','A♠','K♥','#c28b43'],
 ['Mura King',2,4,40,'Спокойный регулярный стол.','Q♣','Q♥','#d0a246'],
 ['Neon River',5,10,100,'Живой темп и заметный рост банка.','J♠','10♥','#b9853d'],
 ['Velvet Storm',10,20,200,'Средний лимит для серьёзной дуэли.','A♦','A♣','#c89544'],
 ['Obsidian Pro',25,50,500,'Глубокие стеки и агрессивная игра.','K♠','Q♠','#c99641'],
 ['Royal Crown',50,100,1000,'Высокие ставки и быстрые решения.','A♥','K♣','#d2a448'],
 ['Imperial X',100,200,2000,'Максимальный лимит JRVX CAS.','A♠','Q♣','#e0b458']
];
function activeCurrency(){return 'MG'}
function activeVariant(){return q('.v69VariantToggle [data-variant].active')?.dataset.variant==='omaha'?'Omaha':'Texas Hold’em'}
function roomMarkup(r,i){const cur=activeCurrency(),variant=activeVariant(),red=/[♥♦]/;return `<div class="v69TableSlide"><article class="v69TableCard v133RoomCard" data-v133-room="${i}" style="--tA:#081326;--tB:#050b14;--tGlow:rgba(61,173,139,.14);--tBorder:rgba(111,132,175,.34);--roomRail:${r[7]}"><div class="v133RoomCopy"><div><div class="v69TableName">${variant.toUpperCase()} • JRVX CAS</div><h3>${r[0]}</h3><p>${r[4]}</p><div class="v133RoomMeta"><span>${variant==='Omaha'?'4 hole cards':'2 hole cards'}</span><span>Блайнды ${r[1]} / ${r[2]}</span><span>${cur}</span></div></div><div class="v133RoomBlind">Минимальный вход ${r[3].toLocaleString('ru-RU')} ${cur}</div></div><div class="v133RoomScene"><div class="v133RoomDealer">JX</div><div class="v133RoomFelt"></div><div class="v133RoomCards"><div class="v133RoomCardFace ${red.test(r[5])?'red':''}">${r[5]}</div><div class="v133RoomCardFace ${red.test(r[6])?'red':''}">${r[6]}</div></div><div class="v133RoomChips"><div class="v133RoomChip mg">MG</div></div></div></article></div>`}
function currentRoomIndex(){const m=(q('#v69TableCounter')?.textContent||'1').match(/\d+/);return Math.max(0,Math.min(ROOMS.length-1,(Number(m?.[0])||1)-1))}
function ensureRooms(){
 const step=q('#v69TableStep'),track=q('#v69TableTrack');if(!step||step.hidden||!track)return;
 const cur=activeCurrency(),variant=activeVariant(),sig=`${cur}|${variant}`;
 if(track.dataset.v133Sig!==sig||qa(':scope > .v69TableSlide',track).length!==ROOMS.length||!q('.v133RoomCard',track)){
   const idx=currentRoomIndex();track.innerHTML=ROOMS.map(roomMarkup).join('');track.dataset.v133Sig=sig;track.dataset.v105Variant=variant==='Omaha'?'omaha':'holdem';track.dataset.v105Currency=cur;track.style.transform=`translateX(-${idx*100}%)`;
 }
 track.style.visibility='visible';track.style.opacity='1';
 qa(':scope > .v69TableSlide',track).forEach(x=>{x.style.visibility='visible';x.style.opacity='1'});
}
function syncRoomsAfterNav(){setTimeout(()=>{ensureRooms();const track=q('#v69TableTrack'),idx=currentRoomIndex();if(track)track.style.transform=`translateX(-${idx*100}%)`},0)}

function moveWinningLabel(){const table=q('#p59Table'),win=q('#p61WinningCombo');if(table&&win&&win.parentElement!==table)table.appendChild(win)}
function syncRaise(){const bet=q('#p59Bet'),raise=q('#p59Raise');if(!bet||!raise)return;const val=Math.max(0,Math.floor(Number(bet.value)||0)),unit='MG';const label=`РЕЙЗ · ${val} ${unit}`;if(raise.textContent!==label)raise.textContent=label}
function syncComboText(){const b=q('.v122ComboBadge');if(!b)return;const t=(b.textContent||'').replace(/^КОМБИНАЦИЯ\s*[•:]?\s*/i,'').replace(/^Комбинация:\s*/i,'').trim();const next=t?t.toUpperCase():'';if(next&&b.textContent!==next)b.textContent=next}
function blackjackUnit(){return 'MG'}
function syncBlackjack(){
 const table=q('#blackjack .v66BlackjackTable'),consoleEl=q('#blackjack .v66BetConsole'),input=q('#bjBetInput');if(!table||!consoleEl||!input)return;
 let read=q('.v133BjBetReadout',consoleEl);if(!read){read=document.createElement('div');read.className='v133BjBetReadout';read.innerHTML='<small>ТЕКУЩАЯ СТАВКА</small><strong></strong>';const label=q('.v66BetLabel',consoleEl);label?.insertAdjacentElement('afterend',read)}
 const amount=Math.max(0,Math.floor(Number(input.value)||0)),strong=q('strong',read),txt=`${amount.toLocaleString('ru-RU')} ${blackjackUnit()}`;if(strong&&strong.textContent!==txt)strong.textContent=txt;
 const label=q('.v66BetLabel',consoleEl);if(label){const over=q('span',label),desc=q('strong',label);if(over)over.textContent='СТАВКА';if(desc)desc.textContent='Выберите фишки'}
 const msg=q('#bjMessage');if(msg&&!q('#playerCards')?.children.length&&/ставк|раздач/i.test(msg.textContent||''))msg.textContent='Выберите ставку и начните раздачу.';
 const rule=q('.v66BlackjackRule',table);if(rule){const spans=qa('span',rule);if(spans[0])spans[0].textContent='BLACKJACK ПЛАТИТ 3:2';if(spans[1])spans[1].textContent='ДИЛЕР СТОИТ НА 17'}
}
function frame(){moveWinningLabel();syncRaise();syncComboText();syncBlackjack();ensureRooms()}

// Table rooms are event-driven; no new polling loop.
['v69PrevTable','v69NextTable','v69ChangeCurrency'].forEach(id=>q('#'+id)?.addEventListener('click',syncRoomsAfterNav));
document.addEventListener('click',e=>{if(e.target.closest?.('.v69CurrencyCard,.v69VariantToggle [data-variant],#v69Tables,#v69QuickPlay,#v69EnterTable'))syncRoomsAfterNav();if(e.target.closest?.('[data-bj-bet],#bjDeal,#bjHit,#bjStand,#bjDouble'))setTimeout(syncBlackjack,0)},{passive:true});
document.addEventListener('input',e=>{if(e.target?.id==='p59Bet')syncRaise();if(e.target?.id==='bjBetInput')syncBlackjack()},{passive:true});
document.addEventListener('change',e=>{if(e.target?.id==='p59Bet')syncRaise();if(e.target?.id==='bjBetInput')syncBlackjack()},{passive:true});
const tableStep=q('#v69TableStep');if(tableStep&&!tableStep.__v133Obs){const mo=new MutationObserver(()=>{if(!tableStep.hidden)requestAnimationFrame(ensureRooms)});mo.observe(tableStep,{attributes:true,attributeFilter:['hidden']});tableStep.__v133Obs=mo}
const combo=q('.v122ComboBadge');if(combo&&!combo.__v133Obs){const mo=new MutationObserver(syncComboText);mo.observe(combo,{childList:true,subtree:true,characterData:true});combo.__v133Obs=mo}
const timer=q('#p61TurnText');if(timer){timer.setAttribute('aria-live','off')}
addEventListener('pageshow',()=>setTimeout(frame,80),{passive:true});
addEventListener('resize',()=>requestAnimationFrame(frame),{passive:true});
setTimeout(frame,100);setTimeout(frame,500);
})();
