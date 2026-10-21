import { openapi } from "@/lib/planner-openapi";
import { errorResponse, json, serviceFor } from "@/lib/integration-http";
export const dynamic="force-dynamic";
export async function GET(request:Request) {try{await serviceFor(request);return json(openapi(new URL(request.url).origin));}catch(error){return errorResponse(error);}}
