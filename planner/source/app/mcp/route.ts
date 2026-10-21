import { errorResponse, json, readJson, serviceFor, validateOrigin } from "@/lib/integration-http";
import { mcpResponse } from "@/lib/planner-mcp";
export const dynamic="force-dynamic";
export async function POST(request:Request) {
  try {validateOrigin(request);const service=await serviceFor(request,"mcp");return await mcpResponse(request,await readJson(request),service);}catch(error){return errorResponse(error);}
}
// Stateless JSON transport: no standing SSE connection or session deletion.
export async function GET(request:Request) {try{validateOrigin(request);await serviceFor(request,"mcp");return json({error:"Use POST"},405,{Allow:"POST"});}catch(error){return errorResponse(error);}}
export const DELETE=GET;
