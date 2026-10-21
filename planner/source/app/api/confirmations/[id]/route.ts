import { cookies } from "next/headers";
import { z } from "zod";
import { browserOnly, errorResponse, json, readJson, serviceFor } from "@/lib/integration-http";
import { idSchema } from "@/lib/integration-schemas";
import { ApiError, hash } from "@/lib/planner-service";
export const dynamic="force-dynamic";
type Route={params:Promise<{id:string}>};
const COOKIE="__Host-planhelper-confirm";
export async function GET(request:Request,{params}:Route) {
  try{browserOnly(request);const service=await serviceFor(request,"user");const id=idSchema.parse((await params).id);const action=await service.action(id);const token=crypto.randomUUID()+crypto.randomUUID();return json({...action,csrfToken:token},200,{"Set-Cookie":`${COOKIE}=${token}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=900`});}catch(e){return errorResponse(e);}
}
export async function POST(request:Request,{params}:Route) {
  try {
    browserOnly(request);if(request.headers.get("origin")!==new URL(request.url).origin)throw new ApiError(403,"invalid_origin","Откройте страницу подтверждения.");
    const service=await serviceFor(request,"user");const id=idSchema.parse((await params).id);
    const v=z.object({approved:z.boolean(),csrfToken:z.string().length(72)}).strict().parse(await readJson(request,1000));
    const token=(await cookies()).get(COOKIE)?.value;
    if(!token||await hash(token)!==await hash(v.csrfToken))throw new ApiError(403,"invalid_confirmation","Обновите страницу подтверждения.");
    return json(await service.decide(id,v.approved),200,{"Set-Cookie":`${COOKIE}=; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=0`});
  }catch(error){return errorResponse(error);}
}
