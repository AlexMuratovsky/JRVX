import { entrySchema, type EntryInput } from "./planner";
import { Temporal, iso, parseZoned } from "./integration-time";
import { ApiError } from "./planner-service";

/** Preserve the existing editor's wall-time model and optional API metadata. */
export function normalizeLegacy(input:EntryInput,previous:EntryInput|null):EntryInput {
  const zone=input.timeZone??previous?.timeZone;
  if(!zone)return input; // Existing floating records remain backward compatible.
  if(input.kind==="note")return {...input,timeZone:zone};
  try {
    if(input.kind==="event") {
      const old=previous?.kind==="event"?previous:null;
      const changed=old&&(old.date!==input.date||old.start!==input.start||old.end!==input.end||old.timeZone!==zone);
      const a=!changed&&input.startsAt?parseZoned(input.startsAt,zone):Temporal.PlainDateTime.from(`${input.date}T${input.start}`).toZonedDateTime(zone,{disambiguation:"reject"});
      const b=!changed&&input.endsAt?parseZoned(input.endsAt,zone):Temporal.PlainDateTime.from(`${input.date}T${input.end}`).toZonedDateTime(zone,{disambiguation:"reject"});
      if(a.toPlainDate().toString()!==input.date||b.toPlainDate().toString()!==input.date||a.toPlainTime().toString({smallestUnit:"minute"})!==input.start||b.toPlainTime().toString({smallestUnit:"minute"})!==input.end||b.epochMilliseconds<=a.epochMilliseconds)throw new Error("inconsistent time");
      return entrySchema.parse({...input,timeZone:zone,startsAt:iso(a),endsAt:iso(b)});
    }
    let dueAt=input.dueAt??null;
    if(dueAt) {
      const due=parseZoned(dueAt,zone);
      if(!input.date)dueAt=null;
      else if(due.toPlainDate().toString()!==input.date) {
        if(previous?.kind!=="task"||previous.dueAt!==dueAt||previous.date===input.date)throw new Error("inconsistent deadline");
        dueAt=iso(Temporal.PlainDateTime.from(`${input.date}T${due.toPlainTime()}`).toZonedDateTime(zone,{disambiguation:"reject"}));
      }
    }
    return entrySchema.parse({...input,timeZone:zone,dueAt});
  }catch{throw new ApiError(400,"invalid_time","Проверьте время и часовой пояс. При переходе на летнее/зимнее время уточните время через ChatGPT.");}
}
