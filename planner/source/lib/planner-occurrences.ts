import { z } from "zod";
import { PlannerService,ApiError,type Change } from "./planner-service";
import { entrySchema,occursOn } from "./planner";
import { repeated,splitRule } from "./recurrence";
import { dateSchema,addDays } from "./integration-time";
import { eventPatch,taskPatch } from "./integration-schemas";
export const occurrenceUpdateSchema=z.object({id:z.string().uuid(),version:z.string(),occurrenceDate:dateSchema,scope:z.enum(["occurrence","following","series"]),changes:z.union([eventPatch,taskPatch])}).strict();
export async function updateOccurrence(service:PlannerService,input:z.infer<typeof occurrenceUpdateSchema>){
  const row=await service.row(input.id),e=entrySchema.parse(JSON.parse(row.payload));if(e.kind==="note"||!repeated(e)||!occursOn(e,input.occurrenceDate))throw new ApiError(400,"invalid_occurrence","Повторение не найдено.");await service.checkKind(e.kind,"update");if(row.updated_at!==input.version)throw new ApiError(409,"version_conflict","Запись изменилась.");
  if(input.scope==="series")return service.update({id:input.id,version:input.version,kind:e.kind,changes:input.changes});
  await service.checkKind(e.kind,"create");const zone=await service.zone(),record=service.toRecord(row,zone,input.occurrenceDate);if(record.kind!=="event"&&record.kind!=="task")throw new ApiError(400,"invalid_kind","Неверный тип серии.");
  const {id:_,version:__,kind:___,occurrenceDate:____,seriesId:_____,...fields}=record;
  let original={...e},copy:any={...fields,...input.changes};
  if(input.scope==="occurrence"){original={...e,excludedDates:[...new Set([...(e.excludedDates??[]),input.occurrenceDate])]};copy.recurrence={frequency:"none",until:null,rrule:null,excludedDates:[]};}
  else{if(input.occurrenceDate===e.date)return service.update({id:input.id,version:input.version,kind:e.kind,changes:input.changes});original={...e,until:addDays(input.occurrenceDate,-1)};copy.recurrence={...record.recurrence,excludedDates:(e.excludedDates??[]).filter(d=>d>=input.occurrenceDate)};if(e.rrule){const split=splitRule(e.rrule,input.occurrenceDate,e.date);original.rrule=split.before;copy.recurrence.rrule=split.after;}}
  const detached=entrySchema.parse({...service.toInput(e.kind,copy),seriesParentId:input.id});const changes:Change[]=[{id:row.id,version:row.updated_at,before:row.payload,after:JSON.stringify(entrySchema.parse(original))},{id:crypto.randomUUID(),version:null,before:null,after:JSON.stringify(detached)}];
  return service.stage(changes,zone);
}
