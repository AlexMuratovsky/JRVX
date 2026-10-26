/**
 * Trusted operator helpers, never accept a request JSON claim of completeness.
 * listPage must call the Cloudflare API for the CAS_ROOMS namespace:
 * GET /accounts/{account_id}/workers/durable_objects/namespaces/{id}/objects
 * with `limit` and `cursor`, returning its parsed response body. Credentials stay
 * in the caller. inspectObject/drainObject call the bridge RPC via idFromString.
 * No D1 room index is used as a substitute for enumerating the namespace.
 */
export const CAS_ROOMS_NAMESPACE_V330 = '6a02ad2e06e841a486fff87f0fb1a5fe';
const OBJECT_ID = /^[a-f0-9]{64}$/;
const NAMESPACE_ID = /^[a-f0-9]{32}$/;

export async function listAllCasRoomObjects({ namespaceId = CAS_ROOMS_NAMESPACE_V330, listPage,
  limit = 1000, maxPages = 10000 } = {}) {
  if (!NAMESPACE_ID.test(namespaceId) || typeof listPage !== 'function'
    || !Number.isInteger(limit) || limit < 10 || limit > 10000
    || !Number.isInteger(maxPages) || maxPages < 1 || maxPages > 10000) throw Error('invalid_namespace_audit_configuration');
  const objects = [], ids = new Set(), cursors = new Set();
  let cursor;
  for (let page = 0; page < maxPages; page++) {
    const response = await listPage({ namespaceId, limit, ...(cursor ? { cursor } : {}) });
    if (!response || response.success === false || !Array.isArray(response.result)
      || !response.result_info || typeof response.result_info !== 'object'
      || response.result_info.count !== response.result.length || response.result.length > limit) throw Error('incomplete_namespace_listing');
    for (const object of response.result) {
      if (!object || !OBJECT_ID.test(object.id) || typeof object.hasStoredData !== 'boolean' || ids.has(object.id)) {
        throw Error('invalid_namespace_object');
      }
      ids.add(object.id); objects.push({ id: object.id, hasStoredData: object.hasStoredData });
    }
    const next = response.result_info.cursor;
    if (next === undefined || next === null || next === '') return { namespaceId, complete: true, pages: page + 1, objects };
    if (typeof next !== 'string' || next.length > 4096 || cursors.has(next) || !response.result.length) throw Error('invalid_namespace_cursor');
    cursors.add(next); cursor = next;
  }
  throw Error('namespace_page_limit');
}

function validateStatus(status, objectId) {
  if (!status || status.bridgeVersion !== 'cas-drain-v330' || status.objectId !== objectId || status.phase !== 'draining'
    || typeof status.pendingPlan !== 'boolean' || typeof status.active !== 'boolean'
    || !Number.isSafeInteger(status.seated) || status.seated < 0
    || !Number.isSafeInteger(status.pot) || status.pot < 0
    || !Number.isSafeInteger(status.escrow) || status.escrow < 0 || status.escrow < status.pot
    || !Number.isSafeInteger(status.checkedAt) || status.checkedAt < 0) throw Error('invalid_room_drain_status');
  return status;
}

export async function inspectAllCasRooms({ inspectObject, ...listing } = {}) {
  if (typeof inspectObject !== 'function') throw Error('room_inspector_required');
  const first = await listAllCasRoomObjects(listing), rooms = [];
  for (const object of first.objects) rooms.push(validateStatus(await inspectObject(object.id), object.id));
  // The bridge forbids new financial joins during draining. A second complete
  // namespace pass still rejects newly appearing/unindexed objects rather than
  // silently using a stale list. Objects with hasStoredData=false are inspected.
  const second = await listAllCasRoomObjects(listing);
  const initialIds = first.objects.map(o => o.id).sort(), finalIds = second.objects.map(o => o.id).sort();
  if (initialIds.length !== finalIds.length || initialIds.some((id, index) => id !== finalIds[index])) throw Error('namespace_changed_during_audit');
  return { complete: true, namespaceId: first.namespaceId, objectCount: rooms.length,
    listingPasses: 2, rooms, drained: rooms.every(room => !room.pendingPlan && !room.active
      && room.seated === 0 && room.pot === 0 && room.escrow === 0) };
}

// Deliberately separate from read-only inspection. Operator must explicitly invoke
// this step; the bridge skips active rounds and cashes out only idle tables.
export async function drainIdleCasRooms({ drainObject, ...listing } = {}) {
  if (typeof drainObject !== 'function') throw Error('room_drainer_required');
  const all = await listAllCasRoomObjects(listing), rooms = [];
  for (const object of all.objects) rooms.push(validateStatus(await drainObject(object.id), object.id));
  return { namespaceId: all.namespaceId, objectCount: rooms.length, rooms,
    drained: rooms.every(room => !room.pendingPlan && !room.active && room.seated === 0 && room.pot === 0 && room.escrow === 0) };
}

export function casRoomRpcCallbacks(namespace) {
  if (!namespace || typeof namespace.idFromString !== 'function' || typeof namespace.get !== 'function') throw Error('cas_room_binding_required');
  const stub = id => namespace.get(namespace.idFromString(id));
  return {
    inspectObject: id => stub(id).economyMigrationStatus(),
    drainObject: id => stub(id).drainIdleRoom(),
  };
}
