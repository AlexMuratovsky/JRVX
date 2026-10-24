// These checks exercise the development fallback bundled with CAS. Production
// delegates to /api/blackjack/action; its backend is not present in this repo.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const source = fs.readFileSync(path.join(__dirname, '../public/assets/js-v328/casino.js'), 'utf8');
const card = (r, s = '♠') => ({ r, s });
const cards = ranks => ranks.map(rank => card(rank));
const hand = (ranks, extra = {}) => ({ cards: cards(ranks), bet: 50, done: false, doubled: false, fromSplit: false, ...extra });

function fixture({ bank = 1000 } = {}) {
  const nodes = new Map(), records = new Map(), debits = [], credits = [];
  const playerProfile = { casinoProfit: 0, casinoWagered: 0 };
  function node(id) {
    if (!nodes.has(id)) nodes.set(id, { value: '50', textContent: '', innerHTML: '', disabled: false, dataset: {}, style: {},
      classList: { toggle() {}, add() {}, remove() {} }, querySelector: () => null, querySelectorAll: () => [], addEventListener() {} });
    return nodes.get(id);
  }
  const ctx = { window: { JRVXCASIdentityV300: { state: () => ({ mode: 'development', requiresAuthentication: false }) },
      JRVXCasEconomy: { get: () => ({ currency: 'MS' }) } },
    document: { readyState: 'loading', addEventListener() {}, getElementById: node, querySelector: () => null, querySelectorAll: () => [] },
    localStorage: { getItem: key => records.get(key) ?? null, setItem: (key, value) => records.set(key, value) },
    navigator: {}, setTimeout() { return 1; }, clearTimeout() {}, console, playerProfile,
    casinoTakeBet(amount) { if (amount > bank) return false; bank -= amount; debits.push(amount); playerProfile.casinoWagered += amount; return true; },
    casinoReturn(payout, profit) { bank += payout; credits.push({ payout, profit }); playerProfile.casinoProfit += profit; },
    muraTokenBalance: () => bank, savePlayerProfile() {}, renderPlayerProfile() {}, casinoRefresh() {},
    profileEvent() {}, awardXP() {}, checkAchievements() {},
    fetch() { throw Error('Development rules audit must never contact an API'); } };
  vm.createContext(ctx); vm.runInContext(source, ctx);
  const api = ctx.window.JRVXCASV220.blackjack, state = api.state;
  function shoe(next = []) { state.shoe = [...Array.from({ length: 100 }, () => card('2')), ...next.slice().reverse()]; }
  shoe();
  return { api, state, nodes, records, debits, credits, playerProfile, shoe, get bank() { return bank; },
    active(player, dealer, extra = {}) { Object.assign(state, { hands: [hand(player)], dealer: cards(dealer), active: true, hand: 0,
      hideDealer: true, insuranceOffered: false, insuranceResolved: true, insuranceBet: 0, baseBet: 50, roundId: 1, ...extra }); } };
}

test('development fallback counts multiple aces without losing the soft/hard transition', () => {
  const f = fixture();
  for (const [ranks, value] of [[['A', '6'], 17], [['A', '6', '10'], 17], [['A', 'A', '9'], 21],
    [['A', 'A', 'A', '8'], 21], [['A', 'A', 'K'], 12], [['K', 'Q', '2'], 22]]) {
    assert.equal(f.api.value(cards(ranks)), value, ranks.join(','));
  }
});

test('development settlement covers natural precedence, split 21, ordinary win, loss, bust and push', async t => {
  const cases = [
    { name: 'natural vs dealer 17', player: ['A', 'K'], dealer: ['10', '7'], payout: 125, profit: 75, outcome: 'win' },
    { name: 'both natural', player: ['A', 'K'], dealer: ['A', 'Q'], payout: 50, profit: 0, outcome: 'push' },
    { name: 'natural beats dealer three-card 21', player: ['A', 'K'], dealer: ['7', '7', '7'], payout: 125, profit: 75, outcome: 'win' },
    { name: 'ordinary 21 loses to natural', player: ['7', '7', '7'], dealer: ['A', 'Q'], payout: 0, profit: -50, outcome: 'loss' },
    { name: 'split 21 pays ordinary win', player: ['A', 'K'], fromSplit: true, dealer: ['10', '7'], payout: 100, profit: 50, outcome: 'win' },
    { name: 'split 21 loses to natural', player: ['A', 'K'], fromSplit: true, dealer: ['A', 'Q'], payout: 0, profit: -50, outcome: 'loss' },
    { name: 'equal ordinary 20 pushes', player: ['K', 'Q'], dealer: ['J', '10'], payout: 50, profit: 0, outcome: 'push' },
    { name: 'ordinary higher hand wins', player: ['10', '9'], dealer: ['10', '8'], payout: 100, profit: 50, outcome: 'win' },
    { name: 'ordinary lower hand loses', player: ['10', '8'], dealer: ['10', '9'], payout: 0, profit: -50, outcome: 'loss' },
    { name: 'dealer bust', player: ['10', '8'], dealer: ['10', '6', '8'], payout: 100, profit: 50, outcome: 'win' },
    { name: 'player bust even if dealer busts', player: ['10', '6', '8'], dealer: ['10', '6', '8'], payout: 0, profit: -50, outcome: 'loss' }
  ];
  for (const item of cases) await t.test(item.name, () => {
    const f = fixture(); f.active(item.player, item.dealer);
    f.state.hands[0].fromSplit = item.fromSplit || false;
    f.api.stand();
    assert.equal(f.state.active, false);
    assert.equal(f.state.hands[0].outcome, item.outcome);
    assert.equal(f.state.hands[0].profit, item.profit);
    assert.equal(f.credits.reduce((sum, row) => sum + row.payout, 0), item.payout);
  });
});

test('development dealer stands on soft 17 and draws at hard 16', () => {
  const soft = fixture(); soft.active(['10', '8'], ['A', '6']); soft.shoe([card('10')]);
  const initial = soft.state.shoe.length; soft.api.stand();
  assert.equal(soft.state.dealer.length, 2); assert.equal(soft.state.shoe.length, initial);
  const hard = fixture(); hard.active(['10', '8'], ['10', '6']); hard.shoe([card('2')]); hard.api.stand();
  assert.equal(hard.state.dealer.length, 3); assert.equal(hard.api.value(hard.state.dealer), 18);
});

test('development natural deal spends once and returns 3:2 profit including the original stake', () => {
  const f = fixture(); f.shoe([card('A'), card('K'), card('10'), card('7')]); f.api.deal();
  assert.deepEqual(f.debits, [50]); assert.deepEqual(f.credits, [{ payout: 125, profit: 75 }]);
  assert.equal(f.bank, 1075); assert.equal(f.state.active, false);
  f.api.stand(); assert.equal(f.credits.length, 1, 'A settled hand cannot pay a second time through Stand');
});

test('development double charges one matching stake and draws one card before settling', () => {
  const f = fixture(); f.active(['5', '6'], ['10', '7']); f.shoe([card('10')]); f.api.double();
  assert.deepEqual(f.debits, [50]); assert.equal(f.state.hands[0].bet, 100);
  assert.equal(f.state.hands[0].cards.length, 3); assert.equal(f.state.hands[0].doubled, true);
  assert.equal(f.state.active, false); assert.deepEqual(f.credits, [{ payout: 200, profit: 100 }]);
  f.api.double(); assert.equal(f.debits.length, 1);
});

test('development split charges one extra stake and enforces rank, two cards and four-hand limit', () => {
  const f = fixture(); f.active(['8', '8'], ['10', '7']); f.shoe([card('2'), card('3')]); f.api.split();
  assert.deepEqual(f.debits, [50]); assert.equal(f.state.hands.length, 2);
  assert.equal(f.state.hands.every(row => row.fromSplit && row.cards.length === 2 && row.bet === 50), true);
  for (const row of [hand(['8', '7']), hand(['8', '8', '2']), hand(['8', '8'], { done: true })]) {
    const blocked = fixture(); blocked.active(['8', '8'], ['10', '7']); blocked.state.hands = [row]; blocked.api.split();
    assert.equal(blocked.debits.length, 0);
  }
  const limit = fixture(); limit.active(['8', '8'], ['10', '7']); limit.state.hands = Array.from({ length: 4 }, () => hand(['8', '8'])); limit.api.split();
  assert.equal(limit.debits.length, 0); assert.equal(limit.state.hands.length, 4);
});

test('development split aces receive one card each and never receive natural 3:2 payouts', () => {
  const f = fixture(); f.active(['A', 'A'], ['10', '7']); f.shoe([card('K'), card('Q')]); f.api.split();
  assert.equal(f.state.active, false); assert.equal(f.state.hands.length, 2);
  assert.equal(f.state.hands.every(row => row.done && row.fromSplit && row.cards.length === 2), true);
  assert.deepEqual(f.credits.map(row => row.payout), [100, 100]);
});

test('development insurance payout and main stake cancel when the dealer has natural blackjack', () => {
  const f = fixture(); f.shoe([card('10'), card('Q'), card('A'), card('K')]); f.api.deal();
  assert.equal(f.state.insuranceOffered, true); f.api.insurance();
  assert.deepEqual(f.debits, [50, 25]); assert.deepEqual(f.credits, [{ payout: 75, profit: 50 }]);
  assert.equal(f.bank, 1000); assert.equal(f.playerProfile.casinoProfit, 0); assert.equal(f.state.active, false);
});
