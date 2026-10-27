(()=>{
'use strict';
window.JRVXCASConnectionV329?.destroy?.();
const controller=new AbortController(),signal=controller.signal,ownedButtons=new Set();
const $=id=>document.getElementById(id);
let destroyed=false,pageSuspended=false,pollTimer=0,panel=null,request=null,feedback='',checkedAt=0,lastOwner='';
let gameId='',gameFeedback='',gameRequest=null;
const gameNames={blackjack:'Блэкджек',roulette:'Рулетка'};
function gameAPI(){return gameNames[gameId]?window.JRVXCASV220?.[gameId]:null}
function gameState(){let result={};try{result=gameAPI()?.recoveryState?.()||{}}catch{}return {id:gameId,title:gameNames[gameId]||'',busy:!!gameRequest||result.busy===true,pending:result.pending===true,available:result.available===true,feedback:gameFeedback}}
const visible=()=>!pageSuspended&&!document.hidden&&document.visibilityState!=='hidden';
function authState(){try{return window.JRVXCASIdentityV300?.state?.()||null}catch{return null}}
function ownerKey(){const auth=authState();return auth?.authenticated&&auth.user?.id?String(auth.user.id):''}
function state(){
 const auth=authState(),net=window.arcadeNetState||{},online=navigator.onLine!==false,local=auth?.requiresAuthentication===false;
 const ready=auth?.ready===true,authenticated=auth?.authenticated===true&&!!auth.user?.id;
 let kind='connecting',title='Подключаемся',detail='Ждём подтверждения игрового сервера.';
 if(!online){kind='offline';title='Нет интернета';detail='Проверьте подключение к интернету. После восстановления связи проверьте состояние игры.'}
 else if(!ready){kind='checking';title='Проверяем вход';detail='Дождитесь проверки аккаунта перед серверной игрой.'}
 else if(!local&&!authenticated){kind='auth';title='Нужен вход';detail='Войдите через кнопку аккаунта, чтобы пользоваться серверными играми.'}
 else if(!local&&(auth.networkVerified===false||auth.networkError)){kind='connecting';title='Подключаемся';detail='Ждём подтверждения входа игровым сервером.'}
 else if(net.connected===true&&net.handshakeReady===true){kind='confirmed';title='Соединение подтверждено';detail='Игровой сервер подтвердил соединение. Состояние конкретной игры проверяется за её столом.'}
 else if(local&&!net.transportConnected&&!net.connected){kind='local';title='Локальный режим';detail='Локальные игры доступны. Соединение с игровым сервером пока не подтверждено.'}
 else if(net.transportConnected!==true){kind='disconnected';title='Нет связи с сервером';detail='Проверка связи обновит состояние аккаунта. Незавершённые игровые действия проверяйте за столом.'}
 const currentFeedback=feedback==='Соединение подтверждено.'&&kind!=='confirmed'?'':feedback;
 return {kind,title,detail,online,ready,authenticated,local,confirmed:kind==='confirmed',busy:!!request,
  game:gameState(),
  account:!ready?'Проверяется':local?'Локальный режим':authenticated?'Подтверждён':'Нужен вход',
  server:kind==='confirmed'?'Подтверждён':kind==='auth'||kind==='checking'?'Ожидает входа':kind==='offline'?'Нет связи':'Не подтверждён',feedback:currentFeedback,checkedAt};
}
function text(node,value){if(node&&node.textContent!==value)node.textContent=value}
function attribute(node,key,value){if(node&&node.getAttribute(key)!==value)node.setAttribute(key,value)}
function ensurePanel(){
 if(panel)return panel;
 panel=document.createElement('div');panel.id='jrvxConnectionPanelV329';panel.className='jrvxPanelV329 jrvxConnectionPanelV329';panel.hidden=true;
 panel.innerHTML='<section class="jrvxPanelCardV329 jrvxConnectionCardV329" role="dialog" aria-modal="true" aria-labelledby="jrvxConnectionTitleV329" aria-describedby="jrvxConnectionDetailV329"><header class="jrvxPanelHeadV329"><h2 id="jrvxConnectionTitleV329">Связь с игрой</h2><button type="button" id="jrvxConnectionCloseV329" class="jrvxPanelCloseV329" data-jrvx-panel-close aria-label="Закрыть проверку связи">×</button></header><p id="jrvxConnectionStateV329" class="jrvxConnectionStateV329" role="status" aria-live="polite"></p><p id="jrvxConnectionDetailV329" class="jrvxConnectionDetailV329"></p><dl class="jrvxConnectionFactsV329"><div><dt>Интернет</dt><dd id="jrvxConnectionInternetV329"></dd></div><div><dt>Аккаунт</dt><dd id="jrvxConnectionAccountV329"></dd></div><div><dt>Игровой сервер</dt><dd id="jrvxConnectionServerV329"></dd></div></dl><p id="jrvxConnectionNoteV332" class="jrvxConnectionNoteV329">Проверка связи не подтверждает результат незавершённой игры. Если результат не пришёл, вернитесь к столу и следуйте сообщению игры.</p><button type="button" id="jrvxConnectionRetryV329" class="v69Btn jrvxConnectionRetryV329">Проверить связь</button><p id="jrvxConnectionFeedbackV329" class="jrvxConnectionFeedbackV329" role="status" aria-live="polite"></p><section id="jrvxConnectionGameV332" class="jrvxConnectionGameV332" hidden aria-labelledby="jrvxConnectionGameTitleV332"><h3 id="jrvxConnectionGameTitleV332"></h3><p class="jrvxConnectionDetailV329">Проверка читает состояние с сервера. Ставка или игровое действие повторно не отправляются.</p><button type="button" id="jrvxConnectionGameCheckV332" class="v69Btn jrvxConnectionRetryV329">Проверить состояние игры</button><p id="jrvxConnectionGameFeedbackV332" class="jrvxConnectionFeedbackV329" role="status" aria-live="polite"></p></section></section>';
 document.body.appendChild(panel);return panel;
}
function ensureButtons(){
 for(const button of ownedButtons)if(!button.isConnected)ownedButtons.delete(button);
 const lobby=document.querySelector('#v69Home .v103TopRight'),poker=document.querySelector('#p59Game .p59GameBtns')||document.querySelector('#poker .p59GameBtns');
 const hosts=new Set([...(lobby?[lobby]:[]),...document.querySelectorAll('.gamehead .actions'),...(poker?[poker]:[])]);
 for(const host of hosts){
  if(host.querySelector('[data-jrvx-connection-open]'))continue;
  const button=document.createElement('button');button.type='button';button.className='jrvxConnectionButtonV329'+(host===lobby?' v69Btn':' jrvxGameUtilityV329');button.setAttribute('data-jrvx-connection-open','');button.setAttribute('aria-haspopup','dialog');button.setAttribute('aria-controls','jrvxConnectionPanelV329');
  button.innerHTML='<span class="jrvxConnectionDotV329" aria-hidden="true"></span><span class="jrvxConnectionLabelV329">Связь</span>';
  host.appendChild(button);ownedButtons.add(button);
 }
}
function render(){
 if(destroyed)return;
 const view=state();
 for(const button of ownedButtons){attribute(button,'data-connection',view.kind);attribute(button,'aria-label','Связь: '+view.title);attribute(button,'title','Связь: '+view.title);button.disabled=!window.JRVXCASPanelsV329?.open;}
 if(!panel)return;
 attribute(panel,'data-connection',view.kind);text($('jrvxConnectionStateV329'),view.title);text($('jrvxConnectionDetailV329'),view.detail);
 text($('jrvxConnectionInternetV329'),view.online?'Доступен':'Нет связи');text($('jrvxConnectionAccountV329'),view.account);text($('jrvxConnectionServerV329'),view.server);
 const retry=$('jrvxConnectionRetryV329');if(retry){retry.disabled=view.busy||!view.online;text(retry,view.busy?'Проверяем…':'Проверить связь')}
 const game=view.game,section=$('jrvxConnectionGameV332'),gameCheck=$('jrvxConnectionGameCheckV332');
 if(section)section.hidden=!game.title;
 text($('jrvxConnectionNoteV332'),game.title?'Проверка связи обновляет подключение и аккаунт. Для результата ставки используйте отдельную кнопку ниже.':'Проверка связи не подтверждает результат незавершённой игры. Если результат не пришёл, вернитесь к столу и следуйте сообщению игры.');
 text($('jrvxConnectionGameTitleV332'),game.title);
 if(gameCheck){gameCheck.disabled=game.busy||!view.online||!game.available;text(gameCheck,game.busy?'Проверяем состояние…':'Проверить состояние игры')}
 text($('jrvxConnectionGameFeedbackV332'),game.feedback);
 text($('jrvxConnectionFeedbackV329'),view.feedback);attribute($('jrvxConnectionFeedbackV329'),'data-tone',view.feedback==='Соединение подтверждено.'?'ok':'');
}
function stopPoll(){if(pollTimer){clearTimeout(pollTimer);pollTimer=0}}
function schedulePoll(){stopPoll();if(destroyed||!visible())return;pollTimer=setTimeout(()=>{pollTimer=0;sync()},2500)}
function sync(){if(destroyed)return;ensureButtons();render();schedulePoll()}
function open(opener=document.activeElement){
 if(destroyed||!window.JRVXCASPanelsV329?.open)return false;
 const next=['blackjack','roulette'].find(id=>opener?.closest?.('#'+id)||$(id)?.classList?.contains?.('active'))||'';
 if(next!==gameId){cancelGame('route');gameId=next;gameFeedback=''}
 ensurePanel();render();return window.JRVXCASPanelsV329.open(panel,{opener,initialFocus:$('jrvxConnectionCloseV329'),onClose:()=>cancelGame('closed')})!==false;
}
function current(context){return !destroyed&&request===context&&!context.cancelled}
function cancel(reason){if(!request||request.cancelled)return;request.cancelled=true;request.rejectCancel?.(Error(reason))}
function recover(){
 if(destroyed||!visible())return Promise.resolve(false);
 if(request)return request.promise;
 if(navigator.onLine===false){feedback='Сначала восстановите подключение к интернету.';render();return Promise.resolve(false)}
 const identity=window.JRVXCASIdentityV300;
 if(typeof identity?.refresh!=='function'){feedback='Проверка пока недоступна. Попробуйте ещё раз чуть позже.';render();return Promise.resolve(false)}
 const context={owner:ownerKey(),cancelled:false,timer:0,promise:null,rejectCancel:null};request=context;feedback='';render();
 const cancelled=new Promise((_,reject)=>{context.rejectCancel=reject;context.timer=setTimeout(()=>reject(Error('timeout')),12000)});
 const operation=Promise.resolve().then(async()=>{
  await identity.refresh();if(!current(context))return false;
  const owner=ownerKey();if(context.owner&&owner!==context.owner){context.cancelled=true;return false}context.owner=owner;
  if(owner&&typeof window.JRVXCASServerAccount?.refresh==='function'){await window.JRVXCASServerAccount.refresh();if(!current(context)||ownerKey()!==owner)return false}
  return true;
 });
 context.promise=(async()=>{
  try{
   const completed=await Promise.race([operation,cancelled]);if(!current(context))return false;
   checkedAt=Date.now();const view=state();feedback=view.confirmed?'Соединение подтверждено.':view.kind==='auth'?'Для серверной игры нужен вход в аккаунт.':completed?'Проверка завершена. Дождитесь подтверждения сервера или попробуйте ещё раз.':'Связь пока не подтверждена. Попробуйте ещё раз.';
   return view.confirmed;
  }catch(error){if(current(context))feedback=error?.message==='timeout'?'Проверка заняла слишком долго. Попробуйте ещё раз.':'Не удалось проверить связь. Попробуйте после восстановления соединения.';return false}
  finally{context.cancelled=true;clearTimeout(context.timer);if(request===context)request=null;if(!destroyed)sync()}
 })();return context.promise;
}
function cancelGame(reason){
 const context=gameRequest;if(!context||context.cancelled)return;
 context.cancelled=true;context.api.cancelRecovery?.();context.rejectCancel?.(Error(reason));
}
function checkGame(){
 if(destroyed||!visible())return Promise.resolve(false);
 if(gameRequest)return gameRequest.promise;
 const api=gameAPI(),owner=ownerKey();
 if(!gameNames[gameId]||typeof api?.recover!=='function')return Promise.resolve(false);
 if(navigator.onLine===false){gameFeedback='Сначала восстановите подключение к интернету.';render();return Promise.resolve(false)}
 if(!owner){gameFeedback='Войдите через JRVX ID для проверки игры.';render();return Promise.resolve(false)}
 const context={api,owner,game:gameId,cancelled:false,timer:0,promise:null,rejectCancel:null,restoreFocus:document.activeElement===$('jrvxConnectionGameCheckV332')};gameRequest=context;gameFeedback='';render();
 const current=()=>!destroyed&&!context.cancelled&&gameRequest===context&&context.owner===ownerKey()&&context.game===gameId&&visible();
 const cancelled=new Promise((_,reject)=>{context.rejectCancel=reject;context.timer=setTimeout(()=>{context.api.cancelRecovery?.();reject(Error('timeout'))},12000)});
 const operation=Promise.resolve().then(()=>current()?api.recover():null);
 context.promise=(async()=>{
  try{
   const result=await Promise.race([operation,cancelled]);if(!current())return false;
   gameFeedback=typeof result?.detail==='string'?result.detail:'Не удалось получить состояние игры. Попробуйте ещё раз.';
   return ['confirmed','updated','idle'].includes(result?.status);
  }catch(error){if(current())gameFeedback=error?.message==='timeout'?'Проверка заняла слишком долго. Сохранённый запрос не изменён.':'Не удалось получить состояние игры. Сохранённый запрос не изменён.';return false}
  finally{const restore=context.restoreFocus&&current()&&panel&&!panel.hidden;context.cancelled=true;clearTimeout(context.timer);if(gameRequest===context)gameRequest=null;if(!destroyed)sync();if(restore&&(!document.activeElement||document.activeElement===document.body)){$('jrvxConnectionGameCheckV332')?.focus();$('jrvxConnectionGameFeedbackV332')?.scrollIntoView?.({block:'nearest'})}}
 })();return context.promise;
}

function identityChanged(){const owner=ownerKey();if(owner!==lastOwner){lastOwner=owner;feedback='';gameFeedback='';cancelGame('identity');checkedAt=0;if(request?.owner&&request.owner!==owner)cancel('identity')}sync()}
function pause(){pageSuspended=true;stopPoll();cancel('hidden');cancelGame('hidden')}
function resume(){pageSuspended=false;sync()}
function boot(){
 if(destroyed)return;lastOwner=ownerKey();sync();
 document.addEventListener('click',event=>{const trigger=event.target.closest?.('[data-jrvx-connection-open]');if(trigger){event.preventDefault();open(trigger);return}if(event.target.closest?.('#jrvxConnectionGameCheckV332')){event.preventDefault();void checkGame();return}if(event.target.closest?.('#jrvxConnectionRetryV329')){event.preventDefault();void recover()}},{signal});
 document.addEventListener('jrvx-cas-identity',identityChanged,{signal});
 document.addEventListener('visibilitychange',()=>{if(document.hidden||document.visibilityState==='hidden')pause();else resume()},{signal});
 window.addEventListener('online',sync,{signal});window.addEventListener('offline',()=>{cancel('offline');cancelGame('offline');sync()},{signal});
 window.addEventListener('pageshow',resume,{signal});window.addEventListener('pagehide',pause,{signal});
}
window.JRVXCASConnectionV329={version:'v332',open,recover,checkGame,sync,state,destroy(){if(destroyed)return;destroyed=true;controller.abort();stopPoll();cancel('destroyed');cancelGame('destroyed');if(panel){window.JRVXCASPanelsV329?.close?.(panel);panel.remove();panel=null}for(const button of ownedButtons)button.remove();ownedButtons.clear()}};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true,signal});else boot();
})();
