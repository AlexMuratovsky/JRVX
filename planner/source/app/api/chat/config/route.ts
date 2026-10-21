import { publicChatConfig } from "@/lib/chat-config";
import { chatStoreFor } from "@/lib/chat-http";
import { errorResponse,json } from "@/lib/integration-http";
export const dynamic="force-dynamic";
export async function GET(request:Request){try{await chatStoreFor(request);return json(publicChatConfig());}catch(e){return errorResponse(e);}}
