import { randomBytes, scrypt, timingSafeEqual } from "node:crypto";
import { z } from "zod";
import { ApiError, hash } from "./planner-service";
export const SESSION_COOKIE="__Host-planhelper-session";
export const loginSchema=z.object({username:z.string().trim().regex(/^[a-zA-Z0-9_]{3,32}$/,"Логин: 3–32 латинские буквы, цифры или _").transform(v=>v.toLowerCase()),password:z.string().min(12,"Пароль должен содержать минимум 12 символов").max(128,"Максимум 128 символов")}).strict();
export const registerSchema=loginSchema.extend({linkExisting:z.boolean().default(false)});
const parameters={N:32768,r:8,p:3,maxmem:64*1024*1024};
async function derive(password:string,salt:Buffer) {return new Promise<Buffer>((resolve,reject)=>scrypt(password,salt,32,parameters,(error,key)=>error?reject(error):resolve(key)));}
export async function passwordHash(password:string) {const salt=randomBytes(16);return `scrypt-v1$${salt.toString("hex")}$${(await derive(password,salt)).toString("hex")}`;}
export async function checkPassword(password:string,stored:string|null) {
  const parts=stored?.split("$");
  const valid=parts?.length===3&&parts[0]==="scrypt-v1"&&/^[a-f0-9]{32}$/.test(parts[1])&&/^[a-f0-9]{64}$/.test(parts[2]);
  const actual=await derive(password,Buffer.from(valid?parts[1]:"00000000000000000000000000000000","hex"));
  const expected=Buffer.from(valid?parts[2]:"00".repeat(32),"hex");
  return timingSafeEqual(actual,expected)&&Boolean(valid);
}
export function sessionCookie(token:string,maxAge=7*86400) {return `${SESSION_COOKIE}=${token}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${maxAge}`;}
export async function createSession(db:D1Database,owner:string) {
  const token=randomBytes(32).toString("hex");const expires=new Date(Date.now()+7*86400000).toISOString();
  await db.prepare("INSERT INTO planner_sessions (token_hash, owner_id, expires_at) VALUES (?, ?, ?)").bind(await hash(token),owner,expires).run();return token;
}
export async function sessionUser(db:D1Database,token:string) {
  if(!/^[a-f0-9]{64}$/.test(token))return null;
  return db.prepare("SELECT s.owner_id, c.username FROM planner_sessions s JOIN planner_credentials c ON c.owner_id = s.owner_id WHERE s.token_hash = ? AND s.expires_at > ?").bind(await hash(token),new Date().toISOString()).first<{owner_id:string,username:string}>();
}
export async function rateLimit(db:D1Database,username:string,ip:string) {
  const now=new Date().toISOString(),expires=new Date(Date.now()+15*60000).toISOString();
  for(const [kind,value,limit] of [["username",username,8],["ip",ip,40]] as const) {
    const key=await hash(`${kind}:${value}`);
    const result=await db.prepare("INSERT INTO planner_auth_attempts (key, attempts, expires_at) VALUES (?, 1, ?) ON CONFLICT(key) DO UPDATE SET attempts = CASE WHEN expires_at <= ? THEN 1 ELSE attempts + 1 END, expires_at = CASE WHEN expires_at <= ? THEN excluded.expires_at ELSE expires_at END RETURNING attempts").bind(key,expires,now,now).first<{attempts:number}>();
    if(!result||result.attempts>limit)throw new ApiError(429,"too_many_attempts","Слишком много попыток. Повторите через 15 минут.");
  }
}
export async function register(db:D1Database,input:z.infer<typeof registerSchema>,existingOwner:string|null) {
  if(input.linkExisting&&!existingOwner)throw new ApiError(401,"sign_in_required","Сначала войдите через ChatGPT, чтобы привязать логин к Вашим записям.");
  const owner=input.linkExisting?existingOwner!:`local:${crypto.randomUUID()}`;
  const stored=await passwordHash(input.password);
  const result=await db.prepare("INSERT OR IGNORE INTO planner_credentials (username, owner_id, password_hash, created_at) VALUES (?, ?, ?, ?)").bind(input.username,owner,stored,new Date().toISOString()).run();
  if(!result.meta.changes)throw new ApiError(409,"registration_unavailable","Логин занят или к этому аккаунту уже привязан логин. Попробуйте войти.");
  return owner;
}
export async function login(db:D1Database,input:z.infer<typeof loginSchema>) {
  const row=await db.prepare("SELECT owner_id, password_hash FROM planner_credentials WHERE username = ?").bind(input.username).first<{owner_id:string,password_hash:string}>();
  if(!await checkPassword(input.password,row?.password_hash??null))throw new ApiError(401,"invalid_credentials","Неверный логин или пароль.");
  return row!.owner_id;
}
