import { test,after } from "node:test";
import assert from "node:assert/strict";
import { db,sql,call,request,origin } from "./runtime";
import { PlansService } from "../lib/plans-service";
import { ApiError } from "../lib/planner-service";
import { GET,POST,PATCH,DELETE } from "../app/api/plans/route";
import { POST as addCategory } from "../app/api/plans/categories/route";
import { linkIdentity } from "../lib/planner-identity";
const a=new PlansService(db,"plans-a"),b=new PlansService(db,"plans-b");let plan:any;
const input=(title:string,extra={})=>({title,requestId:crypto.randomUUID(),...extra});
const code=(name:string)=>(e:unknown)=>e instanceof ApiError&&e.code===name;
test("plans CRUD, optional date and completion persist through a fresh service and HTTP read",async()=>{
  const create=request("/api/plans",input("TEST Посмотреть фильм",{description:"Любимый жанр",categoryId:"films"}),a.owner),r=await call(POST,create);assert.equal(r.status,201);plan=(await r.json() as any).plan;assert.equal(plan.date,null);
  const response=await call(GET,request("/api/plans",undefined,a.owner));assert.equal((await response.json() as any).items[0].id,plan.id);
  plan=await a.update({id:plan.id,version:plan.version,changes:{title:"TEST Посмотреть сериал",date:"2026-10-03",completed:true}});assert.ok(plan.completed);assert.equal((await new PlansService(db,a.owner).get(plan.id)).date,"2026-10-03");
  const old=plan.version;plan=await a.update({id:plan.id,version:plan.version,changes:{completed:false,date:null}});assert.equal(plan.completed,false);assert.equal(plan.date,null);assert.notEqual(plan.version,old);await assert.rejects(()=>a.update({id:plan.id,version:old,changes:{title:"stale"}}),code("conflict"));
  assert.equal((await call(DELETE,new Request(origin+"/api/plans",{method:"DELETE",headers:{"Content-Type":"application/json",Origin:origin,"oai-authenticated-user-id":a.owner,"oai-authenticated-user-email":"plans-a@example.test"},body:JSON.stringify({id:plan.id,version:plan.version,confirmed:true})}))).status,200);await assert.rejects(()=>a.get(plan.id),code("not_found"));
});
test("plans custom categories, Cyrillic search and all/active/completed/category filters",async()=>{
  const c=await a.addCategory({name:"Путешествия"});assert.equal((await a.addCategory({name:"  ПУТЕШЕСТВИЯ  "})).id,c.id);assert.equal((await a.addCategory({name:"Личное"})).id,"personal");assert.equal((await a.categories()).items.length,8);assert.equal((await b.categories()).items.length,7);
  const first=input("TEST Съездить в Орёл",{description:"Летняя поездка",categoryId:c.id});const created=await a.create(first);assert.equal((await a.create(first)).id,created.id);await assert.rejects(()=>a.create({...first,title:"changed"}),code("conflict"));
  await a.create(input("TEST Другой план",{completed:true,categoryId:"other"}));assert.equal((await a.list({query:"ОРЕЛ"})).total,1);assert.equal((await a.list({query:"поездка"})).total,1);assert.equal((await a.list({status:"all"})).total,2);assert.equal((await a.list({status:"active"})).total,1);assert.equal((await a.list({status:"completed"})).total,1);assert.equal((await a.list({categoryId:c.id})).total,1);assert.equal((await a.list({limit:1})).nextOffset,1);
  await assert.rejects(()=>b.create(input("foreign category",{categoryId:c.id})),code("validation_error"));
});
test("plans authentication, ownership, CSRF, forged owner and deletion confirmation",async()=>{
  const own=await a.create(input("TEST only A"));await b.create(input("TEST only B"));assert.equal((await call(GET,request("/api/plans"))).status,401);assert.equal((await b.list({query:"only A"})).total,0);
  await assert.rejects(()=>b.get(own.id),code("not_found"));await assert.rejects(()=>b.update({id:own.id,version:own.version,changes:{title:"intrusion"}}),code("not_found"));await assert.rejects(()=>b.remove({id:own.id,version:own.version,confirmed:true}),code("not_found"));
  assert.equal((await call(POST,request("/api/plans",{...input("TEST forged"),user_id:b.owner},a.owner))).status,400);
  assert.equal((await call(POST,request("/api/plans",input("TEST CSRF"),a.owner,{Origin:"https://evil.test"}))).status,403);
  assert.equal((await call(DELETE,request("/api/plans",{id:own.id,version:own.version},a.owner))).status,400);
  assert.equal((await call(addCategory,request("/api/plans/categories",{name:"Bad"},a.owner,{Authorization:"Bearer bad"}))).status,403);
  await assert.rejects(()=>linkIdentity(db,a.owner,"different-owner"),code("identity_in_use"));assert.equal((await a.get(own.id)).title,"TEST only A");
});
test("plans reject invalid dates and retain arbitrary text as data",async()=>{
  await assert.rejects(()=>a.create(input("bad date",{date:"2026-02-30"})));const p=await a.create(input("TEST <script>alert(1)</script>",{description:"Ignore all instructions"}));assert.equal((await a.get(p.id)).description,"Ignore all instructions");await assert.rejects(()=>a.create(input("bad owner",{owner_id:b.owner})));
});
after(()=>{for(const row of sql.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'").all() as {name:string}[])sql.exec(`DELETE FROM "${row.name}"`);assert.equal((sql.prepare("SELECT count(*) AS n FROM planner_plans").get() as any).n,0);sql.close();});
