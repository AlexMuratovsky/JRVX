import { z } from "zod";
import { browserOnly,errorResponse,json,readJson,serviceFor } from "@/lib/integration-http";
import { dueReminders,acknowledgeReminder } from "@/lib/planner-reminders";
export const dynamic="force-dynamic";
export async function GET(request:Request){try{browserOnly(request);return json(await dueReminders(await serviceFor(request,"user")));}catch(e){return errorResponse(e);}}
export async function POST(request:Request){try{browserOnly(request);if(request.headers.get("origin")!==new URL(request.url).origin)return json({error:{message:"Откройте JRVX."}},403);const s=await serviceFor(request,"user"),v=z.object({receiptId:z.string().regex(/^[a-f0-9]{64}$/)}).strict().parse(await readJson(request,1000));return json(await acknowledgeReminder(s,v.receiptId));}catch(e){return errorResponse(e);}}
