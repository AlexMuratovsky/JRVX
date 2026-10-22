/* One lobby header, real presence, and stable decorative artwork hooks. */
(function () {
  'use strict';
  const art = {
    profile: '/assets/art/profile-v323.webp',
    leaderboard: '/assets/art/leaderboard-v323.webp',
    updates: '/assets/art/updates-v323.webp',
    tutorial: '/assets/art/tutorial-v323.webp',
    poker: '/assets/art/poker-v323.webp',
    roulette: '/assets/art/roulette-studio-v322.webp',
    blackjack: '/assets/art/blackjack-reference-v323.webp'
  };
  const modes = { v69QuickPlay: 'poker', v71Private: 'poker', v71Roulette: 'roulette', v71Blackjack: 'blackjack', v69Tournaments: 'leaderboard' };
  function onlineView(state = {}, connecting = false) {
    const live = state.connected === true;
    const number = typeof state.onlineCount === 'number' ? state.onlineCount : NaN;
    const count = live && Number.isFinite(number) && number >= 0 ? String(Math.floor(number)) : '—';
    return live ? { mode: 'live', label: 'Онлайн', count, meta: 'LIVE', title: count === '—' ? 'Соединение с сервером установлено.' : 'Игроков подключено к серверу: ' + count } :
      connecting ? { mode: 'connecting', label: 'Подключение', count: '—', meta: 'LINK', title: 'Устанавливаем соединение с игровым сервером.' } :
      { mode: 'offline', label: 'Нет связи', count: '—', meta: 'OFFLINE', title: 'Нет подтверждённого соединения с игровым сервером.' };
  }
  if (typeof module === 'object' && module.exports) module.exports = { onlineView };
  if (typeof document === 'undefined') return;
  const $ = id => document.getElementById(id);
  const text = (node, value) => { if (node && node.textContent !== value) node.textContent = value; };
  const attr = (node, name, value) => { if (node && node.getAttribute(name) !== value) node.setAttribute(name, value); };
  let queued = false, originalBadgeParent = null, originalBadgeNext = null, observedBadge = null;
  function mark(node, key) {
    if (!node || !art[key]) return;
    if (!node.classList.contains('jrvxArtworkCard')) node.classList.add('jrvxArtworkCard');
    attr(node, 'data-jrvx-art', key);
    const value = 'url("' + art[key] + '")';
    if (node.style.getPropertyValue('--jrvx-card-art') !== value) node.style.setProperty('--jrvx-card-art', value);
  }
  function decorate(home) {
    const pokerTitle=home.querySelector('.v83Card[data-source="v69QuickPlay"] h4');
    text(pokerTitle,'Покер с JRVX');
    const news=home.querySelector('.v69Mini[data-v69-action="news"]');
    if(news){text(news.querySelector('em'),'ОБНОВЛЕНИЕ');text(news.querySelector('p'),'Новое колесо рулетки, удобный выбор поля и обновлённый интерфейс клуба.');}
    const privateCard=home.querySelector('.v69Mini[data-v69-action="private"]');
    if(privateCard)text(privateCard.querySelector('p'),'Закрытый покерный стол для игры с другом.');
    for(const [mode,label] of [['roulette','Рулетка'],['blackjack','Блэкджек']])text(home.querySelector('.v69Mini[data-v69-action="'+mode+'"]>b'),label);
    mark($('v69ProfileBtn')?.closest('.v69Dash'), 'profile');
    mark($('v69LeaderboardBtn')?.closest('.v69Dash'), 'leaderboard');
    home.querySelectorAll('.v69Mini[data-v69-action="news"],.v101UpdateCard,.v101NewsCard').forEach(node => mark(node, 'updates'));
    home.querySelectorAll('.v69Mini[data-v69-action="learn"]').forEach(node => mark(node, 'tutorial'));
    home.querySelectorAll('.v69Mini[data-v69-action="private"]').forEach(node => mark(node, 'poker'));
    home.querySelectorAll('.v69Mini[data-v69-action="roulette"]').forEach(node => mark(node, 'roulette'));
    home.querySelectorAll('.v69Mini[data-v69-action="blackjack"]').forEach(node => mark(node, 'blackjack'));
    home.querySelectorAll('.v83Card[data-source]').forEach(node => mark(node, modes[node.dataset.source]));
  }
  function presence(home, header, active) {
    const badge = $('onlineBadge');
    if (!badge) return;
    if (!originalBadgeParent) { originalBadgeParent = badge.parentNode; originalBadgeNext = badge.nextSibling; }
    if (active && header && badge.parentNode !== header) header.insertBefore(badge, header.querySelector('.v103TopRight'));
    else if (!active && originalBadgeParent && badge.parentNode !== originalBadgeParent) {
      originalBadgeParent.insertBefore(badge, originalBadgeNext?.parentNode === originalBadgeParent ? originalBadgeNext : null);
    }
    if (observedBadge !== badge) {
      observedBadge = badge;
      new MutationObserver(schedule).observe(badge, { childList: true, subtree: true, characterData: true, attributes: true, attributeFilter: ['class'] });
    }
    // The previous founder fallback reported one player while disconnected.
    // Count only a confirmed network session; never infer presence from identity.
    const state = window.arcadeNetState || {};
    const view = onlineView(state, state.connected !== true && badge.classList.contains('connecting'));
    attr(badge, 'data-jrvx-presence', view.mode);
    attr(badge, 'role', 'status'); attr(badge, 'aria-live', 'polite'); attr(badge, 'title', view.title);
    text(badge.querySelector('span:not(.onlineBadgeDot)'), view.label);
    text($('onlinePlayersCount'), view.count); text(badge.querySelector('small'), view.meta);
    // A passive status replaces the old toast that claimed founder presence was online.
    if (badge.onclick) badge.onclick = null;
  }
  function sync() {
    queued = false;
    const home = $('v69Home'); if (!home) return;
    const active = home.classList.contains('active');
    document.body.classList.toggle('jrvx-lobby-visible', active);
    const extra = $('jrvxCasEcosystem'); if (extra) { extra.hidden = true; attr(extra, 'aria-hidden', 'true'); }
    const header = home.querySelector('.v69Topbar');
    presence(home, header, active); decorate(home);
    const account=$('jrvxCasAccountButton');
    if(account){const signed=window.JRVXCASIdentityV300?.state?.().authenticated===true;attr(account,'data-jrvx-label',signed?'Аккаунт':'Войти');attr(account,'title',account.textContent||'JRVX ID');}
    const install = $('v290InstallBtn'); if (install) attr(install, 'aria-label', 'Установить JRVX CAS');
  }
  function schedule() { if (!queued) { queued = true; requestAnimationFrame(sync); } }
  function boot() {
    sync();
    const home = $('v69Home');
    if (home) {
      new MutationObserver(schedule).observe(home, { childList: true, subtree: true });
      new MutationObserver(schedule).observe(home, { attributes: true, attributeFilter: ['class'] });
    }
    document.addEventListener('jrvx-cas-identity', schedule);
    window.addEventListener('pageshow', schedule);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, { once: true }); else boot();
})();
