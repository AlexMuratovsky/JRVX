(function (root, factory) {
  'use strict';
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else if (root) root.JRVXCASMoneyV330 = api;
})(typeof window === 'object' ? window : typeof globalThis === 'object' ? globalThis : undefined, function () {
  'use strict';

  const CURRENCY = 'MG';
  const GROUP_SEPARATOR = '\u00a0';
  const SCALES = Object.freeze(['', 'K', 'M', 'B', 'T']);

  // The returned bigint is the exact amount. Decimal, signed, exponent, padded,
  // whitespace and unsafe Number inputs are rejected instead of being rounded.
  function parseAmount(value) {
    if (typeof value === 'bigint') {
      if (value < 0n) throw new RangeError('MG amount must not be negative');
      return value;
    }
    if (typeof value === 'number') {
      if (!Number.isSafeInteger(value) || value < 0) {
        throw new RangeError('MG amount must be a nonnegative safe integer');
      }
      return BigInt(value);
    }
    if (typeof value === 'string' && /^(?:0|[1-9][0-9]*)$/.test(value)) {
      return BigInt(value);
    }
    throw new TypeError('MG amount must be a bigint, safe integer or canonical integer string');
  }

  function isValidAmount(value) {
    try { parseAmount(value); return true; }
    catch { return false; }
  }

  function withCurrency(text, currency) {
    if (typeof currency !== 'boolean') throw new TypeError('currency must be a boolean');
    return currency ? text + ' ' + CURRENCY : text;
  }

  function formatExact(value, { currency = true } = {}) {
    const digits = parseAmount(value).toString();
    return withCurrency(digits.replace(/\B(?=(?:[0-9]{3})+(?![0-9]))/g, GROUP_SEPARATOR), currency);
  }

  function formatCompact(value, { currency = true } = {}) {
    const amount = parseAmount(value);
    const group = Math.floor((amount.toString().length - 1) / 3);
    if (group === 0) return withCurrency(amount.toString(), currency);

    const precision = group === 1 ? 1 : 2;
    const factor = 10n ** BigInt(precision);
    const divisor = 1000n ** BigInt(group);
    const truncated = amount * factor / divisor;
    const whole = (truncated / factor).toString();
    const fraction = (truncated % factor).toString().padStart(precision, '0').replace(/0+$/, '');
    // Higher orders use explicit powers, preserving readable scale without
    // inventing ambiguous currency suffixes or falling back to Number.
    const suffix = SCALES[group] || '\u00d710^' + (group * 3);
    return withCurrency(whole + (fraction ? '.' + fraction : '') + suffix, currency);
  }

  return Object.freeze({
    version: 'v330', currency: CURRENCY, parseAmount, isValidAmount, formatCompact, formatExact
  });
});
