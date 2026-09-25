import React, { useEffect, useMemo, useState } from "react";
import Panel from "../components/Panel.jsx";
import { navigate } from "../lib/navigation.js";
import { plannerApi } from "../lib/api/planner.js";
import { writesEnabled } from "../lib/api/client.js";

const quickActions = ["Задача", "Событие", "JRVX AI", "Микрофон"];
const quickQuestions = [
  "Что сегодня?",
  "Что завтра?",
  "Что просрочено?",
  "Что нужно сделать?",
  "Свободное время сегодня",
  "Задачи на неделю",
];

function todayIso() {
  return new Intl.DateTimeFormat("sv-SE", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

function timeOf(entry) {
  return entry.start ?? (entry.startsAt ? new Date(entry.startsAt).toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" }) : "");
}

export default function Dashboard() {
  const [entries, setEntries] = useState([]);
  const [timeZone, setTimeZone] = useState(null);
  const [state, setState] = useState({ loading: true, error: "" });
  const today = todayIso();

  useEffect(() => {
    let cancelled = false;

    Promise.allSettled([plannerApi.listEntries(), plannerApi.context()])
      .then(([entryResult, contextResult]) => {
        if (cancelled) return;

        if (entryResult.status === "fulfilled") {
          setEntries(entryResult.value);
        } else {
          setState({ loading: false, error: entryResult.reason?.code === "AUTH_REQUIRED" ? "Войдите в аккаунт JRVX, чтобы увидеть данные." : entryResult.reason?.message ?? "Не удалось загрузить данные." });
          return;
        }

        if (contextResult.status === "fulfilled") {
          setTimeZone(contextResult.value?.timeZone ?? null);
        }
        setState({ loading: false, error: "" });
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const todayEvents = useMemo(
    () => entries
      .filter((entry) => entry.kind === "event" && entry.date === today)
      .sort((a, b) => timeOf(a).localeCompare(timeOf(b))),
    [entries, today],
  );

  const todayTasks = useMemo(
    () => entries
      .filter((entry) => entry.kind === "task" && entry.date === today)
      .sort((a, b) => Number(Boolean(a.done)) - Number(Boolean(b.done))),
    [entries, today],
  );

  const activeTasks = todayTasks.filter((task) => !task.done);
  const nextEvent = todayEvents.find((event) => {
    const end = event.end ?? "";
    const now = new Date().toTimeString().slice(0, 5);
    return !end || end >= now;
  }) ?? todayEvents[0] ?? null;

  return (
    <>
      <div className="quick-row">
        {quickActions.map((label) => (
          <button
            key={label}
            type="button"
            className="quick-action"
            onClick={() => {
              if (label === "JRVX AI") navigate("/chat");
              if (label === "Микрофон") window.location.href = "/chat?voice=1";
            }}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="page-heading">
        <div>
          <p className="eyebrow">ВАШ ЛИЧНЫЙ ПЛАН</p>
          <h1>Сегодня<span className="heading-dot">.</span></h1>
          <p className="date-subtitle">{timeZone ? `Часовой пояс: ${timeZone}` : "JRVX держит день в одном месте."}</p>
        </div>
        <button type="button" className="button primary" disabled={!writesEnabled()} title={!writesEnabled() ? "Запись отключена до завершения проверки совместимости" : undefined}>
          Новая задача
        </button>
      </div>

      {state.error && <div className="status-banner">{state.error}</div>}

      <div className="overview-grid">
        <section className="focus-card">
          <div className="focus-caption"><span>БЛИЖАЙШЕЕ СОБЫТИЕ</span><span>JRVX</span></div>
          <div className="focus-content">
            <h2>{state.loading ? "Загрузка…" : nextEvent?.title ?? "Пока без событий"}</h2>
            <p>{nextEvent ? [timeOf(nextEvent), nextEvent.location].filter(Boolean).join(" · ") : "Добавьте занятие, встречу или личный план."}</p>
            <div className="focus-time">{todayEvents.length} <span>/ {activeTasks.length}</span></div>
          </div>
        </section>
        <Panel title="Быстрые команды">
          <div className="chip-list">
            {quickQuestions.map((q) => <button type="button" key={q} className="chip" onClick={() => navigate(`/chat?prompt=${encodeURIComponent(q)}`)}>{q}</button>)}
          </div>
        </Panel>
      </div>

      <div className="content-grid">
        <Panel title="Расписание" action={<button type="button" className="text-button">Весь календарь</button>}>
          {todayEvents.length ? (
            <div className="recovered-list">
              {todayEvents.map((event) => (
                <article className="recovered-row" key={event.id ?? `${event.title}-${event.start}`}>
                  <strong>{timeOf(event) || "—"}</strong>
                  <span>{event.title}</span>
                  {event.location && <small>{event.location}</small>}
                </article>
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <strong>{state.loading ? "Загрузка…" : "Пока без событий"}</strong>
              <span>Данные читаются через существующий JRVX API без изменения базы.</span>
            </div>
          )}
        </Panel>
        <Panel title="Задачи на день">
          {todayTasks.length ? (
            <div className="recovered-list">
              {todayTasks.map((task) => (
                <article className={task.done ? "recovered-row completed" : "recovered-row"} key={task.id ?? task.title}>
                  <strong>{task.done ? "✓" : "○"}</strong>
                  <span>{task.title}</span>
                  <small>{task.priority === "high" ? "Высокий приоритет" : task.category ?? ""}</small>
                </article>
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <strong>{state.loading ? "Загрузка…" : "0 активных"}</strong>
              <span>Задачи отображаются через восстановленный read-only адаптер.</span>
            </div>
          )}
        </Panel>
      </div>
    </>
  );
}
