(()=>{
'use strict';
let owner='',sequence=0,entries=[],transactions=[],ledgerFailed=false,gameFilter='',currencyFilter='',loading=false,loaded=false,failed=false;
const games={poker:'Покер',blackjack:'Блэкджек',roulette:'Рулетка'};
const esc=value=>String(value??'').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
const currentOwner=()=>{const auth=window.JRVXCASIdentityV300?.state?.();return auth?.authenticated?String(auth.user?.id||''):''};
function ensureUI(){
 const profile=document.getElementById('v69Profile');if(!profile)return;
 const tabs=profile.querySelector('.v70ProfileTabs'),card=profile.querySelector('.v69ModalCard');
 if(tabs&&!tabs.querySelector('[data-v70-tab="history"]')){const tab=document.createElement('button');tab.className='v70ProfileTab';tab.dataset.v70Tab='history';tab.textContent='История';tabs.insertBefore(tab,tabs.querySelector('[data-v70-tab="admin"]'))}
 if(card&&!profile.querySelector('[data-v70-pane="history"]')){const pane=document.createElement('section');pane.className='v70ProfilePane v300HistoryPane';pane.dataset.v70Pane='history';pane.innerHTML='<div class="v300HistoryHead"><strong>История игр</strong><button type="button" class="v69Btn" id="v300HistoryRefresh">Обновить</button></div><div class="v328HistoryFilters"><label for="v328HistoryGame">Игра<select id="v328HistoryGame"><option value="">Все игры</option><option value="poker">Покер</option><option value="blackjack">Блэкджек</option><option value="roulette">Рулетка</option></select></label></div><div id="v300HistoryStatus" role="status" aria-live="polite"></div><ol id="v300HistoryList" aria-label="Подтверждённые результаты игр"></ol><h4>Операции MG</h4><ol id="v330WalletHistory" aria-label="Начисления и списания MG"></ol>';card.insertBefore(pane,profile.querySelector('[data-v70-pane="admin"]'))}
}
function filtered(){return entries.filter(entry=>(!gameFilter||entry.game===gameFilter)&&(entry.legacy||entry.data?.archived||entry.data?.currency==='MG'))}
function message(count){
 if(!owner)return 'Войдите через JRVX ID, чтобы загрузить историю.';
 if(loading)return 'Загрузка подтверждённых результатов…';
 if(failed)return entries.length?'Не удалось обновить историю. Показаны ранее загруженные результаты.':'Не удалось загрузить историю. Повторите после восстановления связи.';
 if(!loaded)return 'Откройте историю для загрузки результатов.';
 if(!entries.length)return gameFilter?'Завершённых игр в этом режиме пока нет.':'Завершённых игр пока нет.';
 if(!count)return `Для выбранных фильтров нет результатов среди последних ${entries.length} загруженных игр.`;
 return `Показано ${count} из ${entries.length} загруженных результатов. Только подтверждённые сервером игры.`;
}
function delta(n,exact=false){try{return (n<0?'-':n>0?'+':'')+window.JRVXCASMoneyV330[exact?'formatExact':'formatCompact'](Math.abs(n))}catch{return '—'}}
function render(){
 ensureUI();const rows=filtered(),status=document.getElementById('v300HistoryStatus'),list=document.getElementById('v300HistoryList'),game=document.getElementById('v328HistoryGame'),currency=document.getElementById('v328HistoryCurrency'),refreshButton=document.getElementById('v300HistoryRefresh');
 if(game)game.value=gameFilter;if(currency)currency.value=currencyFilter;if(refreshButton)refreshButton.disabled=loading||!owner;
 if(status)status.textContent=message(rows.length);if(!list)return;
 list.setAttribute('aria-busy',String(loading));
 list.innerHTML=rows.map(entry=>{
  const data=entry.data||{},game=Object.hasOwn(games,entry.game)?games[entry.game]:'Игра';
  const profit=Number(data.profit),currency='MG',rouletteNumber=Number(data.number),blackjackHands=Array.isArray(data.results)?data.results.length:0,detail=entry.game==='roulette'?(Number.isInteger(rouletteNumber)&&rouletteNumber>=0&&rouletteNumber<=36?`Число ${rouletteNumber}`:'Результат подтверждён'):entry.game==='blackjack'?`${blackjackHands||1} ${blackjackHands===1?'рука':'рук'}`:data.won?'Банк выигран':'Раздача завершена';
  const archived=entry.legacy||data.archived;const amount=!archived&&data.currency==='MG'&&Number.isSafeInteger(profit)?delta(profit):'';const exact=amount?delta(profit,true):'';
  const stamp=Number(entry.createdAt),date=new Date(stamp),time=entry.createdAt!=null&&entry.createdAt!==''&&stamp>0&&Number.isFinite(date.getTime())?date.toLocaleString('ru-RU'):'';
  return `<li><div><strong>${esc(game)}</strong><span>${esc(archived?'До обновления экономики':detail)}</span></div><b title="${esc(exact)}" class="${profit>0?'win':profit<0?'loss':''}">${esc(amount)}</b><time>${esc(time)}</time></li>`;
 }).join('');
 const ledger=document.getElementById('v330WalletHistory');if(ledger){const labels={daily_bonus:'Ежедневная награда',purchase:'Покупка MG',currency_migration:'Перенос средств',roulette_bet:'Ставка в рулетке',roulette_payout:'Выплата рулетки',blackjack_bet:'Ставка в блэкджеке',blackjack_payout:'Выплата блэкджека',poker_buyin:'Вход за стол',poker_cashout:'Возврат со стола'};ledger.innerHTML=transactions.map(row=>`<li><strong>${esc(labels[row.operationType]||'Операция MG')}</strong><b title="${esc(delta(row.amount,true))}">${esc(delta(row.amount))}</b><small title="${esc(window.JRVXCASMoneyV330.formatExact(row.balanceAfter))}">Баланс: ${esc(window.JRVXCASMoneyV330.formatCompact(row.balanceAfter))}</small></li>`).join('')+(ledgerFailed?'<li>Не удалось обновить операции MG. Повторите проверку связи.</li>':!transactions.length?'<li>Операций MG пока нет.</li>':'')}
}
function reset(id=''){owner=id;entries=[];transactions=[];ledgerFailed=false;gameFilter='';currencyFilter='';loading=false;loaded=false;failed=false;}
async function refresh(){
 const id=currentOwner(),epoch=++sequence;if(!id){reset();render();return}
 if(owner!==id)reset(id);
 const requestedGame=gameFilter;loading=true;failed=false;render();let history=null,ledger=null;
 try{const results=await Promise.allSettled([window.JRVXCASServerAccount?.history?.(requestedGame),window.JRVXCASServerAccount?.transactions?.()]);history=results[0].status==='fulfilled'?results[0].value:null;ledger=results[1].status==='fulfilled'?results[1].value:null}catch{}
 if(epoch!==sequence||currentOwner()!==id||gameFilter!==requestedGame)return;
 loading=false;ledgerFailed=!Array.isArray(ledger);transactions=Array.isArray(ledger)?ledger.filter(row=>row?.currency==='MG'&&Number.isSafeInteger(row.amount)&&Number.isSafeInteger(row.balanceAfter)&&row.balanceAfter>=0):transactions;
 if(Array.isArray(history)){entries=history.filter(entry=>entry&&typeof entry==='object'&&!Array.isArray(entry)).slice(0,50);loaded=true}else failed=true;
 render();
}
function boot(){
 reset(currentOwner());render();document.addEventListener('click',event=>{
  const tab=event.target.closest?.('[data-v70-tab="history"]');
  if(tab){const profile=document.getElementById('v69Profile');profile?.querySelectorAll('[data-v70-tab]').forEach(node=>node.classList.toggle('active',node===tab));profile?.querySelectorAll('[data-v70-pane]').forEach(node=>node.classList.toggle('active',node.dataset.v70Pane==='history'));void refresh()}
  else if(event.target.closest?.('#v300HistoryRefresh'))void refresh();
 });
 document.addEventListener('change',event=>{
  if(event.target?.id==='v328HistoryGame'){const next=event.target.value;if(next!==''&&!Object.hasOwn(games,next)||next===gameFilter)return;gameFilter=next;entries=[];loaded=false;void refresh()}
 });
 document.addEventListener('jrvx-cas-identity',()=>{if(currentOwner()!==owner){sequence++;reset(currentOwner());render()}if(document.querySelector('[data-v70-pane="history"].active'))void refresh()});
}
window.JRVXCASHistoryV330=window.JRVXCASHistoryV328=window.JRVXCASHistoryV300={refresh};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
