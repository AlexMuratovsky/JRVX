import {env} from 'cloudflare:workers';
import {headers} from 'next/headers';
type IdentityEnv={JRVX_STANDALONE?:string,IDENTITY?:Fetcher};
export function standalonePlanner(){return (env as unknown as IdentityEnv).JRVX_STANDALONE==='true';}
export async function jrvxIdentity(){
 const e=env as unknown as IdentityEnv;
 if(!standalonePlanner()||!e.IDENTITY)return null;
 const h=await headers();if(h.has('authorization')||h.has('oai-sites-authorization'))return null;
 const cookie=h.get('cookie');if(!cookie)return null;
 const r=await e.IDENTITY.fetch(new Request('https://id.jrvx.ru/api/integrations/session?app=planner',{headers:{cookie,'x-jrvx-app':'planner'}}));
 if(!r.ok)return null;
 const data=await r.json() as {ok?:boolean,user?:{id?:string|number,display_name?:string,username?:string,nickname?:string}};
 if(!data.ok||!data.user?.id)return null;
 const id=String(data.user.id);if(id.length>128)return null;
 return {userId:'jrvx:'+id,displayName:data.user.display_name||data.user.nickname||data.user.username||'JRVX ID'};
}
