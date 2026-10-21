import { chatStoreFor } from "@/lib/chat-http";
import { boundedBytes } from "@/lib/chat-files";
import { transcribe } from "@/lib/voice";
import { errorResponse,json } from "@/lib/integration-http";
import { rateLimit } from "@/lib/rate-limit";
export const dynamic="force-dynamic";
export async function POST(request:Request){try{const store=await chatStoreFor(request,true);await rateLimit(store.db,store.owner,"transcribe",30,3600000);return json(await transcribe(await boundedBytes(request),request.headers.get("content-type")??""));}catch(e){return errorResponse(e);}}
