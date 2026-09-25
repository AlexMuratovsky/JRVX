import React from "react";
import StandalonePage from "../components/StandalonePage.jsx";

export default function Activity() {
  return (
    <StandalonePage
      eyebrow="ЦЕНТР АКТИВНОСТИ"
      title="История действий."
      description="Все изменения планов с момента включения журнала. Undo доступен, пока записи не изменились снова."
    >
      <div className="empty-state large">
        <strong>Здесь появятся Ваши изменения.</strong>
        <span>История будет подключена через текущий backend без изменения существующих записей.</span>
      </div>
    </StandalonePage>
  );
}
