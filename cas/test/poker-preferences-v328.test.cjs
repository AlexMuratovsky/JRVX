const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
// Published Pro baseline: 28,723 bytes, SHA-256
// ff5fef4a64f9460282cc2db5d17f329bd2e5d395f54567d727b73c224396e338.
const proSource = fs.readFileSync(path.join(__dirname, '../public/modules/poker/runtime/poker-pro-v328.js'), 'utf8');
const experienceSource = fs.readFileSync(path.join(__dirname, '../public/modules/ui/runtime/experience-v328.js'), 'utf8');

function fixture({ global = {}, local = {}, reducedMotion = false, activated = true } = {}) {
  const nodes = new Map(), events = { document: new Map(), window: new Map() }, mqls = new Map(), vibrations = [], vibrationCalls = [], requests = [], actions = [];
  const records = new Map([
    ['jrvxCasExperienceV280', JSON.stringify(global)], ['jrvxCasPokerSettingsV230', JSON.stringify(local)]
  ]);
  const listen = (surface, type, fn) => { if (!events[surface].has(type)) events[surface].set(type, []); events[surface].get(type).push(fn); };
  const fire = (surface, type) => { for (const fn of events[surface].get(type) || []) fn(new Event(type)); };
  function node(id) {
    if (!nodes.has(id)) {
      const classes = new Set(id === 'poker' ? ['active'] : []);
      const value = { id, value: '', checked: false, dataset: {}, disabled: false, hidden: false, isConnected: true, textContent: '', style: { setProperty() {} }, attributes: {},
        querySelector(selector) { return id === 'p230Confirm' && selector === 'h3' ? node('p230ConfirmTitle') : null; },
        querySelectorAll() { return id === 'p230Confirm' ? [node('p230AllInCancel'), node('p230AllInOk')].filter(control => !control.disabled) : []; },
        addEventListener() {},
        getClientRects() { return !this.isConnected || this.hidden || id.startsWith('p230AllIn') && !node('p230Confirm').classList.contains('active') ? [] : [{ width: 100, height: 40 }]; },
        focus() { if (!this.disabled && this.getClientRects().length) document.activeElement = this; },
        blur() { if (document.activeElement === this) document.activeElement = document.body; },
        contains(target) { return target === this || id === 'p230Confirm' && ['p230AllInCancel', 'p230AllInOk', 'p230ConfirmTitle', 'p230ConfirmText'].includes(target?.id) || id === 'p230Drawer' && ['p230SettingsClose', 'p230Haptic', 'p230ConfirmAllIn'].includes(target?.id); },
        closest(selector) {
          if (selector === '[aria-modal="true"]') {
            if (this.getAttribute('aria-modal') === 'true') return this;
            if (id.startsWith('p230AllIn')) return node('p230Confirm');
            if (id === 'v280Close') return node('v280Settings');
          }
          return selector.split(',').some(part => part.trim() === '#' + id) ? this : null;
        },
        setAttribute(name, value) { this.attributes[name] = value; }, getAttribute(name) { return this.attributes[name] ?? null; },
        click() {
          if (this.disabled) return;
          const event = { target: this, type: 'click', defaultPrevented: false, stopped: false,
            preventDefault() { this.defaultPrevented = true; }, stopImmediatePropagation() { this.stopped = true; } };
          for (const fn of events.window.get('click') || []) { fn(event); if (event.stopped) return event; }
          this.onclick?.(event);
          for (const fn of events.document.get('click') || []) { fn(event); if (event.stopped) break; }
          return event;
        },
        classList: { add: (...names) => names.forEach(name => classes.add(name)),
          remove: (...names) => names.forEach(name => classes.delete(name)), contains: name => classes.has(name),
          toggle(name, force = !classes.has(name)) { if (force) classes.add(name); else classes.delete(name); return force; } } };
      nodes.set(id, value);
    }
    return nodes.get(id);
  }
  const document = { readyState: 'loading', hidden: false, visibilityState: 'visible', documentElement: node('html'), body: node('body'),
    getElementById: node, querySelector: () => null, querySelectorAll: () => [],
    addEventListener: (type, fn) => listen('document', type, fn), dispatchEvent(event) { fire('document', event.type); return true; } };
  document.activeElement = document.body;
  const navigator = { userActivation: { hasBeenActive: activated }, vibrate(value) {
    vibrationCalls.push(value);
    // Zero cancels an existing vibration; retain that call without counting it as feedback.
    if (Array.isArray(value) ? value.some(ms => ms > 0) : value > 0) vibrations.push(value);
    return true;
  } };
  const state = { authoritative: true, active: true, roomId: 'room-1', tableId: '1-2', mode: 'online', currency: 'MS',
    handNo: 1, revision: 1, street: 'flop', turnSeat: 0, currentBet: 0, minRaiseTo: 2, pot: 4,
    you: { id: 'JRVX-AAAA11111111', seat: 0, yourTurn: true, stack: 98, bet: 0, toCall: 0 } };
  const window = { addEventListener: (type, fn) => listen('window', type, fn),
    matchMedia(query) {
      if (!mqls.has(query)) mqls.set(query, { matches: query === '(prefers-reduced-motion: reduce)' && reducedMotion,
        listeners: [], addEventListener(type, fn) { if (type === 'change') this.listeners.push(fn); } });
      return mqls.get(query);
    },
    Poker59Core: { tableById: () => ({ min: 20 }) }, Poker59: { state: { server: state, game: null }, showLobby() {}, render() {} },
    arcadeNetState: { connected: true },
    JRVXCASIdentityV300: { state: () => ({ requiresAuthentication: true, authenticated: true, user: { id: state.you.id } }) },
    JRVXCasEconomy: { get: () => ({ currency: 'MS' }), balance: () => 1000, set() { throw Error('Preferences must not change balances'); } }
  };
  const context = vm.createContext({ window, document, navigator, console, Event, innerWidth: 1100, innerHeight: 820,
    getComputedStyle: () => ({ display: 'none' }), location: { hash: '' },
    setTimeout: () => 1, clearTimeout() {}, requestAnimationFrame: () => 1, cancelAnimationFrame() {},
    MutationObserver: class { observe() {} disconnect() {} },
    localStorage: { getItem: key => records.get(key) ?? null, setItem: (key, value) => records.set(key, value), removeItem: key => records.delete(key) },
    fetch(...args) { requests.push(args); throw Error('Preference tests must never perform network operations'); }
  });
  // Actual static script order: Pro publishes its API first; Experience boots later.
  vm.runInContext(proSource, context); vm.runInContext(experienceSource, context); fire('document', 'DOMContentLoaded');
  node('p59Raise').onclick = () => actions.push({ handNo: state.handNo, owner: state.you.id, amount: Number(node('p59Bet').value) });
  vibrations.length = 0; vibrationCalls.length = 0;
  return { node, window, document, navigator, records, vibrations, vibrationCalls, requests, actions,
    frame(patch = {}) { Object.assign(state, patch); window.__jvrxPokerFrame(state); },
    nextHand(patch = {}) { state.handNo++; state.revision++; Object.assign(state, patch); window.__jvrxPokerFrame(state); },
    visibility(hidden) { document.hidden = hidden; document.visibilityState = hidden ? 'hidden' : 'visible'; fire('document', 'visibilitychange'); },
    motion(value) { const mql = window.matchMedia('(prefers-reduced-motion: reduce)'); mql.matches = value; for (const fn of mql.listeners) fn({ matches: value }); },
    setLocalHaptic(value) { node('p230Haptic').onchange({ target: { checked: value } }); },
    openConfirm() { node('p59Bet').value = '98'; node('p59Raise').focus(); node('p59Raise').click(); },
    key(key, shiftKey = false) {
      const event = { key, shiftKey, target: document.activeElement, defaultPrevented: false, stopped: false,
        preventDefault() { this.defaultPrevented = true; }, stopImmediatePropagation() { this.stopped = true; } };
      for (const fn of events.window.get('keydown') || []) { fn(event); if (event.stopped) return event; }
      for (const fn of events.document.get('keydown') || []) { fn(event); if (event.stopped) break; }
      return event;
    }
  };
}

test('PokerPro respects the actual Experience global haptics opt-out', () => {
  const f = fixture({ global: { haptics: false } }); f.frame();
  assert.equal(typeof f.window.JRVXExperience.allows, 'function');
  assert.deepEqual(f.vibrations, []);
  assert.equal(f.window.JRVXCASV230.settings().haptic, true, 'Global preferences must not overwrite the local checkbox');
});

test('turn/result haptics keep their existing patterns and deduplication when both settings allow them', () => {
  const f = fixture(); f.frame(); f.frame();
  assert.deepEqual(f.vibrations, [12]);
  f.nextHand({ you: { id: 'JRVX-AAAA11111111', seat: 0, yourTurn: false, stack: 98, bet: 0 },
    lastResult: { text: 'Confirmed winner', winners: ['JRVX-AAAA11111111'] } });
  assert.deepEqual(f.vibrations, [12, 30]); assert.equal(f.requests.length, 0);
});

test('the local poker haptic opt-out still takes priority when global haptics are enabled', () => {
  const f = fixture(); f.setLocalHaptic(false); f.frame();
  assert.deepEqual(f.vibrations, []); assert.equal(f.window.JRVXExperience.settings.haptics, true);
});

test('global haptic preference changes affect the next real poker frame without recreating the table', () => {
  const f = fixture(); f.window.JRVXExperience.set({ haptics: false }); f.frame();
  assert.deepEqual(f.vibrations, []);
  assert.ok(f.vibrationCalls.includes(0), 'The actual Experience API cancels an already-running pattern');
  f.window.JRVXExperience.set({ haptics: true }); f.nextHand();
  assert.deepEqual(f.vibrations, [12]);
  assert.equal(f.window.JRVXCASV230.settings().haptic, true);
});

test('hidden poker frames never vibrate and visible frames retain their normal feedback', () => {
  const f = fixture(); f.visibility(true); f.frame(); assert.deepEqual(f.vibrations, []);
  assert.ok(f.vibrationCalls.includes(0));
  f.visibility(false); f.nextHand(); assert.deepEqual(f.vibrations, [12]);
});

test('PokerPro waits for user activation before invoking device vibration', () => {
  const f = fixture({ activated: false }); f.frame(); assert.deepEqual(f.vibrations, []);
  f.navigator.userActivation.hasBeenActive = true; f.nextHand(); assert.deepEqual(f.vibrations, [12]);
});

test('the older Experience settings API remains a supported haptics fallback', () => {
  const f = fixture(); delete f.window.JRVXExperience.allows; f.window.JRVXExperience.set({ haptics: false }); f.frame();
  assert.deepEqual(f.vibrations, []);
  f.window.JRVXExperience.set({ haptics: true }); f.nextHand(); assert.deepEqual(f.vibrations, [12]);
});

test('missing Experience or vibration support retains the compatible local preference behavior', () => {
  const f = fixture(); delete f.window.JRVXExperience; f.frame(); assert.deepEqual(f.vibrations, [12]);
  delete f.navigator.vibrate; assert.doesNotThrow(() => f.nextHand()); assert.equal(f.requests.length, 0);
});

test('global animation suppression remains with Experience while the local fast option is preserved', () => {
  const f = fixture({ global: { animations: false }, local: { fastAnimations: true } });
  assert.equal(f.document.documentElement.classList.contains('v280ReducedFx'), true);
  assert.equal(f.node('poker59App').classList.contains('v230-fast'), true);
  assert.equal(f.window.JRVXCASV230.settings().fastAnimations, true);
  f.window.JRVXExperience.set({ animations: true });
  assert.equal(f.document.documentElement.classList.contains('v280ReducedFx'), false);
  assert.equal(f.node('poker59App').classList.contains('v230-fast'), true);
});

test('OS reduced motion remains effective without overwriting the local poker speed preference', () => {
  const f = fixture({ global: { animations: true }, local: { fastAnimations: true } });
  f.motion(true); assert.equal(f.window.JRVXExperience.allows('animations'), false);
  assert.equal(f.document.documentElement.classList.contains('v280ReducedFx'), true);
  assert.equal(f.window.JRVXCASV230.settings().fastAnimations, true);
  f.motion(false); assert.equal(f.window.JRVXExperience.allows('animations'), true);
  assert.equal(f.node('poker59App').classList.contains('v230-fast'), true);
});

test('ALL-IN opens a labelled modal with focus on Cancel before any action is submitted', () => {
  const f = fixture(); f.openConfirm(); const modal = f.node('p230Confirm');
  assert.equal(modal.getAttribute('role'), 'dialog'); assert.equal(modal.getAttribute('aria-modal'), 'true');
  assert.equal(modal.getAttribute('aria-labelledby'), f.node('p230ConfirmTitle').id);
  assert.equal(modal.getAttribute('aria-describedby'), 'p230ConfirmText');
  assert.equal(modal.getAttribute('aria-hidden'), 'false');
  assert.equal(f.document.activeElement, f.node('p230AllInCancel')); assert.equal(f.actions.length, 0);
});

test('Escape cancels ALL-IN and restores the Raise focus without granting later approval', () => {
  const f = fixture(); f.openConfirm(); const event = f.key('Escape');
  assert.equal(event.defaultPrevented, true); assert.equal(f.node('p230Confirm').getAttribute('aria-hidden'), 'true');
  assert.equal(f.document.activeElement, f.node('p59Raise')); assert.equal(f.actions.length, 0);
  f.node('p230AllInOk').click(); assert.equal(f.actions.length, 0);
  f.openConfirm(); assert.equal(f.node('p230Confirm').classList.contains('active'), true);
});

test('Tab and Shift+Tab wrap inside ALL-IN while normal inner tab movement remains native', () => {
  const f = fixture(); f.openConfirm();
  assert.equal(f.key('Tab').defaultPrevented, false, 'Cancel to ALL-IN is ordinary browser tabbing');
  f.node('p230AllInOk').focus(); assert.equal(f.key('Tab').defaultPrevented, true);
  assert.equal(f.document.activeElement, f.node('p230AllInCancel'));
  assert.equal(f.key('Tab', true).defaultPrevented, true); assert.equal(f.document.activeElement, f.node('p230AllInOk'));
  f.node('p59Raise').focus(); assert.equal(f.key('Tab').defaultPrevented, true);
  assert.equal(f.document.activeElement, f.node('p230AllInCancel')); assert.equal(f.actions.length, 0);
});

test('the Cancel button restores focus and a confirmed ALL-IN retains its existing single-action semantics', () => {
  const f = fixture(); f.openConfirm(); f.node('p230AllInCancel').focus(); f.node('p230AllInCancel').click();
  assert.equal(f.document.activeElement, f.node('p59Raise')); assert.equal(f.actions.length, 0);
  f.openConfirm(); f.node('p230AllInOk').click(); f.node('p230AllInOk').click();
  assert.deepEqual(f.actions, [{ handNo: 1, owner: 'JRVX-AAAA11111111', amount: 98 }]);
  assert.equal(f.node('p230Confirm').classList.contains('active'), false);
});

test('a new hand dismisses the focused ALL-IN modal and its original pending intent remains invalid', () => {
  const f = fixture(); f.openConfirm(); f.nextHand(); f.node('p230AllInOk').click();
  assert.equal(f.node('p230Confirm').getAttribute('aria-hidden'), 'true');
  assert.equal(f.document.activeElement, f.node('p59Raise')); assert.equal(f.actions.length, 0);
});

test('closing ALL-IN after its opener disappears leaves no focus inside the hidden modal', () => {
  const f = fixture(); f.openConfirm(); f.node('p59Raise').isConnected = false; f.key('Escape');
  assert.equal(f.node('p230Confirm').contains(f.document.activeElement), false); assert.equal(f.actions.length, 0);
});

test('the settings drawer exposes its expanded state and Escape closes it without becoming modal', () => {
  const f = fixture(), trigger = f.node('p230SettingsBtn');
  assert.equal(trigger.getAttribute('aria-controls'), 'p230Drawer'); assert.equal(trigger.getAttribute('aria-expanded'), 'false');
  trigger.focus(); trigger.click(); assert.equal(trigger.getAttribute('aria-expanded'), 'true');
  f.node('p230Haptic').focus(); const event = f.key('Escape'); assert.equal(event.defaultPrevented, true);
  assert.equal(trigger.getAttribute('aria-expanded'), 'false'); assert.equal(f.node('p230Drawer').classList.contains('active'), false);
  assert.equal(f.document.activeElement, trigger); assert.equal(f.node('p230Drawer').getAttribute('aria-modal'), null);
});

test('Escape in the actual Experience modal does not close the nonmodal poker drawer behind it', () => {
  const f = fixture(); f.node('p230SettingsBtn').click(); f.node('p230Haptic').focus();
  f.node('v280Settings').setAttribute('aria-modal', 'true'); f.window.JRVXExperience.openSettings();
  f.node('v280Close').focus(); f.key('Escape');
  assert.equal(f.node('v280Settings').classList.contains('active'), false);
  assert.equal(f.node('p230Drawer').classList.contains('active'), true);
  assert.equal(f.document.activeElement, f.node('p230Haptic')); assert.equal(f.actions.length, 0);
});
