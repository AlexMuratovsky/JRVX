import { getPlannerUser } from "./planner-auth";
import { plannerDatabase } from "./planner-db";
import { ApiError, PlannerService, publicError } from "./planner-service";

import { json,validateOrigin } from "./api-http-base";
export { json,validateOrigin,readJson } from "./api-http-base";
export async function serviceFor(request:Request,actor?:"user"|"mcp") {
  const user=await getPlannerUser();
  // Identity headers are accepted ONLY behind Sites dispatch, which strips caller
  // headers and validates browser sign-in / the platform's MCP OAuth credential.
  // Never derive owner_id from request JSON, query parameters, email, or a raw JWT.
  if(!user)throw new ApiError(401,"unauthorized","Войдите в аккаунт JRVX.");
  const source=actor??(request.headers.get("sec-fetch-site")==="same-origin"&&!request.headers.has("authorization")&&!request.headers.has("oai-sites-authorization")?"user":"mcp");
  return new PlannerService(plannerDatabase(),user.userId,new URL(request.url).origin,{actor:source,source:source==="user"?"web":"chatgpt_mcp"});
}
export function errorResponse(error:unknown) {const e=publicError(error);return json(e.body,e.status,e.status===401?{"WWW-Authenticate":"Bearer"}:{});}
export function browserOnly(request:Request) {
  validateOrigin(request);
  if(request.headers.has("authorization")||request.headers.has("oai-sites-authorization"))throw new ApiError(403,"browser_required","Подтвердите действие в браузере.");
  if(request.headers.get("sec-fetch-site")!=="same-origin")throw new ApiError(403,"browser_required","Откройте страницу подтверждения в планировщике.");
}
