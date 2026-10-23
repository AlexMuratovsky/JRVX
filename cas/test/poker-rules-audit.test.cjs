const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
// Exact, unmodified frontend source read from the public production URL:
// https://cas.jrvx.ru/modules/poker/legacy-runtime/01-poker-v59-core.js
// Keep the baseline for provenance; exercise the active evaluator and LOCAL
// HeadsUpGame. Authoritative backend tests run separately on the private source.
const fixturePath = path.join(__dirname, 'fixtures/poker-v59-core.js');
const Core = require('../public/modules/poker/runtime/poker-core-v326.js');
const cards = value => value.split(' ');
const score = value => Core.score5(cards(value));
const best = value => Core.bestHand(cards(value));
const compare = (left, right) => Math.sign(Core.compareScore(score(left), score(right)));

test('the poker audit fixture is byte-for-byte the verified production frontend Core', () => {
  assert.equal(crypto.createHash('sha256').update(fs.readFileSync(fixturePath)).digest('hex'), '465b01b133e13b6b4dcc5fe2e77b832a1ebbc74767dfac690bc9c9dc992b4489');
});

test('the production deck contains exactly 52 distinct valid cards', () => {
  for (const random of [() => 0, () => 0.5, () => 0.999999]) {
    const deck = Core.makeDeck(random); assert.equal(deck.length, 52); assert.equal(new Set(deck).size, 52);
    assert.ok(deck.every(card => /^[2-9TJQKA][SHDC]$/.test(card)));
  }
});

test('all 2,598,960 five-card hands match the complete standard category distribution', () => {
  const deck = [];
  for (const rank of '23456789TJQKA') for (const suit of 'SHDC') deck.push(rank + suit);
  const counts = Array(9).fill(0);
  for (let a = 0; a < 48; a++) for (let b = a + 1; b < 49; b++) for (let c = b + 1; c < 50; c++) {
    for (let d = c + 1; d < 51; d++) for (let e = d + 1; e < 52; e++) counts[Core.score5([deck[a], deck[b], deck[c], deck[d], deck[e]])[0]]++;
  }
  // Exact combinatorial totals, ordered high card through straight flush.
  assert.deepEqual(counts, [1302540, 1098240, 123552, 54912, 10200, 5108, 3744, 624, 40]);
  assert.equal(counts.reduce((sum, count) => sum + count, 0), 2598960);
});

test('wheel straights use a low ace; six-high and royal straights rank correctly', () => {
  assert.deepEqual(score('AS 2H 3D 4C 5S'), [4, 5]);
  assert.equal(compare('2S 3H 4D 5C 6S', 'AS 2H 3D 4C 5S'), 1);
  assert.deepEqual(score('AS 2S 3S 4S 5S'), [8, 5]);
  assert.deepEqual(score('TS JS QS KS AS'), [8, 14]);
  assert.equal(score('QS KH AD 2C 3S')[0], 0, 'An ace does not wrap the middle of a straight');
});

test('all category comparisons and fifth-card flush kickers use the correct ordering', () => {
  const ascending = ['AS QH 9D 7C 3S', 'AS AH 9D 7C 3S', 'AS AH 9D 9C 3S', 'AS AH AD 7C 3S', '5S 6H 7D 8C 9S', '2H 5H 8H JH AH', 'AS AH AD 7C 7S', 'AS AH AD AC 3S', '5S 6S 7S 8S 9S'];
  for (let i = 1; i < ascending.length; i++) assert.equal(compare(ascending[i], ascending[i - 1]), 1);
  assert.equal(compare('AH KH QH JH 9H', 'AS KS QS JS 8S'), 1);
  assert.equal(compare('AH KH QH JH 9H', 'AS KS QS JS 9S'), 0, 'Suits never break ties');
});

test('pair, two-pair, trips, full-house and quads tie breakers include every required kicker', () => {
  for (const [left, right] of [
    ['AS AH KD QC 9S', 'AC AD KH QS 8H'],
    ['AS AH KD QC 9S', 'AC AD KH JS TH'],
    ['AS AH KD QC 9S', 'AC AD QH JS TH'],
    ['AS AH KD KC QS', 'AC AD KH KS JH'],
    ['KS KH QD QC 2S', 'KC KD JH JS AH'],
    ['AS AH AD KC QS', 'AC AS AH KH JH'],
    ['AS AH AD KC KS', 'KS KH KD AC AS'],
    ['AS AH AD AC KS', 'AS AH AD AC QS']
  ]) assert.equal(compare(left, right), 1, left + ' > ' + right);
  assert.equal(compare('AS KD QH JC 9S', 'AH KC QS JD 8H'), 1);
});

test('best-of-seven handles six-card flushes, long straights, two trips and three pairs', () => {
  assert.deepEqual(best('AH KH QH JH 9H 2H 3C'), [5, 14, 13, 12, 11, 9]);
  assert.deepEqual(best('AS 2H 3D 4C 5S 6H 7D'), [4, 7]);
  assert.deepEqual(best('AS AH AD KS KH KD 2C'), [6, 14, 13]);
  assert.deepEqual(best('AS AH KS KH QS QH 2C'), [2, 14, 13, 12]);
  assert.deepEqual(best('AS AH AD AC KS KH 2C'), [7, 14, 13]);
});

function showdownFixture(holeA, holeB, board) {
  const game = new Core.HeadsUpGame({ buyIn: 100 });
  game.player().stack = game.bot().stack = 90;
  game.player().hole = cards(holeA); game.bot().hole = cards(holeB); game.community = cards(board);
  game.pot = 20; game.active = true; game.street = 'river'; game.turnSeat = 0;
  return game;
}
const total = game => game.player().stack + game.bot().stack + game.pot;

test('a board-only best hand ties and splits the pot without using either hole card', () => {
  const game = showdownFixture('2S 3D', '4H 5C', 'TS JS QS KS AS');
  const result = game.showdown();
  assert.equal(result.ok, true); assert.equal(result.result.winners.length, 2);
  assert.deepEqual([game.player().stack, game.bot().stack, game.pot], [100, 100, 0]);
  assert.equal(game.active, false); assert.equal(game.turnSeat, null);
});

test('showdown awards the entire pot to the kicker winner and conserves chips', () => {
  const game = showdownFixture('AS KD', 'AH QD', 'AC 7S 6D 4H 2C');
  const result = game.showdown();
  assert.deepEqual(result.result.winners, [game.player().id]);
  assert.deepEqual([game.player().stack, game.bot().stack], [110, 90]); assert.equal(total(game), 200);
});

test('fold awards the pot once, closes the hand and rejects further actions', () => {
  const game = showdownFixture('AS KD', 'AH QD', 'AC 7S 6D 4H 2C');
  const result = game.act(0, 'fold'); assert.equal(result.ok, true);
  assert.deepEqual(result.result.winners, [game.bot().id]); assert.equal(total(game), 200);
  assert.equal(game.act(0, 'call').ok, false); assert.equal(total(game), 200);
});

test('preflop calling leaves the big blind its option and postflop starts left of the dealer', () => {
  const game = new Core.HeadsUpGame({ buyIn: 100, random: () => 0.5 });
  assert.equal(game.startHand().ok, true); assert.equal(game.turnSeat, game.smallBlindSeat);
  assert.equal(game.act(game.playerSeat, 'call').ok, true);
  assert.equal(game.street, 'preflop'); assert.equal(game.turnSeat, game.bigBlindSeat);
  assert.equal(game.botAct().ok, true); assert.equal(game.street, 'flop'); assert.equal(game.community.length, 3);
  assert.equal(game.turnSeat, game.bigBlindSeat); assert.equal(total(game), 200);
});

test('out-of-turn and illegal check actions cannot mutate the local hand', () => {
  const game = new Core.HeadsUpGame({ buyIn: 100, random: () => 0.5 }); game.startHand();
  const before = JSON.stringify(game.state());
  assert.equal(game.act(game.botSeat, 'raise', 100).ok, false);
  assert.equal(game.act(game.playerSeat, 'check').ok, false);
  assert.equal(game.act(game.playerSeat, 'invalid').ok, false);
  assert.equal(JSON.stringify(game.state()), before);
});

test('heads-up all-ins refund every uncalled chip before awarding the matched pot', async t => {
  for (const shortWins of [false, true]) await t.test(shortWins ? 'short stack wins' : 'large stack wins', () => {
    const game = new Core.HeadsUpGame({ buyIn: 100, random: () => 0.5 }); game.bot().stack = 20;
    game.startHand(); game.player().hole = cards(shortWins ? 'KS QH' : 'AS AH');
    game.bot().hole = cards(shortWins ? 'AS AH' : 'KS QH'); game.deck = cards('9S 8C 4D 3H 2S');
    assert.equal(game.act(game.playerSeat, 'raise', 100).ok, true); assert.equal(game.botAct().ok, true);
    assert.equal(game.street, 'showdown'); assert.equal(game.community.length, 5);
    assert.equal(game.lastResult.pot, 40, 'Only the matched 20+20 belongs to the contested pot');
    assert.deepEqual([game.player().stack, game.bot().stack], shortWins ? [80, 40] : [120, 0]);
    assert.equal(total(game), 120); assert.ok(game.log.some(entry => entry.kind === 'refund'));
  });
});

test('a short hero calling a larger all-in receives only its eligible heads-up pot', () => {
  const game = new Core.HeadsUpGame({ buyIn: 100, random: () => 0.5 }); game.player().stack = 20;
  game.startHand(); game.player().hole = cards('AS AH'); game.bot().hole = cards('KS QH'); game.deck = cards('9S 8C 4D 3H 2S');
  game.act(game.playerSeat, 'call'); game.act(game.botSeat, 'raise', 100); game.act(game.playerSeat, 'call');
  assert.equal(game.lastResult.pot, 40); assert.deepEqual([game.player().stack, game.bot().stack], [40, 80]); assert.equal(total(game), 120);
});

test('frontend HeadsUpGame exposes exactly two seats; multiway side-pot backend is outside this fixture', () => {
  const game = new Core.HeadsUpGame({ buyIn: 100 }); assert.equal(game.state().seats.length, 2);
  assert.equal(typeof Core.SidePot, 'undefined');
});

test('local hands cannot post phantom blinds from either busted or sub-BB opponent', () => {
  for (const seat of [0,1]) for (const shortStack of [0,1]) {
    const game=new Core.HeadsUpGame({buyIn:100,seat,random:()=>.5});
    game.bot().stack=shortStack;
    const before=JSON.stringify(game.state());
    const result=game.startHand();assert.equal(result.ok,false);assert.match(result.error,/JRVX/);
    assert.equal(JSON.stringify(game.state()),before);
    assert.equal(game.handNo,0);assert.equal(game.pot,0);
  }
});

test('local unopened flop allows a one-BB bet while preflop retains its full raise', () => {
  const game=new Core.HeadsUpGame({buyIn:100,random:()=>.5});game.startHand();
  assert.equal(game.minRaiseTo(),4);game.act(game.playerSeat,'call');game.botAct();
  assert.equal(game.street,'flop');assert.equal(game.currentBet,0);assert.equal(game.minRaiseTo(),2);
  assert.equal(game.act(game.turnSeat,'bet',2).ok,true);assert.equal(game.currentBet,2);
});

test('a zero-stack street transition refunds unmatched chips before resetting street bets', () => {
  const game=new Core.HeadsUpGame({buyIn:100,random:()=>.5});game.startHand();
  game.player().hole=cards('AS AH');game.bot().hole=cards('KS QH');game.deck=cards('9S 8C 4D 3H 2S');
  game.player().stack=0;game.player().bet=10;game.bot().stack=98;game.bot().bet=2;game.pot=12;
  const before=total(game);game.advanceStreet();
  assert.equal(game.lastResult.pot,4);assert.equal(game.street,'showdown');
  assert.equal(game.player().stack,12);assert.equal(game.bot().stack,98);assert.equal(total(game),before);
});
