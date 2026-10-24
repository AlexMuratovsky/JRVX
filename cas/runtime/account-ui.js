/* One account entry point over the older CAS login handlers. */
(function () {
  'use strict';
  function approvedLoginPath(value, origin) {
    if (typeof value !== 'string' || /[\\\u0000-\u0020\u007f]/.test(value)) return null;
    try {
      const url = new URL(value, origin);
      return url.origin === origin && url.pathname === '/auth/jrvx/start' &&
        !url.username && !url.password && !url.search && !url.hash ? url.pathname : null;
    } catch { return null; }
  }
  async function bounded(work, milliseconds = 9000, onTimeout = () => {}) {
    let timer;
    const deadline = new Promise((_, reject) => {
      timer = setTimeout(() => { onTimeout(); reject(Error('account_timeout')); }, milliseconds);
    });
    try { return await Promise.race([Promise.resolve().then(work), deadline]); }
    finally { clearTimeout(timer); }
  }
  if (typeof module === 'object' && module.exports) module.exports = { approvedLoginPath, bounded };
  if (typeof document === 'undefined') return;
  const $ = id => document.getElementById(id);
  const triggerSelector = '#jrvxCasAccountButton,.v120AuthSingle,[data-v103-auth],#v300IdentityLogin';
  let busy = false, restoreFocus = null, queued = false, notice = '', logoutPending = false, navigationPending = false;
  const identity = () => {
    try { return window.JRVXCASIdentityV300?.state?.() || {}; } catch { return {}; }
  };
  const setText = (node, value) => { if (node && node.textContent !== value) node.textContent = value; };
  function ensurePanel() {
    if ($('jrvxCasAccountPanel')) return;
    const panel = document.createElement('div');
    panel.id = 'jrvxCasAccountPanel'; panel.className = 'jrvxAccountOverlay'; panel.hidden = true;
    panel.innerHTML = '<section class="jrvxAccountCard" role="dialog" aria-modal="true" aria-labelledby="jrvxCasAccountTitle">' +
      '<div class="jrvxAccountHead"><span>JRVX ID</span><button type="button" id="jrvxCasAccountClose" aria-label="Закрыть аккаунт">×</button></div>' +
      '<h2 id="jrvxCasAccountTitle">Ваш аккаунт CAS</h2>' +
      '<p id="jrvxCasAccountDescription"></p><p id="jrvxCasAccountIdentity"></p>' +
      '<p id="jrvxCasAccountStatus" role="status" aria-live="polite"></p>' +
      '<div class="jrvxAccountActions"><button type="button" id="jrvxCasAccountLogin" class="primary">Войти через JRVX ID</button>' +
      '<button type="button" id="jrvxCasAccountRefresh">Проверить подключение</button>' +
      '<a href="https://id.jrvx.ru/" id="jrvxCasAccountManage" target="_blank" rel="noopener noreferrer">Управление JRVX ID ↗</a>' +
      '<button type="button" id="jrvxCasAccountLogout">Выйти из CAS</button></div></section>';
    document.body.appendChild(panel);
    $('jrvxCasAccountClose').onclick = closePanel;
    $('jrvxCasAccountLogin').onclick = startLogin;
    $('jrvxCasAccountRefresh').onclick = refreshSession;
    $('jrvxCasAccountLogout').onclick = logout;
    panel.addEventListener('click', event => { if (event.target === panel && !busy) closePanel(); });
    panel.addEventListener('keydown', event => {
      if (event.key === 'Escape' && !busy) { event.preventDefault(); closePanel(); }
      if (event.key !== 'Tab') return;
      const nodes = [...panel.querySelectorAll('button,a[href]')].filter(node => !node.hidden && !node.disabled);
      const first = nodes[0], last = nodes.at(-1);
      if (!first) return;
      if (event.shiftKey && (document.activeElement === first || !panel.contains(document.activeElement))) {
        event.preventDefault(); last.focus();
      } else if (!event.shiftKey && (document.activeElement === last || !panel.contains(document.activeElement))) {
        event.preventDefault(); first.focus();
      }
    });
  }
  function sync() {
    queued = false;
    const host = document.querySelector('#v69Home .v103TopRight');
    if (host && !$('jrvxCasAccountButton')) {
      const button = document.createElement('button'); button.id = 'jrvxCasAccountButton';
      button.type = 'button'; button.className = 'jrvxAccountButton'; host.appendChild(button);
    }
    if (host) document.body.classList.add('jrvx-account-ready');
    const state = identity(), authenticated = state.authenticated === true;
    const name = authenticated ? String(state.user?.nickname || state.user?.profile?.display_name || 'Аккаунт') : 'Войти в аккаунт';
    setText($('jrvxCasAccountButton'), name);
    $('jrvxCasAccountButton')?.setAttribute('aria-haspopup', 'dialog');
    ensurePanel();
    setText($('jrvxCasAccountTitle'), authenticated ? 'Вы в JRVX CAS' : 'Войти в JRVX CAS');
    setText($('jrvxCasAccountDescription'), authenticated ? 'Сессия аккаунта подтверждена сервером.' : 'Войдите через JRVX ID. После входа вы вернётесь в CAS в этой же вкладке.');
    setText($('jrvxCasAccountIdentity'), authenticated ? String(state.user?.id || '') : '');
    setText($('jrvxCasAccountStatus'), notice || (state.mode === 'offline' ? 'Не удалось связаться с сервером. Проверьте подключение.' : state.networkError || ''));
    $('jrvxCasAccountLogin').hidden = authenticated;
    $('jrvxCasAccountManage').hidden = !authenticated;
    // Core identity clears locally before /auth/logout is confirmed. Keep its
    // retry available when that server request fails or times out.
    $('jrvxCasAccountLogout').hidden = !authenticated && !logoutPending;
    setText($('jrvxCasAccountLogout'), logoutPending && !busy ? 'Повторить выход из CAS' : 'Выйти из CAS');
    for (const id of ['jrvxCasAccountLogin', 'jrvxCasAccountRefresh', 'jrvxCasAccountLogout']) $(id).disabled = busy;
    $('jrvxCasAccountPanel').setAttribute('aria-busy', String(busy));
  }
  function queueSync() { if (!queued) { queued = true; queueMicrotask(sync); } }
  function openPanel(trigger) {
    notice = ''; sync(); restoreFocus = trigger || document.activeElement;
    $('jrvxCasAccountPanel').hidden = false;
    const target = identity().authenticated ? $('jrvxCasAccountClose') : $('jrvxCasAccountLogin');
    target.focus();
  }
  function closePanel() {
    $('jrvxCasAccountPanel').hidden = true;
    if (restoreFocus?.isConnected) restoreFocus.focus();
  }
  async function startLogin() {
    if (busy) return;
    busy = true; notice = 'Подключаем JRVX ID…'; sync();
    const controller = new AbortController();
    try {
      const config = await bounded(async () => {
        const response = await fetch('/auth/config', { credentials: 'same-origin', cache: 'no-store', headers: { accept: 'application/json' }, signal: controller.signal });
        const data = await response.json();
        if (!response.ok || data.mode !== 'production' || data.remoteVerifierConfigured !== true) throw Error('account_config_unavailable');
        return data;
      }, 9000, () => controller.abort());
      const path = approvedLoginPath(config.loginUrl, location.origin);
      if (!path) throw Error('account_login_unavailable');
      navigationPending = true;
      location.assign(path);
    } catch {
      navigationPending = false; busy = false; notice = 'Не удалось начать вход. Повторите попытку после восстановления связи.'; sync();
    }
  }
  async function refreshSession() {
    if (busy) return;
    busy = true; notice = 'Проверяем подключение…'; sync();
    try {
      if (!window.JRVXCASIdentityV300?.refresh) throw Error('identity_unavailable');
      const state = await bounded(() => window.JRVXCASIdentityV300.refresh());
      notice = state?.authenticated ? 'Аккаунт подключён.' : state?.mode === 'offline' ? 'Нет связи с сервером. Повторите проверку.' : 'Сессия CAS не найдена. Нажмите «Войти через JRVX ID».';
    } catch { notice = 'Проверка не завершилась. Повторите попытку.'; }
    finally { busy = false; sync(); }
  }
  async function logout() {
    if (busy) return;
    busy = true; logoutPending = true; notice = 'Выходим из CAS…'; sync();
    try {
      if (!window.JRVXCASIdentityV300?.logout) throw Error('identity_unavailable');
      const result = await bounded(() => window.JRVXCASIdentityV300.logout());
      if (result?.ok) logoutPending = false;
      notice = result?.ok ? 'Вы вышли из CAS.' : 'Сервер не подтвердил выход. Повторите после восстановления связи.';
    } catch { notice = 'Сервер не подтвердил выход. Повторите после восстановления связи.'; }
    finally { busy = false; sync(); }
  }
  // Window capture runs before legacy document-capture handlers and their stopImmediatePropagation.
  window.addEventListener('click', event => {
    const trigger = event.target.closest?.(triggerSelector + ',#v300IdentityRefresh');
    if (!trigger) return;
    event.preventDefault(); event.stopImmediatePropagation();
    if (trigger.id === 'v300IdentityRefresh') { void refreshSession(); return; }
    openPanel(trigger);
  }, true);
  document.addEventListener('jrvx-cas-identity', queueSync);
  window.addEventListener('pageshow', event => {
    // Back from JRVX ID can restore this document together with its JS state.
    // The old navigation no longer owns the account controls after restoration.
    if (!event.persisted || !navigationPending) return;
    navigationPending = false; busy = false; notice = ''; sync();
  });
  function boot() {
    sync();
    new MutationObserver(queueSync).observe(document.querySelector('#v69Home') || document.body, { childList: true, subtree: true });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, { once: true });
  else boot();
})();
