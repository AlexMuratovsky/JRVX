import { Temporal,iso,wallTime,addDays } from "./integration-time";
import { occursOn,type EventEntry } from "./planner";
/** Render events in the account timezone while edits keep the original record. */
export function eventsForDay(events:EventEntry[],day:string,zone:string):EventEntry[]{
  if(!day)return [];const from=Temporal.PlainDate.from(day).toZonedDateTime(zone),to=from.add({days:1}),out:EventEntry[]=[];
  for(const e of events){const sourceZone=e.timeZone??zone;for(let shift=-2;shift<=2;shift++){const date=addDays(day,shift);if(!occursOn(e,date))continue;try{const start=date===e.date&&e.startsAt?Temporal.Instant.from(e.startsAt).toZonedDateTimeISO(sourceZone):wallTime(date,e.start,sourceZone),end=date===e.date&&e.endsAt?Temporal.Instant.from(e.endsAt).toZonedDateTimeISO(sourceZone):wallTime(date,e.end,sourceZone);if(start.epochMilliseconds>=to.epochMilliseconds||end.epochMilliseconds<=from.epochMilliseconds)continue;const a=start.withTimeZone(zone),b=end.withTimeZone(zone);out.push({...e,date:day,timeZone:zone,startsAt:iso(a),endsAt:iso(b),start:a.toPlainDate().toString()<day?"00:00":a.toPlainTime().toString({smallestUnit:"minute"}),end:b.toPlainDate().toString()>day?"23:59":b.toPlainTime().toString({smallestUnit:"minute"})});}catch{/* Invalid legacy records remain editable from their original entry. */}}}
  return out.sort((a,b)=>a.start.localeCompare(b.start));
}
