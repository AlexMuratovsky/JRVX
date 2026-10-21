import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {env,db,requests,origin,call} from './runtime';
import {getPlannerUser} from '../lib/planner-auth';
import {register,createSession,SESSION_COOKIE} from '../lib/password-auth';
import {GET as authSession,POST as authAction} from '../app/api/auth/[action]/route';
const runtime=env as typeof env&{JRVX_STANDALONE?:string,IDENTITY?:Fetcher};

test('standalone planner rejects forged Sites identity and isolates external credentials from browser cookies',async()=>{
 runtime.JRVX_STANDALONE='true';
 try{
  const forged={'oai-authenticated-user-id':'victim','oai-authenticated-user-email':'victim@example.test'};
  assert.equal(await requests.run(new Request(origin,{headers:forged}),getPlannerUser),null);
  const owner=await register(db,{username:'standalone_copy',password:'Test-migration-only-2026',linkExisting:false},null);
  const token=await createSession(db,owner),cookie=SESSION_COOKIE+'='+token;
  const user=await requests.run(new Request(origin,{headers:{cookie,...forged}}),getPlannerUser);
  assert.equal(user?.userId,owner);assert.equal(user?.mode,'password');
  assert.equal(await requests.run(new Request(origin,{headers:{cookie,...forged,authorization:'Bearer invalid'}}),getPlannerUser),null);
 }finally{delete runtime.JRVX_STANDALONE;}
});

test('JRVX identity is verified through its service binding; sign-out suppresses shared identity',async()=>{
 runtime.JRVX_STANDALONE='true';let calls=0;
 runtime.IDENTITY={fetch:async(request:Request)=>{calls++;assert.equal(request.url,'https://id.jrvx.ru/api/integrations/session?app=planner');assert.equal(request.headers.get('x-jrvx-app'),'planner');assert.equal(request.headers.has('oai-authenticated-user-id'),false);return Response.json({ok:true,user:{id:'id-user',username:'standalone_copy'}});}} as unknown as Fetcher;
 try{
  const user=await requests.run(new Request(origin,{headers:{cookie:'id_session=test'}}),getPlannerUser);
  assert.equal(user?.userId,'jrvx:id-user');assert.equal(user?.mode,'jrvx');
  const signedOut=await requests.run(new Request(origin,{headers:{cookie:SESSION_COOKIE+'=signed-out; id_session=test'}}),getPlannerUser);
  assert.equal(signedOut,null);assert.equal(calls,1);
 }finally{delete runtime.JRVX_STANDALONE;delete runtime.IDENTITY;}
});

test('HTTP logout signs out an ID-only browser session without a Planner password cookie',async()=>{
 runtime.JRVX_STANDALONE='true';let calls=0;
 runtime.IDENTITY={fetch:async()=>{calls++;return Response.json({ok:true,user:{id:'logout-id-user',username:'id-only'}});}} as unknown as Fetcher;
 try{
  const idCookie='id_session=id-only-session';
  assert.equal((await requests.run(new Request(origin,{headers:{cookie:idCookie}}),getPlannerUser))?.mode,'jrvx');
  const response=await call(authAction,new Request(origin+'/api/auth/logout',{method:'POST',headers:{Origin:origin,Cookie:idCookie}}),{params:Promise.resolve({action:'logout'})});
  assert.equal(response.status,200);
  const signedOutCookie=response.headers.get('set-cookie');
  assert.ok(signedOutCookie);
  assert.ok(signedOutCookie.startsWith(SESSION_COOKIE+'=signed-out;'));
  assert.match(signedOutCookie,/HttpOnly; Secure; SameSite=Lax/);
  const headers={cookie:idCookie+'; '+signedOutCookie.split(';')[0]};
  assert.equal(await requests.run(new Request(origin,{headers}),getPlannerUser),null);
  const session=await call(authSession,new Request(origin+'/api/auth/session',{headers}),{params:Promise.resolve({action:'session'})});
  assert.equal(session.status,200);
  assert.equal((await session.json() as {signedIn:boolean}).signedIn,false);
  assert.equal(calls,1);
 }finally{delete runtime.JRVX_STANDALONE;delete runtime.IDENTITY;}
});

test('standalone Worker rejects Sites credentials before stripping headers or consulting browser cookies',async()=>{
 const source=readFileSync('standalone-worker.mjs','utf8').replace("import app from './dist/server/index.js';","const app={fetch(){throw new Error('Application must not run for unsupported credentials')}};");
 const worker=await import('data:text/javascript;base64,'+Buffer.from(source).toString('base64'));
 for(const path of ['/api/entries','/api/me']){
  const response=await worker.default.fetch(new Request(origin+path,{headers:{'oai-sites-authorization':'untrusted-sites-token',cookie:SESSION_COOKIE+'=valid-cookie-must-not-be-consulted'}}),{LEGACY_PLANNER:{fetch(){throw new Error('Legacy app must not run')}}},{});
  assert.equal(response.status,401);
  assert.equal(response.headers.get('Cache-Control'),'no-store');
 }
});
