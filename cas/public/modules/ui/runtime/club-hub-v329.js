(function(){
 'use strict';
 const VERSION='v329',PREFIX='jrvxCasClubHubV329:',MODES=[
  {key:'poker',source:'v69QuickPlay',flow:'jarvis',title:'Покер с JRVX',description:'Стол один на один.',art:'poker'},
  {key:'online',source:'v76PeoplePlay',flow:'tables',title:'Покер с людьми',description:'Публичные столы и выбор комнаты.',art:'poker'},
  {key:'private',source:'v71Private',flow:'private',title:'Частный покер',description:'Закрытая комната для игры с другом.',art:'poker'},
  {key:'roulette',source:'v71Roulette',flow:'roulette',title:'Рулетка',description:'Колесо и выбор поля ставки.',art:'roulette'},
  {key:'blackjack',source:'v71Blackjack',flow:'blackjack',title:'Блэкджек',description:'Карточный стол 21.',art:'blackjack'}
 ];
 const keys=new Set(MODES.map(mode=>mode.key));
 function storageOwner(auth){
  if(auth?.requiresAuthentication===false)return'development';
  const id=auth?.authenticated===true&&typeof auth.user?.id==='string'?auth.user.id.trim():'';
  return id&&id.length<=128&&!/[\x00-\x1f\x7f]/.test(id)?'account:'+id:'';
 }
 function cleanList(list,limit){return Array.isArray(list)?[...new Set(list.filter(key=>typeof key==='string'&&keys.has(key)))].slice(0,limit):[]}
 function sanitize(raw){return raw&&typeof raw==='object'&&!Array.isArray(raw)&&raw.version===1?{version:1,favorites:cleanList(raw.favorites,MODES.length),recent:cleanList(raw.recent,3)}:{version:1,favorites:[],recent:[]}}
 if(typeof module==='object'&&module.exports)module.exports={modes:MODES.map(mode=>({...mode})),storageOwner,sanitize};
 if(typeof document==='undefined'||typeof window==='undefined')return;
 const $=id=>document.getElementById(id),controller=new AbortController(),signal=controller.signal;
 let owner='',record=sanitize(null),filter='all',notice='',storageUnavailable=false,frame=0,treeObserver=null,routeObserver=null,mountObserver=null,destroyed=false,signature='',observedHome=null,observedParent=null,observedSources=null;
 const timers=new Set();
 function auth(){try{return window.JRVXCASIdentityV300?.state?.()||null}catch{return null}}
 function currentOwner(){return storageOwner(auth())}
 function storageKey(id=owner){return id?PREFIX+encodeURIComponent(id):''}
 function read(id){if(!id)return sanitize(null);try{const raw=localStorage.getItem(storageKey(id));return sanitize(raw?JSON.parse(raw):null)}catch{storageUnavailable=true;return sanitize(null)}}
 function syncOwner(){const next=currentOwner();if(next===owner)return false;owner=next;storageUnavailable=false;record=read(owner);filter='all';notice='';signature='';return true}
 function persist(){if(!owner)return;try{localStorage.setItem(storageKey(),JSON.stringify(record));storageUnavailable=false}catch{storageUnavailable=true}}
 function target(mode){const node=$(mode.source);return typeof window.JRVXCASOpenTableFlow==='function'&&node&&typeof node.click==='function'&&!node.disabled&&node.getAttribute('aria-disabled')!=='true'?node:null}
 function element(tag,className,text){const node=document.createElement(tag);if(className)node.className=className;if(text!==undefined)node.textContent=text;return node}
 function ensure(){
  let hub=$('jrvxClubHub');if(hub)return hub;
  const home=$('v69Home'),main=home?.querySelector('.v69Main');if(!main)return null;
  hub=element('section','jrvxClubHub');hub.id='jrvxClubHub';hub.setAttribute('aria-labelledby','jrvxClubHubTitle');
  const heading=element('div','jrvxClubHubHead'),copy=element('div');copy.append(element('span','jrvxClubHubEyebrow','ВАШ КЛУБ'),element('h2','','Мои режимы'));copy.querySelector('h2').id='jrvxClubHubTitle';
  const filters=element('div','jrvxClubHubFilters');filters.setAttribute('role','group');filters.setAttribute('aria-label','Показать режимы');
  for(const [key,label]of[['all','Все режимы'],['favorites','Избранное'],['recent','Недавний выбор']]){const button=element('button','',label);button.type='button';button.dataset.clubFilter=key;button.setAttribute('aria-controls','jrvxClubHubModes');button.onclick=()=>selectFilter(key);filters.append(button)}
  heading.append(copy,filters);const status=element('p','jrvxClubHubStatus');status.id='jrvxClubHubStatus';status.setAttribute('role','status');status.setAttribute('aria-live','polite');
  const cards=element('div','jrvxClubHubModes');cards.id='jrvxClubHubModes';const help=element('p','jrvxClubHubHelp','Открытие режима не делает ставку. Выберите стол и параметры в самой игре.');
  hub.append(heading,status,cards,help);const anchor=main.querySelector('#v83ModesHub');if(anchor?.parentNode===main)main.insertBefore(hub,anchor);else main.append(hub);signature='';return hub;
 }
 function shown(){if(filter==='favorites')return MODES.filter(mode=>record.favorites.includes(mode.key));if(filter==='recent')return record.recent.map(key=>MODES.find(mode=>mode.key===key)).filter(Boolean);return MODES}
 function statusText(count){
  if(!owner)return 'Войдите через JRVX ID, чтобы открыть режимы и сохранить избранное.';
  if(notice)return notice;
  if(storageUnavailable)return 'Сохранение на устройстве недоступно. Ваш выбор сохраняется только до закрытия страницы.';
  if(!count)return filter==='favorites'?'Избранное пока пусто. Нажмите звезду рядом с нужным режимом.':'Недавних выборов пока нет. Откройте режим из каталога.';
  return filter==='favorites'?'Избранных режимов: '+count:filter==='recent'?'Последние выбранные режимы на этом устройстве.':'Все режимы клуба. Добавляйте любимые в избранное.';
 }
 function render(){
  const hub=ensure();if(!hub)return;
  const visible=shown(),availability=MODES.map(mode=>!!target(mode)),next=JSON.stringify([owner,record,filter,notice,storageUnavailable,availability]);if(next===signature)return;signature=next;
  const cards=$('jrvxClubHubModes'),previous=document.activeElement,focusRole=previous?.dataset?.clubRole,focusMode=previous?.dataset?.clubMode,hadFocus=!!cards.contains(previous);
  hub.querySelectorAll('[data-club-filter]').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.clubFilter===filter)));
  $('jrvxClubHubStatus').textContent=statusText(visible.length);cards.textContent='';
  for(const mode of visible){
   const available=!!owner&&!!target(mode),article=element('article','jrvxClubMode');article.dataset.clubArt=mode.art;
   const title=element('h3','',mode.title),description=element('p','',mode.description),actions=element('div','jrvxClubModeActions');
   const open=element('button','jrvxClubModeOpen',!owner?'Нужен JRVX ID':available?'Открыть':'Временно недоступно');open.type='button';open.disabled=!available;open.dataset.clubRole='open';open.dataset.clubMode=mode.key;open.setAttribute('aria-label','Открыть режим: '+mode.title);
   const favorite=element('button','jrvxClubModeFavorite',record.favorites.includes(mode.key)?'★':'☆');favorite.type='button';favorite.disabled=!available;favorite.dataset.clubRole='favorite';favorite.dataset.clubMode=mode.key;favorite.setAttribute('aria-pressed',String(record.favorites.includes(mode.key)));favorite.setAttribute('aria-label',(record.favorites.includes(mode.key)?'Убрать из избранного: ':'В избранное: ')+mode.title);
   // Capture the rendered owner; a click queued across account replacement
   // must only refresh the UI, never change the next account's preferences.
   const renderedOwner=owner;open.onclick=()=>choose(mode.key,renderedOwner);favorite.onclick=()=>toggleFavorite(mode.key,renderedOwner);
   actions.append(open,favorite);article.append(title,description,actions);cards.append(article);
  }
  if(hadFocus&&!previous.isConnected){const replacement=[...cards.querySelectorAll('button')].find(node=>node.dataset.clubRole===focusRole&&node.dataset.clubMode===focusMode&&!node.disabled);(replacement||hub.querySelector('[data-club-filter="'+filter+'"]'))?.focus()}
 }
 function retarget(){
  if(!treeObserver)return;const home=$('v69Home'),parent=home?.parentNode||$('v69Root'),sources=MODES.map(mode=>$(mode.source)).filter(Boolean);
  if(observedSources&&home===observedHome&&parent===observedParent&&sources.length===observedSources.length&&sources.every((node,index)=>node===observedSources[index]))return;
  observedHome=home;observedParent=parent;observedSources=sources;treeObserver.disconnect();routeObserver.disconnect();mountObserver.disconnect();
  if(home){treeObserver.observe(home,{childList:true,subtree:true});routeObserver.observe(home,{attributes:true,attributeFilter:['class']})}
  for(const node of sources)routeObserver.observe(node,{attributes:true,attributeFilter:['disabled','aria-disabled']});
  if(document.body)mountObserver.observe(document.body,{childList:true});if(parent&&parent!==document.body)mountObserver.observe(parent,{childList:true});
 }
 function sync(){if(destroyed)return;syncOwner();render();retarget()}
 function guard(expected){if(destroyed)return false;const changed=syncOwner();if(changed||expected!==undefined&&expected!==owner){render();return false}return !!owner}
 function toggleFavorite(key,expected){if(!keys.has(key)||!guard(expected)||!target(MODES.find(mode=>mode.key===key)))return false;record.favorites=record.favorites.includes(key)?record.favorites.filter(item=>item!==key):[...record.favorites,key];notice='';persist();render();return true}
 function choose(key,expected){
  if(!keys.has(key)||!guard(expected))return false;const control=target(MODES.find(mode=>mode.key===key));if(!control){notice='Режим временно недоступен. Попробуйте после обновления страницы.';render();return false}
  // The older JVRXRoutes.quickPlay immediately joins a table. Use only the
  // explicit currency/table-selection export; never invoke that legacy click.
  const mode=MODES.find(mode=>mode.key===key),requestedOwner=owner;try{window.JRVXCASOpenTableFlow(mode.flow);if(mode.flow==='roulette'||mode.flow==='blackjack'){const title=$('v69TablesScreen')?.querySelector('.v69PanelHead h2'),subtitle=$('v69TableSubtitle');if(title)title.textContent=mode.title;if(subtitle)subtitle.textContent='Шаг 1 — выберите Mura Silver или Mura Gold.'}}catch{notice='Не удалось открыть режим. Попробуйте ещё раз.';render();return false}
  if(currentOwner()!==requestedOwner){sync();return false}record.recent=[key,...record.recent.filter(item=>item!==key)].slice(0,3);notice='';persist();render();return true;
 }
 function selectFilter(next){if(!['all','favorites','recent'].includes(next)||destroyed)return false;syncOwner();filter=next;notice='';render();return true}
 function schedule(){if(destroyed||frame)return;frame=requestAnimationFrame(()=>{frame=0;sync()})}
 function boot(){
  treeObserver=new MutationObserver(mutations=>{if(mutations.some(mutation=>!mutation.target?.closest?.('#jrvxClubHub')))schedule()});routeObserver=new MutationObserver(schedule);mountObserver=new MutationObserver(schedule);sync();
  // Bounded retries cover a lobby created late by the retained application.
  // Neither body nor game surfaces are observed for attribute/class changes.
  for(const ms of [250,1000,2500,6000]){const id=setTimeout(()=>{timers.delete(id);if(!destroyed)sync()},ms);timers.add(id)}
  document.addEventListener('jrvx-cas-identity',sync,{signal});window.addEventListener('pageshow',sync,{signal});
  window.addEventListener('storage',event=>{if(owner&&currentOwner()===owner&&(event.key===null||event.key===storageKey())){try{record=sanitize(event.newValue?JSON.parse(event.newValue):null);storageUnavailable=false;notice='';signature='';render()}catch{}}},{signal});
 }
 window.JRVXCASClubHubV329={version:VERSION,sync,choose,toggleFavorite,selectFilter,diagnostics:()=>({ownerScoped:!!owner,favorites:[...record.favorites],recent:[...record.recent],filter,storageAvailable:!storageUnavailable}),destroy(){if(destroyed)return;destroyed=true;controller.abort();treeObserver?.disconnect();routeObserver?.disconnect();mountObserver?.disconnect();for(const id of timers)clearTimeout(id);timers.clear();if(frame)cancelAnimationFrame(frame);frame=0}};
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true,signal});else boot();
})();
