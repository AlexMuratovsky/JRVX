import { plansFor } from "../route";
import { readJson,json,errorResponse } from "@/lib/integration-http";
export const dynamic="force-dynamic";
export async function GET(request:Request){try{return json(await (await plansFor(request)).categories());}catch(e){return errorResponse(e);}}
export async function POST(request:Request){try{return json({category:await (await plansFor(request,true)).addCategory(await readJson(request,1000))},201);}catch(e){return errorResponse(e);}}
