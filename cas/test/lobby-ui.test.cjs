const test = require('node:test');
const assert = require('node:assert/strict');
const { onlineView } = require('../runtime/lobby-ui.js');

test('lobby presence never reports a founder or cached count as connected', () => {
  for (const onlineCount of [1, 999, undefined]) {
    const view = onlineView({ connected: false, onlineCount, founder: true });
    assert.equal(view.mode, 'offline');
    assert.equal(view.count, '—');
    assert.equal(view.label, 'Нет связи');
  }
});
test('lobby presence shows only a valid confirmed server count', () => {
  assert.equal(onlineView({ connected: true, onlineCount: 0 }).count, '0');
  assert.equal(onlineView({ connected: true, onlineCount: 27.9 }).count, '27');
  for (const onlineCount of [-1, NaN, Infinity, 'invalid', null, undefined, '']) assert.equal(onlineView({ connected: true, onlineCount }).count, '—');
});
test('connecting presence is distinct from a confirmed session', () => {
  assert.deepEqual(onlineView({ connected: false, onlineCount: 20 }, true), {
    mode: 'connecting', label: 'Подключение', count: '—', meta: 'LINK', title: 'Устанавливаем соединение с игровым сервером.'
  });
  assert.equal(onlineView({ connected: true, onlineCount: 8 }, true).mode, 'live');
});
