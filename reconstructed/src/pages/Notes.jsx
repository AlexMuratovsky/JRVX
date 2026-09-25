import React from "react";
import StandalonePage from "../components/StandalonePage.jsx";

export default function Notes() {
  return (
    <StandalonePage eyebrow="МЫСЛИ И МАТЕРИАЛЫ" title="Заметки.">
      <div className="toolbar"><button type="button" className="button primary">Добавить</button></div>
      <div className="empty-state large">
        <strong>Здесь появятся Ваши заметки.</strong>
        <span>Перед подключением данных JRVX сохранит совместимость с текущим часовым поясом и хранилищем.</span>
      </div>
    </StandalonePage>
  );
}
