import { getPlannerUser } from "./planner-auth";
import { plannerDatabase } from "./planner-db";
import { ApiError } from "./planner-service";
import { ChatStore } from "./chat-store";
import { validateOrigin } from "./integration-http";
export async function chatStoreFor(request:Request,write=false){validateOrigin(request);if(write&&(request.headers.get("origin")!==new URL(request.url).origin||request.headers.has("authorization")||request.headers.has("oai-sites-authorization")))throw new ApiError(403,"browser_required","Откройте AI-чат в JRVX.");const user=await getPlannerUser();if(!user)throw new ApiError(401,"unauthorized","Войдите в аккаунт JRVX.");return new ChatStore(plannerDatabase(),user.userId);}
