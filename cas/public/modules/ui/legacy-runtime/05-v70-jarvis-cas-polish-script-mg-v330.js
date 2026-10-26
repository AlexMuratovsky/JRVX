(function(){
  'use strict';
  const ROOT=document.getElementById('v69Root');if(!ROOT)return;
  const ECO_KEY='jrvxCasMGDevelopmentV330',ACTIVE_KEY='jarvisCasActiveCurrencyV69';
  const $=id=>document.getElementById(id);
  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const fmt=n=>window.JRVXCASMoneyV330.formatCompact(Number.isSafeInteger(n)?n:0,{currency:false});
function eco(){return {mg:(window.JRVXCasEconomy||window.JVRXCasEconomy)?.balance?.()||0}}
function activeCur(){return 'MG'}
  function toast(title,msg){try{const el=$('v69Toast');$('v69ToastTitle').textContent=title;$('v69ToastText').textContent=msg;el.classList.add('show');clearTimeout(window.__v70Toast);window.__v70Toast=setTimeout(()=>el.classList.remove('show'),2600)}catch{}}
  function showSplash(){
    ROOT.hidden=false;ROOT.querySelectorAll('.v69Modal.active').forEach(x=>x.classList.remove('active'));
    ROOT.querySelectorAll('.v69Screen').forEach(x=>x.classList.toggle('active',x.id==='v69Splash'));
    ROOT.querySelectorAll('.v69PanelScreen').forEach(x=>x.classList.remove('active'));
    document.body.classList.remove('game-mode');document.body.style.overflow='hidden';
    document.querySelectorAll('.game').forEach(x=>x.classList.remove('active'));
    const old=$('pokerRoyaleOverlay');if(old){old.classList.remove('active');old.setAttribute('aria-hidden','true')}
    window.scrollTo(0,0);
  }
  // Splash: no CAS/JC emblem in the middle — branding is carried by the title below.
  const emblem=$('v69Splash')?.querySelector('.v69Emblem');if(emblem){emblem.textContent='♠';emblem.style.fontFamily='Georgia,serif'}
  const deniedEmblem=$('v69Denied')?.querySelector('.v69Emblem');if(deniedEmblem)deniedEmblem.textContent='♠';
  document.querySelectorAll('#v69Splash .v69SplashEyebrow,.v69LogoText span').forEach(x=>x.textContent='JRVX CAS');

  // Main headline/copy requested by the user.
  const hero=$('v69Home')?.querySelector('.v69HeroCard');
  if(hero){
    const k=hero.querySelector('.v69Kicker');if(k)k.textContent='JRVX CAS';
    const h=hero.querySelector('h1');if(h)h.innerHTML='Главное меню <span style="white-space:nowrap">JRVX <span style="color:#e7c36b">CAS</span></span>';
    const p=hero.querySelector('p');if(p)p.textContent='Все режимы в одном лобби: столы, игра один на один с JRVX, турниры, ежедневная награда, магазин, профиль, новости и дополнительные режимы.';
  }
  const quickTitle=$('v69QuickPlay')?.querySelector('h3');if(quickTitle)quickTitle.textContent='Играть с JRVX';
  const quickText=$('v69QuickPlay')?.querySelector('p');if(quickText)quickText.textContent='Сразу открыть матч один на один против JRVX.';

  // Add explicit exit-to-splash cross to the actual CAS lobby.
  const topActions=$('v69Home')?.querySelector('.v69TopActions');
  if(topActions&&!$('v70ExitSplash')){const b=document.createElement('button');b.id='v70ExitSplash';b.className='v69Btn v70ExitSplash';b.type='button';b.setAttribute('aria-label','Выйти на заставку');b.textContent='×';b.onclick=showSplash;topActions.appendChild(b)}

  // Cross on the obsolete Royale overlay also routes to splash, but the overlay stays permanently hidden.
  const legacyClose=$('prCloseBtn');if(legacyClose){legacyClose.onclick=e=>{e.preventDefault();showSplash()}}
  const legacyOverlay=$('pokerRoyaleOverlay');if(legacyOverlay){legacyOverlay.classList.remove('active');legacyOverlay.setAttribute('aria-hidden','true')}

  // Prominent currency selector on the lobby.
  const welcome=$('v69Home')?.querySelector('.v69Welcome');
  if(welcome&&!$('v70CurrencyDock')){
    const dock=document.createElement('div');dock.id='v70CurrencyDock';dock.className='v70CurrencyDock';dock.style.gridColumn='1/-1';
    dock.innerHTML='<div class="v70CurrencyDockCopy"><span>Игровая валюта</span><strong>Выберите Mura Gold</strong><small>Выбор применяется к Poker, Blackjack и Roulette. Все игровые операции выполняются в MG.</small></div><div class="v70CurrencySwitch"><button class="v70CurrencyBtn" data-v70-cur="MG"><span>Mura Gold</span><b id="v70MgDock">0 MG</b></button></div>';
    welcome.appendChild(dock);
  }
  function invokeLegacyCurrency(cur){
    const btn=document.querySelector(`#blackjack .v69GameCurrency button[data-cur="${cur}"]`)||document.querySelector(`#roulette .v69GameCurrency button[data-cur="${cur}"]`);
    if(btn)btn.click();else{try{localStorage.setItem(ACTIVE_KEY,cur)}catch{}}
    setTimeout(syncCurrencyDock,30);
  }
  function syncCurrencyDock(){const e=eco(),c=activeCur();if($('v70MgDock'))$('v70MgDock').textContent=`${fmt(e.mg)} MG`;document.querySelectorAll('[data-v70-cur]').forEach(b=>b.classList.toggle('active',b.dataset.v70Cur===c))}
  document.querySelectorAll('[data-v70-cur]').forEach(b=>b.onclick=()=>invokeLegacyCurrency(b.dataset.v70Cur));

  // Upgrade native v69 profile instead of opening the legacy MAC/MT profile.
  const profile=$('v69Profile');
  if(profile){
    const card=profile.querySelector('.v69ModalCard');
    card.innerHTML=`<div class="v69ModalHead"><div><span class="v69Kicker">JRVX CAS</span><h3>Профиль</h3></div><button class="v69Close" id="v70ProfileClose">×</button></div>
      <div class="v70ProfileHero"><div><h4 id="v70ProfileHeroName">Игрок</h4><p>ID <span id="v70ProfileHeroId">—</span> • профиль JRVX CAS</p></div><div class="v70ProfileWallets"><div class="v70ProfileWallet gold"><span>Mura Gold</span><strong id="v70ProfileMG">0 MG</strong></div></div></div>
      <div class="v70ProfileTabs"><button class="v70ProfileTab active" data-v70-tab="profile">Профиль</button><button class="v70ProfileTab" data-v70-tab="friends">Друзья</button><button class="v70ProfileTab" data-v70-tab="achievements">Достижения</button><button class="v70ProfileTab" data-v70-tab="admin">Админ-панель</button></div>
      <section class="v70ProfilePane active" data-v70-pane="profile"><div class="v70EditGrid"><div class="v70Field"><label>Никнейм</label><input id="v70Nick" maxlength="20"></div><div class="v70Field"><label>ID игрока</label><input id="v70PlayerId" inputmode="numeric"></div></div><div class="v70ProfileActions"><button class="v69Btn primary" id="v70SaveProfile">Сохранить профиль</button></div><div class="v70AdminNote">Никнейм и ID редактируются здесь. ID должен быть уникальным.</div></section>
      <section class="v70ProfilePane" data-v70-pane="friends"><div class="v70SocialAdd"><input id="v70FriendId" inputmode="text" autocapitalize="characters" placeholder="JRVX-ABCD12345678"><button class="v69Btn primary" id="v70AddFriend">Добавить в друзья</button></div><div class="v70FriendList" id="v70FriendList"></div></section>
      <section class="v70ProfilePane" data-v70-pane="achievements"><div class="v70AchievementGrid" id="v70Achievements"></div></section>
      <section class="v70ProfilePane" data-v70-pane="admin"><div id="v70AdminRoot"></div></section>`;
  }
  function profileData(){try{return window.playerProfile||playerProfile}catch{return null}}
  function developmentIdentity(){try{return window.JRVXCASIdentityV300?.state?.().mode==='development'}catch{return false}}
  function friends(){return Array.isArray(window.arcadeNetState?.friends)?window.arcadeNetState.friends:[]}
  function renderV70Profile(){
    const p=profileData()||{},e=eco(),name=p.nickname||'Игрок',id=p.playerId||'—';
    if($('v70ProfileHeroName'))$('v70ProfileHeroName').textContent=name;if($('v70ProfileHeroId'))$('v70ProfileHeroId').textContent=id;
    if($('v70Nick'))$('v70Nick').value=name;if($('v70PlayerId'))$('v70PlayerId').value=id;
    if($('v70ProfileMG'))$('v70ProfileMG').textContent=`${fmt(e.mg)} MG`;
    renderV70Friends();renderV70Achievements();renderV70Admin();
  }
  function renderV70Friends(){const host=$('v70FriendList');if(!host)return;const list=friends();host.innerHTML=list.length?list.map(f=>`<div class="v70FriendRow"><div><strong>${esc(f.nickname||'Игрок')}</strong><small>ID ${esc(f.id)} • ${f.online?'ONLINE':'offline'}</small></div><button class="v69Btn" data-v70-remove-friend="${esc(f.id)}">Удалить</button></div>`).join(''):'<div class="v70Empty">Список друзей пуст. Добавьте игрока по ID.</div>';host.querySelectorAll('[data-v70-remove-friend]').forEach(b=>b.onclick=()=>{const id=String(b.dataset.v70RemoveFriend);if(window.arcadeNetState?.connected&&typeof arcadeNetSend==='function')arcadeNetSend({type:'friend_remove',playerId:id});else if(developmentIdentity()){window.arcadeNetState.friends=friends().filter(f=>String(f.id)!==id);try{localStorage.setItem('jarvisFriendsV51',JSON.stringify(window.arcadeNetState.friends))}catch{}renderV70Friends()}else toast('Друзья','Нет соединения с сервером. Изменение не сохранено.')})}
  function renderV70Achievements(){const host=$('v70Achievements');if(!host)return;const p=profileData()||{},e=eco(),list=friends();const lastDaily=window.JRVXCASWalletV330?.diagnostics?.().daily?.claimed===true;const a=[
      {icon:'♠',name:'Добро пожаловать',desc:'Открыть JRVX CAS.',ok:true},
      {icon:'G',name:'Первое золото',desc:'Получить хотя бы 1 Mura Gold.',ok:e.mg>=1},
      {icon:'◈',name:'Daily Club',desc:'Получить ежедневную награду.',ok:!!lastDaily},
      {icon:'P',name:'Первая раздача',desc:'Сыграть первую покерную раздачу.',ok:Number(p.pokerHands||0)>=1},
      {icon:'★',name:'Победа в Poker',desc:'Одержать первую победу в покере.',ok:Number(p.pokerWins||0)>=1},
      {icon:'♥',name:'Social',desc:'Добавить первого друга.',ok:list.length>=1},
      {icon:'♛',name:'Royal Bank',desc:'Иметь 100 Mura Gold.',ok:e.mg>=100}
    ];host.innerHTML=a.map(x=>`<div class="v70Achievement ${x.ok?'unlocked':''}"><div class="v70AchievementHead"><div class="v70AchievementIcon">${x.icon}</div><strong>${x.name}</strong></div><small>${x.desc}</small><span class="v70AchievementState">${x.ok?'Открыто':'Закрыто'}</span></div>`).join('')}
  let adminSelected=null;
  function adminUsers(){try{return typeof registrySafeGet==='function'?registrySafeGet():[]}catch{return[]}}
function renderV70Admin(){window.JRVXAdminV270?.refresh?.()}
  function syncHomeProfile(){const p=profileData()||{},name=p.nickname||'Игрок',id=p.playerId||'—';['v69HeroName','v69DashName','v69LeaderboardYou'].forEach(k=>{if($(k))$(k).textContent=name});if($('v69DashId'))$('v69DashId').textContent=id;if($('v69ProfileTop'))$('v69ProfileTop').textContent=name.slice(0,2).toUpperCase()}
  document.querySelectorAll('[data-v70-tab]').forEach(b=>b.onclick=()=>{document.querySelectorAll('[data-v70-tab]').forEach(x=>x.classList.toggle('active',x===b));document.querySelectorAll('[data-v70-pane]').forEach(x=>x.classList.toggle('active',x.dataset.v70Pane===b.dataset.v70Tab));if(b.dataset.v70Tab==='admin')renderV70Admin()});
  if($('v70ProfileClose'))$('v70ProfileClose').onclick=()=>profile.classList.remove('active');
  if($('v70SaveProfile'))$('v70SaveProfile').onclick=()=>{const p=profileData();if(!p)return;const nextName=($('v70Nick').value||'Игрок').trim().slice(0,20)||'Игрок';const nextId=String($('v70PlayerId').value||p.playerId||'').replace(/\D/g,'');if(!nextId){toast('Профиль','Введите корректный ID.');return}try{if(typeof reassignCurrentProfileId==='function'&&!reassignCurrentProfileId(nextId)){toast('Профиль','Этот ID уже занят.');return}}catch{}p.nickname=nextName;p.playerId=nextId;try{if(typeof savePlayerProfile==='function')savePlayerProfile()}catch{};syncHomeProfile();renderV70Profile();toast('Профиль','Изменения сохранены.')};
  if($('v70AddFriend'))$('v70AddFriend').onclick=()=>{const p=profileData()||{},id=String($('v70FriendId').value||'').trim().toUpperCase();if(!/^JRVX-[A-Z]{4}\d{8}$/.test(id)||id===String(p.playerId)){toast('Друзья','Введите JRVX ID другого игрока.');return}if(friends().some(f=>String(f.id)===id)){toast('Друзья','Этот игрок уже в друзьях.');return}if(window.arcadeNetState?.connected&&typeof arcadeNetSend==='function')arcadeNetSend({type:'friend_add',playerId:id});else if(developmentIdentity()){window.arcadeNetState=window.arcadeNetState||{};window.arcadeNetState.friends=friends();window.arcadeNetState.friends.push({id,nickname:`Игрок ${id}`,online:false});try{localStorage.setItem('jarvisFriendsV51',JSON.stringify(window.arcadeNetState.friends))}catch{}renderV70Friends();renderV70Achievements();toast('Друзья',`Игрок ${id} добавлен.`)}else toast('Друзья','Нет соединения с сервером. Изменение не сохранено.');$('v70FriendId').value=''};

  // Profile launchers open only the new native CAS profile.
  ['v69ProfileTop','v69ProfileBtn'].forEach(id=>{const b=$(id);if(b)b.onclick=()=>{renderV70Profile();profile.classList.add('active')}});

  // Remove all legacy main-menu routes. Games always return to CAS lobby.
  syncCurrencyDock();syncHomeProfile();renderV70Profile();
})();
