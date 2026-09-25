export const routes = [
  { path: "/", label: "Сегодня" },
  { path: "/plans", label: "Планы" },
  { path: "/games", label: "Мини-игры" },
  { path: "/chat", label: "JRVX AI" },
  { path: "/notes", label: "Заметки" },
  { path: "/activity", label: "История / Undo" },
  { path: "/search", label: "Поиск" },
  { path: "/reminders", label: "Напоминания" },
];

export function navigate(path) {
  if (window.location.pathname === path) return;
  window.history.pushState({}, "", path);
  window.dispatchEvent(new PopStateEvent("popstate"));
}
