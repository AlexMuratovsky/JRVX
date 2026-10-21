import { z } from "zod";
import { chatStoreFor } from "@/lib/chat-http";
import { chatConfig } from "@/lib/chat-config";
import { ApiError } from "@/lib/planner-service";
import { boundedBytes,upload } from "@/lib/chat-files";
import { errorResponse,json } from "@/lib/integration-http";
export const dynamic="force-dynamic";
export async function POST(request:Request){try{const store=await chatStoreFor(request,true),bucket=chatConfig().bucket;if(!bucket)throw new ApiError(503,"attachments_unavailable","Хранилище вложений не настроено.");const q=new URL(request.url).searchParams,thread=z.string().uuid().parse(q.get("threadId")),name=z.string().min(1).max(200).parse(q.get("name"));await store.thread(thread);return json({attachment:await upload(store,bucket,thread,name,await boundedBytes(request))},201);}catch(e){return errorResponse(e);}}
