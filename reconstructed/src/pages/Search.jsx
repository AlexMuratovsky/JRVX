import React from "react";
import StandalonePage from "../components/StandalonePage.jsx";

export default function Search() {
  return (
    <StandalonePage eyebrow="НИЧЕГО НЕ ПОТЕРЯЕТСЯ" title="Найти в JRVX">
      <form className="panel search-form" onSubmit={(e) => e.preventDefault()}>
        <input aria-label="Поисковый запрос" placeholder="Например, переливание крови" maxLength="180" required />
        <label className="permission-row">
          <span>Искать по смыслу</span>
          <input type="checkbox" />
        </label>
        <button className="button primary" type="submit">Найти</button>
      </form>
    </StandalonePage>
  );
}
