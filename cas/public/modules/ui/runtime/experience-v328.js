(()=>{'use strict';
const VERSION='3.0.17',KEY='jrvxCasExperienceV280';
const $=id=>document.getElementById(id),q=(s,r=document)=>r?.querySelector?.(s)||null,qa=(s,r=document)=>Array.from(r?.querySelectorAll?.(s)||[]);
const defaults={sfx:65,ambience:0,haptics:true,animations:!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches};
let settingsFocus=null;
const cardMemory=new Map();
let settings={...defaults},ctx=null,master=null,sfxGain=null,ambGain=null,ambientNodes=[],unlocked=false,lastRoute='',loadingTimer=0,routeFrame=0;
function clamp(v,a,b){return Math.max(a,Math.min(b,Number(v)||0))}
function load(){try{settings={...defaults,...JSON.parse(localStorage.getItem(KEY)||'{}')};settings.sfx=clamp(settings.sfx,0,100);settings.ambience=clamp(settings.ambience,0,100)}catch{settings={...defaults}}}
function save(){try{localStorage.setItem(KEY,JSON.stringify(settings))}catch{} applyAudio();syncUI()}
function ensureAudio(){if(ctx&&ctx.state!=='closed')return true;if(ctx){stopAmbience();ctx=null;unlocked=false}const A=window.AudioContext||window.webkitAudioContext;if(!A)return false;let next=null;try{next=new A();const m=next.createGain(),s=next.createGain(),a=next.createGain();s.connect(m);a.connect(m);m.connect(next.destination);ctx=next;master=m;sfxGain=s;ambGain=a;applyAudio();return true}catch{try{next?.close?.()?.catch?.(()=>{})}catch{}ctx=null;master=sfxGain=ambGain=null;unlocked=false;return false}}
function applyAudio(){if(!ctx)return;const now=ctx.currentTime;master.gain.setTargetAtTime(.8,now,.02);sfxGain.gain.setTargetAtTime(clamp(settings.sfx,0,100)/100,now,.02);ambGain.gain.setTargetAtTime(clamp(settings.ambience,0,100)/100*0.06,now,.04);if(settings.ambience>0&&unlocked&&!document.hidden)startAmbience();else stopAmbience()}
async function unlock(){if(unlocked&&ctx?.state==='running')return true;if(!ensureAudio())return false;const audio=ctx;try{if(audio.state==='suspended'||audio.state==='interrupted')await audio.resume();if(audio!==ctx)return false;unlocked=audio.state==='running';applyAudio();return unlocked}catch{if(audio===ctx)unlocked=false;return false}}
function tone(freq=440,dur=.05,type='sine',vol=.12,delay=0){if(!unlocked||settings.sfx<=0||!ensureAudio())return;try{const o=ctx.createOscillator(),g=ctx.createGain(),t=ctx.currentTime+delay;o.type=type;o.frequency.setValueAtTime(freq,t);g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(vol,t+.006);g.gain.exponentialRampToValueAtTime(.0001,t+dur);o.connect(g);g.connect(sfxGain);o.start(t);o.stop(t+dur+.02)}catch{}}
function play(name){if(settings.sfx<=0)return;switch(name){case'click':tone(520,.045,'triangle',.07);break;case'card':tone(320,.055,'triangle',.08);tone(470,.04,'sine',.04,.025);break;case'chip':tone(840,.045,'square',.055);tone(1160,.035,'triangle',.035,.018);break;case'roulette':tone(980,.03,'square',.035);break;case'win':[523,659,784,1047].forEach((f,i)=>tone(f,.18,'triangle',.08,i*.07));break;case'lose':tone(220,.16,'sine',.06);tone(165,.22,'sine',.05,.08);break;case'enter':tone(392,.08,'triangle',.04);tone(523,.11,'sine',.035,.045);break;default:tone(440,.045,'sine',.04)}}
function haptic(kind='tap'){if(!settings.haptics||!navigator.vibrate)return;if(navigator.userActivation&&!navigator.userActivation.hasBeenActive)return;try{navigator.vibrate(kind==='win'?[12,35,18]:kind==='chip'?[7,12,7]:8)}catch{}}
function startAmbience(){if(ambientNodes.length||!ctx||settings.ambience<=0)return;try{const f=ctx.createBiquadFilter();f.type='lowpass';f.frequency.value=180;f.Q.value=.4;f.connect(ambGain);for(const hz of [55,82.5]){const o=ctx.createOscillator(),g=ctx.createGain();o.type='sine';o.frequency.value=hz;g.gain.value=hz===55?.45:.22;o.connect(g);g.connect(f);o.start();ambientNodes.push(o,g)}ambientNodes.push(f)}catch{stopAmbience()}}
function stopAmbience(){for(const n of ambientNodes){try{if(typeof n.stop==='function')n.stop()}catch{}try{n.disconnect?.()}catch{}}ambientNodes=[]}
function burst(anchor){if(!settings.animations)return;const host=document.createElement('div');host.className='v280Burst';const r=anchor?.getBoundingClientRect?.(),x=r?(r.left+r.width/2):innerWidth/2,y=r?(r.top+r.height/2):innerHeight/2;host.style.left=x+'px';host.style.top=y+'px';for(let i=0;i<14;i++){const p=document.createElement('i');p.style.setProperty('--a',`${(360/14)*i}deg`);p.style.setProperty('--d',`${55+(i%5)*12}px`);p.style.setProperty('--delay',`${(i%4)*18}ms`);host.appendChild(p)}document.body.appendChild(host);setTimeout(()=>host.remove(),900)}
function animateCards(root=document){
 const surfaces=qa('#p59HeroCards,#p59Community,#p59Seats .p62SeatCards,#dealerCards,#playerCards',root);
 const identity=window.JRVXCASIdentityV300?.state?.(),owner=identity?.user?.id||identity?.mode||'anonymous';
 surfaces.forEach((surface,index)=>{
  const game=surface.closest('#blackjack')?'blackjack':'poker',active=surface.closest('.game')?.classList.contains('active')&&!document.hidden;
  const bj=window.JRVXCASV220?.blackjack?.state,ps=window.Poker59?.state;
  const round=owner+'|'+(game==='blackjack'?String(bj?.roundId??0)+(surface.id==='playerCards'?':'+(bj?.hand??0):''):String(ps?.server?.handNo??ps?.game?.handNo??$('p59HandNo')?.textContent??0));
  const key=surface.id||game+':seat:'+index,previous=cardMemory.get(key)||[],cards=qa('.p59Card,.playingCard',surface),next=[];let added=0;
  cards.forEach((card,i)=>{
   const face=card.classList.contains('back')?'back':card.textContent.replace(/\s+/g,''),old=previous[i];next.push({round,face});card.dataset.v280Fx='1';
   if(!settings.animations||!active){card.classList.remove('v280CardIn','jrvxCardReveal');return}
   if(old?.round===round&&old.face===face)return;
   card.classList.remove('v280CardIn','jrvxCardReveal');
   const cls=old?.round===round&&old.face==='back'&&face!=='back'?'jrvxCardReveal':'v280CardIn';
   card.style.setProperty('--v280-delay',(added++*45)+'ms');card.classList.add(cls);setTimeout(()=>card.classList.remove(cls),650);play('card');
  });
  cardMemory.set(key,next);
 });
}
function routeName(){for(const id of ['poker','blackjack','roulette']){const el=$(id);if(el&&(el.classList.contains('active')||getComputedStyle(el).display!=='none'&&document.body.classList.contains('game-mode')&&location.hash==='#'+id))return id}if($('v69Home')?.classList.contains('active'))return'home';return''}
function routeEnter(){const r=routeName();if(!r||r===lastRoute)return;lastRoute=r;const el=r==='home'?$('v69Home'):$(r);if(settings.animations&&el){el.classList.remove('v280ScreenIn');void el.offsetWidth;el.classList.add('v280ScreenIn');setTimeout(()=>el.classList.remove('v280ScreenIn'),520)}if(r!=='home'){play('enter');haptic('tap');guardLoading(r)}else hideLoading()}
function scheduleRoute(){if(routeFrame)return;routeFrame=requestAnimationFrame(()=>{routeFrame=0;routeEnter();ensureUI()})}
function guardLoading(route){clearTimeout(loadingTimer);hideLoading();loadingTimer=setTimeout(()=>{const game=$(route);if(!game||!game.classList.contains('active'))return;let ready=true;if(route==='poker')ready=!!q('#poker59App,#p59Game',game);if(route==='blackjack')ready=!!q('#bjDeal,.v66BlackjackTable',game);if(route==='roulette')ready=!!q('#rouletteCanvas,#rouletteSpin',game);if(!ready)showLoading(route)},220)}
function showLoading(route){let x=$('v280Loading');if(!x){x=document.createElement('div');x.id='v280Loading';x.className='v280Loading';x.innerHTML='<div class="v280Loader"><span></span><strong>Подготовка стола…</strong><small>JRVX CAS синхронизирует интерфейс</small></div>';document.body.appendChild(x)}x.dataset.route=route;x.classList.add('active')}
function hideLoading(){clearTimeout(loadingTimer);$('v280Loading')?.classList.remove('active')}
function observeReadiness(){const obs=new MutationObserver(()=>{const l=$('v280Loading');if(!l?.classList.contains('active'))return;const r=l.dataset.route,game=$(r);if(!game)return;const ready=r==='poker'?!!q('#poker59App,#p59Game',game):r==='blackjack'?!!q('#bjDeal,.v66BlackjackTable',game):r==='roulette'?!!q('#rouletteCanvas,#rouletteSpin',game):true;if(ready)hideLoading()});for(const id of ['poker','blackjack','roulette']){const el=$(id);if(el)obs.observe(el,{childList:true,subtree:true})}return obs}
function ensureUI(){if(!$('v280ExperienceBtn')){const b=document.createElement('button');b.id='v280ExperienceBtn';b.className='v69Btn v280ExperienceBtn';b.type='button';b.textContent='Звук';b.setAttribute('aria-label','Звук и эффекты');const top=q('#v69Home .v103TopRight')||q('.v69TopActions'),anchor=$('v69ProfileTop');if(top)top.insertBefore(b,anchor?.parentNode===top?anchor:null)}for(const g of qa('#poker .gamehead .actions,#blackjack .gamehead .actions,#roulette .gamehead .actions'))if(!q('[data-v280-settings]',g)){const b=document.createElement('button');b.className='btn v280GameSettings';b.dataset.v280Settings='1';b.textContent='Звук';g.prepend(b)}if(!$('v280Settings')){const m=document.createElement('div');m.id='v280Settings';m.className='v280Settings';m.setAttribute('aria-hidden','true');m.setAttribute('role','dialog');m.setAttribute('aria-modal','true');m.setAttribute('aria-labelledby','v280SettingsTitle');m.innerHTML=`<div class="v280SettingsCard"><div class="v280SettingsHead"><div><span>JRVX CAS EXPERIENCE</span><h3 id="v280SettingsTitle">Звук и эффекты</h3></div><button class="v280Close" id="v280Close" aria-label="Закрыть">×</button></div><label class="v280Range"><div><strong>Звуковые эффекты</strong><small>Карты, фишки, кнопки и результаты</small></div><output id="v280SfxValue">65%</output><input id="v280Sfx" type="range" min="0" max="100" step="5"></label><label class="v280Range"><div><strong>Атмосфера</strong><small>Тихий фон игровых столов</small></div><output id="v280AmbValue">0%</output><input id="v280Amb" type="range" min="0" max="100" step="5"></label><label class="v280ToggleRow"><div><strong>Haptic feedback</strong><small>Короткий отклик на поддерживаемых устройствах</small></div><input id="v280Haptic" type="checkbox"></label><label class="v280ToggleRow"><div><strong>Анимации</strong><small>Раздача карт, переходы и победные эффекты</small></div><input id="v280Animations" type="checkbox"></label><button class="v280Test" id="v280Test">Проверить звук</button></div>`;document.body.appendChild(m)}bindUI();syncUI()}
function openSettings(){settingsFocus=document.activeElement;ensureUI();$('v280Settings')?.classList.add('active');$('v280Settings')?.setAttribute('aria-hidden','false');syncUI();const focus=()=>{if($('v280Settings')?.classList.contains('active'))$('v280Close')?.focus()};requestAnimationFrame(focus);setTimeout(focus,220);void unlock().then(()=>play('click'))}
function closeSettings(){const panel=$('v280Settings');if(!panel?.classList.contains('active'))return;panel.classList.remove('active');panel.setAttribute('aria-hidden','true');if(settingsFocus?.isConnected)settingsFocus.focus();settingsFocus=null}
function bindUI(){const main=$('v280ExperienceBtn');if(main&&!main.dataset.bound){main.dataset.bound='1';main.onclick=openSettings}for(const b of qa('[data-v280-settings]'))if(!b.dataset.bound){b.dataset.bound='1';b.onclick=openSettings}const m=$('v280Settings');if(m&&!m.dataset.bound){m.dataset.bound='1';$('v280Close').onclick=closeSettings;m.addEventListener('click',e=>{if(e.target===m)closeSettings()});$('v280Sfx').oninput=e=>{settings.sfx=clamp(e.target.value,0,100);save()};$('v280Amb').oninput=e=>{settings.ambience=clamp(e.target.value,0,100);save()};$('v280Haptic').onchange=e=>{settings.haptics=!!e.target.checked;save()};$('v280Animations').onchange=e=>{settings.animations=!!e.target.checked;save()};$('v280Test').onclick=async()=>{await unlock();play('win');haptic('win');burst($('v280Test'))}}}
function syncUI(){if(!$('v280Settings'))return;$('v280Sfx').value=settings.sfx;$('v280Amb').value=settings.ambience;$('v280SfxValue').textContent=settings.sfx+'%';$('v280AmbValue').textContent=settings.ambience+'%';$('v280Haptic').checked=!!settings.haptics;$('v280Animations').checked=!!settings.animations;document.documentElement.classList.toggle('v280ReducedFx',!settings.animations)}
function clickEffects(e){const t=e.target.closest?.('button,.btn,.v69Btn,[role="button"]');if(!t||t.closest('#v280Settings')&&t.id==='v280Test')return;void unlock().then(()=>{play(t.matches('[data-bj-bet],[data-r-bet],.rouletteBet')?'chip':'click');if(t.matches('#rouletteSpin')){play('roulette');haptic('chip')}else haptic('tap')});setTimeout(()=>{routeEnter();ensureUI()},0)}
function watchResults(){
 const seen=new Map(),objects=new WeakMap();let objectSequence=0,lastOwner=null;
 const objectId=value=>{if(!value||typeof value!=='object')return'';if(!objects.has(value))objects.set(value,++objectSequence);return String(objects.get(value))};
 function owner(){const auth=window.JRVXCASIdentityV300?.state?.();return String(auth?.user?.id||auth?.mode||'anonymous')}
 function visible(game){const root=$(game);return !document.hidden&&document.visibilityState!=='hidden'&&root&&!root.hidden&&root.classList.contains('active')}
 function blackjack(){
  const state=window.JRVXCASV220?.blackjack?.state,node=$('bjMessage');
  if(!state||state.active||!state.roundId||!Array.isArray(state.hands)||!state.hands.length||state.hands.some(h=>!h||!['win','loss','push'].includes(h.outcome)))return null;
  if(state.serverOwner&&String(state.serverOwner)!==owner())return null;
  // Classes describe the total server settlement, including insurance. API
  // failures also use .loss, so require the completed-round message contract.
  if(!/^(?:Раздача завершена:|Р\d+:)/.test(node?.textContent?.trim()||''))return null;
  const kind=['win','loss','push'].find(value=>node.classList.contains(value));
  return kind?{game:'blackjack',key:'bj|'+String(state.roundId),kind,node}:null;
 }
 function roulette(){
  const state=window.JRVXCASV220?.roulette?.state,node=$('rouletteMessage'),message=node?.textContent?.trim()||'';
  if(!state?.last||state.lastOwner&&state.lastOwner!=='development'&&String(state.lastOwner)!==owner()||$('rouletteSpin')?.disabled)return null;
  const kind=/^Победа!\s*\+\d/.test(message)?'win':/^Выпало\s+\d+\s*[•·].*не сыграла/.test(message)?'loss':null;
  // Each acknowledged spin creates a new last-bet object, even when two
  // consecutive spins have identical numbers, amounts and result text.
  return kind?{game:'roulette',key:'r|'+objectId(state.last),kind,node}:null;
 }
 function poker(){
  const session=window.Poker59?.state;let state=session?.server;
  if(session?.game)try{state=session.game.state()}catch{return null}
  const me=state?.you,result=state?.lastResult;
  if(!me||!result||!Array.isArray(result.winners)||!result.winners.length)return null;
  const auth=window.JRVXCASIdentityV300?.state?.();
  if(state.authoritative&&auth?.requiresAuthentication&&String(me.id)!==owner())return null;
  const winners=result.winners.map(String),mine=winners.includes(String(me.id));
  const kind=mine?(winners.length>1?'push':'win'):'loss';
  return {game:'poker',key:'p|'+(state.roomId||objectId(session?.game)||state.tableId||'')+'|'+String(state.handNo??0),kind,node:q('#poker59App .p61WinningCombo,#poker59App .p59Result')};
 }
 function tick(initial=false){
  const currentOwner=owner();if(currentOwner!==lastOwner){lastOwner=currentOwner;seen.clear();initial=true}
  for(const result of [blackjack(),roulette(),poker()].filter(Boolean)){
   const key=currentOwner+'|'+result.key;if(seen.has(key))continue;
   seen.set(key,true);if(seen.size>120)seen.delete(seen.keys().next().value);
   // Hidden results are consumed silently, so returning to a table cannot
   // replay a celebration from the background or from a previous account.
   if(initial||!visible(result.game))continue;
   if(result.kind==='win'){
    play('win');
    // The installed Poker Pro frame already owns result vibration and its
    // table-specific haptic preference. Keep sound/art here without a second
    // vibration, including when that preference deliberately disables it.
    const pokerOwnsHaptic=result.game==='poker'&&window.__jvrxPokerFrame?.__v230===true&&typeof window.JRVXCASV230?.settings==='function';
    if(!pokerOwnsHaptic)haptic('win');burst(result.node);
   }
   else if(result.kind==='loss')play('lose');
  }
 }
 const obs=new MutationObserver(()=>tick());
 for(const el of [$('bjMessage'),$('rouletteMessage'),$('poker59App')].filter(Boolean))obs.observe(el,{childList:true,subtree:true,characterData:true,attributes:true,attributeFilter:['class','disabled']});
 document.addEventListener('jrvx-cas-identity',()=>tick());tick(true);return obs;
}
function watchCards(){let pending=false;const obs=new MutationObserver(ms=>{if(pending||!ms.some(m=>m.addedNodes.length||m.removedNodes.length))return;pending=true;requestAnimationFrame(()=>{pending=false;animateCards(document)})});for(const el of [$('poker'),$('blackjack')].filter(Boolean))obs.observe(el,{childList:true,subtree:true});animateCards();return obs}
function boot(){load();ensureUI();syncUI();const top=q('#v69Home .v69Topbar');if(top)new MutationObserver(()=>ensureUI()).observe(top,{childList:true,subtree:true});const routeObs=new MutationObserver(scheduleRoute);for(const el of [$('v69Home'),$('poker'),$('blackjack'),$('roulette')].filter(Boolean))routeObs.observe(el,{attributes:true,attributeFilter:['class','hidden','style']});observeReadiness();watchResults();watchCards();routeEnter();document.addEventListener('pointerdown',clickEffects,{capture:true,passive:true});document.addEventListener('keydown',e=>{const panel=$('v280Settings');if(!panel?.classList.contains('active'))return;if(e.key==='Escape'){e.preventDefault();closeSettings()}else if(e.key==='Tab'){const controls=qa('button:not(:disabled),input:not(:disabled)',panel),first=controls[0],last=controls[controls.length-1];if(!panel.contains(document.activeElement)){e.preventDefault();(e.shiftKey?last:first)?.focus()}else if(e.shiftKey&&document.activeElement===first){e.preventDefault();last?.focus()}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first?.focus()}}});document.addEventListener('visibilitychange',()=>{if(document.hidden)stopAmbience();else applyAudio()});window.addEventListener('pagehide',stopAmbience);window.JRVXExperience={version:VERSION,play,haptic,burst,openSettings,get settings(){return{...settings}},set(next={}){settings={...settings,...next};save()}};document.documentElement.dataset.jrvxExperience=VERSION}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
