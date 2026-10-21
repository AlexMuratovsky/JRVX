import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { WebStandardStreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js";
import { z } from "zod";
import { operations, plannerInstructions } from "./planner-operations";
import { rateLimit } from "./rate-limit";
import { PlannerService, publicError } from "./planner-service";

export function createPlannerMcp(service:PlannerService,portableOAuth=false) {
  service=new PlannerService(service.db,service.owner,service.origin,{actor:"mcp",source:"chatgpt_mcp"});
  // Per-request server: never share a user's credentials or connection between calls.
  const server=new McpServer({name:"planhelper-alemura",version:"2.0.0"},{instructions:plannerInstructions});
  for(const op of operations)server.registerTool(op.name,{
    title:op.title,description:op.description,inputSchema:op.input,
    // MCP outputs must be objects. A result wrapper accommodates confirmations.
    outputSchema:z.object({result:op.output}),
    annotations:{readOnlyHint:op.readOnly,destructiveHint:op.destructive,openWorldHint:["read_file","semantic_search"].includes(op.name),idempotentHint:op.readOnly||["create_event","create_task","create_note","set_task_completion","commit_confirmation"].includes(op.name)},
    _meta:{securitySchemes:[{type:"oauth2",scopes:portableOAuth?(op.readOnly?["jarvis:read"]:["jarvis:read","jarvis:write"]):[]}]},
  },async input=>{
    try{const result=await op.run(service,input);return {structuredContent:{result},content:[{type:"text" as const,text:JSON.stringify(result)}]};}
    catch(error){const e=publicError(error);return {isError:true,content:[{type:"text" as const,text:JSON.stringify(e.body)}]};}
  });
  return server;
}
export async function mcpResponse(request:Request,body:unknown,service:PlannerService,portableOAuth=false) {
  if((body as {method?:string})?.method!=="tools/call")await rateLimit(service.db,service.owner,"mcp-discovery",120,60000);
  const server=createPlannerMcp(service,portableOAuth);
  const transport=new WebStandardStreamableHTTPServerTransport({sessionIdGenerator:undefined,enableJsonResponse:true});
  await server.connect(transport);
  try {const response=await transport.handleRequest(request,{parsedBody:body});response.headers.set("Cache-Control","private, no-store");return response;}
  finally {await server.close();}
}
