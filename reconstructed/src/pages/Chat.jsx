import React from "react";
import Brand from "../components/Brand.jsx";
import { navigate } from "../lib/navigation.js";

const prompts = ["Что сегодня?", "Что завтра?", "Что просрочено?", "Что нужно сделать?", "Свободное время сегодня", "Задачи на неделю"];

export default function Chat() {
  return (
    <div className="chat-shell">
      <header className="chat-header">
        <Brand compact />
        <strong>JRVX AI-чат</strong>
        <button type="button" className="text-button" onClick={() => navigate("/")}>В планировщик</button>
      </header>
      <div className="chat-layout">
        <aside className="chat-sidebar">
          <button type="button" className="button primary full-width">Новый диалог</button>
          <p className="eyebrow">ВАШИ ДИАЛОГИ</p>
          <p className="muted">История появится здесь.</p>
          <button type="button" className="side-link" onClick={() => navigate("/activity")}>История действий / Undo</button>
          <button type="button" className="side-link">Права JRVX AI</button>
          <button type="button" className="side-link">Подключение и настройки</button>
        </aside>
        <main className="chat-main">
          <div className="chat-hero">
            <p className="eyebrow">ВАШ ЛИЧНЫЙ ПОМОЩНИК</p>
            <h1>Чем займёмся, сэр?</h1>
            <p className="muted">Задайте вопрос, разберите материал по фотографии или поручите JRVX заботу о Ваших планах.</p>
            <div className="chip-list">{prompts.map((p) => <button type="button" className="chip" key={p}>{p}</button>)}</div>
          </div>
          <form className="chat-composer" onSubmit={(e) => e.preventDefault()}>
            <textarea aria-label="Сообщение JRVX AI" placeholder="Напишите JRVX…" rows="3" />
            <button className="button primary" type="submit">Отправить</button>
          </form>
          <p className="muted disclaimer">Ответы могут содержать ошибки. При отправке сообщения его контекст и вложения передаются OpenAI.</p>
        </main>
      </div>
    </div>
  );
}
