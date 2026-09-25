import React from "react";
import Panel from "../components/Panel.jsx";
import { navigate } from "../lib/navigation.js";

const quickActions = ["Задача", "Событие", "JRVX AI", "Микрофон"];
const quickQuestions = [
  "Что сегодня?",
  "Что завтра?",
  "Что просрочено?",
  "Что нужно сделать?",
  "Свободное время сегодня",
  "Задачи на неделю",
];

export default function Dashboard() {
  return (
    <>
      <div className="quick-row">
        {quickActions.map((label) => (
          <button
            key={label}
            type="button"
            className="quick-action"
            onClick={() => label === "JRVX AI" && navigate("/chat")}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="page-heading">
        <div>
          <p className="eyebrow">ВАШ ЛИЧНЫЙ ПЛАН</p>
          <h1>Сегодня<span className="heading-dot">.</span></h1>
          <p className="date-subtitle">JRVX держит день в одном месте.</p>
        </div>
        <button type="button" className="button primary">Новая задача</button>
      </div>

      <div className="overview-grid">
        <section className="focus-card">
          <div className="focus-caption"><span>БЛИЖАЙШЕЕ СОБЫТИЕ</span><span>JRVX</span></div>
          <div className="focus-content">
            <h2>План на день</h2>
            <p>События и задачи появятся после подключения слоя данных.</p>
            <div className="focus-time">0 <span>/ 0</span></div>
          </div>
        </section>
        <Panel title="Быстрые команды">
          <div className="chip-list">
            {quickQuestions.map((q) => <button type="button" key={q} className="chip" onClick={() => navigate("/chat")}>{q}</button>)}
          </div>
        </Panel>
      </div>

      <div className="content-grid">
        <Panel title="Расписание" action={<button type="button" className="text-button">Весь календарь</button>}>
          <div className="empty-state">
            <strong>Начните с одного события</strong>
            <span>Слой данных будет подключён через совместимый API-адаптер.</span>
          </div>
        </Panel>
        <Panel title="Задачи на день">
          <div className="empty-state">
            <strong>0 активных</strong>
            <span>Задачи будут отображаться здесь без изменения существующей базы.</span>
          </div>
        </Panel>
      </div>
    </>
  );
}
