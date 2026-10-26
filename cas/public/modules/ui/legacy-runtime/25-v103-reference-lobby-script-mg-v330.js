(function(){
'use strict';
const $=id=>document.getElementById(id), q=(s,r=document)=>r?.querySelector?.(s)||null, qa=(s,r=document)=>r?[...r.querySelectorAll(s)]:[];
function info(title,html){const t=$('v69InfoTitle'),b=$('v69InfoBody');if(t)t.textContent=title;if(b)b.innerHTML=html;$('v69InfoModal')?.classList.add('active')}
function click(id){const el=$(id);if(!el)return;try{el.click()}catch{el.dispatchEvent(new MouseEvent('click',{bubbles:true}))}}
function scrollToEl(el){el?.scrollIntoView({behavior:'smooth',block:'start'})}
function buildHeader(){
 const top=q('#v69Home .v69Topbar');if(!top||top.dataset.v103==='1')return;top.dataset.v103='1';
 top.innerHTML=`<div class="v69Logo"><div class="v69LogoMark"></div><div class="v69LogoText"><span>JRVX CAS</span><strong>JRVX CAS</strong></div></div>
 <nav class="v103Nav" aria-label="Навигация лобби"><button class="active" data-v103-nav="home">Главная</button><button data-v103-nav="play">Играть</button><button data-v103-nav="tournaments">Турниры</button><button data-v103-nav="leaderboard">Лидерборд</button><button data-v103-nav="promo" id="v103PromoTop">Акции</button><button data-v103-nav="about">О нас</button></nav>
 <div class="v103TopRight"><button class="v103Search" aria-label="Поиск"></button><span class="v103Divider"></span><button class="v103Auth" data-v103-auth="login">Войти</button><button class="v103Auth register" data-v103-auth="register">Регистрация</button></div>
 <div class="v103LegacyTop"><div id="v103WalletMirror"><strong id="v103MsMirror">0 MG</strong><strong id="v103MgMirror">0 MG</strong></div><div id="v103ProfileMirror">JC</div></div>`;
 qa('[data-v103-nav]',top).forEach(btn=>btn.addEventListener('click',()=>{
   qa('[data-v103-nav]',top).forEach(x=>x.classList.toggle('active',x===btn));
   const a=btn.dataset.v103Nav;
   if(a==='home')window.scrollTo({top:0,behavior:'smooth'});
   else if(a==='play')scrollToEl($('v83ModesHub'));
   else if(a==='tournaments')window.JVRXRoutes?.openTournaments?.();
   else if(a==='leaderboard'){const target=q('.v69DashboardGrid');if(target)scrollToEl(target);else info('Лидерборд','<div class="v69Coming"><h3>Лидерборд JRVX CAS</h3><p>Турнирная таблица доступна ниже в лобби.</p></div>')}
   else if(a==='promo')click('v69BalanceShop');
   else if(a==='about')info('О JRVX CAS','<div class="v69Coming"><div class="icon">♠</div><h3>JRVX CAS • Royal Poker</h3><p>JRVX CAS — клубное casino-лобби JRVX с Poker, Roulette, Blackjack, приватными столами и событиями.</p></div>');
 }));
 q('.v103Search',top)?.addEventListener('click',()=>info('Поиск','<div class="v69Coming"><h3>Быстрый переход</h3><p>Используйте раздел «Играть» для выбора режима или «Играть с людьми» для публичных комнат.</p></div>'));
 qa('[data-v103-auth]',top).forEach(btn=>btn.addEventListener('click',()=>{const p=$('v69ProfileTop');if(p){try{p.click();return}catch{}}info('JRVX ID','<div class="v69Coming"><h3>JRVX ID</h3><p>Единая авторизация будет подключена через id.jrvx.ru. Текущий локальный профиль сохранён.</p></div>')}));
}
function reshapeHero(){
 const stage=q('.v74HeroStage');if(!stage)return;
 const p=q('.v74HeroCopy p',stage);if(p)p.textContent='Выберите стол и формат игры на MG. Для быстрой партии можно сразу начать heads-up против JRVX.';
 const table=q('.v74HeroTable',stage);if(table)table.setAttribute('aria-label','JRVX CAS poker table');
}
function exposeAllModes(){
 const stage=$('v83Stage');if(!stage)return;
 qa('.v83Card',stage).forEach(card=>{card.classList.remove('left','right','far-left','far-right','hidden');card.classList.add('active');card.style.pointerEvents='auto'});
 qa('.v83Card .play',stage).forEach(b=>b.style.pointerEvents='auto');
 const arrows=[ $('v83Prev'),$('v83Next') ];arrows.forEach(a=>{if(a)a.hidden=true});
 const dots=$('v83Dots');if(dots)dots.hidden=true;
}
function keepModesStable(){
 const stage=$('v83Stage');if(!stage||stage.dataset.v103Stable==='1')return;stage.dataset.v103Stable='1';
 new MutationObserver(()=>requestAnimationFrame(exposeAllModes)).observe(stage,{subtree:true,attributes:true,attributeFilter:['class','style']});
}
function boot(){buildHeader();reshapeHero();const head=q('#v83ModesHub .v83Header p');if(head)head.textContent='Публичные комнаты и отдельные режимы.';}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
setTimeout(boot,250);setTimeout(boot,900);
})();
