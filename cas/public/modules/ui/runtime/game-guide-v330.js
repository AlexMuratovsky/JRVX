(function(){
'use strict';
const guides={
 poker:{name:'Покер',intro:'Texas Hold’em: две ваши закрытые карты и до пяти общих карт на столе.',sections:[
  {title:'Цель раздачи',items:['Соберите лучшую комбинацию из пяти карт, используя свои и общие карты. Банк также получает участник, если остальные сбросили карты.']},
  {title:'Кнопки хода',items:['Фолд — сбросить карты и выйти из текущей раздачи.','Чек — пропустить ставку, когда уравнивать нечего. Эта же кнопка меняется на колл, если нужно уравнять ставку.','Рейз — повысить ставку. Допустимый размер показан в панели хода.','Действия доступны в свой ход. Если кнопка недоступна, дождитесь своего хода и подтверждённого состояния стола.']},
  {title:'Перед подтверждением',items:['Проверьте валюту MG и размер ставки.','Если открылось подтверждение ALL-IN, кнопка «Отмена» закрывает его без отправки действия.','При потере связи дождитесь восстановления серверного состояния. Ожидание ответа само по себе не означает завершение раздачи.']}
 ]},
 blackjack:{name:'Блэкджек',intro:'Наберите сумму ближе к 21, не превышая её. Туз считается за 1 или 11, картинки — за 10.',sections:[
  {title:'Обычный ход',items:['Раздать — начать руку с указанной ставкой и валютой.','Ещё / Hit — взять карту. Хватит / Stand — завершить добор своей руки.','При нескольких руках смотрите, какая рука сейчас активна.']},
  {title:'Дополнительные действия',items:['Double удваивает ставку руки и добавляет одну карту, после чего ход этой руки завершается.','Split разделяет пару одинакового ранга на две руки с отдельными ставками.','Insurance — дополнительная страховка, доступная при предложении игры.','Доступность Double, Split и Insurance зависит от текущей руки и подтверждения сервера. Недоступные кнопки не отправляют действие.']},
  {title:'Если ответ задержался',items:['Не считайте анимацию карты подтверждением результата. Дождитесь сообщения игры.','При повторной проверке неподтверждённого действия сайт использует прежний запрос. Проверяйте сообщение перед следующим ходом.']}
 ]},
 roulette:{name:'Рулетка',intro:'Европейское колесо с числами от 0 до 36. Сначала выберите поле и сумму, затем проверьте валюту.',sections:[
  {title:'Выбор поля',items:['Кнопка «Поле» открывает крупную таблицу. Выбор числа, группы или типа ставки ещё не запускает вращение.','Для числовых ставок доступны число, пара, тройка и угол. Повторное нажатие на режим пары меняет её направление.','Зелёный 0 — отдельное число. Он не красный и не чёрный, не входит в чётное / нечётное, диапазоны 1–18 / 19–36, дюжины или колонки.']},
  {title:'Перед вращением',items:['Сверьте выбранное поле, сумму и MG в подписи ставки. Вращение запускается отдельной кнопкой SPIN.','«Повторить» возвращает поле и сумму последней ставки этого аккаунта. Перед SPIN проверьте текущую валюту.','«Очистить» снимает выбранное поле. Эта кнопка не отменяет уже отправленный запрос.']},
  {title:'Если ответ задержался',items:['Сообщение «Проверяем результат предыдущего запроса» относится к прежней ставке. Её поле, сумма и валюта восстанавливаются на экране.','Подождите подтверждённого результата. Ошибка связи сама по себе не означает ни выигрыш, ни проигрыш.']}
 ]}
};
for(const guide of Object.values(guides)){guide.sections.forEach(section=>{Object.freeze(section.items);Object.freeze(section)});Object.freeze(guide.sections);Object.freeze(guide)}Object.freeze(guides);
const modes=Object.freeze(['poker','blackjack','roulette']);
const safeMode=mode=>Object.hasOwn(guides,mode)?mode:'poker';
if(typeof module==='object'&&module.exports)module.exports={guides,safeMode};
if(typeof document==='undefined')return;
const $=id=>document.getElementById(id);
let panel=null,selected='poker',bound=false;
function element(tag,className,text,attributes={}){const node=document.createElement(tag);if(className)node.className=className;if(text!==undefined)node.textContent=text;for(const [name,value]of Object.entries(attributes))node.setAttribute(name,value);return node}
function setMode(mode,focus=false){
 const changed=selected!==safeMode(mode);selected=safeMode(mode);if(!panel)return;
 for(const key of modes){const tab=$('jrvxGuideTabV329-'+key),content=$('jrvxGuideContentV329-'+key),active=key===selected;if(tab){tab.setAttribute('aria-selected',String(active));tab.tabIndex=active?0:-1}if(content)content.hidden=!active}
 if(changed)panel.querySelector('.jrvxGuideBodyV329').scrollTop=0;
 if(focus)$('jrvxGuideTabV329-'+selected)?.focus();
}
function ensurePanel(){
 if(panel?.isConnected)return panel;
 panel=element('div','jrvxPanelV329 jrvxGuidePanelV329',undefined,{id:'jrvxGameGuideV329'});panel.hidden=true;
 const card=element('section','jrvxPanelCardV329 jrvxGuideCardV329',undefined,{role:'dialog','aria-modal':'true','aria-labelledby':'jrvxGuideTitleV329','aria-describedby':'jrvxGuideDescriptionV329'});
 const header=element('header','jrvxPanelHeadV329'),heading=element('div');
 heading.appendChild(element('h2','', 'Как играть в JRVX CAS',{id:'jrvxGuideTitleV329'}));heading.appendChild(element('p','jrvxGuideDescriptionV329','Правила, кнопки и подтверждение действий',{id:'jrvxGuideDescriptionV329'}));
 header.appendChild(heading);header.appendChild(element('button','jrvxPanelCloseV329','×',{type:'button','aria-label':'Закрыть справку','data-jrvx-panel-close':''}));card.appendChild(header);
 const tabs=element('div','jrvxGuideTabsV329',undefined,{role:'tablist','aria-label':'Игровые режимы'});
 const body=element('div','jrvxGuideBodyV329');
 for(const key of modes){
  const guide=guides[key],tab=element('button','jrvxGuideTabV329',guide.name,{type:'button',role:'tab',id:'jrvxGuideTabV329-'+key,'data-jrvx-guide-tab':key,'aria-controls':'jrvxGuideContentV329-'+key});tabs.appendChild(tab);
  const content=element('section','jrvxGuideContentV329',undefined,{role:'tabpanel',id:'jrvxGuideContentV329-'+key,'aria-labelledby':'jrvxGuideTabV329-'+key,tabindex:'0'});content.appendChild(element('p','jrvxGuideIntroV329',guide.intro));
  for(const section of guide.sections){const block=element('section','jrvxGuideSectionV329'),list=element('ul');block.appendChild(element('h3','',section.title));for(const text of section.items)list.appendChild(element('li','',text));block.appendChild(list);content.appendChild(block)}
  body.appendChild(content);
 }
 card.appendChild(tabs);card.appendChild(body);
 const note=element('p','jrvxGuideNoteV329','Сумма, валюта и результат должны совпадать с подтверждённым сообщением игры. Эта справка не делает ставки и не выполняет игровые действия.');body.appendChild(note);panel.appendChild(card);document.body.appendChild(panel);
 tabs.addEventListener('click',event=>{const tab=event.target.closest?.('[data-jrvx-guide-tab]');if(tab&&tabs.contains(tab))setMode(tab.getAttribute('data-jrvx-guide-tab'))});
 tabs.addEventListener('keydown',event=>{
  const tab=event.target.closest?.('[data-jrvx-guide-tab]');if(!tab||!tabs.contains(tab))return;
  const index=modes.indexOf(tab.getAttribute('data-jrvx-guide-tab'));let next=index;
  if(event.key==='ArrowRight')next=(index+1)%modes.length;else if(event.key==='ArrowLeft')next=(index+modes.length-1)%modes.length;else if(event.key==='Home')next=0;else if(event.key==='End')next=modes.length-1;else return;
  event.preventDefault();event.stopPropagation();setMode(modes[next],true);
 });
 setMode(selected);return panel;
}
function open(mode='poker',opener=document.activeElement){
 const manager=window.JRVXCASPanelsV329;if(typeof manager?.open!=='function')return false;
 ensurePanel();setMode(mode);
 const opened=manager.open(panel,{opener,initialFocus:$('jrvxGuideTabV329-'+selected)})!==false;
 if(opened&&manager.active?.()===panel)$('jrvxGuideTabV329-'+selected)?.focus();
 return opened;
}
function close(){if(panel)window.JRVXCASPanelsV329?.close?.(panel)}
function gameButton(host,mode){if(host&&!host.querySelector('[data-jrvx-guide-open="'+mode+'"]'))host.appendChild(element('button','btn jrvxGameUtilityV329 jrvxGuideButtonV329','?',{type:'button','data-jrvx-guide-open':mode,'aria-label':'Как играть: '+guides[mode].name,title:'Как играть: '+guides[mode].name}))}
function ensureButtons(){
 for(const mode of modes)gameButton(document.querySelector('#'+mode+' .gamehead .actions'),mode);
 gameButton(document.querySelector('#p59Game .p59GameBtns')||document.querySelector('#poker .p59GameBtns'),'poker');
}
function boot(){if(bound)return;bound=true;ensureButtons();document.addEventListener('click',event=>{const opener=event.target.closest?.('[data-jrvx-guide-open]');if(!opener||opener.disabled)return;event.preventDefault();open(opener.getAttribute('data-jrvx-guide-open'),opener)});document.addEventListener('jrvx-cas-identity',ensureButtons);window.addEventListener('pageshow',ensureButtons)}
window.JRVXCASGuideV329={open,close,refresh:ensureButtons};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
