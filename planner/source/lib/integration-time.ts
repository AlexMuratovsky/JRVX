import { Temporal } from "@js-temporal/polyfill";
import { z } from "zod";

export const dateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/).refine(v => {
  try { return Temporal.PlainDate.from(v).toString() === v && v >= "2000-01-01" && v <= "2100-12-31"; } catch { return false; }
}, "Expected a valid date between 2000 and 2100");
export const zoneSchema = z.string().min(1).max(80).refine(v => {
  try { return !/^[+-]/.test(v) && Boolean(Temporal.Now.zonedDateTimeISO(v)); } catch { return false; }
}, "Use an IANA time zone, for example Europe/Moscow");
export const instantSchema = z.string().datetime({offset:true}).refine(v => {
  try { Temporal.Instant.from(v); return true; } catch { return false; }
}, "Expected ISO 8601 with an explicit UTC offset");

/** Keep the entered wall time and reject offsets inconsistent with the IANA zone. */
export function parseZoned(value: string, timeZone: string) {
  // Z is an actual UTC offset here, not Temporal's special exact-time shortcut.
  const withOffset = value.endsWith("Z") ? value.slice(0,-1)+"+00:00" : value;
  return Temporal.ZonedDateTime.from(`${withOffset}[${timeZone}]`, {offset:"reject",disambiguation:"reject"});
}
export function wallTime(date: string, time: string, timeZone: string) {
  // Recurrences keep wall time. DST gap shifts forward; a fold uses its earlier instant.
  return Temporal.PlainDateTime.from(`${date}T${time}:00`).toZonedDateTime(timeZone, {disambiguation:"compatible"});
}
export function iso(value: Temporal.ZonedDateTime) { return value.toString({timeZoneName:"never", smallestUnit:"second"}); }
export function addDays(date: string, days: number) { return Temporal.PlainDate.from(date).add({days}).toString(); }
export { Temporal };
