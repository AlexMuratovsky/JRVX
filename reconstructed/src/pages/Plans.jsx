import React, { useEffect, useMemo, useState } from "react";
import Panel from "../components/Panel.jsx";
import { plansApi } from "../lib/api/plans.js";
import { writesEnabled } from "../lib/api/client.js";

const fallbackCategories = ["Все категории", "Фильмы и сериалы", "Места", "Покупки", "Развлечения", "Учёба", "Личное", "Другое"];

function normalizePlans(payload) {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.plans)) return payload.plans;
  if (Array.isArray(payload?.items)) return payload.items;
  return [];
}

function normalizeCategories(payload) {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.categories)) return payload.categories;
  return fallbackCategories;
}

export default function Plans() {
  const [plans, setPlans] = useState([]);
  const [categories, setCategories] = useState(fallbackCategories);
  const [filter, setFilter] = useState("all");
  const [state, setState] = useState({ loading: true, error: "" });

  useEffect(() => {
    let cancelled = false;
    Promise.allSettled([plansApi.list(), plansApi.categories()]).then(([plansResult, categoriesResult]) => {
      if (cancelled) return;
      if (plansResult.status === "fulfilled") {
        setPlans(normalizePlans(plansResult.value));
      } else {
        setState({ loading: false, error: plansResult.reason?.message ?? "Не удалось загрузить планы." });
        return;
      }
      if (categoriesResult.status === "fulfilled") {
        setCategories(normalizeCategories(categoriesResult.value));
      }
      setState({ loading: false, error: "" });
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const visiblePlans = useMemo(() => plans.filter((plan) => {
    const done = Boolean(plan.completed ?? plan.done);
    if (filter === "active") return !done;
    if (filter === "done") return done;
    return true;
  }), [plans, filter]);

  return (
    <>
      <div className="page-heading">
        <div>
          <p className="eyebrow">ДЛЯ ТОГО, ЧТО ХОЧЕТСЯ</p>
          <h1>Мои планы<span className="heading-dot">.</span></h1>
          <p className="date-subtitle">Идеи, желания и маленькие приключения. Без обязательных сроков.</p>
        </div>
        <button type="button" className="button primary" disabled={!writesEnabled()} title={!writesEnabled() ? "Запись отключена до завершения проверки совместимости" : undefined}>
          Новый план
        </button>
      </div>
      <div className="filter-row">
        {[
          ["all", "Все"],
          ["active", "Активные"],
          ["done", "Выполненные"],
        ].map(([value, label]) => (
          <button type="button" onClick={() => setFilter(value)} className={filter === value ? "chip active" : "chip"} key={value}>{label}</button>
        ))}
      </div>
      <Panel title="Категории">
        <div className="chip-list">{categories.map((category) => {
          const label = typeof category === "string" ? category : category.label ?? category.name ?? category.id;
          return <span className="chip" key={typeof category === "string" ? category : category.id ?? label}>{label}</span>;
        })}</div>
      </Panel>

      {state.error && <div className="status-banner">{state.error}</div>}

      {visiblePlans.length ? (
        <div className="plan-grid">
          {visiblePlans.map((plan) => (
            <article className="plan-card" key={plan.id ?? plan.title}>
              <p className="eyebrow">{plan.category ?? "ПЛАН"}</p>
              <h2>{plan.title}</h2>
              {plan.description && <p>{plan.description}</p>}
              <small>{Boolean(plan.completed ?? plan.done) ? "Выполнено" : plan.date ?? "Без срока"}</small>
            </article>
          ))}
        </div>
      ) : (
        <div className="empty-state large">
          <strong>{state.loading ? "Загружаю планы…" : "Активных планов пока нет"}</strong>
          <span>Список читается через существующий API; записи пока намеренно отключены.</span>
        </div>
      )}
    </>
  );
}
