/**
 * Produce a temporary, PRIVATE drain bridge from the exact deployed CAS Worker.
 * It retains the previous currency/game rules solely to finish existing rounds.
 * This builder does not upload/deploy anything or access any account/database.
 *
 * node build-drain-bridge-v330.mjs --source <private exact Worker> --output <private destination>
 */
import { createHash } from 'node:crypto';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

export const DEPLOYED_CAS_SHA256 = '9cd0bbd6fae00ff478f0758928900abe915ee1596b7f68b7733ab9300b3d4679';
export const BRIDGE_VERSION = 'cas-drain-v330';

const helpers = String.raw`
// Temporary CAS drain bridge. No endpoint exposes these operator RPC methods.
async function casDrainPhaseV330(db) {
  const exists=await db.prepare("SELECT 1 FROM sqlite_master WHERE type='table' AND name='cas_economy_control'").first();
  return exists?(await db.prepare('SELECT phase FROM cas_economy_control WHERE id=1').first())?.phase:null;
}
async function casDrainIsActiveV330(db) {return await casDrainPhaseV330(db)==='draining'}
async function casDrainRequireOpenV330(db) {
  const phase=await casDrainPhaseV330(db);
  if(phase==='draining')throw Error('economy_draining');
  if(phase==='mg-only')throw Error('economy_bridge_retired');
}
async function casRoomEconomyStatusV330(object) {
  const room=object.load('room'),pendingPlan=!!object.load('plan');
  let players=[],pot=0;
  if(room){
    if(!Array.isArray(room.players)||typeof room.active!=='boolean'||!['MS','MG'].includes(room.currency))throw Error('invalid_room_economy');
    players=room.players.filter(Boolean);pot=room.pot;
    if(!Number.isSafeInteger(pot)||pot<0||players.some(player=>!Number.isSafeInteger(player.stack)||player.stack<0))throw Error('invalid_room_economy');
  }
  const escrow=pot+players.reduce((sum,player)=>sum+player.stack,0);
  if(!Number.isSafeInteger(escrow)||escrow<0)throw Error('invalid_room_economy');
  return {bridgeVersion:'cas-drain-v330',objectId:object.ctx.id.toString(),roomId:room?.id||null,
    phase:await casDrainPhaseV330(object.env.DB),pendingPlan,active:room?.active||false,
    seated:players.length,pot,escrow,currency:room?.currency||null,checkedAt:Date.now()};
}
`;

const roomMethods = String.raw`
async economyMigrationStatus(){return this.serial(()=>casRoomEconomyStatusV330(this))}
async drainIdleRoom(){return this.serial(async()=>{
  if(!await casDrainIsActiveV330(this.env.DB))throw Error('economy_drain_required');
  await this.recover();
  let room=this.load('room');
  if(!room||room.active)return {...await casRoomEconomyStatusV330(this),drained:!room,waitingForRound:!!room?.active};
  // Existing cashout path preserves its durable plan, ledger IDs and recovery.
  // It is invoked only for an idle table: no forced fold or changed game result.
  const humanIds=room.players.filter(player=>player&&player.id!==room.botId).map(player=>player.id);
  for(const id of humanIds)await this.leaveInternal(id,'economy-drain-v330:'+id);
  room=this.load('room');
  if(room&&!room.active&&room.botId&&room.players.some(Boolean)&&room.players.every(player=>!player||player.id===room.botId)){
    const next=F(room);fr(next,next.botId);await this.plan(next);
  }
  const status=await casRoomEconomyStatusV330(this);
  return {...status,drained:!status.pendingPlan&&!status.active&&status.seated===0&&status.pot===0&&status.escrow===0};
})}
`;

export function buildDrainBridge(sourceBytes) {
  const bytes = Buffer.isBuffer(sourceBytes) ? sourceBytes : Buffer.from(sourceBytes);
  const baseSha256 = createHash('sha256').update(bytes).digest('hex');
  if (baseSha256 !== DEPLOYED_CAS_SHA256) throw Error('unexpected_deployed_cas_source');
  let code = bytes.toString('utf8');
  const edits = [];
  function replaceOnce(name, before, after) {
    const count = code.split(before).length - 1;
    if (count !== 1) throw Error(`bridge_anchor_mismatch:${name}:${count}`);
    code = code.replace(before, after);
    edits.push(name);
  }
  replaceOnce('session-new-actions',
    'async command(e,t,r){let n=t.identity.id,i=String(r.type||"");',
    'async command(e,t,r){let n=t.identity.id,i=String(r.type||"");if(["poker_join","poker_accept_invite","poker_rebuy","poker_start"].includes(i))await casDrainRequireOpenV330(this.env.DB);');
  replaceOnce('new-room-configuration',
    'async configure(e,t){return this.serial(async()=>{await this.recover();let r=this.load("room");return r||(',
    'async configure(e,t){return this.serial(async()=>{await this.recover();let r=this.load("room");if(!r)await casDrainRequireOpenV330(this.env.DB);return r||(');
  replaceOnce('new-poker-buyin',
    'if(j(n,e.id)>=0)return this.attachInternal(n,e.id);if(n.mode==="friend"',
    'if(j(n,e.id)>=0)return this.attachInternal(n,e.id);await casDrainRequireOpenV330(this.env.DB);if(n.mode==="friend"');
  replaceOnce('manual-poker-start',
    'async start(e,t,r){return this.serial(async()=>{await this.recover();let n=this.load("room"),i=ce(t),s=JSON.stringify(["start",r]);if(this.receipt(e,i,s))return O(n,e);',
    'async start(e,t,r){return this.serial(async()=>{await this.recover();let n=this.load("room"),i=ce(t),s=JSON.stringify(["start",r]);if(this.receipt(e,i,s))return O(n,e);await casDrainRequireOpenV330(this.env.DB);');
  replaceOnce('new-poker-rebuy',
    'async rebuy(e,t,r){return this.serial(async()=>{await this.recover();let n=this.load("room"),i=ce(r),s=JSON.stringify(["rebuy",t]);if(this.receipt(e,i,s))return O(n,e);',
    'async rebuy(e,t,r){return this.serial(async()=>{await this.recover();let n=this.load("room"),i=ce(r),s=JSON.stringify(["rebuy",t]);if(this.receipt(e,i,s))return O(n,e);await casDrainRequireOpenV330(this.env.DB);');
  replaceOnce('clear-future-hand-in-plan',
    'async plan(e,{user:t,op:r,signature:n,finance:i=null,progress:s=[]}={}){e.botId&&',
    'async plan(e,{user:t,op:r,signature:n,finance:i=null,progress:s=[]}={}){if(await casDrainIsActiveV330(this.env.DB)&&!e.active){e.nextHandAt=0;e.botTurnAt=0}e.botId&&');
  replaceOnce('clear-future-hand-in-alarm',
    'async alarm(){return this.serial(async()=>{await this.recover();let e=this.load("room");if(!(!e||e.closed)){',
    'async alarm(){return this.serial(async()=>{await this.recover();let e=this.load("room");if(e&&!e.active&&await casDrainIsActiveV330(this.env.DB)){e.nextHandAt=0;e.botTurnAt=0}if(!(!e||e.closed)){');
  replaceOnce('recover-rejected-inflight-buyin',
    '/insufficient_balance|cas_account_disabled|UNIQUE constraint failed: cas_poker_seats/',
    '/insufficient_balance|cas_account_disabled|economy_draining|UNIQUE constraint failed: cas_poker_seats/');
  replaceOnce('operator-room-rpc',
    'async inspect(){return this.serial(async()=>{await this.recover();let e=this.load("room");return e?dt(e):null})}',
    roomMethods + 'async inspect(){return this.serial(async()=>{await this.recover();let e=this.load("room");return e?dt(e):null})}');
  replaceOnce('new-blackjack-deal',
    'if(n)return Ie(e,n,r);for(let i=0;i<Y;i++){',
    'if(n)return Ie(e,n,r);if(r.action==="deal")await casDrainRequireOpenV330(e);for(let i=0;i<Y;i++){');
  replaceOnce('new-roulette-spin',
    'if(i)return xe(e,r,ot(i,r),!0);let s=Fn(),',
    'if(i)return xe(e,r,ot(i,r),!0);await casDrainRequireOpenV330(e);let s=Fn(),');
  replaceOnce('new-exchange',
    'let y=await w();if(y)return y;for(let m=0;m<Y;m++){',
    'let y=await w();if(y)return y;await casDrainRequireOpenV330(e);for(let m=0;m<Y;m++){');
  replaceOnce('definitive-transport-error',
    'unknown_command$|not_seated$|protocol_mismatch$',
    'unknown_command$|economy_draining$|economy_bridge_retired$|not_seated$|protocol_mismatch$');
  replaceOnce('rest-drain-error',
    '/insufficient_balance|stale_state|id_conflict|retry_exhausted/.test(a)?409:',
    '/insufficient_balance|stale_state|id_conflict|retry_exhausted|economy_draining|economy_bridge_retired/.test(a)?409:');
  code += '\n' + helpers;
  return { code, baseSha256, sha256: createHash('sha256').update(code).digest('hex'), edits };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const args = process.argv.slice(2), values = new Map();
  for (let i = 0; i < args.length; i += 2) {
    if (!['--source', '--output'].includes(args[i]) || !args[i + 1] || values.has(args[i])) throw Error('invalid_builder_arguments');
    values.set(args[i], args[i + 1]);
  }
  if (!values.has('--source') || !values.has('--output')) throw Error('source_and_private_output_required');
  const repository = path.resolve(import.meta.dirname, '../../..'), output = path.resolve(values.get('--output'));
  const relative = path.relative(repository, output);
  if (!relative.startsWith('..' + path.sep) && !path.isAbsolute(relative)) throw Error('private_output_outside_repository_required');
  const built = buildDrainBridge(await readFile(path.resolve(values.get('--source'))));
  await mkdir(path.dirname(output), { recursive: true });
  await writeFile(output, built.code, { flag: 'wx' });
  console.log(JSON.stringify({ privateOutput: output, baseSha256: built.baseSha256, sha256: built.sha256, edits: built.edits }));
}
