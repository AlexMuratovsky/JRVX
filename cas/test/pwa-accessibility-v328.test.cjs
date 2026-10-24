const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const source = fs.readFileSync(path.join(__dirname, '../public/modules/ui/runtime/pwa-v328.js'), 'utf8');

function fixture({ coarse = false } = {}) {
  const documentEvents = new Map(), windowEvents = new Map();
  let document;
  const listen = (events, type, fn) => { if (!events.has(type)) events.set(type, []); events.get(type).push(fn); };
  const event = (type, target, extra = {}) => ({ type, target, defaultPrevented: false, propagationStopped: false,
    preventDefault() { this.defaultPrevented = true; }, stopPropagation() { this.propagationStopped = true; }, ...extra });
  class Node {
    constructor(tagName = 'div') { this.tagName = tagName.toUpperCase(); this.children = []; this.attributes = {};
      this.events = new Map(); this.hidden = false; this.disabled = false; this.textContent = ''; this.parentNode = null;
      this.classList = { contains: value => this.className.split(/\s+/).includes(value),
        add: value => { if (!this.classList.contains(value)) this.className = (this.className + ' ' + value).trim(); },
        remove: value => { this.className = this.className.split(/\s+/).filter(x => x !== value).join(' '); },
        toggle: (value, force) => { const add = force ?? !this.classList.contains(value); this.classList[add ? 'add' : 'remove'](value); return add; } };
    }
    get className() { return this.attributes.class || ''; }
    set className(value) { this.attributes.class = value; }
    get id() { return this.attributes.id || ''; }
    set id(value) { this.attributes.id = value; }
    get isConnected() { return this === document?.body || !!this.parentNode?.isConnected; }
    get lastElementChild() { return this.children.at(-1) || null; }
    setAttribute(name, value) { this.attributes[name] = String(value); }
    getAttribute(name) { return this.attributes[name] ?? null; }
    appendChild(child) { if (child.parentNode) child.remove(); child.parentNode = this; this.children.push(child); return child; }
    insertBefore(child, next) { if (!next) return this.appendChild(child); const index = this.children.indexOf(next);
      if (index < 0) throw Error('Invalid reference node'); child.parentNode = this; this.children.splice(index, 0, child); return child; }
    remove() { if (!this.parentNode) return; this.parentNode.children = this.parentNode.children.filter(x => x !== this); this.parentNode = null; }
    contains(node) { return node === this || this.children.some(child => child.contains(node)); }
    descendants() { return this.children.flatMap(child => [child, ...child.descendants()]); }
    matches(selector) {
      const exclusions = [...selector.matchAll(/:not\(([^)]+)\)/g)].map(match => match[1]);
      selector = selector.replace(/:not\([^)]+\)/g, '');
      if (exclusions.some(value => this.matches(value))) return false;
      const tag = selector.match(/^[a-z]+/i)?.[0];
      if (tag && this.tagName !== tag.toUpperCase()) return false;
      const id = selector.match(/#([\w-]+)/)?.[1]; if (id && this.id !== id) return false;
      for (const match of selector.matchAll(/\.([\w-]+)/g)) if (!this.classList.contains(match[1])) return false;
      for (const match of selector.matchAll(/\[([\w-]+)(?:="([^"]*)")?\]/g)) {
        const value = match[1] === 'disabled' ? (this.disabled ? '' : null) : this.getAttribute(match[1]);
        if (value === null || (match[2] !== undefined && value !== match[2])) return false;
      }
      return true;
    }
    querySelectorAll(selector) { return this.descendants().filter(node => selector.split(',').some(value => node.matches(value.trim()))); }
    querySelector(selector) { return this.querySelectorAll(selector)[0] || null; }
    closest(selector) { return this.matches(selector) ? this : this.parentNode?.closest(selector) || null; }
    getClientRects() {
      if (!this.isConnected || this.hidden || (this.id === 'v290InstallSheet' && !this.classList.contains('show'))) return [];
      if (this.parentNode && !this.parentNode.getClientRects().length) return [];
      return [{ width: 100, height: 40 }];
    }
    focus() { if (!this.disabled && this.getClientRects().length) document.activeElement = this; }
    blur() { if (document.activeElement === this) document.activeElement = document.body; }
    addEventListener(type, fn) { listen(this.events, type, fn); }
    async click(target = this) {
      const e = event('click', target);
      for (let node = target; node; node = node.parentNode) for (const fn of node.events.get('click') || []) await fn(e);
      return e;
    }
    set innerHTML(html) {
      this.html = html; this.children = [];
      const stack = [this];
      for (const token of html.matchAll(/<\/?[^>]+>|[^<]+/g)) {
        if (token[0].startsWith('</')) { stack.pop(); continue; }
        if (!token[0].startsWith('<')) { stack.at(-1).textContent += token[0]; continue; }
        const tag = token[0].match(/^<([a-z0-9]+)/i)?.[1]; if (!tag) continue;
        const child = new Node(tag);
        for (const attr of token[0].slice(tag.length + 1, -1).matchAll(/([\w-]+)(?:="([^"]*)")?/g)) child.setAttribute(attr[1], attr[2] || '');
        stack.at(-1).appendChild(child);
        if (!['input', 'br', 'img', 'hr'].includes(tag)) stack.push(child);
      }
    }
    get innerHTML() { return this.html || ''; }
  }
  document = { readyState: 'loading', documentElement: new Node('html'), body: new Node('body'),
    createElement: tag => new Node(tag), addEventListener: (type, fn) => listen(documentEvents, type, fn),
    querySelector(selector) {
      if (selector === '#v69Home .v103TopRight') return host;
      return this.body.querySelector(selector);
    } };
  const host = new Node(); host.className = 'v103TopRight'; document.body.appendChild(host); document.activeElement = document.body;
  const window = { addEventListener: (type, fn) => listen(windowEvents, type, fn) };
  vm.runInNewContext(source, { window, document, navigator: { userAgent: 'iPhone', platform: 'iPhone', maxTouchPoints: 1, onLine: true },
    matchMedia: query => ({ matches: query === '(pointer: coarse)' && coarse, addEventListener() {} }),
    location: { protocol: 'https:' }, localStorage: { setItem() {} }, Date, console,
    setTimeout: () => 1, clearTimeout() {}, setInterval: () => 1,
    MutationObserver: class { observe() {} } });
  for (const fn of documentEvents.get('DOMContentLoaded') || []) fn();
  const q = selector => document.querySelector(selector);
  const key = (value, { target = document.activeElement, shiftKey = false } = {}) => {
    const e = event('keydown', target, { key: value, shiftKey });
    // Window capture runs before existing game/document keyboard handlers.
    for (const fn of windowEvents.get('keydown') || []) fn(e);
    if (e.propagationStopped) return e;
    // Bubble through the focused element and then the document listeners.
    for (let node = target; node; node = node.parentNode) for (const fn of node.events.get('keydown') || []) fn(e);
    for (const fn of documentEvents.get('keydown') || []) fn(e);
    return e;
  };
  return { document, host, windowEvents, documentEvents, q, key,
    create: tag => new Node(tag),
    async open() { const button = q('#v290InstallBtn'); button.focus(); await button.click(); return q('#v290InstallSheet'); } };
}

test('the iOS install instructions open as a labelled modal and receive keyboard focus', async () => {
  const f = fixture(), sheet = await f.open(), dialog = sheet.querySelector('[role="dialog"]');
  assert.ok(dialog, 'The instruction card must expose dialog semantics');
  assert.equal(dialog.getAttribute('aria-modal'), 'true');
  assert.ok(f.q('#' + dialog.getAttribute('aria-labelledby')));
  assert.ok(f.q('#' + dialog.getAttribute('aria-describedby')));
  assert.equal(sheet.hidden, false);
  assert.equal(f.document.activeElement, sheet.querySelector('[data-v290-close]'));
});

test('Escape closes the install dialog and restores focus to its opener', async () => {
  const f = fixture(), sheet = await f.open(), e = f.key('Escape');
  assert.equal(e.defaultPrevented, true);
  assert.equal(sheet.classList.contains('show'), false);
  assert.equal(sheet.hidden, true);
  assert.equal(f.document.activeElement, f.q('#v290InstallBtn'));
});

test('the close button leaves no focus in the hidden install sheet', async () => {
  const f = fixture(), sheet = await f.open(); await sheet.querySelector('[data-v290-close]').click();
  assert.equal(sheet.hidden, true);
  assert.equal(sheet.contains(f.document.activeElement), false);
  assert.equal(f.document.activeElement, f.q('#v290InstallBtn'));
});

test('clicking the backdrop closes the install dialog and restores focus', async () => {
  const f = fixture(), sheet = await f.open(); await sheet.click();
  assert.equal(sheet.hidden, true);
  assert.equal(f.document.activeElement, f.q('#v290InstallBtn'));
});

test('clicking the instruction card does not close it', async () => {
  const f = fixture(), sheet = await f.open(); await sheet.querySelector('.v290InstallCard').click();
  assert.equal(sheet.classList.contains('show'), true);
});

test('Tab and Shift+Tab stay on the single close button instead of entering the game', async () => {
  const f = fixture(), sheet = await f.open(), close = sheet.querySelector('[data-v290-close]');
  for (const shiftKey of [false, true]) {
    const e = f.key('Tab', { shiftKey });
    assert.equal(e.defaultPrevented, true);
    assert.equal(f.document.activeElement, close);
  }
});

test('multiple dialog controls wrap at both keyboard boundaries', async () => {
  const f = fixture(), sheet = await f.open(), first = sheet.querySelector('[data-v290-close]');
  const last = f.create('button'); sheet.querySelector('.v290InstallCard').appendChild(last);
  last.focus(); assert.equal(f.key('Tab').defaultPrevented, true); assert.equal(f.document.activeElement, first);
  first.focus(); assert.equal(f.key('Tab', { shiftKey: true }).defaultPrevented, true); assert.equal(f.document.activeElement, last);
});

test('an unexpected background focus is returned to the open modal on Tab', async () => {
  const f = fixture(), sheet = await f.open(); f.q('#v290InstallBtn').focus();
  assert.equal(f.key('Tab').defaultPrevented, true);
  assert.equal(f.document.activeElement, sheet.querySelector('[data-v290-close]'));
});

test('reopening reuses the sheet and restores focus correctly on each close', async () => {
  const f = fixture(), sheet = await f.open(); f.key('Escape');
  assert.equal(await f.open(), sheet);
  assert.equal(f.document.activeElement, sheet.querySelector('[data-v290-close]'));
  f.key('Escape');
  assert.equal(f.document.body.querySelectorAll('#v290InstallSheet').length, 1);
  assert.equal(f.document.activeElement, f.q('#v290InstallBtn'));
  const unrelated = f.key('Escape'); assert.equal(unrelated.defaultPrevented, false);
});

test('removing the opener before close never leaves focus trapped in a hidden sheet', async () => {
  const f = fixture(), sheet = await f.open(); f.q('#v290InstallBtn').remove();
  await sheet.querySelector('[data-v290-close]').click();
  assert.equal(sheet.hidden, true);
  assert.equal(sheet.contains(f.document.activeElement), false);
});

test('a recreated install button receives return focus when the original opener was removed', async () => {
  const f = fixture(), sheet = await f.open(), original = f.q('#v290InstallBtn'); original.remove();
  for (const fn of f.windowEvents.get('pageshow') || []) fn();
  const replacement = f.q('#v290InstallBtn'); assert.notEqual(replacement, original);
  await sheet.querySelector('[data-v290-close]').click();
  assert.equal(f.document.activeElement, replacement);
});

test('if all dialog controls are disabled keyboard focus remains on the dialog card', async () => {
  const f = fixture(), sheet = await f.open(); sheet.querySelector('[data-v290-close]').disabled = true;
  assert.equal(f.key('Tab').defaultPrevented, true);
  assert.equal(f.document.activeElement, sheet.querySelector('[role="dialog"]'));
});

test('manual iOS instructions and synthetic native install prompting retain their existing paths', async () => {
  const f = fixture(), sheet = await f.open();
  assert.equal(sheet.querySelectorAll('.v290InstallStep').length, 3);
  for (const text of ['Поделиться', 'На экран «Домой»', 'полноэкранном режиме']) assert.ok(sheet.innerHTML.includes(text));
  f.key('Escape');
  let prompts = 0, prevented = 0;
  const nativeEvent = { preventDefault() { prevented++; }, prompt: async () => { prompts++; }, userChoice: Promise.resolve({ outcome: 'dismissed' }) };
  for (const fn of f.windowEvents.get('beforeinstallprompt') || []) fn(nativeEvent);
  assert.equal(prevented, 1); assert.equal(prompts, 0, 'The platform prompt requires the explicit install-button action');
  await f.q('#v290InstallBtn').click();
  assert.equal(prompts, 1);
  assert.equal(sheet.classList.contains('show'), false);
});

test('the existing coarse-pointer gesture prevention policy is preserved', () => {
  const f = fixture({ coarse: true }); let prevented = false;
  for (const fn of f.documentEvents.get('gesturestart') || []) fn({ preventDefault() { prevented = true; } });
  assert.equal(prevented, true);
});
