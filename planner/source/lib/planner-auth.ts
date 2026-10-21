import { cookies, headers } from "next/headers";
import { getChatGPTUser } from "@/app/chatgpt-auth";
import { plannerDatabase } from "./planner-db";
import { SESSION_COOKIE, sessionUser } from "./password-auth";
import { resolveNativeOwner } from "./planner-identity";
import {jrvxIdentity} from './jrvx-identity';

export type PlannerUser={userId:string,displayName:string,mode:"password"|"chatgpt"|"jrvx",username:string|null};
export async function getPlannerUser():Promise<PlannerUser|null> {
  const h=await headers();
  // External MCP OAuth identifies the Sites user. Never mix a browser session
  // into a request that contains external credentials.
  if(!h.has("authorization")&&!h.has("oai-sites-authorization")) {
    const token=(await cookies()).get(SESSION_COOKIE)?.value;
    if(token==='signed-out')return null;
    if(token){const user=await sessionUser(plannerDatabase(),token);if(user)return {userId:user.owner_id,displayName:user.username,username:user.username,mode:"password"};}
    const identity=await jrvxIdentity();
    if(identity)return {userId:await resolveNativeOwner(plannerDatabase(),identity.userId),displayName:identity.displayName,username:null,mode:'jrvx'};
  }
  const native=await getChatGPTUser();
  return native?{userId:await resolveNativeOwner(plannerDatabase(),native.userId),displayName:native.displayName,username:null,mode:"chatgpt"}:null;
}
