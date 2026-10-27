import test from 'node:test';import assert from 'node:assert/strict';import {webcrypto} from 'node:crypto';import {authenticate} from '../backend/auth.mjs';
const encode=obj=>Buffer.from(JSON.stringify(obj)).toString('base64url');
const env={JRVX_ID_ISSUER:'https://id.jrvx.ru',JRVX_ID_AUDIENCE:'jrvx-medhelper',JRVX_ID_JWKS_URL:'https://id.jrvx.ru/EXAMPLE-JWKS'};
test('unsigned and missing Bearer credentials are rejected',async()=>{await assert.rejects(authenticate(new Request('https://med.jrvx.ru/api/me'),env),{status:401});});
test('RSA-signed JWT is accepted only with intended issuer/audience and active expiry',async()=>{
 const pair=await webcrypto.subtle.generateKey({name:'RSASSA-PKCS1-v1_5',modulusLength:2048,publicExponent:new Uint8Array([1,0,1]),hash:'SHA-256'},true,['sign','verify']);
 const publicJwk=await webcrypto.subtle.exportKey('jwk',pair.publicKey);publicJwk.kid='test-key';publicJwk.use='sig';
 const issued=Math.floor(Date.now()/1000);
 const sign=async claim=>{const head=encode({alg:'RS256',typ:'JWT',kid:'test-key'}),payload=encode(claim);const signed=await webcrypto.subtle.sign('RSASSA-PKCS1-v1_5',pair.privateKey,new TextEncoder().encode(`${head}.${payload}`));return `${head}.${payload}.${Buffer.from(signed).toString('base64url')}`};
 const claim={iss:env.JRVX_ID_ISSUER,aud:env.JRVX_ID_AUDIENCE,sub:'test-user-uuid',iat:issued,exp:issued+3600};
 const mock=async()=>new Response(JSON.stringify({keys:[publicJwk]}),{status:200});
 const token=await sign(claim);
 const user=await authenticate(new Request('https://med.jrvx.ru/api/me',{headers:{authorization:`Bearer ${token}`}}),env,Date.now(),mock);
 assert.equal(user.userId,'test-user-uuid');
 const wrong=await sign({...claim,aud:'jrvx-planner'});
 await assert.rejects(authenticate(new Request('https://med.jrvx.ru/api/me',{headers:{authorization:`Bearer ${wrong}`}}),env,Date.now(),mock),{status:401});
 const expired=await sign({...claim,exp:issued-3600});
 await assert.rejects(authenticate(new Request('https://med.jrvx.ru/api/me',{headers:{authorization:`Bearer ${expired}`}}),env,Date.now(),mock),{status:401});
});
