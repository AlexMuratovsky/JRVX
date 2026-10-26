import test from 'node:test';
import assert from 'node:assert/strict';
import { listAllCasRoomObjects, inspectAllCasRooms, drainIdleCasRooms, CAS_ROOMS_NAMESPACE_V330 } from '../drain-audit-v330.mjs';
import { buildDrainBridge } from '../scripts/build-drain-bridge-v330.mjs';
const id=n=>n.toString(16).padStart(64,'0');
const page=(items,cursor)=>({success:true,result:items.map(n=>({id:id(n),hasStoredData:false})),result_info:{count:items.length,...cursor?{cursor}:{}}});
const status=objectId=>({objectId,bridgeVersion:'cas-drain-v330',phase:'draining',pendingPlan:false,active:false,seated:0,pot:0,escrow:0,checkedAt:1});

test('complete namespace pagination includes objects without indexed D1 rows or stored-data flags',async()=>{
 const calls=[];const result=await listAllCasRoomObjects({listPage:async input=>{calls.push(input);return input.cursor?page([3]):page([1,2],'next')}});
 assert.equal(result.objects.length,3);assert.equal(calls[0].namespaceId,CAS_ROOMS_NAMESPACE_V330);assert.equal(calls[1].cursor,'next');
});
test('incomplete listing, repeated cursor, duplicate object and failed API responses fail closed',async()=>{
 for(const listPage of [async()=>({success:false,result:[],result_info:{count:0}}),async()=>({success:true,result:[],result_info:{}}),async()=>page([1],'same'),async()=>page([1,1])]) await assert.rejects(listAllCasRoomObjects({listPage}));
});
test('audit checks every opaque object ID and performs a second complete enumeration',async()=>{
 let lists=0;const seen=[];const result=await inspectAllCasRooms({listPage:async()=>{lists++;return page([1,2])},inspectObject:async objectId=>{seen.push(objectId);return status(objectId)}});
 assert.equal(lists,2);assert.deepEqual(seen,[id(1),id(2)]);assert.equal(result.complete,true);assert.equal(result.drained,true);
});
test('newly appearing namespace objects invalidate an otherwise empty audit',async()=>{
 let calls=0;await assert.rejects(inspectAllCasRooms({listPage:async()=>page(++calls===1?[1]:[1,2]),inspectObject:async objectId=>status(objectId)}),/namespace_changed_during_audit/);
});
test('active game and pending financial plan remain blockers instead of being hidden by the audit',async()=>{
 const result=await inspectAllCasRooms({listPage:async()=>page([1]),inspectObject:async objectId=>({...status(objectId),active:true,pendingPlan:true,pot:20,escrow:200,seated:2})});assert.equal(result.complete,true);assert.equal(result.drained,false);
});
test('malformed RPC status cannot be accepted as a drained room',async()=>{
 for(const patch of [{phase:'mg-only'},{seated:'0'},{pendingPlan:0},{escrow:-1},{objectId:id(99)}]) await assert.rejects(inspectAllCasRooms({listPage:async()=>page([1]),inspectObject:async objectId=>({...status(objectId),...patch})}),/invalid_room_drain_status/);
});
test('read-only audit never calls the explicitly separate room-draining operation',async()=>{
 let calls=0;await inspectAllCasRooms({listPage:async()=>page([1]),inspectObject:async objectId=>status(objectId),drainObject:async()=>{calls++;throw Error('unexpected')}});assert.equal(calls,0);
 const result=await drainIdleCasRooms({listPage:async()=>page([1]),drainObject:async objectId=>{calls++;return status(objectId)}});assert.equal(calls,1);assert.equal(result.drained,true);
});
test('bridge builder refuses any source except the exact previously audited deployed Worker',()=>{
 assert.throws(()=>buildDrainBridge(Buffer.from('export default {}')),/unexpected.*source|source.*hash|base.*hash|deployed.*source/i);
});
