import { z } from "zod";
import { chatConfig } from "@/lib/chat-config";
import { chatStoreFor } from "@/lib/chat-http";
import { errorResponse,json,readJson } from "@/lib/integration-http";
export const dynamic="force-dynamic";
type Route={params:Promise<{id:string}>};
export async function GET(request:Request,{params}:Route){try{const store=await chatStoreFor(request),id=z.string().uuid().parse((await params).id),before=z.coerce.number().int().positive().max(Number.MAX_SAFE_INTEGER).parse(new URL(request.url).searchParams.get("before")??Number.MAX_SAFE_INTEGER);await store.thread(id);const pending=await store.db.prepare("SELECT id,name,mime,size FROM chat_attachments WHERE thread_id = ? AND owner_id = ? AND message_id IS NULL ORDER BY created_at").bind(id,store.owner).all();return json({thread:await store.thread(id),pendingAttachments:pending.results,...await store.history(id,before)});}catch(e){return errorResponse(e);}}
export async function DELETE(request:Request,{params}:Route){try{const store=await chatStoreFor(request,true),id=z.string().uuid().parse((await params).id);z.object({confirmed:z.literal(true)}).strict().parse(await readJson(request,1000));await store.remove(id,chatConfig().bucket);return json({deleted:true});}catch(e){return errorResponse(e);}}
