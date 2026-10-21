import { operations } from "@/lib/planner-operations";
import { errorResponse, json, readJson, serviceFor, validateOrigin } from "@/lib/integration-http";
import { ApiError } from "@/lib/planner-service";
export const dynamic="force-dynamic";
export async function POST(request:Request,{params}:{params:Promise<{action:string}>}) {
  try {
    validateOrigin(request);const service=await serviceFor(request);
    const {action}=await params;const operation=operations.find(o=>o.name===action);
    if(!operation)throw new ApiError(404,"unknown_action","Неизвестная операция");
    const result=await operation.run(service,await readJson(request,action==="bulk_import"?128000:64000));
    return json(result);
  }catch(error){return errorResponse(error);}
}
