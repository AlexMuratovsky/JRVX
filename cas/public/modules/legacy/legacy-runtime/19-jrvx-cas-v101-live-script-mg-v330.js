(function(){
'use strict';
const $=id=>document.getElementById(id), q=(s,r=document)=>r?.querySelector?.(s)||null, qa=(s,r=document)=>r?[...r.querySelectorAll(s)]:[];
function patchModes(){
 const cards=qa('.v83Card');
 const data=[
  ['Играть с JRVX','Выберите стол и сыграйте heads-up один на один против JRVX.'],
  ['Частная игра','Закрытый стол с другом на MG.'],
  ['Roulette','Европейское колесо, быстрые ставки и аккуратный игровой стол.'],
  ['Blackjack','Классический 21 с читаемыми картами и выбранной валютой.'],
  ['Турниры','Сезоны, лидерборд и специальные события JRVX CAS.']
 ];
 cards.forEach((c,i)=>{if(!data[i])return; const h=q('h4',c),p=q('p',c); if(h)h.textContent=data[i][0]; if(p)p.textContent=data[i][1];});
 const j=q('.v83Card.mode-jvrx .v83VisualJx'); if(j&&!q('svg',j)&&!q('.v101Table',j))j.innerHTML='<div class="v101Table"></div><div class="v101Jx">JX</div><div class="v101Cards"><i>A♠</i><i>K♥</i></div>';
 const dealer=q('.v83Dealer'); if(dealer)dealer.innerHTML='<span>JX</span>';
 const pv=q('.v83PeopleVisual'); if(pv&&!q('.v101Community',pv)){const d=document.createElement('div');d.className='v101Community';d.innerHTML='<i>A♠</i><i>K♥</i><i>Q♣</i>';pv.appendChild(d)}
}
function patchCopy(){
 const heroP=q('.v74HeroCopy p'); if(heroP)heroP.textContent='Выберите стол и формат игры на MG. Для быстрой партии можно сразу начать heads-up против JRVX.';
 const head=q('#v83ModesHub .v83Header p'); if(head)head.textContent='Публичные комнаты и отдельные режимы.';
 const peopleP=q('#v83ModesHub .v83People p'); if(peopleP)peopleP.textContent='Выберите Mura Gold, Hold’em / Omaha и подходящий стол.';
 const dock=$('v76Dock'); if(dock){dock.classList.add('show'); const eventBtn=q('[data-a="events"] span',dock); if(eventBtn)eventBtn.textContent='События';}
 const logoSpan=q('.v69LogoText span'); if(logoSpan)logoSpan.textContent='JRVX CAS';
}
function patchFeed(){
 const sc=q('.v69Scroller'); if(sc&&!q('.v101UpdateCard',sc)){
   const c=document.createElement('article');c.className='v69Mini v101UpdateCard';c.innerHTML='<div class="v69MiniTop"><em>Последнее обновление • v3.0.5</em><div class="v69MiniIcon">↑</div></div><b>Последнее обновление, версия v3.0.5</b><p>Стабильность Poker, точный таймер хода, оптимизация анимаций, исправлены валютные переключатели Blackjack/Roulette и интерфейсные конфликты.</p><button class="v69Btn" type="button" style="margin-top:12px">Подробнее</button>'; sc.appendChild(c);
 }
 const academy=q('.v69Scroller .v69Mini:not(.v101UpdateCard)'); if(academy&&!q('.v69Btn',academy)){const b=document.createElement('button');b.className='v69Btn';b.type='button';b.textContent='Полные правила';b.style.marginTop='12px';b.onclick=e=>{e.stopPropagation();try{window.v76OpenAcademy?.()}catch{}};academy.appendChild(b)}
 const newsTime=q('#v71NewsCard .v71NewsTime'); if(newsTime)newsTime.textContent='Следующая: 13:00';
}
function patchProfileCard(){
 const dash=$('v69DashName'), id=$('v69DashId');
 if(dash && (dash.textContent.trim()==='Игрок'||!dash.textContent.trim())) dash.textContent='nezhhnno';
 if(id && (!id.textContent.includes('JRVX-'))) id.textContent='JRVX-JRVX11101111';
 const card=dash?.closest('.v69Dash'); if(card && !q('.v101OwnerBadge',card)){const row=dash.closest('.v69DashLine'); const badge=document.createElement('span');badge.className='v101OwnerBadge';badge.textContent='Владелец';row?.appendChild(badge)}
 const you=$('v69LeaderboardYou'); if(you && (you.textContent.trim()==='Игрок'||you.textContent.trim()==='Вы'))you.textContent=dash?.textContent||'nezhhnno';
}
function patchDaily(){
 const state=$('v69DailyState'); if(state&&state.textContent.trim()==='Получено')state.classList.add('claimed');
 const txt=$('v69DailyText'); if(state?.textContent.trim()==='Получено'&&txt&&!/следующая/i.test(txt.textContent))txt.textContent='Получено сегодня • следующая награда через 23:59:59';
 const rail=$('v72DailyState'); if(rail&&state?.textContent.trim()==='Получено'&&!/Следующая/i.test(rail.textContent))rail.textContent='Следующая через 23:59:59';
}
function patchTopClose(){
 const ta=q('.v69TopActions'); if(!ta||ta.dataset.v101CloseBound==='1')return; ta.dataset.v101CloseBound='1'; ta.addEventListener('click',e=>{const r=ta.getBoundingClientRect(); if(e.clientX>r.right-48){try{document.body.style.opacity='.15';setTimeout(()=>document.body.style.opacity='',180)}catch{}}});
}
function patchPoker(){
 const app=$('poker59App'); if(!app)return;
 const start=$('p59Start'); if(start){const update=()=>{const hand=Number(q('#p59HandNo')?.textContent?.match(/\d+/)?.[0]||0); const active=app.classList.contains('hand-active')||!!q('.p59Card:not(.v84CardHidden)',q('.p59HeroCards')); if(active||hand>0)start.style.display='none'; else start.style.display='';}; update();}
 const bet=$('p59Bet'); if(bet){bet.inputMode='numeric';bet.setAttribute('aria-label','Сумма рейза');}
}
function apply(){patchCopy();patchModes();patchFeed();patchProfileCard();patchDaily();patchTopClose();patchPoker();}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>{apply();setTimeout(apply,80);setTimeout(apply,500)},{once:true});else{apply();setTimeout(apply,80);setTimeout(apply,500)}
})();
