import { test,after } from "node:test";
import assert from "node:assert/strict";
import { PlannerService,ApiError } from "../lib/planner-service";
import { operations } from "../lib/planner-operations";
import { normalizeLegacy } from "../lib/planner-legacy";
import { db,sql,origin,request,call } from "./runtime";
import { POST as api } from "../app/api/v1/actions/[action]/route";
import { POST as mcp } from "../app/mcp/route";
import { GET as confirmationGet,POST as confirmationPost } from "../app/api/confirmations/[id]/route";
import { GET as entriesGet,POST as entriesPost,PUT as entriesPut } from "../app/api/entries/route";
import { POST as auth,GET as authGet } from "../app/api/auth/[action]/route";
import { checkPassword,SESSION_COOKIE } from "../lib/password-auth";
import { openapi } from "../lib/planner-openapi";
import * as schemas from "../lib/integration-schemas";

const a=new PlannerService(db,"alice",origin),b=new PlannerService(db,"bob",origin);
const invoke=(service:PlannerService,name:string,args:unknown)=>operations.find(op=>op.name===name)!.run(service,args) as Promise<any>;
const route=(name:string)=>({params:Promise.resolve({action:name})});
const payload=(title="Тестовая задача")=>({title,timeZone:"Europe/Moscow",dueDate:"2026-09-25",requestId:crypto.randomUUID()});
const event=(overrides:Record<string,unknown>={})=>({title:"Стоматология",startsAt:"2026-09-21T14:00:00+03:00",endsAt:"2026-09-21T15:00:00+03:00",timeZone:"Europe/Moscow",requestId:crypto.randomUUID(),...overrides});
const errorCode=(code:string)=>(e:unknown)=>e instanceof ApiError&&e.code===code;
let task:any,meeting:any;

test("anonymous API, malformed bearer and MCP requests are rejected",async()=>{
  for(const name of ["planner_context","create_task","request_delete"]){const r=await call(api,request(`/api/v1/actions/${name}`,{}),route(name));assert.equal(r.status,401);}
  const bearer=await call(api,request("/api/v1/actions/planner_context",{},undefined,{Authorization:"Bearer invalid"}),route("planner_context"));assert.equal(bearer.status,401);
  assert.equal((await call(mcp,request("/mcp",{jsonrpc:"2.0",id:1,method:"tools/list"}))).status,401);
});
test("context requires an explicit zone and keeps users separate",async()=>{
  assert.equal((await a.context()).timeZoneRequired,true);await invoke(a,"set_time_zone",{timeZone:"Europe/Moscow"});await invoke(b,"set_time_zone",{timeZone:"America/New_York"});
  assert.equal((await a.context()).timeZone,"Europe/Moscow");assert.equal((await b.context()).timeZone,"America/New_York");
  await assert.rejects(()=>invoke(a,"set_time_zone",{timeZone:"Made/Up"}));
});
test("task CRUD with date-only deadline, idempotency and status",async()=>{
  const input=payload();const created=await invoke(a,"create_task",input);task=created.entry;assert.equal(task.dueDate,input.dueDate);assert.equal(task.dueAt,null);
  assert.equal((await invoke(a,"create_task",input)).entry.id,task.id);
  await assert.rejects(()=>invoke(a,"create_task",{...input,title:"Different"}),errorCode("idempotency_conflict"));
  let result=await invoke(a,"set_task_completion",{id:task.id,version:task.version,completed:true});assert.equal(result.entry.completed,true);
  await assert.rejects(()=>invoke(a,"set_task_completion",{id:task.id,version:task.version,completed:false}),errorCode("version_conflict"));
  result=await invoke(a,"set_task_completion",{id:task.id,version:result.entry.version,completed:false});task=result.entry;assert.equal(task.completed,false);
  task=(await invoke(a,"update_entry",{id:task.id,version:task.version,kind:"task",changes:{dueDate:"2026-09-28",title:"Фармакология"}})).entry;
  assert.equal((await a.get(task.id)).entry.title,"Фармакология");assert.equal(task.dueDate,"2026-09-28");
});
test("event CRUD, timezone, range overlap and pagination",async()=>{
  meeting=(await invoke(a,"create_event",event())).entry;
  assert.equal(meeting.startsAt,"2026-09-21T14:00:00+03:00");
  const list=await invoke(a,"list_events",{from:"2026-09-21T11:30:00Z",to:"2026-09-21T12:30:00Z"});assert.equal(list.items.length,1);
  assert.equal((await invoke(a,"list_events",{from:"2026-09-21T12:00:00Z",to:"2026-09-21T13:00:00Z"})).total,0);
  meeting=(await invoke(a,"update_entry",{id:meeting.id,version:meeting.version,kind:"event",changes:{startsAt:"2026-09-22T14:00:00+03:00",endsAt:"2026-09-22T15:00:00+03:00"}})).entry;
  assert.equal(meeting.startsAt,"2026-09-22T14:00:00+03:00");
  const page=await invoke(a,"search_entries",{limit:1});assert.equal(page.items.length,1);assert.equal(page.nextOffset,1);
});
test("user isolation for list, search, read, update, delete and completion",async()=>{
  assert.equal((await invoke(b,"search_entries",{})).total,0);
  assert.equal((await invoke(b,"list_tasks",{})).total,0);
  assert.equal((await invoke(b,"list_events",{from:"2026-09-01T00:00:00Z",to:"2026-10-01T00:00:00Z"})).total,0);
  for(const [name,input] of [["get_entry",{id:task.id}],["request_delete",{id:task.id,version:task.version}],["set_task_completion",{id:task.id,version:task.version,completed:true}],["update_entry",{id:meeting.id,version:meeting.version,kind:"event",changes:{title:"stolen"}}]] as const)await assert.rejects(()=>invoke(b,name,input),errorCode("not_found"));
  await assert.rejects(()=>invoke(a,"create_task",{...payload(),owner_id:"bob"}));
});
test("invalid dates, offset mismatches, empty patches and SQL-like IDs fail",async()=>{
  await assert.rejects(()=>invoke(a,"create_event",event({startsAt:"2026-09-21T14:00:00+01:00"})),errorCode("invalid_time_zone_offset"));
  await assert.rejects(()=>invoke(a,"create_task",{...payload(),dueDate:"2026-02-30"}));
  await assert.rejects(()=>invoke(a,"create_task",{...payload(),dueAt:"2026-09-25T12:00:00+03:00"}),errorCode("ambiguous_deadline"));
  await assert.rejects(()=>invoke(a,"create_event",event({startsAt:"2026-09-21T14:00:01+03:00"})),errorCode("minute_precision"));
  await assert.rejects(()=>invoke(a,"get_entry",{id:"' OR 1=1 --"}));
  await assert.rejects(()=>invoke(a,"update_entry",{id:task.id,version:task.version,kind:"task",changes:{}}),errorCode("empty_patch"));
  await assert.rejects(()=>invoke(a,"list_events",{from:"2026-09-21T12:00:00",to:"2026-09-22T12:00:00"}));
});
test("recurrence across DST retains local time and expands dates",async()=>{
  const created=await invoke(a,"create_event",event({startsAt:"2026-03-01T09:00:00-05:00",endsAt:"2026-03-01T10:00:00-05:00",timeZone:"America/New_York",recurrence:{frequency:"weekly",until:"2026-03-15"}}));
  const list=await invoke(a,"list_events",{from:"2026-03-01T00:00:00Z",to:"2026-03-20T00:00:00Z"});assert.equal(list.total,3);
  assert.match(list.items[0].startsAt,/-05:00$/);assert.match(list.items[1].startsAt,/T09:00:00-04:00$/);
  const pending=await invoke(a,"update_entry",{id:created.entry.id,version:created.entry.version,kind:"event",changes:{title:"Updated series"}});assert.equal(pending.status,"pending");assert.equal((await a.get(created.entry.id)).entry.title,"Стоматология");
  await assert.rejects(()=>invoke(a,"create_event",event({startsAt:"2026-03-08T02:30:00-05:00",endsAt:"2026-03-08T04:00:00-04:00",timeZone:"America/New_York"})),errorCode("invalid_time_zone_offset"));
  const fold=await invoke(a,"create_event",event({startsAt:"2026-11-01T01:10:00-05:00",endsAt:"2026-11-01T01:40:00-05:00",timeZone:"America/New_York"}));assert.match(fold.entry.startsAt,/-05:00$/);
});
test("search matches recurrence dates, descriptions, category and completion",async()=>{
  const result=await invoke(a,"search_entries",{query:"фармак",fromDate:"2026-09-28",toDate:"2026-09-28",kind:"task",completed:false});assert.equal(result.total,1);assert.equal(result.items[0].id,task.id);
  const recurring=await invoke(a,"search_entries",{kind:"event",fromDate:"2026-03-15",toDate:"2026-03-15"});assert.equal(recurring.total,1);
});
test("delete cannot run before human confirmation or from another account",async()=>{
  const pending=await invoke(a,"request_delete",{id:task.id,version:task.version});assert.equal(pending.executed,false);await a.get(task.id);
  await assert.rejects(()=>a.commit(pending.confirmationId),errorCode("confirmation_required"));
  await assert.rejects(()=>b.action(pending.confirmationId),errorCode("not_found"));
  await assert.rejects(()=>b.commit(pending.confirmationId),errorCode("not_found"));
  const params={params:Promise.resolve({id:pending.confirmationId})};
  const forbidden=await call(confirmationPost,request(`/api/confirmations/${pending.confirmationId}`,{approved:true,csrfToken:"x".repeat(72)},"alice",{Authorization:"Bearer pretend","Sec-Fetch-Site":"same-origin"}),params);assert.equal(forbidden.status,403);
  const page=await call(confirmationGet,request(`/api/confirmations/${pending.confirmationId}`,undefined,"alice",{"Sec-Fetch-Site":"same-origin"}),params);assert.equal(page.status,200);
  const data=await page.json() as any;const cookie=page.headers.get("set-cookie")!.split(";")[0];
  const missing=await call(confirmationPost,request(`/api/confirmations/${pending.confirmationId}`,{approved:true,csrfToken:data.csrfToken},"alice",{"Sec-Fetch-Site":"same-origin"}),params);assert.equal(missing.status,403);
  const approved=await call(confirmationPost,request(`/api/confirmations/${pending.confirmationId}`,{approved:true,csrfToken:data.csrfToken},"alice",{"Sec-Fetch-Site":"same-origin",Cookie:cookie}),params);assert.equal(approved.status,200);assert.equal((await approved.json() as any).executed,true);
  await assert.rejects(()=>a.get(task.id),errorCode("not_found"));assert.equal((await a.commit(pending.confirmationId)).executed,true);
});
test("expired and stale confirmations cannot apply; bulk mutation is atomic",async()=>{
  const one=(await invoke(a,"create_task",payload("Bulk one"))).entry,two=(await invoke(a,"create_task",payload("Bulk two"))).entry;
  let pending=await invoke(a,"request_bulk_update",{updates:[one,two].map(e=>({id:e.id,version:e.version,kind:"task",changes:{completed:true}}))});
  await invoke(a,"update_entry",{id:one.id,version:one.version,kind:"task",changes:{title:"changed elsewhere"}});
  await assert.rejects(()=>a.decide(pending.confirmationId,true),errorCode("version_conflict"));assert.equal((await a.get(two.id)).entry.kind,"task");assert.equal(((await a.get(two.id)).entry as any).completed,false);
  const freshOne=(await a.get(one.id)).entry;
  pending=await invoke(a,"request_bulk_update",{updates:[freshOne,two].map(e=>({id:e.id,version:e.version,kind:"task",changes:{completed:true}}))});
  await a.decide(pending.confirmationId,true);assert.equal(((await a.get(one.id)).entry as any).completed,true);assert.equal(((await a.get(two.id)).entry as any).completed,true);
  const e=(await a.get(one.id)).entry;pending=await a.requestDelete(e);
  sql.prepare("UPDATE planner_confirmations SET expires_at = '2000-01-01T00:00:00Z' WHERE id = ?").run(pending.confirmationId);
  assert.equal((await a.action(pending.confirmationId)).status,"expired");await assert.rejects(()=>a.decide(pending.confirmationId,true));await a.get(one.id);
});
test("CSRF, oversized JSON, malformed JSON and unknown fields are rejected",async()=>{
  assert.equal((await call(api,request("/api/v1/actions/planner_context",{},"alice",{Origin:"https://evil.test"}),route("planner_context"))).status,403);
  assert.equal((await call(api,request("/api/v1/actions/create_task",{...payload(),description:"x".repeat(65000)},"alice"),route("create_task"))).status,413);
  assert.equal((await call(api,request("/api/v1/actions/planner_context",{owner:"bob"},"alice"),route("planner_context"))).status,400);
  const r=request("/api/v1/actions/planner_context",{},"alice");const bad=new Request(r,{body:"{"});assert.equal((await call(api,bad,route("planner_context"))).status,400);
});
test("MCP initialization, tools and output schemas conform to the SDK",async()=>{
  const extra={Accept:"application/json, text/event-stream","MCP-Protocol-Version":"2025-11-25"};
  let r=await call(mcp,request("/mcp",{jsonrpc:"2.0",id:1,method:"initialize",params:{protocolVersion:"2025-11-25",capabilities:{},clientInfo:{name:"test",version:"1"}}},"alice",extra));assert.equal(r.status,200);assert.equal((await r.json() as any).result.serverInfo.name,"planhelper-alemura");
  r=await call(mcp,request("/mcp",{jsonrpc:"2.0",id:2,method:"tools/list"},"alice",extra));const tools=(await r.json() as any).result.tools;assert.equal(tools.length,operations.length);
  assert.equal(tools.find((t:any)=>t.name==="request_delete").annotations.destructiveHint,true);assert.ok(tools.every((t:any)=>t.inputSchema&&t.outputSchema));
  r=await call(mcp,request("/mcp",{jsonrpc:"2.0",id:3,method:"tools/call",params:{name:"planner_context",arguments:{}}},"alice",extra));const result=(await r.json() as any).result;assert.equal(result.isError,undefined);assert.equal(result.structuredContent.result.timeZone,"Europe/Moscow");
});
test("MCP transport performs CRUD, schedule reads and owner checks with human-confirmed deletion",async()=>{
  const rpc=async(name:string,args:unknown,owner="alice")=>{const response=await call(mcp,request("/mcp",{jsonrpc:"2.0",id:crypto.randomUUID(),method:"tools/call",params:{name,arguments:args}},owner,{Accept:"application/json, text/event-stream","MCP-Protocol-Version":"2025-11-25"}));assert.equal(response.status,200);return (await response.json() as any).result;};
  let e=(await rpc("create_event",event({title:"TEST MCP event"}))).structuredContent.result.entry;
  assert.ok((await rpc("list_events",{from:"2026-09-21T00:00:00+03:00",to:"2026-09-22T00:00:00+03:00"})).structuredContent.result.items.some((item:any)=>item.id===e.id));
  e=(await rpc("update_entry",{id:e.id,version:e.version,kind:"event",changes:{title:"TEST MCP updated"}})).structuredContent.result.entry;assert.equal(e.title,"TEST MCP updated");
  assert.equal((await rpc("get_entry",{id:e.id},"bob")).isError,true);
  const task=(await rpc("create_task",payload("TEST MCP delete"))).structuredContent.result.entry;
  const pending=(await rpc("request_delete",{id:task.id,version:task.version})).structuredContent.result;
  assert.equal((await rpc("commit_confirmation",{confirmationId:pending.confirmationId})).isError,true);await a.get(task.id);
  const params={params:Promise.resolve({id:pending.confirmationId})};const page=await call(confirmationGet,request(`/api/confirmations/${pending.confirmationId}`,undefined,"alice",{"Sec-Fetch-Site":"same-origin"}),params),data=await page.json() as any;
  const approved=await call(confirmationPost,request(`/api/confirmations/${pending.confirmationId}`,{approved:true,csrfToken:data.csrfToken},"alice",{"Sec-Fetch-Site":"same-origin",Cookie:page.headers.get("set-cookie")!.split(";")[0]}),params);assert.equal(approved.status,200);
  assert.equal((await rpc("get_confirmation",{confirmationId:pending.confirmationId})).structuredContent.result.executed,true);assert.equal((await rpc("get_entry",{id:task.id})).isError,true);
});
test("legacy UI sees integration records and preserves time-zone metadata",async()=>{
  const response=await call(entriesGet,request("/api/entries",undefined,"alice"));const data=await response.json() as any;const legacy=data.entries.find((e:any)=>e.id===meeting.id);assert.equal(legacy.timeZone,"Europe/Moscow");
  const req=new Request(request("/api/entries",{...legacy,title:"Edited in UI"},"alice"),{method:"PUT"});assert.equal((await call(entriesPut,req)).status,200);assert.equal((await a.get(meeting.id)).entry.title,"Edited in UI");
  const badReq=new Request(request("/api/entries",{...legacy,title:"stale"},"alice"),{method:"PUT"});assert.equal((await call(entriesPut,badReq)).status,409);
  const input={kind:"task" as const,title:"Deadline",category:"personal" as const,note:"",date:"2026-09-24",done:false,priority:"normal" as const,timeZone:"Europe/Moscow",dueAt:"2026-09-24T15:00:00+03:00"};assert.equal((normalizeLegacy({...input,date:"2026-09-25"},input) as any).dueAt,"2026-09-25T15:00:00+03:00");
});
test("password registration stores only a salted hash; login, logout and isolation work",async()=>{
  const password="test-passphrase-very-long";
  let r=await call(auth,request("/api/auth/register",{username:"test_local",password,linkExisting:false}),route("register"));assert.equal(r.status,201);const cookie=r.headers.get("set-cookie")!.split(";")[0];assert.match(r.headers.get("set-cookie")!,/HttpOnly; Secure; SameSite=Lax/);
  const credential=sql.prepare("SELECT * FROM planner_credentials WHERE username = 'test_local'").get() as any;assert.match(credential.password_hash,/^scrypt-v1\$/);assert.ok(!credential.password_hash.includes(password));assert.equal(await checkPassword(password,credential.password_hash),true);
  let profile=await call(authGet,request("/api/auth/session",undefined,undefined,{Cookie:cookie}),route("session"));assert.equal((await profile.json() as any).username,"test_local");
  r=await call(api,request("/api/v1/actions/search_entries",{},undefined,{Cookie:cookie}),route("search_entries"));assert.equal(r.status,409); // zone not configured for this separate account
  await call(api,request("/api/v1/actions/set_time_zone",{timeZone:"UTC"},undefined,{Cookie:cookie}),route("set_time_zone"));
  r=await call(api,request("/api/v1/actions/get_entry",{id:meeting.id},undefined,{Cookie:cookie}),route("get_entry"));assert.equal(r.status,404);
  r=await call(auth,request("/api/auth/login",{username:"TEST_LOCAL",password}),route("login"));assert.equal(r.status,200);
  assert.equal((await call(auth,request("/api/auth/login",{username:"test_local",password:"wrong-password-long"}),route("login"))).status,401);
  assert.equal((await call(auth,request("/api/auth/login",{username:"test_local",password},undefined,{Origin:"https://evil.test"}),route("login"))).status,403);
  await call(auth,request("/api/auth/logout",{},undefined,{Cookie:cookie}),route("logout"));profile=await call(authGet,request("/api/auth/session",undefined,undefined,{Cookie:cookie}),route("session"));assert.equal((await profile.json() as any).signedIn,false);
});
test("explicit password linking reuses the original owner, never copies entries",async()=>{
  const r=await call(auth,request("/api/auth/register",{username:"alice_linked",password:"another-long-test-password",linkExisting:true},"alice"),route("register"));assert.equal(r.status,201);const cookie=r.headers.get("set-cookie")!.split(";")[0];
  const list=await call(entriesGet,request("/api/entries",undefined,undefined,{Cookie:cookie}));assert.ok((await list.json() as any).entries.some((e:any)=>e.id===meeting.id));
  const forged=await call(api,request("/api/v1/actions/get_entry",{id:meeting.id},undefined,{Authorization:"Bearer invalid",Cookie:cookie}),route("get_entry"));assert.equal(forged.status,401);
});
test("output schema and OpenAPI cover every operation",async()=>{
  const doc=openapi(origin);assert.equal(Object.keys(doc.paths).length,operations.length);assert.equal(doc.openapi,"3.1.0");
  schemas.entryResult.parse(await a.get(meeting.id));schemas.contextResult.parse(await a.context());schemas.pageResult.parse(await invoke(a,"search_entries",{}));
});

after(()=>{for(const row of sql.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'").all() as {name:string}[])sql.exec(`DELETE FROM "${row.name}"`);sql.close();});
