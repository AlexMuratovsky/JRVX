import React from "react";
import Brand from "./Brand.jsx";
import { navigate } from "../lib/navigation.js";

const nav = [
  ["/", "Сегодня"],
  ["/plans", "Планы"],
  ["/games", "Мини-игры"],
  ["/chat", "JRVX AI"],
  ["/notes", "Заметки"],
];

export default function AppShell({ children, pathname }) {
  return (
    <div className="planner-root">
      <header className="app-header">
        <div className="header-inner">
          <Brand />
          <nav className="main-nav" aria-label="Разделы JRVX">
            {nav.map(([path, label]) => (
              <button
                type="button"
                key={path}
                className={pathname === path ? "nav-item active" : "nav-item"}
                onClick={() => navigate(path)}
              >
                {label}
              </button>
            ))}
          </nav>
          <div className="header-tools">
            <button className="icon-button" type="button" onClick={() => navigate("/search")} aria-label="Поиск">⌕</button>
            <button className="icon-button" type="button" onClick={() => navigate("/reminders")} aria-label="Напоминания">◷</button>
          </div>
        </div>
      </header>
      <main className="workspace">{children}</main>
    </div>
  );
}
