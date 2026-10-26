/* source: modules/network/runtime/identity-v300.js */
(()=>{
'use strict';
const VERSION='3.0.17',$=id=>document.getElementById(id);
const state={mode:'unknown',requiresAuthentication:true,authenticated:false,user:null,ready:false,networkVerified:false,networkError:'',sessionExpiresAt:0};
const ID_RE=/^JRVX-[A-Z]{4}\d{8}$/;
let baseConnect=null,baseReconnect=null,refreshEpoch=0,refreshTimer=null,lastRefreshAt=0,authChannel=null;
let authMutation=Promise.resolve(),authGeneration=0,lastAuthIntent='',pendingLogout=null,logoutRequested=false;
const LEGACY_LOGIN_URL='https://id.jrvx.ru/?next=https%3A%2F%2Fcas.jrvx.ru%2F',CAS_OIDC_LOGIN_URL='https://cas.jrvx.ru/auth/jrvx/start';
let loginUrl=LEGACY_LOGIN_URL;
function configureLoginUrl(value){
 loginUrl=LEGACY_LOGIN_URL;
 if(typeof value!=='string'||/[\\\u0000-\u0020\u007f]/.test(value))return;
 try{const url=new URL(value);if(url.username||url.password||url.hash)return;
  if(url.href===CAS_OIDC_LOGIN_URL)loginUrl=CAS_OIDC_LOGIN_URL;
  else if(url.origin==='https://id.jrvx.ru'&&url.pathname==='/'&&(!url.search||url.searchParams.toString()==='next=https%3A%2F%2Fcas.jrvx.ru%2F'))loginUrl=url.href;
 }catch{}
}
function transport(){try{return typeof arcadeNet!=='undefined'?arcadeNet:window.arcadeNet}catch{return null}}
function stopNetwork(){
 const net=transport();if(net){net.intentionalClose=true;if(net.retry){clearTimeout(net.retry);net.retry=null}if(net.handshakeTimer){clearTimeout(net.handshakeTimer);net.handshakeTimer=null}if(net.heartbeatTimer){clearInterval(net.heartbeatTimer);net.heartbeatTimer=null}const socket=net.ws;net.ws=null;net.hello=false;net.helloAck=false;try{socket?.close(1000,'CAS session ended')}catch{}}
 try{if(window.arcadeNetState){window.arcadeNetState.connected=false;window.arcadeNetState.transportConnected=false;window.arcadeNetState.handshakeReady=false;window.arcadeNetState.poker=null;window.arcadeNetState.games={}}}catch{}
}
function clearIdentity(mode='production'){state.mode=mode;state.requiresAuthentication=true;state.authenticated=false;state.user=null;state.ready=true;state.networkVerified=false;state.networkError='';state.sessionExpiresAt=0;window.JRVXIdentity=null;stopNetwork();clearTimeout(refreshTimer);refreshTimer=null}
function publish(){installNetworkGate();installMessageGate();render();document.dispatchEvent(new Event('jrvx-cas-identity'))}
function scheduleRefresh(){clearTimeout(refreshTimer);refreshTimer=null;if(state.authenticated&&state.requiresAuthentication&&document.visibilityState!=='hidden')refreshTimer=setTimeout(()=>refresh(),60000)}
async function requestJSON(path,options={}){
 const controller=new AbortController();let timer;
 const deadline=new Promise((_,reject)=>{timer=setTimeout(()=>{controller.abort();reject(Error('account_request_timeout'))},8000)});
 try{return await Promise.race([(async()=>{const response=await fetch(path,{credentials:'same-origin',cache:'no-store',...options,signal:controller.signal});let data={};try{data=await response.json()}catch{throw Error('invalid_server_response')}return {response,data}})(),deadline])}finally{clearTimeout(timer)}
}
// Serialize locally completed cookie-changing requests. A logout intent fences
// background session checks until login; a timeout cannot prove server completion.
function queueAuthMutation(work){const task=authMutation.catch(()=>{}).then(work);authMutation=task.catch(()=>{});return task}
function render(){
 const host=document.querySelector('#poker59App .p59LobbyCard')||document.querySelector('#v69Home .v69Main');
 if(host&&!$('v300IdentityGate')){const el=document.createElement('section');el.id='v300IdentityGate';el.className='v300IdentityGate';el.innerHTML=`<div><span>JRVX ID · PRODUCTION IDENTITY</span><strong id="v300IdentityTitle">Проверка сессии…</strong><small id="v300IdentityMeta">Серверные игры используют подтверждённую личность.</small></div><div class="v300IdentityActions"><a class="btn" id="v300IdentityLogin" href="https://id.jrvx.ru/?next=https%3A%2F%2Fcas.jrvx.ru%2F" target="_blank" rel="noopener noreferrer" hidden>Войти через JRVX ID</a><button class="btn" id="v300IdentityRefresh">Проверить</button><button class="btn" id="v300IdentityLogout" hidden>Выйти</button></div>`;host.prepend(el);$('v300IdentityRefresh').onclick=()=>login('').catch(()=>refresh());$('v300IdentityLogout').onclick=logout}
 const title=$('v300IdentityTitle'),meta=$('v300IdentityMeta'),logoutBtn=$('v300IdentityLogout'),loginLink=$('v300IdentityLogin'),box=$('v300IdentityGate');
 if(!box)return;box.classList.toggle('ok',state.authenticated&&!state.networkError);box.classList.toggle('required',state.requiresAuthentication&&!state.authenticated);
 if(state.mode==='development'){title.textContent='DEVELOPMENT MODE';meta.textContent='Локальный сервер принимает тестовый JRVX ID. Для production включите JRVX_AUTH_MODE=production.'}
 else if(state.authenticated){title.textContent=state.user?.nickname||state.user?.id||'JRVX ID';meta.textContent=state.networkError?`${state.user?.id||''} · ${state.networkError}`:`${state.user?.id||''} · серверная сессия подтверждена`}
 else {title.textContent=state.mode==='offline'?'НЕТ СВЯЗИ С JRVX ID':'ТРЕБУЕТСЯ JRVX ID';meta.textContent=state.mode==='offline'?'Повторите проверку после восстановления связи.':'Серверные игры доступны после проверки JRVX ID.'}
 if(logoutBtn)logoutBtn.hidden=!state.authenticated;
 if(loginLink){loginLink.hidden=!state.requiresAuthentication||state.authenticated;loginLink.href=loginUrl;loginLink.target=loginUrl===CAS_OIDC_LOGIN_URL?'_self':'_blank'}
}
function installNetworkGate(){
 if(typeof window.arcadeNetConnect==='function'&&!window.arcadeNetConnect.__v300){baseConnect=window.arcadeNetConnect;const wrap=function(force=false){if(state.requiresAuthentication&&(!state.ready||!state.authenticated)){render();return false}state.networkVerified=false;state.networkError='';return baseConnect.call(this,force)};wrap.__v300=true;window.arcadeNetConnect=wrap}
 if(typeof window.scheduleArcadeReconnect==='function'&&!window.scheduleArcadeReconnect.__v300){baseReconnect=window.scheduleArcadeReconnect;const wrap=function(){if(state.requiresAuthentication&&(!state.ready||!state.authenticated))return false;return baseReconnect.apply(this,arguments)};wrap.__v300=true;window.scheduleArcadeReconnect=wrap}
}
function validateHello(msg){
 if(!state.requiresAuthentication){state.networkVerified=true;state.networkError='';return true}
 const expected=String(state.user?.id||''),expires=Number(msg?.sessionExpiresAt),protocol=String(msg?.protocol||''),protocolVersion=String(msg?.protocolVersion||'');
 const valid=state.authenticated&&ID_RE.test(expected)&&msg?.identityVerified===true&&String(msg?.playerId||'')===expected&&protocol==='jrvx-cas-online'&&/^v3\.0\.\d+$/.test(protocolVersion)&&Number.isFinite(expires)&&expires>Date.now();
 if(valid){state.networkVerified=true;state.networkError='';state.sessionExpiresAt=expires;render();return true}
 state.networkVerified=false;state.networkError='SERVER LINK не подтвердил JRVX ID';state.sessionExpiresAt=0;stopNetwork();render();try{window.showArcadeToast?.('JRVX ID','Серверная сессия отклонена. Перепроверьте авторизацию.','!',3600)}catch{}return false;
}
function installMessageGate(){
 if(window.__JRVXCASIdentityMessageGateV315)return;const prev=window.handleArcadeNetMessage;if(typeof prev!=='function')return;
 const wrapped=function(msg){if(msg?.type==='hello_ack'&&!validateHello(msg))return false;if(msg?.type==='session_replaced'){state.networkVerified=false;state.networkError='сессия активна в другом окне';render()}return prev.apply(this,arguments)};
 wrapped.__v315IdentityGate=true;wrapped.__base=prev;window.handleArcadeNetMessage=wrapped;window.__JRVXCASIdentityMessageGateV315=true;
}
async function refresh(){
 if(logoutRequested)return {...state};
 const epoch=++refreshEpoch;lastRefreshAt=Date.now();clearTimeout(refreshTimer);refreshTimer=null;
 try{const {response:configResponse,data:cfg}=await requestJSON('/auth/config');if(!configResponse.ok||!['development','production'].includes(cfg.mode)||cfg.mode==='production'&&cfg.remoteVerifierConfigured!==true)throw Error('auth_config_unavailable');
  const {response:me,data}=await requestJSON('/auth/me');if(epoch!==refreshEpoch)return {...state};configureLoginUrl(cfg.loginUrl);
  const development=cfg.mode==='development'&&cfg.requiresAuthentication===false;
  const authenticated=me.ok&&data.authenticated===true&&ID_RE.test(String(data.user?.id||''));
  if(!development&&!authenticated){clearIdentity(me.status>=500?'offline':'production')}
  else{const retainVerified=authenticated&&state.authenticated&&state.user?.id===data.user?.id&&state.networkVerified===true&&!state.networkError&&state.sessionExpiresAt>Date.now()&&window.arcadeNetState?.connected===true;state.mode=development?'development':'production';state.requiresAuthentication=!development;state.authenticated=authenticated;state.user=authenticated?data.user:null;state.ready=true;if(!retainVerified){state.networkVerified=false;state.networkError='';state.sessionExpiresAt=0}window.JRVXIdentity=state.user}
 }catch{if(epoch!==refreshEpoch)return {...state};clearIdentity('offline')}
 if(epoch!==refreshEpoch)return {...state};publish();scheduleRefresh();
 if((state.authenticated||state.mode==='development')&&typeof window.arcadeNetConnect==='function'&&(!window.arcadeNetState?.connected||state.requiresAuthentication&&(!state.networkVerified||state.sessionExpiresAt<=Date.now())))setTimeout(()=>{if(epoch===refreshEpoch&&(state.authenticated||state.mode==='development'))window.arcadeNetConnect(true)},80);
 return {...state}
}
function login(accessToken){
 const generation=++authGeneration;lastAuthIntent='login';
 return queueAuthMutation(async()=>{
  if(generation!==authGeneration)throw Error('auth_operation_superseded');
  try{const net=transport();if(net){net.sessionReplaced=false;net.intentionalClose=false}}catch{}
  const {response:r,data:d}=await requestJSON('/auth/login',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({accessToken:String(accessToken||'')})});
  if(!r.ok)throw new Error(d.message||d.error||'JRVX ID login failed');
  if(generation!==authGeneration)throw Error('auth_operation_superseded');
  logoutRequested=false;await refresh();
  if(generation===authGeneration)try{authChannel?.postMessage({type:'login'})}catch{}
  return d;
 });
}
function logout(){
 if(pendingLogout&&lastAuthIntent==='logout')return pendingLogout;
 const generation=++authGeneration;lastAuthIntent='logout';logoutRequested=true;
 ++refreshEpoch;clearIdentity();publish();
 const task=queueAuthMutation(async()=>{
  let ok=false;try{const {response,data}=await requestJSON('/auth/logout',{method:'POST',headers:{'content-type':'application/json'},body:'{}'});ok=response.ok&&data.ok===true}catch{}
  if(generation===authGeneration){++refreshEpoch;clearIdentity();publish()}
  try{authChannel?.postMessage({type:'logout'})}catch{}
  if(!ok){const meta=$('v300IdentityMeta');if(meta)meta.textContent='Соединение закрыто. Сервер не подтвердил выход; повторите после восстановления сети.'}
  return {ok};
 });
 pendingLogout=task;const release=()=>{if(pendingLogout===task)pendingLogout=null};task.then(release,release);
 return task;
}
function blockUnauthedOnline(e){if(!state.ready||!state.requiresAuthentication||state.authenticated)return;const t=e.target.closest?.('[data-p59-mode="online"],[data-p59-mode="friend"],#v76PeoplePlay,#p59Join');if(!t)return;const mode=window.Poker59?.state?.mode;if(t.id==='p59Join'&&mode&&!['online','friend'].includes(mode))return;e.preventDefault();e.stopImmediatePropagation();render();try{window.showArcadeToast?.('JRVX ID','Online доступен только после серверной авторизации.','!',3200)}catch{}}
function boot(){render();installNetworkGate();installMessageGate();refresh();document.addEventListener('click',blockUnauthedOnline,true);[400,1400,3200].forEach(ms=>setTimeout(()=>{render();installNetworkGate();installMessageGate()},ms));const revisit=()=>{if(document.visibilityState!=='hidden'&&Date.now()-lastRefreshAt>3000)refresh()};document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='hidden'){clearTimeout(refreshTimer);refreshTimer=null}else revisit()});window.addEventListener('pageshow',revisit);window.addEventListener('focus',revisit);window.addEventListener('online',revisit);window.addEventListener('offline',()=>{++refreshEpoch;clearIdentity('offline');publish()});try{authChannel=new BroadcastChannel('jrvx-cas-auth');authChannel.onmessage=e=>{if(e.data?.type==='logout'){++authGeneration;lastAuthIntent='logout';logoutRequested=true;++refreshEpoch;clearIdentity();publish()}else if(e.data?.type==='login'&&!pendingLogout){logoutRequested=false;refresh()}}}catch{}}
window.JRVXCASIdentityV300={version:VERSION,state:()=>({...state}),refresh,login,logout};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
;
/* source: modules/network/runtime/server-account-v300.js */
(()=>{
'use strict';
let owner='',revision={MG:-1},progressRevision=-1,historyEpoch=0,historySequence={};
const currentOwner=()=>{const auth=window.JRVXCASIdentityV300?.state?.();return auth?.authenticated?String(auth.user?.id||''):''};
async function requestSnapshot(path){
 const controller=new AbortController();let timer;
 const deadline=new Promise((_,reject)=>{timer=setTimeout(()=>{controller.abort();reject(Error('account_snapshot_timeout'))},10000)});
 try{return await Promise.race([(async()=>{const response=await fetch(path,{credentials:'same-origin',cache:'no-store',headers:{accept:'application/json'},signal:controller.signal});const data=await response.json();return {response,data}})(),deadline])}finally{clearTimeout(timer)}
}
function apply(data){
 const active=currentOwner(),id=String(data?.account?.id||data?.jrvxId||data?.playerId||'');
 if(!active||id!==active)return false;
 if(owner!==active){clearSnapshot();owner=active;revision={MG:-1};progressRevision=-1}
 const eco=window.JRVXCasEconomy||window.JVRXCasEconomy,patch={};
 for(const currency of ['MG']){
  const value=data.wallet?.[currency],version=data.walletRevision?.[currency];
  if(Number.isSafeInteger(value)&&value>=0&&Number.isSafeInteger(version)&&version>=revision[currency]){
   patch[currency.toLowerCase()]=value;revision[currency]=version;
  }
 }
 if(Object.keys(patch).length)eco?.set?.(patch);
 if(Number.isSafeInteger(data.progressVersion)&&data.progressVersion>=progressRevision&&data.progress){
  window.JRVXProgress?.apply?.(data.progress,'server-account');progressRevision=data.progressVersion;
 }
 window.JRVXCASWalletV330?.applySnapshot?.(data);
 const balance=Number(eco?.balance?.('MG'));
 if(Number.isSafeInteger(balance)&&window.arcadeNetState){window.arcadeNetState.muraTokens=balance;window.arcadeNetState.pokerTokens=balance}
 try{window.casinoRefresh?.()}catch{}
 return true;
}
async function refresh(){
 const requestedOwner=currentOwner();if(!requestedOwner)return null;
 const epoch=historyEpoch;
 try{
  // Each mutation requests a new snapshot. Joining an older in-flight request
  // could miss a commit; version checks make parallel fresh requests safe.
  const {response,data}=await requestSnapshot('/api/me');
  if(!response.ok||data.ok!==true||currentOwner()!==requestedOwner||epoch!==historyEpoch)return null;
  return apply(data)?data:null;
 }catch{return null}
}
async function history(game=''){
 if(!['','poker','blackjack','roulette'].includes(game))return null;
 const requestedOwner=currentOwner();if(!requestedOwner)return null;
 const epoch=historyEpoch,sequence=historySequence[game]=(historySequence[game]||0)+1;
 try{
  const {response,data}=await requestSnapshot('/api/history'+(game?'?game='+encodeURIComponent(game):''));
  if(!response.ok||data.ok!==true||!Array.isArray(data.history)||currentOwner()!==requestedOwner||epoch!==historyEpoch||sequence!==historySequence[game])return null;
  if(game==='roulette')window.JRVXCASV220?.roulette?.restoreHistory?.(data.history);
  return data.history;
 }catch{return null}
}
async function transactions(){
 const requestedOwner=currentOwner();if(!requestedOwner)return null;
 const epoch=historyEpoch,key='wallet-ledger',sequence=historySequence[key]=(historySequence[key]||0)+1;
 try{const {response,data}=await requestSnapshot('/api/wallet/transactions');
  if(!response.ok||data.ok!==true||!Array.isArray(data.transactions)||currentOwner()!==requestedOwner||epoch!==historyEpoch||sequence!==historySequence[key])return null;
  return data.transactions.filter(entry=>entry&&entry.currency==='MG');
 }catch{return null}
}
function clearSnapshot(){const eco=window.JRVXCasEconomy||window.JVRXCasEconomy;try{eco?.set?.({mg:0})}catch{}if(window.arcadeNetState){window.arcadeNetState.muraTokens=0;window.arcadeNetState.pokerTokens=0}try{window.JRVXProgress?.reset?.('account-reset')}catch{}try{window.casinoRefresh?.()}catch{}}
function reset(){owner='';revision={MG:-1};progressRevision=-1;historyEpoch++;historySequence={};clearSnapshot()}
window.JRVXCASServerAccount={apply,refresh,history,transactions,reset};
if(typeof document!=='undefined'){
 document.addEventListener('jrvx-cas-identity',()=>{
  const active=currentOwner();
  if(!active){reset();window.JRVXCASV220?.roulette?.restoreHistory?.([]);return}
  if(owner!==active){reset();window.JRVXCASV220?.roulette?.restoreHistory?.([]);void history('roulette')}
  void refresh();
 });
}
})();
;
