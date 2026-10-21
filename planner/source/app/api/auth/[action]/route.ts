import {jrvxIdentity,standalonePlanner} from "@/lib/jrvx-identity";
import { cookies } from "next/headers";
import { z } from "zod";
import { getChatGPTUser } from "@/app/chatgpt-auth";
import { getPlannerUser } from "@/lib/planner-auth";
import { linkIdentity,resolveNativeOwner } from "@/lib/planner-identity";
import { plannerDatabase } from "@/lib/planner-db";
import { ApiError, hash } from "@/lib/planner-service";
import { errorResponse, json, readJson, validateOrigin } from "@/lib/integration-http";
import { SESSION_COOKIE, checkPassword, createSession, login, loginSchema, passwordHash, rateLimit, register, registerSchema, sessionCookie } from "@/lib/password-auth";
export const dynamic="force-dynamic";
type Route={params:Promise<{action:string}>};
export async function GET(_request:Request,{params}:Route) {
  try{if((await params).action!=="session")throw new ApiError(404,"not_found","Не найдено");const user=await getPlannerUser();const credential=user?await plannerDatabase().prepare("SELECT username FROM planner_credentials WHERE owner_id = ?").bind(user.userId).first<{username:string}>():null;return json({signedIn:!!user,displayName:user?.displayName??null,mode:user?.mode??null,hasPassword:!!credential,username:credential?.username??null,standalone:standalonePlanner()});}catch(e){return errorResponse(e);}
}
export async function POST(request:Request,{params}:Route) {
  try {
    validateOrigin(request);
    if(request.headers.get("origin")!==new URL(request.url).origin||request.headers.has("authorization"))throw new ApiError(403,"invalid_origin","Используйте форму входа на сайте.");
    const {action}=await params;const db=plannerDatabase();
    if(action==="logout") {
      const token=(await cookies()).get(SESSION_COOKIE)?.value;
      if(token)await db.prepare("DELETE FROM planner_sessions WHERE token_hash = ?").bind(await hash(token)).run();
      return json({ok:true},200,{"Set-Cookie":sessionCookie("signed-out")});
    }
    const raw=await readJson(request,4000);
    if(action==="register"||action==="login") {
      const v=action==="register"?registerSchema.parse(raw):loginSchema.parse(raw);
      await rateLimit(db,v.username,request.headers.get("cf-connecting-ip")??"unknown");
      const native=await getChatGPTUser();const identity=await jrvxIdentity();const nativeOwner=native?await resolveNativeOwner(db,native.userId):identity?await resolveNativeOwner(db,identity.userId):null;
      const owner=action==="register"?await register(db,registerSchema.parse(raw),nativeOwner):await login(db,v);
      const token=await createSession(db,owner);return json({ok:true},action==="register"?201:200,{"Set-Cookie":sessionCookie(token)});
    }
    if(action==="link-id") {
      const user=await getPlannerUser(),identity=await jrvxIdentity();
      if(!user||user.mode!=="password"||!identity)throw new ApiError(401,"sign_in_required","Войдите по паролю Planner и в JRVX ID.");
      const v=z.object({password:z.string().max(128),confirmed:z.literal(true)}).strict().parse(raw);
      const row=await db.prepare("SELECT password_hash FROM planner_credentials WHERE owner_id = ?").bind(user.userId).first<{password_hash:string}>();
      await rateLimit(db,user.username!,request.headers.get("cf-connecting-ip")??"unknown");
      if(!await checkPassword(v.password,row?.password_hash??null))throw new ApiError(401,"invalid_credentials","Неверный пароль.");
      await linkIdentity(db,identity.userId,user.userId);return json({linked:true});
    }
    if(action==="link-chatgpt") {
      const user=await getPlannerUser(),native=await getChatGPTUser();if(!user||user.mode!=="password"||!native)throw new ApiError(401,"sign_in_required","Войдите по паролю в JRVX и через ChatGPT в сайт.");
      const v=z.object({password:z.string().max(128),confirmed:z.literal(true)}).strict().parse(raw);
      const row=await db.prepare("SELECT password_hash FROM planner_credentials WHERE owner_id = ?").bind(user.userId).first<{password_hash:string}>();
      await rateLimit(db,user.username!,request.headers.get("cf-connecting-ip")??"unknown");
      if(!await checkPassword(v.password,row?.password_hash??null))throw new ApiError(401,"invalid_credentials","Неверный пароль.");
      await linkIdentity(db,native.userId,user.userId);return json({linked:true});
    }
    if(action==="change-password") {
      const user=await getPlannerUser();if(!user)throw new ApiError(401,"unauthorized","Войдите в аккаунт");
      const v=z.object({currentPassword:z.string().max(128),newPassword:loginSchema.shape.password}).strict().parse(raw);
      const row=await db.prepare("SELECT username, password_hash FROM planner_credentials WHERE owner_id = ?").bind(user.userId).first<{username:string,password_hash:string}>();
      await rateLimit(db,row?.username??user.userId,request.headers.get("cf-connecting-ip")??"unknown");
      if(!await checkPassword(v.currentPassword,row?.password_hash??null))throw new ApiError(401,"invalid_credentials","Неверный текущий пароль.");
      const newHash=await passwordHash(v.newPassword);
      const result=await db.batch([db.prepare("UPDATE planner_credentials SET password_hash = ? WHERE owner_id = ? AND password_hash = ?").bind(newHash,user.userId,row!.password_hash),db.prepare("DELETE FROM planner_sessions WHERE owner_id = ? AND EXISTS (SELECT 1 FROM planner_credentials WHERE owner_id = ? AND password_hash = ?)").bind(user.userId,user.userId,newHash)]);
      if(!result[0].meta.changes)throw new ApiError(409,"password_changed","Пароль уже изменён в другом сеансе. Войдите заново.");
      const token=await createSession(db,user.userId);return json({ok:true},200,{"Set-Cookie":sessionCookie(token)});
    }
    throw new ApiError(404,"not_found","Не найдено");
  }catch(error){return errorResponse(error);}
}
