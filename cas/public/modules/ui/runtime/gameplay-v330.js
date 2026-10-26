(function(){
  'use strict';
  var frame=0,previousResult='';
  var $=function(id){return document.getElementById(id);};
  function text(el,value){if(el&&el.textContent!==value)el.textContent=value;}
  function rouletteState(){return window.JRVXCASV220&&window.JRVXCASV220.roulette&&window.JRVXCASV220.roulette.state;}
  function select(label,options,attribute){
    var field=document.createElement('select');field.setAttribute('aria-label',label);
    options.forEach(function(row){var option=document.createElement('option');option.value=row[0];option.textContent=row[1];field.appendChild(option);});
    field.addEventListener('change',function(){
      if($('rouletteSpin')&&$('rouletteSpin').disabled)return;
      var button=document.querySelector('#roulette ['+attribute+'="'+field.value+'"]');
      if(button&&!button.disabled)button.click();schedule();
    });
    return field;
  }
  function setup(root){
    var board=root.querySelector('.v66BettingBoard');
    if(board&&!$('jrvxRouletteSelectors')){
      var selectors=document.createElement('div');selectors.id='jrvxRouletteSelectors';
      var mode=select('Способ ставки на число',[['straight','Число · ×36'],['split','Два числа · ×18'],['street','Три числа · ×12'],['corner','Четыре числа · ×9']],'data-r22-mode');mode.id='jrvxRouletteMode';
      var group=select('Групповые ставки',[['','Дюжины / колонки'],['dozen1','1–12 · ×3'],['dozen2','13–24 · ×3'],['dozen3','25–36 · ×3'],['col1','Колонка 1 · ×3'],['col2','Колонка 2 · ×3'],['col3','Колонка 3 · ×3']],'data-r22-type');group.id='jrvxRouletteGroup';
      selectors.appendChild(mode);selectors.appendChild(group);board.insertBefore(selectors,$('rouletteNumbers'));
    }
    var command=root.querySelector('.v66CasinoCommand'),original=root.querySelector('.gamehead .v69GameCurrency');
    if(command&&original&&!$('jrvxRouletteCurrency')){
      var currencies=document.createElement('div');currencies.id='jrvxRouletteCurrency';currencies.setAttribute('role','group');currencies.setAttribute('aria-label','Валюта стола');
      Array.prototype.forEach.call(original.querySelectorAll('button[data-cur]'),function(source){var button=document.createElement('button');button.type='button';button.dataset.currency=source.dataset.cur;button.textContent=source.dataset.cur;button.setAttribute('aria-label','Играть в Mura Gold');button.addEventListener('click',function(){if(!button.disabled)source.click();schedule();});currencies.appendChild(button);});
      command.insertBefore(currencies,command.firstChild);new MutationObserver(schedule).observe(original,{subtree:true,attributes:true,attributeFilter:['class','disabled']});
    }
    var chamber=root.querySelector('.v66WheelChamber');
    if(chamber&&!$('jrvxRoulettePhase')){var phase=document.createElement('div');phase.id='jrvxRoulettePhase';phase.setAttribute('aria-hidden','true');phase.textContent='Европейская рулетка';chamber.appendChild(phase);}
    [['r22Repeat','Повтор','Восстановить предыдущую ставку'],['r22Double','×2','Удвоить выбранную сумму'],['r22Clear','Сброс','Очистить выбранное поле']].forEach(function(item){var button=$(item[0]);if(button){text(button,item[1]);button.setAttribute('aria-label',item[2]);}});
    var input=$('rouletteBetInput');if(input)input.setAttribute('aria-label','Сумма ставки');
    var message=$('rouletteMessage');if(message){message.setAttribute('role','status');message.setAttribute('aria-live','polite');}
    var exit=root.querySelector('[data-v91-exit],[data-main-menu]');if(exit){text(exit,'Меню');exit.setAttribute('aria-label','Вернуться в главное меню');}
  }
  function sync(){
    frame=0;var root=$('roulette');if(!root)return;setup(root);
    var active=root.classList.contains('active');document.body.classList.toggle('jrvx-roulette-active',active);
    var busy=!!($('rouletteSpin')&&$('rouletteSpin').disabled),state=rouletteState();
    root.setAttribute('data-jrvx-spin',busy?'busy':'ready');
    var mode=$('jrvxRouletteMode'),group=$('jrvxRouletteGroup');
    if(mode){mode.disabled=busy;if(state&&mode.value!==state.mode)mode.value=state.mode;}
    if(group){group.disabled=busy;var value=state&&state.selection&&/^(dozen|col)[123]$/.test(state.selection.type)?state.selection.type:'';if(group.value!==value)group.value=value;}
    if(state&&state.selection)text($('rouletteSelection'),state.selection.type==='none'?'Выберите поле':state.selection.label+' · ×'+state.selection.mult);
    Array.prototype.forEach.call(root.querySelectorAll('#jrvxRouletteCurrency button'),function(button){var source=root.querySelector('.gamehead .v69GameCurrency [data-cur="'+button.dataset.currency+'"]');if(source){var chosen=source.classList.contains('active');button.classList.toggle('active',chosen);button.setAttribute('aria-pressed',String(chosen));button.disabled=busy||source.disabled;}});
    var message=$('rouletteMessage')&&$('rouletteMessage').textContent||'',result=$('rouletteResult')&&$('rouletteResult').textContent.trim()||'';
    if($('rouletteResult'))$('rouletteResult').hidden=!/^\d+$/.test(result);
    text($('jrvxRoulettePhase'),busy?(/Сервер|запрос|Проверяем/.test(message)?'Подтверждаем запрос':'Колесо в движении'):/^\d+$/.test(result)?'Последний результат · '+result:'Выберите свою ставку');
    if(previousResult!==result){previousResult=result;if(active&&/^\d+$/.test(result)&&window.JRVXExperience&&window.JRVXExperience.settings.animations){var badge=$('rouletteResult');badge.classList.remove('jrvxResultReveal');void badge.offsetWidth;badge.classList.add('jrvxResultReveal');}}
  }
  function schedule(){if(!frame)frame=requestAnimationFrame(sync);}
  function boot(){
    // The generated photo supplies the rim and spindle; server pocket geometry stays in the canvas.
    if(typeof Image==='function'){var artwork=new Image();artwork.onload=function(){window.JRVXRouletteArtwork=artwork;if(typeof window.rouletteDraw==='function')window.rouletteDraw();};artwork.src='/assets/art/roulette-no-ball-v323.webp';}
    var bjMessage=$('bjMessage');if(bjMessage){bjMessage.setAttribute('role','status');bjMessage.setAttribute('aria-live','polite');}
    var bjInput=$('bjBetInput');if(bjInput)bjInput.setAttribute('aria-label','Сумма ставки блэкджека');
    sync();['poker','blackjack','roulette'].forEach(function(id){var root=$(id);if(root)new MutationObserver(schedule).observe(root,{attributes:true,attributeFilter:['class']});});
    var root=$('roulette');if(root)new MutationObserver(schedule).observe(root,{subtree:true,childList:true,characterData:true});
    var spin=$('rouletteSpin');if(spin)new MutationObserver(schedule).observe(spin,{attributes:true,attributeFilter:['disabled']});
    document.addEventListener('jrvx-cas-identity',schedule);window.addEventListener('pageshow',schedule);
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
