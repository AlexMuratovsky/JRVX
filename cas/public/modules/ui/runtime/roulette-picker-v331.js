/* A larger selection surface. It forwards choices to the existing table handlers. */
(function(){
 'use strict';
 const red=new Set([1,3,5,7,9,12,14,16,18,19,21,23,25,27,30,32,34,36]);
 function covered(selection={}){
  if(['exact','split','street','corner'].includes(selection.type))return (selection.numbers||[]).filter(n=>Number.isInteger(n)&&n>=0&&n<=36);
  return Array.from({length:36},(_,i)=>i+1).filter(n=>selection.type==='red'?red.has(n):selection.type==='black'?!red.has(n):selection.type==='even'?n%2===0:selection.type==='odd'?n%2===1:selection.type==='low'?n<=18:selection.type==='high'?n>=19:/^dozen[123]$/.test(selection.type)?Math.floor((n-1)/12)+1===Number(selection.type.at(-1)):/^col[123]$/.test(selection.type)?(n-1)%3+1===Number(selection.type.at(-1)):false);
 }
 if(typeof module==='object'&&module.exports)module.exports={covered};
 if(typeof document==='undefined')return;
 const $=id=>document.getElementById(id),state=()=>window.JRVXCASV220?.roulette?.state;
 let queued=false,restoreFocus=null,rovingNumber=0;
 const text=(e,v)=>{if(e&&e.textContent!==v)e.textContent=v};
 const attr=(e,k,v)=>{if(e.getAttribute(k)!==v)e.setAttribute(k,v)};
 // The opener lives inside the observed roulette root. Rewriting an existing
 // disabled attribute emits another mutation, even when its value is unchanged.
 const disable=(e,v)=>{if(e&&e.disabled!==v)e.disabled=v};
 function source(selector){return $('roulette')?.querySelector(selector)}
 function choose(selector){if($('rouletteSpin')?.disabled)return;const button=source(selector);if(button&&!button.disabled)button.click();schedule();}
 function button(label,kind,value){const b=document.createElement('button');b.type='button';b.textContent=label;b.dataset[kind]=value;return b;}
 const numberButtons=()=>[...($('jrvxPickerNumbers')?.querySelectorAll('button[data-pick-number]')||[])];
 function numberTabStop(preferred=rovingNumber,focus=false){
  const buttons=numberButtons(),enabled=buttons.filter(b=>!b.disabled);
  const target=enabled.find(b=>Number(b.dataset.pickNumber)===Number(preferred))||enabled[0];
  for(const b of buttons)if(b.tabIndex!==(b===target?0:-1))b.tabIndex=b===target?0:-1;
  if(target){rovingNumber=Number(target.dataset.pickNumber);if(focus)target.focus()}
  return target;
 }
 function numberKey(event){
  const current=event.target?.closest?.('button[data-pick-number]');
  if(!current||current.disabled||!$('jrvxPickerNumbers')?.contains(current))return false;
  if(event.key==='Enter'||event.key===' '){event.preventDefault();event.stopPropagation();if(!event.repeat)current.click();return true}
  if(!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','Home','End'].includes(event.key))return false;
  event.preventDefault();event.stopPropagation();
  const enabled=numberButtons().filter(b=>!b.disabled);let target;
  if(event.key==='Home')target=enabled[0];else if(event.key==='End')target=enabled.at(-1);
  else{
   // Use the rendered cell centres, so the seven-column and landscape
   // thirteen-column layouts share the same physical arrow directions.
   const rect=current.getBoundingClientRect(),x=(rect.left+rect.right)/2,y=(rect.top+rect.bottom)/2;
   const horizontal=event.key==='ArrowLeft'||event.key==='ArrowRight',positive=event.key==='ArrowRight'||event.key==='ArrowDown';
   target=enabled.filter(b=>b!==current).map(b=>{const r=b.getBoundingClientRect();return{b,x:(r.left+r.right)/2,y:(r.top+r.bottom)/2}})
    .filter(c=>Math.abs(horizontal?c.y-y:c.x-x)<1&&(positive?(horizontal?c.x>x:c.y>y):(horizontal?c.x<x:c.y<y)))
    .sort((a,b)=>Math.abs(horizontal?a.x-x:a.y-y)-Math.abs(horizontal?b.x-x:b.y-y))[0]?.b;
  }
  if(target)numberTabStop(target.dataset.pickNumber,true);
  return true;
 }
 function ensure(){
  const selectors=$('jrvxRouletteSelectors');if(!selectors)return;
  if(!$('jrvxRoulettePickerOpen')){const b=button('Поле ⤢','openPicker','1');b.id='jrvxRoulettePickerOpen';b.setAttribute('aria-label','Выбрать поле на крупной таблице');b.setAttribute('aria-haspopup','dialog');b.onclick=open;selectors.appendChild(b);}
  if($('jrvxRoulettePicker'))return;
  const panel=document.createElement('div');panel.id='jrvxRoulettePicker';panel.hidden=true;
  panel.innerHTML='<section class="jrvxPickerCard" role="dialog" aria-modal="true" aria-labelledby="jrvxPickerTitle" aria-describedby="jrvxPickerHelp"><header><div><h2 id="jrvxPickerTitle">Куда поставить фишку</h2><p id="jrvxPickerHelp">Выберите тип ставки и коснитесь поля.</p></div><button type="button" id="jrvxPickerClose" aria-label="Закрыть выбор поля">×</button></header><div id="jrvxPickerModes" role="group" aria-label="Тип ставки"></div><div id="jrvxPickerNumbers" role="group" aria-label="Числа рулетки"></div><div id="jrvxPickerOutside" role="group" aria-label="Простые ставки"></div><div id="jrvxPickerGroups" role="group" aria-label="Дюжины и колонки"></div><footer><p id="jrvxPickerSummary" role="status" aria-live="polite"></p><button type="button" id="jrvxPickerDone">Готово</button></footer></section>';
  document.body.appendChild(panel);
  [['straight','Число'],['split','Пара ↔'],['street','Тройка'],['corner','Угол']].forEach(([v,t])=>{const b=button(t,'pickMode',v);b.onclick=()=>choose('[data-r22-mode="'+v+'"]');$('jrvxPickerModes').appendChild(b)});
  $('jrvxPickerNumbers').setAttribute('aria-label','Числа рулетки. Стрелки — переход, Home и End — первое и последнее число, Enter или пробел — выбрать.');
  for(let n=0;n<37;n++){const b=button(String(n),'pickNumber',String(n));b.className=n===0?'green':red.has(n)?'red':'black';b.tabIndex=-1;b.setAttribute('aria-label','Число '+n);b.onfocus=()=>numberTabStop(n);b.onclick=()=>{numberTabStop(n);choose('#rouletteNumbers [data-number="'+n+'"]')};$('jrvxPickerNumbers').appendChild(b);}
  [['red','Красное'],['black','Чёрное'],['even','Чётное'],['odd','Нечётное'],['low','1–18'],['high','19–36']].forEach(([v,t])=>{const b=button(t,'pickOutside',v);if(v==='red'||v==='black')b.className=v;b.onclick=()=>choose('[data-r-type="'+v+'"]');$('jrvxPickerOutside').appendChild(b)});
  [['dozen1','1–12'],['dozen2','13–24'],['dozen3','25–36'],['col1','Колонка 1'],['col2','Колонка 2'],['col3','Колонка 3']].forEach(([v,t])=>{const b=button(t,'pickGroup',v);b.onclick=()=>choose('[data-r22-type="'+v+'"]');$('jrvxPickerGroups').appendChild(b)});
  $('jrvxPickerClose').onclick=close;$('jrvxPickerDone').onclick=close;
  panel.addEventListener('click',e=>{if(e.target===panel)close()});
  panel.addEventListener('keydown',e=>{if(e.key==='Escape'){e.preventDefault();e.stopPropagation();close();return}if(numberKey(e))return;if(e.key!=='Tab')return;const controls=[...panel.querySelectorAll('button:not(:disabled)')].filter(b=>b.tabIndex!==-1),first=controls[0],last=controls.at(-1);if(e.shiftKey&&(document.activeElement===first||!panel.contains(document.activeElement))){e.preventDefault();last?.focus()}else if(!e.shiftKey&&(document.activeElement===last||!panel.contains(document.activeElement))){e.preventDefault();first?.focus()}});
 }
 function open(){if($('rouletteSpin')?.disabled)return;ensure();restoreFocus=document.activeElement;$('jrvxRoulettePicker').hidden=false;sync();if(!numberTabStop(state()?.selection?.numbers?.[0]??0,true))$('jrvxPickerClose')?.focus()}
 function close(){const p=$('jrvxRoulettePicker');if(!p||p.hidden)return;p.hidden=true;const target=restoreFocus;restoreFocus=null;const root=$('roulette');if(root?.classList.contains('active')){if(target?.isConnected&&!target.disabled)target.focus();else if(p.contains(document.activeElement)){if(root.getAttribute('tabindex')===null)root.setAttribute('tabindex','-1');root.focus()}}else if(p.contains(document.activeElement))document.activeElement?.blur?.();}
 function sync(){
  queued=false;ensure();const root=$('roulette'),s=state();if(!root||!s)return;
  const focusedNumber=$('jrvxPickerNumbers')?.contains(document.activeElement)?document.activeElement:null;
  const busy=!!$('rouletteSpin')?.disabled,active=root.classList.contains('active'),selection=s.selection||{type:'none',numbers:[]},numbers=new Set(covered(selection));
  disable($('jrvxRoulettePickerOpen'),busy);
  if((busy||!active)&&!$('jrvxRoulettePicker')?.hidden)close();
  const amount=$('rouletteBetInput')?.value||'0',currency=root.querySelector('#jrvxRouletteCurrency .active')?.textContent||'MG';
  text($('jrvxPickerSummary'),selection.type==='none'?'Поле не выбрано':selection.label+' · '+amount+' '+currency+' · ×'+selection.mult);
  document.querySelectorAll('#jrvxRoulettePicker button[data-pick-number]').forEach(b=>{const on=numbers.has(Number(b.dataset.pickNumber));attr(b,'aria-pressed',String(on));disable(b,busy||!!source('#rouletteNumbers [data-number="'+b.dataset.pickNumber+'"]')?.disabled);});
  numberTabStop(focusedNumber?.dataset.pickNumber??rovingNumber,!!focusedNumber?.disabled&&!$('jrvxRoulettePicker').hidden);
  root.querySelectorAll('#rouletteNumbers [data-number]').forEach(b=>{const on=numbers.has(Number(b.dataset.number));attr(b,'data-jrvx-covered',String(on));attr(b,'aria-label','Число '+b.dataset.number+(on?' · входит в выбранную ставку':''));});
  document.querySelectorAll('#jrvxPickerModes button').forEach(b=>{attr(b,'aria-pressed',String(b.dataset.pickMode===s.mode));if(b.dataset.pickMode==='split')text(b,s.splitAxis==='vertical'?'Пара ↕':'Пара ↔');disable(b,busy);});
  document.querySelectorAll('#jrvxPickerOutside button,#jrvxPickerGroups button').forEach(b=>{attr(b,'aria-pressed',String((b.dataset.pickOutside||b.dataset.pickGroup)===selection.type));disable(b,busy);});
 }
 function schedule(){if(!queued){queued=true;requestAnimationFrame(sync)}}
 function boot(){sync();const root=$('roulette');if(root)new MutationObserver(schedule).observe(root,{subtree:true,childList:true,characterData:true,attributes:true,attributeFilter:['class','disabled']});document.addEventListener('jrvx-cas-identity',schedule)}
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
