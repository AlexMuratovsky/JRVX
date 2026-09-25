import React from "react";
import Panel from "../components/Panel.jsx";

const categories = ["Все категории", "Фильмы и сериалы", "Места", "Покупки", "Развлечения", "Учёба", "Личное", "Другое"];

export default function Plans() {
  return (
    <>
      <div className="page-heading">
        <div>
          <p className="eyebrow">ДЛЯ ТОГО, ЧТО ХОЧЕТСЯ</p>
          <h1>Мои планы<span className="heading-dot">.</span></h1>
          <p className="date-subtitle">Идеи, желания и маленькие приключения. Без обязательных сроков.</p>
        </div>
        <button type="button" className="button primary">Новый план</button>
      </div>
      <div className="filter-row">
        {["Все", "Активные", "Выполненные"].map((x, i) => <button type="button" className={i === 0 ? "chip active" : "chip"} key={x}>{x}</button>)}
      </div>
      <Panel title="Категории">
        <div className="chip-list">{categories.map((x) => <button type="button" className="chip" key={x}>{x}</button>)}</div>
      </Panel>
      <div className="empty-state large">
        <strong>Планы подключим к существующим данным</strong>
        <span>UI восстановлен отдельно от backend, чтобы не рисковать текущими пользователями.</span>
      </div>
    </>
  );
}
