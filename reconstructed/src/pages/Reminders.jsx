import React from "react";
import StandalonePage from "../components/StandalonePage.jsx";

export default function Reminders() {
  return (
    <StandalonePage
      eyebrow="ВАЖНОЕ ВОВРЕМЯ"
      title="Напоминания"
      description="Появляются внутри JRVX при открытом приложении. Push на закрытый iPhone пока не подключён."
    >
      <div className="toolbar"><button type="button" className="button soft">Создать с JRVX AI</button></div>
      <form className="panel reminder-form" onSubmit={(e) => e.preventDefault()}>
        <input placeholder="О чём напомнить?" />
        <input type="datetime-local" aria-label="Когда" />
        <button type="submit" className="button primary">Добавить</button>
      </form>
    </StandalonePage>
  );
}
