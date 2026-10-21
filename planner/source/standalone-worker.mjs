// REG.RU serves static assets; this Worker runs the complete planner backend.
import app from './dist/server/index.js';
export default {
 async fetch(request,env,ctx){
  if(request.headers.has('oai-sites-authorization'))return Response.json({error:'Используйте вход в JRVX Planner.'},{status:401,headers:{'Cache-Control':'no-store','WWW-Authenticate':'Bearer'}});
  const url=new URL(request.url);
  if(url.pathname.startsWith('/api/tasks')||url.pathname==='/api/me'){
   return env.LEGACY_PLANNER.fetch(new Request('https://planner.jrvx.ru'+url.pathname+url.search,request));
  }
  const headers=new Headers(request.headers);
  // Sites injects these only on its own dispatch. Public callers cannot assert identity.
  for(const key of [...headers.keys()])if(key.startsWith('oai-')||key.startsWith('x-jrvx-user')||key==='x-forwarded-host'||key==='x-forwarded-proto')headers.delete(key);
  headers.set('host','planner.jrvx.ru');
  const normalized=new Request('https://planner.jrvx.ru'+url.pathname+url.search,new Request(request,{headers}));
  if(url.pathname==='/auth/chatgpt'||url.pathname==='/signin-with-chatgpt')return Response.redirect('https://planner.jrvx.ru/auth/id',303);
  try{
   const response=await app.fetch(normalized,env,ctx);
   const out=new Response(response.body,response);
   out.headers.set('X-Content-Type-Options','nosniff');
   out.headers.set('Referrer-Policy','strict-origin-when-cross-origin');
   out.headers.set('X-Frame-Options','SAMEORIGIN');
   out.headers.set('Cache-Control','private, no-store');
   return out;
  }catch{
   return Response.json({error:'Сервис временно недоступен. Повторите попытку.'},{status:503,headers:{'Cache-Control':'no-store'}});
  }
 }
};
