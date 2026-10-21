import { browserOnly,errorResponse,json,readJson,serviceFor } from "@/lib/integration-http";
import { permissions,setPermissions } from "@/lib/ai-permissions";
export const dynamic="force-dynamic";
export async function GET(request:Request){try{browserOnly(request);const s=await serviceFor(request,"user");return json(await permissions(s.db,s.owner));}catch(e){return errorResponse(e);}}
export async function PUT(request:Request){try{browserOnly(request);if(request.headers.get("origin")!==new URL(request.url).origin)return json({error:{message:"Откройте настройки JRVX."}},403);const s=await serviceFor(request,"user");return json(await setPermissions(s.db,s.owner,await readJson(request,3000)));}catch(e){return errorResponse(e);}}
