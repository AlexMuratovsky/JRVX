import { z } from "zod";
import { chatStoreFor } from "@/lib/chat-http";
import { chatConfig } from "@/lib/chat-config";
import { ApiError } from "@/lib/planner-service";
import { removeUpload } from "@/lib/chat-files";
import { errorResponse,json } from "@/lib/integration-http";
export const dynamic="force-dynamic";
type Route={params:Promise<{id:string}>};
export async function GET(request:Request,{params}:Route){try{const store=await chatStoreFor(request),id=z.string().uuid().parse((await params).id),file=await store.attachment(id),bucket=chatConfig().bucket;if(!bucket)throw new ApiError(503,"attachments_unavailable","Хранилище вложений недоступно.");const object=await bucket.get(file.object_key);if(!object)throw new ApiError(404,"not_found","Файл не найден.");return new Response(object.body as ReadableStream,{headers:{"Content-Type":file.mime,"Content-Disposition":`attachment; filename="attachment"; filename*=UTF-8''${encodeURIComponent(file.name)}`,"Content-Length":String(file.size),"Cache-Control":"private, no-store","X-Content-Type-Options":"nosniff","Content-Security-Policy":"sandbox; default-src 'none'"}});}catch(e){return errorResponse(e);}}
export async function DELETE(request:Request,{params}:Route){try{const store=await chatStoreFor(request,true),id=z.string().uuid().parse((await params).id),bucket=chatConfig().bucket;if(!bucket)throw new ApiError(503,"attachments_unavailable","Хранилище вложений недоступно.");await removeUpload(store,bucket,id);return json({deleted:true});}catch(e){return errorResponse(e);}}
