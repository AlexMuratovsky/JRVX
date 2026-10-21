import { z } from "zod";
import { PlannerService,ApiError,hash,nextVersion } from "./planner-service";
import { reminderFields,reminderInput } from "./reminder-schema";
import { Temporal,addDays } from "./integration-time";
import { entrySchema,occursOn } from "./planner";
import { repeated } from "./recurrence";
export async function validateReminder(service:PlannerService,input:unknown){
  const v=reminderFields.parse(input);
  if(v.deliveryChannel!=="in_app")throw new ApiError(409,"delivery_not_configured","Push-доставка ещё не подключена. Выберите напоминание внутри приложения.");
  if((v.remindAt!==null)===(v.offsetMinutes!==null))throw new ApiError(400,"ambiguous_reminder","Укажите точное remindAt ИЛИ offsetMinutes перед связанной записью.");
  if(v.offsetMinutes!==null&&!v.entityId)throw new ApiError(400,"entity_required","Для относительного напоминания нужна связанная запись.");
  if(v.entityId){const e=(await service.get(v.entityId)).entry;if(e.kind!=="event"&&e.kind!=="task")throw new ApiError(400,"invalid_entity","Привяжите напоминание к событию или задаче.");if(v.offsetMinutes!==null&&e.kind==="task"&&!e.dueAt)throw new ApiError(400,"exact_deadline_required","У задачи нет точного времени дедлайна. Укажите remindAt или уточните dueAt.");}
  return v;
}
export async function createReminder(service:PlannerService,input:z.infer<typeof reminderInput>){await service.checkKind("reminder","create");const {requestId,...raw}=input;const v=await validateReminder(service,raw);return service.insertPayload(v,requestId,"reminder");}
export const reminderUpdateSchema=z.object({id:z.string().uuid(),version:z.string().min(1).max(100),changes:reminderFields.omit({kind:true}).partial()}).strict();
export async function updateReminder(service:PlannerService,v:z.infer<typeof reminderUpdateSchema>){await service.checkKind("reminder","update");const row=await service.row(v.id,"reminder");if(row.updated_at!==v.version)throw new ApiError(409,"version_conflict","Напоминание изменилось.");const value=await validateReminder(service,{...JSON.parse(row.payload),...v.changes}),payload=JSON.stringify(value);
  if(await service.mustPreview())return service.stage([{id:v.id,version:v.version,before:row.payload,after:payload,target:"reminder"}],await service.zone());
  const version=nextVersion(v.version),[r]=await service.transaction([service.db.prepare("UPDATE planner_reminders SET payload = ?,updated_at = ? WHERE owner_id = ? AND id = ? AND updated_at = ?").bind(payload,version,service.owner,v.id,v.version)]);if(!r.meta.changes)throw new ApiError(409,"version_conflict","Напоминание изменилось.");return {entry:service.toRecord({id:v.id,payload,updated_at:version},value.timeZone)};
}
export async function deleteReminder(service:PlannerService,v:{id:string,version:string}){await service.authorize("request_delete");await service.checkKind("reminder","read");const r=await service.row(v.id,"reminder");if(r.updated_at!==v.version)throw new ApiError(409,"version_conflict","Напоминание изменилось.");return service.stage([{id:r.id,version:r.updated_at,before:r.payload,after:null,target:"reminder"}],await service.zone());}
export async function listReminders(service:PlannerService,limit=50,offset=0){await service.checkKind("reminder","read");const rows=await service.db.prepare("SELECT id,payload,updated_at FROM planner_reminders WHERE owner_id = ? ORDER BY updated_at DESC LIMIT ? OFFSET ?").bind(service.owner,limit+1,offset).all<{id:string,payload:string,updated_at:string}>();const items=[];for(const r of rows.results.slice(0,limit)){const v=reminderFields.parse(JSON.parse(r.payload));if(v.entityId){try{await service.get(v.entityId);}catch{continue;}}items.push(service.toRecord(r,v.timeZone));}return {items,nextOffset:rows.results.length>limit?offset+limit:null};}
/** Delivery adapters may consume the same due envelope. Only in-app delivery is configured. */
export type ReminderDelivery={receiptId:string,reminderId:string,title:string,entityId:string|null,remindAt:string,deliveryChannel:"in_app",status:"due"};
export async function dueReminders(service:PlannerService,now=Temporal.Now.instant()){
  await service.checkKind("reminder","read");const rows=await service.db.prepare("SELECT id,payload,updated_at FROM planner_reminders WHERE owner_id = ? AND json_extract(payload,'$.status') = 'active' ORDER BY id LIMIT 1001").bind(service.owner).all<{id:string,payload:string,updated_at:string}>();if(rows.results.length>1000)throw new ApiError(422,"reminder_limit","До 1000 активных напоминаний.");const items:ReminderDelivery[]=[];
  for(const r of rows.results){const v=reminderFields.parse(JSON.parse(r.payload));if(v.deliveryChannel!=="in_app")continue;const instants:string[]=[];let linked:Awaited<ReturnType<PlannerService["row"]>>|null=null;
    if(v.entityId){try{await service.get(v.entityId);linked=await service.row(v.entityId);}catch{continue;}const e=entrySchema.parse(JSON.parse(linked.payload));if(e.kind==="task"&&e.done)continue;}
    if(v.remindAt)instants.push(v.remindAt);
    else if(linked){const e=entrySchema.parse(JSON.parse(linked.payload)),local=now.toZonedDateTimeISO(e.timeZone??v.timeZone).toPlainDate().toString();const from=repeated(e)?addDays(local,-7):e.date,to=repeated(e)?addDays(local,7):e.date;
      for(let day=from;day&&day<=to;day=addDays(day,1)){if(!occursOn(e,day))continue;const record=service.toRecord(linked,v.timeZone,day),at=record.kind==="event"?record.startsAt:record.kind==="task"?record.dueAt:null;if(at)instants.push(Temporal.Instant.from(at).subtract({minutes:v.offsetMinutes??0}).toString());}
    }
    for(const at of instants){const time=Temporal.Instant.from(at);if(time.epochMilliseconds>now.epochMilliseconds)continue;const receiptId=await hash(`${service.owner}:${r.id}:${r.updated_at}:${time.toString()}`);if(await service.db.prepare("SELECT id FROM planner_reminder_receipts WHERE id = ? AND owner_id = ?").bind(receiptId,service.owner).first())continue;items.push({receiptId,reminderId:r.id,title:v.title,entityId:v.entityId,remindAt:time.toString(),deliveryChannel:"in_app",status:"due"});}
  }
  items.sort((a,b)=>a.remindAt.localeCompare(b.remindAt));return {items:items.slice(0,100),catchupDays:7};
}
export async function acknowledgeReminder(service:PlannerService,receiptId:string){const due=await dueReminders(service);if(!due.items.some(i=>i.receiptId===receiptId))throw new ApiError(404,"not_found","Напоминание не найдено или уже отмечено.");await service.db.prepare("INSERT OR IGNORE INTO planner_reminder_receipts (id,owner_id,created_at) VALUES (?,?,?)").bind(receiptId,service.owner,new Date().toISOString()).run();return {acknowledged:true};}
