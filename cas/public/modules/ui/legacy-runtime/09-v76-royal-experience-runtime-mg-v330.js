(function(){
'use strict';
const $=id=>document.getElementById(id),q=(s,r=document)=>r.querySelector(s),qa=(s,r=document)=>[...r.querySelectorAll(s)];
const after=(ref,node)=>ref?.parentNode?.insertBefore(node,ref.nextSibling);
function haptic(ms=7){try{navigator.vibrate?.(ms)}catch{}}

function buildPeoplePortal(){
  const main=$('v69Home')?.querySelector('.v69Main'),ticker=$('v74Ticker');if(!main||$('v76PeoplePortal'))return;
  const s=document.createElement('section');s.id='v76PeoplePortal';s.className='v76PeoplePortal';s.innerHTML=`
    <div class="v76PeopleCopy">
      <span class="v76PeopleEyebrow"><i></i> Multiplayer • Public Rooms</span>
      <h2>Играть <em>с людьми</em></h2>
      <p>Отдельный вход в публичные покерные комнаты. Выберите Mura Gold, формат игры и подходящие блайнды — без матча против JRVX.</p>
      <div class="v76PeopleRoomChips"><span><b>1 / 2</b> Entry</span><span><b>5 / 10</b> Royal</span><span><b>25 / 50</b> Elite</span><span>Hold’em / Omaha</span></div>
      <div class="v76PeopleActions"><button class="v76PeopleBtn primary" id="v76PeoplePlay">Выбрать стол</button><button class="v76PeopleBtn" id="v76PeopleLearn">Как играть</button></div>
    </div>
    <div class="v76PeopleVisual" aria-hidden="true"><div class="v76PeopleTable"></div><i class="v76PeopleSeat s1 live"></i><i class="v76PeopleSeat s2 live"></i><i class="v76PeopleSeat s3"></i><i class="v76PeopleSeat s4 live"></i><i class="v76PeopleSeat s5"></i><div class="v76PeopleCards"><i>A♠</i><i>K♥</i></div></div>`;
  if(ticker)after(ticker,s);else main.prepend(s);
  $('v76PeoplePlay').onclick=()=>{haptic();window.JVRXRoutes?.openTables?.()};
  $('v76PeopleLearn').onclick=()=>{haptic();openAcademy()};
}

function buildDock(){
  const root=$('v69Root');if(!root||$('v76Dock'))return;const old=$('v74BottomNav');if(old)old.style.display='none';
  const nav=document.createElement('nav');nav.id='v76Dock';nav.className='v76Dock';nav.innerHTML=`<button class="active" data-a="lobby"><i>♠</i><span>Лобби</span></button><button data-a="tables"><i>▱</i><span>Столы</span></button><button data-a="events"><i>★</i><span>События</span></button><button data-a="shop"><i>◆</i><span>Магазин</span></button><button data-a="profile"><i>◉</i><span>Профиль</span></button>`;root.appendChild(nav);
  function active(a){qa('button',nav).forEach(b=>b.classList.toggle('active',b.dataset.a===a))}
  nav.onclick=e=>{const b=e.target.closest('button');if(!b)return;const a=b.dataset.a;active(a);haptic();const R=window.JVRXRoutes;if(a==='lobby'){R?.returnHome?.();window.scrollTo({top:0,behavior:'smooth'})}if(a==='tables')R?.openTables?.();if(a==='events')R?.openTournaments?.();if(a==='shop'){if(typeof window.JRVXCASWalletV330?.openShop==='function')window.JRVXCASWalletV330.openShop();else $('v69BalanceShop')?.click()}if(a==='profile')window.JRVXCASOpenGameProfile?.()};
  function sync(){const home=$('v69Home')?.classList.contains('active'),tables=$('v69TablesScreen')?.classList.contains('active'),visible=home||tables;nav.classList.toggle('show',visible);if(tables)active('tables');else if(home&&!q('.v69Modal.active'))active('lobby')}
  window.v76SyncDock=sync;window.addEventListener('popstate',sync,{passive:true});document.addEventListener('visibilitychange',()=>{if(!document.hidden)sync()},{passive:true});sync();
}

const academyTabs=[
  ['start','01','Старт'],['hands','02','Комбинации'],['streets','03','Улицы'],['actions','04','Действия'],['positions','05','Позиции'],['math','06','Математика'],['quiz','07','Тест']
];
const hands=[
  ['Роял-флеш','A♠ K♠ Q♠ J♠ 10♠','A♠,K♠,Q♠,J♠,10♠','Самая сильная рука: A–10 одной масти.'],
  ['Стрит-флеш','9♥ 8♥ 7♥ 6♥ 5♥','9♥,8♥,7♥,6♥,5♥','Пять последовательных карт одной масти.'],
  ['Каре','K♠ K♥ K♦ K♣ 7♠','K♠,K♥,K♦,K♣,7♠','Четыре карты одного достоинства.'],
  ['Фулл-хаус','Q♠ Q♥ Q♦ 8♣ 8♦','Q♠,Q♥,Q♦,8♣,8♦','Тройка плюс пара.'],
  ['Флеш','A♦ J♦ 8♦ 5♦ 2♦','A♦,J♦,8♦,5♦,2♦','Пять карт одной масти без последовательности.'],
  ['Стрит','10♠ 9♥ 8♦ 7♣ 6♠','10♠,9♥,8♦,7♣,6♠','Пять последовательных карт разных мастей.'],
  ['Тройка','7♠ 7♥ 7♦ K♣ 3♠','7♠,7♥,7♦,K♣,3♠','Три карты одного достоинства.'],
  ['Две пары','A♠ A♥ 5♦ 5♣ 9♠','A♠,A♥,5♦,5♣,9♠','Две отдельные пары.'],
  ['Пара','J♠ J♦ A♥ 8♣ 3♠','J♠,J♦,A♥,8♣,3♠','Две карты одного достоинства.'],
  ['Старшая карта','A♠ J♥ 9♦ 6♣ 3♠','A♠,J♥,9♦,6♣,3♠','Если ничего не собрано — сравнивается старшая карта.']
];
function cardsMarkup(csv){return `<div class="v76Cards">${csv.split(',').map(c=>`<i class="v76Card ${/[♥♦]/.test(c)?'red':''}">${c}</i>`).join('')}</div>`}
function lesson(tab){
 if(tab==='start')return `<div class="v76AcademyHero"><small>Texas Hold’em • основы</small><h4>Как устроена одна раздача</h4><p>Каждый игрок получает две закрытые карты. На стол постепенно выкладываются пять общих. В конце используется лучшая комбинация ровно из пяти карт — можно использовать обе, одну или ни одной своей карты.</p></div><div class="v76AcademyGrid"><div class="v76LessonCard"><small>Шаг 1</small><strong>Блайнды создают банк</strong><p>Small Blind и Big Blind — обязательные ставки до раздачи. Они запускают торговлю.</p></div><div class="v76LessonCard"><small>Шаг 2</small><strong>Получите 2 карты</strong><p>Это ваши hole cards. Их не видят остальные игроки.</p></div><div class="v76LessonCard"><small>Шаг 3</small><strong>5 общих карт</strong><p>Флоп — три карты, затем Turn и River по одной.</p></div><div class="v76LessonCard"><small>Шаг 4</small><strong>Лучшие 5 карт</strong><p>Сравниваются лучшие пятикарточные комбинации оставшихся игроков.</p></div></div><div class="v76AcademyHero" style="margin-top:12px"><small>Omaha — важное отличие</small><h4>В Omaha используются ровно 2 + 3</h4><p>В классической Omaha у игрока четыре закрытые карты, но финальная комбинация обязана использовать ровно две карты из руки и ровно три общие карты. Это ключевое отличие от Hold’em.</p></div>`;
 if(tab==='hands')return `<div class="v76AcademyHero"><small>Сильнее → слабее</small><h4>Все комбинации покера</h4><p>Если у игроков комбинации одного типа, сравниваются достоинства карт внутри комбинации, затем кикеры.</p></div><div class="v76HandRanks">${hands.map((h,i)=>`<div class="v76HandRow"><span class="rank">${i+1}</span><strong>${h[0]}</strong><p>${h[3]}</p>${cardsMarkup(h[2])}</div>`).join('')}</div>`;
 if(tab==='streets')return `<div class="v76AcademyHero"><small>Порядок раздачи</small><h4>Пять этапов одной руки</h4><p>Между улицами проходят раунды ставок. Если все кроме одного игрока сбросили карты, раздача заканчивается сразу.</p></div><div class="v76StreetFlow"><div class="v76Street"><b>1</b><strong>Preflop</strong><span>2 закрытые карты</span></div><div class="v76Street"><b>2</b><strong>Flop</strong><span>3 общие карты</span></div><div class="v76Street"><b>3</b><strong>Turn</strong><span>4-я общая</span></div><div class="v76Street"><b>4</b><strong>River</strong><span>5-я общая</span></div><div class="v76Street"><b>5</b><strong>Showdown</strong><span>сравнение рук</span></div></div><div class="v76AcademyGrid" style="margin-top:12px"><div class="v76LessonCard"><small>До флопа</small><strong>Первым действует игрок слева от BB</strong><p>В heads-up порядок отличается: дилер ставит SB и ходит первым preflop.</p></div><div class="v76LessonCard"><small>После флопа</small><strong>Первым ходит ближайший слева от Button</strong><p>В heads-up игрок на BB ходит первым postflop, Button — последним.</p></div></div>`;
 if(tab==='actions')return `<div class="v76AcademyHero"><small>Панель действий</small><h4>Что означает каждая кнопка</h4><p>Доступные действия зависят от того, была ли ставка до вашего хода и сколько уже вложено в текущую улицу.</p></div><div class="v76ActionList"><div class="v76ActionLesson"><b>Fold — сбросить</b><p>Отказаться от дальнейшей борьбы за текущий банк. Уже поставленные фишки не возвращаются.</p></div><div class="v76ActionLesson"><b>Check — чек</b><p>Передать ход без ставки. Возможен только если вам не нужно уравнивать чужую ставку.</p></div><div class="v76ActionLesson"><b>Call — колл</b><p>Уравнять текущую ставку соперника и остаться в раздаче.</p></div><div class="v76ActionLesson"><b>Bet — ставка</b><p>Первым поставить фишки на улице, когда до вас никто не ставил.</p></div><div class="v76ActionLesson"><b>Raise — рейз</b><p>Увеличить уже существующую ставку. Следующий игрок должен уравнять, повысить ещё раз или сбросить.</p></div><div class="v76ActionLesson"><b>All‑in</b><p>Поставить весь доступный стек. Если оппонент покрывает ставку, лишняя часть формирует правила side pot.</p></div></div>`;
 if(tab==='positions')return `<div class="v76AcademyHero"><small>6-max table</small><h4>Почему позиция важна</h4><p>Чем позже вы действуете на postflop, тем больше информации уже получили о действиях соперников. Button обычно является самой поздней позицией.</p></div><div class="v76PositionTable"><div class="v76PositionFelt"></div><div class="v76Pos p1"><b>BTN</b>Button</div><div class="v76Pos p2"><b>SB</b>Small Blind</div><div class="v76Pos p3"><b>BB</b>Big Blind</div><div class="v76Pos p4"><b>UTG</b>Early</div><div class="v76Pos p5"><b>HJ</b>Hijack</div><div class="v76Pos p6"><b>CO</b>Cutoff</div></div><div class="v76AcademyGrid"><div class="v76LessonCard"><small>Ранняя позиция</small><strong>Меньше информации</strong><p>После вашего решения остаётся больше игроков, которые ещё могут действовать.</p></div><div class="v76LessonCard"><small>Поздняя позиция</small><strong>Больше информации</strong><p>Cutoff и Button чаще видят действия большинства соперников до принятия решения.</p></div></div>`;
 if(tab==='math')return `<div class="v76AcademyHero"><small>Без сложных формул</small><h4>Размер банка и pot odds</h4><p>Pot odds помогают понять, какую минимальную долю выигрышей нужно иметь, чтобы колл окупался в долгой серии одинаковых ситуаций.</p></div><div class="v76MathExample"><strong>Пример: в банке 80, для колла нужно 20.</strong><div class="v76MathFormula"><span>Колл 20</span><b>÷</b><span>Финальный банк 100</span><b>=</b><span>20%</span></div><p style="margin:0;color:#8f9dbc;font-size:10px;line-height:1.6">В этом упрощённом примере вам нужна примерно 20% вероятность выиграть банк, если после колла больше ставок не будет. В реальной игре учитываются будущие ставки, количество соперников и диапазоны рук.</p></div><div class="v76AcademyGrid" style="margin-top:12px"><div class="v76LessonCard"><small>Стек</small><strong>Сколько фишек у игрока</strong><p>Размер стека определяет максимальную сумму риска в раздаче.</p></div><div class="v76LessonCard"><small>Effective stack</small><strong>Меньший из двух стеков</strong><p>В heads-up именно он определяет максимально возможный объём фишек, который реально может оказаться в банке.</p></div></div>`;
 return `<div class="v76AcademyHero"><small>Проверка знаний</small><h4>Мини‑тест</h4><p>Пять коротких вопросов. Ошибка ничего не стоит — цель просто закрепить основные правила.</p></div><div class="v76Quiz" id="v76Quiz"><div class="v76QuizQ" data-answer="1"><strong>1. Сколько закрытых карт получает игрок в Texas Hold’em?</strong><div class="v76QuizOpts"><button data-a="0">1 карта</button><button data-a="1">2 карты</button><button data-a="2">4 карты</button><button data-a="3">5 карт</button></div></div><div class="v76QuizQ" data-answer="2"><strong>2. Когда можно сделать Check?</strong><div class="v76QuizOpts"><button data-a="0">Всегда</button><button data-a="1">Только preflop</button><button data-a="2">Когда нет ставки, которую нужно уравнять</button><button data-a="3">Только с сильной рукой</button></div></div><div class="v76QuizQ" data-answer="0"><strong>3. Что сильнее?</strong><div class="v76QuizOpts"><button data-a="0">Фулл-хаус</button><button data-a="1">Флеш</button><button data-a="2">Стрит</button><button data-a="3">Тройка</button></div></div><div class="v76QuizQ" data-answer="3"><strong>4. Сколько общих карт появляется на Flop?</strong><div class="v76QuizOpts"><button data-a="0">1</button><button data-a="1">2</button><button data-a="2">4</button><button data-a="3">3</button></div></div><div class="v76QuizQ" data-answer="1"><strong>5. В Omaha финальная комбинация использует…</strong><div class="v76QuizOpts"><button data-a="0">любое число карт из руки</button><button data-a="1">ровно 2 карты руки и 3 общие</button><button data-a="2">все 4 карты руки</button><button data-a="3">только общие карты</button></div></div><div class="v76QuizScore" id="v76QuizScore">Ответьте на вопросы — результат появится здесь.</div></div>`;
}
function academySet(tab){const pane=$('v76AcademyPane');if(!pane)return;qa('[data-ac-tab]').forEach(b=>b.classList.toggle('active',b.dataset.acTab===tab));pane.innerHTML=lesson(tab);if(tab==='quiz')wireQuiz()}
function wireQuiz(){
  let answered=0,score=0;
  qa('.v76QuizQ').forEach(qn=>{
    qa('button',qn).forEach(b=>{
      b.onclick=()=>{
        if(qn.dataset.done)return;
        qn.dataset.done='1';answered++;
        const good=b.dataset.a===qn.dataset.answer;if(good)score++;
        b.classList.add(good?'good':'bad');
        qa('button',qn).forEach(x=>{if(x.dataset.a===qn.dataset.answer)x.classList.add('good')});
        const s=$('v76QuizScore');
        if(s)s.textContent=answered<5?`Ответов: ${answered}/5 • верно: ${score}`:`Результат: ${score}/5${score===5?' • Отлично. Базовые правила усвоены.':score>=3?' • Хорошо. Можно повторить слабые разделы.':' • Лучше ещё раз пройти уроки.'}`;
      };
    });
  });
}
function openAcademy(){
  const modal=$('v69InfoModal'),title=$('v69InfoTitle'),body=$('v69InfoBody');if(!modal||!body)return;title.textContent='JVRX Poker Academy';body.innerHTML=`<div class="v76Academy"><nav class="v76AcademyNav">${academyTabs.map((t,i)=>`<button class="${i===0?'active':''}" data-ac-tab="${t[0]}"><span>${t[1]}</span>${t[2]}</button>`).join('')}</nav><section class="v76AcademyPane" id="v76AcademyPane"></section></div>`;qa('[data-ac-tab]',body).forEach(b=>b.onclick=()=>academySet(b.dataset.acTab));academySet('start');modal.classList.add('active');haptic();
}
window.v76OpenAcademy=openAcademy;
document.addEventListener('click',e=>{const el=e.target.closest('[data-v69-action="learn"]');if(!el)return;e.preventDefault();e.stopPropagation();e.stopImmediatePropagation();openAcademy()},true);

function polishCurrencyCopy(){
  const mg=q('.v69CurrencyCard.gold .v69CoinBig');if(mg)mg.textContent='MG';qa('.v69PackCoin').forEach(x=>x.textContent='MG');qa('.v74HeroToken.mg').forEach(x=>x.textContent='MG');qa('.v74HeroToken.mg').forEach(x=>x.textContent='MG');
}
function boot(){buildPeoplePortal();buildDock();polishCurrencyCopy();/* v86: obsolete carousel/root MutationObserver removed */}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
