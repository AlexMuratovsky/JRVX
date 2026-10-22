(function () {
  'use strict';
  var modes = {
    v69QuickPlay: {title:'Покер с JRVX',words:'poker holdem холдем heads up один',description:'Матч один на один с JRVX.'},
    v71Private: {title:'Частная игра',words:'private приватная друзья друг покер poker',description:'Закрытая комната для игры с другом.'},
    v71Roulette: {title:'Рулетка',words:'roulette европейская колесо',description:'Европейская рулетка.'},
    v71Blackjack: {title:'Блэкджек',words:'blackjack блекджек блэкджек 21 карты',description:'Классический стол 21.'},
    v69Tournaments: {title:'Турниры',words:'tournament события соревнования',description:'Раздел готовится к запуску.',soon:true}
  };
  function normalize(value){return String(value||'').toLocaleLowerCase('ru').replace(/ё/g,'е').replace(/\s+/g,' ').trim();}
  function matches(key,query){if(!Object.prototype.hasOwnProperty.call(modes,key))return false;var m=modes[key];return normalize(query).split(' ').every(function(word){return normalize(m.title+' '+m.words+' '+m.description).indexOf(word)!==-1;});}
  // Pure catalog matching is also exercised by the Node regression checks.
  if(typeof window==='undefined'&&typeof module==='object'&&module.exports){module.exports={matches:matches,modes:modes};return;}
  var scheduled=false;
  function ensureGateLinks(){var card=document.querySelector('#v69Age .v69AgeCard');if(!card||card.querySelector('.jrvxCasGateLinks'))return;var nav=document.createElement('nav');nav.className='jrvxCasGateLinks';nav.setAttribute('aria-label','Другие сервисы JRVX');nav.innerHTML='<a href="https://jrvx.ru/">← Экосистема JRVX</a><a href="https://id.jrvx.ru/">JRVX ID ↗</a>';card.insertBefore(nav,card.firstChild);}
  function ensureNav(home){
    var main=home.querySelector('.v69Main');if(!main||document.getElementById('jrvxCasEcosystem'))return;
    var nav=document.createElement('nav');nav.id='jrvxCasEcosystem';nav.setAttribute('aria-label','Экосистема JRVX');
    nav.innerHTML='<a class="jrvxCasBrand" href="https://jrvx.ru/" aria-label="JRVX — главная"><svg width="28" height="28" viewBox="0 0 30 30" aria-hidden="true"><path d="M3 3h10v10H3zM17 3h10v10H17zM3 17h10v10H3z" fill="currentColor"></path><path d="M17 17h10v10H17z" fill="currentColor" opacity=".35"></path></svg> JRVX <small>CAS · 18+</small></a><div><a href="https://id.jrvx.ru/">Мой JRVX ID ↗</a><a href="https://planner.jrvx.ru/">Planner ↗</a><a href="https://jrvx.ru/#projects">Все проекты ↗</a></div>';
    main.insertBefore(nav,main.firstChild);
  }
  function ensureSearch(home){
    var hub=home.querySelector('#v83ModesHub'),carousel=hub&&hub.querySelector('.v83Modes');
    if(!carousel||document.getElementById('jrvxCasSearch'))return;
    var section=document.createElement('section');section.id='jrvxCasSearch';section.setAttribute('aria-label','Поиск игровых режимов');
    section.innerHTML='<div class="jrvxCasSearchRow"><label for="jrvxCasQuery">Найти режим<input id="jrvxCasQuery" type="search" maxlength="120" placeholder="Покер, рулетка, блэкджек…" autocomplete="off"></label><button type="button" id="jrvxCasClear" hidden>Сбросить</button></div><p id="jrvxCasSearchStatus" role="status" aria-live="polite">Выберите режим ниже или найдите его по названию.</p><div id="jrvxCasResults" hidden></div>';
    carousel.parentNode.insertBefore(section,carousel);
    var input=section.querySelector('input'),clear=section.querySelector('button'),results=section.querySelector('#jrvxCasResults'),status=section.querySelector('#jrvxCasSearchStatus');
    function render(){
      var query=normalize(input.value),cards=Array.prototype.slice.call(hub.querySelectorAll('.v83Card[data-source]'));
      var active=!!query;hub.setAttribute('data-jrvx-search',active?'on':'off');clear.hidden=!active;results.hidden=!active;results.textContent='';
      if(!active){status.textContent='Выберите режим ниже или найдите его по названию.';return;}
      var found=cards.filter(function(card){return matches(card.getAttribute('data-source'),query);});
      status.textContent=found.length?'Найдено режимов: '+found.length:'Ничего не найдено. Попробуйте другое название.';
      found.forEach(function(card){
        var mode=modes[card.getAttribute('data-source')],article=document.createElement('article'),title=document.createElement('h3'),description=document.createElement('p'),button=document.createElement('button');
        title.textContent=mode.title;description.textContent=mode.description;button.type='button';button.textContent=mode.soon?'О разделе':'Открыть режим';button.setAttribute('aria-label',button.textContent+': '+mode.title);
        button.addEventListener('click',function(){var existing=card.querySelector('.play');if(existing&&!existing.disabled)existing.click();});
        article.appendChild(title);article.appendChild(description);article.appendChild(button);results.appendChild(article);
      });
    }
    input.addEventListener('input',render);input.addEventListener('keydown',function(e){if(e.key==='Escape'){input.value='';render();}});
    clear.addEventListener('click',function(){input.value='';render();input.focus();});
    document.addEventListener('click',function(e){if(e.target.closest&&e.target.closest('#v69Home .v103Search')){e.preventDefault();e.stopImmediatePropagation();section.scrollIntoView({block:'center',behavior:window.matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth'});input.focus();}},true);
  }
  function keyboardCards(home){
    Array.prototype.forEach.call(home.querySelectorAll('.v69Mini[data-v69-action]'),function(card){
      if(card.getAttribute('data-jrvx-keyboard')==='true')return;
      card.setAttribute('data-jrvx-keyboard','true');card.setAttribute('role','button');card.tabIndex=0;
      var title=card.querySelector('b');if(title)card.setAttribute('aria-label',title.textContent.trim());
      card.addEventListener('keydown',function(e){if(e.target===card&&(e.key==='Enter'||e.key===' ')){e.preventDefault();card.click();}});
    });
    [['v83Prev','Предыдущий режим'],['v83Next','Следующий режим'],['v69ProfileTop','Открыть профиль'],['v69WalletOpen','Открыть кошелёк']].forEach(function(pair){var el=document.getElementById(pair[0]);if(el)el.setAttribute('aria-label',pair[1]);});
  }
  function refresh(){scheduled=false;ensureGateLinks();var home=document.getElementById('v69Home');if(!home)return;ensureSearch(home);keyboardCards(home);}
  function schedule(){if(!scheduled){scheduled=true;requestAnimationFrame(refresh);}}
  function boot(){refresh();var home=document.getElementById('v69Home');if(home)new MutationObserver(schedule).observe(home,{childList:true,subtree:true});document.documentElement.setAttribute('data-jrvx-cas-ecosystem','20261021');}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
