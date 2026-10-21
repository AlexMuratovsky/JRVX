import { Temporal } from "./integration-time";
const days=["MO","TU","WE","TH","FR","SA","SU"];
export type Rule={frequency:"DAILY"|"WEEKLY",interval:number,byDay:number[],until:string|null,count:number|null};
export function parseRule(text:string):Rule{
  const fields:Record<string,string>={};for(const part of text.replace(/^RRULE:/i,"").toUpperCase().split(";")){const [k,v,...rest]=part.split("=");if(!v||rest.length||fields[k]||!["FREQ","INTERVAL","BYDAY","UNTIL","COUNT","WKST"].includes(k))throw new RangeError("Unsupported RRULE field");fields[k]=v;}
  if(!["DAILY","WEEKLY"].includes(fields.FREQ)||fields.WKST&&fields.WKST!=="MO")throw new RangeError("Only daily/weekly RRULE with Monday week start supported");
  const interval=Number(fields.INTERVAL??1),count=fields.COUNT?Number(fields.COUNT):null;if(!Number.isInteger(interval)||interval<1||interval>52||count!==null&&(!Number.isInteger(count)||count<1||count>5000))throw new RangeError("Invalid recurrence interval/count");
  const byDay=fields.BYDAY?fields.BYDAY.split(",").map(d=>{const i=days.indexOf(d);if(i<0)throw new RangeError("Invalid BYDAY");return i+1;}):[];
  let until=null;if(fields.UNTIL){if(!/^\d{8}$/.test(fields.UNTIL))throw new RangeError("UNTIL must be local YYYYMMDD");until=Temporal.PlainDate.from(`${fields.UNTIL.slice(0,4)}-${fields.UNTIL.slice(4,6)}-${fields.UNTIL.slice(6,8)}`).toString();}
  if(until&&count)throw new RangeError("Use UNTIL or COUNT");return {frequency:fields.FREQ as Rule["frequency"],interval,byDay:[...new Set(byDay)],until,count};
}
function countThrough(rule:Rule,anchor:Temporal.PlainDate,distance:number){if(distance<0)return 0;let count=0;if(rule.frequency==="WEEKLY"){for(const wd of rule.byDay.length?rule.byDay:[anchor.dayOfWeek]){let first=wd-anchor.dayOfWeek;if(first<0)first+=7*rule.interval;if(first<=distance)count+=Math.floor((distance-first)/(7*rule.interval))+1;}return count;}const steps=Math.floor(distance/rule.interval);if(!rule.byDay.length)return steps+1;const period=rule.interval%7===0?1:7;for(let k=0;k<period;k++){const wd=(anchor.dayOfWeek-1+k*rule.interval)%7+1;if(rule.byDay.includes(wd)&&k<=steps)count+=Math.floor((steps-k)/period)+1;}return count;}
export function ruleOccurs(rule:Rule,anchor:string,date:string){const a=Temporal.PlainDate.from(anchor),d=Temporal.PlainDate.from(date),distance=a.until(d).days;if(distance<0||rule.until&&date>rule.until)return false;if(rule.byDay.length&&!rule.byDay.includes(d.dayOfWeek))return false;const match=rule.frequency==="DAILY"?distance%rule.interval===0:Math.floor((distance+a.dayOfWeek-1)/7)%rule.interval===0&&(rule.byDay.length>0||d.dayOfWeek===a.dayOfWeek);return match&&(!rule.count||countThrough(rule,a,distance)<=rule.count);}
export function repeated(e:{rrule?:string|null,repeat?:string}){return !!e.rrule||!!e.repeat&&e.repeat!=="none";}
/** Jump between recurrence candidates, avoiding a scan of every intervening date. */
export function nextOccurrenceDate(e:{date:string,rrule?:string|null,repeat?:string,until?:string,excludedDates?:string[]},from:string):string|null{
  const anchor=Temporal.PlainDate.from(e.date),start=Temporal.PlainDate.from(from<e.date?e.date:from),excluded=new Set(e.excludedDates??[]);
  if(!repeated(e))return e.date>=from&&!excluded.has(e.date)?e.date:null;
  const rule=e.rrule?parseRule(e.rrule):parseRule(`FREQ=WEEKLY;INTERVAL=${e.repeat==="biweekly"?2:1}`),last=[e.until,rule.until,"2100-12-31"].filter(Boolean).sort()[0]!;
  const accepts=(date:Temporal.PlainDate)=>ruleOccurs(rule,e.date,date.toString())&&!excluded.has(date.toString());
  if(rule.frequency==="DAILY"){
    let step=Math.max(0,Math.ceil(anchor.until(start).days/rule.interval));
    // Each allowed weekday pattern repeats within seven interval steps.
    for(let tries=0;tries<7*(excluded.size+2);tries++,step++){
      const date=anchor.add({days:step*rule.interval});if(date.toString()>last||rule.count&&countThrough(rule,anchor,anchor.until(date).days)>rule.count)return null;
      if(accepts(date))return date.toString();
    }
  }else{
    const monday=anchor.subtract({days:anchor.dayOfWeek-1}),period=7*rule.interval;
    let cycle=Math.max(0,Math.floor(monday.until(start).days/period));const weekdays=(rule.byDay.length?rule.byDay:[anchor.dayOfWeek]).slice().sort((a,b)=>a-b);
    for(let tries=0;tries<excluded.size+3;tries++,cycle++)for(const weekday of weekdays){
      const date=monday.add({days:cycle*period+weekday-1}),key=date.toString();if(key<start.toString())continue;
      if(key>last||rule.count&&countThrough(rule,anchor,anchor.until(date).days)>rule.count)return null;
      if(accepts(date))return key;
    }
  }
  return null;
}
export function splitRule(text:string,date:string,anchor:string){const r=parseRule(text),before=Temporal.PlainDate.from(date).subtract({days:1}).toString();let remaining=r.count;if(remaining){const used=countThrough(r,Temporal.PlainDate.from(anchor),Temporal.PlainDate.from(anchor).until(Temporal.PlainDate.from(date)).days-1);remaining-=used;if(remaining<1)throw new RangeError("No future occurrences");}const base=`FREQ=${r.frequency};INTERVAL=${r.interval}${r.byDay.length?`;BYDAY=${r.byDay.map(d=>days[d-1]).join(",")}`:""}`;return {before:`${base};UNTIL=${before.replaceAll("-","")}`,after:`${base}${remaining?`;COUNT=${remaining}`:r.until?`;UNTIL=${r.until.replaceAll("-","")}`:""}`};}
