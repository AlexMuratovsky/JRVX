// Read-only receipt lookup. A missing row is an unknown outcome, never a refusal.
// Authentication and the current public blackjack snapshot belong to the Worker.
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const OWNER = /^JRVX-[A-Z]{4}\d{8}$/;

export function recoveryIntentIdV332(searchParams, game) {
  const key = game === 'blackjack' ? 'actionId' : game === 'roulette' ? 'spinId' : '';
  const entries = [...searchParams];
  if (!key || entries.length !== 1 || entries[0][0] !== key || !UUID.test(entries[0][1])) {
    throw Error('invalid_recovery_request');
  }
  // IDs remain case-sensitive, just as they are in the original game APIs.
  return entries[0][1];
}

export async function readGameReceiptV332(db, ownerId, game, intentId) {
  if (!OWNER.test(ownerId) || !UUID.test(intentId) || !['blackjack', 'roulette'].includes(game)) {
    throw Error('invalid_recovery_request');
  }
  const eventId = `roulette:${ownerId}:${intentId}`;
  const row = game === 'blackjack'
    ? await db.prepare('SELECT result_json FROM cas_blackjack_actions WHERE jrvx_id=? AND action_id=?').bind(ownerId, intentId).first()
    : await db.prepare("SELECT data_json FROM cas_game_history WHERE jrvx_id=? AND event_id=? AND game='roulette' AND event_type='spin'").bind(ownerId, eventId).first();
  if (!row) return { ownerId, intentId, status: 'unknown' };

  let result;
  try { result = JSON.parse(game === 'blackjack' ? row.result_json : row.data_json); }
  catch { throw Error('recovery_receipt_corrupt'); }
  const identified = result && typeof result === 'object' && !Array.isArray(result) && result.currency === 'MG'
    && (game === 'blackjack' ? result.actionId === intentId : result.jrvxId === ownerId && result.eventId === eventId);
  if (!identified) throw Error('recovery_receipt_corrupt');
  // Return the original receipt, not an artificial replay or a new game result.
  return { ownerId, intentId, status: 'confirmed', result };
}
