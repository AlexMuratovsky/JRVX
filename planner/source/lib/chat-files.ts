import { Buffer } from "node:buffer";
import { ApiError } from "./planner-service";
import { ChatStore, type Attachment } from "./chat-store";
const types:Record<string,string>={jpg:"image/jpeg",jpeg:"image/jpeg",png:"image/png",webp:"image/webp",gif:"image/gif",pdf:"application/pdf",txt:"text/plain",md:"text/markdown",csv:"text/csv",json:"application/json",docx:"application/vnd.openxmlformats-officedocument.wordprocessingml.document",pptx:"application/vnd.openxmlformats-officedocument.presentationml.presentation",xlsx:"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"};
export const maxFile=8*1024*1024;
export async function boundedBytes(request:Request){if(Number(request.headers.get("content-length")??0)>maxFile)throw new ApiError(413,"file_too_large","Размер файла — до 8 МБ.");const reader=request.body?.getReader();if(!reader)throw new ApiError(400,"empty_file","Выберите файл.");const chunks:Uint8Array[]=[];let total=0;for(;;){const {value,done}=await reader.read();if(done)break;total+=value.byteLength;if(total>maxFile){await reader.cancel();throw new ApiError(413,"file_too_large","Размер файла — до 8 МБ.");}chunks.push(value);}if(!total)throw new ApiError(400,"empty_file","Файл пуст.");const bytes=new Uint8Array(total);let offset=0;for(const c of chunks){bytes.set(c,offset);offset+=c.length;}return bytes;}
export async function upload(store:ChatStore,bucket:R2Bucket,thread:string,name:string,bytes:Uint8Array){
  return store.withFileLock(thread,async()=>{
  if(!bytes.length||bytes.length>maxFile)throw new ApiError(413,"file_too_large","Размер файла — до 8 МБ.");
  const clean=name.replace(/[\x00-\x1f\x7f/\\]/g,"_").slice(0,180),ext=clean.split(".").pop()?.toLowerCase()??"",mime=types[ext];
  if(!mime)throw new ApiError(415,"unsupported_file","Поддерживаются JPEG, PNG, WebP, GIF, PDF, TXT, MD, CSV, JSON, DOCX, PPTX и XLSX. HEIC сохраните как JPEG.");
  const b=Buffer.from(bytes),head=b.subarray(0,16).toString("latin1");
  const valid=mime==="image/jpeg"?bytes[0]===255&&bytes[1]===216&&bytes[2]===255:mime==="image/png"?b.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10])):mime==="image/gif"?/^GIF8[79]a/.test(head):mime==="image/webp"?head.startsWith("RIFF")&&head.slice(8,12)==="WEBP":ext==="pdf"?head.startsWith("%PDF-"):["docx","xlsx","pptx"].includes(ext)?head.startsWith("PK\x03\x04"):!bytes.includes(0);
  if(!valid)throw new ApiError(415,"invalid_file","Содержимое файла не соответствует его расширению.");
  // Reserve quota in one statement so concurrent uploads cannot exceed it.
  const id=crypto.randomUUID(),objectKey=`chat/${store.owner}/${id}`,now=new Date().toISOString();
  const reserved=await store.db.prepare("INSERT INTO chat_attachments (id,owner_id,thread_id,object_key,name,mime,size,created_at) SELECT ?,?,?,?,?,?,?,? WHERE (SELECT COALESCE(SUM(size),0) FROM chat_attachments WHERE owner_id = ?) + ? <= 67108864 AND (SELECT COUNT(*) FROM chat_attachments WHERE owner_id = ? AND thread_id = ? AND message_id IS NULL) < 3").bind(id,store.owner,thread,objectKey,clean,mime,bytes.length,now,store.owner,bytes.length,store.owner,thread).run();
  if(!reserved.meta.changes)throw new ApiError(413,"storage_quota","До 3 вложений к сообщению и 64 МБ файлов на аккаунт. Удалите ненужные вложения или диалоги.");
  try{await bucket.put(objectKey,bytes,{httpMetadata:{contentType:mime}});}catch(e){await store.db.prepare("DELETE FROM chat_attachments WHERE id = ? AND owner_id = ?").bind(id,store.owner).run();throw e;}
  return {id,name:clean,mime,size:bytes.length};
  });
}
export async function removeUpload(store:ChatStore,bucket:R2Bucket,id:string){const initial=await store.attachment(id);await store.withFileLock(initial.thread_id,async()=>{const f=await store.attachment(id);if(f.message_id)throw new ApiError(409,"file_in_use","Файл уже прикреплён. Удалите диалог для удаления его вложений.");await bucket.delete(f.object_key);await store.db.prepare("DELETE FROM chat_attachments WHERE id = ? AND owner_id = ? AND message_id IS NULL").bind(id,store.owner).run();});}
export async function fileInput(bucket:R2Bucket,f:Attachment){const object=await bucket.get(f.object_key);if(!object)throw new ApiError(409,"file_missing","Файл недоступен. Загрузите его заново.");const data=`data:${f.mime};base64,${Buffer.from(await object.arrayBuffer()).toString("base64")}`;return f.mime.startsWith("image/")?{type:"input_image",image_url:data,detail:"auto"}:{type:"input_file",filename:f.name,file_data:data};}
