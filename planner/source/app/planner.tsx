"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { flushSync } from "react-dom";
import { Gamepad2, Sparkles, CalendarDays, Check, CheckCheck, ChevronLeft, ChevronRight, Clock3, Download, Flag, Info, LayoutGrid, ListTodo, LoaderCircle, MapPin, Plus, RefreshCw, Repeat2, Settings2, ShieldCheck, Smartphone, Upload, X } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogClose } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction } from "@/components/ui/alert-dialog";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { Empty, EmptyHeader, EmptyTitle, EmptyDescription, EmptyMedia } from "@/components/ui/empty";
import { Skeleton } from "@/components/ui/skeleton";
import { Toaster } from "@/components/ui/sonner";
import { toast } from "sonner";
import AccountPanel from "./account-panel";
import IntegrationPanel from "./integration-panel";
import OrganizerShortcuts from "./organizer-shortcuts";
import { ActionCard,type ActionPreviewData } from "./action-preview";
import { repeated } from "@/lib/recurrence";
import { Temporal } from "@/lib/integration-time";
import { eventsForDay } from "@/lib/planner-display";
import { categories, dateKey, entrySchema, fromDate, newEntry, occursOn, prettyDate, shiftDate, weekDays, type Entry, type EntryInput, type EventEntry, type TaskEntry } from "@/lib/planner";

type View = "today" | "schedule" | "tasks";
type Filter = "active" | "done" | "all";
const weekdayNames = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"];

async function request(method = "GET", entry?: unknown): Promise<{entries?:Entry[],entry?:Entry,action?:ActionPreviewData}> {
  let response: Response;
  try {
    response = await fetch("/api/entries", {method, headers:entry?{"Content-Type":"application/json"}:undefined, body:entry?JSON.stringify(entry):undefined, cache:"no-store"});
  } catch { throw new Error("Нет соединения. Проверьте интернет и повторите попытку."); }
  if(response.status === 401) throw new Error("AUTH_REQUIRED");
  let result: { error?: string; entries?: Entry[]; entry?: Entry;action?:ActionPreviewData };
  try { result=await response.json() as typeof result; } catch { throw new Error("Сервис временно недоступен. Попробуйте ещё раз."); }
  if(!response.ok) throw new Error(result.error || "Не удалось сохранить изменения");
  return result;
}

function message(error: unknown) { return error instanceof Error ? error.message : "Не удалось выполнить действие"; }
function Choice({label,value,onChange,options,id}:{label:string,value:string,onChange:(v:string)=>void,options:[string,string][],id:string}) {
  return <div className="field"><label htmlFor={id}>{label}</label><Select name={id} value={value} onValueChange={onChange}><SelectTrigger id={id} className="choice-trigger"><SelectValue /></SelectTrigger><SelectContent>{options.map(([key,name])=><SelectItem key={key} value={key}>{name}</SelectItem>)}</SelectContent></Select></div>;
}
function Blank({kind,onAdd,compact=false}:{kind:"task"|"event",onAdd:()=>void,compact?:boolean}) {
  return <Empty className={`blank ${compact?"compact":""}`}><EmptyHeader><EmptyMedia variant="icon">{kind==="event"?<CalendarDays/>:<CheckCheck/>}</EmptyMedia><EmptyTitle>{kind==="event"?"Пока без событий":"Здесь появятся Ваши задачи"}</EmptyTitle><EmptyDescription>{kind==="event"?"Добавьте занятие, встречу или личный план.":"Запишите важное и назначьте срок."}</EmptyDescription></EmptyHeader><button className="button soft" onClick={onAdd}><Plus size={17}/>{kind==="event"?"Добавить событие":"Добавить задачу"}</button></Empty>;
}
function Category({value}:{value:keyof typeof categories}) { return <span className={`category ${categories[value].color}`}>{categories[value].label}</span>; }

export default function Planner() {
  const [entries,setEntries]=useState<Entry[]>([]);
  const [view,setView]=useState<View>("today");
  const [filter,setFilter]=useState<Filter>("active");
  const [today,setToday]=useState("");
  const [timeZone,setTimeZone]=useState<string|null>(null);
  const [selected,setSelected]=useState("");
  const [month,setMonth]=useState("");
  const [clock,setClock]=useState("00:00");
  const [loading,setLoading]=useState(true);
  const [error,setError]=useState("");
  const [auth,setAuth]=useState(false);
  const [draft,setDraft]=useState<EventEntry|TaskEntry|null>(null);
  const [saving,setSaving]=useState(false);
  const [busyIds,setBusyIds]=useState<Set<string>>(new Set());
  const [formError,setFormError]=useState("");
  const [deleting,setDeleting]=useState<EventEntry|TaskEntry|null>(null);
  const [actionPreview,setActionPreview]=useState<ActionPreviewData|null>(null);
  const [settings,setSettings]=useState(false);
  const [accountOpen,setAccountOpen]=useState(false);
  const [install,setInstall]=useState(false);
  const importing=false;
  const entriesRef=useRef(entries);
  entriesRef.current=entries;

  useEffect(()=>{const v=new URLSearchParams(window.location.search).get("view");if(v&&["today","schedule","tasks"].includes(v))setView(v as View);},[]);

  const load=useCallback(async()=>{
    setLoading(true);setError("");
    try { const result=await request();setEntries(result.entries??[]);setAuth(false);const response=await fetch("/api/v1/actions/planner_context",{method:"POST",headers:{"Content-Type":"application/json"},body:"{}"});if(response.ok){const context=await response.json() as {timeZone:string|null};setTimeZone(context.timeZone);} }
    catch(e){if(message(e)==="AUTH_REQUIRED"){setAuth(true);setEntries([]);}else setError(message(e));}
    finally {setLoading(false);}
  },[]);
  useEffect(()=>{
    const update=()=>{const now=Temporal.Now.zonedDateTimeISO(timeZone??Intl.DateTimeFormat().resolvedOptions().timeZone);const key=now.toPlainDate().toString();setToday(key);setClock(now.toPlainTime().toString({smallestUnit:"minute"}));return key;};
    const initial=update();setSelected(initial);setMonth(initial);void load();
    const id=setInterval(update,30000);
    const refresh=()=>{update();void load();};
    window.addEventListener("online",refresh);window.addEventListener("focus",refresh);window.addEventListener("jarvis-changed",refresh);
    return()=>{clearInterval(id);window.removeEventListener("online",refresh);window.removeEventListener("focus",refresh);window.removeEventListener("jarvis-changed",refresh);};
  },[load,timeZone]);

  const saveEntry=useCallback(async(entry:Entry)=>{
    const parsed=entrySchema.parse({...entry,timeZone:entry.timeZone??Intl.DateTimeFormat().resolvedOptions().timeZone});
    const result=await request(entry.id?"PUT":"POST",{...parsed,id:entry.id,version:entry.version});
    if(result.action){setActionPreview(result.action);return null;}
    if(!result.entry)throw new Error("Не удалось подтвердить сохранение");
    const saved=result.entry;
    setEntries(current=>entry.id?current.map(item=>item.id===saved.id?saved:item):[saved,...current]);
    return saved;
  },[]);

  useEffect(()=>{
    const context=(document as unknown as {modelContext?:{registerTool:(tool:unknown,options:{signal:AbortSignal})=>unknown}}).modelContext;
    if(!context?.registerTool)return;
    const controller=new AbortController();
    const register=(tool:unknown)=>{try{void Promise.resolve(context.registerTool(tool,{signal:controller.signal})).catch(()=>{});}catch{}};
    register({name:"start_planner_entry",title:"Открыть новую запись",description:"Открывает форму задачи или события. Не сохраняет запись; пользователь заполняет и подтверждает её.",inputSchema:{type:"object",properties:{kind:{type:"string",enum:["task","event"]},date:{type:"string",pattern:"^\\d{4}-\\d{2}-\\d{2}$"}},required:["kind"],additionalProperties:false},annotations:{readOnlyHint:false},execute:(input:unknown)=>{const v=input as {kind?:string,date?:string};if(!v||!["task","event"].includes(v.kind??"")||(v.date&&(!/^\d{4}-\d{2}-\d{2}$/.test(v.date)||dateKey(fromDate(v.date))!==v.date)))throw new Error("Invalid entry type or date");flushSync(()=>{setFormError("");setDraft(newEntry(v.kind as "task"|"event",v.date||dateKey()));});return {status:"form_opened",saved:false};}});
    return()=>controller.abort();
  },[]);

  const events=useMemo(()=>entries.filter((e):e is EventEntry=>e.kind==="event"),[entries]);
  const tasks=useMemo(()=>entries.filter((e):e is TaskEntry=>e.kind==="task"),[entries]);
  const dayEvents=useMemo(()=>eventsForDay(events,today,timeZone??Intl.DateTimeFormat().resolvedOptions().timeZone),[events,today,timeZone]);
  const selectedEvents=useMemo(()=>eventsForDay(events,selected,timeZone??Intl.DateTimeFormat().resolvedOptions().timeZone),[events,selected,timeZone]);
  const todayTasks=tasks.filter(t=>repeated(t)?!!today&&occursOn(t,today):t.date===today||(!t.done&&t.date&&t.date<today)).sort((a,b)=>Number(a.done)-Number(b.done)||Number(b.priority==="high")-Number(a.priority==="high")||a.date.localeCompare(b.date));
  const activeTasks=tasks.filter(t=>!t.done);
  const overdue=activeTasks.filter(t=>!repeated(t)&&t.date&&t.date<today);
  const deadlines=activeTasks.filter(t=>!repeated(t)&&t.date&&t.date>today&&t.date<=shiftDate(today||dateKey(),7)).sort((a,b)=>a.date.localeCompare(b.date)).slice(0,5);
  const completedToday=todayTasks.filter(t=>t.done).length;
  const progress=todayTasks.length?Math.round(completedToday/todayTasks.length*100):0;
  const nextEvent=dayEvents.find(e=>e.end>clock);
  const visibleTasks=tasks.filter(t=>filter==="all"||(filter==="done"?t.done:!t.done)).sort((a,b)=>Number(a.done)-Number(b.done)||Number(b.priority==="high")-Number(a.priority==="high")||(a.date||"9999").localeCompare(b.date||"9999"));
  const currentDate=view==="today"?today:selected;

  const open=(kind:"task"|"event",date=currentDate)=>{setFormError("");setDraft(newEntry(kind,date||today));};
  const edit=(entry:EventEntry|TaskEntry)=>{setFormError("");const original=entriesRef.current.find(e=>e.id===entry.id);setDraft({...((original?.kind==="event"||original?.kind==="task")?original:entry)});};
  const onError=(e:unknown)=>{if(message(e)==="AUTH_REQUIRED"){setAuth(true);toast.error("Войдите в аккаунт для сохранения");}else toast.error(message(e));};
  async function submit(event:React.FormEvent){
    event.preventDefault();if(!draft||saving)return;
    const candidate={...draft,...Object.fromEntries(new FormData(event.currentTarget as HTMLFormElement)),tags:(draft.tags??[]).map(t=>t.trim()).filter(Boolean)} as EventEntry|TaskEntry;
    setDraft(candidate);
    const parsed=entrySchema.safeParse(candidate);
    if(!parsed.success){setFormError(parsed.error.issues[0].message);return;}
    setSaving(true);setFormError("");
    try {const saved=await saveEntry({...parsed.data,id:draft.id,version:draft.version});setDraft(null);toast.success(saved?(draft.id?"Изменения сохранены":"Запись добавлена"):"Проверьте preview на главном экране");}
    catch(e){if(message(e)==="AUTH_REQUIRED")setAuth(true);setFormError(message(e)==="AUTH_REQUIRED"?"Войдите в аккаунт для сохранения.":message(e));}
    finally{setSaving(false);}
  }
  async function toggle(task:TaskEntry){
    if(busyIds.has(task.id))return;
    setBusyIds(s=>new Set(s).add(task.id));
    try{if(repeated(task)){const occurrenceDate=view==="schedule"?selected:today;if(!occurrenceDate||!occursOn(task,occurrenceDate)){toast.info("Выберите день повторения в расписании или уточните его в JRVX AI.");return;}const r=await fetch("/api/v1/actions/set_task_completion",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({id:task.id,version:task.version,completed:!task.done,occurrenceDate})}),v=await r.json() as ActionPreviewData & {error?:{message?:string}};if(!r.ok)throw new Error(v.error?.message??"Не удалось изменить повторение.");setActionPreview(v);return;}await saveEntry({...task,done:!task.done});toast.success(task.done?"Задача возвращена в план":"Выполнено. Так держать.");}catch(e){onError(e);}finally{setBusyIds(s=>{const n=new Set(s);n.delete(task.id);return n;});}
  }
  async function remove(){
    if(!deleting||saving)return;setSaving(true);
    try{await request("DELETE",{id:deleting.id,version:deleting.version,confirmed:true});setEntries(e=>e.filter(item=>item.id!==deleting.id));setDraft(null);setDeleting(null);toast.success("Запись удалена");}catch(e){onError(e);}finally{setSaving(false);}
  }
  function chooseDate(key:string){setSelected(key);setMonth(key);}
  function exportBackup(){
    if(loading||auth||error){toast.error("Сначала загрузите свои записи");return;}
    const blob=new Blob([JSON.stringify({app:"jarvis-planner",version:1,exportedAt:new Date().toISOString(),entries},null,2)],{type:"application/json"});
    const url=URL.createObjectURL(blob);const a=document.createElement("a");a.href=url;a.download=`JRVX-${today}.json`;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);toast.success("Резервная копия подготовлена");
  }

  function renderTaskRow({task}:{task:TaskEntry}){
    return <div key={task.id} className={`task-row ${task.done?"completed":""}`}><div className="check-target"><Checkbox className="task-checkbox" checked={task.done} disabled={busyIds.has(task.id)} onCheckedChange={()=>void toggle(task)} aria-label={`${task.done?"Вернуть в план":"Выполнить"}: ${task.title}`} /></div><button className="task-details" onClick={()=>edit(task)}><span className="task-title">{task.title}</span><span className="task-meta"><Category value={task.category}/>{task.date&&<span className={!task.done&&task.date<today?"overdue":""}>{task.date===today?"Сегодня":prettyDate(task.date,{day:"numeric",month:"short"})}{!task.done&&task.date<today?" · просрочено":""}</span>}{!task.date&&<span>Без срока</span>}{task.dueAt&&<span>{new Date(task.dueAt).toLocaleTimeString("ru-RU",{timeZone:task.timeZone,hour:"2-digit",minute:"2-digit"})} · {task.timeZone}</span>}{repeated(task)&&<Repeat2 size={14} aria-label="Повторяющаяся задача"/>}{task.priority==="high"&&<Flag size={14} className="priority" aria-label="Высокий приоритет"/>}</span></button><button className="icon-button row-edit" aria-label={`Редактировать: ${task.title}`} onClick={()=>edit(task)}><ChevronRight size={17}/></button></div>;
  }
  function EventRows({items,date}:{items:EventEntry[],date:string}){
    return <div className="timeline">{items.map((item,i)=>{
      const now=date===today&&item.start<=clock&&item.end>clock;
      const conflict=items.some((other,j)=>i!==j&&item.start<other.end&&item.end>other.start);
      return <div className="timeline-row" key={`${item.id}:${item.startsAt??date}`}><div className="time-label"><strong>{item.start}</strong><span>{item.end}</span></div><button className={`event-card ${categories[item.category].color} ${now?"happening":""}`} onClick={()=>edit(item)}><div className="event-topline"><Category value={item.category}/>{now&&<span className="now-label">Сейчас</span>}{item.repeat!=="none"&&<Repeat2 size={15} aria-label="Повторяется"/>}</div><h3>{item.title}</h3>{item.location&&<p className="event-location"><MapPin size={14}/>{item.location}</p>}{item.timeZone&&<p className="event-note">{item.timeZone}</p>}{item.note&&<p className="event-note">{item.note}</p>}{conflict&&<p className="conflict"><Info size={13}/>Пересечение по времени</p>}</button></div>;
    })}</div>;
  }
  function WeekStrip({date,onSelect}:{date:string,onSelect:(key:string)=>void}){
    if(!date)return null;
    return <div className="week-strip">{weekDays(date).map((key,i)=>{const count=events.filter(e=>occursOn(e,key)).length+tasks.filter(t=>!t.done&&occursOn(t,key)).length;return <button key={key} className={`week-day ${key===date?"selected":""} ${key===today?"is-today":""}`} onClick={()=>onSelect(key)} aria-label={`${prettyDate(key)}, ${count} записей`} aria-pressed={key===date}><span>{weekdayNames[i]}</span><strong>{fromDate(key).getDate()}</strong><span className="day-dot" data-has-items={count>0}/></button>;})}</div>;
  }

  const loadingContent=<div className="loading-rows" aria-label="Загрузка записей"><Skeleton className="h-24 rounded-2xl"/><Skeleton className="h-24 rounded-2xl"/></div>;

  return <Tabs value={view} onValueChange={v=>setView(v as View)} className="planner-root">
    <header className="app-header"><div className="header-inner"><button className="brand" onClick={()=>setView("today")} aria-label="JRVX — на главную"><img src="/favicon.svg" alt="" width="38" height="38"/><span>JRVX<small>Planner · время для важного</small></span></button><TabsList className="main-nav" aria-label="Разделы планировщика"><TabsTrigger value="today"><LayoutGrid/><span>Сегодня</span></TabsTrigger><TabsTrigger value="schedule"><CalendarDays/><span>Расписание</span></TabsTrigger><TabsTrigger value="tasks"><ListTodo/><span>Задачи</span>{activeTasks.length>0&&<b className="nav-count">{activeTasks.length}</b>}</TabsTrigger><a className="main-nav-link" href="/plans"><Sparkles size={17}/><span>Планы</span></a><a className="main-nav-link" href="/games"><Gamepad2 size={17}/><span>JRVX Arcade</span></a></TabsList><div className="header-tools"><a className="button soft small" href="https://id.jrvx.ru/">JRVX ID ↗</a><a className="button soft small" href="/chat">AI-чат</a><a className="button soft small" href="/notes">Заметки</a><a className="ecosystem-return" href="https://jrvx.ru/">Экосистема ↗</a><button className="install-desktop" onClick={()=>setInstall(true)}><Smartphone size={17}/><span>На iPhone</span></button><button className="icon-button settings-button" onClick={()=>setSettings(true)} aria-label="Настройки и резервная копия"><Settings2 size={21}/></button></div></div></header>

    <main className="workspace">{actionPreview&&<ActionCard initial={actionPreview} onDone={()=>void load()}/>}
      {(auth||error)&&<div className="status-banner" role="status"><div><ShieldCheck size={20}/><p>{auth?"Войдите в аккаунт, чтобы открыть своё расписание и задачи.":error}</p></div>{auth?<button className="button primary small" onClick={()=>setAccountOpen(true)}>Войти</button>:<button className="button soft small" onClick={()=>void load()}><RefreshCw size={15}/>Повторить</button>}</div>}
      <TabsContent value="today" className="main-view"><OrganizerShortcuts onTask={()=>open("task",today)} onEvent={()=>open("event",today)}/>{deadlines.length>0&&<section className="panel upcoming-deadlines"><p className="eyebrow">БЛИЖАЙШИЕ ДЕДЛАЙНЫ</p>{deadlines.map(task=><button key={task.id} onClick={()=>edit(task)}><strong>{task.title}</strong><span>{prettyDate(task.date,{day:"numeric",month:"short"})}</span></button>)}</section>}<div className="page-heading"><div><p className="eyebrow">ВАШ ЛИЧНЫЙ ПЛАН</p><h1>Сегодня<span className="heading-dot">.</span></h1><p className="date-subtitle">{today?prettyDate(today,{weekday:"long",day:"numeric",month:"long"}):"Загрузка…"}</p></div><button className="button primary add-top" onClick={()=>open("task",today)}><Plus size={19}/>Новая задача</button></div>
        <div className="overview-grid"><section className="focus-card"><div className="focus-caption"><span><Clock3 size={16}/>{nextEvent&&nextEvent.start<=clock?"СЕЙЧАС В РАСПИСАНИИ":"БЛИЖАЙШЕЕ СОБЫТИЕ"}</span><span>{today&&prettyDate(today,{day:"2-digit",month:"2-digit"})}</span></div>{loading?<Skeleton className="h-16 bg-white/10"/>:nextEvent?<button className="focus-content" onClick={()=>edit(nextEvent)}><h2>{nextEvent.title}</h2><div className="focus-time">{nextEvent.start}<span>— {nextEvent.end}</span></div><p>{nextEvent.location?<><MapPin size={15}/>{nextEvent.location}</>:categories[nextEvent.category].label}</p></button>:<div className="focus-content"><h2>Время для Ваших планов</h2><p>Ближайших событий на сегодня нет.</p><button className="focus-add" onClick={()=>open("event",today)}>Запланировать событие <Plus size={17}/></button></div>}<span className="focus-decoration" aria-hidden="true">J</span></section>
        <section className="day-stats"><div className="stats-title"><span>План на день</span><span className="muted">{completedToday} / {todayTasks.length}</span></div><div className="stat-numbers"><div><strong>{loading?"—":dayEvents.length.toString().padStart(2,"0")}</strong><span>событий</span></div><span className="stat-divider"/><div><strong>{loading?"—":todayTasks.filter(t=>!t.done).length.toString().padStart(2,"0")}</strong><span>задач осталось</span></div></div><Progress value={progress} aria-label="Выполнение задач на сегодня" className="day-progress"/><div className="progress-caption"><CheckCheck size={15}/><span>{todayTasks.length?`Выполнено ${progress}% задач`:"Начните с одной задачи"}</span></div></section></div>
        <div className="day-columns"><section className="panel schedule-panel"><div className="section-heading"><h2>Расписание</h2><button className="text-button" onClick={()=>{chooseDate(today);setView("schedule");}}>Весь календарь <ChevronRight size={16}/></button></div><WeekStrip date={today} onSelect={key=>{chooseDate(key);setView("schedule");}}/>{loading?loadingContent:dayEvents.length?<EventRows items={dayEvents} date={today}/>:<Blank kind="event" onAdd={()=>open("event",today)}/>}</section><section className="panel tasks-panel"><div className="section-heading"><h2>Задачи на день <span className="count-badge">{todayTasks.length}</span></h2><button className="icon-button" onClick={()=>open("task",today)} aria-label="Добавить задачу на сегодня"><Plus size={20}/></button></div>{loading?loadingContent:todayTasks.length?<div className="task-list">{todayTasks.map(task=>renderTaskRow({task}))}</div>:<Blank kind="task" compact onAdd={()=>open("task",today)}/>}<button className="all-tasks" onClick={()=>setView("tasks")}>Все задачи <span>{activeTasks.length} активных<ChevronRight size={16}/></span></button></section></div>
      </TabsContent>

      <TabsContent value="schedule" className="main-view"><div className="page-heading"><div><p className="eyebrow">КАЛЕНДАРЬ</p><h1>Расписание<span className="heading-dot">.</span></h1><p className="date-subtitle">Занятия, встречи и личные планы</p></div><button className="button primary add-top" onClick={()=>open("event",selected)}><Plus size={19}/>Новое событие</button></div><div className="calendar-layout"><aside className="calendar-panel panel"><div className="month-heading"><h2>{month&&prettyDate(month,{month:"long",year:"numeric"})}</h2><div><button className="icon-button" aria-label="Предыдущий месяц" onClick={()=>{const d=fromDate(month);d.setDate(1);d.setMonth(d.getMonth()-1);setMonth(dateKey(d));}}><ChevronLeft size={18}/></button><button className="icon-button" aria-label="Следующий месяц" onClick={()=>{const d=fromDate(month);d.setDate(1);d.setMonth(d.getMonth()+1);setMonth(dateKey(d));}}><ChevronRight size={18}/></button></div></div><div className="month-grid">{weekdayNames.map(d=><span className="month-weekday" key={d}>{d}</span>)}{month&&Array.from({length:42},(_,i)=>{const first=month.slice(0,8)+"01";const start=weekDays(first)[0];const key=shiftDate(start,i);const has=events.some(e=>occursOn(e,key))||tasks.some(t=>occursOn(t,key)&&!t.done);return <button key={key} className={`month-day ${key===selected?"selected":""} ${key===today?"is-today":""} ${key.slice(0,7)!==month.slice(0,7)?"outside":""}`} onClick={()=>chooseDate(key)} aria-label={prettyDate(key)} aria-pressed={key===selected}>{fromDate(key).getDate()}<span className="day-dot" data-has-items={has}/></button>;})}</div><button className="button soft calendar-today" onClick={()=>chooseDate(today)}>К сегодняшнему дню</button><div className="calendar-legend">{Object.keys(categories).map(k=><Category value={k as keyof typeof categories} key={k}/>)}</div></aside><section className="panel agenda-panel"><div className="section-heading"><div><p className="eyebrow">{selected&&prettyDate(selected,{weekday:"long"})}</p><h2 className="agenda-date">{selected&&prettyDate(selected)}</h2></div><div className="agenda-arrows"><button className="icon-button" aria-label="Предыдущий день" onClick={()=>chooseDate(shiftDate(selected,-1))}><ChevronLeft size={20}/></button><button className="icon-button" aria-label="Следующий день" onClick={()=>chooseDate(shiftDate(selected,1))}><ChevronRight size={20}/></button></div></div>{loading?loadingContent:selectedEvents.length?<EventRows items={selectedEvents} date={selected}/>:<Blank kind="event" onAdd={()=>open("event",selected)}/>}<div className="agenda-tasks"><div className="section-heading"><h3>Задачи на эту дату</h3><button className="icon-button" aria-label="Добавить задачу на выбранную дату" onClick={()=>open("task",selected)}><Plus size={18}/></button></div>{tasks.filter(t=>occursOn(t,selected)).map(task=>renderTaskRow({task}))}{!tasks.some(t=>occursOn(t,selected))&&<p className="muted agenda-empty">Задач на этот день пока нет.</p>}</div></section></div></TabsContent>

      <TabsContent value="tasks" className="main-view"><div className="page-heading"><div><p className="eyebrow">СПИСОК ДЕЛ</p><h1>Мои задачи<span className="heading-dot">.</span></h1><p className="date-subtitle">{activeTasks.length} активных{overdue.length?` · ${overdue.length} с прошедшим сроком`:""}</p></div><button className="button primary add-top" onClick={()=>open("task",today)}><Plus size={19}/>Новая задача</button></div><section className="panel full-tasks"><Tabs value={filter} onValueChange={v=>setFilter(v as Filter)}><div className="task-toolbar"><TabsList className="task-filters"><TabsTrigger value="active">В плане <span>{activeTasks.length}</span></TabsTrigger><TabsTrigger value="done">Выполнено</TabsTrigger><TabsTrigger value="all">Все</TabsTrigger></TabsList><span className="muted sort-label">По приоритету и сроку</span></div><TabsContent value={filter}>{loading?loadingContent:visibleTasks.length?<div>{visibleTasks.map(task=>renderTaskRow({task}))}</div>:filter==="done"?<Empty className="blank"><EmptyHeader><EmptyMedia variant="icon"><CheckCheck/></EmptyMedia><EmptyTitle>Пока нет выполненных задач</EmptyTitle><EmptyDescription>Отмечайте готовые задачи галочкой.</EmptyDescription></EmptyHeader></Empty>:<Blank kind="task" onAdd={()=>open("task",today)}/>}</TabsContent></Tabs></section></TabsContent>
      <footer className="app-footer"><span><ShieldCheck size={14}/>Личное пространство</span><button onClick={()=>setInstall(true)}><Smartphone size={14}/>Добавить на экран «Домой»</button></footer>
    </main>

    <Dialog open={!!draft} onOpenChange={v=>{if(!v&&!saving){setDraft(null);setFormError("");}}}><DialogContent className="entry-dialog" showCloseButton={false}><DialogHeader><DialogTitle>{draft?.id?"Редактировать":draft?.kind==="event"?"Новое событие":"Новая задача"}</DialogTitle><DialogDescription>{draft?.kind==="event"?"Выберите время и добавьте детали.":"Запишите, что хотите сделать."}</DialogDescription></DialogHeader><DialogClose className="icon-button dialog-close" disabled={saving} aria-label="Закрыть"><X size={21}/></DialogClose>{draft&&<form onSubmit={submit} className="entry-form"><div className="field"><label htmlFor="entry-title">{draft.kind==="event"?"Название события":"Задача"}</label><input name="title" id="entry-title" autoFocus required maxLength={180} placeholder={draft.kind==="event"?"Например, занятие по фармакологии":"Что необходимо сделать?"} value={draft.title} onChange={e=>setDraft({...draft,title:e.target.value})}/></div><div className="field-grid"><Choice id="category" label="Категория" value={draft.category} onChange={v=>setDraft({...draft,category:v as Entry["category"]})} options={Object.entries(categories).map(([key,value])=>[key,value.label])}/><div className="field"><label htmlFor="entry-date">{draft.kind==="event"?"Дата начала":"Срок · необязательно"}</label><input name="date" id="entry-date" type="date" min="2000-01-01" max="2100-12-31" required={draft.kind==="event"} value={draft.date} onChange={e=>setDraft({...draft,date:e.target.value})}/></div></div>{draft.kind==="event"?<><div className="field-grid"><div className="field"><label htmlFor="start">Начало</label><input name="start" id="start" type="time" required value={draft.start} onChange={e=>setDraft({...draft,start:e.target.value})}/></div><div className="field"><label htmlFor="end">Окончание</label><input name="end" id="end" type="time" required value={draft.end} onChange={e=>setDraft({...draft,end:e.target.value})}/></div></div><div className="field"><label htmlFor="location">Место · необязательно</label><input name="location" id="location" maxLength={250} placeholder="Адрес, аудитория или ссылка" value={draft.location} onChange={e=>setDraft({...draft,location:e.target.value})}/></div><div className="field-grid"><Choice id="repeat" label="Повторение" value={draft.repeat} onChange={v=>setDraft({...draft,repeat:v as EventEntry["repeat"],rrule:null,until:v==="none"?"":draft.until})} options={[["none","Не повторять"],["weekly","Каждую неделю"],["biweekly","Каждые 2 недели"]]}/>{draft.repeat!=="none"&&<div className="field"><label htmlFor="until">Повторять до · необязательно</label><input name="until" id="until" type="date" min={draft.date} max="2100-12-31" value={draft.until} onChange={e=>setDraft({...draft,until:e.target.value})}/></div>}</div>{draft.id&&draft.repeat!=="none"&&<p className="form-hint"><Repeat2 size={15}/>Изменения применятся ко всем повторениям.</p>}</>:<Choice id="priority" label="Приоритет" value={draft.priority} onChange={v=>setDraft({...draft,priority:v as TaskEntry["priority"]})} options={[["normal","Обычный"],["high","Высокий"]]}/>}<div className="field"><label htmlFor="entry-tags">Темы · через запятую</label><input id="entry-tags" value={(draft.tags??[]).join(", ")} onChange={e=>setDraft({...draft,tags:e.target.value.split(",").map(t=>t.trimStart()).slice(0,12)})} placeholder="Фармакология, экзамен"/></div>{draft.rrule&&<p className="form-hint">Повторение: {draft.rrule}. Для одного экземпляра или будущих повторений <a href={`/chat?prompt=${encodeURIComponent(`Измени повторение «${draft.title}». Сначала уточни дату и область изменения.`)}`}>откройте JRVX AI</a>.</p>}{draft.kind==="task"&&<Choice id="task-repeat" label="Повторение" value={draft.repeat??"none"} onChange={v=>setDraft({...draft,repeat:v as "none"|"weekly"|"biweekly",rrule:null})} options={[["none","Не повторять"],["weekly","Каждую неделю"],["biweekly","Каждые 2 недели"]]}/>}<div className="field"><label htmlFor="note">Заметка · необязательно</label><textarea name="note" id="note" rows={3} maxLength={5000} placeholder="Всё, что нужно помнить" value={draft.note} onChange={e=>setDraft({...draft,note:e.target.value})}/></div>{formError&&<p role="alert" className="form-error">{formError}</p>}{auth&&<a className="text-button" href="/auth/chatgpt" target="_top">Войти в аккаунт</a>}<div className="form-actions">{draft.id&&<button type="button" className="delete-button" disabled={saving} onClick={()=>setDeleting(draft)}>Удалить</button>}<button type="submit" className="button primary save-button" disabled={saving}>{saving?<LoaderCircle size={18} className="spin"/>:<Check size={18}/>}Сохранить</button></div></form>}</DialogContent></Dialog>

    <AlertDialog open={!!deleting} onOpenChange={v=>{if(!v&&!saving)setDeleting(null);}}><AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Удалить запись?</AlertDialogTitle><AlertDialogDescription>«{deleting?.title}»{deleting?.kind==="event"&&deleting.repeat!=="none"?" и все её повторения будут удалены.":" будет удалена."} Восстановление доступно в истории действий, пока нет конфликтующих изменений.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel disabled={saving}>Отмена</AlertDialogCancel><AlertDialogAction disabled={saving} variant="destructive" onClick={e=>{e.preventDefault();void remove();}}>{saving?"Удаление…":"Удалить"}</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog>

    <Dialog open={settings} onOpenChange={v=>{if(!importing)setSettings(v);}}><DialogContent showCloseButton={false} className="settings-dialog"><DialogHeader><DialogTitle>Ваше пространство</DialogTitle><DialogDescription>JRVX · расписание и задачи</DialogDescription></DialogHeader><DialogClose className="icon-button dialog-close" disabled={importing} aria-label="Закрыть"><X size={21}/></DialogClose><div className="settings-note"><ShieldCheck/><div><strong>Сохранение в Вашем аккаунте</strong><p>Записи доступны после входа в аккаунт. Для просмотра и изменений нужен интернет.</p></div></div><button className="settings-row" onClick={()=>{setSettings(false);setAccountOpen(true);}}><ShieldCheck/><span><strong>Вход и регистрация</strong><small>JRVX ID или логин и пароль</small></span><ChevronRight/></button><button className="settings-row" onClick={()=>{setSettings(false);setInstall(true);}}><Smartphone/><span><strong>Установить на iPhone</strong><small>Отдельная иконка на экране «Домой»</small></span><ChevronRight/></button><button className="settings-row" onClick={exportBackup} disabled={loading||auth||!!error||importing}><Download/><span><strong>Скачать резервную копию</strong><small>Расписание, задачи и заметки в одном файле</small></span><ChevronRight/></button><a className="settings-row" href="/import"><Upload/><span><strong>Восстановить из копии</strong><small>Preview, защита от дублей и подтверждение</small></span><ChevronRight/></a><a className="settings-row" href="/ai-settings"><ShieldCheck/><span><strong>JRVX AI permissions</strong><small>Права AI и подтверждение действий</small></span><ChevronRight/></a><a className="settings-row" href="/activity"><RefreshCw/><span><strong>История и Undo</strong><small>Что изменилось и как отменить</small></span><ChevronRight/></a><IntegrationPanel onChange={()=>void load()}/><p className="settings-footnote">В календаре указано местное время каждой записи; её часовой пояс показан рядом. Напоминания отображаются при открытом JRVX. Фоновая push-доставка пока не подключена.</p></DialogContent></Dialog>
    <Dialog open={install} onOpenChange={setInstall}><DialogContent showCloseButton={false} className="install-dialog"><DialogHeader><div className="install-app-icon"><img src="/favicon.svg" width="64" height="64" alt="JRVX"/></div><DialogTitle>JRVX на Вашем iPhone</DialogTitle><DialogDescription>Открывайте планировщик одним нажатием.</DialogDescription></DialogHeader><DialogClose className="icon-button dialog-close" aria-label="Закрыть"><X size={21}/></DialogClose><ol className="install-steps"><li><span>1</span><p>Откройте эту страницу в <strong>Safari</strong>.</p></li><li><span>2</span><p>Нажмите <strong>«Поделиться»</strong>, затем <strong>«На экран „Домой“»</strong>.</p></li><li><span>3</span><p>Включите <strong>«Открывать как веб-приложение»</strong>, если переключатель доступен, и нажмите <strong>«Добавить»</strong>.</p></li></ol><p className="settings-footnote">При первом открытии из иконки может понадобиться войти в аккаунт.</p><button className="button primary full-width" onClick={()=>setInstall(false)}>Понятно</button></DialogContent></Dialog>
    <Dialog open={accountOpen} onOpenChange={setAccountOpen}><DialogContent className="settings-dialog"><DialogHeader><DialogTitle>Ваш аккаунт</DialogTitle><DialogDescription>Вход и настройки пароля</DialogDescription></DialogHeader><AccountPanel onChange={()=>void load()}/></DialogContent></Dialog><Toaster position="top-center" theme="light" richColors/>
  </Tabs>;
}
