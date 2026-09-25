import React from "react";
import { navigate } from "../lib/navigation.js";

export default function StandalonePage({ eyebrow, title, description, children, backLabel = "← В JRVX" }) {
  return (
    <main className="standalone-page">
      <button type="button" className="text-button back-button" onClick={() => navigate("/")}>
        {backLabel}
      </button>
      {eyebrow && <p className="eyebrow">{eyebrow}</p>}
      <h1>{title}</h1>
      {description && <p className="muted lead">{description}</p>}
      {children}
    </main>
  );
}
