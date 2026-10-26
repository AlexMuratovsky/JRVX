const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const source = fs.readFileSync(path.join(__dirname, '../public/modules/profile/runtime/profile-v330.js'), 'utf8');
const money=require('../public/modules/core/runtime/money-v330.js');
const A = 'JRVX-AAAA11111111', B = 'JRVX-BBBB22222222';
const production = (id = B, nickname = 'Current B') => ({
  mode: 'production', requiresAuthentication: true, authenticated: true, user: { id, nickname }
});

function fixture({ auth = production(), progress = null, legacyRemote = { id: A, nickname: 'Former A' }, mg = 1250000, fetchImpl = () => { throw Error('Unexpected fetch'); } } = {}) {
  let identity = auth,storageReads=0;
  const events = new Map(), timers = [], nodes = new Map();
  for (const id of ['v109TopMG','v70ProfileMG','v71ProfileMG','v109ProfileName', 'v109ProfileId', 'v109PokerWins', 'v109PokerHands',
    'v109TopName', 'v109TopAvatar', 'v109ProfileAvatar', 'v109OnlineState', 'v109ActiveCurrency',
    'v70Nick', 'v70PlayerId', 'v70SaveProfile', 'v109IdentityNote', 'v109IdentityBadge']) {
    nodes.set(id, { textContent: '', value: '', readOnly: false, disabled: false, style: {},
      attrs: {}, setAttribute(name, value) { this.attrs[name] = value; } });
  }
  const document = { readyState: 'loading', title: 'JRVX CAS', documentElement: { dataset: {} }, querySelector: () => null, querySelectorAll: () => [],
    getElementById: id => nodes.get(id) || null,
    addEventListener(type, fn) { if (!events.has(type)) events.set(type, []); events.get(type).push(fn); } };
  const messages = [];
  const window = {
    JRVXCASMoneyV330:money,
    JRVXIdentity: legacyRemote,
    playerProfile: { nickname: 'Former A', pokerWins: 77, pokerHands: 99 },
    JRVXCASIdentityV300: { state: () => identity },
    JRVXProgress: { state: progress },
    JVRXCasEconomy: { get: () => ({mg,currency:'MG'}) },
    arcadeNetState: { connected: false },
    handleArcadeNetMessage(message) { messages.push(message); return 'base-result'; }, addEventListener() {}
  };
  if (auth === null) delete window.JRVXCASIdentityV300;
  const context = vm.createContext({ window, document, localStorage: { getItem: () => {storageReads++;return '{"ms":999999,"mg":999999}'}, removeItem() {} }, location: {},
    setTimeout(fn, delay) { timers.push({ fn, delay }); return timers.length; }, clearTimeout() {}, fetch: fetchImpl, AbortController });
  vm.runInContext(source, context);
  const fire = type => { for (const fn of events.get(type) || []) fn(); };
  return { nodes, window, messages, events,get storageReads(){return storageReads}, sync: () => window.__jrvxProfileSync(), fire, load: code => vm.runInContext(code, context),
    setIdentity(value) { identity = value; fire('jrvx-cas-identity'); },
    drainImmediate() {
      for (let iterations = 0; iterations < 20; iterations++) {
        const index = timers.findIndex(timer => timer.delay === 0);
        if (index < 0) return;
        timers.splice(index, 1)[0].fn();
      }
      throw Error('Unexpected recurring profile timer');
    } };
}


const adminSource=fs.readFileSync(path.join(__dirname,'../public/modules/profile/runtime/admin-v330.js'),'utf8');
const PLAYER_A = 'JRVX-AAAA12345678', PLAYER_B = 'JRVX-BBBB12345678', PLAYER_C = 'JRVX-CCCC12345678';
const ledgerRow = (accountId, transactionId = 'receipt-' + accountId) => ({ accountId, user: accountId, transactionId, type: 'roulette', currency:'MG', delta: 5, balanceAfter: 105, createdAt: 1792846800000 });

function adminFixture() {
  const nodes = new Map(), listeners = new Map(), sent = [], timers = [], toasts = [], ledgerRequests = [];
  let owner = 'JRVX-ROOT11101111', connected = true, accept = true, throwSend = false, role = 'SUPERADMIN', html = '';
  const makeNode = id => ({ id, dataset: {}, value: '', textContent: '', onclick: null,
    addEventListener(type, fn) { this['on' + type] = fn; },
    click() { this.onclick?.({ target: this, preventDefault() {} }); },
    querySelectorAll(selector) {
      const attribute = selector === '[data-v270-tab]' ? 'tab' : selector === '[data-v270-user]' ? 'user' : '';
      if (!attribute) return [];
      return [...html.matchAll(new RegExp('data-v270-' + attribute + '="([^"]+)"', 'g'))].map(match => {
        const item = node(attribute + ':' + match[1]); item.dataset[attribute === 'tab' ? 'v270Tab' : 'v270User'] = match[1]; return item;
      });
    } });
  const root = makeNode('v70AdminRoot');
  Object.defineProperty(root, 'innerHTML', { get: () => html, set(value) { html = value; } });
  nodes.set(root.id, root);
  function node(id) { if (!nodes.has(id)) nodes.set(id, makeNode(id)); return nodes.get(id); }
  const ctx = { console, setTimeout: (fn, ms) => { timers.push({ fn, ms }); return timers.length; },
    document: { readyState: 'loading', getElementById: node, addEventListener: (type, fn) => listeners.set(type, fn) },
    confirm: () => true };
  ctx.window = {
    JRVXCASMoneyV330:money,
    JRVXCASIdentityV300: { state: () => ({ requiresAuthentication: true, authenticated: !!owner, user: owner ? { id: owner } : null }) },
    JRVXCASServerAccount: { refresh: async () => ({ account: { id: owner, role, enabled: true } }) },
    arcadeNetState: { get connected() { return connected; } },
    arcadeNetSend(message) { sent.push(message); if (message.type === 'admin_get_ledger') ledgerRequests.push(message); if (throwSend) throw Error('not_sent'); return accept; },
    handleArcadeNetMessage() {}, showArcadeToast: (...args) => toasts.push(args)
  };
  vm.createContext(ctx); vm.runInContext(adminSource, ctx); listeners.get('DOMContentLoaded')();
  const receive = message => ctx.window.handleArcadeNetMessage(message);
  receive({ type: 'hello_ack', playerId: owner, admin: true, role });
  receive({ type: 'admin_users', users: [PLAYER_A, PLAYER_B, PLAYER_C].map(id => ({ id, nickname: id, role: 'USER', enabled: true, mg:0 })) });
  function tab(name) { root.querySelectorAll('[data-v270-tab]').find(node => node.dataset.v270Tab === name).click(); }
  function select(id) { tab('users'); root.querySelectorAll('[data-v270-user]').find(node => node.dataset.v270User === id).click(); }
  function request(id) { select(id); node('v270LedgerUser').click(); }
  return { node, receive, tab, select, request, sent, ledgerRequests, toasts, api: ctx.window.JRVXAdminV270,
    html: () => html, setAccepted(value) { accept = value; }, setThrow(value) { throwSend = value; }, setConnected(value) { connected = value; },
    identity(value) { owner = value; listeners.get('jrvx-cas-identity')(); },
    reconnect() { receive({ type: 'hello_ack', playerId: owner, admin: true, role }); },
    flushRequestTimers() { const due = timers.filter(timer => timer.ms === 80); timers.length = 0; due.forEach(timer => timer.fn()); }
  };
}


test('profile shows one compact MG balance with exact titles and retains verified identity/statistics',()=>{const f=fixture({progress:{stats:{poker:{wins:3,hands:12}}}});f.sync();assert.equal(f.nodes.get('v109TopMG').textContent,'1.25M MG');assert.equal(f.nodes.get('v70ProfileMG').title,money.formatExact(1250000));assert.equal(f.nodes.get('v109ProfileName').textContent,'Current B');assert.equal(f.nodes.get('v109PokerWins').textContent,3);assert.equal(f.storageReads,0)});

test('both profile balance panels follow the canonical wallet and clear on sign-out',()=>{const f=fixture();f.sync();for(const id of ['v70ProfileMG','v71ProfileMG']){assert.equal(f.nodes.get(id).textContent,'1.25M MG');assert.equal(f.nodes.get(id).title,money.formatExact(1250000));assert.equal(f.nodes.get(id).attrs['aria-label'],money.formatExact(1250000))}f.setIdentity({mode:'production',requiresAuthentication:true,authenticated:false,user:null});f.drainImmediate();for(const id of ['v70ProfileMG','v71ProfileMG'])assert.equal(f.nodes.get(id).textContent,'0 MG')});

test('profile never imports browser financial data when the canonical wallet is unavailable',()=>{const f=fixture();delete f.window.JVRXCasEconomy;f.sync();assert.equal(f.nodes.get('v109TopMG').textContent,'0 MG');assert.equal(f.storageReads,0)});

test('profile clears stale MG on sign-out before a previous wallet snapshot has reset',()=>{const f=fixture();f.sync();f.setIdentity({mode:'production',requiresAuthentication:true,authenticated:false,user:null});f.drainImmediate();assert.equal(f.nodes.get('v109TopMG').textContent,'0 MG');assert.equal(f.nodes.get('v109ProfileName').textContent,'Игрок');assert.equal(f.nodes.get('v109PokerWins').textContent,0)});

test('profile rejects unsafe or negative wallet values instead of rounding or exposing another account cache',()=>{for(const mg of [-1,1.5,Number.MAX_SAFE_INTEGER+1]){const f=fixture({mg});f.sync();assert.equal(f.nodes.get('v109TopMG').textContent,'0 MG');assert.equal(f.storageReads,0)}});

function editMG(f,value){f.select(PLAYER_A);f.node('v270Nick').value=PLAYER_A;f.node('v270MG').value=value;f.node('v270Enabled').value='1';f.node('v270Role').value='USER';f.node('v270Save').click()}

test('admin editor contains only MG and preserves the full integer input',()=>{const f=adminFixture();f.select(PLAYER_A);assert.match(f.html(),/id="v270MG"/);assert.match(f.html(),/Точный баланс MG/);assert.doesNotMatch(f.html(),/v270MS|Mura Silver|\bMS\b/);editMG(f,'1250000');const msg=f.sent.at(-1);assert.equal(msg.type,'admin_update_user');assert.equal(msg.mg,1250000);assert.equal('ms' in msg,false)});

test('admin refuses compact, fractional, signed, exponent and unsafe editor amounts',()=>{for(const value of ['1.5K','1.2','-1','1e6','9007199254740992']){const f=adminFixture();editMG(f,value);assert.equal(f.sent.filter(x=>x.type==='admin_update_user').length,0);assert.match(f.toasts.at(-1)[1],/целочисленный баланс MG/)}});

test('admin accepts the largest exactly representable full MG balance',()=>{const f=adminFixture();editMG(f,String(Number.MAX_SAFE_INTEGER));assert.equal(f.sent.at(-1).mg,Number.MAX_SAFE_INTEGER)});

test('ledger displays signed compact MG with exact titles without reinterpreting historical currency',()=>{const f=adminFixture();f.request(PLAYER_A);f.receive({type:'admin_ledger',entries:[{...ledgerRow(PLAYER_A,'current-mg'),delta:-555555,balanceAfter:1250000},{...ledgerRow(PLAYER_A,'old-currency'),currency:'MS',delta:300,balanceAfter:900}]});assert.match(f.html(),/current-mg/);assert.match(f.html(),/−555\.5K MG/);assert.match(f.html(),/1\.25M MG/);assert.match(f.html(),/title="−555/);assert.match(f.html(),/Архив до миграции: 1/);assert.doesNotMatch(f.html(),/old-currency|\bMS\b/)});

test('ledger keeps the previous owner response from appearing under a newly selected account',()=>{const f=adminFixture();f.request(PLAYER_A);f.request(PLAYER_B);f.receive({type:'admin_ledger',entries:[ledgerRow(PLAYER_A,'late-A')]});assert.doesNotMatch(f.html(),/late-A/);f.receive({type:'admin_ledger',entries:[ledgerRow(PLAYER_B,'current-B')]});assert.match(f.html(),/current-B/)});
