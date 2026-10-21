import { jsonSchema } from "./json-schema";
import { z } from "zod";
import { operations } from "./planner-operations";
import { errorResult } from "./integration-schemas";

export function openapi(origin:string) {
  const paths:Record<string,unknown>={};
  const schema=jsonSchema;
  for(const op of operations)paths[`/api/v1/actions/${op.name}`]={post:{
    operationId:op.name,summary:op.title,description:op.description,
    "x-openai-isConsequential":op.destructive,
    requestBody:{required:true,content:{"application/json":{schema:schema(op.input)}}},
    responses:{"200":{description:"Operation result. A confirmation response is pending until executed=true.",content:{"application/json":{schema:schema(z.object({result:op.output})).properties.result}}},
      ...Object.fromEntries([400,401,403,404,409,413,415,422,429,503].map(code=>[code,{description:({400:"Invalid parameters",401:"Authentication required",403:"Forbidden or human approval required",404:"Not found",409:"Stale version or confirmation conflict",413:"Request too large",415:"JSON required",422:"Unsupported period or result size",429:"Rate limited",503:"Service unavailable"} as Record<number,string>)[code],content:{"application/json":{schema:schema(errorResult)}}}]))},
  }};
  return {openapi:"3.1.0",info:{title:"JRVX API",version:"2.0.0",description:"MCP at /mcp is the ChatGPT connection. This OpenAPI documents the same actions for first-party clients. A server-validated password session or Sites sign-in is required. External ChatGPT tools use the MCP OAuth connection; this schema is not a ready-made GPT Actions OAuth configuration."},servers:[{url:origin}],security:[{PlannerSession:[]}],components:{securitySchemes:{PlannerSession:{type:"apiKey",in:"cookie",name:"__Host-planhelper-session",description:"HttpOnly session issued by POST /api/auth/login or /api/auth/register. Sites-managed sign-in is also accepted. Do not share session cookies with ChatGPT."}}},paths};
}
