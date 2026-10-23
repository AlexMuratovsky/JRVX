const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const source = fs.readFileSync(process.env.JRVX_POKER_PRO_SOURCE || path.join(__dirname, '../public/modules/poker/runtime/poker-pro-v326.js'), 'utf8');
const initial = (extra = {}) => ({
  authoritative: true, active: true, roomId: 'room-1', tableId: '1-2', mode: 'jarvis', currency: 'MS',
  handNo: 7, revision: 15, street: 'flop', turnSeat: 0, currentBet: 10, minRaiseTo: 20, pot: 30,
  you: { id: 'player-A', seat: 0, yourTurn: true, stack: 90, bet: 10, toCall: 0 }, ...extra
});

function fixture(state = initial(), { legacyPending = true, localGame = null, production = true } = {}) {
  const nodes = new Map(), events = { window: new Map(), document: new Map() }, timers = new Map(), actions = [], records = new Map();
  let now = 0, timerId = 0, currency = 'MS', owner = 'player-A', connected = true, pendingUntil = 0;
  const add = (surface, type, fn, options = false) => {
    if (!events[surface].has(type)) events[surface].set(type, []);
    events[surface].get(type).push({ fn, capture: options === true || !!options.capture });
  };
  function node(id) {
    if (!nodes.has(id)) {
      const classes = new Set(id === 'poker' ? ['active'] : []);
      const item = {
        id, value: '', dataset: {}, disabled: false, textContent: '', style: {},
        querySelector() { return null; }, querySelectorAll() { return []; },
        classList: {
          add(...names) { names.forEach(name => classes.add(name)); },
          remove(...names) { names.forEach(name => classes.delete(name)); },
          contains(name) { return classes.has(name); },
          toggle(name, force = !classes.has(name)) { if (force) classes.add(name); else classes.delete(name); return force; }
        },
        closest(selector) { return selector.split(',').some(part => part.trim() === '#' + id || part.trim() === '[data-p59-size]' && !!item.dataset.p59Size || part.trim() === '[data-v110-frac]' && !!item.dataset.v110Frac) ? item : null; },
        dispatchEvent(event) { emit(event.type, item); },
        click() { if (!item.disabled) emit('click', item); }
      };
      nodes.set(id, item);
    }
    return nodes.get(id);
  }
  function emit(type, target = null) {
    const event = { type, target, defaultPrevented: false, stopped: false,
      preventDefault() { this.defaultPrevented = true; }, stopImmediatePropagation() { this.stopped = true; } };
    for (const [surface, capture] of [['window', true], ['document', true], ['target', false], ['document', false], ['window', false]]) {
      if (event.stopped) break;
      if (surface === 'target') target?.['on' + type]?.(event);
      else for (const listener of events[surface].get(type) || []) {
        if (listener.capture === capture) listener.fn(event);
        if (event.stopped) break;
      }
    }
    return event;
  }
  const setTimeout = (fn, ms) => { const id = ++timerId; timers.set(id, { fn, at: now + ms }); return id; };
  const clearTimeout = id => timers.delete(id);
  function tick(ms) {
    const until = now + ms;
    for (;;) {
      const due = [...timers].filter(([, timer]) => timer.at <= until).sort((a, b) => a[1].at - b[1].at || a[0] - b[0])[0];
      if (!due) break;
      const [id, timer] = due; timers.delete(id); now = timer.at; timer.fn();
    }
    now = until;
  }
  const poker = { state: { server: localGame ? null : state, game: localGame }, showLobby() { poker.state.server = null; }, render() {} };
  // This reproduces the earlier production document-capture listener from
  // 36-v113-poker-stability-runtime.js. No server calls are made by these tests.
  if (legacyPending) add('document', 'click', event => {
    if (!event.target.closest('#p59Fold,#p59Call,#p59Raise,#p59Start') || !poker.state.server?.you) return;
    if (now < pendingUntil) { event.preventDefault(); event.stopImmediatePropagation(); return; }
    pendingUntil = now + 2600; node('poker59App').classList.add('v113-action-pending');
    setTimeout(() => { if (now >= pendingUntil) node('poker59App').classList.remove('v113-action-pending'); }, 2650);
  }, true);
  for (const [id, action] of [['p59Raise', 'bet'], ['p59Call', 'check'], ['p59Fold', 'fold']]) node(id).onclick = () => {
    const st = poker.state.server || poker.state.game?.state();
    actions.push({ action: id === 'p59Call' && st.you.toCall > 0 ? 'call' : action, amount: id === 'p59Raise' ? Number(node('p59Bet').value) : undefined, handNo: st.handNo, roomId: st.roomId, owner });
  };
  node('p59Bet').value = '100';
  const ctx = {
    console, setTimeout, clearTimeout, Event, navigator: {}, showArcadeToast() {},
    fetch() { throw new Error('Poker UI tests must never make network requests'); },
    localStorage: { getItem: key => records.get(key) ?? null, setItem: (key, value) => records.set(key, value), removeItem: key => records.delete(key) },
    document: { readyState: 'loading', getElementById: node, querySelectorAll: () => [], addEventListener: (type, fn, options) => add('document', type, fn, options) }
  };
  ctx.window = {
    addEventListener: (type, fn, options) => add('window', type, fn, options), Poker59: poker,
    Poker59Core: localGame ? require('../public/modules/poker/runtime/poker-core-v326.js') : { tableById: () => ({ min: 20 }) },
    JRVXCASIdentityV300: { state: () => ({ requiresAuthentication: production, authenticated: !!owner, mode: production ? 'production' : 'development', user: owner ? { id: owner } : null }) },
    JRVXCasEconomy: { get: () => ({ currency }), balance: () => 1000 },
    arcadeNetState: { get connected() { return connected; } }
  };
  vm.createContext(ctx); vm.runInContext(source, ctx); emit('DOMContentLoaded');
  return {
    node, actions, tick, emit, poker, api: ctx.window.JRVXCASV230,
    frame() { ctx.window.__jvrxPokerFrame(poker.state.server || poker.state.game?.state()); },
    state: () => poker.state.server,
    change(patch, render = false) { poker.state.server = { ...poker.state.server, ...patch }; if (render) this.frame(); },
    setOwner(value, notify = false) { owner = value; if (notify) emit('jrvx-cas-identity'); },
    setCurrency(value) { currency = value; }, setConnected(value) { connected = value; }
  };
}

test('ALL-IN confirms immediately before the legacy action lock and sends only once', () => {
  const f = fixture(); f.node('p59Raise').click();
  assert.equal(f.node('p230Confirm').classList.contains('active'), true);
  assert.equal(f.node('poker59App').classList.contains('v113-action-pending'), false, 'Opening a dialog is not a pending game action');
  assert.equal(f.actions.length, 0);
  f.tick(20); f.node('p230AllInOk').click(); f.node('p230AllInOk').click();
  assert.equal(f.actions.length, 1); assert.equal(f.actions[0].action, 'bet'); assert.equal(f.actions[0].amount, 100);
  assert.equal(f.node('p230Confirm').classList.contains('active'), false);
});

function unopenedFlop(extra = {}) {
  return initial({ street: 'flop', currentBet: 0, bigBlind: 2, minRaiseTo: 2, pot: 4,
    you: { id: 'player-A', seat: 0, yourTurn: true, stack: 98, bet: 0, toCall: 0 }, ...extra });
}
function quickButton(f, kind, onclick = () => { throw Error('obsolete quick-size handler must be intercepted'); }) {
  const button = f.node('quick-' + kind); button.dataset.p59Size = kind; button.onclick = onclick; return button;
}
test('an unopened authoritative flop permits the server minimum of one big blind and MIN selects it', () => {
  // The verified production server reports minRaiseTo=2 after call/check at 1/2.
  // Its legacy render has already imposed the incorrect 2*BB floor of 4 here.
  const f = fixture(unopenedFlop()); Object.assign(f.node('p59Bet'), { min: '4', max: '98', value: '4' });
  f.frame(); assert.equal(f.node('p59Bet').min, '2'); assert.equal(f.node('p59Bet').max, '98');
  assert.equal(f.node('p59Bet').value, '4', 'a valid deliberate amount should remain selected');
  quickButton(f, 'min').click(); assert.equal(f.node('p59Bet').value, '2'); assert.equal(f.actions.length, 0);
  f.node('p59Raise').click(); assert.equal(f.actions.length, 1); assert.equal(f.actions[0].amount, 2);
});
test('authoritative preflop and full-raise minimums remain unchanged', () => {
  for (const [street, currentBet, minRaiseTo] of [['preflop', 2, 4], ['flop', 10, 18], ['turn', 28, 46]]) {
    const f = fixture(unopenedFlop({ street, currentBet, minRaiseTo })); f.node('p59Bet').value = '0'; f.frame();
    assert.equal(f.node('p59Bet').min, String(minRaiseTo)); assert.equal(f.node('p59Bet').value, String(minRaiseTo));
    quickButton(f, 'min').click(); assert.equal(f.node('p59Bet').value, String(minRaiseTo)); assert.equal(f.actions.length, 0);
  }
});
test('quick amounts use the same authoritative limits and select amounts without sending a wager', () => {
  for (const [kind, expected] of [['min', 2], ['half', 5], ['threeq', 8], ['pot', 10], ['twopot', 20], ['allin', 98]]) {
    const f = fixture(unopenedFlop({ pot: 10 })); quickButton(f, kind).click();
    assert.equal(Number(f.node('p59Bet').value), expected); assert.equal(f.actions.length, 0); assert.equal(f.node('p230Confirm').classList.contains('active'), false);
  }
});
test('the actual v110 replacement buttons retain all six authoritative sizing actions', () => {
  // group-03.js replaces data-p59-size buttons with these live DOM attributes.
  for (const [fraction, expected] of [['min', 2], ['0.5', 5], ['0.75', 8], ['1', 10], ['2', 20], ['allin', 98]]) {
    const f = fixture(unopenedFlop({ pot: 10 })), button = f.node('live-' + fraction);
    button.dataset.v110Frac = fraction; button.onclick = () => { throw Error('obsolete live size handler must be intercepted'); };
    button.click(); assert.equal(Number(f.node('p59Bet').value), expected); assert.equal(f.actions.length, 0);
  }
});
test('short-stack minimum and oversized pot shortcuts cap at the exact existing stack plus bet', () => {
  const f = fixture(unopenedFlop({ currentBet: 20, minRaiseTo: 40, pot: 1000,
    you: { id: 'player-A', seat: 0, yourTurn: true, stack: 15, bet: 10, toCall: 10 } }));
  f.frame(); assert.equal(f.node('p59Bet').min, '25'); assert.equal(f.node('p59Bet').max, '25');
  quickButton(f, 'twopot').click(); assert.equal(f.node('p59Bet').value, '25'); assert.equal(f.actions.length, 0);
  f.node('p59Raise').click(); assert.equal(f.actions.length, 0); assert.equal(f.node('p230Confirm').classList.contains('active'), true);
  f.node('p230AllInOk').click(); assert.equal(f.actions.length, 1); assert.equal(f.actions[0].amount, 25);
});
test('minimum correction never re-enables disabled raise controls or selects on another turn or offline', () => {
  const f = fixture(unopenedFlop()); f.node('p59Raise').disabled = true; f.node('p59Bet').disabled = true; f.node('p59Bet').value = '8'; f.frame();
  assert.equal(f.node('p59Raise').disabled, true); assert.equal(f.node('p59Bet').disabled, true);
  quickButton(f, 'min').click(); assert.equal(f.node('p59Bet').value, '8');
  f.node('p59Bet').disabled = false; f.change({ you: { ...f.state().you, yourTurn: false } });
  quickButton(f, 'min').click(); assert.equal(f.node('p59Bet').value, '8');
  f.change({ you: { ...f.state().you, yourTurn: true } }); f.setConnected(false);
  quickButton(f, 'min').click(); assert.equal(f.node('p59Bet').value, '8'); assert.equal(f.actions.length, 0);
});
test('development and incomplete snapshots retain the existing sizing handler instead of inventing limits', () => {
  for (const patch of [{ authoritative: false }, { minRaiseTo: undefined }, { minRaiseTo: 0 }, { minRaiseTo: NaN }]) {
    const f = fixture(unopenedFlop(patch)); f.node('p59Bet').min = '4'; f.node('p59Bet').value = '8'; f.frame();
    assert.equal(f.node('p59Bet').min, '4'); let legacy = 0; quickButton(f, 'min', () => { legacy++; }).click(); assert.equal(legacy, 1);
  }
});

test('the actual development HeadsUpGame shares its legal one-BB minimum without enabling a local production fallback', () => {
  const Core=require('../public/modules/poker/runtime/poker-core-v326.js');
  for(const production of [false,true]){
    const game=new Core.HeadsUpGame({buyIn:100,random:()=>.5});game.startHand();game.act(game.playerSeat,'call');game.botAct();game.botAct();
    const f=fixture(null,{legacyPending:false,localGame:game,production});f.node('p59Bet').min='4';f.frame();
    if(production){assert.equal(f.node('p59Bet').min,'4');continue;}
    assert.equal(f.node('p59Bet').min,'2');quickButton(f,'min').click();assert.equal(f.node('p59Bet').value,'2');assert.equal(f.actions.length,0);
  }
});

test('ALL-IN confirmation rejects changed hand, owner, room, currency, amount and turn', async t => {
  const cases = {
    'new hand': f => f.change({ handNo: 8 }),
    'new room': f => f.change({ roomId: 'room-2' }),
    'new table': f => f.change({ tableId: '2-4' }),
    'new seated player': f => f.change({ you: { ...f.state().you, id: 'player-B' } }),
    'new owner': f => f.setOwner('player-B'),
    'signed out': f => f.setOwner(''),
    'selected currency': f => f.setCurrency('MG'),
    'server currency': f => f.change({ currency: 'MG' }),
    'raise input changed': f => { f.node('p59Bet').value = '90'; },
    'stack changed': f => f.change({ you: { ...f.state().you, stack: 190 } }),
    'revision changed': f => f.change({ revision: 16 }),
    'new street': f => f.change({ street: 'turn' }),
    'turn lost': f => f.change({ you: { ...f.state().you, yourTurn: false } }),
    'game closed': f => f.change({ active: false }),
    'network lost': f => f.setConnected(false),
    'other screen': f => f.node('poker').classList.remove('active'),
    'disabled action': f => { f.node('p59Raise').disabled = true; }
  };
  for (const [name, mutate] of Object.entries(cases)) await t.test(name, () => {
    const f = fixture(); f.node('p59Raise').click(); f.tick(2700); mutate(f); f.node('p230AllInOk').click();
    assert.equal(f.actions.length, 0); assert.equal(f.node('p230Confirm').classList.contains('active'), false);
  });
});

test('ALL-IN cancellation leaves no approval that could bypass a fresh confirmation', () => {
  const f = fixture(); f.node('p59Raise').click(); f.tick(2700); f.node('p230AllInCancel').click(); f.node('p230AllInOk').click();
  assert.equal(f.actions.length, 0); f.node('p59Raise').click();
  assert.equal(f.node('p230Confirm').classList.contains('active'), true);
  f.node('p230AllInOk').click(); assert.equal(f.actions.length, 1);
});

test('a new rendered hand and leaving the table dismiss ALL-IN confirmation', () => {
  const f = fixture(); f.node('p59Raise').click(); f.change({ handNo: 8 }, true);
  assert.equal(f.node('p230Confirm').classList.contains('active'), false);
  f.node('p59Raise').click(); f.poker.showLobby(false); f.node('p230AllInOk').click();
  assert.equal(f.actions.length, 0); assert.equal(f.node('p230Confirm').classList.contains('active'), false);
});

test('AUTO CHECK checks once and CHECK / FOLD folds once against a current bet', () => {
  const check = fixture(); check.node('p230AutoCheck').click(); check.tick(160); check.tick(1000);
  assert.deepEqual(check.actions.map(action => action.action), ['check']); assert.equal(check.api.diagnostics().autoMode, null);
  const fold = fixture(initial({ you: { ...initial().you, toCall: 10 } }));
  fold.node('p230CheckFold').click(); fold.tick(160); assert.deepEqual(fold.actions.map(action => action.action), ['fold']);
});

test('delayed AUTO CHECK cannot act on a newer hand or owner, even without a render', async t => {
  const cases = {
    'hand changed before callback': f => f.change({ handNo: 8 }),
    'hand changed and rendered': f => f.change({ handNo: 8 }, true),
    'owner changed': f => f.setOwner('player-B'),
    'room changed': f => f.change({ roomId: 'room-2' }),
    'currency changed': f => f.setCurrency('MG'),
    'turn changed': f => f.change({ turnSeat: 1 }),
    'revision changed': f => f.change({ revision: 16 }),
    'opponent raised': f => f.change({ you: { ...f.state().you, toCall: 10 } }),
    'network lost': f => f.setConnected(false),
    'route changed': f => f.node('poker').classList.remove('active')
  };
  for (const [name, mutate] of Object.entries(cases)) await t.test(name, () => {
    const f = fixture(); f.node('p230AutoCheck').click(); mutate(f); f.tick(160);
    assert.equal(f.actions.length, 0); assert.equal(f.api.diagnostics().autoMode, null);
  });
});

test('preselected CHECK waits for your turn in the same hand and expires at the next hand', () => {
  const f = fixture(initial({ turnSeat: 1, you: { ...initial().you, yourTurn: false } }));
  f.node('p230AutoCheck').click(); f.tick(200); assert.equal(f.actions.length, 0);
  f.change({ turnSeat: 0, revision: 16, you: { ...f.state().you, yourTurn: true } }, true);
  f.tick(160); assert.deepEqual(f.actions.map(action => action.action), ['check']);
  const next = fixture(initial({ turnSeat: 1, you: { ...initial().you, yourTurn: false } }));
  next.node('p230AutoCheck').click(); next.change({ handNo: 8, turnSeat: 0, you: { ...next.state().you, yourTurn: true } }, true); next.tick(1000);
  assert.equal(next.actions.length, 0); assert.equal(next.api.diagnostics().autoMode, null);
});

test('manual actions, identity notifications and table exit cancel queued automatic actions', async t => {
  for (const name of ['manual check', 'identity event', 'leave table', 'toggle off']) await t.test(name, () => {
    const f = fixture(); f.node('p230AutoCheck').click();
    if (name === 'manual check') f.node('p59Call').click();
    else if (name === 'identity event') f.emit('jrvx-cas-identity');
    else if (name === 'leave table') f.poker.showLobby(false);
    else f.node('p230AutoCheck').click();
    f.tick(1000); assert.equal(f.actions.length, name === 'manual check' ? 1 : 0); assert.equal(f.api.diagnostics().autoMode, null);
  });
});

test('a scheduled auto action expires when its turn ends or the server disconnects', () => {
  const ended = fixture(); ended.node('p230AutoCheck').click();
  ended.change({ turnSeat: 1, you: { ...ended.state().you, yourTurn: false } }, true);
  ended.change({ turnSeat: 0, revision: 17, you: { ...ended.state().you, yourTurn: true } }, true);
  ended.tick(1000); assert.equal(ended.actions.length, 0); assert.equal(ended.api.diagnostics().autoMode, null);
  const offline = fixture(); offline.node('p230AutoCheck').click();
  offline.setConnected(false); offline.frame(); offline.setConnected(true); offline.frame();
  offline.tick(1000); assert.equal(offline.actions.length, 0); assert.equal(offline.api.diagnostics().autoMode, null);
});
