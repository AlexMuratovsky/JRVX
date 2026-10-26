const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const filename = path.join(__dirname, '../public/modules/core/runtime/money-v330.js');
const money = require(filename);

test('compact MG formatting matches every requested example exactly', () => {
  const cases = [
    [500, '500 MG'], [999, '999 MG'], [1000, '1K MG'], [1500, '1.5K MG'],
    [10000, '10K MG'], [55500, '55.5K MG'], [555555, '555.5K MG'],
    [999999, '999.9K MG'], [1000000, '1M MG'], [1250000, '1.25M MG'],
    [15500000, '15.5M MG'], [100000000, '100M MG']
  ];
  for (const [value, expected] of cases) assert.equal(money.formatCompact(value), expected);
});

test('thresholds select the scale from the full integer without upward promotion', () => {
  const cases = [
    [0, '0 MG'], [1, '1 MG'], [998, '998 MG'], [1001, '1K MG'],
    [1099, '1K MG'], [1100, '1.1K MG'], [1999, '1.9K MG'],
    [999949, '999.9K MG'], [999999, '999.9K MG'],
    [1000001, '1M MG'], [1009999, '1M MG'], [1010000, '1.01M MG'],
    [999999999, '999.99M MG'], [1000000000, '1B MG'],
    [999999999999, '999.99B MG'], [1000000000000, '1T MG'],
    [999999999999999n, '999.99T MG'], [1000000000000000n, '1\u00d710^15 MG']
  ];
  for (const [value, expected] of cases) assert.equal(money.formatCompact(value), expected);
});

test('compact display always represents an amount at or below the real balance', () => {
  const values = [0n, 999n, 1000n, 999999n, 1000000n, 999999999n, 10n ** 15n, 10n ** 33n - 1n];
  let state = 17n;
  for (let i = 0; i < 300; i++) {
    state = (state * 48271n) % 2147483647n;
    values.push(state * (1000n ** BigInt(i % 7)) + BigInt(i));
  }
  for (const value of values) {
    const text = money.formatCompact(value, { currency: false });
    const match = text.match(/^(\d+)(?:\.(\d+))?(K|M|B|T|\u00d710\^(\d+))?$/);
    assert.ok(match, text);
    const exponent = match[4] ? Number(match[4]) : ({ K: 3, M: 6, B: 9, T: 12 }[match[3]] || 0);
    const fractional = match[2] || '';
    const representedNumerator = BigInt(match[1] + fractional) * 10n ** BigInt(exponent);
    const denominator = 10n ** BigInt(fractional.length);
    assert.ok(representedNumerator <= value * denominator, value + ': ' + text);
  }
});

test('trailing decimal zeros disappear without altering meaningful digits', () => {
  for (const [value, expected] of [[1100000, '1.1M'], [1200000, '1.2M'], [1010000, '1.01M'], [1230000, '1.23M'], [1100, '1.1K'], [12000, '12K']]) {
    assert.equal(money.formatCompact(value, { currency: false }), expected);
  }
});

test('exact display uses full Russian grouping, including values beyond Number precision', () => {
  assert.equal(money.formatExact(0), '0 MG');
  assert.equal(money.formatExact(999), '999 MG');
  assert.equal(money.formatExact(1000), '1\u00a0000 MG');
  assert.equal(money.formatExact(1250000), '1\u00a0250\u00a0000 MG');
  assert.equal(money.formatExact('9007199254740993'), '9\u00a0007\u00a0199\u00a0254\u00a0740\u00a0993 MG');
  assert.equal(money.formatExact('9007199254740993', { currency: false }), '9\u00a0007\u00a0199\u00a0254\u00a0740\u00a0993');
});

test('valid input representations produce the same exact bigint without mutation', () => {
  const options = Object.freeze({ currency: false });
  for (const value of [0, 1, 1500, 1250000, Number.MAX_SAFE_INTEGER]) {
    assert.equal(money.parseAmount(value), BigInt(value));
    assert.equal(money.parseAmount(String(value)), BigInt(value));
    assert.equal(money.parseAmount(BigInt(value)), BigInt(value));
    assert.equal(money.formatCompact(value, options), money.formatCompact(String(value), options));
    assert.equal(money.isValidAmount(value), true);
  }
  assert.equal(money.parseAmount(-0), 0n);
  assert.deepEqual(options, { currency: false });
});

test('unsafe Number values never enter calculations even when visually integral', () => {
  for (const value of [Number.MAX_SAFE_INTEGER + 1, 9007199254740993, 1e30, Infinity, -Infinity, NaN, 0.5, -1, -0.5]) {
    assert.throws(() => money.parseAmount(value), RangeError);
    assert.throws(() => money.formatCompact(value), RangeError);
    assert.throws(() => money.formatExact(value), RangeError);
    assert.equal(money.isValidAmount(value), false);
  }
});

test('malformed and implicitly coercible values are rejected strictly', () => {
  const invalid = ['', ' ', ' 1', '1 ', '01', '00', '+1', '-1', '-0', '1.0', '1.5', '1e3', '1E3', '1_000', '1,000', '1 000', '1\n', '١', null, undefined, true, false, [], {}, new Number(1)];
  for (const value of invalid) {
    assert.throws(() => money.parseAmount(value), TypeError);
    assert.throws(() => money.formatCompact(value), TypeError);
    assert.throws(() => money.formatExact(value), TypeError);
    assert.equal(money.isValidAmount(value), false);
  }
  assert.throws(() => money.parseAmount(-1n), RangeError);
  assert.equal(money.isValidAmount(-1n), false);
});

test('large integer strings retain distinct exact units and scale beyond trillions', () => {
  assert.equal(money.parseAmount('9007199254740992') + 1n, money.parseAmount('9007199254740993'));
  assert.equal(money.formatCompact(Number.MAX_SAFE_INTEGER), '9\u00d710^15 MG');
  assert.equal(money.formatCompact('1259999999999999999999999999999999999'), '1.25\u00d710^36 MG');
  assert.equal(money.formatCompact(10n ** 90n), '1\u00d710^90 MG');
  assert.equal(money.formatCompact(10n ** 90n - 1n), '999.99\u00d710^87 MG');
});

test('currency labels are optional, explicit and never a caller-supplied currency name', () => {
  assert.equal(money.formatCompact(1500, { currency: false }), '1.5K');
  assert.equal(money.formatExact(1500, { currency: false }), '1\u00a0500');
  assert.equal(money.formatCompact(1500, { currency: true }), '1.5K MG');
  assert.throws(() => money.formatCompact(1500, { currency: 'MS' }), TypeError);
  assert.throws(() => money.formatExact(1500, { currency: 0 }), TypeError);
});

test('browser loading exports the same immutable API without a DOM or any requests', () => {
  const context = { window: {} };
  vm.runInNewContext(fs.readFileSync(filename, 'utf8'), context);
  const browser = context.window.JRVXCASMoneyV330;
  assert.equal(browser.version, 'v330');
  assert.equal(browser.currency, 'MG');
  assert.equal(Object.isFrozen(browser), true);
  assert.equal(browser.formatCompact('1250000'), '1.25M MG');
  assert.equal(browser.parseAmount('9007199254740993'), 9007199254740993n);
  assert.equal(Object.isFrozen(money), true);
});
