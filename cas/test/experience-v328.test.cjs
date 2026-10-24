const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const filename = process.env.CAS_EXPERIENCE_SOURCE || path.join(__dirname, '../public/modules/ui/runtime/experience-v328.js');
const source = fs.readFileSync(filename, 'utf8');
function section(start, end) {
  const first = source.indexOf(start), last = source.indexOf(end, first);
  assert(first >= 0 && last > first, 'Expected complete runtime functions in ' + filename);
  return source.slice(first, last);
}
function node() {
  const classes = new Set();
  return { textContent: '', hidden: false, disabled: false, classList: {
    contains: value => classes.has(value), add: value => classes.add(value), remove: value => classes.delete(value)
  } };
}
function resultFixture(beforeBoot) {
  const nodes = new Map(), listeners = new Map(), effects = [];
  for (const id of ['blackjack', 'roulette', 'poker', 'bjMessage', 'rouletteMessage', 'rouletteSpin', 'poker59App']) nodes.set(id, node());
  for (const id of ['blackjack', 'roulette', 'poker']) nodes.get(id).classList.add('active');
  const ctx = { owner: 'A', document: { hidden: false, visibilityState: 'visible', addEventListener: (name, fn) => listeners.set(name, fn) },
    $: id => nodes.get(id) || null, q: () => nodes.get('poker59App'),
    MutationObserver: class { constructor(fn) { ctx.tick = fn; } observe() {} },
    play: kind => effects.push(kind), haptic: kind => effects.push('haptic:' + kind), burst: () => effects.push('burst') };
  ctx.window = { JRVXCASIdentityV300: { state: () => ({ authenticated: true, requiresAuthentication: true, mode: 'production', user: { id: ctx.owner } }) },
    JRVXCASV220: { blackjack: { state: { active: false, hands: [], roundId: 0, serverOwner: 'A' } }, roulette: { state: { last: null, lastOwner: 'A' } } },
    Poker59: { state: { game: null, server: null } } };
  const fixture = { ctx, nodes, effects, tick: () => ctx.tick(), identity(owner) { ctx.owner = owner; listeners.get('jrvx-cas-identity')?.(); },
    blackjack(round = 1, kind = 'win', message = 'Раздача завершена: +50 MS') {
      Object.assign(ctx.window.JRVXCASV220.blackjack.state, { active: false, hands: [{ outcome: kind, profit: kind === 'win' ? 50 : kind === 'loss' ? -50 : 0 }], roundId: round, serverOwner: ctx.owner });
      const output = nodes.get('bjMessage'); for (const item of ['win', 'loss', 'push']) output.classList.remove(item);
      output.classList.add(kind); output.textContent = message;
    },
    roulette(kind = 'win') {
      const state = ctx.window.JRVXCASV220.roulette.state; state.last = { amount: 50, type: 'red', numbers: [] }; state.lastOwner = ctx.owner;
      nodes.get('rouletteMessage').textContent = kind === 'win' ? 'Победа! +50 MS • выпало 1' : 'Выпало 0 • ставка не сыграла';
    },
    poker(winners = [ctx.owner], handNo = 1, roomId = 'room-a') {
      ctx.window.Poker59.state.server = { roomId, handNo, authoritative: true, you: { id: ctx.owner }, lastResult: { winners, text: 'JRVX выиграл банк 100 MS' } };
      nodes.get('poker59App').textContent = 'JRVX выиграл банк 100 MS';
    } };
  beforeBoot?.(fixture); vm.createContext(ctx); vm.runInContext(section('function watchResults(', 'function watchCards('), ctx); ctx.watchResults();
  return fixture;
}
const celebration = ['win', 'haptic:win', 'burst'];

test('server Blackjack +50 settlement plays one win effect using semantic state and class', () => {
  const f = resultFixture(); f.blackjack(); f.tick(); assert.deepEqual(f.effects, celebration);
});
test('server Blackjack -50 settlement plays loss even without the word проигрыш', () => {
  const f = resultFixture(); f.blackjack(1, 'loss', 'Раздача завершена: -50 MS'); f.tick(); assert.deepEqual(f.effects, ['lose']);
});
test('dealer Blackjack and failed requests cannot be misclassified as a win', () => {
  const f = resultFixture(), output = f.nodes.get('bjMessage');
  output.classList.add('loss'); output.textContent = 'У дилера Blackjack. Страховка была отклонена.'; f.tick();
  output.textContent = 'Сервер не подтвердил действие. Повторная попытка проверит тот же запрос.'; f.tick();
  assert.deepEqual(f.effects, []);
});
test('split total loss does not celebrate the word победа in an individual hand', () => {
  const f = resultFixture(); f.blackjack(1, 'loss', 'Р1: победа +50 · Р2: проигрыш -100 MS · дилер 20'); f.tick();
  assert.deepEqual(f.effects, ['lose']);
});
test('optional wallet warning and a higher snapshot version do not repeat Blackjack celebration', () => {
  const f = resultFixture(); f.blackjack(); f.tick();
  f.nodes.get('bjMessage').textContent += ' Действие подтверждено. Не удалось обновить баланс.';
  f.ctx.window.JRVXCASV220.blackjack.state.serverVersion = 100; f.tick();
  assert.deepEqual(f.effects, celebration);
});
test('two Blackjack rounds with the same positive result celebrate separately', () => {
  const f = resultFixture(); f.blackjack(1); f.tick(); f.blackjack(2); f.tick(); assert.deepEqual(f.effects, [...celebration, ...celebration]);
});
test('Blackjack push is silent and an active hand cannot emit a settled effect', () => {
  const f = resultFixture(); f.blackjack(1, 'push', 'Раздача завершена: 0 MS'); f.tick();
  f.blackjack(2); f.ctx.window.JRVXCASV220.blackjack.state.active = true; f.tick(); assert.deepEqual(f.effects, []);
});
test('initial restored result is silent and cannot replay on a later mutation', () => {
  const f = resultFixture(value => value.blackjack()); f.tick(); assert.deepEqual(f.effects, []);
});
test('hidden results are consumed silently and do not replay when visibility returns', () => {
  const f = resultFixture(); f.ctx.document.hidden = true; f.roulette(); f.tick();
  f.ctx.document.hidden = false; f.tick(); assert.deepEqual(f.effects, []);
});
test('an inactive table does not play a sound or burst after switching back', () => {
  const f = resultFixture(); f.nodes.get('poker').classList.remove('active'); f.poker(); f.tick();
  f.nodes.get('poker').classList.add('active'); f.tick(); assert.deepEqual(f.effects, []);
});
test('owner changes baseline old results silently and reject foreign Blackjack state', () => {
  const f = resultFixture(); f.blackjack(); f.tick(); f.effects.length = 0;
  f.identity('B'); f.nodes.get('bjMessage').textContent += ' Обновление'; f.tick(); assert.deepEqual(f.effects, []);
  f.blackjack(2); f.tick(); assert.deepEqual(f.effects, celebration);
  f.effects.length = 0; f.identity('A'); f.tick(); assert.deepEqual(f.effects, []);
});
test('two roulette wins with identical result text still celebrate both accepted spins', () => {
  const f = resultFixture(); f.roulette(); f.tick(); f.roulette(); f.tick(); assert.deepEqual(f.effects, [...celebration, ...celebration]);
});
test('roulette result does not repeat on unrelated presentation changes', () => {
  const f = resultFixture(); f.roulette(); f.tick(); f.tick(); assert.deepEqual(f.effects, celebration);
});
test('roulette loss has a loss effect while pending or foreign-owner state stays silent', () => {
  const f = resultFixture(); f.roulette('loss'); f.tick(); assert.deepEqual(f.effects, ['lose']);
  f.effects.length = 0; f.roulette(); f.nodes.get('rouletteSpin').disabled = true; f.tick(); assert.deepEqual(f.effects, []);
  f.nodes.get('rouletteSpin').disabled = false; f.ctx.window.JRVXCASV220.roulette.state.lastOwner = 'B'; f.tick(); assert.deepEqual(f.effects, []);
});
test('poker opponent victory is a loss even if displayed text says выиграл or Победа после фолда', () => {
  const f = resultFixture(); f.poker(['opponent']); f.tick(); assert.deepEqual(f.effects, ['lose']);
});
test('poker celebrates only the current winner once per room and hand, and ties stay silent', () => {
  const f = resultFixture(); f.poker(); f.tick();
  f.ctx.window.Poker59.state.server.lastResult.text += ' Подтверждено'; f.nodes.get('poker59App').textContent += ' Подтверждено'; f.tick();
  f.poker(['A'], 2); f.tick(); f.poker(['A', 'opponent'], 3); f.tick(); f.poker(['A'], 2, 'room-b'); f.tick();
  assert.deepEqual(f.effects, [...celebration, ...celebration, ...celebration]);
});
test('a foreign authenticated poker seat cannot trigger result effects', () => {
  const f = resultFixture(); f.poker(['B']); f.ctx.window.Poker59.state.server.you.id = 'B'; f.tick(); assert.deepEqual(f.effects, []);
});
test('local poker results use the local game state and current local seat', () => {
  const f = resultFixture(); f.ctx.window.Poker59.state.game = { state: () => ({ handNo: 3, you: { id: 'local-player' }, lastResult: { winners: ['local-player'] } }) };
  f.tick(); assert.deepEqual(f.effects, celebration);
});

function installPokerProHaptics(fixture, enabled, stabilityAfter = false) {
  const pro = fs.readFileSync(path.join(__dirname, '../public/modules/poker/runtime/poker-pro-v328.js'), 'utf8');
  const stability = fs.readFileSync(path.join(__dirname, '../public/modules/poker/runtime/poker-stability-v325.js'), 'utf8');
  const vibrated = [], sharedWindow = fixture.ctx.window;
  fixture.ctx.haptic = () => vibrated.push('experience');
  const context = { window: sharedWindow, document: fixture.ctx.document, settings: { haptic: enabled }, navigator: { vibrate: ms => vibrated.push(ms) }, console,
    frameWrapped: false, lastTurnHaptic: '', lastResultHaptic: '', getGame: () => null };
  for (const name of ['ensureUI', 'syncPendingActions', 'syncBettingBounds', 'decorateCards', 'updateRebuyUI', 'handleAuto', 'maybeAutoRebuy', 'scheduleHistoryEnhance']) context[name] = () => {};
  const proPart = (start, end) => pro.slice(pro.indexOf(start), pro.indexOf(end, pro.indexOf(start)));
  vm.createContext(context);
  vm.runInContext(proPart('function haptic(', 'function toast(') + proPart('function frame(st)', 'function wrapShowLobby('), context);
  const stabilityContext = { window: sharedWindow, frame() {}, console };
  vm.createContext(stabilityContext);
  const from = stability.indexOf('function wrapFrame('), to = stability.indexOf('\nfunction ', from + 1);
  vm.runInContext(stability.slice(from, to), stabilityContext);
  if (!stabilityAfter) stabilityContext.wrapFrame();
  context.wrapFrame();
  if (stabilityAfter) stabilityContext.wrapFrame();
  sharedWindow.JRVXCASV230 = { settings: () => ({ ...context.settings }) };
  return vibrated;
}
test('actual Poker Pro frame and experience emit one poker result vibration through either installed wrapper order', () => {
  for (const stabilityAfter of [false, true]) {
    const f = resultFixture(), vibrated = installPokerProHaptics(f, true, stabilityAfter);
    assert.equal(f.ctx.window.__jvrxPokerFrame.__v230, true, 'Stability wrapper preserves the installed Pro marker');
    assert.equal(f.ctx.window.__jvrxPokerFrame.__v210, true, 'Pro wrapper preserves the installed Stability marker');
    f.poker(); f.ctx.window.__jvrxPokerFrame(f.ctx.window.Poker59.state.server); f.tick();
    assert.deepEqual(vibrated, [30]); assert.deepEqual(f.effects, ['win', 'burst']);
  }
});
test('installed Poker Pro haptic=false remains silent while experience keeps poker sound and confetti', () => {
  const f = resultFixture(), vibrated = installPokerProHaptics(f, false);
  f.poker(); f.ctx.window.__jvrxPokerFrame(f.ctx.window.Poker59.state.server); f.tick();
  assert.deepEqual(vibrated, []); assert.deepEqual(f.effects, ['win', 'burst']);
});
test('experience preserves poker vibration fallback when no known Pro wrapper owns it', () => {
  const f = resultFixture(); f.ctx.window.JRVXCASV230 = { settings: () => ({ haptic: false }) };
  f.ctx.window.__jvrxPokerFrame = () => {}; f.poker(); f.tick(); assert.deepEqual(f.effects, celebration);
});

function audioFixture({ constructorFails = 0, gainFails = 0, resumeFails = 0, initialState = 'suspended' } = {}) {
  const created = []; let attempts = 0, resumed = 0, tones = 0, closed = 0;
  class AudioContext {
    constructor() { if (attempts++ < constructorFails) throw Error('audio_device_temporarily_unavailable'); this.state = initialState; this.currentTime = 0; this.destination = {}; created.push(this); }
    createGain() { if (gainFails-- > 0) throw Error('temporary_gain_failure'); return { connect() {}, disconnect() {}, gain: { setTargetAtTime() {}, setValueAtTime() {}, linearRampToValueAtTime() {}, exponentialRampToValueAtTime() {} } }; }
    async resume() { if (resumed++ < resumeFails) throw Error('resume_temporarily_denied'); this.state = 'running'; }
    close() { closed++; this.state = 'closed'; return Promise.resolve(); }
    createOscillator() { return { type: '', frequency: { setValueAtTime() {} }, connect() {}, start() { tones++; }, stop() {} }; }
  }
  const ctx = { window: { AudioContext }, document: { hidden: false }, ctx: null, master: null, sfxGain: null, ambGain: null, unlocked: false,
    pageSuspended: false, activeSfx: new Set(), settings: { sfx: 65, ambience: 0 }, ambientNodes: [], clamp: (n, a, b) => Math.max(a, Math.min(b, Number(n) || 0)), startAmbience() {}, stopAmbience() {} };
  vm.createContext(ctx);
  const first = source.includes('function foreground(') ? 'function foreground(' : 'function ensureAudio(';
  vm.runInContext(section(first, 'function play('), ctx);
  return { ctx, created, attempts: () => attempts, resumed: () => resumed, tones: () => tones, closed: () => closed };
}
test('audio initialization failure stays retryable on the next user gesture', async () => {
  const f = audioFixture({ constructorFails: 1 }); await f.ctx.unlock(); assert.equal(f.ctx.unlocked, false);
  await f.ctx.unlock(); f.ctx.tone(); assert.equal(f.attempts(), 2); assert.equal(f.tones(), 1);
});
test('a rejected audio resume is retried by a later gesture', async () => {
  const f = audioFixture({ resumeFails: 1 }); await f.ctx.unlock(); assert.equal(f.ctx.unlocked, false);
  await f.ctx.unlock(); f.ctx.tone(); assert.equal(f.resumed(), 2); assert.equal(f.ctx.unlocked, true); assert.equal(f.tones(), 1);
});
test('interrupted audio resumes and an already running context is reused', async () => {
  const f = audioFixture({ initialState: 'interrupted' }); await f.ctx.unlock(); await f.ctx.unlock();
  assert.equal(f.resumed(), 1); assert.equal(f.attempts(), 1); assert.equal(f.created[0].state, 'running');
});
test('partial audio initialization closes the failed context and creates a working retry', async () => {
  const f = audioFixture({ gainFails: 1 }); await f.ctx.unlock(); assert.equal(f.closed(), 1); assert.equal(f.ctx.unlocked, false);
  await f.ctx.unlock(); f.ctx.tone(); assert.equal(f.created.length, 2); assert.equal(f.tones(), 1);
});
test('closed and automatically suspended contexts can be restored by a new gesture', async () => {
  const f = audioFixture(); await f.ctx.unlock(); f.created[0].state = 'suspended'; await f.ctx.unlock(); assert.equal(f.resumed(), 2);
  f.created[0].state = 'closed'; await f.ctx.unlock(); f.ctx.tone(); assert.equal(f.created.length, 2); assert.equal(f.tones(), 1);
});
test('route mutation bursts queue one frame and still process a subsequent transition', () => {
  const frames = []; let entered = 0, ensured = 0;
  const ctx = { routeFrame: 0, requestAnimationFrame: fn => { frames.push(fn); return frames.length; }, routeEnter: () => entered++, ensureUI: () => ensured++ };
  vm.createContext(ctx);
  if (source.includes('function scheduleRoute(')) vm.runInContext(section('function scheduleRoute(', 'function guardLoading('), ctx);
  // Execute the actual observer callback from boot, including the published
  // baseline callback when checking FAIL -> PASS against the old asset.
  const observer = source.match(/const routeObs=new MutationObserver\((.*?)\);for\(const el/);
  assert(observer); const notify = vm.runInContext('(' + observer[1] + ')', ctx);
  for (let i = 0; i < 100; i++) notify(); assert.equal(frames.length, 1);
  frames[0](); assert.equal(entered, 1); assert.equal(ensured, 1);
  notify(); assert.equal(frames.length, 2); frames[1](); assert.equal(entered, 2); assert.equal(ensured, 2);
});

// Boot the complete published/candidate IIFE and use its public effects API.
// These checks exercise real save/visibility handlers, rather than reimplement
// their preference gates in the fixture.
function fullExperienceFixture({ stored, reducedMotion = false } = {}) {
  const ids = new Map(), listeners = new Map(), windowListeners = new Map(), timers = new Map(), storage = new Map(), oscillators = [], vibrations = [], mediaListeners = [];
  let serial = 0;
  function element(tag = 'div') {
    const classes = new Set(), output = { tagName: tag.toUpperCase(), children: [], dataset: {}, style: { setProperty() {} }, textContent: '', isConnected: true,
      classList: { add: (...values) => values.forEach(value => classes.add(value)), remove: (...values) => values.forEach(value => classes.delete(value)), contains: value => classes.has(value),
        toggle(value, force) { if (force === undefined) force = !classes.has(value); if (force) classes.add(value); else classes.delete(value); return force; } },
      appendChild(child) { output.children.push(child); child.parentNode = output; return child; },
      remove() { if (output.parentNode) output.parentNode.children = output.parentNode.children.filter(value => value !== output); output.isConnected = false; },
      querySelector: () => null, querySelectorAll: () => [], setAttribute() {}, addEventListener() {}, focus() {}, getBoundingClientRect: () => ({ left: 0, top: 0, width: 100, height: 100 }) };
    Object.defineProperty(output, 'className', { get: () => [...classes].join(' '), set(value) { classes.clear(); String(value).split(/\s+/).filter(Boolean).forEach(item => classes.add(item)); } });
    return output;
  }
  for (const id of ['v280ExperienceBtn', 'v280Settings', 'v280Sfx', 'v280Amb', 'v280SfxValue', 'v280AmbValue', 'v280Haptic', 'v280Animations']) {
    const value = element(); value.dataset.bound = '1'; ids.set(id, value);
  }
  const body = element('body'), root = element('html'), media = { matches: reducedMotion, addEventListener: (type, fn) => mediaListeners.push(fn) };
  const all = () => { const result = []; function walk(current) { result.push(current); current.children.forEach(walk); } walk(body); return result; };
  const document = { readyState: 'loading', hidden: false, visibilityState: 'visible', body, documentElement: root, getElementById: id => ids.get(id) || null,
    createElement: element, querySelector: () => null,
    querySelectorAll(selector) { return all().filter(value => selector.split(',').some(part => part.trim().startsWith('.') && value.classList.contains(part.trim().slice(1)))); },
    addEventListener(type, fn) { if (!listeners.has(type)) listeners.set(type, []); listeners.get(type).push(fn); },
    dispatchEvent(event) { for (const fn of listeners.get(event.type) || []) fn(event); return true; } };
  class AudioContext {
    constructor() { this.state = 'running'; this.currentTime = 0; this.destination = {}; }
    createGain() { return { connect() {}, disconnect() {}, gain: { setTargetAtTime() {}, setValueAtTime() {}, linearRampToValueAtTime() {}, exponentialRampToValueAtTime() {} } }; }
    createOscillator() { const value = { frequency: { setValueAtTime() {} }, connect() {}, disconnect() { value.disconnected = true; }, start() {}, stop(time) { value.stops.push(time); }, stops: [] }; oscillators.push(value); return value; }
    resume() { this.state = 'running'; return Promise.resolve(); }
    close() { this.state = 'closed'; return Promise.resolve(); }
  }
  if (stored !== undefined) storage.set('jrvxCasExperienceV280', stored);
  const context = { document, navigator: { vibrate: pattern => vibrations.push(pattern), userActivation: { hasBeenActive: true } }, localStorage: { getItem: key => storage.get(key) || null, setItem: (key, value) => storage.set(key, value) },
    innerWidth: 1000, innerHeight: 700, location: { hash: '' }, getComputedStyle: () => ({ display: 'none' }), console, Event,
    MutationObserver: class { observe() {} }, requestAnimationFrame: fn => { const id = ++serial; timers.set(id, fn); return id; }, cancelAnimationFrame: id => timers.delete(id),
    setTimeout: fn => { const id = ++serial; timers.set(id, fn); return id; }, clearTimeout: id => timers.delete(id) };
  context.window = { AudioContext, matchMedia: () => media, addEventListener(type, fn) { if (!windowListeners.has(type)) windowListeners.set(type, []); windowListeners.get(type).push(fn); } };
  vm.createContext(context); vm.runInContext(source, context); document.dispatchEvent(new Event('DOMContentLoaded'));
  const api = context.window.JRVXExperience;
  return { api, context, body, root, ids, media, oscillators, vibrations, storage,
    async activate() {
      const button = { id: 'test-activation', matches: () => false, closest: () => null };
      document.dispatchEvent({ type: 'pointerdown', target: { closest: () => button } });
      await new Promise(resolve => setImmediate(resolve));
      for (const oscillator of oscillators) oscillator.onended?.(); oscillators.length = 0; vibrations.length = 0;
    },
    hide() { document.hidden = true; document.visibilityState = 'hidden'; document.dispatchEvent(new Event('visibilitychange')); },
    show() { document.hidden = false; document.visibilityState = 'visible'; document.dispatchEvent(new Event('visibilitychange')); },
    motion(value) { media.matches = value; for (const fn of mediaListeners) fn({ matches: value }); },
    pagehide() { for (const fn of windowListeners.get('pagehide') || []) fn(new Event('pagehide')); },
    pageshow() { for (const fn of windowListeners.get('pageshow') || []) fn(new Event('pageshow')); },
    particles: () => all().filter(value => value.className === 'v280Burst' || value.classList.contains('v280Burst')) };
}

test('full runtime blocks public sound, haptic and particle effects while hidden', async () => {
  const f = fullExperienceFixture(); await f.activate(); f.hide(); f.oscillators.length = 0; f.vibrations.length = 0;
  f.api.play('win'); f.api.haptic('win'); f.api.burst();
  assert.equal(f.oscillators.length, 0); assert.equal(f.vibrations.length, 0); assert.equal(f.particles().length, 0);
});
test('disabling animations removes an already running burst and its motion classes', () => {
  const f = fullExperienceFixture(); f.api.burst(); assert.equal(f.particles().length, 1);
  const card = f.context.document.createElement('div'); card.classList.add('v280CardIn', 'jrvxCardReveal'); f.body.appendChild(card);
  f.api.set({ animations: false }); assert.equal(f.particles().length, 0);
  assert.equal(card.classList.contains('v280CardIn'), false); assert.equal(card.classList.contains('jrvxCardReveal'), false);
  assert.equal(f.root.classList.contains('v280ReducedFx'), true);
});
test('disabling haptics cancels the current vibration pattern without changing other preferences', () => {
  const f = fullExperienceFixture(); f.api.haptic('win'); assert.equal(f.vibrations.length, 1);
  f.api.set({ haptics: false }); assert.equal(f.vibrations.at(-1), 0);
  assert.equal(f.api.settings.animations, true); f.vibrations.length = 0; f.api.haptic('win'); assert.deepEqual(f.vibrations, []);
});
test('muting sound stops every scheduled win note immediately', async () => {
  const f = fullExperienceFixture(); await f.activate(); f.api.play('win'); assert.equal(f.oscillators.length, 4);
  f.api.set({ sfx: 0 }); assert.equal(f.oscillators.every(value => value.stops.includes(undefined)), true);
  const count = f.oscillators.length; f.api.play('win'); assert.equal(f.oscillators.length, count);
});
test('background and pagehide cancel active notes, vibration and particles', async () => {
  for (const transition of ['hide', 'pagehide']) {
    const f = fullExperienceFixture(); await f.activate(); f.api.play('win'); f.api.haptic('win'); f.api.burst();
    f[transition](); assert.equal(f.oscillators.every(value => value.stops.includes(undefined)), true);
    assert.equal(f.vibrations.at(-1), 0); assert.equal(f.particles().length, 0);
    f.oscillators.length = 0; f.vibrations.length = 0; f.api.play('win'); f.api.haptic('win'); f.api.burst();
    assert.equal(f.oscillators.length, 0); assert.equal(f.vibrations.length, 0); assert.equal(f.particles().length, 0);
    if (transition === 'pagehide') { f.pageshow(); f.api.play('win'); assert.equal(f.oscillators.length, 4); }
  }
});
test('saved false preferences remain false and malformed numeric/boolean preferences use defaults', () => {
  const f = fullExperienceFixture({ stored: JSON.stringify({ sfx: 0, ambience: 0, haptics: false, animations: false }) });
  assert.equal(f.api.settings.sfx, 0); assert.equal(f.api.settings.haptics, false); assert.equal(f.api.settings.animations, false);
  f.api.haptic('win'); f.api.burst(); assert.equal(f.vibrations.length, 0); assert.equal(f.particles().length, 0);
  const corrupt = fullExperienceFixture({ stored: JSON.stringify({ sfx: null, ambience: 'broken', haptics: 'false', animations: [] }) });
  assert.equal(corrupt.api.settings.sfx, 65); assert.equal(corrupt.api.settings.ambience, 0);
  assert.equal(corrupt.api.settings.haptics, true); assert.equal(corrupt.api.settings.animations, true);
});
test('OS reduced motion stops actual particles while preserving the saved animation preference', () => {
  const f = fullExperienceFixture(); f.api.set({ animations: true }); f.api.burst(); assert.equal(f.particles().length, 1);
  f.motion(true); assert.equal(f.particles().length, 0); f.api.burst(); assert.equal(f.particles().length, 0);
  assert.equal(f.root.classList.contains('v280ReducedFx'), true); assert.equal(f.api.settings.animations, true);
  f.motion(false); assert.equal(f.root.classList.contains('v280ReducedFx'), false); f.api.burst(); assert.equal(f.particles().length, 1);
});
test('read-only allows contract reflects live preferences and visibility without mutating settings', () => {
  const f = fullExperienceFixture(); assert.equal(f.api.allows('haptics'), true); assert.equal(f.api.allows('animations'), true); assert.equal(f.api.allows('unknown'), false);
  f.hide(); assert.equal(f.api.allows('haptics'), false); assert.equal(f.api.allows('animations'), false);
  f.show(); assert.equal(f.api.allows('animations'), true); f.api.set({ haptics: false }); assert.equal(f.api.allows('haptics'), false);
  const settings = f.api.settings; settings.haptics = true; assert.equal(f.api.allows('haptics'), false);
});
