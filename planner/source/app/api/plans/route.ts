import { PlansService } from "@/lib/plans-service";
import { serviceFor,validateOrigin,readJson,json,errorResponse } from "@/lib/integration-http";
import { ApiError } from "@/lib/planner-service";
import { rateLimit } from "@/lib/rate-limit";
export const dynamic="force-dynamic";
export async function plansFor(request:Request,write=false){validateOrigin(request);if(request.headers.has("authorization")||request.headers.has("oai-sites-authorization")||write&&request.headers.get("origin")!==new URL(request.url).origin)throw new ApiError(403,"forbidden","Откройте раздел «Планы» в JRVX.");const s=await serviceFor(request,"user");await rateLimit(s.db,s.owner,"plans",180,60000);return new PlansService(s.db,s.owner);}
export async function GET(request:Request){try{const s=await plansFor(request);return json(await s.list(Object.fromEntries(new URL(request.url).searchParams)));}catch(e){return errorResponse(e);}}
export async function POST(request:Request){try{const s=await plansFor(request,true);return json({plan:await s.create(await readJson(request,24000))},201);}catch(e){return errorResponse(e);}}
export async function PATCH(request:Request){try{const s=await plansFor(request,true);return json({plan:await s.update(await readJson(request,24000))});}catch(e){return errorResponse(e);}}
export async function DELETE(request:Request){try{const s=await plansFor(request,true);return json(await s.remove(await readJson(request,2000)));}catch(e){return errorResponse(e);}}
