import { z } from "zod";
import { parseRule,ruleOccurs } from "./recurrence";

export const categories = {
  study: { label: "Учёба", color: "blue" },
  personal: { label: "Личное", color: "violet" },
  work: { label: "Работа", color: "amber" },
} as const;
export function dateKey(date: Date = new Date()): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}
export function fromDate(key: string): Date { return new Date(`${key}T12:00:00`); }
export function shiftDate(key: string, delta: number): string {
  const date = fromDate(key); date.setDate(date.getDate() + delta); return dateKey(date);
}
export function dayDistance(a: string, b: string): number {
  const utc = (s: string) => { const [y,m,d]=s.split("-").map(Number); return Date.UTC(y,m-1,d); };
  return Math.round((utc(b)-utc(a))/86400000);
}
export function weekDays(key: string): string[] {
  const date = fromDate(key); const monday = shiftDate(key, -((date.getDay() + 6) % 7));
  return Array.from({length: 7}, (_, i) => shiftDate(monday, i));
}
const validDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/).refine(v => {
  const d = fromDate(v); return !Number.isNaN(d.getTime()) && dateKey(d) === v && v >= "2000-01-01" && v <= "2100-12-31";
}, "Проверьте дату");
const time = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/);
const base = {
  rrule:z.string().max(250).refine(v=>{try{parseRule(v);return true;}catch{return false;}},"Поддерживаются DAILY/WEEKLY RRULE").nullable().optional(),
  excludedDates:z.array(validDate).max(500).optional(),seriesParentId:z.string().uuid().optional(),
  tags:z.array(z.string().trim().min(1).max(60)).max(12).optional(),
  reminderMinutes:z.number().int().min(0).max(10080).nullable().optional(),
  title: z.string().trim().min(1, "Введите название").max(180, "Название слишком длинное"),
  category: z.enum(["study", "personal", "work"]),
  note: z.string().max(5000).default(""),
  timeZone: z.string().max(80).refine(v => { try { new Intl.DateTimeFormat("en", {timeZone:v}); return true; } catch { return false; } }, "Неизвестный часовой пояс").optional(),
};
const rawSchema = z.discriminatedUnion("kind", [
  z.object({...base,kind:z.literal("note"),date:z.union([validDate,z.literal("")])}),
  z.object({ ...base, kind: z.literal("task"), repeat:z.enum(["none","weekly","biweekly"]).optional(),until:z.union([validDate,z.literal("")]).optional(), date: z.union([validDate,z.literal("")]), priority: z.enum(["normal","high"]), done: z.boolean(), dueAt: z.string().datetime({offset:true}).nullable().optional() }),
  z.object({ ...base, kind: z.literal("event"), date: validDate, start: time, end: time, location: z.string().max(250), repeat: z.enum(["none","weekly","biweekly"]), until: z.union([validDate,z.literal("")]), startsAt:z.string().datetime({offset:true}).optional(), endsAt:z.string().datetime({offset:true}).optional() }),
]);
export const entrySchema = rawSchema.superRefine((entry, ctx) => {
  if (entry.kind === "event") {
    if (entry.end <= entry.start) ctx.addIssue({code:"custom",path:["end"],message:"Время окончания должно быть позже начала"});
    if (entry.until && entry.until < entry.date) ctx.addIssue({code:"custom",path:["until"],message:"Повторение не может закончиться раньше начала"});
  }
});
export type EntryInput = z.infer<typeof entrySchema>;
export type Entry = EntryInput & { id: string, version?: string };
export type EventEntry = Extract<Entry,{kind:"event"}>;
export type TaskEntry = Extract<Entry,{kind:"task"}>;
export function occursOn(event: Pick<EventEntry,"date"> & {until?:string,repeat?:string,rrule?:string|null,excludedDates?:string[]}, key: string): boolean {
  if(event.excludedDates?.includes(key))return false;
  if(event.rrule)return key>=event.date&&(!event.until||key<=event.until)&&ruleOccurs(parseRule(event.rrule),event.date,key);
  if (key < event.date || (event.until && key > event.until)) return false;
  const days = dayDistance(event.date,key);
  return !event.repeat || event.repeat === "none" ? days === 0 : days % (event.repeat === "weekly" ? 7 : 14) === 0;
}
export function prettyDate(key: string, options: Intl.DateTimeFormatOptions = {day:"numeric",month:"long"}): string {
  return fromDate(key).toLocaleDateString("ru-RU", options);
}
export function newEntry(kind: "task" | "event", date: string): EventEntry | TaskEntry {
  const shared = { id:"", title:"", category: "personal" as const, note:"", date };
  return kind === "event" ? {...shared,kind,start:"09:00",end:"10:00",location:"",repeat:"none",until:""} : {...shared,kind,priority:"normal",done:false};
}
