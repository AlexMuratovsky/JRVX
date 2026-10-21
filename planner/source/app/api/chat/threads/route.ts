import { z } from "zod";
import { chatStoreFor } from "@/lib/chat-http";
import { errorResponse,json } from "@/lib/integration-http";
export const dynamic="force-dynamic";
export async function GET(request:Request){try{const store=await chatStoreFor(request);const offset=z.coerce.number().int().min(0).max(100000).parse(new URL(request.url).searchParams.get("offset")??0);return json(await store.threads(offset));}catch(e){return errorResponse(e);}}
export async function POST(request:Request){try{const store=await chatStoreFor(request,true);return json({thread:await store.create()},201);}catch(e){return errorResponse(e);}}
