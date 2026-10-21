import { z } from "zod";
import { entrySchema, occursOn, type EntryInput, type EventEntry } from "./planner";
import { Temporal, addDays, iso, parseZoned, wallTime } from "./integration-time";
import * as s from "./integration-schemas";
import { checkPermission,permissions,requirePermission,kindPermission } from "./ai-permissions";
import { repeated } from "./recurrence";
import { reminderFields } from "./reminder-schema";

export class ApiError extends Error {
  constructor(public status:number, public code:string, message:string, public details?:unknown) { super(message); }
}
export function publicError(error:unknown) {
  if(error instanceof ApiError) return {status:error.status,body:{error:{code:error.code,message:error.message,...(error.details?{details:error.details}:{})}}};
  if(error instanceof z.ZodError) return {status:400,body:{error:{code:"invalid_parameters",message:"Проверьте параметры запроса",details:error.issues.map(i=>({path:i.path,message:i.message}))}}};
  // Never send SQL, credentials or record content in errors or logs.
  return {status:503,body:{error:{code:"unavailable",message:"Сервис временно недоступен. Повторите запрос."}}};
}
type Row={id:string,payload:string,updated_at:string};
export type Change={id:string,version:string|null,before:string|null,after:string|null,target?:"entry"|"reminder"};
type ActionRow={id:string,payload:string,status:string,expires_at:string};
export type ApiRecord=z.infer<typeof s.recordResponse>;
const noEntry=()=>new ApiError(404,"not_found","Запись не найдена");
export const nextVersion=(previous?:string)=>new Date(Math.max(Date.now(),(previous?Date.parse(previous):0)+1)).toISOString();
const conflict=()=>new ApiError(409,"version_conflict","Запись изменилась. Прочитайте её заново перед изменением.");
export async function hash(value:string) { return Array.from(new Uint8Array(await crypto.subtle.digest("SHA-256",new TextEncoder().encode(value)))).map(x=>x.toString(16).padStart(2,"0")).join(""); }

/** Every method is bound to the validated Sites identity, never a caller-supplied owner. */
export class PlannerService {
  constructor(readonly db:D1Database, readonly owner:string, readonly origin:string,readonly options:{actor?:"user"|"ai"|"mcp"|"system",source?:"web"|"mobile"|"internal_ai"|"chatgpt_mcp"|"import",previewOnly?:boolean}={}) {
    if(!owner) throw new ApiError(401,"unauthorized","Войдите в аккаунт");
  }
  get isAI(){return this.options.actor==="ai"||this.options.actor==="mcp";}
  async authorize(name:string){if(this.isAI)await checkPermission(this.db,this.owner,name);}
  async checkKind(kind:string,action:"read"|"create"|"update"){if(this.isAI){const p=await permissions(this.db,this.owner);requirePermission(p,kindPermission(kind,"read"));requirePermission(p,kindPermission(kind,action));}}
  async mustPreview(){return !!this.options.previewOnly||(this.isAI&&(await permissions(this.db,this.owner)).confirmAll);}
  async transaction(statements:D1PreparedStatement[],group=crypto.randomUUID(),source=this.options.source??"web"){
    const result=await this.db.batch([this.db.prepare("INSERT INTO planner_mutation_context (owner_id,group_id,actor,source) VALUES (?,?,?,?)").bind(this.owner,group,this.options.actor??"user",source),...statements,this.db.prepare("DELETE FROM planner_mutation_context WHERE owner_id = ?").bind(this.owner)]);return result.slice(1,-1);
  }
  async context() {
    const row=await this.db.prepare("SELECT time_zone FROM planner_preferences WHERE owner_id = ?").bind(this.owner).first<{time_zone:string}>();
    const now=Temporal.Now.instant();const timeZone=row?.time_zone??null;
    const local=timeZone?now.toZonedDateTimeISO(timeZone):null;
    return {timeZone,timeZoneRequired:!timeZone,now:now.toString(),today:local?.toPlainDate().toString()??null,localNow:local?iso(local):null};
  }
  async zone() { const c=await this.context(); if(!c.timeZone) throw new ApiError(409,"time_zone_required","Откройте настройки планировщика и сохраните свой часовой пояс."); return c.timeZone; }
  async setZone(timeZone:string,initializeOnly=false) {
    const conflict=initializeOnly?"DO NOTHING":"DO UPDATE SET time_zone = excluded.time_zone";
    await this.db.prepare(`INSERT INTO planner_preferences (owner_id, time_zone) VALUES (?, ?) ON CONFLICT(owner_id) ${conflict}`).bind(this.owner,timeZone).run();
    return this.context();
  }
  async row(id:string,target:"entry"|"reminder"="entry") {
    const row=await this.db.prepare(`SELECT id, payload, updated_at FROM ${target==="entry"?"planner_entries":"planner_reminders"} WHERE id = ? AND owner_id = ?`).bind(id,this.owner).first<Row>();
    if(!row) throw noEntry(); return row;
  }
  async rows(kind?:string) {
    const result=await this.db.prepare("SELECT id, payload, updated_at FROM planner_entries WHERE owner_id = ? AND (? IS NULL OR json_extract(payload, '$.kind') = ?) ORDER BY id LIMIT 5001").bind(this.owner,kind??null,kind??null).all<Row>();
    if(result.results.length>5000) throw new ApiError(422,"too_many_records","Сузьте тип записей. Превышен лимит 5000 записей на запрос.");
    return result.results;
  }
  toRecord(row:Row,defaultZone:string,date?:string):ApiRecord {
    const raw=JSON.parse(row.payload);if(raw.kind==="reminder")return {...reminderFields.parse(raw),kind:"reminder",id:row.id,version:row.updated_at};
    const e=entrySchema.parse(raw); const timeZone=e.timeZone??defaultZone;
    const base={id:row.id,version:row.updated_at,title:e.title,description:e.note,category:e.category,timeZone,reminderMinutes:e.reminderMinutes??null,tags:e.tags??[]};
    if(e.kind==="note") return {...base,kind:"note",date:e.date||null};
    if(e.kind==="task") {const dueAt=date&&e.dueAt?iso(wallTime(date,parseZoned(e.dueAt,timeZone).toPlainTime().toString({smallestUnit:"minute"}),timeZone)):e.dueAt??null;return {...base,kind:"task",dueDate:dueAt?null:date??(e.date||null),dueAt,priority:e.priority,completed:e.done,recurrence:{frequency:e.repeat??"none",until:e.until||null,rrule:e.rrule??null,excludedDates:e.excludedDates??[]},...(date?{occurrenceDate:date,seriesId:row.id}:{})};}
    const day=date??e.date;
    let start=day===e.date&&e.startsAt?parseZoned(e.startsAt,timeZone):wallTime(day,e.start,timeZone);
    const shift=Temporal.PlainDateTime.from(`${day}T${e.start}`).until(start.toPlainDateTime()).total("minutes");
    let end=day===e.date&&e.endsAt?parseZoned(e.endsAt,timeZone):Temporal.PlainDateTime.from(`${day}T${e.end}`).add({minutes:shift}).toZonedDateTime(timeZone,{disambiguation:"compatible"});
    if(end.epochMilliseconds<=start.epochMilliseconds) throw new ApiError(422,"invalid_event_time","Проверьте время существующего события в планировщике.");
    return {...base,kind:"event",startsAt:iso(start),endsAt:iso(end),location:e.location,recurrence:{frequency:e.repeat,until:e.until||null,rrule:e.rrule??null,excludedDates:e.excludedDates??[]},...(date?{occurrenceDate:date,seriesId:row.id}:{})};
  }
  toInput(kind:"event"|"task"|"note",raw:unknown):EntryInput {
    try {
      if(kind==="note") {const v=s.noteFields.parse(raw);return entrySchema.parse({kind,title:v.title,note:v.description,category:v.category,date:v.date??"",timeZone:v.timeZone,tags:v.tags});}
      if(kind==="event") {
        const v=s.eventFields.parse(raw);const a=parseZoned(v.startsAt,v.timeZone),b=parseZoned(v.endsAt,v.timeZone);
        if(a.second||a.millisecond||a.microsecond||a.nanosecond||b.second||b.millisecond||b.microsecond||b.nanosecond) throw new ApiError(400,"minute_precision","Планировщик поддерживает точность до минуты.");
        if(a.toPlainDate().toString()!==b.toPlainDate().toString()) throw new ApiError(400,"same_day_required","Начало и конец должны быть в один местный день.");
        if(b.epochMilliseconds<=a.epochMilliseconds) throw new ApiError(400,"invalid_interval","Окончание должно быть позже начала.");
        return entrySchema.parse({kind,tags:v.tags,rrule:v.recurrence.rrule,excludedDates:v.recurrence.excludedDates,reminderMinutes:v.reminderMinutes,title:v.title,note:v.description,category:v.category,date:a.toPlainDate().toString(),start:a.toPlainTime().toString({smallestUnit:"minute"}),end:b.toPlainTime().toString({smallestUnit:"minute"}),location:v.location,repeat:v.recurrence.frequency,until:v.recurrence.until??"",timeZone:v.timeZone,startsAt:iso(a),endsAt:iso(b)});
      }
      const v=s.taskFields.parse(raw);
      if(v.dueAt&&v.dueDate) throw new ApiError(400,"ambiguous_deadline","Укажите dueDate или dueAt, не оба поля.");
      if((v.recurrence.rrule||v.recurrence.frequency!=="none")&&!v.dueAt&&!v.dueDate)throw new ApiError(400,"recurrence_date_required","Для повторения задачи нужна начальная дата.");
      const due=v.dueAt?parseZoned(v.dueAt,v.timeZone):null;
      if(due&&(due.second||due.millisecond||due.microsecond||due.nanosecond)) throw new ApiError(400,"minute_precision","Дедлайн поддерживает точность до минуты.");
      return entrySchema.parse({kind,tags:v.tags,rrule:v.recurrence.rrule,repeat:v.recurrence.frequency,until:v.recurrence.until??"",excludedDates:v.recurrence.excludedDates,reminderMinutes:v.reminderMinutes,title:v.title,note:v.description,category:v.category,date:due?.toPlainDate().toString()??v.dueDate??"",priority:v.priority,done:v.completed,timeZone:v.timeZone,dueAt:due?iso(due):null});
    } catch(error) {
      if(error instanceof RangeError) throw new ApiError(400,"invalid_time_zone_offset","Дата, UTC-смещение или местное время не соответствуют часовому поясу. Уточните время при переходе на летнее/зимнее время.");
      throw error;
    }
  }
  async get(id:string) { const row=await this.row(id);await this.checkKind(JSON.parse(row.payload).kind,"read");return {entry:this.toRecord(row,await this.zone())}; }
  async create(kind:"event"|"task"|"note",raw:z.infer<typeof s.createEventSchema>|z.infer<typeof s.createTaskSchema>|z.infer<typeof s.createNoteSchema>) {
    await this.checkKind(kind,"create");const {requestId,...fields}=raw;return this.insertPayload(this.toInput(kind,fields),requestId);
  }
  async insertPayload(input:Record<string,unknown>,requestId:string,target:"entry"|"reminder"="entry") {
    const payload=JSON.stringify(input),requestHash=await hash(`${input.kind}:${payload}`),key=await hash(`${this.owner}:${requestId}`),id=crypto.randomUUID(),version=nextVersion();
    const previous=await this.db.prepare("SELECT request_hash,entry_id,confirmation_id FROM planner_request_keys WHERE id = ? AND owner_id = ?").bind(key,this.owner).first<{request_hash:string,entry_id:string,confirmation_id:string|null}>();
    if(previous){if(previous.request_hash!==requestHash)throw new ApiError(409,"idempotency_conflict","requestId уже использован с другими данными.");if(previous.confirmation_id)return this.action(previous.confirmation_id);const row=await this.row(previous.entry_id,target).catch(()=>{throw new ApiError(409,"request_already_used","Запись уже создавалась и была удалена.");});return {entry:this.toRecord(row,String(input.timeZone))};}
    if(await this.mustPreview())return this.stage([{id,version:null,before:null,after:payload,target}],String(input.timeZone),{reservation:{key,requestHash,entryId:id}});
    await this.transaction([
      this.db.prepare("INSERT OR IGNORE INTO planner_request_keys (id,owner_id,request_hash,entry_id) VALUES (?,?,?,?)").bind(key,this.owner,requestHash,id),
      this.db.prepare(`INSERT INTO ${target==="entry"?"planner_entries":"planner_reminders"} (id,owner_id,payload,updated_at) SELECT ?,?,?,? WHERE EXISTS (SELECT 1 FROM planner_request_keys WHERE id = ? AND owner_id = ? AND entry_id = ?)`).bind(id,this.owner,payload,version,key,this.owner,id),
    ]);
    const saved=await this.db.prepare("SELECT request_hash,entry_id,confirmation_id FROM planner_request_keys WHERE id = ? AND owner_id = ?").bind(key,this.owner).first<{request_hash:string,entry_id:string,confirmation_id:string|null}>();
    if(saved?.request_hash!==requestHash)throw new ApiError(409,"idempotency_conflict","requestId уже использован с другими данными.");if(saved.confirmation_id)return this.action(saved.confirmation_id);return {entry:this.toRecord(await this.row(saved.entry_id,target),String(input.timeZone))};
  }
  updated(row:Row,kind:"event"|"task"|"note",changes:unknown,zone:string) {
    const before=this.toRecord(row,zone);
    if(before.kind!==kind) throw noEntry();
    const patch=(kind==="event"?s.eventPatch:kind==="note"?s.notePatch:s.taskPatch).parse(changes);
    if(!Object.keys(patch).length) throw new ApiError(400,"empty_patch","Укажите изменяемые поля.");
    const {id:_,version:__,kind:___,...fields}=before;
    return JSON.stringify(entrySchema.parse({...JSON.parse(row.payload),...this.toInput(kind,{...fields,...patch})}));
  }
  async update(v:z.infer<typeof s.updateSchema>) {
    const row=await this.row(v.id);await this.checkKind(v.kind,"update"); if(row.updated_at!==v.version) throw conflict();
    const zone=await this.zone();const payload=this.updated(row,v.kind,v.changes,zone);
    const before=entrySchema.parse(JSON.parse(row.payload)),after=entrySchema.parse(JSON.parse(payload));
    if(await this.mustPreview()||(before.kind!=="note"&&repeated(before))||(after.kind!=="note"&&repeated(after))) return this.stage([{id:row.id,version:row.updated_at,before:row.payload,after:payload}],zone);
    const version=nextVersion(row.updated_at);const [result]=await this.transaction([this.db.prepare("UPDATE planner_entries SET payload = ?, updated_at = ? WHERE id = ? AND owner_id = ? AND updated_at = ?").bind(payload,version,v.id,this.owner,v.version)]);
    if(!result.meta.changes) throw conflict();return {entry:this.toRecord({id:v.id,payload,updated_at:version},zone)};
  }
  async completion(v:{id:string,version:string,completed:boolean}) { const row=await this.row(v.id);if(repeated(JSON.parse(row.payload)))throw new ApiError(400,"occurrence_required","Для повторяющейся задачи укажите occurrenceDate и scope через update_occurrence.");return this.update({id:v.id,version:v.version,kind:"task",changes:{completed:v.completed}}); }
  private paginate(items:ApiRecord[],limit:number,offset:number) { return {items:items.slice(offset,offset+limit),total:items.length,nextOffset:offset+limit<items.length?offset+limit:null}; }
  async listEvents(v:z.infer<typeof s.eventListSchema>) {
    await this.checkKind("event","read");
    const from=Temporal.Instant.from(v.from),to=Temporal.Instant.from(v.to);
    if(to.epochMilliseconds<=from.epochMilliseconds||to.epochMilliseconds-from.epochMilliseconds>366*86400000) throw new ApiError(400,"invalid_period","Период должен быть от 1 миллисекунды до 366 дней; конец не включается.");
    const zone=await this.zone();const rows=await this.rows("event"); const result:ApiRecord[]=[];
    for(const row of rows) {
      const e={...entrySchema.parse(JSON.parse(row.payload)),id:row.id} as EventEntry;
      const tz=e.timeZone??zone;const last=to.toZonedDateTimeISO(tz).toPlainDate().toString();
      let date=from.toZonedDateTimeISO(tz).toPlainDate().toString();
      for(;date<=last;date=addDays(date,1)) if(occursOn(e,date)) {
        const event=this.toRecord(row,zone,date);if(event.kind!=="event") continue;
        if(Temporal.Instant.from(event.startsAt).epochMilliseconds<to.epochMilliseconds&&Temporal.Instant.from(event.endsAt).epochMilliseconds>from.epochMilliseconds) result.push(event);
        if(result.length>10000) throw new ApiError(422,"too_many_occurrences","Сократите период расписания.");
      }
    }
    result.sort((a,b)=>a.kind==="event"&&b.kind==="event"?Date.parse(a.startsAt)-Date.parse(b.startsAt)||a.id.localeCompare(b.id):0);
    return this.paginate(result,v.limit,v.offset);
  }
  async search(v:z.infer<typeof s.filters>,tasksOnly=false) {
    if(v.fromDate&&v.toDate&&v.toDate<v.fromDate) throw new ApiError(400,"invalid_period","toDate должна быть не раньше fromDate.");
    const rights=this.isAI?await permissions(this.db,this.owner):null;
    const zone=await this.zone();const rows=await this.rows(tasksOnly?"task":v.kind);const items:ApiRecord[]=[];
    for(const row of rows) {
      const e=entrySchema.parse(JSON.parse(row.payload));
      if(rights&&!rights[kindPermission(e.kind,"read")])continue;
      if(v.category&&e.category!==v.category)continue;
      if(v.completed!==undefined&&(e.kind!=="task"||e.done!==v.completed))continue;
      if(v.query&&![e.title,e.note,...(e.tags??[]),...(e.kind==="event"?[e.location]:[])].join(" ").toLocaleLowerCase("ru").includes(v.query.toLocaleLowerCase("ru")))continue;
      if(v.fromDate||v.toDate) {
        if(e.kind!=="event"&&!(e.kind==="task"&&repeated(e))) {if(!e.date||(v.fromDate&&e.date<v.fromDate)||(v.toDate&&e.date>v.toDate))continue;}
        else {
          const first=v.fromDate&&v.fromDate>e.date?v.fromDate:e.date;const last=v.toDate??"2100-12-31";
          if(first>last||(e.until&&first>e.until))continue;
          if(!repeated(e)) {if(e.date<first||e.date>last)continue;}
          else {let found=false;for(let d=0;d<Math.min(366,Temporal.PlainDate.from(first).until(Temporal.PlainDate.from(last)).days+1);d++){const day=addDays(first,d);if(day<=last&&occursOn(e,day)){found=true;break;}}if(!found)continue;}
        }
      }
      if(tasksOnly&&e.kind==="task"&&repeated(e)&&v.fromDate&&v.toDate){
        if(Temporal.PlainDate.from(v.fromDate).until(Temporal.PlainDate.from(v.toDate)).days>366)throw new ApiError(400,"invalid_period","Для повторений задач выберите до 366 дней.");
        for(let day=v.fromDate;day<=v.toDate;day=addDays(day,1))if(occursOn(e,day))items.push(this.toRecord(row,zone,day));
      }else items.push(this.toRecord(row,zone));
    }
    items.sort((a,b)=>a.title.localeCompare(b.title,"ru")||a.id.localeCompare(b.id));
    return this.paginate(items,v.limit,v.offset);
  }
  async requestDelete(v:{id:string,version:string}) { await this.authorize("request_delete");const row=await this.row(v.id);await this.checkKind(JSON.parse(row.payload).kind,"read");if(row.updated_at!==v.version)throw conflict();const changes:Change[]=[{id:row.id,version:row.updated_at,before:row.payload,after:null}];const linked=await this.db.prepare("SELECT id,payload,updated_at FROM planner_reminders WHERE owner_id = ? AND json_extract(payload, '$.entityId') = ?").bind(this.owner,v.id).all<Row>();if(linked.results.length)await this.checkKind("reminder","read");for(const r of linked.results)changes.push({id:r.id,version:r.updated_at,before:r.payload,after:null,target:"reminder"});return this.stage(changes,await this.zone()); }
  async requestBulk(updates:z.infer<typeof s.updateSchema>[]) {
    if(new Set(updates.map(u=>u.id)).size!==updates.length)throw new ApiError(400,"duplicate_id","Одна запись может быть указана только один раз.");
    const zone=await this.zone();const changes:Change[]=[];
    for(const v of updates){await this.checkKind(v.kind,"update");const row=await this.row(v.id);if(row.updated_at!==v.version)throw conflict();changes.push({id:row.id,version:row.updated_at,before:row.payload,after:this.updated(row,v.kind,v.changes,zone)});}
    return this.stage(changes,zone);
  }
  async stage(changes:Change[],zone:string,extra:{undoGroup?:string,source?:"import",reservation?:{key:string,requestHash:string,entryId:string},warnings?:string[]}={}) {
    if(!changes.length||changes.length>20||new Set(changes.map(c=>`${c.target??"entry"}:${c.id}`)).size!==changes.length)throw new ApiError(400,"invalid_action_group","Один пакет должен содержать 1–20 разных записей.");
    const id=crypto.randomUUID(),now=new Date().toISOString(),expires=new Date(Date.now()+15*60000).toISOString();
    const payload=JSON.stringify({changes,zone,warnings:extra.warnings??[],undoGroup:extra.undoGroup??null,actor:this.options.actor??"user",source:extra.source??this.options.source??"web"});
    if(extra.reservation){const r=extra.reservation;await this.db.batch([
      this.db.prepare("INSERT OR IGNORE INTO planner_request_keys (id,owner_id,request_hash,entry_id,confirmation_id) VALUES (?,?,?,?,?)").bind(r.key,this.owner,r.requestHash,r.entryId,id),
      this.db.prepare("INSERT INTO planner_confirmations (id,owner_id,payload,status,expires_at,created_at) SELECT ?,?,?,'pending',?,? WHERE EXISTS (SELECT 1 FROM planner_request_keys WHERE id = ? AND owner_id = ? AND confirmation_id = ?)").bind(id,this.owner,payload,expires,now,r.key,this.owner,id),
    ]);const saved=await this.db.prepare("SELECT request_hash,confirmation_id FROM planner_request_keys WHERE id = ? AND owner_id = ?").bind(r.key,this.owner).first<{request_hash:string,confirmation_id:string}>();if(saved?.request_hash!==r.requestHash)throw new ApiError(409,"idempotency_conflict","requestId уже использован.");return this.action(saved.confirmation_id);}
    await this.db.prepare("INSERT INTO planner_confirmations (id,owner_id,payload,status,expires_at,created_at) VALUES (?,?,?,'pending',?,?)").bind(id,this.owner,payload,expires,now).run();return this.action(id);
  }
  async actionRow(id:string) {
    const row=await this.db.prepare("SELECT id,payload,status,expires_at FROM planner_confirmations WHERE id = ? AND owner_id = ?").bind(id,this.owner).first<ActionRow>();if(!row)throw noEntry();return row;
  }
  async action(id:string) {
    const row=await this.actionRow(id);const {changes,zone,warnings=[]}=JSON.parse(row.payload) as {changes:Change[],zone:string,warnings?:string[]};
    for(const c of changes)await this.checkKind(JSON.parse(c.before??c.after!).kind,"read");
    const status=["pending","approved"].includes(row.status)&&row.expires_at<=new Date().toISOString()?"expired":row.status;
    return {warnings,confirmationId:id,status,confirmationUrl:`${this.origin}/confirm/${id}`,expiresAt:row.expires_at,executed:status==="executed",summary:changes.map(c=>({id:c.id,title:JSON.parse(c.before??c.after!).title as string,operation:c.before===null?"create" as const:c.after===null?"delete" as const:"update" as const,before:c.before?this.toRecord({id:c.id,payload:c.before,updated_at:c.version!},zone):null,after:c.after?this.toRecord({id:c.id,payload:c.after,updated_at:c.version??"preview"},zone):null}))};
  }
  async decide(id:string,approved:boolean) {
    const row=await this.actionRow(id);if(row.status!=="pending"||row.expires_at<=new Date().toISOString())throw new ApiError(409,"confirmation_unavailable","Подтверждение истекло или уже обработано.");
    await this.db.prepare("UPDATE planner_confirmations SET status = ? WHERE id = ? AND owner_id = ? AND status = 'pending' AND expires_at > ?").bind(approved?"approved":"rejected",id,this.owner,new Date().toISOString()).run();return approved?this.commit(id):this.action(id);
  }
  async commit(id:string) {
    const row=await this.actionRow(id);if(row.status==="executed")return this.action(id);if(row.status!=="approved")throw new ApiError(403,"confirmation_required","Пользователь должен подтвердить действие по confirmationUrl.");if(row.expires_at<=new Date().toISOString())throw new ApiError(409,"confirmation_expired","Запросите новое подтверждение.");
    const data=JSON.parse(row.payload) as {changes:Change[],undoGroup?:string,actor?:"user"|"ai"|"mcp"|"system",source?:"web"|"mobile"|"internal_ai"|"chatgpt_mcp"|"import"};const {changes}=data;
    if(data.actor==="ai"||data.actor==="mcp"){const p=await permissions(this.db,this.owner);if(data.undoGroup)requirePermission(p,"undo");if(data.source==="import")requirePermission(p,"bulkImport");for(const c of changes){const kind=JSON.parse(c.before??c.after!).kind;requirePermission(p,kindPermission(kind,"read"));requirePermission(p,c.after===null?"delete":kindPermission(kind,c.before===null?"create":"update"));}}
    const now=new Date().toISOString(),execution=crypto.randomUUID();
    const table=(c:Change)=>c.target==="reminder"?"planner_reminders":"planner_entries";
    const checks=changes.map(c=>c.before===null?`NOT EXISTS (SELECT 1 FROM ${table(c)} WHERE id = ?)`:`EXISTS (SELECT 1 FROM ${table(c)} WHERE id = ? AND owner_id = ? AND updated_at = ?)`).join(" AND ");
    const statements=[this.db.prepare(`UPDATE planner_confirmations SET status = ? WHERE id = ? AND owner_id = ? AND status = 'approved' AND expires_at > ? AND ${checks}${data.undoGroup?" AND NOT EXISTS (SELECT 1 FROM planner_history WHERE owner_id = ? AND group_id = ? AND undone_by IS NOT NULL)":""}`).bind(execution,id,this.owner,now,...changes.flatMap(c=>c.before===null?[c.id]:[c.id,this.owner,c.version]),...(data.undoGroup?[this.owner,data.undoGroup]:[]))];
    for(const c of changes){const guard="EXISTS (SELECT 1 FROM planner_confirmations WHERE id = ? AND owner_id = ? AND status = ?)";const version=nextVersion(c.version??undefined);
      statements.push(c.before===null?this.db.prepare(`INSERT INTO ${table(c)} (id,owner_id,payload,updated_at) SELECT ?,?,?,? WHERE ${guard}`).bind(c.id,this.owner,c.after,version,id,this.owner,execution):c.after===null?this.db.prepare(`DELETE FROM ${table(c)} WHERE id = ? AND owner_id = ? AND updated_at = ? AND ${guard}`).bind(c.id,this.owner,c.version,id,this.owner,execution):this.db.prepare(`UPDATE ${table(c)} SET payload = ?,updated_at = ? WHERE id = ? AND owner_id = ? AND updated_at = ? AND ${guard}`).bind(c.after,version,c.id,this.owner,c.version,id,this.owner,execution));
    }
    if(data.undoGroup){statements.push(this.db.prepare("UPDATE planner_history SET action_type = 'restore' WHERE owner_id = ? AND group_id = ?").bind(this.owner,id));statements.push(this.db.prepare("UPDATE planner_history SET undone_by = ? WHERE owner_id = ? AND group_id = ? AND EXISTS (SELECT 1 FROM planner_confirmations WHERE id = ? AND owner_id = ? AND status = ?)").bind(id,this.owner,data.undoGroup,id,this.owner,execution));}
    statements.push(this.db.prepare("UPDATE planner_confirmations SET status = 'executed' WHERE id = ? AND owner_id = ? AND status = ?").bind(id,this.owner,execution));
    const actorService=new PlannerService(this.db,this.owner,this.origin,{actor:data.actor??this.options.actor,source:data.source??this.options.source});const result=await actorService.transaction(statements,id,data.source??this.options.source??"web");
    if(!result[0].meta.changes){if((await this.actionRow(id)).status==="executed")return this.action(id);throw conflict();}return this.action(id);
  }
}
