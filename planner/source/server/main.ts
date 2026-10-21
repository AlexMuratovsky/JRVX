import { createServer } from "node:http";
import { existingD1,verifyDatabase } from "./d1-http";
import { backendHandler } from "./handler";
import { env } from "./environment";
import { validateOAuthConfig } from "../lib/planner-oauth";
const required=(name:string)=>{const value=process.env[name];if(!value)throw new Error(`Configure ${name}`);return value;};
const issuer=required("JARVIS_MCP_ORIGIN").replace(/\/$/,""),siteOrigin=new URL(required("JARVIS_SITE_ORIGIN")).origin;
if(!siteOrigin.startsWith("https://"))throw new Error("JARVIS_SITE_ORIGIN requires HTTPS");
const config=validateOAuthConfig({issuer,resource:issuer+"/mcp",clientId:required("JARVIS_OAUTH_CLIENT_ID"),clientSecret:required("JARVIS_OAUTH_CLIENT_SECRET"),redirectUris:required("JARVIS_OAUTH_REDIRECT_URIS").split(",").map(s=>s.trim())});
const db=existingD1(required("CLOUDFLARE_ACCOUNT_ID"),required("JARVIS_D1_DATABASE_ID"),required("CLOUDFLARE_D1_API_TOKEN"));env.DB=db;
await verifyDatabase(db);const handle=backendHandler(db,config,siteOrigin);
const server=createServer(async(req,res)=>{const started=Date.now(),requestId=crypto.randomUUID();let path="/",status=500;try{
  const url=new URL(req.url??"/",issuer);if(url.origin!==issuer)throw new Error("Invalid origin");path=url.pathname;const chunks:Buffer[]=[];let bytes=0;for await(const value of req){const chunk=Buffer.from(value);bytes+=chunk.length;if(bytes>128000){res.writeHead(413,{"Content-Type":"application/json"});res.end(JSON.stringify({error:{code:"validation_error",message:"Request too large"}}));status=413;return;}chunks.push(chunk);}
  const headers=new Headers();for(const [key,value] of Object.entries(req.headers))if(value!==undefined&&!['host','oai-authenticated-user-id','oai-authenticated-user-email','oai-sites-authorization'].includes(key))headers.set(key,Array.isArray(value)?value.join(","):value);
  // Authentication exclusively uses opaque tokens checked against D1. Identity headers are ignored.
  const request=new Request(url,{method:req.method??"GET",headers,...(bytes?{body:Buffer.concat(chunks)}:{})});const response=await handle(request,req.socket.remoteAddress??"unknown");status=response.status;res.statusCode=status;response.headers.forEach((value,key)=>res.setHeader(key,value));res.setHeader("Strict-Transport-Security","max-age=31536000");res.setHeader("X-Request-ID",requestId);if(response.body){const reader=response.body.getReader();for(;;){const {done,value}=await reader.read();if(done)break;res.write(value);}}res.end();
}catch{status=503;if(!res.headersSent)res.writeHead(status,{"Content-Type":"application/json"});res.end(JSON.stringify({error:{code:"internal_error",message:"Service temporarily unavailable"}}));}finally{console.info(JSON.stringify({requestId,path,method:req.method,status,durationMs:Date.now()-started}));}});
server.requestTimeout=120000;server.headersTimeout=15000;server.listen(Number(process.env.PORT)||10000,"0.0.0.0",()=>console.info("JARVIS MCP listening"));process.on("SIGTERM",()=>server.close());
