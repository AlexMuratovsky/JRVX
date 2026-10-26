export const ECONOMY_VERSION = 'mg-v330';

// SQL is reviewed deployment input. Markers separate top-level statements, including
// whole triggers; semicolon splitting would corrupt their atomicity.
export function migrationStatements(sql) {
  if (typeof sql !== 'string' || !sql.includes('-- statement-breakpoint')) throw Error('invalid_migration_script');
  return sql.split(/^-- statement-breakpoint\r?$/m).map(s => s.trim()).filter(Boolean);
}

export async function beginEconomyDrain(db) {
  await db.batch([
    db.prepare("CREATE TABLE IF NOT EXISTS cas_economy_control(id INTEGER PRIMARY KEY CHECK(id=1),phase TEXT NOT NULL CHECK(phase IN ('draining','mg-only')),updated_at INTEGER NOT NULL)"),
    db.prepare("INSERT INTO cas_economy_control VALUES(1,'draining',?) ON CONFLICT(id) DO NOTHING").bind(Date.now()),
    db.prepare('DROP TRIGGER IF EXISTS cas_economy_drain_debits_v330'),
    db.prepare(`CREATE TRIGGER cas_economy_drain_debits_v330 BEFORE INSERT ON cas_transactions
      WHEN NEW.operation_type IN ('blackjack_bet','roulette_bet','poker_buyin','poker_rebuy','wallet_exchange_debit')
      AND (SELECT phase FROM cas_economy_control WHERE id=1)='draining'
      AND NOT (NEW.operation_type='blackjack_bet'
        AND COALESCE(json_extract(NEW.metadata_json,'$.action'),'') IN ('double','split','insurance')
        AND EXISTS(SELECT 1 FROM cas_blackjack_state WHERE jrvx_id=NEW.jrvx_id
          AND json_extract(state_json,'$.active')=1 AND json_extract(state_json,'$.currency')=NEW.currency))
      BEGIN SELECT RAISE(ABORT,'economy_draining'); END`),
  ]);
}

async function completed(db) {
  const exists = await db.prepare("SELECT 1 FROM sqlite_master WHERE type='table' AND name='cas_economy_migrations'").first();
  return exists ? db.prepare('SELECT * FROM cas_economy_migrations WHERE version=?').bind(ECONOMY_VERSION).first() : null;
}

// inspectAllRooms must enumerate the entire CAS_ROOMS namespace under the drain
// bridge, including objects not yet indexed in D1. The callback is trusted operator
// code, never request JSON. A missing audit fails closed.
export async function migrateToMg(db, { sql, inspectAllRooms } = {}) {
  const previous = await completed(db);
  if (previous) return { ok: true, duplicate: true, version: ECONOMY_VERSION, migration: previous };
  if (typeof inspectAllRooms !== 'function') throw Error('complete_room_audit_required');
  const phase = await db.prepare('SELECT phase FROM cas_economy_control WHERE id=1').first();
  if (phase?.phase !== 'draining') throw Error('economy_drain_required');
  const audit = await inspectAllRooms();
  if (!audit || audit.complete !== true || !Array.isArray(audit.rooms) || !Number.isSafeInteger(audit.objectCount) || audit.objectCount !== audit.rooms.length) throw Error('complete_room_audit_required');
  const ids = new Set();
  for (const room of audit.rooms) {
    if (!room || typeof room.objectId !== 'string' || !room.objectId || ids.has(room.objectId)) throw Error('invalid_room_audit');
    ids.add(room.objectId);
    if (room.pendingPlan !== false || room.active !== false || room.seated !== 0 || room.pot !== 0 || room.escrow !== 0) throw Error('economy_games_not_drained');
  }
  const statements = migrationStatements(sql).map(statement => db.prepare(statement));
  try {
    await db.batch(statements);
  } catch (error) {
    const raced = await completed(db);
    if (raced) return { ok: true, duplicate: true, version: ECONOMY_VERSION, migration: raced };
    throw error;
  }
  return { ok: true, duplicate: false, version: ECONOMY_VERSION, migration: await completed(db) };
}
