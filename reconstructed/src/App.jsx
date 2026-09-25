import React, { useEffect, useState } from "react";
import AppShell from "./components/AppShell.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import Plans from "./pages/Plans.jsx";
import Games from "./pages/Games.jsx";
import Notes from "./pages/Notes.jsx";
import Activity from "./pages/Activity.jsx";
import Search from "./pages/Search.jsx";
import Reminders from "./pages/Reminders.jsx";
import Chat from "./pages/Chat.jsx";

const pages = {
  "/": Dashboard,
  "/plans": Plans,
  "/games": Games,
  "/notes": Notes,
  "/activity": Activity,
  "/search": Search,
  "/reminders": Reminders,
  "/chat": Chat,
};

const standalone = new Set(["/notes", "/activity", "/search", "/reminders"]);

export default function App() {
  const [pathname, setPathname] = useState(window.location.pathname || "/");

  useEffect(() => {
    const onPopState = () => setPathname(window.location.pathname || "/");
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);

  const Page = pages[pathname] ?? Dashboard;

  if (pathname === "/chat") return <Page />;
  if (standalone.has(pathname)) return <Page />;

  return (
    <AppShell pathname={pathname}>
      <Page />
    </AppShell>
  );
}
