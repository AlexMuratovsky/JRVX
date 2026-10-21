import { AsyncLocalStorage } from "node:async_hooks";
import { DatabaseSync } from "node:sqlite";
import { readFileSync,readdirSync } from "node:fs";
export const requests=new AsyncLocalStorage<Request>();
export const sql=new DatabaseSync(":memory:");
for(const file of readdirSync("drizzle").filter(f=>f.endsWith(".sql")).sort())sql.exec(readFileSync(`drizzle/${file}`,"utf8"));
class Statement {
  constructor(private query:string,private values:unknown[]=[]){}
  bind(...values:unknown[]){return new Statement(this.query,values);}
  async first<T>() {return (sql.prepare(this.query).get(...this.values as never[])??null) as T|null;}
  async all<T>() {return {results:sql.prepare(this.query).all(...this.values as never[]) as T[]};}
  async run(){const r=sql.prepare(this.query).run(...this.values as never[]);return {success:true,meta:{changes:Number(r.changes)}};}
}
export const db={prepare:(query:string)=>new Statement(query),batch:async(statements:Statement[])=>{
  sql.exec("BEGIN");try{const results=[];for(const statement of statements)results.push(await statement.run());sql.exec("COMMIT");return results;}catch(error){sql.exec("ROLLBACK");throw error;}
}} as unknown as D1Database;
export const env:{DB:D1Database,OPENAI_API_KEY?:string,OPENAI_CHAT_MODELS?:string,OPENAI_CHAT_MODEL?:string,BUCKET?:R2Bucket}={DB:db};
export async function headers(){return requests.getStore()?.headers??new Headers();}
export async function cookies(){const h=await headers();return {get:(name:string)=>{const cookie=h.get("cookie")?.split(";").map(v=>v.trim()).find(v=>v.startsWith(name+"="));return cookie?{name,value:cookie.slice(name.length+1)}:undefined;}};}
export const origin="https://planner.test";
export function request(path:string,body?:unknown,owner?:string,extra:Record<string,string>={}) {
  return new Request(origin+path,{method:body===undefined?"GET":"POST",headers:{...(body===undefined?{}:{"Content-Type":"application/json",Origin:origin}),...(owner?{"oai-authenticated-user-id":owner,"oai-authenticated-user-email":`${owner}@example.test`}:{}),...extra},...(body===undefined?{}:{body:JSON.stringify(body)})});
}
export async function call<T extends unknown[]>(handler:(request:Request,...args:T)=>Promise<Response>,req:Request,...args:T){return requests.run(req,()=>handler(req,...args));}
