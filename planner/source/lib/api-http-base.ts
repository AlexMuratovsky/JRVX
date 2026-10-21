import { ApiError } from "./planner-service";
export const json=(body:unknown,status=200,headers:Record<string,string>={})=>Response.json(body,{status,headers:{"Cache-Control":"private, no-store","X-Content-Type-Options":"nosniff",...headers}});
export function validateOrigin(request:Request) {
  const origin=request.headers.get("origin");
  if((origin&&origin!==new URL(request.url).origin)||request.headers.get("sec-fetch-site")==="cross-site")throw new ApiError(403,"invalid_origin","Запрос с другого сайта отклонён.");
}
export async function readJson(request:Request,max=64000) {
  if(!request.headers.get("content-type")?.split(";")[0].trim().toLowerCase().includes("application/json"))throw new ApiError(415,"unsupported_media_type","Используйте application/json.");
  if(Number(request.headers.get("content-length")??0)>max)throw new ApiError(413,"body_too_large","Слишком большой запрос.");
  const reader=request.body?.getReader();if(!reader)throw new ApiError(400,"invalid_json","Пустой запрос.");
  const chunks:Uint8Array[]=[];let size=0;
  while(true){const {done,value}=await reader.read();if(done)break;size+=value.byteLength;if(size>max){await reader.cancel();throw new ApiError(413,"body_too_large","Слишком большой запрос.");}chunks.push(value);}
  const bytes=new Uint8Array(size);let offset=0;for(const chunk of chunks){bytes.set(chunk,offset);offset+=chunk.length;}
  try{return JSON.parse(new TextDecoder().decode(bytes)) as unknown;}catch{throw new ApiError(400,"invalid_json","Неверный JSON.");}
}
