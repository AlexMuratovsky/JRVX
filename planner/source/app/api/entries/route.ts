import { getPlannerUser } from "@/lib/planner-auth";
import { entrySchema } from "@/lib/planner";
import { plannerDatabase } from "@/lib/planner-db";
import { rateLimit } from "@/lib/rate-limit";
import { updateSchema } from "@/lib/integration-schemas";
import { normalizeLegacy } from "@/lib/planner-legacy";
import { ApiError, nextVersion,PlannerService } from "@/lib/planner-service";

export const dynamic = "force-dynamic";
const json = (body: unknown, status = 200) => Response.json(body, {status, headers:{"Cache-Control":"no-store"}});
export async function GET() {
  const user = await getPlannerUser();
  if (!user) return json({error:"Войдите в аккаунт, чтобы открыть свои записи."},401);
  try {
    const rows = await plannerDatabase().prepare("SELECT id, payload, updated_at FROM planner_entries WHERE owner_id = ? ORDER BY updated_at DESC").bind(user.userId).all<{id:string,payload:string,updated_at:string}>();
    return json({entries:rows.results.map(row => ({...JSON.parse(row.payload),id:row.id,version:row.updated_at}))});
  } catch (error) { return json({error:"Не удалось загрузить записи. Повторите попытку."},503); }
}
export async function POST(request: Request) { return mutate(request); }
export async function PUT(request: Request) { return mutate(request); }
export async function DELETE(request: Request) { return mutate(request); }
async function mutate(request: Request) {
  const user = await getPlannerUser();
  if (!user) return json({error:"Войдите в аккаунт, чтобы сохранить записи."},401);
  const origin = request.headers.get("origin");
  if(request.headers.has("authorization")||request.headers.has("oai-sites-authorization"))return json({error:"Для внешних команд используйте /mcp"},403);
  if ((origin && origin !== new URL(request.url).origin) || request.headers.get("sec-fetch-site") === "cross-site") return json({error:"Запрос отклонён"},403);
  if (!request.headers.get("content-type")?.includes("application/json")) return json({error:"Неверный формат запроса"},415);
  if (Number(request.headers.get("content-length") ?? 0) > 32000) return json({error:"Слишком большая запись"},413);
  let raw: unknown;
  try { const text = await request.text(); if(text.length > 32000) return json({error:"Слишком большая запись"},413); raw=JSON.parse(text); } catch { return json({error:"Проверьте введённые данные"},400); }
  const body=raw as {id?:unknown,version?:unknown,confirmed?:unknown,requestId?:unknown};
  if (!body || typeof body !== "object") return json({error:"Неверные данные"},400);
  const id=body.id;
  if (request.method !== "POST" && (typeof id !== "string" || !/^[a-f0-9-]{36}$/.test(id))) return json({error:"Неверный идентификатор записи"},400);
  const parsed=entrySchema.safeParse(raw);
  if(request.method !== "DELETE" && !parsed.success) return json({error:parsed.error.issues[0]?.message ?? "Проверьте поля"},400);
  try {
    const db=plannerDatabase();await rateLimit(db,user.userId,"legacy-mutations",120,60000);const service=new PlannerService(db,user.userId,new URL(request.url).origin,{actor:"user",source:"web"});
    const existing=request.method!=="POST"?await db.prepare("SELECT payload, updated_at FROM planner_entries WHERE id = ? AND owner_id = ?").bind(id,user.userId).first<{payload:string,updated_at:string}>():null;
    if(request.method!=="POST"&&!existing)return json({error:"Запись не найдена"},404);
    if(body.version!==undefined&&body.version!==existing?.updated_at)return json({error:"Запись изменилась. Обновите страницу и повторите."},409);
    if(request.method === "DELETE") {
      if(origin!==new URL(request.url).origin||body.confirmed!==true)return json({error:"Подтвердите удаление в JRVX."},403);
      const preview=await service.requestDelete({id:String(id),version:existing!.updated_at});await service.decide(preview.confirmationId,true);return json({ok:true});
    }
    if (!parsed.success) return json({error:"Проверьте поля"},400);
    const normalized=normalizeLegacy(parsed.data,existing?entrySchema.parse(JSON.parse(existing.payload)):null);
    if(request.method === "POST") {
      const key=typeof body.requestId==="string"&&/^[a-f0-9-]{36}$/.test(body.requestId)?body.requestId:crypto.randomUUID();
      const result=await service.insertPayload(normalized,key);
      if(!("entry" in result))return json({action:result});const saved=await service.row(result.entry.id);return json({entry:{...JSON.parse(saved.payload),id:saved.id,version:saved.updated_at}},201);
    }
    const zone=normalized.timeZone??await service.zone();const record=service.toRecord({id:String(id),payload:JSON.stringify(normalized),updated_at:existing!.updated_at},zone);const {id:_,version:__,kind,...changes}=record;
    if(kind==="reminder")return json({error:"Неверный тип"},400);
    const result=await service.update(updateSchema.parse({id:String(id),version:existing!.updated_at,kind,changes:{...changes,reminderMinutes:null}}));
    if(!("entry" in result))return json({action:result});const saved=await service.row(String(id));return json({entry:{...JSON.parse(saved.payload),id:saved.id,version:saved.updated_at}});
  } catch(error) { if(error instanceof ApiError)return json({error:error.message},error.status);return json({error:"Не удалось сохранить изменения. Проверьте соединение и повторите."},503); }
}
