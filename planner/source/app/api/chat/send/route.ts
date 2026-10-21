import { chatStoreFor } from "@/lib/chat-http";
import { errorResponse,readJson } from "@/lib/integration-http";
import { prepareChat,runChat } from "@/lib/chat-engine";
import { PlannerService } from "@/lib/planner-service";
export const dynamic="force-dynamic";
export async function POST(request:Request){try{
  const store=await chatStoreFor(request,true),prepared=await prepareChat(store,await readJson(request,100000));
  const controller=new AbortController(),timeout=setTimeout(()=>controller.abort(),180000),encoder=new TextEncoder();let open=true;
  const stream=new ReadableStream<Uint8Array>({async start(output){try{await runChat(store,prepared,new PlannerService(store.db,store.owner,new URL(request.url).origin),AbortSignal.any([controller.signal,request.signal]),event=>{if(open)output.enqueue(encoder.encode(JSON.stringify(event)+"\n"));});}catch{if(open)output.enqueue(encoder.encode(JSON.stringify({type:"error",error:{message:"Не удалось завершить ответ. Обновите историю перед повтором команды."}})+"\n"));}finally{clearTimeout(timeout);if(open){open=false;output.close();}}},cancel(){open=false;controller.abort();clearTimeout(timeout);}});
  return new Response(stream,{headers:{"Content-Type":"application/x-ndjson; charset=utf-8","Cache-Control":"private, no-store","X-Content-Type-Options":"nosniff"}});
}catch(e){return errorResponse(e);}}
